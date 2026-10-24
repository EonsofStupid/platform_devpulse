# Research: xtask Foundation v2 — Dev-Time Platform Management, Feature Flags, Store Orchestration

**Date**: 2026-03-03
**Sprint**: SPRINT-XTASK-FOUNDATION-V2
**Status**: COMPLETE

## Question/Goal

The xtask orchestrator currently handles startup only — preflight, port management, launch. But the platform has 4 embedded databases, feature flags, health checks, and a full IPC command layer. Where is the dev-time management foundation? How do we give the developer visibility and control over the running platform during development?

Specific questions:
1. What infrastructure already exists for feature flags, health, store management?
2. What's missing between Rust config and TypeScript feature flags?
3. What xtask commands are needed beyond startup?
4. How does the README's "Dual Boot" and "Dogfood Verification" requirement map to reality?

## Codebase Analysis

### What EXISTS — Complete Inventory

#### 1. Backend Store Infrastructure (SOLID)

**Config chain**:
- `systems/devpulse-engine/platform.default.toml` — embedded default, 4 stores with `enabled` flags
- `systems/devpulse-engine/src/platform/config.rs` — `PlatformBootConfig` (internal, TOML-driven), `PlatformConfig` + `DatabaseConfig` (public, TS-exported)
- Override: user can place `platform.toml` in AppData to replace defaults (full replacement, not merge)

**Boot chain**:
- `interfaces/desktop/src-tauri/src/lib.rs:36-62` — creates Tokio runtime, calls `Platform::boot(data_dir, on_event)`
- `systems/devpulse-engine/src/platform/mod.rs:58-136` — `Platform::boot()` sequentially initializes enabled stores with `InitEvent` callbacks
- Post-boot: `platform.health()` pings all stores, prints verification results to stderr

**Health chain**:
- `systems/devpulse-engine/src/platform/health.rs` — `SystemHealth`, `SubsystemHealth`, `HealthStatus` (Healthy/Degraded/Down/Unknown)
- `systems/devpulse-engine/src/platform/mod.rs:142-172` — `platform.health()` pings each store independently, aggregates
- `interfaces/desktop/src-tauri/src/commands/devmaestro/mod.rs` — `get_status()` IPC command
- `interfaces/desktop/src/lib/sys/generated/health.types.ts` — TS mirrors of Rust health types
- `interfaces/desktop/src/lib/sys/runes/health.svelte.ts` — `PlatformHealth` class, polls every 15s, Svelte 5 `$state` runes

**Store types** (all embedded in Rust binary):
| Store | Kind | Backend | Path |
|-------|------|---------|------|
| Relational | libsql | LibSQL | libsql/platform.db |
| Analytics | duckdb | DuckDB | duckdb/analytics.duckdb |
| Graph | surreal | SurrealDB (kv-surrealkv) | surreal/reasoning |
| Cache | moka | Moka | in-memory |

#### 2. Frontend Feature Flags (PARTIAL)

**File**: `interfaces/desktop/src/lib/sys/cfg/flags.ts`

```typescript
export const flags = {
  // IP / INTERNAL MECHANICS
  ENABLE_VIPER_MEMORY: false,
  ENABLE_MAESTRO_THOUGHTS: false,
  ENABLE_JOURNEY_ANALYTICS: false,
  // DEV TOOLS
  DEV_MODE: import.meta.env.DEV,
  ENABLE_CONTEXT_DEBUGGER: false,
  // EXPERIMENTAL DOMAINS
  ENABLE_OVERMIND: true,
  ENABLE_WIREDFRONT: true,
};
```

**State**: Compile-time constants. NOT runtime-toggleable. Routes are always accessible regardless of flag values.

#### 3. Dev Tools (PARTIAL)

**Debug flag**: `sys/debug/DEBUG_FLAG.ts` — `__DEV__ = import.meta.env.DEV`, tree-shaken in production
**VPB**: Full Visual Page Builder at `sys/debug/vpb/` — Ctrl+Shift+B in dev mode. Design system tool only.
**No platform dev panel**: No store inspection, no health dashboard beyond StatusBar, no feature flag toggle UI

#### 4. Health UI (WORKING but minimal)

**Root layout** (`+layout.svelte`): starts `platformHealth.startPolling()` on mount
**StatusBar.svelte**: Shows connection dot (online/offline/hybrid), uptime, version
**Chat Frame.svelte**: Color-coded health status
**Chat +page.svelte**: Disables send button if not healthy, shows warning

#### 5. Tauri IPC Commands (15 total, 8 stubs)

