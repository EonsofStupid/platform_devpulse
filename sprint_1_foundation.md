# Sprint 1: The Foundation (Workspace & Init)

> **Status:** READY FOR EXECUTION
> **Goal:** A Compilable Rust Workspace and an Installable Frontend (Fixing the `ENOENT` error).
> **Verification Criteria:**
> 1. `cargo build` succeeds (Root + Members).
> 2. `cd interfaces/desktop/src && npm install` succeeds.

## 1. The Workspace Root (Rust)
**File:** `d:/localdev/platform_devpulse/Cargo.toml`
> **Action:** Write the Root Manifest with strict dependencies.

```toml
[workspace]
resolver = "2"
members = [
    "kernel/devpulse-maestro",
    "systems/devpulse-engine",
    "systems/*", 
    "interfaces/*",
    "xtask"
]

[workspace.dependencies]
# Core
serde = { version = "1.0", features = ["derive"] }
uuid = { version = "1.10", features = ["v7", "serde"] }
chrono = { version = "0.4", features = ["serde"] }
tokio = { version = "1.40", features = ["full"] }

# Type Sync
ts-rs = "10.0"

# Platform Data (The "Muscle")
libsql = "0.6"
duckdb = "1.1"
moka = "0.12"
fjall = "2.0" 
wal = { git = "https://github.com/EonsofStupid/wal" }
rro = { git = "https://github.com/EonsofStupid/rro" }
tar-rs = { git = "https://github.com/EonsofStupid/tar-rs" }

# AI & Voice (The "Senses")
candle-core = "0.8"
candle-transformers = "0.8" 
outlines-core = "0.1"
kokoros = { git = "https://github.com/EonsofStupid/Kokoros" }
ort = "2.0" 

# Ops
xshell = "0.2"
clap = { version = "4.5", features = ["derive"] }
cargo_metadata = "0.18"
fs_extra = "1.3"
```

## 2. The Frontend Initialization (Node/Svelte)
**Path:** `d:/localdev/platform_devpulse/interfaces/desktop/src`
> **CRITICAL FIX**: This creates the missing `package.json` so `npm install` works.

**File:** `d:/localdev/platform_devpulse/interfaces/desktop/src/package.json`
```json
{
  "name": "devpulse-desktop",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite dev",
    "build": "vite build",
    "preview": "vite preview",
    "check": "svelte-check --tsconfig ./tsconfig.json"
  },
  "devDependencies": {
    "@sveltejs/vite-plugin-svelte": "^3.0.0",
    "@tsconfig/svelte": "^5.0.0",
    "svelte": "^5.0.0",
    "svelte-check": "^3.6.0",
    "tslib": "^2.4.1",
    "typescript": "^5.0.0",
    "vite": "^5.0.0"
  },
  "dependencies": {
    "@tauri-apps/api": "^2.0.0-rc",
    "@tauri-apps/plugin-shell": "^2.0.0-rc",
    "clsx": "^2.1.0",
    "tailwind-merge": "^2.2.0" 
  }
}
```

## 3. The Backend Structure (0-Byte Skeleton)
> **Action:** Create the required skeleton Cargo.toml files to make the workspace valid.
- `kernel/devpulse-maestro/Cargo.toml`
- `systems/devpulse-engine/Cargo.toml`
- `xtask/Cargo.toml`
tomic Stabilization Plan (Sprint 1)
Protocol: 
_AGENT_PROTOCOL.md
 (Plan-Act-Reflect) Goal: Fix build failures with zero side-effects.

1. Atomic Fix: Engine Dependencies
Task: Enable uuid-impl feature for ts-rs in Root 
Cargo.toml
.
Reason: devpulse-engine fails because Uuid doesn't implement TS.
Maintenance Check: 
systems/devpulse-engine/_MAINTENANCE.md
 allows types.
2. Atomic Fix: Xtask Implementation
Task: Implement cmd! logic in 
xtask/src/main.rs
.
Reason: Fixes "unused variable" warnings by using them, not deleting them.
Maintenance Check: 
_MAINTENANCE.md
 (General) encourages robust tooling.
3. Atomic Fix: Desktop Backend Rename
Task: Rename [lib] name to devpulse_desktop_backend in 
interfaces/desktop/src-tauri/Cargo.toml
.
Reason: Fixes PDB filename collision on Windows between lib and bin.
Maintenance Check: 
interfaces/desktop/_MAINTENANCE.md
 allows strict configuration.
4. Atomic Fix: Backend Import Update
Task: Update 
interfaces/desktop/src-tauri/src/main.rs
 to import devpulse_desktop_backend.
Reason: Required because of Atomic Fix #3.
5. Verification
Command: cargo check --workspace
Pass Criteria: Exit code 0, No red text.
# M1 Foundation Scaffold: Build Plan

> **Status**: AWAITING APPROVAL
> **Pattern**: Incremental (Maestro → Engine → Databases)

