//! # `cortex::persistence::burn` — RRO encoder authored in Burn
//!
//! Burn is the **locked authorship target** for the RRO encoder per
//! `scripts/docs/specs/cortex/rro/RRO.md` v2.0.0 §4.3. The encoder is
//! the embedder forward pass: text → 1024-dim dense vector via Qwen3
//! transformer → last-token pool → L2 normalize.
//!
//! This module owns:
//! - [`qwen3`] — real Qwen3 transformer architecture (28 layers, GQA
//!   2:1, `RoPE`, `RMSNorm`, `SwiGLU` MLP). Random-init weights in Phase A.
//! - [`embedder`] — pipeline glue: pool + normalize on top of the
//!   transformer's `[B, S, H]` output.
//!
//! ## Backends
//!
//! Two feature flags pick the backend at compile time:
//!
//! | Feature      | Burn backend           | `DType` selection     | When                  |
//! |--------------|------------------------|------------------------|-----------------------|
//! | `burn-cpu`   | `burn::backend::Flex`  | runtime via `DType` enum | Tests, CI, no-GPU dev |
//! | `burn-cuda`  | `burn::backend::Cuda`  | generic `Cuda<bf16>`   | Runtime on CUDA hosts |
//!
//! Both can be on simultaneously — the consumer picks the type
//! parameter. Tests below run under `burn-cpu` to stay dep-free.
//!
//! Flex is Burn 0.21's new default CPU backend (PR #4761) — its `E`/`I`
//! generic params are PHANTOM, so bf16 storage isn't selected via the
//! type. The platform sets `FloatDType::BF16` + `IntDType::I64` once at
//! boot via `burn::tensor::set_default_dtypes`; every `Tensor::from_data`
//! after that narrows into bf16 at the boundary. `NdArray` was the prior
//! CPU choice but Burn 0.21 only impls `FloatNdArrayElement` for f32/f64,
//! so `NdArray<bf16>` is rejected at compile time.
//!
//! ## Phase boundaries (this slice = Phase A)
//!
//! - **Phase A** *(this file)* — architecture authored, forward pass
//!   on random-init weights, three behavioural tests on `NdArray`.
//! - **Phase B** — Harrier 0.6B `SafeTensors` → Burn record loader.
//! - **Phase C** — HF tokenizers crate wiring + real-text embed test.
//! - **Phase D** — BM25 sparse pass alongside dense.
//! - **Phase E** — `ArcSwap` hot-reload protocol per spec §4.3.
//! - **Phase F** — 13-crate `rro-*` workspace split per spec §8.
//!
//! Each phase is gated to its own plan
//! (`~/.claude/plans/boring-burn-foundation.md` §8 Phase B–F).

#![cfg(any(feature = "burn-cpu", feature = "burn-cuda"))]

pub mod adapter;
pub mod embedder;
pub mod embedder_impl;
pub mod hot_update;
pub mod loader;
pub mod qwen3;
pub mod tokenizer;

pub use adapter::CortexBurnAdapter;
pub use embedder::{l2_normalize, pool_last_token, BurnEmbedder, EmbedderConfig};
pub use hot_update::{BurnEmbedderSnapshot, BurnEmbedderSource};
pub use loader::{load_qwen3_from_safetensors, LoaderError};
pub use qwen3::{Qwen3Config, Qwen3Model};

// ═══════════════════════════════════════════════════════════════════════
// Backend pins
// ═══════════════════════════════════════════════════════════════════════
//
// The RRO encoder runs in `bf16` storage. On-disk safetensors are bf16
// (Harrier 0.6B); the loader widens to f32 in `loader.rs` and Burn
// narrows back to bf16 inside `Tensor::from_data` via `convert_dtype`
// once the device's default float dtype has been set to `BF16`.
//
// The two backends select bf16 via DIFFERENT mechanisms in Burn 0.21:
//
//   * `Flex` (CPU) — generic params are phantom; bf16 is picked at
//     runtime via `set_default_dtypes(FloatDType::BF16, …)` called once
//     at boot. Kernels lower bf16 storage to f32 compute via up/down-cast
//     on each op (storage win, not compute win — acceptable on the
//     embedder forward pass which already amortizes over the batch).
//   * `Cuda<bf16>` — generic param IS the storage type; bf16 compute is
//     native on Ampere+ (sm_80). Pre-Ampere falls back to CuBLAS f32 with
//     identical numerics but reduced throughput.
//
// Zero-narrowing native-bf16 load (skip the f32 widen in `loader.rs`) is
// a future tuning pass — out of scope for this slice.

