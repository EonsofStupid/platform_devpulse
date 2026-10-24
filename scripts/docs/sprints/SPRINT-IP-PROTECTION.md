# SPRINT: IP Protection — Kernel/Engine Boundary

**Status**: COMPLETE (Phases 1-6)
**Research**: [SPRINT-IP-PROTECTION.research.md](SPRINT-IP-PROTECTION.research.md)
**Date**: 2026-03-01
**Depends on**: None (foundational sprint)

## Goal

Establish the complete IP protection system so the kernel→engine boundary is airtight. When built with `--features engine`, zero kernel terminology appears in the binary, logs, traces, or UI. When built with `--features kernel`, full internal detail is visible.

## Architecture

```
kernel_terms.toml (SSOT — 47 terms, 5 categories)
        │
        ├─→ build.rs ─→ engine_vocabulary.rs (HashMap constructor)
        │                       │
        │                       └─→ ip/mod.rs
        │                              ├── ENGINE_VOCABULARY (engine builds only)
        │                              ├── ip_term!() macro
        │                              │     ├── kernel: passthrough
        │                              │     └── engine: HashMap lookup
        │                              └── dev tool helpers (kernel only)
        │
        ├─→ build.rs ─→ scanner_terms.json (for future CI scanner)
        │
        └─→ ip/redaction.rs ─→ TraceDetail (Full vs Summary)

platform/mod.rs ─→ Platform facade
        ├── health.rs ─→ SystemHealth (public type)
        ├── init.rs   ─→ InitEvent (public type)
        └── config.rs ─→ PlatformConfig (public type)
```

## Prerequisites

- [x] SurrealDB import fixed (RocksDb → SurrealKv)
- [x] Fjall removed from workspace
- [x] kernel_terms.toml created with 47 terms
- [x] build.rs generates vocabulary + scanner JSON
- [x] Feature gates in Cargo.toml + lib.rs
- [x] ip_term!() macro defined (kernel + engine variants)
- [x] Maestro PersistenceLayer has granular init + ping methods
- [x] Tauri depends on engine only (never maestro)

## Current State Audit

```
systems/devpulse-engine/src/
├── lib.rs          ✅ Feature gates, declares ip + signals + platform
├── ip/
│   └── mod.rs      ⚠️  Uses once_cell (should be LazyLock), static not feature-gated
├── signals/        ✅ Complete (7 files)
├── platform/       ❌ EMPTY — declared in lib.rs but no mod.rs → compilation fails
├── engine/         🗑️ Dead stubs — NOT in module tree, must delete
└── hyde/           🗑️ Dead stub — NOT in module tree, must delete
```

---

## Phase 1: Clean Slate (delete dead code, fix compilation)

### Task 1.1: Delete dead code
- [ ] Delete `systems/devpulse-engine/src/engine/` directory (entire tree)
- [ ] Delete `systems/devpulse-engine/src/hyde/` directory (entire tree)
- [ ] Verify: `grep -r "mod engine\|mod hyde" systems/devpulse-engine/src/lib.rs` returns nothing

### Task 1.2: Fix ip/mod.rs — LazyLock + proper feature gating
- [ ] Replace `once_cell::sync::Lazy` with `std::sync::LazyLock`
- [ ] Feature-gate `ENGINE_VOCABULARY` static to `#[cfg(feature = "engine")]` only
- [ ] Add `#[cfg(feature = "kernel")]` dev tool function that loads vocabulary on-demand (not static)
- [ ] Remove `once_cell` from `Cargo.toml` dependencies

**Before:**
```rust
use once_cell::sync::Lazy;
use std::collections::HashMap;

pub static ENGINE_VOCABULARY: Lazy<HashMap<&'static str, &'static str>> =
    Lazy::new(|| include!(concat!(env!("OUT_DIR"), "/engine_vocabulary.rs")));
```

**After:**
```rust
use std::collections::HashMap;
use std::sync::LazyLock;

/// Engine vocabulary — loaded from kernel_terms.toml via build.rs.
/// Only exists in engine builds. Kernel builds use the macro passthrough.
#[cfg(feature = "engine")]
pub static ENGINE_VOCABULARY: LazyLock<HashMap<&'static str, &'static str>> =
    LazyLock::new(|| include!(concat!(env!("OUT_DIR"), "/engine_vocabulary.rs")));

/// Load vocabulary for dev tool display (kernel builds only).
/// Returns a fresh HashMap each call — not a static, since kernel builds
/// only need this for the dev tool preview, not hot-path lookup.
#[cfg(feature = "kernel")]
pub fn dev_vocabulary() -> HashMap<&'static str, &'static str> {
    include!(concat!(env!("OUT_DIR"), "/engine_vocabulary.rs"))
}
```

