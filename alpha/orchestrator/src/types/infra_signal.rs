// orchestrator/src/types/infra_signal.rs

//! Internal infrastructure signals - high frequency, stays in orchestrator
//! Lab observes via engine facade subscription

use serde::{Deserialize, Serialize};

/// High-frequency internal signals
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "type")]
pub enum InfraSignal {
    // ─── LLM ───────────────────────────────────────────────────────
    LlmStarted { prompt_tokens: u32, model_id: String },
    LlmToken { token: String, position: u32 },
    LlmCompleted { text: String, tokens: u32, latency_ms: u64 },
    LlmError { error: String },
    
    // ─── Rumination ────────────────────────────────────────────────
    HopStarted { hop: u8, frame_id: String },
    HopCompleted { hop: u8, direction: Direction, confidence: f32 },
    ChainComplete { total_hops: u8, outcome: Outcome },
    
    // ─── Embedder ──────────────────────────────────────────────────
    EmbedStarted { text_len: usize },
    EmbedCompleted { dimension: usize, latency_ms: u64 },
    
    // ─── Reranker ──────────────────────────────────────────────────
    RerankStarted { query_len: usize, doc_count: usize },
    RerankCompleted { top_score: f32, latency_ms: u64 },
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Direction {
    Forward,
    Backward,
    Lateral,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum Outcome {
    Success,
    Failure,
    Aborted,
}
