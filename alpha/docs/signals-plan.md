# Signal Architecture Plan

## Philosophy

- **Enum dispatch, not JSON** - `SignalVariant` enum, zero parse cost
- **Compile-time dispatch** - `const SINKS`, compiler-checked
- **Lazy serialization** - only at IO boundary (network/disk), never internal
- **Engine owns public signals** - inputs
- **Orchestrator owns transformation** - raw → processed (IP hidden)

---

## The Problem with JSON

```rust
// BAD - Web App thinking
pub struct Signal {
    pub payload: serde_json::Value,  // Heap alloc + parsing cost
}
// 100 signals = 100 JSON serializations inside Rust. Slow.
```

## The Solution: Master Enum

```rust
// GOOD - System thinking
#[derive(Clone, Debug)]
pub enum SignalVariant {
    Chat(ChatPayload),
    Analytics(AnalyticsPayload),
    Context(ContextPayload),
    Inference(InferencePayload),
    Debug(DebugPayload),
}

#[derive(Clone, Debug)]
pub struct Signal {
    pub variant: Arc<SignalVariant>,  // Arc = zero-copy sharing, no cloning 10KB strings
    pub timestamp: i64,
}
```

**Why this is better:**
- **Zero parse cost** - Orchestrator receives `SignalVariant::Chat(payload)`, no parsing
- **Compiler checks** - Add new signal, forget to handle it → compiler error
- **Arc sharing** - One allocation, many subscribers, no cloning 10KB chat messages
- **Decoupled** - Router broadcasts, Orchestrator subscribes (no circular dependency)

---

## Crate Responsibilities

| Crate | Owns | Exposes |
|-------|------|---------|
| `engine` | SignalVariant, SinkKind, Router, Payloads | Public emit API |
| `orchestrator` | Signal processing, transformation | Nothing (IP) |
| `shared` | Only IDs (SessionId, etc.) | Minimal alignment |

---

## Module 1: Engine Signals

### Phase 0: Boundary

| Item | Value |
|------|-------|
| Crate | `engine` |
| Module | `engine/src/signals/` |
| Depends on | `shared` (IDs only) |
| Consumers | `desktop`, `lab` |

### Target Structure

```
engine/src/signals/
├── mod.rs              # Re-exports
├── kinds.rs            # SinkKind enum
├── payloads.rs         # Payload structs (Serialize/Deserialize)
├── variants.rs         # SignalVariant master enum
├── signal.rs           # Signal, SignalHeader, SignalSource, factories
└── router.rs           # Router with emit()
```

### Phase 1: Contract

```rust
// engine/src/signals/kinds.rs

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub enum SinkKind {
    Broadcast,   // tokio::broadcast → UI updates
    Cache,       // moka → hot session data
    Durable,     // libSQL → persist
    Vector,      // RRO → embeddings
    Parking,     // fjall → large blobs
    Analytics,   // DuckDB → metrics
}
```

```rust
// engine/src/signals/payloads.rs

use shared::types::ids::SessionId;
use serde::{Serialize, Deserialize};

#[derive(Clone, Debug)]
pub struct ChatPayload {
    pub session_id: SessionId,
    pub role: Role,
    pub content: String,
}

#[derive(Clone, Debug)]
pub struct AnalyticsPayload {
    pub event_type: AnalyticsEvent,
    pub value: i64,
}

#[derive(Clone, Debug)]
pub struct ContextPayload {
    pub query: String,
    pub chunk_ids: Vec<String>,
    pub scores: Vec<f32>,
}

#[derive(Clone, Debug)]
pub struct InferencePayload {
    pub model_id: String,
    pub tokens_in: u32,
    pub tokens_out: u32,
    pub latency_ms: u32,
}

#[derive(Clone, Debug)]
pub struct DebugPayload {
    pub level: DebugLevel,
    pub message: String,
}

#[derive(Clone, Copy, Debug)]
pub enum Role { User, Assistant, System }

#[derive(Clone, Copy, Debug)]
pub enum DebugLevel { Trace, Debug, Info, Warn, Error }

#[derive(Clone, Copy, Debug)]
pub enum AnalyticsEvent {
    MessageSent,
    MessageReceived,
    ContextRetrieved,
    Adapterswitched,
    SessionStarted,
    SessionEnded,
}
```

