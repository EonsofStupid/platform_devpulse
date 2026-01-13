# Lab Foundation - Sprint Execution Checklist

**Purpose**: Methodical establishment of Lab foundation. Each sprint has verification gates that MUST pass before moving to next.

**Rules**:
1. Complete each task IN ORDER
2. Run verification command AFTER each task
3. Do NOT proceed if verification fails
4. Mark checkboxes only after verification passes
5. "Compiles" is NOT "works" - run the actual code

---

## Pre-Sprint Audit

Before starting ANY sprint, verify current state:

```bash
# From alpha/lab/
cargo check -p lab 2>&1 | head -20
```

**Current State Snapshot** (COMPLETED 2024-01-XX):

| Item | Exists? | Location | Notes |
|------|---------|----------|-------|
| Cargo.toml | ✅ | `alpha/lab/Cargo.toml` | Has features |
| main.rs | ✅ | `alpha/lab/src/main.rs` | Uses lib.rs |
| lib.rs | ✅ | `alpha/lab/src/lib.rs` | Feature-gated |
| Feature flags | ✅ | Cargo.toml [features] | cli, web, full |
| CLI module | ✅ | `src/cli/mod.rs` | Model tools |
| Web module | ✅ | `src/web/mod.rs` | Re-exports |
| Storage module | ✅ | `src/storage/` | Lab wrappers |
| Types module | ✅ | `src/types/mod.rs` | LabSignalEvent |

---

## Sprint 1: Structure & Naming ✅ COMPLETE

**Goal**: Establish clean folder structure with feature toggles

**Estimated Time**: 2-3 hours  
**Actual Time**: ~30 minutes

### 1.1 Create lib.rs ✅

**Task**: Create `src/lib.rs` that exports Lab's public API

**File**: `alpha/lab/src/lib.rs`

**Content Requirements**:
```rust
//! DevPulse Lab - Internal Development Tool
//!
//! # Overview
//! Lab observes Engine signals, persists to its own databases,
//! and provides a web dashboard for monitoring and experimentation.
//!
//! # Crate Features
//! - `cli` - Enable CLI commands (model tools)
//! - `web` - Enable Axum web server
//! - `full` - Enable all features (default)
//!
//! # Architecture
//! Lab NEVER ships to end users. It subscribes to Engine's SignalRouter
//! and persists everything to lab_analytics.duckdb for analysis.

// Feature-gated modules
#[cfg(feature = "cli")]
pub mod cli;

#[cfg(feature = "web")]
pub mod web;

// Always available
pub mod error;
pub mod storage;
pub mod types;

// Re-exports
pub use error::{AppError, AppResult};
pub use types::LabSignalEvent;
```

**Verification**:
```bash
# File exists
test -f alpha/lab/src/lib.rs && echo "✓ lib.rs exists" || echo "✗ MISSING"

# Has module declarations
grep -q "pub mod" alpha/lab/src/lib.rs && echo "✓ Has modules" || echo "✗ NO MODULES"

# Has feature gates
grep -q '#\[cfg(feature' alpha/lab/src/lib.rs && echo "✓ Has feature gates" || echo "✗ NO FEATURES"
```

- [x] File created
- [x] Module declarations present
- [x] Feature gates present
- [x] Documentation header present

---

### 1.2 Create types/mod.rs

**Task**: Create Lab-specific types with `lab::` prefix convention

**File**: `alpha/lab/src/types/mod.rs`

