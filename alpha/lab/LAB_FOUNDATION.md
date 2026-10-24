# Lab Foundation Specification

**Date**: 2026-01-10  
**Status**: AUTHORITATIVE - This document defines lab boundaries and contracts.

---

## Executive Summary

Lab is DevPulse's **internal-only observer and analytics tool**. It captures everything from chat, signals, and system behavior into dedicated databases (`lab.db`, `lab_analytics.duckdb`) that are **completely separate** from the production Engine.

**Key Principle**: Lab observes and records. It never interferes with the production data path.

---

## 1. Lab Boundary Definition

### What Lab IS:
- Development/tuning dashboard for YOU (and eventually junior devs)
- Observer capturing chat, signals, inference metrics, hop metrics
- Analytics engine (DuckDB) for pattern analysis without taxing your eyes
- Experiment sandbox with clear boundaries
- Documentation generator as features are built

### What Lab is NOT:
- Part of the production desktop app
- A dependency of Engine, Orchestrator, or Shared
- Something that ships to end users
- A replacement for Engine's own storage

### Boundary Enforcement:

```
┌─────────────────────────────────────────────────────────────────┐
│                         PRODUCTION                               │
│  ┌─────────────┐   ┌──────────────┐   ┌────────────────────┐   │
│  │   Engine    │───│ Orchestrator │───│ Desktop (Tauri)    │   │
│  │  (signals)  │   │  (chat/CAG)  │   │  (end-user app)    │   │
│  └──────┬──────┘   └──────────────┘   └────────────────────┘   │
│         │                                                        │
│         │ SignalRouter.subscribe()                               │
│         │ (read-only observer pattern)                          │
│         ▼                                                        │
├─────────┼───────────────────────────────────────────────────────┤
│         │               LAB BOUNDARY                             │
│  ┌──────▼──────────────────────────────────────────────────┐    │
│  │                    Lab Backend                           │    │
│  │  ┌────────────────┐  ┌────────────────┐                 │    │
│  │  │   lab.db       │  │ lab_analytics  │                 │    │
│  │  │   (libSQL)     │  │   (DuckDB)     │                 │    │
│  │  │ - experiments  │  │ - all events   │                 │    │
│  │  │ - lab configs  │  │ - metrics      │                 │    │
│  │  │ - baselines    │  │ - patterns     │                 │    │
│  │  └────────────────┘  └────────────────┘                 │    │
│  └─────────────────────────────────────────────────────────┘    │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │                    Lab UI (SvelteKit)                    │    │
│  │  Dashboards, visualizations, experiment controls         │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. Database Ownership

### Lab's Databases (ISOLATED):

| Database | Technology | Purpose | Location |
|----------|-----------|---------|----------|
| `lab.db` | libSQL | Lab-specific experiments, configs, baselines | `~/.devpulse/data/lab.db` |
| `lab_analytics.duckdb` | DuckDB | ALL events, metrics, patterns for analysis | `~/.devpulse/data/lab_analytics.duckdb` |

### Production Databases (Lab READS from Engine, never writes):

| Database | Technology | Purpose | Lab Access |
|----------|-----------|---------|------------|
| `maestro.db` | libSQL | Sessions, messages, decisions, personas | READ via Engine facade |
| `analytics.duckdb` | DuckDB | Engine's own telemetry | READ via Engine facade |
| `fjall/` | Fjall | Parking lot, raw signals | READ via Engine facade |
| RRO | Qdrant-embedded | Vectors | READ via Engine facade |

---

## 3. Observer Contract: What Lab Captures

### 3.1 Signal Stream (Real-Time)

Lab subscribes to `Engine.router.subscribe()` and captures ALL signals:

```rust
// state.rs - already implemented
async fn bridge_signals(router: Arc<SignalRouter>, tx: broadcast::Sender<SignalEvent>) {
    let mut rx = router.subscribe();
    loop {
        match rx.recv().await {
            Ok(signal) => {
                let event = SignalEvent { /* ... */ };
                let _ = tx.send(event);  // Broadcast to SSE/WS clients
                // TODO: Also persist to lab_analytics.duckdb
            }
        }
    }
}
```

**MISSING**: Signals are broadcast to UI but NOT persisted to `lab_analytics.duckdb`.

### 3.2 Chat Capture (Via Engine)

Chat is recorded by Orchestrator's `ChatEngine`:

```rust
// orchestrator/src/chat/mod.rs - already implemented
// Records user message
self.db.record_message(&self.session_id, "user", message, None).await?;

// Logs to DuckDB
self.analytics.record_event("chat.send", &serde_json::json!({...}))?;