| Command | Status | Purpose |
|---------|--------|---------|
| `get_status` | WORKING | Platform health (SystemHealth) |
| `get_settings` | WORKING | PlatformConfig (data_dir + DatabaseConfig) |
| `open_chat_window` | WORKING | Window management |
| `close_window` | WORKING | Window management |
| `focus_window` | WORKING | Window management |
| `send_message` | STUB | Chat (echo only) |
| `load_recent` | STUB | Chat history (empty vec) |
| `post_reaction` | STUB | Chat reactions |
| `verify` | STUB | Guard verification |
| `log` | STUB | System logging |
| `create_canvas` | STUB | ThinkMaestro |
| `connect_peer` | STUB | WiredFront |

#### 6. xtask Current Commands (4)

| Command | Lines | Purpose |
|---------|-------|---------|
| `preflight` | 124 | Toolchain validation (node_modules, pnpm, node, cargo) |
| `run-dev` | 97 | Banner → preflight → backend check → port → launch |
| `verify` | 31 | svelte-check + cargo check |
| `verify-ip-boundary` | 81 | cargo-metadata facade checks |

**Total xtask codebase**: 783 lines across 11 files

#### 7. README Requirements (xtask/README.md)

```
## The Law
1. Single Source of Truth: This runs the build, the dev server, the tests.
2. Dual Boot: `run-dev` MUST launch Platform and Lab.
3. Dogfood Verification: "Test" means RUNNING THE APP.
```

### What's MISSING — Gap Analysis

#### GAP 1: No Runtime Feature Flag System

Frontend `flags.ts` is compile-time only. Backend has `enabled` in TOML but no runtime toggle.
- No IPC command to toggle flags
- No bridge between `flags.ts` and `platform.default.toml`
- Routes don't gate on flags (OVERMIND and WIREDFRONT routes always accessible)

**Reality**: Feature flags exist as documentation, not as a system. They don't gate anything.

#### GAP 2: No Dev-Time Store Management