**Content Requirements**:
```rust
//! Lab-specific types
//!
//! All Lab types use `Lab` prefix to distinguish from Engine types.
//! Signals emitted by Lab use `lab::` namespace in event_type.

use serde::{Deserialize, Serialize};

/// Lab signal event - wrapper around Engine signals with Lab metadata
/// 
/// All Lab signals have event_type prefixed with "lab::"
#[derive(Clone, Debug, Serialize, Deserialize)]
pub struct LabSignalEvent {
    /// Unique ID (UUID v7)
    pub id: String,
    /// Event type - MUST start with "lab::" for Lab-originated signals
    pub event_type: String,
    /// Source component
    pub source: LabSource,
    /// ISO timestamp
    pub timestamp: String,
    /// JSON payload
    pub payload: serde_json::Value,
}

/// Lab signal sources
#[derive(Clone, Debug, Serialize, Deserialize)]
pub enum LabSource {
    /// Signal bridged from Engine
    Engine,
    /// Lab backend generated
    Backend,
    /// Lab UI generated
    Ui,
    /// Lab CLI generated  
    Cli,
}

impl LabSignalEvent {
    /// Create a new Lab-originated signal
    pub fn new_lab_signal(event_type: &str, source: LabSource, payload: serde_json::Value) -> Self {
        Self {
            id: uuid::Uuid::now_v7().to_string(),
            event_type: format!("lab::{}", event_type),
            source,
            timestamp: chrono::Utc::now().to_rfc3339(),
            payload,
        }
    }

    /// Create from Engine signal (preserves original event_type)
    pub fn from_engine_signal(
        id: String,
        event_type: String,
        timestamp: String,
        payload: serde_json::Value,
    ) -> Self {
        Self {
            id,
            event_type, // NOT prefixed - comes from Engine
            source: LabSource::Engine,
            timestamp,
            payload,
        }
    }

    /// Is this a Lab-originated signal?
    pub fn is_lab_signal(&self) -> bool {
        self.event_type.starts_with("lab::")
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn lab_signal_has_prefix() {
        let sig = LabSignalEvent::new_lab_signal(
            "test",
            LabSource::Backend,
            serde_json::json!({}),
        );
        assert!(sig.event_type.starts_with("lab::"));
        assert!(sig.is_lab_signal());
    }

    #[test]
    fn engine_signal_no_prefix() {
        let sig = LabSignalEvent::from_engine_signal(
            "123".into(),
            "Chat".into(),
            "2026-01-10T00:00:00Z".into(),
            serde_json::json!({}),
        );
        assert!(!sig.event_type.starts_with("lab::"));
        assert!(!sig.is_lab_signal());
    }
}
```

**Verification**:
```bash
# File exists
test -f alpha/lab/src/types/mod.rs && echo "✓ types/mod.rs exists" || echo "✗ MISSING"

# Has LabSignalEvent
grep -q "pub struct LabSignalEvent" alpha/lab/src/types/mod.rs && echo "✓ Has LabSignalEvent" || echo "✗ MISSING TYPE"

# Has LabSource enum
grep -q "pub enum LabSource" alpha/lab/src/types/mod.rs && echo "✓ Has LabSource" || echo "✗ MISSING ENUM"

# Has lab:: prefix logic
grep -q 'lab::' alpha/lab/src/types/mod.rs && echo "✓ Has lab:: prefix" || echo "✗ MISSING PREFIX"

# Has tests
grep -q "#\[test\]" alpha/lab/src/types/mod.rs && echo "✓ Has tests" || echo "✗ NO TESTS"
```

- [ ] File created at `src/types/mod.rs`
- [ ] `LabSignalEvent` struct defined
- [ ] `LabSource` enum defined
- [ ] `lab::` prefix convention implemented
- [ ] Unit tests included
- [ ] Tests pass: `cargo test -p lab types`

---

### 1.3 Create storage/mod.rs

**Task**: Create Lab's storage module structure (empty implementations for now)

**Files**:
- `alpha/lab/src/storage/mod.rs`
- `alpha/lab/src/storage/analytics.rs`
- `alpha/lab/src/storage/database.rs`

**storage/mod.rs Content**:
```rust
//! Lab Storage Layer
//!
//! Lab has its OWN databases, separate from Engine:
//! - `lab.db` (libSQL) - Experiments, configs, baselines
//! - `lab_analytics.duckdb` (DuckDB) - All captured signals, metrics
//!
//! # Design Decision
//! Lab currently uses orchestrator's `Database` and `Analytics` types
//! but opens them at different file paths. This module will eventually
//! contain Lab-specific wrappers with Lab-specific schema.

pub mod analytics;
pub mod database;

pub use analytics::LabAnalytics;
pub use database::LabDatabase;
```