```rust
// engine/src/signals/variants.rs

use super::payloads::*;

/// Master enum - all signal types
/// Compiler-checked exhaustive matching
#[derive(Clone, Debug)]
pub enum SignalVariant {
    Chat(ChatPayload),
    Analytics(AnalyticsPayload),
    Context(ContextPayload),
    Inference(InferencePayload),
    Debug(DebugPayload),
}

impl SignalVariant {
    /// Get sinks for this variant - compile-time known
    pub fn sinks(&self) -> &'static [SinkKind] {
        match self {
            Self::Chat(_) => &[SinkKind::Broadcast, SinkKind::Cache, SinkKind::Durable],
            Self::Analytics(_) => &[SinkKind::Analytics],
            Self::Context(_) => &[SinkKind::Cache, SinkKind::Vector],
            Self::Inference(_) => &[SinkKind::Broadcast, SinkKind::Analytics],
            Self::Debug(_) => &[SinkKind::Broadcast],
        }
    }

    /// Signal name for logging
    pub fn name(&self) -> &'static str {
        match self {
            Self::Chat(_) => "chat",
            Self::Analytics(_) => "analytics",
            Self::Context(_) => "context",
            Self::Inference(_) => "inference",
            Self::Debug(_) => "debug",
        }
    }
}
```

```rust
// engine/src/signals/signal.rs
// See: docs/SIGNAL_CONTRACT.md for full specification
// See: docs/REQUIRED/SignalTypeChecklist.md for adding new signals

use super::variants::SignalVariant;
use std::sync::Arc;
use uuid::Uuid;
use serde::{Serialize, Deserialize};

/// Signal header - 4 atomic requirements for tracing/replay
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct SignalHeader {
    pub id: Uuid,                      // Identity (v7 for time-ordering)
    pub correlation_id: Option<Uuid>,  // Causality (None = root)
    pub timestamp: u64,                // Temporality (unix millis)
    pub source: SignalSource,          // Provenance
}

/// Signal provenance
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum SignalSource {
    User,    // Human input (keyboard, mouse, voice)
    System,  // OS events (file watcher, process monitor)
    Expert,  // Sub-agent output (llm reaction)
    Clock,   // Timer/scheduled events
}

#[derive(Clone, Debug)]
pub struct Signal {
    pub header: SignalHeader,
    pub payload: Arc<SignalVariant>,  // Zero-copy sharing
}

impl Signal {
    /// Create a root signal (new causality chain)
    pub fn new(source: SignalSource, variant: SignalVariant) -> Self {
        Self {
            header: SignalHeader {
                id: Uuid::now_v7(),
                correlation_id: None,  // Root = no parent
                timestamp: current_time_millis(),
                source,
            },
            payload: Arc::new(variant),
        }
    }

    /// Create a chained signal (reaction to parent)
    pub fn caused_by(parent: &Signal, variant: SignalVariant) -> Self {
        Self {
            header: SignalHeader {
                id: Uuid::now_v7(),
                correlation_id: Some(parent.header.id),  // Links to parent
                timestamp: current_time_millis(),
                source: SignalSource::Expert,
            },
            payload: Arc::new(variant),
        }
    }
}
```

```rust
// engine/src/signals/router.rs
//
// CRITICAL: Router is DUMB. It just broadcasts.
// Orchestrator subscribes as a listener - NO circular dependency.

use super::{Signal, SignalVariant};
use tokio::sync::broadcast;

pub struct SignalRouter {
    broadcast_tx: broadcast::Sender<Signal>,
}

impl SignalRouter {
    pub fn new(buffer_size: usize) -> Self {
        let (tx, _) = broadcast::channel(buffer_size);
        Self { broadcast_tx: tx }
    }

    /// Emit a signal - fire and forget
    /// Arc wrapping happens in Signal::new()
    pub fn emit(&self, variant: SignalVariant) {
        let envelope = Signal::new(variant);
        // Just broadcast. That's it. Orchestrator subscribes separately.
        let _ = self.broadcast_tx.send(envelope);
    }

    /// Subscribe to the signal stream
    /// Used by: Desktop (UI updates), Orchestrator (sink processing)
    pub fn subscribe(&self) -> broadcast::Receiver<Signal> {
        self.broadcast_tx.subscribe()
    }
}
```

