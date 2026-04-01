//! Model Loader service — AI model management, slot assignment, inference.
//!
//! Wraps the self-enclosed `model-loader` crate as a platform service.
//! Uses `tokio::sync::Mutex` because `ModelLoaderService` methods take `&mut self`
//! and Tauri commands are concurrent.

use super::{Service, ServiceRole, ServiceState};
use anyhow::Result;
use super::model_loader_log::FileEventSink;
use devpulse_clyffy::model_loader::{
    AutoConfig, HardwareMetrics, MemoryConfig, ModelLoaderService as Inner,
    ModelRegistryEntry, Slot, SlotStatus,
};
use std::sync::Arc;
use tokio::sync::Mutex;

/// Model Loader service — managed by the platform boot pipeline.
pub struct ModelLoaderService {
    inner: Mutex<Inner>,
}

impl ModelLoaderService {
    /// Boot the model loader from a data directory.
    ///
    /// Creates `{data_dir}/models/` and subdirectories.
    /// Registers default slots, restores assignments, scans registry.
    pub fn boot(
        data_dir: &std::path::Path,
        default_slots: Vec<Slot>,
    ) -> Result<Self> {
        let models_dir = data_dir.join("models");
        let log_path = data_dir.join("logs").join("model-loader.log");
        let config = Box::new(MemoryConfig::new());
        let events: Arc<dyn devpulse_clyffy::model_loader::LoaderEventSink> =
            Arc::new(FileEventSink::new(log_path));

        let mut service = Inner::new(config, events, models_dir)?;

        // Register platform-specific slots
        service.register_slots(default_slots).map_err(|e| {
            anyhow::anyhow!("Failed to register default slots: {e}")
        })?;

        // Restore saved slot assignments
        if let Err(e) = service.restore_assignments() {
            tracing::warn!(error = %e, "Failed to restore model assignments (non-fatal)");
        }

        // Initial model scan
        match service.scan_models() {
            Ok(count) => {
                tracing::info!(models = count.len(), "Initial model scan complete");
            }
            Err(e) => {
                tracing::warn!(error = %e, "Initial model scan failed (non-fatal)");
            }
        }

        Ok(Self {
            inner: Mutex::new(service),
        })
    }

    /// Get hardware metrics.
    pub async fn hardware_metrics(&self) -> HardwareMetrics {
        let mut inner = self.inner.lock().await;
        inner.hardware_metrics()
    }

    /// Scan models directory.
    pub async fn scan_models(&self) -> Result<Vec<ModelRegistryEntry>> {
        let mut inner = self.inner.lock().await;
        inner.scan_models().map_err(Into::into)
    }

    /// List all registered slots.
    pub async fn list_slots(&self) -> Vec<Slot> {
        let inner = self.inner.lock().await;
        inner.list_slots().into_iter().cloned().collect()
    }

    /// Get status for a specific slot.
    pub async fn slot_status(&self, slot_id: &str) -> SlotStatus {
        let inner = self.inner.lock().await;
        inner.slot_status(slot_id)
    }

    /// Assign a model to a slot.
    pub async fn assign_model(&self, slot_id: &str, model_id: &str) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.assign_model(slot_id, model_id).map_err(|e| {
            anyhow::anyhow!("{e}")
        })
    }

    /// Load a slot's assigned model.
    pub async fn load_slot(&self, slot_id: &str) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.load_slot(slot_id).await.map_err(|e| {
            anyhow::anyhow!("{e}")
        })
    }

    /// Unload a slot's model.
    pub async fn unload_slot(&self, slot_id: &str) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.unload_slot(slot_id).await.map_err(|e| {
            anyhow::anyhow!("{e}")
        })
    }

    /// Check if this is the first run.
    pub async fn is_first_run(&self) -> bool {
        let inner = self.inner.lock().await;
        inner.is_first_run()
    }

    /// Auto-configure based on hardware.
    pub async fn auto_configure(&self) -> AutoConfig {
        let mut inner = self.inner.lock().await;
        inner.auto_configure()
    }

    /// Start downloading a model from HuggingFace.
    pub async fn download_model(&self, repo_id: &str, filename: &str) -> Result<String> {
        let mut inner = self.inner.lock().await;
        inner.download_model(repo_id, filename).map_err(|e| {
            anyhow::anyhow!("{e}")
        })
    }

    /// Cancel an active download.
    pub async fn cancel_download(&self, download_id: &str) -> Result<()> {
        let mut inner = self.inner.lock().await;
        inner.cancel_download(download_id).map_err(|e| {
            anyhow::anyhow!("{e}")
        })
    }

    /// Get model registry (without scanning).
    pub async fn get_registry(&self) -> Vec<ModelRegistryEntry> {
        let inner = self.inner.lock().await;
        inner.get_registry().to_vec()
    }

    /// Get an inference handle for a slot (resolves fallback chain).
    ///
    /// Returns a cloned handle — caller can use it without holding the Mutex.
    /// This is critical: generation is long-running, we must NOT hold the lock.
    pub async fn inference_handle(
        &self,
        slot_id: &str,
    ) -> Option<devpulse_clyffy::model_loader::InferenceHandle> {
        let inner = self.inner.lock().await;
        inner.inference_handle(slot_id)
    }

    /// Search HuggingFace for GGUF models.
    pub async fn search_huggingface(
        &self,
        query: &str,
        limit: u32,
    ) -> Result<Vec<devpulse_clyffy::model_loader::HfSearchResult>> {
        let inner = self.inner.lock().await;
        inner.search_huggingface(query, limit).await
    }
}

impl Service for ModelLoaderService {
    fn name(&self) -> &'static str {
        "Model Loader"
    }

    fn role(&self) -> ServiceRole {
        ServiceRole::ModelLoader
    }

    async fn ping(&self) -> Result<()> {
        // Verify we can access the inner service
        let _inner = self.inner.lock().await;
        Ok(())
    }

    fn state(&self) -> ServiceState {
        ServiceState::Ready
    }

    async fn shutdown(&self) -> Result<()> {
        tracing::info!("Model Loader shutting down");
        // Future: unload all models, flush pool
        Ok(())
    }
}