---

## Phase 1: Maestro/Cortex Scaffold

### 1.1 Delete Legacy Flat Files
```bash
rm kernel/devpulse-maestro/src/memory.rs
rm kernel/devpulse-maestro/src/reasoning.rs
```

### 1.2 Create Hexagonal Directory Tree
```bash
mkdir -p kernel/devpulse-maestro/src/cortex/traits
mkdir -p kernel/devpulse-maestro/src/cortex/adapters
mkdir -p kernel/devpulse-maestro/src/cortex/domain
```

### 1.3 Create Trait Definitions (Ports)
**File**: `kernel/devpulse-maestro/src/cortex/traits/mod.rs`
```rust
pub mod memory;
pub mod reasoning;
pub mod security;
```

**File**: `kernel/devpulse-maestro/src/cortex/traits/memory.rs`
```rust
/// The Memory Port (Contract)
pub trait MemoryBank {
    fn store(&self, key: &str, value: Vec<u8>) -> Result<(), String>;
    fn retrieve(&self, key: &str) -> Result<Vec<u8>, String>;
}
```

**File**: `kernel/devpulse-maestro/src/cortex/traits/reasoning.rs`
```rust
/// The Reasoning Port (Contract)
pub trait ReasoningEngine {
    fn process(&self, stimulus: Vec<u8>) -> Result<Vec<u8>, String>;
}
```

**File**: `kernel/devpulse-maestro/src/cortex/traits/security.rs`
```rust
/// The Identity Port (Contract)
pub trait IdentityProvider {
    fn verify(&self, token: &str) -> Result<bool, String>;
}
```

### 1.4 Create Stub Adapters (Implementations)
**File**: `kernel/devpulse-maestro/src/cortex/adapters/mod.rs`
```rust
pub mod surreal;
pub mod hmm;
pub mod buffer;
```

**File**: `kernel/devpulse-maestro/src/cortex/adapters/surreal.rs`
```rust
use crate::cortex::traits::memory::MemoryBank;

pub struct SurrealAdapter;

impl MemoryBank for SurrealAdapter {
    fn store(&self, _key: &str, _value: Vec<u8>) -> Result<(), String> {
        Ok(()) // Stub
    }
    fn retrieve(&self, _key: &str) -> Result<Vec<u8>, String> {
        Ok(vec![]) // Stub
    }
}
```

**File**: `kernel/devpulse-maestro/src/cortex/adapters/hmm.rs`
```rust
use crate::cortex::traits::reasoning::ReasoningEngine;

pub struct HmmAdapter;

impl ReasoningEngine for HmmAdapter {
    fn process(&self, _stimulus: Vec<u8>) -> Result<Vec<u8>, String> {
        Ok(vec![]) // Stub
    }
}
```

**File**: `kernel/devpulse-maestro/src/cortex/adapters/buffer.rs`
```rust
use crate::cortex::traits::security::IdentityProvider;

pub struct BufferAdapter;

impl IdentityProvider for BufferAdapter {
    fn verify(&self, _token: &str) -> Result<bool, String> {
        Ok(true) // Stub
    }
}
```

### 1.5 Create Domain Logic
**File**: `kernel/devpulse-maestro/src/cortex/domain/mod.rs`
```rust
pub mod agents;
pub mod factory;
```

**File**: `kernel/devpulse-maestro/src/cortex/domain/agents.rs`
```rust
// Agent logic using only traits (no direct adapter imports)
```

**File**: `kernel/devpulse-maestro/src/cortex/domain/factory.rs`
```rust
// Factory logic
```

### 1.6 Create Wiring (DI Container)
**File**: `kernel/devpulse-maestro/src/cortex/wiring.rs`
```rust
use crate::cortex::adapters::surreal::SurrealAdapter;
use crate::cortex::adapters::hmm::HmmAdapter;
use crate::cortex::traits::memory::MemoryBank;
use crate::cortex::traits::reasoning::ReasoningEngine;

pub struct CortexWiring {
    pub memory: Box<dyn MemoryBank>,
    pub reasoning: Box<dyn ReasoningEngine>,
}

impl CortexWiring {
    pub fn new() -> Self {
        Self {
            memory: Box::new(SurrealAdapter),
            reasoning: Box::new(HmmAdapter),
        }
    }
}
```

### 1.7 Update Root Module
**File**: `kernel/devpulse-maestro/src/cortex/mod.rs`
```rust
pub mod traits;
pub mod adapters;
pub mod domain;
pub mod wiring;
```

**File**: `kernel/devpulse-maestro/src/lib.rs`
```rust
pub mod cortex;

pub struct Cortex {
    // Main entry point
}

impl Cortex {
    pub fn new() -> Self {
        Self {}
    }
}
```

### 1.8 Verification
```bash
cd kernel/devpulse-maestro
cargo check
```

**Expected**: 0 errors, 0 warnings

---

## Phase 2: Engine Scaffold

