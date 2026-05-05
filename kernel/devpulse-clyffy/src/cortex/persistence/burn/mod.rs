//! # `cortex::persistence::burn` — RRO encoder authored in Burn
//!
//! Burn is the **locked authorship target** for the RRO encoder per
//! `scripts/docs/specs/cortex/rro/RRO.md` v2.0.0 §4.3. The encoder is
//! the embedder forward pass: text → 1024-dim dense vector via Qwen3
//! transformer → last-token pool → L2 normalize.
//!
//! This module owns:
//! - [`qwen3`] — real Qwen3 transformer architecture (28 layers, GQA
//!   2:1, RoPE, RMSNorm, SwiGLU MLP). Random-init weights in Phase A.
//! - [`embedder`] — pipeline glue: pool + normalize on top of the
//!   transformer's `[B, S, H]` output.
//!
//! ## Backends
//!
//! Two feature flags pick the backend at compile time:
//!
//! | Feature      | Burn backend             | When                  |
//! |--------------|--------------------------|-----------------------|
//! | `burn-cpu`   | `burn::backend::NdArray` | Tests, CI, no-GPU dev |
//! | `burn-cuda`  | `burn::backend::Cuda`    | Runtime on CUDA hosts |
//!
//! Both can be on simultaneously — the consumer picks the type
//! parameter. Tests below run under `burn-cpu` to stay dep-free.
//!
//! ## Phase boundaries (this slice = Phase A)
//!
//! - **Phase A** *(this file)* — architecture authored, forward pass
//!   on random-init weights, three behavioural tests on `NdArray`.
//! - **Phase B** — Harrier 0.6B SafeTensors → Burn record loader.
//! - **Phase C** — HF tokenizers crate wiring + real-text embed test.
//! - **Phase D** — BM25 sparse pass alongside dense.
//! - **Phase E** — ArcSwap hot-reload protocol per spec §4.3.
//! - **Phase F** — 13-crate `rro-*` workspace split per spec §8.
//!
//! Each phase is gated to its own plan
//! (`~/.claude/plans/boring-burn-foundation.md` §8 Phase B–F).

#![cfg(any(feature = "burn-cpu", feature = "burn-cuda"))]

pub mod embedder;
pub mod qwen3;

pub use embedder::{l2_normalize, pool_last_token, BurnEmbedder, EmbedderConfig};
pub use qwen3::{Qwen3Config, Qwen3Model};

// ═══════════════════════════════════════════════════════════════════════
// Tests — under `burn-cpu` so CI runs without a GPU host.
// ═══════════════════════════════════════════════════════════════════════

#[cfg(all(test, feature = "burn-cpu"))]
#[allow(clippy::unwrap_used, clippy::expect_used)]
mod tests {
    use super::*;
    use burn::backend::NdArray;
    use burn::tensor::{Int, Tensor, TensorData};

    type B = NdArray;

    /// Tiny Qwen3 config so the test runs in milliseconds. Same shape
    /// pattern as Harrier (28 layers, 2:1 GQA), reduced dimensions.
    fn tiny_config() -> Qwen3Config {
        let mut cfg = Qwen3Config::new();
        cfg.vocab_size = 64;
        cfg.hidden_size = 32;
        cfg.num_hidden_layers = 2;
        cfg.num_attention_heads = 4;
        cfg.num_key_value_heads = 2; // 2:1 GQA, like Harrier
        cfg.head_dim = 8; // 4 * 8 = 32 = hidden_size
        cfg.intermediate_size = 64;
        cfg.max_position_embeddings = 32;
        cfg
    }