/// CPU backend pin: `Flex`. The Burn 0.21 default CPU backend (PR #4761).
/// Storage dtype is picked at boot via `set_default_dtypes` — see the
/// header comment for why this is a runtime decision rather than a type
/// generic. Memory footprint = `params * 2 bytes` once `FloatDType::BF16`
/// is wired (vs `* 4` for f32).
#[cfg(feature = "burn-cpu")]
pub type EmbedderCpuBackend = burn::backend::Flex;

/// CUDA backend pin: `Cuda<bf16>`. bf16 storage + bf16 native compute on
/// Ampere+ (sm_80 and above). Pre-Ampere hosts fall back via CuBLAS f32
/// internally — correctness identical, perf parity drops.
#[cfg(feature = "burn-cuda")]
pub type EmbedderCudaBackend = burn::backend::Cuda<burn::tensor::bf16>;

// ═══════════════════════════════════════════════════════════════════════
// Hot-update contract — compile-time bounds per backend
// ═══════════════════════════════════════════════════════════════════════
//
// Per HOT_UPDATE_PATTERN.md §7.1 / H6: Burn's `Module` supertrait set is
// `Clone + Send + Debug` (verified against Burn 0.20.1, NOT main). `Sync`
// and `'static` are NOT in the bound set. ArcSwap requires `Send + Sync`
// for the inner type, so we encode the constraint at the assertion site
// per backend rather than discovering it at the first concurrent reader.
//
// `'static` is implied by the absence of non-static lifetime parameters
// on `BurnEmbedder<B>` and is exercised at compile time by the ArcSwap
// round-trip test below (ArcSwap's bounds reject non-`'static` types).
//
// HOT_UPDATE_PATTERN.md §12 verification targets 1 and 2.

// Granular tensor-level check — narrows the failure surface. If a
// future Burn version drops `Sync` on `Tensor<EmbedderCpuBackend, 2>`,
// this fires before the wider `BurnEmbedder<EmbedderCpuBackend>`
// assertion below, and the compile error points at the primitive
// instead of the wrapping struct.
#[cfg(feature = "burn-cpu")]
static_assertions::assert_impl_all!(burn::tensor::Tensor<EmbedderCpuBackend, 2>: Send, Sync);

#[cfg(feature = "burn-cpu")]
static_assertions::assert_impl_all!(BurnEmbedder<EmbedderCpuBackend>: Send, Sync);

#[cfg(feature = "burn-cuda")]
static_assertions::assert_impl_all!(BurnEmbedder<EmbedderCudaBackend>: Send, Sync);

// HOT_UPDATE_PATTERN.md §12 verification target 4 — BurnEmbedder<B>
// implements HotUpdateable for every backend the file admits. If a
// future backend's Device drops `Send + Sync + 'static`, the impl
// stops applying and this assertion fails at compile time instead of
// at first daemon attach.
#[cfg(feature = "burn-cpu")]
static_assertions::assert_impl_all!(BurnEmbedder<EmbedderCpuBackend>: rrd::HotUpdateable);

#[cfg(feature = "burn-cuda")]
static_assertions::assert_impl_all!(BurnEmbedder<EmbedderCudaBackend>: rrd::HotUpdateable);

// ═══════════════════════════════════════════════════════════════════════
// Tests — under `burn-cpu` so CI runs without a GPU host.
// ═══════════════════════════════════════════════════════════════════════

#[cfg(all(test, feature = "burn-cpu"))]
#[allow(clippy::unwrap_used, clippy::expect_used)]
mod tests {
    use super::*;
    use burn::tensor::{Int, Tensor, TensorData};