- [ ] Update `dictionary_entries()` to use `dev_vocabulary()` instead of `ENGINE_VOCABULARY`
- [ ] Update `remap_text()` to use `dev_vocabulary()` instead of `ENGINE_VOCABULARY`

### Task 1.3: Create platform/mod.rs stub (unblock compilation)
- [ ] Create `systems/devpulse-engine/src/platform/mod.rs` with minimal module declaration
- [ ] Verify: `cargo check -p devpulse-engine` passes

**Checkpoint: `cargo check --workspace` must pass**

---

## Phase 2: Platform Facade Types

### Task 2.1: Create platform/health.rs
- [ ] Define `SystemHealth` struct (Serialize, TS for ts-rs)
- [ ] Define `SubsystemHealth` struct
- [ ] Define `HealthStatus` enum (Healthy, Degraded, Down, Unknown)
- [ ] All types use `ip_term!()` for any user-facing strings

```rust
use serde::Serialize;
use ts_rs::TS;

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct SystemHealth {
    pub status: HealthStatus,
    pub uptime_secs: u64,
    pub subsystems: Vec<SubsystemHealth>,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct SubsystemHealth {
    pub name: String,        // ip_term!() applied at creation
    pub status: HealthStatus,
    pub latency_ms: Option<u64>,
    pub message: Option<String>,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub enum HealthStatus {
    Healthy,
    Degraded,
    Down,
    Unknown,
}
```

### Task 2.2: Create platform/init.rs
- [ ] Define `InitEvent` struct (emitted during startup)
- [ ] Define `InitStep` enum (each database + subsystem)

```rust
#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub struct InitEvent {
    pub step: String,           // ip_term!() applied
    pub status: InitStatus,
    pub message: Option<String>,
    pub latency_ms: Option<u64>,
}

#[derive(Debug, Clone, Serialize, TS)]
#[ts(export)]
pub enum InitStatus {
    Running,
    Ok,
    Error,
    Skipped,
}
```

### Task 2.3: Create platform/config.rs
- [ ] Define `PlatformConfig` struct (public settings)
- [ ] No maestro types exposed — only primitives and engine-owned types

```rust
#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct PlatformConfig {
    pub data_dir: String,
    pub databases: DatabaseConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize, TS)]
#[ts(export)]
pub struct DatabaseConfig {
    pub relational_enabled: bool,   // LibSQL
    pub analytics_enabled: bool,    // DuckDB
    pub graph_enabled: bool,        // SurrealDB
}
```

### Task 2.4: Create platform/mod.rs — the real facade
- [ ] Define `Platform` struct that owns maestro's `PersistenceLayer` (private field)
- [ ] Implement `Platform::boot(data_dir)` — initializes all databases with init events
- [ ] Implement `Platform::health()` — pings databases, returns `SystemHealth`
- [ ] Implement `Platform::config()` — returns `PlatformConfig`
- [ ] Implement `Platform::uptime_secs()` — time since boot

```rust
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Instant;
use tokio::sync::RwLock;
use anyhow::Result;
use devpulse_maestro::cortex::persistence::{PersistenceConfig, PersistenceLayer};
use crate::ip_term;

pub mod config;
pub mod health;
pub mod init;

pub use config::PlatformConfig;
pub use health::{HealthStatus, SubsystemHealth, SystemHealth};
pub use init::{InitEvent, InitStatus};

/// Platform facade — sole public API for persistence, health, config.
/// Wraps maestro internals. Tauri talks to this, never to maestro.
pub struct Platform {
    persistence: Arc<RwLock<PersistenceLayer>>,
    boot_time: Instant,
    data_dir: PathBuf,
}

impl Platform {
    /// Boot the platform — initialize all databases.
    /// Returns init events for each step (for launcher UI).
    pub async fn boot(
        data_dir: PathBuf,
        on_event: impl Fn(InitEvent),
    ) -> Result<Self> {
        let boot_time = Instant::now();
        let config = PersistenceConfig::new(&data_dir);
        let mut persistence = PersistenceLayer::new(config);

        // Step 1: Ensure directories
        on_event(InitEvent::running(ip_term!("data layer"), "Creating directories"));
        persistence.ensure_dirs()?;
        on_event(InitEvent::ok(ip_term!("data layer"), "Directories ready"));

        // Step 2: LibSQL
        on_event(InitEvent::running("Relational store", "Opening database"));
        let start = Instant::now();
        persistence.init_libsql().await?;
        on_event(InitEvent::ok_with_latency("Relational store", start.elapsed()));

        // Step 3: DuckDB
        on_event(InitEvent::running("Analytics store", "Opening database"));
        let start = Instant::now();
        persistence.init_duckdb()?;
        on_event(InitEvent::ok_with_latency("Analytics store", start.elapsed()));

        // Step 4: SurrealDB
        on_event(InitEvent::running("Graph store", "Opening database"));
        let start = Instant::now();
        persistence.init_surreal().await?;
        on_event(InitEvent::ok_with_latency("Graph store", start.elapsed()));

        Ok(Self {
            persistence: Arc::new(RwLock::new(persistence)),
            boot_time,
            data_dir,
        })
    }

    /// Get system health by pinging all databases.
    pub async fn health(&self) -> SystemHealth { ... }

    /// Get platform configuration.
    pub fn config(&self) -> PlatformConfig { ... }

    /// Uptime in seconds since boot.
    pub fn uptime_secs(&self) -> u64 { ... }
}
```

