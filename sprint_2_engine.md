# Sprint 2: The Engine (Layer 2)

**Status:** PROPOSED (Review Needed)
**Goal:** Implement the "Nervous System" - State Management and Signal Routing.

## Layer 2: ENGINE
### Crate Manifest
**File:** `systems/engine/Cargo.toml`
```toml
[package]
name = "devpulse-engine"
version = "0.1.0"
edition = "2021"

[dependencies]
devpulse-core = { path = "../../kernel/core" }
tokio = { workspace = true }
tracing = { workspace = true }
async-trait = { workspace = true }
anyhow = "1.0"
```

### Maintenance Guardrails
**File:** `systems/engine/_MAINTENANCE.md`
```markdown
# Engine Maintenance Protocol

## REQUIRED_STEP 1: Core Dependency
- Engine MUST depend on `devpulse-core` for all shared types.
- Do NOT define new `Signal` types here. Use `SignalKind::Standard` or request a Core update.

## REQUIRED_STEP 2: The Facade Rule
- Engine processes `StandardSignal` variants transparently.
- Engine routes `ProprietarySignal` variants blindly to Clyffy. Do NOT attempt to unwrap `ProprietarySignal`.

## REQUIRED_STEP 3: Elite Build Protocol
- Zero warnings. Implement logic or remove dead code.
```

### Module: `signals`
**File:** `systems/engine/src/signals.rs`
**Proposed Types:**
```rust
// RE-EXPORT from Core
pub use devpulse_core::types::signal::{Signal, SignalKind, Header, StandardSignal, ProprietarySignal};
```

### Module: `processor`
**File:** `systems/engine/src/processor.rs`
**Proposed Types:**
```rust
use tokio::sync::broadcast;
use std::sync::Arc;
use devpulse_core::types::signal::Signal;
use anyhow::Result;

pub struct SignalProcessor {
    // The Bus carries the full Signal Envelope
    tx: broadcast::Sender<Signal>, 
}
```

### Module: `processor`
**File:** `engine/src/processor.rs`
**Proposed Types:**
```rust
pub struct SignalProcessor {
    registry: Arc<Registry>,
    // specific channels or bus references would go here
    tx: broadcast::Sender<SignalEnvelope>, // The central nervous system bus
}

impl SignalProcessor {
    pub fn new(registry: Arc<Registry>) -> Self { ... }
    
    /// The main loop. Ingests signals, decides where they go.
    pub async fn run(&mut self) -> Result<()> { ... }
    
    /// Route a specific signal to its destination (Sink, Network, UI)
    async fn route(&self, signal: SignalEnvelope) -> Result<()> { ... }
}
```

### Module: `registry`
**File:** `engine/src/registry.rs`
**Proposed Types:**
```rust
/// Holds definitions of safe tools and services.
pub struct Registry {
    tools: HashMap<String, ToolDefinition>,
    services: HashMap<String, ServiceDefinition>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ToolDefinition {
    pub name: String,
    pub description: String,
    pub parameters: serde_json::Value, // JSON Schema
    pub required_privilege: Role,      // From shared::types::profile
}
```

## Review Checklist
- [ ] Is `SignalVariant` comprehensive?
- [ ] Does `SignalProcessor` need a more complex routing table?
- [ ] Is `Registry` missing any lookup capabilities?