### 2.1 Create Hexagonal Directory Tree
```bash
mkdir -p systems/devpulse-engine/src/engine/traits
mkdir -p systems/devpulse-engine/src/engine/adapters
mkdir -p systems/devpulse-engine/src/engine/routing
```

### 2.2 Create Trait Definitions
**File**: `systems/devpulse-engine/src/engine/traits/mod.rs`
```rust
pub mod nervous;
pub mod telemetry;
```

**File**: `systems/devpulse-engine/src/engine/traits/nervous.rs`
```rust
pub trait NervousSystem {
    fn send(&self, data: Vec<u8>) -> Result<(), String>;
}
```

**File**: `systems/devpulse-engine/src/engine/traits/telemetry.rs`
```rust
pub trait TelemetrySink {
    fn log(&self, event: &str) -> Result<(), String>;
}
```

### 2.3 Create Stub Adapters
**File**: `systems/devpulse-engine/src/engine/adapters/mod.rs`
```rust
pub mod rkyv;
pub mod libsql;
pub mod duckdb;
pub mod candle;
```

**File**: `systems/devpulse-engine/src/engine/adapters/rkyv.rs`
```rust
use crate::engine::traits::nervous::NervousSystem;

pub struct RkyvAdapter;

impl NervousSystem for RkyvAdapter {
    fn send(&self, _data: Vec<u8>) -> Result<(), String> {
        Ok(()) // Stub
    }
}
```

**File**: `systems/devpulse-engine/src/engine/adapters/duckdb.rs`
```rust
use crate::engine::traits::telemetry::TelemetrySink;

pub struct DuckDbAdapter;

impl TelemetrySink for DuckDbAdapter {
    fn log(&self, _event: &str) -> Result<(), String> {
        Ok(()) // Stub
    }
}
```

### 2.4 Create Routing
**File**: `systems/devpulse-engine/src/engine/routing/mod.rs`
```rust
pub mod envelope;
```

**File**: `systems/devpulse-engine/src/engine/routing/envelope.rs`
```rust
use uuid::Uuid;

pub struct SignalEnvelope {
    pub id: Uuid,
    pub kind: String,
    pub payload: Vec<u8>,
}
```

### 2.5 Create Wiring
**File**: `systems/devpulse-engine/src/engine/wiring.rs`
```rust
use crate::engine::adapters::rkyv::RkyvAdapter;
use crate::engine::adapters::duckdb::DuckDbAdapter;
use crate::engine::traits::nervous::NervousSystem;
use crate::engine::traits::telemetry::TelemetrySink;

pub struct EngineWiring {
    pub nervous: Box<dyn NervousSystem>,
    pub telemetry: Box<dyn TelemetrySink>,
}

impl EngineWiring {
    pub fn new() -> Self {
        Self {
            nervous: Box::new(RkyvAdapter),
            telemetry: Box::new(DuckDbAdapter),
        }
    }
}
```

### 2.6 Update Root Module
**File**: `systems/devpulse-engine/src/engine/mod.rs`
```rust
pub mod traits;
pub mod adapters;
pub mod routing;
pub mod wiring;
```

**File**: `systems/devpulse-engine/src/lib.rs`
```rust
pub mod engine;

pub struct Engine {
    // Main entry point
}

impl Engine {
    pub fn new() -> Self {
        Self {}
    }
}
```

### 2.7 Verification
```bash
cd systems/devpulse-engine
cargo check
```

**Expected**: 0 errors, 0 warnings

---

## Phase 3: Database Dependencies

### 3.1 Add Dependencies to Root Cargo.toml
**File**: `Cargo.toml` (workspace.dependencies section)
```toml
[workspace.dependencies]
# Existing...
surrealdb = { version = "2.0", default-features = false, features = ["kv-mem"] }
libsql = { version = "0.6", default-features = false }
duckdb = { version = "1.1", features = ["bundled"] }
rkyv = { version = "0.7", features = ["validation"] }
candle-core = "0.8"
```

### 3.2 Add to Maestro Cargo.toml
**File**: `kernel/devpulse-maestro/Cargo.toml`
```toml
[dependencies]
surrealdb = { workspace = true }
uuid = { workspace = true }
```

### 3.3 Add to Engine Cargo.toml
**File**: `systems/devpulse-engine/Cargo.toml`
```toml
[dependencies]
libsql = { workspace = true }
duckdb = { workspace = true }
rkyv = { workspace = true }
uuid = { workspace = true }
```

### 3.4 Final Workspace Verification
```bash
cargo check --workspace
```

**Expected**: All crates compile, 0 errors

---

## Approval Gate

**Status**: Awaiting user review of Phase 1 (Maestro scaffold structure)

Once Phase 1 approved:
- [ ] Execute Maestro scaffold
- [ ] User reviews
- [ ] Execute Engine scaffold
- [ ] User reviews
- [ ] Add Database dependencies
- [ ] Final verification