    // Tests pin the same backend as production boot: `NdArray<bf16>` via
    // `EmbedderCpuBackend`. Catches dtype regressions at the test layer
    // (e.g. a future loader path that emits Vec<f32> against a bf16
    // backend in a way Burn refuses to narrow).
    type B = EmbedderCpuBackend;

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
        let token_data: Vec<i64> = (0..(batch * seq))
            .map(|i| (i % cfg.vocab_size) as i64)
            .collect();
        let token_ids: Tensor<B, 2, Int> =
            Tensor::from_data(TensorData::new(token_data, [batch, seq]), &device);
        let mask_data: Vec<i64> = vec![1; batch * seq];
        let mask: Tensor<B, 2, Int> =
            Tensor::from_data(TensorData::new(mask_data, [batch, seq]), &device);

        let out = model.forward(token_ids, &mask);
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

    /// Cover the `HotUpdateable::validate` smoke-test surface against
    /// a random-init embedder. Real safetensors-loaded weights would
    /// also pass; the goal here is to catch a regression where
    /// `validate` itself reports failure on legitimate output (e.g.
    /// a future change to `forward_pooled` that breaks the pool dim).
    #[test]
    fn hot_updateable_validate_accepts_random_init() {
        let device = Default::default();
        let cfg = EmbedderConfig::new(tiny_config());
        let emb = BurnEmbedder::<B>::new(&cfg, &device);
        let snap = hot_update::BurnEmbedderSnapshot::wrap_for_test(emb);

        // The trait method is async — block_on a fresh runtime so we
        // don't pull tokio into this test's surface.
        let runtime = tokio::runtime::Builder::new_current_thread()
            .build()
            .unwrap();
        let result = runtime.block_on(<BurnEmbedder<B> as rrd::HotUpdateable>::validate(&snap));
        assert!(
            result.is_ok(),
            "validate must accept random-init: {result:?}"
        );
    }

    /// Round-trip the embedder through `ArcSwap` to validate the §4.1
    /// hot-update primitive against real `BurnEmbedder<NdArray>` state.
    ///
    /// Three properties asserted:
    ///
    /// 1. `swap()` returns the previously-stored `Arc` (so the
    ///    maintenance task owns the Drop, per H4 — slow-Drop never hits
    ///    a reader thread).
    /// 2. `load_full()` after a swap returns the new `Arc` identity
    ///    (atomicity — no torn read where load returns half-old state).
    /// 3. The whole sequence compiles, which implicitly proves
    ///    `BurnEmbedder<NdArray>: Send + Sync + 'static` (ArcSwap's
    ///    bounds on the inner type would reject otherwise).
    ///
    /// HOT_UPDATE_PATTERN.md §12 verification target 3.
    #[test]
    fn arcswap_round_trip_preserves_identity_through_swap() {
        use arc_swap::ArcSwap;
        use std::sync::Arc;

        let device = Default::default();
        let cfg = EmbedderConfig::new(tiny_config());
        let a = Arc::new(BurnEmbedder::<B>::new(&cfg, &device));
        let b = Arc::new(BurnEmbedder::<B>::new(&cfg, &device));

        let slot = ArcSwap::from(a.clone());

        let loaded = slot.load_full();
        assert!(
            Arc::ptr_eq(&loaded, &a),
            "load_full() must return the originally-stored Arc identity"
        );
        drop(loaded);

        let prev = slot.swap(b.clone());
        assert!(
            Arc::ptr_eq(&prev, &a),
            "swap() must return the previously-stored Arc — that's how the \
             maintenance task owns the Drop instead of a reader thread (H4)"
        );

        let loaded = slot.load_full();
        assert!(
            Arc::ptr_eq(&loaded, &b),
            "load_full() after swap must return the new Arc identity"
        );
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
            10.0_f32, 11.0, 12.0, 20.0, 21.0, 22.0, 30.0, 31.0, 32.0, 40.0, 41.0, 42.0,
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