**Checkpoint: `cargo check -p devpulse-engine` must pass**

---

## Phase 3: IP Redaction Layer

### Task 3.1: Create ip/redaction.rs
- [ ] Define `TraceDetail` with feature-gated variants
- [ ] Implement `redact_trace()` for engine builds
- [ ] Implement `summarize_steps()` — reasoning steps → human-friendly summary
- [ ] Add `pub mod redaction;` to `ip/mod.rs`

```rust
// Full detail (kernel builds only)
#[cfg(feature = "kernel")]
#[derive(Debug, Clone, Serialize)]
pub struct TraceDetail {
    pub agent: String,
    pub layer: String,
    pub latency_budget_ms: u64,
    pub actual_latency_ms: u64,
    pub algorithm: String,
    pub cache_hit: bool,
    pub token_count: usize,
    pub reasoning_steps: Vec<String>,
}

// Summarized (engine builds only)
#[cfg(feature = "engine")]
#[derive(Debug, Clone, Serialize)]
pub struct TraceDetail {
    pub phase: String,
    pub time_ms: u64,
    pub tokens_used: usize,
    pub confidence: f32,
    pub description: String,
}
```

**Checkpoint: `cargo check -p devpulse-engine --features kernel` and `cargo check -p devpulse-engine --no-default-features --features engine` must both pass**

---

## Phase 4: CI Feature Matrix

### Task 4.1: Add engine build check to CI
- [ ] Add step to `.github/workflows/ci.yml`:

```yaml
- name: Check engine build (IP protection)
  run: cargo check -p devpulse-engine --no-default-features --features engine
```

### Task 4.2: Add feature matrix to CI
- [ ] Both `kernel` and `engine` features tested in CI
- [ ] Ensures feature gate `compile_error!` stays enforced

**Checkpoint: CI pipeline passes for both feature sets**

---

## Phase 5: Tauri Wiring (connects facade to desktop)

### Task 5.1: Add AppState
- [ ] Create `interfaces/desktop/src-tauri/src/state.rs`
- [ ] Define `AppState` struct with `Arc<Platform>`

### Task 5.2: Add setup() hook
- [ ] Modify `src-tauri/src/lib.rs` to add `.setup()` callback
- [ ] Call `Platform::boot()` with app data dir
- [ ] Emit Tauri events for each init step
- [ ] `app.manage(AppState { platform })`

### Task 5.3: Wire real IPC commands
- [ ] `get_status` → `platform.health()` (replace stub)
- [ ] `get_settings` → `platform.config()` (replace stub)
- [ ] Add `system_health` command → `platform.health()` full response

### Task 5.4: Add tokio to Tauri deps
- [ ] Add `tokio = { workspace = true }` to `src-tauri/Cargo.toml`

**Checkpoint: `cargo check -p devpulse_desktop_backend` must pass, `cargo build --workspace` must pass**

---

## Phase 6: Enforcement Hardening (7 Layers)

**Goal**: Code-enforced guarantees that prevent humans and AI from accidentally breaking the IP boundary. No single layer is responsible — each catches a different class of violation.

```
git add → Layer 1: Lefthook shell hook    (sub-200ms, grep staged diff)
        → Layer 2: Biome GritQL plugin    (AST-level, TS/Svelte strings)
git push → Layer 3: cargo-deny ban        (dependency graph)
CI       → Layer 4: xtask boundary check  (cargo metadata invariants)
         → Layer 5: Vitest architecture    (committed frontend files)
         → Layer 6: CI workflow steps      (ties 3-5 into PR gate)
always   → Layer 7: .claude/rules         (AI drift prevention)
```

### Task 6.1: Pre-commit shell hook (Layer 1)
- [x] Create `scripts/hooks/ip-boundary-check.sh` — scans staged diff for kernel terms
- [x] Add `ip-boundary-check` command to `lefthook.yml` (parallel with existing hooks)
- [x] Reads terms from `kernel_terms.toml` SSOT, exempts kernel/ and sprint docs

