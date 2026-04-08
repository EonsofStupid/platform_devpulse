//! Model priming — warmup passes to ensure instant first-token latency.
//!
//! # Why Priming Matters
//!
//! Even after weights are in VRAM, the first inference is slow because:
//! 1. **KV cache allocation** — Memory must be reserved
//! 2. **CUDA kernel JIT** — First kernel launch triggers compilation
//! 3. **GPU cache population** — L2/texture caches are cold
//! 4. **Memory coalescing** — First access patterns aren't optimized
//!
//! Priming runs dummy forward passes to warm everything up.
//! After priming, first real inference is as fast as subsequent ones.

use crate::traits::{InferenceBackend, LoaderError};
use crate::loading::states::PrimingConfig;
use std::time::Instant;
use tracing::{debug, info, instrument, warn};

/// Result of a priming operation.
#[derive(Debug, Clone)]
pub struct PrimingResult {
    /// Time spent priming (ms).
    pub duration_ms: u64,
    /// KV cache capacity allocated.
    pub kv_cache_capacity: usize,
    /// KV cache memory in bytes.
    pub kv_cache_bytes: u64,
    /// Whether CUDA graphs were captured.
    pub cuda_graphs_captured: bool,
    /// Warmup tokens per second (baseline perf).
    pub warmup_tps: f32,
}

/// Priming operations for loaded models.
pub struct ModelPrimer<B: InferenceBackend> {
    backend: B,
    config: PrimingConfig,
}

impl<B: InferenceBackend + PrimingBackend> ModelPrimer<B> {
    /// Create a new primer with the given backend and config.
    pub fn new(backend: B, config: PrimingConfig) -> Self {
        Self { backend, config }
    }

    /// Prime a loaded model to achieve instant inference latency.
    ///
    /// # Steps
    /// 1. Allocate KV cache for expected context length
    /// 2. Run dummy forward passes to warm GPU caches
    /// 3. (Optional) Capture CUDA graphs for fixed-size inference
    /// 4. Reset KV cache state (keep allocation)
    ///
    /// # Returns
    /// `PrimingResult` with timing and capacity info, or error.
    #[instrument(skip(self), fields(slot_id = %slot_id))]
    pub async fn prime_model(
        &mut self,
        slot_id: &str,
        context_length: usize,
    ) -> Result<PrimingResult, LoaderError> {
        let start = Instant::now();
        info!("Priming model in slot {slot_id}");

        // Step 1: Allocate KV cache
        debug!("Allocating KV cache for context length {context_length}");
        let kv_info = self.backend.allocate_kv_cache(slot_id, context_length).await?;
        
        // Step 2: Run warmup forward passes
        debug!(
            "Running {} warmup iterations with seq_len={}",
            self.config.warmup_iterations, self.config.warmup_seq_len
        );
        
        let warmup_start = Instant::now();
        let mut total_tokens = 0u64;
        
        for i in 0..self.config.warmup_iterations {
            // Create dummy input (BOS token + padding)
            let dummy_tokens: Vec<u32> = vec![1; self.config.warmup_seq_len];
            
            // Run forward pass via PrimingBackend (discard output)
            let _output = PrimingBackend::forward(&mut self.backend, slot_id, &dummy_tokens).await?;
            total_tokens += dummy_tokens.len() as u64;
            
            // Reset KV cache between iterations to avoid state accumulation
            if i < self.config.warmup_iterations - 1 {
                self.backend.reset_kv_cache(slot_id).await?;
            }
        }
        
        let warmup_duration = warmup_start.elapsed();
        let warmup_tps = total_tokens as f32 / warmup_duration.as_secs_f32();
        debug!("Warmup complete: {total_tokens} tokens in {:?} ({warmup_tps:.1} t/s)", warmup_duration);

        // Step 3: (Optional) Capture CUDA graphs
        let cuda_graphs_captured = if self.config.capture_cuda_graphs {
            debug!("Capturing CUDA graphs for batch sizes: {:?}", self.config.cuda_graph_batch_sizes);
            match self.backend.capture_cuda_graphs(
                slot_id,
                &self.config.cuda_graph_batch_sizes,
            ).await {
                Ok(()) => {
                    info!("CUDA graphs captured successfully");
                    true
                }
                Err(e) => {
                    warn!("CUDA graph capture failed (non-fatal): {e}");
                    false
                }
            }
        } else {
            false
        };

        // Step 4: Reset KV cache state but keep allocation
        self.backend.reset_kv_cache(slot_id).await?;

        let duration_ms = start.elapsed().as_millis() as u64;
        info!("Model primed in {duration_ms}ms (KV cache: {} MB)", kv_info.size_bytes / (1024 * 1024));

        Ok(PrimingResult {
            duration_ms,
            kv_cache_capacity: kv_info.capacity,
            kv_cache_bytes: kv_info.size_bytes,
            cuda_graphs_captured,
            warmup_tps,
        })
    }

    /// Demote a primed model back to loaded state (free KV cache, keep weights).
    /// Useful when memory pressure requires freeing resources.
    #[instrument(skip(self), fields(slot_id = %slot_id))]
    pub async fn demote_to_loaded(&mut self, slot_id: &str) -> Result<(), LoaderError> {
        info!("Demoting model in slot {slot_id} from Primed to Loaded");
        
        // Free KV cache
        self.backend.free_kv_cache(slot_id).await?;
        
        // Release CUDA graphs if captured
        if let Err(e) = self.backend.release_cuda_graphs(slot_id).await {
            warn!("Failed to release CUDA graphs: {e}");
        }
        
        Ok(())
    }
}

/// KV cache allocation info returned by backend.
#[derive(Debug, Clone)]
pub struct KvCacheInfo {
    /// Max number of tokens the cache can hold.
    pub capacity: usize,
    /// Memory consumed by the cache in bytes.
    pub size_bytes: u64,
}

/// Extension trait for inference backends to support priming.
#[allow(async_fn_in_trait)]
pub trait PrimingBackend: InferenceBackend {
    /// Allocate KV cache for the given context length.
    async fn allocate_kv_cache(
        &mut self,
        slot_id: &str,
        context_length: usize,
    ) -> Result<KvCacheInfo, LoaderError>;

    /// Run a forward pass (used for warmup).
    async fn forward(&mut self, slot_id: &str, tokens: &[u32]) -> Result<Vec<f32>, LoaderError>;

    /// Reset KV cache state (clear content, keep allocation).
    async fn reset_kv_cache(&mut self, slot_id: &str) -> Result<(), LoaderError>;

    /// Free KV cache allocation entirely.
    async fn free_kv_cache(&mut self, slot_id: &str) -> Result<(), LoaderError>;

    /// Capture CUDA graphs for the given batch sizes.
    async fn capture_cuda_graphs(
        &mut self,
        slot_id: &str,
        batch_sizes: &[usize],
    ) -> Result<(), LoaderError>;

    /// Release captured CUDA graphs.
    async fn release_cuda_graphs(&mut self, slot_id: &str) -> Result<(), LoaderError>;
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_priming_config_defaults() {
        let config = PrimingConfig::default();
        assert_eq!(config.warmup_seq_len, 16);
        assert_eq!(config.warmup_iterations, 2);
        assert!(!config.capture_cuda_graphs);
    }
}
