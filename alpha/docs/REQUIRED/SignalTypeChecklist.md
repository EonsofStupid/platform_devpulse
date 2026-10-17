# DevPulse Signal System

## The Unified Model

DevPulse has ONE signal system with TWO phases:

```
INPUT PHASE                              OUTPUT PHASE
(what happened)                          (what to broadcast)
─────────────────────────────────────────────────────────────────────

  Keystroke                               ChatPayload
  UserMessage        ┌─────────────┐      AnalyticsPayload
  FileSaved     ───► │ ORCHESTRATOR│ ───► ContextPayload
  WindowFocus        │   (llm)   │      InferencePayload
  etc.               └─────────────┘      etc.

  SignalKind                              SignalVariant
  (enum in shared)                        (enum in engine)
```

**SignalKind** = Domain events (inputs). What happened in the world.
**SignalVariant** = Broadcast payloads (outputs). What to tell consumers.

Both use the SAME **SignalHeader** for tracing. That's the unification.

---

## Data Flow (Complete Path)

```
┌──────────────────────────────────────────────────────────────────────┐
│ 1. INPUT EVENT                                                       │
│    User types 'H' → Keystroke { char: 'H', timestamp_ms: 123 }       │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 2. WRAP IN TOON (orchestrator's wire envelope)                       │
│                                                                      │
│    Toon {                                                            │
│        header: SignalHeader { id, correlation_id, timestamp, source }│
│        signal: SignalKind::Keystroke { char: 'H', ... }              │
│        project_id, session_id, hop_id, hop_depth                     │
│    }                                                                 │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 3. ORCHESTRATOR PROCESSES (llm - IP protected)                     │
│                                                                      │
│    - Checks SignalProfile (routing decision from SignalKind)         │
│    - Reflex? → immediate response, no LLM                            │
│    - Rumination? → full CAG pipeline, LLM inference                  │
│    - Creates output payload (ChatPayload, AnalyticsPayload, etc.)    │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 4. WRAP IN SIGNAL (engine's broadcast envelope)                      │
│                                                                      │
│    Signal {                                                          │
│        header: SignalHeader { id, correlation_id, timestamp, source }│
│        payload: Arc<SignalVariant::Chat(ChatPayload { ... })>        │
│    }                                                                 │
│                                                                      │
│    Note: correlation_id links back to original Toon's id             │
└──────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌──────────────────────────────────────────────────────────────────────┐
│ 5. BROADCAST VIA ROUTER                                              │
│                                                                      │
│    SignalRouter.emit(signal)                                         │
│        │                                                             │
│        ├──► Desktop (UI updates)                                     │
│        ├──► Analytics sink (DuckDB)                                  │
│        ├──► Cache sink (moka)                                        │
│        └──► Vector sink (RRO)                                     │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Why Two Enums?

**Q: Why not just one SignalKind for everything?**

A: Because inputs and outputs serve different purposes:

| Aspect | SignalKind (Input) | SignalVariant (Output) |
|--------|-------------------|------------------------|
| Purpose | Capture what happened | Broadcast processed results |
| Contains | Raw event data | Processed payloads |
| Used by | Orchestrator (routing) | Desktop (display) |
| Lifetime | Created once, consumed | Broadcast to N subscribers |
| Ownership | shared (SSOT) | engine (public API) |

**Q: Why not put SignalVariant in shared too?**

A: IP protection. SignalVariant payloads reveal HOW we process data.
SignalKind is just "what happened" - safe to share.
SignalVariant is "what we computed" - our secret sauce.

---

## The Unifying Contract: SignalHeader

Every signal (input OR output) carries the same 4 fields:

```rust
// shared/src/types/header.rs - THE SSOT

pub struct SignalHeader {
    pub id: Uuid,                      // 1. Identity (v7 = time-ordered)
    pub correlation_id: Option<Uuid>,  // 2. Causality (links to parent)
    pub timestamp: u64,                // 3. Temporality (unix millis)
    pub source: SignalSource,          // 4. Provenance (who created it)
}

pub enum SignalSource {
    User,    // Human input (keyboard, mouse, voice)
    System,  // OS events (file watcher, process monitor)
    Expert,  // Sub-agent output (llm reaction)
    Clock,   // Timer/scheduled events
}
```

This enables:
- **Tracing**: Follow any output back to its input via correlation_id
- **Replay**: Reconstruct sessions from stored headers
- **Debugging**: Know exactly when/where/who created each signal

---

## Ownership Rules

```
┌─────────────────────────────────────────────────────────────────────┐
│                         shared (SSOT)                               │
│                                                                     │
│  SignalHeader ─────────┬──────────────────────────────────────────► │
│  SignalSource ─────────┤                                            │
│  SignalKind ───────────┤                                            │
│  SignalProfile ────────┘                                            │
│                                                                     │
│  RULE: Define ONCE here. Everyone else IMPORTS.                     │
└─────────────────────────────────────────────────────────────────────┘
         │                                    │
         │ imports                            │ imports
         ▼                                    ▼