// Records assistant response
self.db.record_message(&self.session_id, "assistant", &response.message, metadata).await?;
```

**STATUS**: ✅ WORKING - Chat goes to Engine's databases. Lab reads via Engine facade.

### 3.3 Inference Metrics (Via Engine)

```rust
// orchestrator/src/infra/duckdb.rs - already implemented
pub fn record_inference(&self, model_id: &str, tokens_in: u32, tokens_out: u32, latency_ms: u32) -> Result<()>
```

**STATUS**: ✅ METHODS EXIST - Need to verify all inference paths call this.

### 3.4 Hop Metrics (Via Engine)

```rust
// orchestrator/src/infra/duckdb.rs - already implemented
pub fn record_hop(&self, session_id: &str, hop_number: u8, confidence: f32, latency_ms: u32) -> Result<()>
```

**STATUS**: ⚠️ METHOD EXISTS - Need to wire into cortex hop execution.

---

## 4. What's Missing (Prioritized)

### P0: CRITICAL (Lab cannot function without these)

| Item | Status | What's Needed |
|------|--------|---------------|
| Signal persistence to lab_analytics | ❌ MISSING | Persist every signal to DuckDB in bridge_signals() |
| Signal replay/query API | ❌ MISSING | GET /api/signals/history endpoint |
| Lab experiments table | ❌ MISSING | libSQL schema for experiment configs |

### P1: HIGH (Insights you need)

| Item | Status | What's Needed |
|------|--------|---------------|
| Chat metrics aggregation | ⚠️ PARTIAL | Queries for session stats, message counts over time |
| Inference timeline visualization | ❌ MISSING | UI component showing latency over time |
| Pattern detection queries | ❌ MISSING | DuckDB analytics queries |

### P2: MEDIUM (For junior dev onboarding)

| Item | Status | What's Needed |
|------|--------|---------------|
| Component documentation | ❌ MISSING | Each route needs clear docstrings |
| API documentation | ❌ MISSING | OpenAPI spec or markdown |
| Experiment framework | ❌ MISSING | A/B test harness |

### P3: LOW (Polish)

| Item | Status | What's Needed |
|------|--------|---------------|
| ROTI calculator | ❌ STUB | Needs time/value tracking system |
| Lane metrics | ❌ STUB | Need orchestrator to emit lane events |
| Agent status | ❌ STUB | Blocked on orchestrator sub_agents |

---

## 5. Clean Removal Strategy

When building production desktop:

### Files to EXCLUDE from production build:

```toml
# desktop/src-tauri/Cargo.toml
[features]
default = []
lab = ["dep:lab"]  # Only include lab in dev builds

# Build without lab:
# cargo build --release
# Build with lab:
# cargo build --release --features lab
```

### Directories to NEVER bundle:

- `alpha/lab/` - entire crate
- `~/.devpulse/data/lab.db` - lab's libSQL
- `~/.devpulse/data/lab_analytics.duckdb` - lab's DuckDB

### Compile-time enforcement:

```rust
// lab/src/main.rs - already has this
#[cfg(not(debug_assertions))]
compile_error!("Lab should never be compiled in release mode");
```

---

## 6. Development Methodology

### For EVERY new Lab feature:

1. **Contract First**: Define the API endpoint signature
2. **Schema**: Add any new tables to lab.db or lab_analytics
3. **Backend**: Implement route handler
4. **Frontend**: Build UI component
5. **Test**: Verify with real data
6. **Document**: Update this file and route docstrings

### Component Checklist Template:

```markdown
## [Component Name]

### Contract
- Endpoint: `[METHOD] /api/[path]`
- Input: `{ ... }`
- Output: `{ ... }`

### Schema
- Table: `[table_name]` in `[lab.db | lab_analytics.duckdb]`
- Columns: ...

### Backend
- File: `alpha/lab/src/routes/[name].rs`
- Functions: ...

### Frontend
- Route: `alpha/lab/ui/src/routes/[name]/`
- Components: ...

### Tests
- [ ] Unit tests
- [ ] Integration test with real Engine