Platform boots stores in `lib.rs` setup closure. After boot:
- `health()` exists (polling every 15s) — but read-only
- No toggle (disable/enable a store at runtime)
- No reset (clear store data during dev)
- No inspect (query store state, see what's in LibSQL/DuckDB/SurrealDB)
- No migration tooling

**Reality**: Stores boot, stores get pinged, that's it. Zero management.

#### GAP 3: xtask Missing Commands per README

README says "This runs the build, the dev server, the tests." Currently:
- Build: NO command. CI-only via `.github/workflows/release.yml`
- Tests: NO command. Manual `pnpm test` or `cargo test`
- Design system: NO command. Manual `pnpm ds:tokens:build`, `pnpm coldlight:generate`
- Config validation: NO command. Runtime-only via `PlatformBootConfig::load()`
- Health standalone: NO command. Only via running Tauri app

#### GAP 4: Dual Boot Not Implemented

README says "`run-dev` MUST launch Platform and Lab." Currently `run-dev` launches Platform only (`pnpm tauri dev`). Lab has separate DB instances and is described as "observer pattern, subscribes only" — but there's no Lab launch path in xtask.

#### GAP 5: No Design System Pipeline Integration

The ColdLight design system has extensive build tooling:
- `pnpm ds:tokens:build` — SD5 token pipeline
- `pnpm coldlight:generate` — Scanner + manifest
- `pnpm coldlight:verify` — CI check
None of these are orchestrated by xtask.

#### GAP 6: No Type Sync Verification

Rust types with `#[derive(TS)]` export to TypeScript via ts-rs. But:
- No xtask command to run ts-rs export
- No verification that TS mirrors are in sync with Rust types
- Manual `health.types.ts` exists as a mirror — could drift from Rust source

## Findings

### The Core Problem

The xtask is a **launcher**, not an **orchestrator**. It validates toolchain, clears the port, and fires `pnpm tauri dev`. But the README says it should be "God Mode" — the single source of truth for build, dev, and test.

The embedded store architecture is actually solid:
- Config: TOML-driven with serde defaults, override mechanism
- Boot: Sequential with progress callbacks
- Health: Per-store pinging with aggregate status
- IPC: Working `get_status()` command
- Frontend: Svelte 5 rune-based health polling with reactive UI

But it stops at boot + health-read. There's no management layer.

### What the Owner is Asking For

"I want them running inside the platform yes but I want them also manageable during dev via our internal dev tools and feature flags"

This means:
1. **Stores manageable** — toggle, inspect, health-check independently
2. **Feature flags** — a real system that gates features, not compile-time constants
3. **Dev tools** — visibility into platform internals during development
4. **xtask as orchestrator** — not just launcher but management hub

### Architecture Reality Check

The platform has the RIGHT foundation pieces:
- `PlatformBootConfig` with per-store `enabled` flags
- `Platform::health()` with per-subsystem granularity
- `DatabaseConfig` exported to TypeScript via ts-rs
- IPC command layer with `get_status()` and `get_settings()`
- Health rune with reactive polling
- StatusBar showing connection status

What it needs is the WIRING between these pieces:
- xtask commands that exercise the health/config path without Tauri
- IPC commands for store management (not just read)
- Feature flag system that bridges Rust config ↔ TypeScript flags ↔ route gating
- Dev panel that exposes store state beyond a dot in the status bar

## Recommendations

### Priority Order

1. **xtask commands** — build, test, design-system pipeline (the README's own requirements)
2. **Store health as xtask command** — validate stores can boot WITHOUT full Tauri launch
3. **Feature flag bridge** — unify `flags.ts` and `platform.default.toml` into one coherent system
4. **Dev panel IPC** — store inspection, config display, health details beyond status dot
5. **Runtime flag toggle** — IPC command to change flags during dev (persisted to TOML/config)

### What NOT to Build (Scope Control)

- No store migration system (premature — stores are still being designed)
- No Lab integration (Lab architecture is "observer, subscribes only" — separate concern)
- No production feature flag service (compile-time gating is correct for production IP protection)
- No store CRUD inspection (too deep — stores are abstracted behind Platform facade)

### PARKING LOT (Deferred)

- [ ] Lab dual-boot in xtask (README requirement, but Lab not ready)
- [ ] ts-rs auto-sync verification command
- [ ] Store migration/reset tooling
- [ ] Runtime feature flag toggle (needs design decision on persistence)
- [ ] Production feature flag gating in routes

## SurrealDB 3.0.2 Migration — Technical Requirements

### Build Environment

**Dependency chain** (causes Windows build complexity):
```
surrealdb 3.0.2
├── surrealdb-core 3.0.2
│   └── jsonwebtoken 10.3.0 [features: use_pem, aws_lc_rs]  ← HARDCODED in surrealdb-core
│       └── aws-lc-rs 1.16.1
│           └── aws-lc-sys 0.38.0  ← C/ASM compilation, needs NASM + CMake
└── rustls 0.23.36 [features: aws_lc_rs]  ← HARDCODED in surrealdb
    └── aws-lc-rs (same as above)
```

**Why aws-lc-rs, not ring?**: SurrealDB 3.0 hardcodes `aws_lc_rs` for both `rustls` and `jsonwebtoken` on native targets. WASM uses `ring` (rustls) and `rust_crypto` (jsonwebtoken). This is SurrealDB's upstream decision — not something to fork around.

**Windows build requirements for aws-lc-sys 0.38.0:**
1. **NASM assembler** — x86/x64 assembly optimizations. Located: `D:\localdev\deps\nasm-3.01\nasm.exe`
2. **CMake** — drives the C/ASM build. Already available via Visual Studio.
3. **MSVC** — C compiler. Already available.
4. **Prebuilt NASM objects** — aws-lc-sys ships prebuilt `.obj` files in `builder/prebuilt-nasm/`. Activated when NASM not found OR `AWS_LC_SYS_PREBUILT_NASM=1`.

**Environment variables (aws-lc-sys):**
| Variable | Purpose | Our Setting |
|----------|---------|-------------|
| `AWS_LC_SYS_PREBUILT_NASM` | Use prebuilt NASM objects | `0` (we have real NASM) |
| `AWS_LC_SYS_NO_ASM` | Disable assembly entirely | `0` (keep optimized) |
| `AWS_LC_SYS_CMAKE_BUILDER` | Force CMake builder | Not set (auto-detect) |
| `AWS_LC_SYS_CFLAGS` | C compiler flags | Not set |

**MSVC `-WX` flag**: aws-lc's `CMakeLists.txt` line 786 hardcodes `-WX` (warnings-as-errors). On MSVC VS 18 Insiders, new warnings may trigger build failure. Workaround: `AWS_LC_SYS_CFLAGS=-WX-` if needed.

### API Compatibility (3.0 vs 2.x)

Source-verified from `surrealdb-3.0.2/src/`:

**Unchanged APIs (no migration needed):**
- `Surreal::new::<SurrealKv>(path)` — embedded persistent
- `Surreal::new::<Mem>(())` — embedded in-memory
- `db.use_ns("ns").use_db("db")` — namespace/database selection
- `db.query("SurrealQL")` — raw query
- `db.create::<T>((table, id)).content(data)` — record creation
- `db.select::<T>((table, id))` — record selection
- `db.delete::<T>((table, id))` — record deletion
- `Db` type alias for local engine

**Verified imports:**
```rust
use surrealdb::engine::local::{Db, SurrealKv, Mem};
use surrealdb::Surreal;
```

**Crate features used:** `kv-mem` (in-memory), `kv-surrealkv` (persistent). Both verified present in 3.0.2.

**Version range:** `SUPPORTED_VERSIONS: ">=3.0.0-alpha.1, <4.0.0"`

### Profile Recommendations (from SurrealDB docs in crate source)

SurrealDB recommends for embedded deployments:
```toml
[profile.release]
opt-level = 3
lto = true          # We have "thin" — consider "true" for max perf
strip = true         # ✓ Already set
codegen-units = 1    # ✓ Already set
```

```toml
[profile.dev.package."*"]
opt-level = 2        # ✓ Already set — optimized deps, fast dev build
```

**Thread stack**: SurrealDB recommends 10MiB thread stack for complex queries. Our schema is simple enough this shouldn't matter, but worth noting for future.

### SurrealQL Schema Compatibility

Our `REASONING_SCHEMA` uses:
- `DEFINE TABLE ... SCHEMAFULL` — valid in 3.0
- `DEFINE FIELD ... TYPE string|bytes|float|datetime|object|array|record(table)` — valid in 3.0
- `DEFINE INDEX ... FIELDS ... UNIQUE` — valid in 3.0
- `DEFAULT time::now()` — valid in 3.0

**Potential issue**: `SCHEMAFULL` keyword — SurrealDB 3.0 uses `SCHEMAFULL` (not the newer `SCHEMAFUL` which was a typo fix). Both are accepted. Our code uses `SCHEMAFULL` — correct.

### Build Configuration

**`.cargo/config.toml`** must be updated to include NASM path:
```toml
[alias]
xtask = "run --package xtask --"

[env]
# aws-lc-sys needs NASM for x86_64 assembly optimizations
# NASM binary at D:\localdev\deps\nasm-3.01\nasm.exe
```

The NASM path must be on `PATH` during cargo build. Options:
1. System PATH (fragile, depends on user environment)
2. `.cargo/config.toml` `[env]` section (workspace-scoped, deterministic)
3. xtask preflight adds to PATH before spawning cargo (runtime-scoped)

**Recommendation**: Option 2 — workspace-scoped via `.cargo/config.toml` for deterministic builds.

### Local Dependency Strategy

The workspace already uses git dependencies for custom crates:
```toml
wal = { git = "https://github.com/EonsofStupid/wal", branch = "rro-alpha" }
rro = { git = "https://github.com/EonsofStupid/rro", branch = "alpha" }
tar-rs = { git = "https://github.com/EonsofStupid/tar-rs", branch = "rro-alpha" }
```

NASM binary stored locally at `D:\localdev\deps\nasm-3.01/` — same pattern as local tooling.

SurrealDB itself should NOT be forked — the 3.0.2 API is compatible, the build just needs proper toolchain configuration. Forking would create maintenance burden tracking upstream releases.

## Files Referenced

- `xtask/README.md` — "God Mode" requirements, dual boot, dogfood verification
- `xtask/src/main.rs` — CLI dispatch, 4 commands
- `xtask/src/workspace.rs` — Shared context, tool resolution, execution
- `xtask/src/stage.rs` — Timed status reporting
- `xtask/src/net.rs` — Cross-platform port management
- `xtask/src/commands/dev.rs` — Dev orchestration pipeline
- `xtask/src/commands/preflight.rs` — Toolchain validation
- `xtask/src/commands/verify.rs` — Type/lint verification
- `xtask/src/commands/ip_boundary.rs` — IP boundary enforcement
- `systems/devpulse-engine/platform.default.toml` — Store defaults
- `systems/devpulse-engine/src/platform/config.rs` — Boot config, public config
- `systems/devpulse-engine/src/platform/mod.rs` — Platform facade
- `systems/devpulse-engine/src/platform/health.rs` — Health types
- `systems/devpulse-engine/src/platform/init.rs` — Init event types
- `interfaces/desktop/src-tauri/src/lib.rs` — Tauri boot sequence
- `interfaces/desktop/src/lib/sys/cfg/flags.ts` — Feature flags SSOT
- `interfaces/desktop/src/lib/sys/debug/DEBUG_FLAG.ts` — Dev-only gate
- `interfaces/desktop/src/lib/sys/runes/health.svelte.ts` — Health polling rune
- `interfaces/desktop/src/lib/sys/generated/health.types.ts` — TS health type mirrors
- `interfaces/desktop/src/lib/layouts/app/StatusBar.svelte` — Health UI
- `interfaces/desktop/src/routes/+layout.svelte` — Root layout, starts health polling
- `scripts/docs/sprints/SPRINT-XTASK-ORCHESTRATOR.md` — Previous sprint (complete)
- `scripts/docs/sprints/SPRINT-XTASK-ORCHESTRATOR.research.md` — Previous research
- `scripts/docs/.claude/MASTER_SPRINT_PLAN.md` — Master sprint plan
- `scripts/docs/.claude/RESEARCH_DECISIONS.md` — Locked research decisions