┌────────────────────────┐      ┌────────────────────────────────────┐
│   orchestrator (IP)    │      │         engine (Public API)        │
│                        │      │                                    │
│  Toon ─────────────────│      │  Signal ───────────────────────────│
│   ├─ header: SignalHeader     │   ├─ header: SignalHeader          │
│   └─ signal: SignalKind       │   └─ payload: Arc<SignalVariant>   │
│                        │      │                                    │
│  RULE: Embed, don't   │      │  SignalVariant ─────────────────────│
│  redefine.            │      │  SignalRouter ──────────────────────│
│                        │      │  SinkKind ─────────────────────────│
└────────────────────────┘      │                                    │
                                │  RULE: Broadcast types live here.  │
                                └────────────────────────────────────┘
```

---

## Type Reference

### shared/src/types/

| File | Type | Purpose |
|------|------|---------|
| `header.rs` | `SignalHeader` | 4 atomic fields (id, correlation_id, timestamp, source) |
| `header.rs` | `SignalSource` | Provenance enum (User, System, Expert, Clock) |
| `signal.rs` | `SignalKind` | Domain events enum (Keystroke, UserMessage, etc.) |
| `profile.rs` | `SignalProfile` | Routing decisions (processing tier, model, tools, collections) |
| `profile.rs` | `Processing` | Reflex / Rumination / Archive |
| `profile.rs` | `ModelTier` | None / Minion / Llm |
| `ids.rs` | `SessionId`, `ProjectId`, `BlobHash`, `HopId` | Typed IDs |

### orchestrator/src/types/

| File | Type | Purpose |
|------|------|---------|
| `toon.rs` | `Toon` | Wire envelope (header + SignalKind + context) |

### engine/src/signals/

| File | Type | Purpose |
|------|------|---------|
| `signal.rs` | `Signal` | Broadcast envelope (header + Arc<SignalVariant>) |
| `variants.rs` | `SignalVariant` | Output payloads enum (Chat, Analytics, etc.) |
| `payloads.rs` | `ChatPayload`, etc. | Individual payload structs |
| `kinds.rs` | `SinkKind` | Where signals go (Broadcast, Cache, Durable, etc.) |
| `router.rs` | `SignalRouter` | tokio::broadcast channel |

---

## Adding a New Signal

### Input Signal (something happened in the world)

Add to `shared/src/types/signal.rs`:

```rust
pub enum SignalKind {
    // ... existing ...

    /// Description of new event
    MyNewEvent { field1: String, field2: i64 },
}

impl SignalKind {
    pub fn profile(&self) -> SignalProfile {
        match self {
            // ... existing ...

            SignalKind::MyNewEvent { .. } => SignalProfile::reflex()
                .with_priority(50),
        }
    }
}
```

Verify: `cargo check -p shared && cargo check -p orchestrator`

### Output Signal (something to broadcast)

Add to `engine/src/signals/payloads.rs`:

```rust
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct MyNewPayload {
    pub field1: String,
    pub field2: i64,
}
```

Add to `engine/src/signals/variants.rs`:

```rust
pub enum SignalVariant {
    // ... existing ...
    MyNew(MyNewPayload),
}

impl SignalVariant {
    pub fn sinks(&self) -> &'static [SinkKind] {
        match self {
            // ... existing ...
            Self::MyNew(_) => &[SinkKind::Broadcast, SinkKind::Analytics],
        }
    }

    pub fn name(&self) -> &'static str {
        match self {
            // ... existing ...
            Self::MyNew(_) => "my_new",
        }
    }
}
```

Verify: `cargo check -p engine`

---

## Validation Commands

```bash
# All crates must compile
cargo check -p shared && cargo check -p orchestrator && cargo check -p engine

# SSOT verification (each must return exactly 1 result in src/, not docs/)
grep -rn "pub struct SignalHeader" alpha/shared/src/  # Must be 1
grep -rn "pub enum SignalSource" alpha/shared/src/    # Must be 1
grep -rn "pub enum SignalKind" alpha/shared/src/      # Must be 1

# No duplicates in other crates
grep -rn "pub struct SignalHeader" alpha/engine/src/       # Must be 0
grep -rn "pub struct SignalHeader" alpha/orchestrator/src/ # Must be 0
grep -rn "pub enum SignalSource" alpha/engine/src/         # Must be 0
grep -rn "pub enum SignalSource" alpha/orchestrator/src/   # Must be 0
```

---

## Quick Mental Model

```
User types 'H'
    │
    ▼
SignalKind::Keystroke { char: 'H' }     ← INPUT (what happened)
    │
    ▼
Toon { header, signal: SignalKind }     ← WIRE ENVELOPE
    │
    ▼
[Orchestrator processes]                 ← LLM (IP)
    │
    ▼
SignalVariant::Chat(ChatPayload)        ← OUTPUT (what to broadcast)
    │
    ▼
Signal { header, payload: Arc<...> }    ← BROADCAST ENVELOPE
    │
    ▼
SignalRouter.emit()                     ← FANOUT
    │
    ├──► Desktop (UI)
    ├──► Analytics (DuckDB)
    └──► Vector (RRO)
```

**One system. Two phases. Same header. Full traceability.**