### Documentation
- [ ] Route docstring
- [ ] API example in this file
```

---

## 7. Current Architecture Status

### Backend Routes (9 total):

| Route | Status | Purpose |
|-------|--------|---------|
| `/api/health` | ✅ REAL | System startup checks |
| `/api/signals` | ✅ REAL | SSE/WS stream (not persisted) |
| `/api/chat` | ✅ REAL | Chat facade to Engine |
| `/api/analytics` | ✅ REAL | DuckDB queries |
| `/api/voice` | ✅ REAL | Voice profile CRUD |
| `/api/models` | ✅ REAL | Model registry |
| `/api/persona` | ✅ REAL | Persona CRUD |
| `/api/background` | ✅ REAL | Background task status |
| `/api/rumination` | ❌ STUB | Needs cortex wiring |

### Frontend Pages (14 total):

| Page | Status | Purpose |
|------|--------|---------|
| `/` | ✅ Health splash | Startup checks |
| `/dashboard` | ✅ Working | Overview |
| `/signals` | ✅ Working | Real-time signal stream |
| `/chat` | ⚠️ Needs verify | Chat interface |
| `/analytics` | ⚠️ Needs verify | Metrics display |
| `/voice` | ✅ Working | Voice profiles |
| `/models` | ⚠️ Needs verify | Model management |
| `/persona` | ⚠️ Needs verify | Persona editor |
| `/background` | ✅ Working | Task status |
| `/agents` | ❌ STUB | Sub-agent status (blocked) |
| `/roti` | ❌ STUB | ROTI calculator (blocked) |
| `/pipeline` | ❌ STUB | Lane metrics (blocked) |
| `/rumination` | ❌ STUB | Thought tree (blocked) |
| `/config` | ❌ STUB | Config editor (blocked) |

---

## 8. Next Actions (In Order)

### NOW:

1. **Add signal persistence** - Every signal goes to lab_analytics.duckdb
2. **Add signal history endpoint** - Query past signals
3. **Verify chat/analytics/models/persona UI** - Ensure they call real backends

### THIS WEEK:

4. **Create lab experiments schema** - For A/B tests and baselines
5. **Add inference timeline UI** - Visualize latency patterns
6. **Document each route** - Proper docstrings

### BLOCKED (until orchestrator implements):

- Rumination display (needs cortex CAG)
- Agent status (needs sub_agents registry)
- Lane metrics (needs orchestrator events)
- ROTI calculator (needs time/value tracking)
- Config SSOT (needs settings tables)

---

## 9. Verification Protocol

Before accepting ANY Lab code:

1. **Run the server**: `cargo run -p lab`
2. **Hit the endpoint**: curl or browser
3. **Check the database**: Verify data was written
4. **Check the UI**: Does it display real data?
5. **Read the code**: No TODOs in the critical path

**NEVER accept "it compiles" as verification.**

---

## Appendix A: Lab DuckDB Schema (Current)

```sql
-- From orchestrator/src/infra/duckdb.rs
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY,
    event_type VARCHAR NOT NULL,
    data VARCHAR,
    timestamp TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS inference_metrics (
    id INTEGER PRIMARY KEY,
    model_id VARCHAR NOT NULL,
    tokens_in INTEGER NOT NULL,
    tokens_out INTEGER NOT NULL,
    latency_ms INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL
);

CREATE TABLE IF NOT EXISTS hop_metrics (
    id INTEGER PRIMARY KEY,
    session_id VARCHAR NOT NULL,
    hop_number INTEGER NOT NULL,
    confidence REAL NOT NULL,
    latency_ms INTEGER NOT NULL,
    timestamp TIMESTAMP NOT NULL
);
```

### NEEDED: Lab-specific tables

```sql
-- Lab experiments tracking
CREATE TABLE IF NOT EXISTS experiments (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    config JSON NOT NULL,
    baseline_id TEXT,  -- Reference to baseline experiment
    status TEXT NOT NULL,  -- 'draft', 'running', 'completed', 'archived'
    created_at TIMESTAMP NOT NULL,
    completed_at TIMESTAMP
);

-- Lab baselines (snapshots for comparison)
CREATE TABLE IF NOT EXISTS baselines (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    metrics JSON NOT NULL,  -- Snapshot of key metrics
    created_at TIMESTAMP NOT NULL
);

-- Lab signal archive (for replay/analysis)
CREATE TABLE IF NOT EXISTS signal_archive (
    id TEXT PRIMARY KEY,
    signal_type TEXT NOT NULL,
    source TEXT NOT NULL,
    payload JSON NOT NULL,
    timestamp TIMESTAMP NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_signal_archive_type ON signal_archive(signal_type, timestamp);
CREATE INDEX IF NOT EXISTS idx_signal_archive_time ON signal_archive(timestamp);
```

---

## Appendix B: File Ownership

```
alpha/lab/
├── Cargo.toml              # Lab crate definition
├── LAB_FOUNDATION.md       # THIS FILE - authoritative spec
├── src/
│   ├── main.rs            # Axum server entry
│   ├── state.rs           # AppState with lab databases
│   ├── error.rs           # Error types
│   ├── cli.rs             # Legacy CLI tools
│   └── routes/
│       ├── mod.rs         # Route registration
│       ├── health.rs      # ✅ System checks
│       ├── signals.rs     # ✅ SSE/WS streaming
│       ├── chat.rs        # ✅ Chat facade
│       ├── analytics.rs   # ✅ DuckDB queries
│       ├── voice.rs       # ✅ Voice profiles
│       ├── models.rs      # ✅ Model registry
│       ├── persona.rs     # ✅ Persona CRUD
│       ├── background.rs  # ✅ Task status
│       └── rumination.rs  # ❌ STUB
└── ui/                    # SvelteKit frontend
    ├── package.json
    ├── src/
    │   ├── lib/
    │   │   ├── api/       # API clients
    │   │   ├── components/ # UI components
    │   │   └── stores/    # Svelte stores
    │   └── routes/        # Page routes
    └── static/            # Static assets
```