    #[test]
    fn qwen3_forward_pass_shape_and_finiteness() {
        let device = Default::default();
        let cfg = tiny_config();
        let model = Qwen3Model::<B>::new(&cfg, &device);

        let batch = 2;
        let seq = 8;
        // Token ids in [0, vocab_size); attention mask all-ones.
        let token_data: Vec<i64> = (0..(batch * seq)).map(|i| (i % cfg.vocab_size) as i64).collect();
        let token_ids: Tensor<B, 2, Int> =
            Tensor::from_data(TensorData::new(token_data, [batch, seq]), &device);
        let mask_data: Vec<i64> = vec![1; batch * seq];
        let mask: Tensor<B, 2, Int> =
            Tensor::from_data(TensorData::new(mask_data, [batch, seq]), &device);

        let out = model.forward(token_ids, mask);
        assert_eq!(out.dims(), [batch, seq, cfg.hidden_size]);

        let raw: Vec<f32> = out.to_data().to_vec().unwrap();
        for (i, v) in raw.iter().enumerate() {
            assert!(v.is_finite(), "hidden[{i}] must be finite, got {v}");
        }
    }

    #[test]
    fn embedder_pooled_output_is_unit_normalized() {
        let device = Default::default();
        let mut emb_cfg = EmbedderConfig::new(tiny_config());
        emb_cfg.normalize = true;
        let model = BurnEmbedder::<B>::new(&emb_cfg, &device);

        let batch = 2;
        let seq = 5;
        let token_data: Vec<i64> = (0..(batch * seq))
            .map(|i| (i % emb_cfg.model.vocab_size) as i64)
            .collect();
        let token_ids: Tensor<B, 2, Int> =
            Tensor::from_data(TensorData::new(token_data, [batch, seq]), &device);
        // Mask: row 0 has 5 real tokens, row 1 has 3 real + 2 pad.
        let mask_data: Vec<i64> = vec![1, 1, 1, 1, 1, 1, 1, 1, 0, 0];
        let mask: Tensor<B, 2, Int> =
            Tensor::from_data(TensorData::new(mask_data, [batch, seq]), &device);

        let pooled = model.forward_pooled(token_ids, mask);
        assert_eq!(pooled.dims(), [batch, emb_cfg.model.hidden_size]);

        // Each row's L2 norm must be ≈ 1.0.
        let raw: Vec<f32> = pooled.to_data().to_vec().unwrap();
        for b in 0..batch {
            let row = &raw[b * emb_cfg.model.hidden_size..(b + 1) * emb_cfg.model.hidden_size];
            let norm = row.iter().map(|x| x * x).sum::<f32>().sqrt();
            assert!(
                (norm - 1.0).abs() < 1.0e-4,
                "row {b}: L2 norm = {norm}, expected ≈ 1.0"
            );
        }
    }

    /// Direct test of `pool_last_token`: build a known hidden tensor,
    /// pool with a known mask, assert the pooled row equals the hidden
    /// state at the last unmasked position.
    #[test]
    fn last_token_pool_picks_correct_unmasked_position() {
        let device = Default::default();

        // Hidden: [batch=1, seq=4, hidden=3]. Each position has a
        // distinct signature so the pool's choice is unambiguous.
        // Position 0: [10, 11, 12]
        // Position 1: [20, 21, 22]
        // Position 2: [30, 31, 32]   ← last unmasked
        // Position 3: [40, 41, 42]   ← masked (pad)
        let hidden_data = vec![
            10.0_f32, 11.0, 12.0,
            20.0, 21.0, 22.0,
            30.0, 31.0, 32.0,
            40.0, 41.0, 42.0,
        ];
        let hidden: Tensor<B, 3> =
            Tensor::from_data(TensorData::new(hidden_data, [1, 4, 3]), &device);

        let mask: Tensor<B, 2, Int> =
            Tensor::from_data(TensorData::new(vec![1_i64, 1, 1, 0], [1, 4]), &device);

        let pooled = pool_last_token(hidden, mask);
        assert_eq!(pooled.dims(), [1, 3]);

        let raw: Vec<f32> = pooled.to_data().to_vec().unwrap();
        let expected = [30.0_f32, 31.0, 32.0];
        for (i, (got, want)) in raw.iter().zip(expected.iter()).enumerate() {
            assert!(
                (got - want).abs() < 1.0e-5,
                "pooled[{i}] = {got}, expected {want} (last unmasked position)"
            );
        }
    }
}
