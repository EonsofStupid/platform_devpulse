# Sprint 1: Unified Runtime Architecture

**Goal:** Build a cohesive DevPulseRuntime that unifies all subsystems with proper telemetry, experiment flags, and Lab observability.

**Principle:** No code is written until this plan is approved. Every file, every function, every line documented here first.

---

## CORRECTIONS FROM REVIEW

| Item | Status |
|------|--------|
| Tracy integration | ADD explicit client start |
| libSQL optional | CHANGE TO REQUIRED |
| decisions table | ADD |
| Model path hierarchy | ALREADY DECIDED |
| Rumination spawn | ALREADY DECIDED (router spawns) |
| Lab TUI + WebSocket | ALREADY DECIDED (both) |
| P0 trace tables | ADD |
| rkyv for internal | ADD |

---

## INSTALLED: Tracy Profiler

Added `tracy_full` v1.12 for real-time profiling:
- Nanosecond precision
- Full GUI profiler (download Tracy from https://github.com/wolfpld/tracy/releases)
- Integrates with `tracing` crate via `tracing-tracy`

**Files modified:**
- `Cargo.toml` (workspace) - added `tracy_full`, `tracing-tracy`
- `orchestrator/Cargo.toml` - added workspace deps
- `lab/Cargo.toml` - added workspace deps

**Usage (CORRECTED):**
```rust
use tracing_tracy::TracyLayer;
use tracing_subscriber::prelude::*;

// Initialize Tracy client FIRST
tracing_tracy::client::Client::start();

// Then set up tracing subscriber
tracing_subscriber::registry()
    .with(TracyLayer::default())
    .init();

// All tracing spans automatically appear in Tracy profiler
tracing::info_span!("cag.assemble").in_scope(|| {
    // ... code ...
});
```

---

## Part 1: Current State Audit

### What EXISTS and WORKS

| File | Purpose | Status |
|------|---------|--------|
| `shared/src/config/paths.rs` | SSOT for all paths (DevPulsePaths) | WORKING |
| `shared/src/config/env.rs` | Runtime mode detection (Lab/Prod) | WORKING |
| `shared/src/types/signal.rs` | SignalKind with profile() routing | WORKING |
| `shared/src/types/profile.rs` | Processing, DataTier, ModelTier, ToolSet | WORKING |
| `shared/src/types/toon.rs` | Toon wrapper for signals | WORKING |
| `orchestrator/src/infra/bus.rs` | EventBus (tokio::broadcast) | WORKING |
| `orchestrator/src/infra/moka.rs` | HotCache (Reflex 30s, Context 5min) | WORKING |
| `orchestrator/src/infra/rro.rs` | VectorStore (embedded RRO) | WORKING |
| `orchestrator/src/infra/embedder.rs` | EmbedderBackend | WORKING |
| `orchestrator/src/infra/reranker.rs` | RerankerBackend | WORKING |
| `orchestrator/src/cortex/router.rs` | Router (dispatches by profile) | WORKING |
| `orchestrator/src/cortex/rumination.rs` | Multi-hop execution | PARTIAL (stubs) |
| `orchestrator/src/cortex/cag.rs` | Context Assembly Graph | WORKING |
| `orchestrator/src/cortex/costar.rs` | COSTAR builder | PARTIAL |

### What EXISTS but NEEDS FIX

| File | Issue |
|------|-------|
| `orchestrator/src/infra/models.rs` | Has SSOT support now, but needs config hierarchy |
| `orchestrator/src/infra/voice.rs` | Hardcoded path - same issue |
| `lab/src/main.rs` | Hardcoded path in display - same issue |

### What's MISSING

| Component | Purpose |
|-----------|---------|
| `DevPulseRuntime` | Unified owner of all subsystems |
| `Experiments` | Runtime feature flags (not compile-time) |
| Tracy client init | Explicit `Client::start()` |
| `decisions` table | Constrained memory / forcing function |
| P0 trace tables | `lane_runs`, `llm_calls.trace_id`, `governance_violations` |
| `RuntimeHandle` | Lab-observable state snapshot |

---

## Part 2: Architecture Design

### The Runtime Hierarchy

```
DevPulseRuntime (owns everything)
├── config: &'static RuntimeConfig     // From shared/config/env.rs
├── paths: &'static DevPulsePaths      // From shared/config/paths.rs
├── experiments: Experiments           // Runtime flags
├── [Tracy profiler via tracing-tracy] // Client::start() on init
│
├── storage: Storage                   // REQUIRED subsystems (no Option<>)
│   ├── bus: EventBus                  // L1: Reflex (broadcast)
│   ├── cache: HotCache                // L2: Working (moka 30s/5min)
│   ├── db: Database                   // L3: Durable (libSQL) - REQUIRED
│   ├── vectors: VectorStore           // L4: Semantic (RRO)
│   └── kv: FjallKV                    // L5: Fast KV (fjall) - REQUIRED
│
├── inference: Inference
│   ├── embedder: EmbedderBackend
│   ├── reranker: RerankerBackend
│   ├── llm: Option<LlmBackend>
│   └── registry: ModelRegistry
│
└── cortex: Cortex
    ├── router: SignalRouter           // Spawns rumination on demand
    ├── cag: CAG
    └── [Rumination spawned per-signal]
```

### Model Path Hierarchy (DECIDED)

```
Priority (highest wins):
1. DEVPULSE_MODEL_PATH env var     ← CI/testing
2. Session override                 ← Lab experiments
3. project.toml [models]           ← Per-project
4. ~/.devpulse/config.toml         ← User global
5. Hardcoded defaults              ← Fallback
```

### Rumination Spawn (DECIDED)

Router spawns on demand, NOT pre-spawned:

```rust
impl SignalRouter {
    pub async fn process_signal(&self, signal: Signal) {
        if let Some(action) = self.check_reflexes(&signal) {
            self.execute_reflex(action).await;
            return;
        }

        // No reflex match → spawn rumination channel
        let (tx, rx) = tokio::sync::mpsc::channel(32);
        tokio::spawn(self.rumination.run(signal, rx));
    }
}
```

### Lab Interface (DECIDED)

| Interface | Purpose |
|-----------|---------|
| Lab TUI (ratatui) | Token stream, entropy, ROTI live |
| WebSocket Dashboard | Decision review, Memory Commit UI |

Both are needed. Memory Commit ceremony (AI proposes → user reviews → confirm) needs WebSocket for rich UI.

### Serialization (DECIDED)

| Boundary | Format |
|----------|--------|
| Internal MCP | rkyv (zero-copy) |
| External perimeter | JSON |
| fjall storage | rkyv |

---

## Part 3: Required Tables (P0)

### decisions Table (Constrained Memory)

```sql
CREATE TABLE decisions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    source TEXT NOT NULL,  -- 'forced' or 'promoted'
    created_at INTEGER NOT NULL,
    UNIQUE(project_id, category, key)
);
```

### lane_runs Table (Trace Correlation)

```sql
CREATE TABLE lane_runs (
    id TEXT PRIMARY KEY,
    trace_id TEXT NOT NULL,        -- W3C traceparent
    session_id TEXT NOT NULL,
    lane TEXT NOT NULL,            -- 'reflex', 'rumination', 'archive'
    signal_kind TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    status TEXT NOT NULL,          -- 'running', 'completed', 'failed'
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

### llm_calls Table (with trace_id)

```sql
CREATE TABLE llm_calls (
    id TEXT PRIMARY KEY,
    trace_id TEXT NOT NULL,        -- Correlates with lane_runs
    lane_run_id TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (lane_run_id) REFERENCES lane_runs(id)
);
```

### governance_violations Table

```sql
CREATE TABLE governance_violations (
    id TEXT PRIMARY KEY,
    trace_id TEXT NOT NULL,
    umbrella TEXT NOT NULL,        -- One of 9 Umbrellas
    severity TEXT NOT NULL,        -- 'warning', 'block'
    message TEXT NOT NULL,
    context TEXT,                  -- JSON blob
    created_at INTEGER NOT NULL
);
```

### 9 Umbrellas Enum

```rust
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum Umbrella {
    Safety,           // User harm prevention
    Privacy,          // Data protection
    Security,         // System security
    Compliance,       // Legal/regulatory
    Ethics,           // Moral considerations
    Quality,          // Output quality
    Performance,      // System performance
    Cost,             // Resource usage
    Scope,            // Task boundaries
}
```

---

## Part 4: File-by-File Implementation Plan

### File 1: `orchestrator/src/runtime/mod.rs` (NEW)

```rust
//! DevPulse Runtime - Unified subsystem ownership
//!
//! The runtime owns all subsystems and provides:
//! - Unified initialization
//! - Experiment flags (runtime toggles)
//! - Tracy profiler integration
//! - Lab-observable state

mod experiments;
mod runtime;

pub use experiments::{Experiments, ExperimentsSnapshot};
pub use runtime::{DevPulseRuntime, RuntimeHandle, RuntimeSnapshot, Storage, Inference, Cortex};
```

---

### File 2: `orchestrator/src/runtime/experiments.rs` (NEW)

```rust
//! Runtime experiment flags
//!
//! All flags are AtomicBool for lock-free read/write.
//! Toggle via Lab UI or environment variables.

use std::sync::atomic::{AtomicBool, Ordering};
use serde::{Deserialize, Serialize};

/// Runtime experiment flags - toggle features without recompile
#[derive(Debug)]
pub struct Experiments {
    // CAG Pipeline Flags
    cag_rro: AtomicBool,
    cag_reranker: AtomicBool,
    cag_adaptive_threshold: AtomicBool,

    // Rumination Flags
    rumination_enabled: AtomicBool,
    rumination_ab_test: AtomicBool,

    // Debug Flags
    debug_capture: AtomicBool,
    debug_routing: AtomicBool,

    // Model Selection
    prefer_8b: AtomicBool,
}

impl Experiments {
    pub fn new() -> Self {
        Self {
            cag_rro: AtomicBool::new(true),
            cag_reranker: AtomicBool::new(true),
            cag_adaptive_threshold: AtomicBool::new(true),
            rumination_enabled: AtomicBool::new(true),
            rumination_ab_test: AtomicBool::new(false),
            debug_capture: AtomicBool::new(false),
            debug_routing: AtomicBool::new(false),
            prefer_8b: AtomicBool::new(false),
        }
    }

    pub fn from_env() -> Self {
        let exp = Self::new();
        if std::env::var("DEVPULSE_CAG_RRO").map(|v| v == "0").unwrap_or(false) {
            exp.cag_rro.store(false, Ordering::Relaxed);
        }
        if std::env::var("DEVPULSE_CAG_RERANKER").map(|v| v == "0").unwrap_or(false) {
            exp.cag_reranker.store(false, Ordering::Relaxed);
        }
        if std::env::var("DEVPULSE_DEBUG_CAPTURE").map(|v| v == "1").unwrap_or(false) {
            exp.debug_capture.store(true, Ordering::Relaxed);
        }
        if std::env::var("DEVPULSE_PREFER_8B").map(|v| v == "1").unwrap_or(false) {
            exp.prefer_8b.store(true, Ordering::Relaxed);
        }
        exp
    }

    // Getters
    pub fn cag_rro_enabled(&self) -> bool { self.cag_rro.load(Ordering::Relaxed) }
    pub fn cag_reranker_enabled(&self) -> bool { self.cag_reranker.load(Ordering::Relaxed) }
    pub fn cag_adaptive_threshold_enabled(&self) -> bool { self.cag_adaptive_threshold.load(Ordering::Relaxed) }
    pub fn rumination_enabled(&self) -> bool { self.rumination_enabled.load(Ordering::Relaxed) }
    pub fn rumination_ab_test_enabled(&self) -> bool { self.rumination_ab_test.load(Ordering::Relaxed) }
    pub fn debug_capture_enabled(&self) -> bool { self.debug_capture.load(Ordering::Relaxed) }
    pub fn debug_routing_enabled(&self) -> bool { self.debug_routing.load(Ordering::Relaxed) }
    pub fn prefer_8b(&self) -> bool { self.prefer_8b.load(Ordering::Relaxed) }

    // Setters (for Lab UI)
    pub fn set_cag_rro(&self, enabled: bool) {
        self.cag_rro.store(enabled, Ordering::Relaxed);
        tracing::info!(flag = "cag_rro", enabled, "Experiment flag changed");
    }
    pub fn set_cag_reranker(&self, enabled: bool) {
        self.cag_reranker.store(enabled, Ordering::Relaxed);
        tracing::info!(flag = "cag_reranker", enabled, "Experiment flag changed");
    }
    pub fn set_debug_capture(&self, enabled: bool) {
        self.debug_capture.store(enabled, Ordering::Relaxed);
        tracing::info!(flag = "debug_capture", enabled, "Experiment flag changed");
    }
    pub fn set_prefer_8b(&self, enabled: bool) {
        self.prefer_8b.store(enabled, Ordering::Relaxed);
        tracing::info!(flag = "prefer_8b", enabled, "Experiment flag changed");
    }

    pub fn snapshot(&self) -> ExperimentsSnapshot {
        ExperimentsSnapshot {
            cag_rro: self.cag_rro_enabled(),
            cag_reranker: self.cag_reranker_enabled(),
            cag_adaptive_threshold: self.cag_adaptive_threshold_enabled(),
            rumination_enabled: self.rumination_enabled(),
            rumination_ab_test: self.rumination_ab_test_enabled(),
            debug_capture: self.debug_capture_enabled(),
            debug_routing: self.debug_routing_enabled(),
            prefer_8b: self.prefer_8b(),
        }
    }
}

impl Default for Experiments {
    fn default() -> Self { Self::new() }
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ExperimentsSnapshot {
    pub cag_rro: bool,
    pub cag_reranker: bool,
    pub cag_adaptive_threshold: bool,
    pub rumination_enabled: bool,
    pub rumination_ab_test: bool,
    pub debug_capture: bool,
    pub debug_routing: bool,
    pub prefer_8b: bool,
}
```

---

### File 3: `orchestrator/src/runtime/runtime.rs` (NEW)

```rust
//! DevPulseRuntime - Unified subsystem ownership

use crate::cortex::{Router, CAG};
use crate::infra::{
    bus::EventBus,
    embedder::EmbedderBackend,
    fjall::FjallKV,
    libsql::Database,
    moka::HotCache,
    models::ModelRegistry,
    rro::VectorStore,
    reranker::RerankerBackend,
};
use crate::runtime::Experiments;
use shared::config::{get_paths, context};
use anyhow::Result;
use std::sync::Arc;

/// Unified storage handle - ALL REQUIRED (no Option<>)
pub struct Storage {
    pub bus: EventBus,              // L1: Reflex (broadcast)
    pub cache: HotCache,            // L2: moka (30s/5min tiers)
    pub db: Database,               // L3: libSQL - REQUIRED
    pub vectors: Arc<VectorStore>,  // L4: RRO
    pub kv: FjallKV,                // L5: fjall - REQUIRED
}

/// Unified inference handle
pub struct Inference {
    pub embedder: Arc<EmbedderBackend>,
    pub reranker: Arc<RerankerBackend>,
    pub registry: ModelRegistry,
}

/// Unified cortex handle
pub struct Cortex {
    pub router: Router,
    pub cag: CAG,
    // Rumination spawned on-demand by router
}

/// The unified runtime - owns everything
pub struct DevPulseRuntime {
    pub experiments: Arc<Experiments>,
    pub storage: Storage,
    pub inference: Inference,
    pub cortex: Cortex,
}

impl DevPulseRuntime {
    pub async fn init() -> Result<Self> {
        let paths = get_paths();
        paths.ensure_dirs()?;

        // Start Tracy client FIRST
        tracing_tracy::client::Client::start();

        tracing::info!(
            data_dir = %paths.data_dir.display(),
            "Initializing DevPulse runtime"
        );

        let experiments = Arc::new(Experiments::from_env());

        // Storage - ALL REQUIRED
        let bus = EventBus::new();
        let cache = HotCache::new();
        let db = Database::open(&paths.global_db).await?;
        let vectors = Arc::new(VectorStore::new(&paths.rro_dir).await?);
        let kv = FjallKV::open(&paths.fjall_dir)?;

        // Run migrations
        db.migrate().await?;

        let storage = Storage { bus, cache, db, vectors, kv };

        // Inference
        let registry = ModelRegistry::new_from_paths(paths);
        let embedder = Arc::new(EmbedderBackend::new(&registry)?);
        let reranker = Arc::new(RerankerBackend::new(&registry)?);
        let inference = Inference { embedder, reranker, registry };

        // Cortex - router spawns rumination on demand
        let router = Router::new();
        let cag = CAG::new(
            Arc::clone(&inference.embedder),
            Arc::clone(&storage.vectors),
            Arc::clone(&inference.reranker),
        );
        let cortex = Cortex { router, cag };

        tracing::info!("DevPulse runtime initialized");

        Ok(Self { experiments, storage, inference, cortex })
    }

    pub fn handle(&self) -> RuntimeHandle {
        RuntimeHandle {
            experiments: Arc::clone(&self.experiments),
        }
    }

    pub async fn shutdown(&self) -> Result<()> {
        tracing::info!("Shutting down DevPulse runtime");
        // Flush fjall, close libSQL, etc.
        Ok(())
    }
}

#[derive(Clone)]
pub struct RuntimeHandle {
    pub experiments: Arc<Experiments>,
}

impl RuntimeHandle {
    pub fn snapshot(&self) -> RuntimeSnapshot {
        RuntimeSnapshot {
            experiments: self.experiments.snapshot(),
        }
    }
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct RuntimeSnapshot {
    pub experiments: crate::runtime::experiments::ExperimentsSnapshot,
}
```

---

### File 4: `shared/src/types/umbrella.rs` (NEW)

```rust
//! 9 Umbrellas - Governance categories

use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
pub enum Umbrella {
    Safety,       // User harm prevention
    Privacy,      // Data protection
    Security,     // System security
    Compliance,   // Legal/regulatory
    Ethics,       // Moral considerations
    Quality,      // Output quality
    Performance,  // System performance
    Cost,         // Resource usage
    Scope,        // Task boundaries
}

impl Umbrella {
    pub fn as_str(&self) -> &'static str {
        match self {
            Self::Safety => "safety",
            Self::Privacy => "privacy",
            Self::Security => "security",
            Self::Compliance => "compliance",
            Self::Ethics => "ethics",
            Self::Quality => "quality",
            Self::Performance => "performance",
            Self::Cost => "cost",
            Self::Scope => "scope",
        }
    }
}
```

---

### File 5: Database Migrations (ADD)

`orchestrator/src/infra/libsql/migrations/001_init.sql`:

```sql
-- Sessions
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    project_id TEXT,
    started_at INTEGER NOT NULL,
    ended_at INTEGER
);

-- Decisions (Constrained Memory / Forcing Function)
CREATE TABLE IF NOT EXISTS decisions (
    id TEXT PRIMARY KEY,
    project_id TEXT NOT NULL,
    category TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    source TEXT NOT NULL,  -- 'forced' or 'promoted'
    created_at INTEGER NOT NULL,
    UNIQUE(project_id, category, key)
);

-- Lane Runs (Trace Correlation)
CREATE TABLE IF NOT EXISTS lane_runs (
    id TEXT PRIMARY KEY,
    trace_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    lane TEXT NOT NULL,
    signal_kind TEXT NOT NULL,
    started_at INTEGER NOT NULL,
    ended_at INTEGER,
    status TEXT NOT NULL,
    FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- LLM Calls
CREATE TABLE IF NOT EXISTS llm_calls (
    id TEXT PRIMARY KEY,
    trace_id TEXT NOT NULL,
    lane_run_id TEXT NOT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (lane_run_id) REFERENCES lane_runs(id)
);

-- Governance Violations
CREATE TABLE IF NOT EXISTS governance_violations (
    id TEXT PRIMARY KEY,
    trace_id TEXT NOT NULL,
    umbrella TEXT NOT NULL,
    severity TEXT NOT NULL,
    message TEXT NOT NULL,
    context TEXT,
    created_at INTEGER NOT NULL
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lane_runs_trace ON lane_runs(trace_id);
CREATE INDEX IF NOT EXISTS idx_lane_runs_session ON lane_runs(session_id);
CREATE INDEX IF NOT EXISTS idx_llm_calls_trace ON llm_calls(trace_id);
CREATE INDEX IF NOT EXISTS idx_decisions_project ON decisions(project_id, category);
```

---

### File 6: Update `orchestrator/src/lib.rs` (MODIFY)

```rust
pub mod runtime;
pub use runtime::{DevPulseRuntime, RuntimeHandle, Experiments};
```

---

## Part 5: Dependency Order

```
1. shared/src/types/umbrella.rs          (no deps)
2. orchestrator/src/infra/libsql/migrations/  (SQL files)
3. orchestrator/src/runtime/mod.rs       (module declaration)
4. orchestrator/src/runtime/experiments.rs (no deps)
5. orchestrator/src/runtime/runtime.rs   (depends on all infra)
6. Update lib.rs exports
```

---

## Part 6: Approval Checklist

- [x] Tracy explicit `Client::start()`
- [x] libSQL REQUIRED (not Option<>)
- [x] fjall REQUIRED (not Option<>)
- [x] decisions table for constrained memory
- [x] lane_runs with trace_id (W3C traceparent)
- [x] llm_calls with trace_id
- [x] governance_violations table
- [x] 9 Umbrellas enum
- [x] Model path hierarchy (env > session > project > global > default)
- [x] Rumination spawned by router on demand
- [x] Lab TUI + WebSocket both
- [x] rkyv for internal MCP (noted, will use in fjall)

---

## Ready for Implementation

Once you confirm, I will implement in the exact order specified.
