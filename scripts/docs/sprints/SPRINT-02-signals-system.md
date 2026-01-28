# SPRINT-02: Engine Signal System (Facade Layer)

> **Status**: READY FOR EXECUTION
> **Scope**: `systems/devpulse-engine/src/signals/`, `kernel/devpulse-maestro/src/cortex/`
> **Depends On**: SPRINT-DB-01 (complete)
> **Date**: 2026-01-28

---

## Critical Architecture (LOCKED)

### Engine = PUBLIC FACADE (Desktop imports from here)
- SignalHeader: 4 atomic fields (id, correlation_id, timestamp, source)
- SignalSource: enum (User, System, Expert, Clock)
- SignalVariant: enum with typed payloads (Chat, Analytics, etc.)
- SinkKind: enum for routing (Broadcast, Cache, Durable, etc.)
- SignalRouter: tokio::broadcast for fanout

### Kernel = IP (Internal processing)
- Maestro SUBSCRIBES to Engine signals
- Toon: internal wire envelope (header + SignalKind)
- Cortex processing: reflex/rumination routing
- Cortex does NOT export signal types - it IMPORTS from engine

### Data Flow
```
Desktop → Engine.emit(Signal) → SignalRouter → Maestro.subscribe()
                                            → Desktop.subscribe()
                                            → Analytics sink
```

---

## Current State (WRONG)

**systems/devpulse-engine/src/signals.rs**:
```rust
pub struct SignalEnvelope {
    pub id: Uuid,
    pub kind: String,      // WRONG - should be enum
    pub payload: String,   // WRONG - should be Arc<SignalVariant>
}
```

This is exactly what the docs say NOT to do.

---

## Target State

