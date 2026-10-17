# Signal Atomic Contract

## Minimal Requirements Checklist

**Every signal in the system MUST satisfy these 5 requirements before it can exist.**

This is Header Standardization (like TCP/IP packets) - enables:
- Time Travel Debugging
- Causality Tracking
- Distributed Tracing
- Replay

---

## The 5 Atomic Requirements

| # | Requirement | Field | Type | Purpose |
|---|-------------|-------|------|---------|
| 1 | **Identity** | `id` | `Uuid` | Unique ID for this specific event instance |
| 2 | **Causality** | `correlation_id` | `Option<Uuid>` | ID of parent signal (None = root/user input) |
| 3 | **Temporality** | `timestamp` | `u64` | Unix millis at creation (not emission) |
| 4 | **Provenance** | `source` | `SignalSource` | Who created this signal |
| 5 | **Payload** | `payload` | `Arc<SignalVariant>` | The actual data (zero-copy) |

---

## Signal Structure

```
┌─────────────────────────────────────────────────────────┐
│                        Signal                            │
├─────────────────────────────────────────────────────────┤
│  ┌───────────────────────────────────────────────────┐  │
│  │                  SignalHeader                      │  │
│  │  ┌─────────────┬──────────────────────────────┐   │  │
│  │  │ id          │ Uuid (v7 for time-ordering)  │   │  │
│  │  ├─────────────┼──────────────────────────────┤   │  │
│  │  │ correlation │ Option<Uuid> (parent link)   │   │  │
│  │  ├─────────────┼──────────────────────────────┤   │  │
│  │  │ timestamp   │ u64 (unix millis)            │   │  │
│  │  ├─────────────┼──────────────────────────────┤   │  │
│  │  │ source      │ SignalSource enum            │   │  │
│  │  └─────────────┴──────────────────────────────┘   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              Arc<SignalVariant>                    │  │
│  │  (Zero-copy payload - Chat, Analytics, etc.)      │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## SignalSource Enum

```rust
#[derive(Clone, Copy, Debug, PartialEq, Eq, Serialize, Deserialize)]
pub enum SignalSource {
    /// User input (keyboard, mouse, voice)
    User,

    /// System events (OS, file watcher, process monitor)
    System,

    /// Expert/sub-agent output (the llm reacting)
    Expert,

    /// Timer/scheduled events
    Clock,
}
```

---

## Factory Pattern (The Gatekeeper)

**Rule: Never manually construct `Signal`. Use factories.**

### Root Signal (New chain)

```rust
let signal = Signal::new(SignalSource::User, SignalVariant::Chat(payload));
// Creates:
// - id: new Uuid
// - correlation_id: None (this IS the root)
// - timestamp: now
// - source: User
```

### Reaction Signal (Chained)

```rust
let response = Signal::caused_by(&parent_signal, SignalVariant::Inference(metrics));
// Creates:
// - id: new Uuid
// - correlation_id: Some(parent.header.id)  <-- LINKS TO PARENT
// - timestamp: now
// - source: Expert
```

---

## Validation Checklist

Before a signal can be emitted, verify:

- [ ] `id` is set (Uuid v7 preferred for time-ordering)
- [ ] `correlation_id` is properly linked (None for root, Some for reactions)
- [ ] `timestamp` is set at creation time (not emission time)
- [ ] `source` correctly identifies the originator
- [ ] `payload` is wrapped in Arc (zero-copy)

---

## Integration Points

| Component | How it uses Signal |
|-----------|-------------------|
| **Engine Router** | `router.emit(signal)` - broadcasts to channel |
| **Desktop** | `router.subscribe()` - receives for UI updates |
| **Conduit** | `router.subscribe()` - routes to sinks based on variant |
| **Analytics** | Reads `correlation_id` to build causality graphs |
| **Replay** | Uses `timestamp` + `id` for ordering |
| **Debugging** | Traces `correlation_id` chain to find root cause |

---

## Naming Convention

| Term | Meaning |
|------|---------|
| `Signal` | The complete packet (header + payload) |
| `SignalHeader` | The 4-field metadata (id, correlation, timestamp, source) |
| `SignalVariant` | The payload enum (Chat, Analytics, Context, etc.) |
| `SignalSource` | Provenance enum (User, System, Expert, Clock) |
| `Conduit` | The orchestrator subscriber that routes to sinks |

---

## Blocked Until

- [ ] This contract reviewed and approved
