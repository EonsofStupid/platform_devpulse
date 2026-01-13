// shared/src/types/signal.rs

//! SignalKind - The Router
//!
//! Signal IS the router. Each variant's profile() method returns
//! the complete routing decision (processing tier, model, tools, collections).
//!
//! NO separate router logic - the signal itself knows how to route.

use super::github::ProtectionRule;
use super::profile::{
    CollectionSet, DataTier, ModelTier, Processing, SignalProfile, ToolSet,
};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use crate::types::ids::BlobHash;

/// All signal types in DevPulse
///
/// Each variant implements profile() which returns routing decisions.
/// Grouped by data tier:
/// - TierA: Inline data (<1KB)
/// - TierB: BlobHash reference (1KB-1MB)
/// - TierC: PathBuf reference (>1MB)
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(tag = "kind", content = "data")]
pub enum SignalKind {
    // ═══════════════════════════════════════════════════════════════
    // TIER A: Inline data (small, frequent)
    // ═══════════════════════════════════════════════════════════════

    /// User typed a character (keystroke layer trigger)
    Keystroke { char: char, timestamp_ms: u64 },

    /// User paused typing (pause layer trigger)
    Pause { duration_ms: u64 },

    /// User submitted a message
    UserMessage { text: String },

    /// Window focus changed
    WindowFocus { window_title: String, app_name: String },

    /// Cursor position changed in editor
    CursorMove { file: String, line: u32, col: u32 },

    /// File was saved
    FileSaved { path: String },

    /// Git status changed
    GitChange { branch: String, status: String },

    /// User emotional state detected
    EmotionalState { state: String, confidence: f32 },

    /// System heartbeat (keep-alive)
    Heartbeat { uptime_secs: u64 },

    // ─── GitHub Integration ──────────────────────────────────────
    
    /// GitHub webhook received (push event)
    /// Internal signal - orchestrator subscribes
    GitHubPushReceived {
        repo_id: String,
        repo_name: String,
        commit_sha: String,
        before_sha: String,
        branch: String,
        pusher: String,
    },

    /// Gus is checking a commit (Layer 1: user sees this)
    GusCheckingCommit {
        repo_name: String,
        commit_message: String,
    },

    /// Gus finished checking (Layer 1: simple result)
    GusCheckCompleted {
        repo_name: String,
        commit_sha: String,
        // Layer 1: Simple friendly message
        simple_summary: String,  // "✅ Gus approved" or "🛡️ Gus blocked this"
        // Layer 2: Educational details
        detailed_summary: String,  // "Checked: patterns, secrets, file sizes"
        // Layer 3: Technical metadata (JSON)
        technical_details: Option<String>,  // Full ML pipeline info
    },

    /// GitHub protection enabled for repo
    GusProtectionEnabled {
        repo_name: String,
        rules: Vec<ProtectionRule>,
    },

    // ═══════════════════════════════════════════════════════════════
    // TIER B: BlobHash reference (medium, indexed)
    // ═══════════════════════════════════════════════════════════════

    /// Code chunk indexed by GUARDIAN
    CodeChunk { hash: BlobHash, file: String, start_line: u32, end_line: u32 },

    /// Document chunk for RAG
    DocChunk { hash: BlobHash, source: String },

    /// Conversation turn stored
    Turn { hash: BlobHash, role: String },

    /// Memory item consolidated
    Memory { hash: BlobHash, category: String },

    // ═══════════════════════════════════════════════════════════════
    // TIER C: PathBuf reference (large blobs)
    // ═══════════════════════════════════════════════════════════════

    /// Screenshot captured
    Screenshot { path: PathBuf, context: String },

    /// Audio clip recorded
    AudioClip { path: PathBuf, duration_secs: f32 },

    /// Large file change detected
    LargeFileChange { path: PathBuf, size_bytes: u64 },
}

