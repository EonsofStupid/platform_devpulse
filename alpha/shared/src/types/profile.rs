// shared/src/types/profile.rs

//! Signal routing profile types
//!
//! SignalKind.profile() returns SignalProfile which determines:
//! - Processing tier (Reflex/Rumination/Archive)
//! - Data tier (A/B/C)
//! - Model requirements
//! - Tool and collection access

use bitflags::bitflags;
use serde::{Deserialize, Serialize};

/// Processing mode determined by signal type
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum Processing {
    /// Sub-millisecond, no LLM, pure state machine
    Reflex,
    /// Multi-hop CAG + LLM, 4-15 hops with 1-5 directions each
    Rumination,
    /// Cold storage, async consolidation
    Archive,
}

/// Data storage tier for signal payloads
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum DataTier {
    /// Inline enum variant, <1KB, stored in signal itself
    TierA,
    /// BlobHash reference, 1KB-1MB, stored in blob store
    TierB,
    /// PathBuf reference, >1MB, stored as file
    TierC,
}

/// Model tier for inference
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum ModelTier {
    /// No model needed (pure state machine)
    None,
    /// 0.6B minion models (fast, specialized)
    Minion,
    /// 4B llm model (Qwen3-VL-4B)
    Llm,
    /// External executor (Claude, GPT, etc.)
    Executor,
}

bitflags! {
    /// Tools available to this signal's processing
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct ToolSet: u32 {
        const NONE       = 0b0000_0000;
        const FILE_READ  = 0b0000_0001;
        const FILE_WRITE = 0b0000_0010;
        const SHELL      = 0b0000_0100;
        const BROWSER    = 0b0000_1000;
        const MEMORY     = 0b0001_0000;
        const SEARCH     = 0b0010_0000;
        const ALL        = 0b0011_1111;
    }
}

// Manual serde for ToolSet (serialize as u32)
impl Serialize for ToolSet {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        self.bits().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for ToolSet {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let bits = u32::deserialize(deserializer)?;
        Ok(ToolSet::from_bits_truncate(bits))
    }
}

bitflags! {
    /// RRO collections to query for context
    #[derive(Debug, Clone, Copy, PartialEq, Eq)]
    pub struct CollectionSet: u32 {
        const NONE       = 0b0000_0000;
        const CODE       = 0b0000_0001;  // Source code chunks
        const DOCS       = 0b0000_0010;  // Documentation
        const HISTORY    = 0b0000_0100;  // Conversation history
        const MEMORY     = 0b0000_1000;  // Long-term memories
        const EXTERNAL   = 0b0001_0000;  // External knowledge
        const ALL        = 0b0001_1111;
    }
}

// Manual serde for CollectionSet (serialize as u32)
impl Serialize for CollectionSet {
    fn serialize<S: serde::Serializer>(&self, serializer: S) -> Result<S::Ok, S::Error> {
        self.bits().serialize(serializer)
    }
}

impl<'de> Deserialize<'de> for CollectionSet {
    fn deserialize<D: serde::Deserializer<'de>>(deserializer: D) -> Result<Self, D::Error> {
        let bits = u32::deserialize(deserializer)?;
        Ok(CollectionSet::from_bits_truncate(bits))
    }
}

/// Complete routing profile for a signal
///
/// Returned by SignalKind::profile() - determines ALL routing decisions.
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalProfile {
    /// How to process this signal
    pub processing: Processing,

    /// Where to store the payload
    pub data_tier: DataTier,

    /// Which model (if any) to use
    pub model_tier: ModelTier,

    /// Available tools during processing
    pub tools: ToolSet,

    /// Collections to query for context (CAG)
    pub collections: CollectionSet,

    /// Priority (0-100, higher = more urgent)
    pub priority: u8,

    /// Whether this signal can interrupt current processing
    pub interruptible: bool,

    /// Maximum latency budget in milliseconds
    pub latency_budget_ms: u32,
}

impl SignalProfile {
    /// Create a reflex profile (no LLM, instant response)
    pub fn reflex() -> Self {
        Self {
            processing: Processing::Reflex,
            data_tier: DataTier::TierA,
            model_tier: ModelTier::None,
            tools: ToolSet::NONE,
            collections: CollectionSet::NONE,
            priority: 50,
            interruptible: true,
            latency_budget_ms: 1,
        }
    }

    /// Create a rumination profile (full CAG + LLM)
    pub fn rumination() -> Self {
        Self {
            processing: Processing::Rumination,
            data_tier: DataTier::TierA,
            model_tier: ModelTier::Llm,
            tools: ToolSet::ALL,
            collections: CollectionSet::ALL,
            priority: 50,
            interruptible: false,
            latency_budget_ms: 5000,
        }
    }

    /// Create an archive profile (cold storage, async)
    pub fn archive() -> Self {
        Self {
            processing: Processing::Archive,
            data_tier: DataTier::TierB,
            model_tier: ModelTier::None,
            tools: ToolSet::NONE,
            collections: CollectionSet::NONE,
            priority: 10,
            interruptible: true,
            latency_budget_ms: 60000,
        }
    }

    /// Builder: set tools
    pub fn with_tools(mut self, tools: ToolSet) -> Self {
        self.tools = tools;
        self
    }

    /// Builder: set collections
    pub fn with_collections(mut self, collections: CollectionSet) -> Self {
        self.collections = collections;
        self
    }

    /// Builder: set priority
    pub fn with_priority(mut self, priority: u8) -> Self {
        self.priority = priority;
        self
    }

    /// Builder: set data tier
    pub fn with_data_tier(mut self, tier: DataTier) -> Self {
        self.data_tier = tier;
        self
    }

    /// Builder: set model tier
    pub fn with_model(mut self, model: ModelTier) -> Self {
        self.model_tier = model;
        self
    }
}