**storage/analytics.rs Content**:
```rust
//! Lab Analytics - DuckDB wrapper for signal capture
//!
//! Stores ALL signals that flow through Lab for later analysis.
//! File: ~/.devpulse/data/lab_analytics.duckdb

use anyhow::Result;
use std::path::Path;
use std::sync::Arc;

// TODO: Sprint 2 - Replace with Lab's own implementation
use orchestrator::infra::duckdb::Analytics;

/// Lab Analytics wrapper
/// 
/// Currently delegates to orchestrator::Analytics opened at Lab's path.
/// Sprint 2 will implement Lab-specific schema and methods.
pub struct LabAnalytics {
    inner: Arc<Analytics>,
}

impl LabAnalytics {
    /// Open Lab analytics database
    pub fn open(path: &Path) -> Result<Self> {
        let inner = Analytics::open_with_path(path)?;
        Ok(Self { inner: Arc::new(inner) })
    }

    /// Record a signal event
    pub fn record_signal(&self, event_type: &str, payload: &serde_json::Value) -> Result<()> {
        self.inner.record_event(event_type, payload)
    }

    /// Get total event count
    pub fn event_count(&self) -> Result<u64> {
        self.inner.get_event_count()
    }

    /// Get inner Analytics (for routes that need direct access)
    /// TODO: Remove this in Sprint 2 when Lab has own methods
    pub fn inner(&self) -> Arc<Analytics> {
        Arc::clone(&self.inner)
    }
}
```

**storage/database.rs Content**:
```rust
//! Lab Database - libSQL wrapper for Lab-specific data
//!
//! Stores experiments, configurations, baselines.
//! File: ~/.devpulse/data/lab.db

use anyhow::Result;
use std::path::Path;
use std::sync::Arc;

// TODO: Sprint 2 - Replace with Lab's own implementation
use orchestrator::infra::libsql::Database;

/// Lab Database wrapper
///
/// Currently delegates to orchestrator::Database opened at Lab's path.
/// Sprint 2 will implement Lab-specific schema and methods.
pub struct LabDatabase {
    inner: Arc<Database>,
}

impl LabDatabase {
    /// Open Lab database
    pub async fn open(path: &Path) -> Result<Self> {
        let inner = Database::open(path).await?;
        Ok(Self { inner: Arc::new(inner) })
    }

    /// Get inner Database (for routes that need direct access)
    /// TODO: Remove this in Sprint 2 when Lab has own methods
    pub fn inner(&self) -> Arc<Database> {
        Arc::clone(&self.inner)
    }
}
```

**Verification**:
```bash
# Files exist
test -f alpha/lab/src/storage/mod.rs && echo "✓ storage/mod.rs" || echo "✗ MISSING"
test -f alpha/lab/src/storage/analytics.rs && echo "✓ analytics.rs" || echo "✗ MISSING"
test -f alpha/lab/src/storage/database.rs && echo "✓ database.rs" || echo "✗ MISSING"

# Has wrapper types
grep -q "pub struct LabAnalytics" alpha/lab/src/storage/analytics.rs && echo "✓ LabAnalytics" || echo "✗ MISSING"
grep -q "pub struct LabDatabase" alpha/lab/src/storage/database.rs && echo "✓ LabDatabase" || echo "✗ MISSING"

# Re-exports in mod.rs
grep -q "pub use analytics::LabAnalytics" alpha/lab/src/storage/mod.rs && echo "✓ Re-exports" || echo "✗ MISSING"
```

- [ ] `src/storage/mod.rs` created
- [ ] `src/storage/analytics.rs` created
- [ ] `src/storage/database.rs` created
- [ ] `LabAnalytics` wrapper defined
- [ ] `LabDatabase` wrapper defined
- [ ] Re-exports in mod.rs

---

### 1.4 Update Cargo.toml with Feature Flags

**Task**: Add feature flags to enable selective compilation

**File**: `alpha/lab/Cargo.toml`

**Changes Required**:
```toml
[package]
name = "lab"
version.workspace = true
edition.workspace = true

[features]
default = ["full"]
cli = []
web = []
full = ["cli", "web"]

[dependencies]
# ... existing deps ...
```

**Verification**:
```bash
# Has features section
grep -q "\[features\]" alpha/lab/Cargo.toml && echo "✓ Has [features]" || echo "✗ MISSING"

# Has default feature
grep -q 'default = \["full"\]' alpha/lab/Cargo.toml && echo "✓ Has default" || echo "✗ MISSING"

# Has cli feature
grep -q 'cli = \[\]' alpha/lab/Cargo.toml && echo "✓ Has cli" || echo "✗ MISSING"

# Has web feature
grep -q 'web = \[\]' alpha/lab/Cargo.toml && echo "✓ Has web" || echo "✗ MISSING"

# Compiles with features
cargo check -p lab --features full && echo "✓ Compiles with full" || echo "✗ COMPILE FAIL"
cargo check -p lab --no-default-features --features cli && echo "✓ Compiles cli-only" || echo "✗ COMPILE FAIL"
```

