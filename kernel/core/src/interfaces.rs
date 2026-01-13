use async_trait::async_trait;
use serde::de::DeserializeOwned;
use anyhow::Result;
use uuid::Uuid;
use crate::types::signal::{Signal, SignalKind};

#[async_trait]
pub trait LlmService: Send + Sync {
    async fn completion(&self, prompt: &str) -> Result<String>;
    async fn json_completion<T: DeserializeOwned>(&self, prompt: &str) -> Result<T>;
}

#[async_trait]
pub trait EmbedderService: Send + Sync {
    async fn embed(&self, text: &str) -> Result<Vec<f32>>;
    async fn embed_batch(&self, texts: &[String]) -> Result<Vec<Vec<f32>>>;
}

// [Adapter Pattern]
// Wrappers for DBs so we can swap generic logic (LibSQL/DuckDB)
#[async_trait]
pub trait ProjectRepository: Send + Sync {
    async fn get_project(&self, id: Uuid) -> Result<Option<serde_json::Value>>; // Using Value for now, specific struct later
    async fn save_project(&self, project: &serde_json::Value) -> Result<()>;
}

#[async_trait]
pub trait SignalRepository: Send + Sync {
    async fn record_signal(&self, signal: &Signal) -> Result<()>;
    // Simple query interface
    async fn tail(&self, limit: usize) -> Result<Vec<Signal>>;
    // "Elite Build Protocol": Unused import SignalKind meant we forgot this feature:
    async fn find_by_kind(&self, kind: SignalKind, limit: usize) -> Result<Vec<Signal>>;
}
