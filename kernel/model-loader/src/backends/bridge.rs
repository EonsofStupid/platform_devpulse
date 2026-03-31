//! Flume sync-to-async bridge for inference.
//!
//! Phase 4 implementation. Types defined here for Phase 1 compile.

use serde::{Deserialize, Serialize};

/// Request sent from async callers to the sync inference thread.
#[derive(Debug)]
pub enum InferenceRequest {
    /// Forward pass.
    Forward {
        tokens: Vec<u32>,
        position: usize,
        reply: flume::Sender<anyhow::Result<Vec<f32>>>,
    },
    /// Tokenize text.
    Tokenize {
        text: String,
        reply: flume::Sender<anyhow::Result<Vec<u32>>>,
    },
    /// Detokenize tokens.
    Detokenize {
        tokens: Vec<u32>,
        reply: flume::Sender<anyhow::Result<String>>,
    },
    /// Shutdown the inference thread.
    Shutdown,
}

/// Streaming response from the inference thread.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum InferenceResponse {
    /// A single generated token.
    Token { id: u32, text: String },
    /// Generation complete.
    Done,
    /// Error during generation.
    Error(String),
}