- [ ] `[features]` section added
- [ ] `default = ["full"]` set
- [ ] `cli = []` defined
- [ ] `web = []` defined
- [ ] `full = ["cli", "web"]` defined
- [ ] Compiles with `--features full`
- [ ] Compiles with `--features cli` only

---

### 1.5 Create cli/mod.rs (Move from cli.rs)

**Task**: Move CLI to its own module directory, add feature gate

**Files**:
- Create `alpha/lab/src/cli/mod.rs`
- Delete `alpha/lab/src/cli.rs` (after move)

**cli/mod.rs Header**:
```rust
//! Lab CLI - Model Management Tools
//!
//! # Feature Gate
//! This module requires the `cli` feature:
//! ```bash
//! cargo run -p lab --features cli -- --cli help
//! ```
//!
//! # Commands
//! - `models` - List registered models
//! - `verify` - Check model files exist
//! - `info <id>` - Show model details
//! - `estimate <repo>` - Estimate memory from HuggingFace
//! - `quick <params>` - Quick memory estimate

// ... rest of existing cli.rs content ...
```

**Verification**:
```bash
# New location exists
test -d alpha/lab/src/cli && echo "✓ cli/ dir exists" || echo "✗ MISSING"
test -f alpha/lab/src/cli/mod.rs && echo "✓ cli/mod.rs exists" || echo "✗ MISSING"

# Old file removed
test ! -f alpha/lab/src/cli.rs && echo "✓ Old cli.rs removed" || echo "✗ OLD FILE EXISTS"

# Has feature gate in lib.rs
grep -q '#\[cfg(feature = "cli")\]' alpha/lab/src/lib.rs && echo "✓ Feature gated" || echo "✗ NOT GATED"

# CLI compiles
cargo check -p lab --features cli && echo "✓ CLI compiles" || echo "✗ COMPILE FAIL"
```

- [ ] `src/cli/` directory created
- [ ] `src/cli/mod.rs` created with content from `cli.rs`
- [ ] Old `src/cli.rs` deleted
- [ ] Feature gate in `lib.rs`
- [ ] CLI compiles with feature

---

### 1.6 Create web/mod.rs (Extract from main.rs)

**Task**: Move web server setup to its own module

**File**: `alpha/lab/src/web/mod.rs`

**Content Requirements**:
```rust
//! Lab Web Server - Axum HTTP API
//!
//! # Feature Gate
//! This module requires the `web` feature:
//! ```bash
//! cargo run -p lab --features web
//! ```
//!
//! # Endpoints
//! - `/api/health` - System health
//! - `/api/signals/*` - Signal streaming
//! - `/api/chat/*` - Chat facade
//! - `/api/analytics/*` - DuckDB queries
//! - `/api/models/*` - Model registry
//! - `/api/persona/*` - Persona CRUD
//! - `/api/voice/*` - Voice profiles
//! - `/api/background/*` - Background tasks
//! - `/api/rumination/*` - Rumination (STUB)

pub mod routes;
pub mod state;

use axum::Router;
use std::net::SocketAddr;
use std::sync::Arc;
use tower_http::cors::CorsLayer;
use tower_http::trace::TraceLayer;

use state::AppState;

