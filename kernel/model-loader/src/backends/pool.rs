//! Backend pool — shared model instances with reference counting.
//!
//! When two slots point to the same model, only one instance is loaded.
//! The pool tracks references and only unloads when all refs are released.

use crate::backends::bridge::{InferenceBridge, InferenceHandle};
use crate::loading::states::{LoadParams, MemoryFootprint};
use std::collections::HashMap;
use std::path::PathBuf;

/// A shared model instance in the pool.
struct PooledInstance {
    /// Handle to the inference bridge (clone to hand out).
    handle: InferenceHandle,
    /// The bridge itself (owns the thread).
    _bridge: InferenceBridge,
    /// Number of slots referencing this instance.
    ref_count: usize,
    /// Memory consumed by this instance.
    memory: MemoryFootprint,
    /// Path to the model file (for identity — used in hot-swap).
    #[allow(dead_code)]
    model_path: PathBuf,
}

/// Manages shared model instances across slots.
pub struct BackendPool {
    /// model_id → pooled instance.
    instances: HashMap<String, PooledInstance>,
}

impl BackendPool {
    /// Create an empty backend pool.
    #[must_use]
    pub fn new() -> Self {
        Self {
            instances: HashMap::new(),
        }
    }

    /// Load a model and return a handle. If already loaded, bump ref count.
    #[cfg(feature = "candle-backend")]
    pub async fn acquire(
        &mut self,
        model_id: &str,
        model_path: &PathBuf,
        params: LoadParams,
    ) -> anyhow::Result<(InferenceHandle, MemoryFootprint)> {
        // Check if already loaded (shared instance)
        if let Some(instance) = self.instances.get_mut(model_id) {
            instance.ref_count += 1;
            tracing::info!(
                model = %model_id,
                ref_count = instance.ref_count,
                "Shared instance — bumped ref count"
            );
            return Ok((instance.handle.clone(), instance.memory));
        }

        // New instance needed — spawn bridge
        let device = if params.device == "cpu" {
            candle_core::Device::Cpu
        } else {
            #[cfg(feature = "cuda")]
            {
                candle_core::Device::new_cuda(0)?
            }
            #[cfg(not(feature = "cuda"))]
            candle_core::Device::Cpu
        };

        let bridge = InferenceBridge::spawn_candle(device)?;
        let handle = bridge.handle();

        // Load the model via the bridge
        let memory = handle.load(model_path.clone(), params).await?;

        let pooled = PooledInstance {
            handle: handle.clone(),
            _bridge: bridge,
            ref_count: 1,
            memory,
            model_path: model_path.clone(),
        };

        self.instances.insert(model_id.to_string(), pooled);
        tracing::info!(model = %model_id, "New model instance loaded into pool");

        Ok((handle, memory))
    }

    /// Release a reference. Unloads only when ref_count reaches 0.
    pub async fn release(&mut self, model_id: &str) -> Option<MemoryFootprint> {
        let should_remove = if let Some(instance) = self.instances.get_mut(model_id) {
            instance.ref_count = instance.ref_count.saturating_sub(1);
            tracing::info!(
                model = %model_id,
                ref_count = instance.ref_count,
                "Released model reference"
            );
            instance.ref_count == 0
        } else {
            false
        };

        if should_remove {
            if let Some(instance) = self.instances.remove(model_id) {
                tracing::info!(model = %model_id, "All references released — unloading from pool");
                instance.handle.shutdown().await;
                return Some(instance.memory);
            }
        }

        None
    }

    /// Get a handle for a loaded model, if it exists.
    #[must_use]
    pub fn get_handle(&self, model_id: &str) -> Option<InferenceHandle> {
        self.instances.get(model_id).map(|i| i.handle.clone())
    }

    /// Check if a model is loaded in the pool.
    #[must_use]
    pub fn is_loaded(&self, model_id: &str) -> bool {
        self.instances.contains_key(model_id)
    }

    /// Get reference count for a model.
    #[must_use]
    pub fn ref_count(&self, model_id: &str) -> usize {
        self.instances.get(model_id).map(|i| i.ref_count).unwrap_or(0)
    }

    /// Memory footprint of a loaded model.
    #[must_use]
    pub fn memory(&self, model_id: &str) -> Option<MemoryFootprint> {
        self.instances.get(model_id).map(|i| i.memory)
    }

    /// Total memory used by all loaded models.
    #[must_use]
    pub fn total_memory(&self) -> MemoryFootprint {
        let mut total = MemoryFootprint::default();
        for instance in self.instances.values() {
            total.ram_bytes += instance.memory.ram_bytes;
            total.vram_bytes += instance.memory.vram_bytes;
        }
        total
    }

    /// IDs of all loaded models.
    #[must_use]
    pub fn loaded_model_ids(&self) -> Vec<String> {
        self.instances.keys().cloned().collect()
    }

    /// Find which slots share instances with a given model.
    /// Returns the model_id → list of slot_ids mapping.
    #[must_use]
    pub fn shared_instances(&self) -> HashMap<String, usize> {
        self.instances
            .iter()
            .filter(|(_, inst)| inst.ref_count > 1)
            .map(|(id, inst)| (id.clone(), inst.ref_count))
            .collect()
    }

    /// Shutdown all instances.
    pub async fn shutdown_all(&mut self) {
        let ids: Vec<String> = self.instances.keys().cloned().collect();
        for id in ids {
            if let Some(instance) = self.instances.remove(&id) {
                instance.handle.shutdown().await;
            }
        }
    }
}

impl Default for BackendPool {
    fn default() -> Self {
        Self::new()
    }
}
