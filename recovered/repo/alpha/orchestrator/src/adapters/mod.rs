// orchestrator/src/adapters/mod.rs

//! Adapter layer - abstraction for inference/storage backends
//!
//! # Architecture
//!
//! Adapters are the pluggable backends that orchestrator uses internally.
//! Engine NEVER sees adapters directly - only through facades.
//!
//! ```text
//! ┌─────────────────────────────────────────────────────────────┐
//! │ ENGINE (Public Facade)                                       │
//! │   - Uses shared::AdapterKind, shared::LlmProvider           │
//! │   - NEVER imports orchestrator::adapters                     │
//! └─────────────────────────────┬───────────────────────────────┘
//!                               │
//!                               ▼
//! ┌─────────────────────────────────────────────────────────────┐
//! │ ORCHESTRATOR (Internal)                                      │
//! │                                                              │
//! │   adapters/                                                  │
//! │   ├── local/     ← Candle inference, file I/O               │
//! │   ├── web/       ← HTTP clients (Anthropic, OpenAI, etc.)   │
//! │   └── memory/    ← Moka cache, hot data                     │
//! └─────────────────────────────────────────────────────────────┘
//! ```
//!
//! # Usage
//!
//! ```ignore
//! use orchestrator::adapters::{InferenceAdapter, AdapterConfig};
//!
//! // Create adapter based on config
//! let adapter = AdapterFactory::create(config)?;
//!
//! // Use adapter for inference
//! let response = adapter.infer(prompt, params).await?;
//! ```

pub mod local;
pub mod memory;
pub mod web;

use anyhow::Result;
use async_trait::async_trait;
use shared::AdapterKind;

/// Inference parameters (internal use only)
#[derive(Debug, Clone)]
pub struct InferParams {
    /// Maximum tokens to generate
    pub max_tokens: u32,
    /// Temperature (0.0 - 2.0)
    pub temperature: f32,
    /// Top-p sampling
    pub top_p: f32,
    /// Stop sequences
    pub stop: Vec<String>,
    /// System prompt (optional)
    pub system: Option<String>,
}

impl Default for InferParams {
    fn default() -> Self {
        Self {
            max_tokens: 1024,
            temperature: 0.7,
            top_p: 0.9,
            stop: vec![],
            system: None,
        }
    }
}

/// Inference response (internal use only)
#[derive(Debug, Clone)]
pub struct InferResponse {
    /// Generated text
    pub text: String,
    /// Tokens used in prompt
    pub prompt_tokens: u32,
    /// Tokens generated
    pub completion_tokens: u32,
    /// Inference latency in ms
    pub latency_ms: u64,
    /// Model ID used
    pub model_id: String,
}

/// Core inference adapter trait
///
/// Implemented by all backends that can generate text.
/// This is an INTERNAL trait - engine uses facades.
#[async_trait]
pub trait InferenceAdapter: Send + Sync {
    /// Generate text from prompt
    async fn infer(&self, prompt: &str, params: &InferParams) -> Result<InferResponse>;

    /// Stream text generation (token by token)
    async fn infer_stream(
        &self,
        prompt: &str,
        params: &InferParams,
        on_token: Box<dyn FnMut(String) + Send>,
    ) -> Result<InferResponse>;

    /// What kind of adapter is this?
    fn adapter_kind(&self) -> AdapterKind;

    /// Is the adapter ready for inference?
    fn is_ready(&self) -> bool;

    /// Human-readable name
    fn name(&self) -> &str;
}

/// Storage adapter trait
///
/// For adapters that store/retrieve data.
/// NOTE: Storage is separate from inference - uses StorageKind, not AdapterKind.
#[async_trait]
pub trait StorageAdapter: Send + Sync {
    /// Store a value
    async fn store(&self, key: &str, value: &[u8]) -> Result<()>;

    /// Load a value
    async fn load(&self, key: &str) -> Result<Option<Vec<u8>>>;

    /// Delete a value
    async fn delete(&self, key: &str) -> Result<bool>;

    /// Check if key exists
    async fn exists(&self, key: &str) -> Result<bool>;

    /// Storage backend kind
    fn storage_kind(&self) -> memory::StorageKind;
}

/// Embedding adapter trait
///
/// For adapters that generate embeddings.
#[async_trait]
pub trait EmbeddingAdapter: Send + Sync {
    /// Generate embedding for text
    async fn embed(&self, text: &str) -> Result<Vec<f32>>;

    /// Generate embeddings for multiple texts (batched)
    async fn embed_batch(&self, texts: &[&str]) -> Result<Vec<Vec<f32>>>;

    /// Embedding dimension
    fn dimension(&self) -> usize;

    /// Adapter kind
    fn adapter_kind(&self) -> AdapterKind;
}