### Phase 2: Observability

- `#[instrument]` on `emit()` with `variant.name()`
- TRACE: Every emission
- DEBUG: Sink routing
- INFO: Counts per signal type (batched)
- ERROR: Sink failures

### Phase 3: Tests

- [ ] `test_chat_routes_to_three_sinks`
- [ ] `test_match_exhaustive` - compiler enforces
- [ ] `test_broadcast_receives_envelope`
- [ ] `test_no_json_serialization_internal`

### Phase 4: Docs

- [ ] `//!` module doc with flow diagram
- [ ] `///` on SignalVariant with examples

### Phase 5: Security

- [ ] Debug signals gated by diagnostic_mode
- [ ] No sensitive data in payloads without consent

---

## Module 2: Orchestrator Signal Processing (IP)

### Phase 0: Boundary

| Item | Value |
|------|-------|
| Crate | `orchestrator` |
| Module | `orchestrator/src/signals/` (PRIVATE) |
| Depends on | `engine::signals` (types only) |
| Exposes | Nothing |

### The IP Flow

```
Engine (Public)              Orchestrator (Private - IP)
───────────────              ──────────────────────────
SignalVariant::Chat(raw)  →  process()
                                 │
                                 ▼
                             Transform (IP algorithms)
                                 │
                                 ▼
                             RichContext (vectorized, reranked)
                                 │
                                 ▼
                             Store RichContext, not raw Chat
```

**This ensures:** Even if someone clones engine, they get inputs, not intelligence.

### Target Structure

```
orchestrator/src/signals/
├── mod.rs              # pub(crate) only
├── conduit.rs          # Conduit struct (IP)
├── processor.rs        # SignalProcessor
└── sinks/
    ├── mod.rs
    ├── cache.rs        # moka sink
    ├── durable.rs      # libSQL sink
    ├── analytics.rs    # DuckDB sink
    └── vector.rs       # RRO sink
```

### Phase 1: Contract

```rust
// orchestrator/src/signals/conduit.rs (PRIVATE)
//
// THE CONDUIT: Orchestrator subscribes to router, processes sinks.
// This is the DECOUPLED pattern - no circular dependency.

use engine::signals::{Signal, SignalRouter, SinkKind};
use tokio::sync::broadcast;

/// Conduit - the signal pipeline from Engine to sinks
pub(crate) struct Conduit {
    processor: SignalProcessor,
}

impl Conduit {
    pub fn new(processor: SignalProcessor) -> Self {
        Self { processor }
    }

    /// Run the conduit - subscribes to router and processes signals
    pub async fn run(&self, router: &SignalRouter) {
        let mut rx = router.subscribe();

        loop {
            match rx.recv().await {
                Ok(signal) => {
                    // Route to appropriate sinks based on variant
                    let sinks = signal.payload.sinks();
                    for sink in sinks {
                        match sink {
                            SinkKind::Broadcast => {
                                // Desktop handles this via its own subscribe()
                            }
                            _ => {
                                // All other sinks processed here (IP)
                                self.processor.process(*sink, &signal).await;
                            }
                        }
                    }
                }
                Err(broadcast::error::RecvError::Lagged(n)) => {
                    tracing::warn!("Conduit lagged by {} messages", n);
                }
                Err(broadcast::error::RecvError::Closed) => {
                    tracing::info!("Signal router closed, shutting down conduit");
                    break;
                }
            }
        }
    }
}
```

```rust
// orchestrator/src/signals/processor.rs (PRIVATE)

use engine::signals::{Signal, SinkKind};

pub(crate) struct SignalProcessor {
    cache: moka::Cache<String, Vec<u8>>,
    analytics: Analytics,
    // etc.
}

impl SignalProcessor {
    pub(crate) async fn process(&self, sink: SinkKind, envelope: &Signal) {
        match sink {
            SinkKind::Cache => self.to_cache(envelope).await,
            SinkKind::Durable => self.to_durable(envelope).await,
            SinkKind::Analytics => self.to_analytics(envelope).await,
            SinkKind::Vector => self.to_vector(envelope).await,
            SinkKind::Parking => self.to_parking(envelope).await,
            SinkKind::Broadcast => {} // Desktop handles via subscribe()
        }
    }

    // Implementation hidden - IP
    async fn to_cache(&self, envelope: &Signal) {
        // Transform + store
    }

    async fn to_durable(&self, envelope: &Signal) {
        // libSQL persistence
    }

    async fn to_analytics(&self, envelope: &Signal) {
        // DuckDB metrics
    }

    async fn to_vector(&self, envelope: &Signal) {
        // RRO embeddings
    }

    async fn to_parking(&self, envelope: &Signal) {
        // fjall large blobs
    }
}
```

