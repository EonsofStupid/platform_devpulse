# SPRINT: xtask Foundation v2 — Dev-Time Platform Management

**Date**: 2026-03-03
**Research**: `SPRINT-XTASK-FOUNDATION-V2.research.md`
**Depends On**: SPRINT-XTASK-ORCHESTRATOR (COMPLETE)
**Status**: READY FOR REVIEW

## Goal

Evolve xtask from a launcher into the platform's "God Mode" orchestrator — per README.md requirements. Add the missing commands (build, test, design system), add store health validation without Tauri, and establish the dev-time visibility layer.

## Current State (What We Have)

```
xtask/src/                      783 lines total
├── main.rs                     CLI dispatch (4 commands)
├── workspace.rs                Shared context, tool resolution
├── stage.rs                    Timed status reporting
├── net.rs                      Cross-platform port management
└── commands/
    ├── mod.rs                  Task trait
    ├── dev.rs                  Banner → preflight → backend check → port → launch
    ├── preflight.rs            node_modules, pnpm, node, cargo + version policies
    ├── verify.rs               svelte-check + cargo check
    └── ip_boundary.rs          cargo-metadata facade checks
```

**Working IPC**: `get_status()` → `SystemHealth`, `get_settings()` → `PlatformConfig`
**Working UI**: StatusBar (connection dot, uptime, version), health polling every 15s
**Working Config**: `platform.default.toml` → `PlatformBootConfig` → `Platform::boot()`

## Target State (What We're Building)

```
xtask/src/
├── main.rs                     CLI dispatch (8 commands)
├── workspace.rs                (unchanged)
├── stage.rs                    (unchanged)
├── net.rs                      (unchanged)
└── commands/
    ├── mod.rs                  Task trait (unchanged)
    ├── dev.rs                  (unchanged — already solid)
    ├── preflight.rs            + design system checks added
    ├── verify.rs               (unchanged)
    ├── ip_boundary.rs          (unchanged)
    ├── build.rs                NEW — production build pipeline
    ├── test.rs                 NEW — test orchestration (Rust + frontend)
    ├── design.rs               NEW — design system pipeline (tokens + scanner + verify)
    └── config_check.rs         NEW — validate platform.default.toml parses correctly
```

---

## Phase 0: SurrealDB 3.0.2 Build Environment (BLOCKER)

**What**: Configure build environment so SurrealDB 3.0.2 compiles on Windows.
**Why**: aws-lc-sys (transitive dep) needs NASM. App crashes on SurrealDB schema init. Nothing else works until this builds.

### Tasks

- [ ] **0.1** Update `.cargo/config.toml` — add NASM to build PATH
  - NASM binary: `D:\localdev\deps\nasm-3.01\nasm.exe`
  - Use `[env]` section to prepend NASM dir to PATH
  - Keep existing `[alias]` section

- [ ] **0.2** Verify: `cargo check -p devpulse-maestro` — compiles with SurrealDB 3.0.2
  - If aws-lc-sys still fails on `-WX`: set `AWS_LC_SYS_CFLAGS=-WX-` in `.cargo/config.toml` `[env]`
  - If prebuilt NASM objects needed: set `AWS_LC_SYS_PREBUILT_NASM=1`

- [ ] **0.3** Verify SurrealDB schema syntax
  - `REASONING_SCHEMA` in `kernel/devpulse-maestro/src/cortex/persistence/surreal.rs` uses `SCHEMAFULL`, standard types — should be compatible
  - Run app: `cargo xtask run-dev` — all 4 stores must boot

- [ ] **0.4** Update `Cargo.toml` profile if needed
  - SurrealDB recommends `lto = true` (we have `"thin"`) for release builds
  - Consider switching if build time is acceptable

### Research Reference
See `SPRINT-XTASK-FOUNDATION-V2.research.md` → "SurrealDB 3.0.2 Migration — Technical Requirements"

---

## Phase 1: xtask `build` Command

**What**: Production build pipeline for desktop distribution.
**Why**: README says "This runs the build." Currently build is CI-only.

### Tasks

