# Sprint 1: The Foundation (Workspace & Layer 1)

**Status:** PENDING APPROVAL
**Goal:** Establish the workspace and the `shared` crate using the Hybrid Maestro Architecture.
**Rule:** These file contents are the EXACT code to be written.

## 1. The Workspace (Root)
**File:** `Cargo.toml`
```toml
[workspace]
resolver = "2"
members = [
    "kernel/core",
    "systems/*",
    "interfaces/*",
]

[workspace.dependencies]
# Async
tokio = { version = "1.49", features = ["full"] }
async-trait = "0.1"

# Data
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
uuid = { version = "1.19", features = ["v7", "v4", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
bitflags = "2.6"
toml = "0.8"
directories = "6.0"

# Profilers
tracy_full = { version = "1.12", features = ["enable", "tracing", "futures"] }
tracing-tracy = "0.11"
tracing = "0.1"
tracing-subscriber = "0.3"

# Cache & KV
moka = { version = "0.12.12", features = ["future"] }
fjall = "3.0.1"
rkyv = "0.8"

# SQL & OLAP
libsql = "0.9.29"
duckdb = { version = "1.4.3", features = ["bundled"] }

# Network
reqwest = { version = "0.12", default-features = false, features = ["json", "rustls-tls"] }
rustls = { version = "0.23", default-features = false, features = ["ring", "std", "tls12"] }

# AI (Local)
candle-core = "0.9.2-alpha.2"
candle-nn = "0.9.2-alpha.2"
candle-transformers = "0.9.2-alpha.2"
tokenizers = "0.21"
outlines-core = "0.2.13"
safetensors = "0.7"

# Voice
sherpa-rs = { version = "0.6.8", features = ["tts"] }

# Media
image = "0.25"

# Screen Capture (WiredFront)
scap = "0.1.0-beta.1"
openh264 = "0.9"
muxide = "0.2"
webrtc = "0.14"
cpal = "0.17"
opus = "0.3"

[patch.crates-io]
tar = { git = "https://github.com/eonsofstupid/tar-rs", branch = "main" }

## 2. Layer 1: CORE (The Kernel)

### Crate Manifest
**File:** `kernel/core/Cargo.toml`
```toml
[package]
name = "devpulse-core"
version = "0.1.0"
edition = "2021"
```

### Maintenance Guardrails (AI-Proofing)
**File:** `kernel/core/_MAINTENANCE.md`
```markdown
# Kernel Core Maintenance Protocol

## REQUIRED_STEP 1: No Duplication
- Before acting, run `grep "StructName" . -r` to ensure you aren't recreating a type.
- IF a type exists in `systems/engine`, MOVE it here. Core is the Single Source of Truth.

## REQUIRED_STEP 2: Architecture Check
- **Files**: Types ONLY. No business logic.
- **Dependencies**: Minimal (serde, uuid, chrono). NO heavy crates.
- **Pattern**: `Signal` = `Header` + `SignalKind`. Do not break this envelope.

## REQUIRED_STEP 3: View Before Write
- You MUST read `src/types/mod.rs` before adding a new module.
- You MUST read `src/lib.rs` to verify exports.
```

### Library Entry
**File:** `kernel/core/src/lib.rs`
```rust
pub mod types;
pub mod interfaces;
pub mod adapter;

// Re-export common types for ease of use
pub use types::signal::{Signal, SignalKind, Source};
pub use types::profile::{SignalProfile, Role};
```

### Module: Types
**File:** `kernel/core/src/types/mod.rs`
```rust
pub mod signal;
pub mod profile;
// mod header; // Removed to fix build
```

**File:** `kernel/core/src/types/signal.rs`
```rust
use serde::{Deserialize, Serialize};
use uuid::Uuid;
use chrono::{DateTime, Utc};
use serde_json::Value;
use crate::adapter::AdapterKind;