### Phase 2-5: Same pattern

---

## Signal Flow Diagram

```
User Action
    │
    ▼
┌────────────────────────────────────────────────────────────────┐
│                           ENGINE                                │
│                                                                 │
│  router.emit(SignalVariant::Chat(payload))                     │
│       │                                                         │
│       │  Arc::new(variant) → broadcast_tx.send(envelope)       │
│       │  (DUMB router - just broadcast, nothing else)          │
│       │                                                         │
│       └────────────────┬───────────────────────────────────────│
│                        │ tokio::broadcast channel               │
│                        │ (Arc<SignalVariant> = zero-copy)      │
└────────────────────────┼───────────────────────────────────────┘
                         │
           ┌─────────────┴─────────────┐
           │                           │
           ▼                           ▼
┌───────────────────┐     ┌──────────────────────────────────────┐
│     DESKTOP       │     │         ORCHESTRATOR (IP)             │
│                   │     │                                        │
│  router.subscribe │     │  conduit.run()                         │
│        │          │     │        │                               │
│        ▼          │     │        ▼                               │
│  for envelope in  │     │  for envelope in rx.recv() {          │
│    rx.recv() {    │     │      let sinks = variant.sinks();     │
│    update_ui()    │     │      for sink in sinks {              │
│  }                │     │          processor.process(sink)      │
│                   │     │      }                                 │
│  (instant updates)│     │  }                                     │
│                   │     │                                        │
│                   │     │  ├── to_cache() → moka                │
│                   │     │  ├── to_durable() → libSQL            │
│                   │     │  ├── to_vector() → RRO             │
│                   │     │  └── to_analytics() → DuckDB          │
│                   │     │                                        │
│                   │     │  (HOW it transforms = IP, hidden)     │
└───────────────────┘     └──────────────────────────────────────┘

KEY INSIGHT: No circular dependency!
- Engine EXPORTS: SignalRouter, Signal, SignalVariant, SinkKind
- Orchestrator IMPORTS: above types, calls router.subscribe()
- Engine NEVER imports from Orchestrator
```

---

## Comparison: Your Draft vs Fixed

| Feature | Draft | Fixed | Why |
|---------|-------|-------|-----|
| Payload | `serde_json::Value` | `SignalVariant` enum | 100x faster, type-safe |
| Identification | `kind: &'static str` | `match variant` | No string compare |
| Serialization | Immediate to JSON | Lazy (IO boundary only) | Zero internal cost |
| Routing | `const SINKS` | `variant.sinks()` | Same, on enum |
| Sharing | Clone strings | `Arc<SignalVariant>` | Zero-copy, one alloc |
| Coupling | Router calls orchestrator | Orchestrator subscribes | No circular deps |

---

## Implementation Order

### Engine (Public API) - ✅ COMPLETED
1. `engine/src/signals/kinds.rs` - SinkKind enum
2. `engine/src/signals/payloads.rs` - Payload structs (with Serialize/Deserialize)
3. `engine/src/signals/variants.rs` - SignalVariant master enum
4. `engine/src/signals/signal.rs` - Signal, SignalHeader, SignalSource, factories
5. `engine/src/signals/router.rs` - DUMB router (just broadcast)
6. `engine/src/signals/mod.rs` - Re-exports
7. Update `engine/src/lib.rs` - export signals module

### Orchestrator (IP - subscribes to engine)
8. `orchestrator/src/signals/conduit.rs` - Conduit struct
9. `orchestrator/src/signals/processor.rs` - SignalProcessor
10. `orchestrator/src/signals/sinks/*.rs` - Individual sink implementations
11. Wire in orchestrator init - spawn conduit task

### Integration
12. Engine gets `router: SignalRouter` field
13. On engine init, pass router to orchestrator for subscription
14. Desktop subscribes for UI updates

---

## Blocked Until

- [ ] This plan reviewed and approved