**systems/devpulse-engine/src/signals/**:
```
signals/
  mod.rs           # Re-exports
  header.rs        # SignalHeader + SignalSource
  payloads.rs      # Typed payload structs
  variants.rs      # SignalVariant enum
  kinds.rs         # SinkKind enum
  signal.rs        # Signal struct + factories
  router.rs        # SignalRouter (tokio::broadcast)
```

---

## Phase 1: Engine Signal Types

### Task 1.1: Create signals directory structure
- [ ] Create `systems/devpulse-engine/src/signals/` directory
- [ ] Delete old `systems/devpulse-engine/src/signals.rs`

### Task 1.2: Create header.rs (SignalHeader + SignalSource)

**File**: `systems/devpulse-engine/src/signals/header.rs`

```rust
//! Signal header - the 4 atomic requirements for every signal.
//!
//! This is THE envelope. Every signal in the system carries this.

use serde::{Deserialize, Serialize};
use ts_rs::TS;
use uuid::Uuid;

/// Who created this signal - provenance tracking.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SignalSource {
    /// Human input (keyboard, mouse, voice)
    User,
    /// System events (OS, file watcher, process monitor)
    System,
    /// Expert/sub-agent output (LLM reaction)
    Expert,
    /// Timer/scheduled events
    Clock,
}

/// The 4 atomic requirements for every signal.
///
/// This enables:
/// - Tracing: Follow any output back to its input via correlation_id
/// - Replay: Reconstruct sessions from stored headers
/// - Debugging: Know exactly when/where/who created each signal
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SignalHeader {
    /// Unique identity for this signal (Uuid v7 for time-ordering)
    pub id: Uuid,
    /// Links to parent signal for causality tracking (None = root/user input)
    pub correlation_id: Option<Uuid>,
    /// Unix millis at creation time (not emission time)
    pub timestamp: u64,
    /// Who created this signal
    pub source: SignalSource,
}

impl SignalHeader {
    /// Create a new root header (no parent).
    pub fn new(source: SignalSource) -> Self {
        Self {
            id: Uuid::now_v7(),
            correlation_id: None,
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            source,
        }
    }

    /// Create a child header linked to a parent.
    pub fn child_of(parent_id: Uuid, source: SignalSource) -> Self {
        Self {
            id: Uuid::now_v7(),
            correlation_id: Some(parent_id),
            timestamp: std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap()
                .as_millis() as u64,
            source,
        }
    }
}
```

- [ ] File created and compiles

### Task 1.3: Create payloads.rs (Typed payload structs)

**File**: `systems/devpulse-engine/src/signals/payloads.rs`

```rust
//! Typed payloads for each SignalVariant.
//!
//! These are the actual data payloads that signals carry.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Chat message payload - LLM responses, user messages.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ChatPayload {
    pub content: String,
    pub role: ChatRole,
    pub model: Option<String>,
}

/// Chat message role.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum ChatRole {
    User,
    Assistant,
    System,
}

/// Analytics event payload - metrics, usage tracking.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct AnalyticsPayload {
    pub event_type: String,
    pub properties: serde_json::Value,
}

/// Context payload - RAG results, retrieved context.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ContextPayload {
    pub chunks: Vec<ContextChunk>,
    pub query: String,
}

/// A single context chunk from retrieval.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct ContextChunk {
    pub content: String,
    pub source: String,
    pub score: f64,
}

/// Inference metrics payload - model performance data.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct InferencePayload {
    pub tokens_in: u32,
    pub tokens_out: u32,
    pub latency_ms: u64,
    pub model: String,
}

/// System status payload - health checks, state changes.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct SystemPayload {
    pub status: SystemStatus,
    pub message: String,
}

/// System status enum.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SystemStatus {
    Ready,
    Processing,
    Error,
    Shutdown,
}
```

- [ ] File created and compiles

### Task 1.4: Create kinds.rs (SinkKind enum)

**File**: `systems/devpulse-engine/src/signals/kinds.rs`

```rust
//! Sink kinds - where signals get routed.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

/// Destination for signal routing.
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SinkKind {
    /// Broadcast to all subscribers (Desktop, UI updates)
    Broadcast,
    /// Cache layer (moka, fast access)
    Cache,
    /// Durable storage (libsql)
    Durable,
    /// Vector store (embedding search)
    Vector,
    /// Parking lot (deferred processing)
    Parking,
    /// Analytics pipeline (DuckDB)
    Analytics,
}

impl SinkKind {
    /// Get all sink kinds for iteration.
    pub fn all() -> &'static [SinkKind] {
        &[
            SinkKind::Broadcast,
            SinkKind::Cache,
            SinkKind::Durable,
            SinkKind::Vector,
            SinkKind::Parking,
            SinkKind::Analytics,
        ]
    }
}
```

- [ ] File created and compiles

### Task 1.5: Create variants.rs (SignalVariant enum)

**File**: `systems/devpulse-engine/src/signals/variants.rs`

```rust
//! SignalVariant - the master enum of all output payload types.
//!
//! This is what gets broadcast. Each variant carries a typed payload.

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::kinds::SinkKind;
use super::payloads::*;

/// The master enum of all signal output types.
///
/// Each variant maps to specific sinks for routing.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub enum SignalVariant {
    /// Chat message (LLM response, user message)
    Chat(ChatPayload),
    /// Analytics event
    Analytics(AnalyticsPayload),
    /// Retrieved context (RAG)
    Context(ContextPayload),
    /// Inference metrics
    Inference(InferencePayload),
    /// System status change
    System(SystemPayload),
}

impl SignalVariant {
    /// Get the sinks this variant should be routed to.
    pub fn sinks(&self) -> &'static [SinkKind] {
        match self {
            SignalVariant::Chat(_) => &[SinkKind::Broadcast, SinkKind::Durable],
            SignalVariant::Analytics(_) => &[SinkKind::Analytics],
            SignalVariant::Context(_) => &[SinkKind::Broadcast, SinkKind::Cache],
            SignalVariant::Inference(_) => &[SinkKind::Analytics, SinkKind::Cache],
            SignalVariant::System(_) => &[SinkKind::Broadcast],
        }
    }

    /// Get the variant name for logging/debugging.
    pub fn name(&self) -> &'static str {
        match self {
            SignalVariant::Chat(_) => "chat",
            SignalVariant::Analytics(_) => "analytics",
            SignalVariant::Context(_) => "context",
            SignalVariant::Inference(_) => "inference",
            SignalVariant::System(_) => "system",
        }
    }
}
```

- [ ] File created and compiles

### Task 1.6: Create signal.rs (Signal struct + factories)

**File**: `systems/devpulse-engine/src/signals/signal.rs`

```rust
//! Signal - the complete broadcast packet.
//!
//! Signal = SignalHeader + Arc<SignalVariant>
//! This is what gets emitted and broadcast.

use std::sync::Arc;

use serde::{Deserialize, Serialize};
use ts_rs::TS;

use super::header::{SignalHeader, SignalSource};
use super::variants::SignalVariant;

/// The complete signal packet for broadcast.
///
/// Uses Arc for zero-copy fanout to multiple subscribers.
#[derive(Clone, Debug, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct Signal {
    /// The 4 atomic metadata fields
    pub header: SignalHeader,
    /// The typed payload (Arc for zero-copy)
    #[serde(serialize_with = "serialize_arc", deserialize_with = "deserialize_arc")]
    #[ts(type = "SignalVariant")]
    pub payload: Arc<SignalVariant>,
}

fn serialize_arc<S>(arc: &Arc<SignalVariant>, serializer: S) -> Result<S::Ok, S::Error>
where
    S: serde::Serializer,
{
    arc.as_ref().serialize(serializer)
}

fn deserialize_arc<'de, D>(deserializer: D) -> Result<Arc<SignalVariant>, D::Error>
where
    D: serde::Deserializer<'de>,
{
    Ok(Arc::new(SignalVariant::deserialize(deserializer)?))
}

impl Signal {
    /// Create a new root signal (no parent).
    ///
    /// Use this for signals originating from user input or system events.
    pub fn new(source: SignalSource, payload: SignalVariant) -> Self {
        Self {
            header: SignalHeader::new(source),
            payload: Arc::new(payload),
        }
    }

    /// Create a signal caused by another signal.
    ///
    /// Use this for signals that are reactions to other signals.
    /// The correlation_id links back to the parent.
    pub fn caused_by(parent: &Signal, payload: SignalVariant) -> Self {
        Self {
            header: SignalHeader::child_of(parent.header.id, SignalSource::Expert),
            payload: Arc::new(payload),
        }
    }

    /// Create a signal from an existing header and payload.
    pub fn from_parts(header: SignalHeader, payload: SignalVariant) -> Self {
        Self {
            header,
            payload: Arc::new(payload),
        }
    }

    /// Get the payload variant name.
    pub fn variant_name(&self) -> &'static str {
        self.payload.name()
    }
}
```

- [ ] File created and compiles

### Task 1.7: Create router.rs (SignalRouter)

**File**: `systems/devpulse-engine/src/signals/router.rs`

```rust
//! SignalRouter - broadcast channel for signal fanout.
//!
//! Uses tokio::broadcast for multi-subscriber support.

use tokio::sync::broadcast;

use super::signal::Signal;

/// Default channel capacity.
const CHANNEL_CAPACITY: usize = 1024;

/// Signal router for broadcasting signals to multiple subscribers.
pub struct SignalRouter {
    tx: broadcast::Sender<Signal>,
}

impl SignalRouter {
    /// Create a new router with default capacity.
    pub fn new() -> Self {
        let (tx, _) = broadcast::channel(CHANNEL_CAPACITY);
        Self { tx }
    }

    /// Create a new router with custom capacity.
    pub fn with_capacity(capacity: usize) -> Self {
        let (tx, _) = broadcast::channel(capacity);
        Self { tx }
    }

    /// Emit a signal to all subscribers.
    ///
    /// Returns the number of active subscribers that received the signal.
    pub fn emit(&self, signal: Signal) -> usize {
        // send returns Err if no receivers, which is fine
        self.tx.send(signal).unwrap_or(0)
    }

    /// Subscribe to receive signals.
    ///
    /// Returns a receiver that will get all signals emitted after subscription.
    pub fn subscribe(&self) -> broadcast::Receiver<Signal> {
        self.tx.subscribe()
    }

    /// Get the current number of active subscribers.
    pub fn subscriber_count(&self) -> usize {
        self.tx.receiver_count()
    }
}

impl Default for SignalRouter {
    fn default() -> Self {
        Self::new()
    }
}
```

- [ ] File created and compiles

### Task 1.8: Create mod.rs (Re-exports)

**File**: `systems/devpulse-engine/src/signals/mod.rs`

```rust
//! Signal system - the public API for signal-based communication.
//!
//! # Architecture
//!
//! Engine owns the signal types. Maestro subscribes.
//!
//! ```text
//! Desktop → Engine.emit(Signal) → SignalRouter → Maestro.subscribe()
//!                                              → Desktop.subscribe()
//!                                              → Analytics sink
//! ```
//!
//! # Types
//!
//! - `Signal`: Complete broadcast packet (header + payload)
//! - `SignalHeader`: 4 atomic metadata fields
//! - `SignalSource`: Provenance enum
//! - `SignalVariant`: Typed payload enum
//! - `SinkKind`: Routing destinations
//! - `SignalRouter`: Broadcast channel

mod header;
mod kinds;
mod payloads;
mod router;
mod signal;
mod variants;

// Re-export public API
pub use header::{SignalHeader, SignalSource};
pub use kinds::SinkKind;
pub use payloads::*;
pub use router::SignalRouter;
pub use signal::Signal;
pub use variants::SignalVariant;
```

- [ ] File created and compiles

---

## Phase 2: Update Engine lib.rs

### Task 2.1: Update lib.rs to use new signals module

**File**: `systems/devpulse-engine/src/lib.rs`

```rust
pub mod signals;

use devpulse_maestro::Cortex;
use signals::{Signal, SignalRouter, SignalSource, SignalVariant, SystemPayload, SystemStatus};

/// The Engine - public facade for Desktop.
///
/// Engine owns the signal router and exposes a simple API.
/// Maestro subscribes to signals for internal processing.
pub struct Engine {
    cortex: Cortex,
    router: SignalRouter,
}

impl Engine {
    /// Boot the engine.
    pub fn boot() -> Self {
        Self {
            cortex: Cortex::new(),
            router: SignalRouter::new(),
        }
    }

    /// Start the engine and emit ready signal.
    pub fn start(&self) {
        // Emit system ready signal
        let signal = Signal::new(
            SignalSource::System,
            SignalVariant::System(SystemPayload {
                status: SystemStatus::Ready,
                message: "Engine started".to_string(),
            }),
        );
        self.router.emit(signal);
    }

    /// Get a reference to the signal router for subscription.
    pub fn router(&self) -> &SignalRouter {
        &self.router
    }

    /// Emit a signal through the router.
    pub fn emit(&self, signal: Signal) -> usize {
        self.router.emit(signal)
    }
}
```

- [ ] File updated and compiles

---

## Phase 3: Update Engine Cargo.toml

### Task 3.1: Add tokio dependency

**File**: `systems/devpulse-engine/Cargo.toml`

```toml
[package]
name = "devpulse-engine"
version = "0.1.0"
edition = "2021"

[dependencies]
devpulse-maestro = { path = "../../kernel/devpulse-maestro" }
serde = { workspace = true }
serde_json = "1.0"
ts-rs = { workspace = true }
uuid = { workspace = true }
tokio = { workspace = true }
```

- [ ] File updated

---

## Phase 4: Verify Build

### Task 4.1: Build engine crate

```bash
cargo build -p devpulse-engine
```

- [ ] Build passes with no errors

### Task 4.2: Generate TypeScript bindings

```bash
cargo test -p devpulse-engine
```

- [ ] ts-rs exports generate

---

## Phase 5: Maestro Subscription (Kernel Side)

### Task 5.1: Maestro imports from Engine

The key insight: Maestro does NOT define signal types. It IMPORTS them from engine.

**Update**: `kernel/devpulse-maestro/Cargo.toml`

```toml
[dependencies]
# ... existing deps ...

# Engine signals (we subscribe, not define)
devpulse-engine = { path = "../../systems/devpulse-engine" }
```

- [ ] File updated

### Task 5.2: Create signal subscriber in cortex

**File**: `kernel/devpulse-maestro/src/cortex/signals/mod.rs`

```rust
//! Signal subscription for Cortex.
//!
//! Cortex subscribes to Engine signals and processes them internally.

use devpulse_engine::signals::{Signal, SignalRouter, SignalVariant};
use tokio::sync::broadcast;

/// Signal subscriber for Cortex internal processing.
pub struct SignalSubscriber {
    rx: broadcast::Receiver<Signal>,
}

impl SignalSubscriber {
    /// Subscribe to the engine's signal router.
    pub fn new(router: &SignalRouter) -> Self {
        Self {
            rx: router.subscribe(),
        }
    }

    /// Process incoming signals (called in event loop).
    pub async fn recv(&mut self) -> Result<Signal, broadcast::error::RecvError> {
        self.rx.recv().await
    }
}

/// Process a signal based on its variant.
pub fn process_signal(signal: &Signal) {
    match signal.payload.as_ref() {
        SignalVariant::Chat(payload) => {
            // Route to chat processing
            tracing::debug!("Chat signal: {}", payload.content);
        }
        SignalVariant::Analytics(payload) => {
            // Route to analytics sink
            tracing::debug!("Analytics: {}", payload.event_type);
        }
        SignalVariant::Context(payload) => {
            // Route to context processing
            tracing::debug!("Context query: {}", payload.query);
        }
        SignalVariant::Inference(payload) => {
            // Route to metrics collection
            tracing::debug!("Inference: {} tokens", payload.tokens_out);
        }
        SignalVariant::System(payload) => {
            // Handle system events
            tracing::debug!("System: {:?}", payload.status);
        }
    }
}
```

- [ ] File created and compiles

### Task 5.3: Update cortex mod.rs

**File**: `kernel/devpulse-maestro/src/cortex/mod.rs`

```rust
pub mod kv_cache;
pub mod minions;
pub mod persistence;
pub mod reasoning;
pub mod signals;

pub struct Cortex {
    // Brain State
}

impl Cortex {
    pub fn new() -> Self {
        Self {}
    }
}
```

- [ ] File updated and compiles

---

## Phase 6: Final Verification

### Task 6.1: Build all crates

```bash
cargo build -p devpulse-engine
cargo build -p devpulse-maestro
```

- [ ] Both build with no errors

### Task 6.2: Verify no circular dependency

Engine depends on Maestro for Cortex.
Maestro depends on Engine for signals.

This creates a circular dependency. We need to resolve it.

**Resolution**: Engine should NOT depend on Maestro directly. Instead:
- Engine is pure signals + router
- A higher-level crate wires Engine + Maestro together

---

## Phase 7: Resolve Circular Dependency

### Task 7.1: Remove Maestro dependency from Engine

Engine should be standalone. Cortex instantiation moves to app layer.

**File**: `systems/devpulse-engine/src/lib.rs`

```rust
pub mod signals;

use signals::{Signal, SignalRouter, SignalSource, SignalVariant, SystemPayload, SystemStatus};

/// The Engine - signal router and public API.
///
/// Engine owns the signal router. Cortex is injected by app layer.
pub struct Engine {
    router: SignalRouter,
}

impl Engine {
    /// Boot the engine.
    pub fn boot() -> Self {
        Self {
            router: SignalRouter::new(),
        }
    }

    /// Start the engine and emit ready signal.
    pub fn start(&self) {
        let signal = Signal::new(
            SignalSource::System,
            SignalVariant::System(SystemPayload {
                status: SystemStatus::Ready,
                message: "Engine started".to_string(),
            }),
        );
        self.router.emit(signal);
    }

    /// Get a reference to the signal router.
    pub fn router(&self) -> &SignalRouter {
        &self.router
    }

    /// Emit a signal through the router.
    pub fn emit(&self, signal: Signal) -> usize {
        self.router.emit(signal)
    }
}
```

**File**: `systems/devpulse-engine/Cargo.toml`

```toml
[package]
name = "devpulse-engine"
version = "0.1.0"
edition = "2021"

[dependencies]
serde = { workspace = true }
serde_json = "1.0"
ts-rs = { workspace = true }
uuid = { workspace = true }
tokio = { workspace = true }
```

- [ ] Engine no longer depends on Maestro
- [ ] Engine builds standalone

### Task 7.2: Maestro imports Engine signals

**File**: `kernel/devpulse-maestro/Cargo.toml`

```toml
[package]
name = "devpulse-maestro"
version = "0.1.0"
edition = "2021"

[dependencies]
# Core
serde = { workspace = true }
serde_json = "1.0"
uuid = { workspace = true }
tokio = { workspace = true }
anyhow = { workspace = true }
thiserror = { workspace = true }
futures = "0.3"
tracing = "0.1"

# Persistence Layer
libsql = { workspace = true }
duckdb = { workspace = true }
surrealdb = { workspace = true }

# Engine signals (we subscribe, not define)
devpulse-engine = { path = "../../systems/devpulse-engine" }
```

- [ ] Maestro depends on Engine (no circular)
- [ ] Maestro builds

---

## Verification Checkpoint

After all tasks:

- [ ] `cargo build -p devpulse-engine` passes
- [ ] `cargo build -p devpulse-maestro` passes
- [ ] No circular dependencies
- [ ] Signal types are enum-based (not strings)
- [ ] SignalHeader has 4 atomic fields
- [ ] SignalRouter uses tokio::broadcast

---

## Files Changed Summary

### New Files
```
systems/devpulse-engine/src/signals/mod.rs
systems/devpulse-engine/src/signals/header.rs
systems/devpulse-engine/src/signals/payloads.rs
systems/devpulse-engine/src/signals/kinds.rs
systems/devpulse-engine/src/signals/variants.rs
systems/devpulse-engine/src/signals/signal.rs
systems/devpulse-engine/src/signals/router.rs
kernel/devpulse-maestro/src/cortex/signals/mod.rs
```

### Modified Files
```
systems/devpulse-engine/src/lib.rs
systems/devpulse-engine/Cargo.toml
kernel/devpulse-maestro/Cargo.toml
kernel/devpulse-maestro/src/cortex/mod.rs
```

### Deleted Files
```
systems/devpulse-engine/src/signals.rs
```