impl SignalKind {
    /// Returns the complete routing profile for this signal.
    /// This IS the router - no separate routing logic needed.
    pub fn profile(&self) -> SignalProfile {
        match self {
            // ─── Reflex signals (no LLM, <1ms) ───────────────────────
            SignalKind::Keystroke { .. } => SignalProfile::reflex()
                .with_priority(10),

            SignalKind::Heartbeat { .. } => SignalProfile::reflex()
                .with_priority(1),

            SignalKind::CursorMove { .. } => SignalProfile::reflex()
                .with_priority(20),

            SignalKind::WindowFocus { .. } => SignalProfile::reflex()
                .with_priority(30)
                .with_collections(CollectionSet::HISTORY),

            // ─── Pause-layer signals (prefetch, rerank) ─────────────
            SignalKind::Pause { .. } => SignalProfile {
                processing: Processing::Reflex,
                data_tier: DataTier::TierA,
                model_tier: ModelTier::Minion,
                tools: ToolSet::MEMORY | ToolSet::SEARCH,
                collections: CollectionSet::CODE | CollectionSet::HISTORY,
                priority: 40,
                interruptible: true,
                latency_budget_ms: 500,
            },

            SignalKind::FileSaved { .. } => SignalProfile {
                processing: Processing::Reflex,
                data_tier: DataTier::TierA,
                model_tier: ModelTier::Minion,
                tools: ToolSet::FILE_READ,
                collections: CollectionSet::CODE,
                priority: 50,
                interruptible: true,
                latency_budget_ms: 100,
            },

            SignalKind::GitChange { .. } => SignalProfile {
                processing: Processing::Reflex,
                data_tier: DataTier::TierA,
                model_tier: ModelTier::None,
                tools: ToolSet::NONE,
                collections: CollectionSet::NONE,
                priority: 30,
                interruptible: true,
                latency_budget_ms: 50,
            },

            // ─── GitHub integration signals ─────────────────────────
            SignalKind::GitHubPushReceived { .. } => SignalProfile {
                processing: Processing::Reflex,
                data_tier: DataTier::TierA,
                model_tier: ModelTier::None,
                tools: ToolSet::NONE,
                collections: CollectionSet::NONE,
                priority: 80,
                interruptible: false,
                latency_budget_ms: 100,
            },

            SignalKind::GusCheckingCommit { .. } => SignalProfile {
                processing: Processing::Reflex,
                data_tier: DataTier::TierA,
                model_tier: ModelTier::None,
                tools: ToolSet::NONE,
                collections: CollectionSet::NONE,
                priority: 60,
                interruptible: true,
                latency_budget_ms: 50,
            },

            SignalKind::GusCheckCompleted { .. } => SignalProfile {
                processing: Processing::Reflex,
                data_tier: DataTier::TierA,
                model_tier: ModelTier::None,
                tools: ToolSet::NONE,
                collections: CollectionSet::NONE,
                priority: 70,
                interruptible: false,
                latency_budget_ms: 100,
            },

            SignalKind::GusProtectionEnabled { .. } => SignalProfile {
                processing: Processing::Reflex,
                data_tier: DataTier::TierA,
                model_tier: ModelTier::None,
                tools: ToolSet::NONE,
                collections: CollectionSet::NONE,
                priority: 40,
                interruptible: true,
                latency_budget_ms: 50,
            },

            // ─── Rumination signals (full CAG + LLM) ────────────────
            SignalKind::UserMessage { .. } => SignalProfile::rumination()
                .with_priority(90)
                .with_collections(CollectionSet::ALL),

            SignalKind::EmotionalState { .. } => SignalProfile {
                processing: Processing::Rumination,
                data_tier: DataTier::TierA,
                model_tier: ModelTier::Minion,
                tools: ToolSet::MEMORY,
                collections: CollectionSet::HISTORY | CollectionSet::MEMORY,
                priority: 60,
                interruptible: false,
                latency_budget_ms: 2000,
            },

            // ─── Archive signals (async, cold storage) ──────────────
            SignalKind::CodeChunk { .. } => SignalProfile::archive()
                .with_data_tier(DataTier::TierB)
                .with_collections(CollectionSet::CODE),

            SignalKind::DocChunk { .. } => SignalProfile::archive()
                .with_data_tier(DataTier::TierB)
                .with_collections(CollectionSet::DOCS),

            SignalKind::Turn { .. } => SignalProfile::archive()
                .with_data_tier(DataTier::TierB)
                .with_collections(CollectionSet::HISTORY),

            SignalKind::Memory { .. } => SignalProfile::archive()
                .with_data_tier(DataTier::TierB)
                .with_collections(CollectionSet::MEMORY),

            // ─── Large blob signals (TierC) ─────────────────────────
            SignalKind::Screenshot { .. } => SignalProfile {
                processing: Processing::Rumination,
                data_tier: DataTier::TierC,
                model_tier: ModelTier::Llm, // VL-4B for vision
                tools: ToolSet::MEMORY,
                collections: CollectionSet::CODE | CollectionSet::HISTORY,
                priority: 70,
                interruptible: false,
                latency_budget_ms: 10000,
            },

            SignalKind::AudioClip { .. } => SignalProfile {
                processing: Processing::Rumination,
                data_tier: DataTier::TierC,
                model_tier: ModelTier::Minion, // Whisper
                tools: ToolSet::MEMORY,
                collections: CollectionSet::HISTORY,
                priority: 60,
                interruptible: false,
                latency_budget_ms: 15000,
            },

            SignalKind::LargeFileChange { .. } => SignalProfile::archive()
                .with_data_tier(DataTier::TierC)
                .with_priority(20),
        }
    }

    /// Quick check: is this a reflex signal (no LLM)?
    pub fn is_reflex(&self) -> bool {
        self.profile().processing == Processing::Reflex
    }

    /// Quick check: does this signal need an LLM?
    pub fn needs_llm(&self) -> bool {
        self.profile().model_tier != ModelTier::None
    }

    /// Quick check: does this signal need full rumination?
    pub fn needs_rumination(&self) -> bool {
        self.profile().processing == Processing::Rumination
    }

    /// Get the data tier for storage decisions
    pub fn data_tier(&self) -> DataTier {
        self.profile().data_tier
    }

    /// Convenience constructor for chat/user message
    pub fn chat(text: String) -> Self {
        SignalKind::UserMessage { text }
    }
}
