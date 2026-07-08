# Sprint 2: Governance Signals

| Field | Value |
|-------|-------|
| **Parent** | Claude Integration Plan |
| **Status** | `PLANNED` |
| **Depends on** | Sprint 1 (feature gate) |
| **Files** | 3 modified |

---

## PRE-FLIGHT

- [ ] Read `signals/payloads.rs` — understand existing payload pattern
- [ ] Read `signals/variants.rs` — understand variant + sinks pattern
- [ ] Read `signals/mod.rs` — verify re-export pattern

---

## CHANGES

### 1. `systems/devpulse-engine/src/signals/payloads.rs`

Add after SystemPayload section:

```rust
// =============================================================================
// GOVERNANCE
// =============================================================================

/// Governance event payload — lane routing, rate limiting, council arbitration.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub struct GovernancePayload {
    /// What happened.
    pub event: GovernanceEvent,
    /// Which lane triggered this. "internal" or "api".
    pub lane: String,
    /// Provider involved (if applicable). "claude", "gpt", "gemini".
    pub provider: Option<String>,
    /// Human-readable detail.
    pub detail: String,
}

/// Governance event classification.
#[derive(Clone, Debug, Serialize, Deserialize, Type)]
pub enum GovernanceEvent {
    /// A provider was selected for a request.
    ProviderSelected,
    /// Rate limit hit — request queued or rejected.
    RateLimitHit,
    /// Daily budget threshold reached (warning or hard stop).
    BudgetThresholdReached,
    /// Cooldown period started after 429 response.
    CooldownStarted,
    /// Cooldown period ended — lane available again.
    CooldownEnded,
    /// Council chose between multiple lane responses.
    CouncilArbitration,
    /// Request escalated from one lane to another.
    LaneEscalation,
}
```

### 2. `systems/devpulse-engine/src/signals/variants.rs`

Add variant + import:

```rust
// Add to use statement:
use super::payloads::{
    AnalyticsPayload, ChatPayload, ContextPayload, GovernancePayload,
    InferencePayload, SystemPayload,
};

// Add to SignalVariant enum:
/// Governance event (lane routing, rate limits, council).
Governance(GovernancePayload),

// Add to sinks() match:
SignalVariant::Governance(_) => &[SinkKind::Broadcast, SinkKind::Analytics],

// Add to name() match:
SignalVariant::Governance(_) => "governance",
```

### 3. `systems/devpulse-engine/src/signals/mod.rs`

Add re-export:
```rust
pub use payloads::{GovernancePayload, GovernanceEvent};
```

---

## VERIFICATION

- [ ] `cargo check -p devpulse-engine` — 0 errors
- [ ] GovernancePayload derives: Clone, Debug, Serialize, Deserialize, Type
- [ ] GovernanceEvent derives: Clone, Debug, Serialize, Deserialize, Type
- [ ] Governance variant routes to Broadcast + Analytics sinks
- [ ] Re-exports in mod.rs include GovernancePayload + GovernanceEvent

**If ANY checkbox unchecked, sprint is NOT done.**
