//! Text tokenization bridge for the Burn embedder — Phase C.
//!
//! Loads a HuggingFace Fast Tokenizer (`tokenizer.json`) from the same
//! directory as the model weights and converts `&str` slices into
//! Burn `Tensor<B, 2, Int>` batches suitable for
//! `BurnEmbedder::forward_pooled`.

use std::path::Path;
use std::sync::Arc;

use burn::prelude::Backend;
use burn::tensor::{Int, Tensor, TensorData};
use tokenizers::Tokenizer;

/// Maximum token count the embedder accepts per text. Harrier supports
/// 32768 but RRO chunks are far shorter; capping prevents accidental
/// RAM spikes on very long inputs.
const MAX_SEQ_LEN: usize = 8_192;

/// Padding token id for Qwen3 / Harrier (`<|endoftext|>`).
/// Sequences shorter than the batch maximum are right-padded with
/// this id; the corresponding attention-mask entry is 0.
const PAD_TOKEN_ID: i64 = 151_643;

/// Load a HuggingFace Fast Tokenizer from `tokenizer.json` in
/// `model_dir`. The returned `Arc<Tokenizer>` is stored in the
/// `CortexBurnAdapter` slot alongside the live encoder — both are
/// released together on unload.
pub fn load_tokenizer(model_dir: &Path) -> anyhow::Result<Arc<Tokenizer>> {
    let path = model_dir.join("tokenizer.json");
    let tok = Tokenizer::from_file(&path)
        .map_err(|e| anyhow::anyhow!("tokenizer load failed ({}): {e}", path.display()))?;
    Ok(Arc::new(tok))
}

/// Tokenize `texts` into right-padded `(token_ids, attention_mask)` tensors.
///
/// - Output shape: `[B, S]` Int where `B = texts.len()`, `S ≤ MAX_SEQ_LEN`.
/// - Short sequences are right-padded to `S` with [`PAD_TOKEN_ID`]; mask = 0.
/// - Long sequences are truncated at [`MAX_SEQ_LEN`].
///
/// Returns `Err` if `texts` is empty or the tokenizer call fails.
pub fn encode_texts<B: Backend>(
    tokenizer: &Tokenizer,
    texts: &[&str],
    device: &B::Device,
) -> anyhow::Result<(Tensor<B, 2, Int>, Tensor<B, 2, Int>)> {
    let batch = texts.len();
    anyhow::ensure!(batch > 0, "encode_texts: text slice must be non-empty");

    let encodings = tokenizer
        .encode_batch(texts.to_vec(), true)
        .map_err(|e| anyhow::anyhow!("encode_batch failed: {e}"))?;

    // Padded length = max sequence length in this batch, capped at MAX_SEQ_LEN.
    let padded_len = encodings
        .iter()
        .map(|e| e.get_ids().len().min(MAX_SEQ_LEN))
        .max()
        .unwrap_or(1);

    let mut ids_flat: Vec<i64> = Vec::with_capacity(batch * padded_len);
    let mut mask_flat: Vec<i64> = Vec::with_capacity(batch * padded_len);

    for enc in &encodings {
        let raw_ids = enc.get_ids();
        let raw_mask = enc.get_attention_mask();
        let actual = raw_ids.len().min(MAX_SEQ_LEN);

        for i in 0..padded_len {
            if i < actual {
                ids_flat.push(raw_ids[i] as i64);
                mask_flat.push(raw_mask[i] as i64);
            } else {
                ids_flat.push(PAD_TOKEN_ID);
                mask_flat.push(0);
            }
        }
    }

    let token_ids = Tensor::from_data(TensorData::new(ids_flat, [batch, padded_len]), device);
    let attention_mask =
        Tensor::from_data(TensorData::new(mask_flat, [batch, padded_len]), device);

    Ok((token_ids, attention_mask))
}