- [ ] **1.1** Create `xtask/src/commands/build.rs`
  - Struct: `pub struct Build;`
  - impl Task: `fn name() -> "build"`, `fn run()`
  - Pipeline:
    1. Banner
    2. `Preflight.run(ws)?` (reuse)
    3. Stage "Frontend build": `ws.exec_in(&ws.desktop_dir(), "pnpm", &["build"])`
    4. Stage "Cargo build": `ws.exec_in(ws.root(), "cargo", &["build", "--release", "-p", "devpulse_desktop_backend"])`
  - Each stage timed via `Stage::start()` → `.ok()` / bail on failure

- [ ] **1.2** Register in `main.rs`
  - Add `Build` variant to `Commands` enum
  - Add match arm: `Commands::Build => Box::new(commands::build::Build)`
  - Add doc comment: `/// Build for production distribution.`

- [ ] **1.3** Add `pub mod build;` to `commands/mod.rs`

- [ ] **1.4** Verify: `cargo check -p xtask` — 0 errors, 0 warnings

---

## Phase 2: xtask `test` Command

**What**: Unified test runner for Rust + frontend.
**Why**: README says "This runs the tests."

### Tasks

- [ ] **2.1** Create `xtask/src/commands/test.rs`
  - Struct: `pub struct Test;`
  - impl Task: `fn name() -> "test"`, `fn run()`
  - Pipeline:
    1. Banner
    2. Stage "Rust tests": `ws.exec(ws.root(), "cargo", &["test", "--workspace"])`
    3. Stage "Frontend tests": `ws.exec_in(&ws.desktop_dir(), "pnpm", &["test"])`
  - Each stage timed. Rust tests first (faster feedback on core failures).

- [ ] **2.2** Register in `main.rs`
  - Add `Test` variant to `Commands` enum
  - Add match arm: `Commands::Test => Box::new(commands::test::Test)`
  - Add doc comment: `/// Run all tests (Rust + frontend).`

- [ ] **2.3** Add `pub mod test;` to `commands/mod.rs`

- [ ] **2.4** Verify: `cargo check -p xtask` — 0 errors, 0 warnings

---

## Phase 3: xtask `design` Command

**What**: ColdLight design system pipeline orchestration.
**Why**: Design system has 3 build steps that must run in order. Currently manual.

### Tasks

- [ ] **3.1** Create `xtask/src/commands/design.rs`
  - Struct: `pub struct Design;`
  - impl Task: `fn name() -> "design"`, `fn run()`
  - Pipeline:
    1. Banner
    2. Stage "Token build": `ws.exec_in(&ws.desktop_dir(), "pnpm", &["ds:tokens:build"])`
    3. Stage "Manifest generation": `ws.exec_in(&ws.desktop_dir(), "pnpm", &["coldlight:generate"])`
    4. Stage "Verification": `ws.exec_in(&ws.desktop_dir(), "pnpm", &["coldlight:verify"])`
  - All 3 must succeed in order. Tokens feed manifest, manifest feeds verification.

- [ ] **3.2** Register in `main.rs`
  - Add `Design` variant to `Commands` enum
  - Add match arm: `Commands::Design => Box::new(commands::design::Design)`
  - Add doc comment: `/// Build design system: tokens → manifest → verify.`

- [ ] **3.3** Add `pub mod design;` to `commands/mod.rs`

- [ ] **3.4** Verify: `cargo check -p xtask` — 0 errors, 0 warnings

---

## Phase 4: xtask `config-check` Command

**What**: Validate `platform.default.toml` parses without launching Tauri.
**Why**: Config errors currently only surface at runtime during `Platform::boot()`.

### Tasks

- [ ] **4.1** Create `xtask/src/commands/config_check.rs`
  - Struct: `pub struct ConfigCheck;`
  - impl Task: `fn name() -> "config-check"`, `fn run()`
  - Pipeline:
    1. Stage "Parse platform.default.toml": read `systems/devpulse-engine/platform.default.toml`, parse as TOML, validate structure
    2. Stage "Store entries": for each store section, print `[OK] {kind} — enabled={enabled}, path={path}`
    3. Stage "Override check": if `platform.toml` exists in conventional location, parse it too
  - Uses `serde_json` (already in deps) + raw TOML parsing via `toml` crate

- [ ] **4.2** Add `toml` dependency to `xtask/Cargo.toml`
  - Check if `toml` is in workspace deps. If not, add `toml = "0.8"` directly.