### Task 6.2: Biome GritQL plugin (Layer 2)
- [x] Create `interfaces/desktop/gritql/no-kernel-terms.grit` — AST-level string literal matching
- [x] Add plugin to `interfaces/desktop/biome.json`
- [x] 5 category blocks: sub-agents, architecture, rumination, COSTAR, algorithms

### Task 6.3: cargo-deny dependency ban (Layer 3)
- [x] Add `[[bans.deny]]` for `devpulse-maestro` with `wrappers = ["devpulse-engine"]` to `deny.toml`
- [x] Allows engine→maestro, blocks desktop→maestro (and any other crate)

### Task 6.4: xtask workspace boundary check (Layer 4)
- [x] Add `cargo_metadata` dependency to `xtask/Cargo.toml`
- [x] Implement `VerifyIpBoundary` subcommand in `xtask/src/main.rs`
- [x] Check 1: Desktop has NO direct dep on maestro
- [x] Check 2: Engine DOES depend on maestro (facade pattern)
- [x] Check 3: Engine has both `kernel` and `engine` feature gates
- [x] Verified: `cargo xtask verify-ip-boundary` passes (3/3 OK)
- [x] Verified: `cargo clippy -p xtask -- -D warnings` passes clean

### Task 6.5: Vitest architecture test (Layer 5)
- [x] Create `interfaces/desktop/tests/architecture/ip-boundary.test.ts`
- [x] Create `interfaces/desktop/vitest.config.arch.ts` (Node mode, no browser)
- [x] Add `test:arch` script to `interfaces/desktop/package.json`
- [x] Word-boundary regex for short terms (CAG, RRO, HMM, BM25) to avoid false positives
- [x] Baselined known violations in existing UI code (Maestro dashboard labels — deferred to SPRINT-LAUNCHER-UI)
- [x] Verified: `pnpm test:arch` passes (2/2 tests)

### Task 6.6: CI integration (Layer 6)
- [x] Add `cargo xtask verify-ip-boundary` step to rust job in `.github/workflows/ci.yml`
- [x] Add `cargo deny check bans` step to rust job
- [x] Add `pnpm test:arch` step to desktop job

### Task 6.7: AI drift prevention rules (Layer 7)
- [x] Create `.claude/rules/ip-protection.md` — scoped to engine/desktop paths
- [x] Lists all 47 forbidden kernel terms by category
- [x] States rules: `ip_term!()` in engine Rust, public equivalents in frontend
- [x] Includes quick-reference public equivalents table

**Checkpoint: All layers verified — `cargo xtask verify-ip-boundary`, `pnpm test:arch`, `cargo clippy -p xtask` all pass**

---

## Verification Checklist

After all phases:

- [ ] `cargo check --workspace` — passes
- [ ] `cargo check -p devpulse-engine --features kernel` — passes (default)
- [ ] `cargo check -p devpulse-engine --no-default-features --features engine` — passes
- [ ] `cargo clippy --workspace -- -D warnings` — passes
- [ ] No `engine/` or `hyde/` stubs remain
- [ ] `once_cell` removed from engine Cargo.toml
- [ ] `ENGINE_VOCABULARY` only exists in engine builds
- [ ] `ip_term!()` macro works in both modes
- [ ] Platform facade compiles and wraps maestro PersistenceLayer
- [ ] Tauri doesn't import any maestro types
- [ ] CI builds both feature sets

## Deferred (Future Sprints)

| Item | Sprint | Reason |
|------|--------|--------|
| IP Scanner binary (`syn` AST visitor) | SPRINT-IP-SCANNER | Need facade code to scan first |
| CI scanner workflow job | SPRINT-IP-SCANNER | Depends on scanner binary |
| Dev tool UI (kernel↔engine preview) | SPRINT-LAB-DEVTOOLS | Lab feature, not blocking |
| Workspace separation (crate boundary) | SPRINT-CRATE-ISOLATION | Current approach sufficient |
| Enum-based ip_term! (stronger binary protection) | SPRINT-IP-HARDENING | If threat model escalates |
| Resolve baselined kernel terms in UI labels | SPRINT-LAUNCHER-UI | Known violations in Maestro dashboard labels |
| Frontend launcher route | SPRINT-LAUNCHER-UI | Depends on this sprint |
| StatusBar wiring to real health | SPRINT-LAUNCHER-UI | Depends on this sprint |

## Notes

- **Maestro uses kernel terms internally — this is CORRECT.** The IP boundary is at the engine facade, not within maestro.
- **ip_term!() is for ENGINE code only** — code that produces user-facing strings. Maestro internals use raw terms.
- **Platform facade is the translation layer** — it takes maestro types (with kernel terms) and produces engine types (with public terms).
- **The TOML dictionary is the only thing you edit** to add new protected terms. Everything else derives automatically.