/// The fundamental atomic unit of the platform (The Envelope).
/// A Signal is an Envelope containing a Header (Context) and a Kind (Payload).
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Signal {
    #[serde(flatten)]
    pub header: Header,        // The Shipping Label (Routing, Tracing, Context)
    
    #[serde(flatten)]
    pub kind: SignalKind,      // The Content (Payload)
}

/// The Shipping Label. 
/// Engine uses this to route signals without needing to understand the Payload.
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct Header {
    pub id: Uuid,              // v7 (Time-ordered)
    pub correlation_id: Uuid,  // Trace back to origin (Conversation or Lane ID)
    pub source: Source,        // "Who sent this?"
    pub created_at: DateTime<Utc>,
    pub importance: u8,        // 0-255 priority
}

/// The Master Enum.
/// Distinguishes between "Public Standard" signals (Engine logic)
/// and "Proprietary" signals (Maestro IP).
#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "type", content = "payload")]
pub enum SignalKind {
    // --- The Public Facade (Engine) ---
    // These are fully typed and visible to the open engine.
    Standard(StandardSignal),

    // --- The Secret Sauce (Maestro) ---
    // The engine routes these blinded or passes them to the proprietary crate.
    // Ideally this structure is defined in `maestro`, but for the core type
    // we use a flexible container or a separate enum that specific crates extend.
    // For now, in a monorepo, we define the *variants* here but group them logically
    // so the Engine can say "If proprietary, forward to Maestro; do not process".
    Proprietary(ProprietarySignal),
    
    // --- Control Flow ---
    Control(ControlSignal),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", content = "data")]
pub enum StandardSignal {
    Chat(ChatSignal),
    Interaction(InteractionSignal),
    Perception(PerceptionSignal), // Inputs (Screen, DOM)
    Telemetry(TelemetrySignal),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(tag = "kind", content = "data")]
pub enum ProprietarySignal {
    Governance(GovernanceSignal), // The Rules Engine
    Heuristic(HeuristicSignal),   // "I think the user is frustrated"
    Lane(LaneSignal),             // Coaching/Reflection workflows
    Context(ContextSignal),       // The heavy context band logic
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum ControlSignal {
    Halt,
    Ping,
    Ack(Uuid),
}


// --- Variant Definitions ---

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Source {
    System,
    User(Uuid),
    Agent(String),        // "Gus", "Critic", "GovernanceAgent"
    External(AdapterKind),
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ChatSignal { 
    pub content: String, 
    pub attachments: Vec<String> 
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ContextSignal {
    pub band_color: String, // "Red", "Teal", "Green"
    pub missing_fields: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct PerceptionSignal {
    pub source: String, // "screen", "ide", "extension"
    pub payload: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LaneSignal {
    pub lane_id: String, // "coaching", "diary"
    pub status: String,  // "started", "step_complete", "finished"
    pub step: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct GovernanceSignal {
    pub verdict: String, // "allow", "block", "warn"
    pub reason: String,
    pub policy_id: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct TelemetrySignal {
    pub metric: String,
    pub value: f64,
    pub attributes: Value,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct LogSignal {
    pub level: String,
    pub message: String,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ProjectSignal {
    pub project_id: Uuid,
    pub action: String, // "create", "update"
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub struct ProfileSignal {
    pub user_id: Uuid,
    pub key: String,
    pub value: String,
}
```

**File:** `kernel/core/src/types/profile.rs`
```rust
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct SignalProfile {
    pub name: String,
    pub role: Role,
    pub preferences: HashMap<String, String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum Role {
    Founder,
    Staff,
    User,
    Guest,
}
```

**File:** `kernel/core/src/adapter.rs`
```rust
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
pub enum AdapterKind {
    GitHub,
    Linear,
    Discord,
    Slack,
    Terminal,
    VsCode,
    Unknown(String),
}
```

**File:** `kernel/core/src/interfaces.rs`
```rust
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
}
```