- [ ] **4.3** Register in `main.rs`
  - Add `ConfigCheck` variant to `Commands` enum
  - Add match arm: `Commands::ConfigCheck => Box::new(commands::config_check::ConfigCheck)`
  - Add doc comment: `/// Validate platform store configuration.`

- [ ] **4.4** Add `pub mod config_check;` to `commands/mod.rs`

- [ ] **4.5** Verify: `cargo check -p xtask` — 0 errors, 0 warnings

---

## Phase 5: Integrate Design System into Preflight

**What**: Add design system health checks to `preflight.rs`.
**Why**: Preflight validates toolchain but not the design system build artifacts.

### Tasks

- [ ] **5.1** Add check to `preflight.rs`: `check_design_tokens(ws)`
  - Stage: "design tokens"
  - Check: `interfaces/desktop/src/lib/design/generated/tokens.css` exists
  - OK if exists, WARN if missing with message "run: cargo xtask design"

- [ ] **5.2** Add check to `preflight.rs`: `check_coldlight_manifest(ws)`
  - Stage: "coldlight manifest"
  - Check: `interfaces/desktop/src/lib/design/.generated/coldlight.manifest.json` exists
  - OK if exists, WARN if missing with message "run: cargo xtask design"

- [ ] **5.3** Verify: `cargo check -p xtask` — 0 errors, 0 warnings

---

## Phase 6: Update dev.rs to Integrate Design System Check

**What**: During `run-dev`, warn if design system artifacts are stale/missing.
**Why**: Dev should not silently launch with missing tokens or manifests.

### Tasks

- [ ] **6.1** After the "Backend" stage in `dev.rs`, add a non-fatal design check
  - Stage section "Design System"
  - Check tokens.css and manifest.json exist (same logic as preflight checks)
  - WARN if missing (don't bail — dev can still run without latest tokens)
  - Print: "Design artifacts missing — run: cargo xtask design"

- [ ] **6.2** Verify: `cargo check -p xtask` — 0 errors, 0 warnings

---

## Verification

After all phases:
- `cargo check -p xtask` — 0 errors, 0 warnings
- `cargo xtask --help` shows 8 commands: preflight, run-dev, verify, verify-ip-boundary, build, test, design, config-check
- `cargo xtask preflight` includes design system checks
- `cargo xtask config-check` validates TOML without Tauri

---

## QUESTIONS FOR OWNER (Need Clarity)

### Q1: `pnpm test` Script

Does `pnpm test` exist in `interfaces/desktop/package.json`? What does it run?
If it doesn't exist yet, what should it be? (vitest? playwright? both?)

### Q2: Build Target

`cargo xtask build` — should this produce a Tauri bundle (.msi/.dmg/.appimage)?
Or just compile the binary? Tauri bundling is: `pnpm tauri build` which handles both frontend build + Rust release + bundling.

### Q3: Design System Script Names

Confirming the exact pnpm scripts:
- `pnpm ds:tokens:build` — correct?
- `pnpm coldlight:generate` — correct?
- `pnpm coldlight:verify` — correct?

### Q4: Config Check Scope

Should `config-check` only validate the TOML structure, or also validate that referenced paths (libsql/platform.db, duckdb/analytics.duckdb, surreal/reasoning) resolve to real locations in AppData?

### Q5: Feature Flag Foundation

The research found that `flags.ts` is compile-time only and doesn't gate anything at runtime. Two options:

**Option A**: Keep flags compile-time for now. Feature flag "management" = editing flags.ts and restarting dev server. Simple, matches current architecture.

**Option B**: Build a runtime flag system. Adds IPC command `toggle_flag(name, value)`, persists to config, routes check flags before rendering. Significantly more work.

Which direction? (Recommendation: Option A for this sprint, Option B is a future sprint)

### Q6: Dual Boot (Lab)

README says "`run-dev` MUST launch Platform and Lab." Lab is described as "observer pattern, subscribes only" with separate DB instances. Is Lab ready for integration, or is this a parking lot item?

---

## Parking Lot (Deferred)

- [ ] Lab dual-boot integration
- [ ] ts-rs auto-sync verification command
- [ ] Store migration/reset tooling
- [ ] Runtime feature flag toggle system
- [ ] Route gating based on feature flags
- [ ] Store inspection dev panel (query store contents)
- [ ] `cargo xtask ci` — local CI replication