/// Start Lab web server
pub async fn serve() -> anyhow::Result<()> {
    tracing::info!("Starting DevPulse Lab server...");

    let state = Arc::new(AppState::init().await?);

    let app = Router::new()
        .nest("/api/analytics", routes::analytics::router())
        .nest("/api/health", routes::health::router())
        .nest("/api/chat", routes::chat::router())
        .nest("/api/signals", routes::signals::router())
        .nest("/api/rumination", routes::rumination::router())
        .nest("/api/voice", routes::voice::router())
        .nest("/api/background", routes::background::router())
        .nest("/api/models", routes::models::router())
        .nest("/api/persona", routes::persona::router())
        .layer(CorsLayer::permissive())
        .layer(TraceLayer::new_for_http())
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 3001));
    tracing::info!("Lab server listening on http://{}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await?;
    axum::serve(listener, app).await?;

    Ok(())
}
```

**Also move**:
- `src/state.rs` → `src/web/state.rs`
- `src/routes/` → `src/web/routes/`

**Verification**:
```bash
# New structure exists
test -d alpha/lab/src/web && echo "✓ web/ dir" || echo "✗ MISSING"
test -f alpha/lab/src/web/mod.rs && echo "✓ web/mod.rs" || echo "✗ MISSING"
test -f alpha/lab/src/web/state.rs && echo "✓ web/state.rs" || echo "✗ MISSING"
test -d alpha/lab/src/web/routes && echo "✓ web/routes/" || echo "✗ MISSING"

# Old files removed
test ! -f alpha/lab/src/state.rs && echo "✓ Old state.rs removed" || echo "✗ OLD FILE EXISTS"
test ! -d alpha/lab/src/routes && echo "✓ Old routes/ removed" || echo "✗ OLD DIR EXISTS"

# Feature gated
grep -q '#\[cfg(feature = "web")\]' alpha/lab/src/lib.rs && echo "✓ Feature gated" || echo "✗ NOT GATED"

# Compiles
cargo check -p lab --features web && echo "✓ Web compiles" || echo "✗ COMPILE FAIL"
```

- [ ] `src/web/` directory created
- [ ] `src/web/mod.rs` with `serve()` function
- [ ] `src/web/state.rs` moved from `src/state.rs`
- [ ] `src/web/routes/` moved from `src/routes/`
- [ ] Old `src/state.rs` deleted
- [ ] Old `src/routes/` deleted
- [ ] Feature gate in `lib.rs`
- [ ] Web compiles with feature

---

### 1.7 Update main.rs

**Task**: Simplify main.rs to use lib.rs exports

**File**: `alpha/lab/src/main.rs`

**Content**:
```rust
//! DevPulse Lab - Entry Point
//!
//! Run modes:
//! - `cargo run -p lab` → Web server (default)
//! - `cargo run -p lab -- --cli` → CLI tools

use tracing_subscriber::{layer::SubscriberExt, util::SubscriberInitExt};

#[tokio::main]
async fn main() -> anyhow::Result<()> {
    let args: Vec<String> = std::env::args().collect();

    // Check for --cli flag
    let is_cli = args.iter().any(|a| a == "--cli" || a == "-c");

    if is_cli {
        #[cfg(feature = "cli")]
        {
            return lab::cli::run_cli(args).await;
        }
        #[cfg(not(feature = "cli"))]
        {
            eprintln!("CLI feature not enabled. Rebuild with: cargo build -p lab --features cli");
            std::process::exit(1);
        }
    }

    // Web server mode
    #[cfg(feature = "web")]
    {
        // Initialize tracing
        tracing_subscriber::registry()
            .with(tracing_subscriber::EnvFilter::new(
                std::env::var("RUST_LOG")
                    .unwrap_or_else(|_| "lab=debug,tower_http=debug,engine=info".into()),
            ))
            .with(tracing_subscriber::fmt::layer())
            .init();

        return lab::web::serve().await;
    }

    #[cfg(not(feature = "web"))]
    {
        eprintln!("Web feature not enabled. Rebuild with: cargo build -p lab --features web");
        std::process::exit(1);
    }
}
```

**Verification**:
```bash
# Main uses lib
grep -q "lab::cli::run_cli" alpha/lab/src/main.rs && echo "✓ Uses lib::cli" || echo "✗ MISSING"
grep -q "lab::web::serve" alpha/lab/src/main.rs && echo "✓ Uses lib::web" || echo "✗ MISSING"

# Feature gates in main
grep -c '#\[cfg(feature' alpha/lab/src/main.rs | grep -q "[2-9]" && echo "✓ Has feature gates" || echo "✗ MISSING"

# Full build works
cargo build -p lab && echo "✓ Full build" || echo "✗ BUILD FAIL"

# Run works
timeout 3 cargo run -p lab -- --help 2>&1 | head -5
```

- [ ] main.rs simplified
- [ ] Uses `lab::cli::run_cli`
- [ ] Uses `lab::web::serve`
- [ ] Feature gates for both modes
- [ ] `cargo build -p lab` succeeds
- [ ] `cargo run -p lab` starts server

---

### Sprint 1 Final Verification

**Run ALL verification commands**:

```bash
cd alpha/lab

