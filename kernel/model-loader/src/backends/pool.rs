//! Backend pool — shared model instances with reference counting.
//!
//! When two slots point to the same model, only one instance is loaded.
//! The pool tracks references and only unloads when all refs are released.

use crate::backends::bridge::{InferenceBridge, InferenceHandle};
use crate::loading::states::MemoryFootprint;
// `LoadParams`, `BackendType`, and `Path` are referenced only by
// `acquire()`, which is cfg-gated to `candle-backend`. Pool surface methods
// (get_handle, is_loaded, ref_count, total_memory, …) work without it.
#[cfg(feature = "candle-backend")]
use crate::loading::states::LoadParams;
#[cfg(feature = "candle-backend")]
use crate::models::registry::BackendType;
use std::collections::HashMap;
use std::path::{Path, PathBuf};

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
    /// Path to the model file. Identity key for hot-swap safety: if a
    /// caller asks for the same `model_id` but a different `model_path`,
    /// the registry has shifted under a live instance and we must refuse
    /// to silently hand back a handle pointing at the old file.
    model_path: PathBuf,
}

/// Manages shared model instances across slots.
pub struct BackendPool {
    /// `model_id` → pooled instance.
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
    ///
    /// `backend_type` determines where the model runs:
    /// - `Candle` → in process: `SafeTensors` + supported `GGUF` architectures
    /// - `LlamaCpp` → not here: GGUF is served by llama.cpp's `llama-server`,
    ///   a separate process the caller starts (plan 0007)
    ///
    /// # Errors
    /// - Returns an error for a `LlamaCpp` model (it is served by
    ///   `llama-server`, not loaded in process), when spawning the inference
    ///   bridge fails, or on Candle device init failure.
    /// - Propagates the bridge's `load()` error when the model file is
    ///   missing, malformed, or its architecture is unsupported by the
    ///   selected backend.
    #[cfg(feature = "candle-backend")]
    pub async fn acquire(
        &mut self,
        model_id: &str,
        model_path: &Path,
        params: LoadParams,
        backend_type: BackendType,
    ) -> anyhow::Result<(InferenceHandle, MemoryFootprint)> {
        // Check if already loaded (shared instance)
        if let Some(instance) = self.instances.get_mut(model_id) {
            // Hot-swap identity check. The pool keys on `model_id`, but the
            // file backing that id can shift (registry relocation, custom
            // local override, user-edited path). Sharing a handle whose
            // `model_path` no longer matches what the caller asked for would
            // hand back inference against the wrong file. Refuse instead.
            if instance.model_path != model_path {
                anyhow::bail!(
                    "Hot-swap identity mismatch for model '{model_id}': pool \
                     holds {} but caller requested {} — release the \
                     existing reference before reloading at a new path",
                    instance.model_path.display(),
                    model_path.display(),
                );
            }
            instance.ref_count += 1;
            tracing::info!(
                model = %model_id,
                ref_count = instance.ref_count,
                path = ?instance.model_path,
                "Shared instance — bumped ref count"
            );
            return Ok((instance.handle.clone(), instance.memory));
        }

        // New instance needed. No silent fallback to Candle for GGUF: it runs
        // in llama.cpp's own server, started for the slot (plan 0007,
        // decision 5).
        if matches!(backend_type, BackendType::LlamaCpp) {
            anyhow::bail!(
                "GGUF model {model_id} is served by llama-server, not loaded in \
                 process — load its slot to start the server"
            );
        }
        // Candle for SafeTensors and everything else
        let bridge = InferenceBridge::spawn_candle(resolve_candle_device(&params))?;

        let handle = bridge.handle();

        // Load the model via the bridge
        let memory = handle.load(model_path.to_path_buf(), params).await?;

        let pooled = PooledInstance {
            handle: handle.clone(),
            _bridge: bridge,
            ref_count: 1,
            memory,
            model_path: model_path.to_path_buf(),
        };

        self.instances.insert(model_id.to_string(), pooled);
        tracing::info!(model = %model_id, backend = ?backend_type, "Model loaded into pool");

        Ok((handle, memory))
    }

    /// Release a reference. Unloads only when `ref_count` reaches 0.
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
        self.instances.get(model_id).map_or(0, |i| i.ref_count)
    }

    /// Memory footprint of a loaded model.
    #[must_use]
    pub fn memory(&self, model_id: &str) -> Option<MemoryFootprint> {
        self.instances.get(model_id).map(|i| i.memory)
    }

    /// Path of the file backing a loaded model. Returned by reference so
    /// callers (swap diagnostics, hot-update probes, devtools) can compare
    /// without forcing a clone on the common identity-check path.
    #[must_use]
    pub fn path_of(&self, model_id: &str) -> Option<&Path> {
        self.instances.get(model_id).map(|i| i.model_path.as_path())
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
    /// Returns the `model_id` → list of `slot_ids` mapping.
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

/// Resolve the Candle device from `LoadParams`.
#[cfg(feature = "candle-backend")]
fn resolve_candle_device(params: &LoadParams) -> candle_core::Device {
    if params.device == "cpu" {
        candle_core::Device::Cpu
    } else {
        #[cfg(feature = "cuda")]
        {
            candle_core::Device::new_cuda(0).unwrap_or(candle_core::Device::Cpu)
        }
        #[cfg(not(feature = "cuda"))]
        candle_core::Device::Cpu
    }
}