# Structure check
echo "=== Structure ==="
find src -name "*.rs" | sort

# Expected output:
# src/cli/mod.rs
# src/error.rs
# src/lib.rs
# src/main.rs
# src/signal_inspector.rs
# src/storage/analytics.rs
# src/storage/database.rs
# src/storage/mod.rs
# src/types/mod.rs
# src/web/mod.rs
# src/web/routes/analytics.rs
# src/web/routes/background.rs
# src/web/routes/chat.rs
# src/web/routes/health.rs
# src/web/routes/mod.rs
# src/web/routes/models.rs
# src/web/routes/persona.rs
# src/web/routes/rumination.rs
# src/web/routes/signals.rs
# src/web/routes/voice.rs
# src/web/state.rs

echo "=== Feature Builds ==="
cargo check -p lab --features full && echo "✓ full"
cargo check -p lab --features cli && echo "✓ cli-only"
cargo check -p lab --features web && echo "✓ web-only"

echo "=== Tests ==="
cargo test -p lab

echo "=== Run Test ==="
timeout 5 cargo run -p lab &
sleep 3
curl -s http://localhost:3001/api/health | head -c 100
kill %1 2>/dev/null
```

**Sprint 1 Complete Checklist**:
- [ ] `src/lib.rs` exists with module exports
- [ ] `src/types/mod.rs` with `LabSignalEvent`, `LabSource`
- [ ] `src/storage/` with `LabAnalytics`, `LabDatabase` wrappers
- [ ] `src/cli/mod.rs` (moved from `cli.rs`)
- [ ] `src/web/mod.rs` with `serve()` function
- [ ] `src/web/state.rs` (moved from `state.rs`)
- [ ] `src/web/routes/` (moved from `routes/`)
- [ ] `Cargo.toml` has `[features]` section
- [ ] All three feature builds compile
- [ ] Tests pass
- [ ] Server starts and responds to `/api/health`

**Sprint 1 Sign-off**:
- Started: ____-__-__ __:__
- Completed: ____-__-__ __:__
- Verified by running server: [ ]
- All checkboxes complete: [ ]

---

## Sprint 2: Storage Isolation

**Goal**: Lab has its own schema, not just wrappers

**Prerequisites**: Sprint 1 complete and verified

**Tasks**:
- [ ] 2.1 Define Lab-specific DuckDB schema
- [ ] 2.2 Implement `LabAnalytics` with own methods
- [ ] 2.3 Define Lab-specific libSQL schema
- [ ] 2.4 Implement `LabDatabase` with own methods
- [ ] 2.5 Update `web/state.rs` to use Lab wrappers
- [ ] 2.6 Remove direct orchestrator imports where possible

*Detailed steps to be filled after Sprint 1 completes*

---

## Sprint 3: Configuration

**Goal**: No hardcoded paths or ports

**Prerequisites**: Sprint 2 complete and verified

**Tasks**:
- [ ] 3.1 Create `src/config.rs`
- [ ] 3.2 Fix hardcoded model paths in CLI
- [ ] 3.3 Fix hardcoded port in UI client.ts
- [ ] 3.4 Environment variable support
- [ ] 3.5 Create `.env.example`

*Detailed steps to be filled after Sprint 2 completes*

---

## Sprint 4: Documentation & AI Markers

**Goal**: Lab is AI-friendly for consistent development

**Prerequisites**: Sprint 3 complete and verified

**Tasks**:
- [ ] 4.1 Add `@lab-boundary` markers to all modules
- [ ] 4.2 Document each route with contract
- [ ] 4.3 Create CONTRIBUTING.md
- [ ] 4.4 Create ARCHITECTURE.md
- [ ] 4.5 Update README.md with final structure

*Detailed steps to be filled after Sprint 3 completes*

---

## Verification Protocol

Before marking ANY task complete:

1. **File exists**: `test -f <path>`
2. **Content correct**: `grep -q <pattern> <file>`
3. **Compiles**: `cargo check -p lab`
4. **Tests pass**: `cargo test -p lab`
5. **Actually runs**: Start server, hit endpoint

**"Compiles" is NOT "works"**
