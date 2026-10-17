# Research: xtask Modular Orchestrator — Port Management, Process Lifecycle, Staged Pipeline

**Date**: 2026-03-03
**Sprint**: SPRINT-XTASK-ORCHESTRATOR
**Status**: COMPLETE

## Question/Goal

`cargo xtask run-dev` must intelligently orchestrate the full dev environment:
- Detect and clear stale processes on port 1420
- Stage the pipeline: preflight → port clear → tauri dev
- Modular file structure — each concern in its own module, plug-and-play

## Codebase Analysis

### Current State — 6 files, all flat

```
xtask/
├── Cargo.toml           — deps: clap, anyhow, cargo_metadata, which, serde_json
├── src/
│   ├── main.rs          — clap CLI, 4 subcommands dispatched to commands/*
│   ├── tools.rs         — ToolResolver: discover workspace, resolve/run/run_in tools
│   └── commands/
│       ├── mod.rs       — pub mod declarations (dev, ip_boundary, preflight, verify)
│       ├── dev.rs       — 31 lines. print_banner + preflight + pnpm tauri dev. ZERO intelligence.
│       ├── preflight.rs — 94 lines. Checks node_modules, pnpm, node, cargo. Solid.
│       ├── verify.rs    — 20 lines. svelte-check + cargo check. Fine.
│       └── ip_boundary.rs — 72 lines. cargo_metadata checks. Solid.
```

### Problems Found

1. **dev.rs is 31 lines of nothing** — literally `preflight → pnpm tauri dev`. No port management. No process lifecycle. No error recovery. When port 1420 is in use from a previous crashed session, it just dies.

2. **No port management anywhere** — Port 1420 is hardcoded in:
   - `interfaces/desktop/vite.config.ts` line 9: `port: 1420`
   - `interfaces/desktop/vite.config.ts` line 10: `strictPort: true` (Vite EXITS on conflict instead of picking another port)
   - `interfaces/desktop/src-tauri/tauri.conf.json` line 8: `"devUrl": "http://localhost:1420"`
   - Both MUST agree, so the port is fixed at 1420. xtask MUST clear it.

3. **ToolResolver lacks spawn** — Only has `run()` (blocks) and `output()` (captures). No `spawn()` that returns a `Child` for background process management.

4. **ToolResolver lacks project_root accessor** — `project_root` is private. Other modules can't read it without going through `desktop_dir()`.

### Dependencies Available (workspace Cargo.toml)

Already declared and usable in xtask:
- `clap 4.5` — CLI parsing with derive
- `anyhow 1.0` — error handling
- `which 7.0` — cross-platform tool resolution
- `serde_json 1.0` — JSON parsing
- `cargo_metadata 0.18` — workspace introspection

NOT yet in xtask Cargo.toml but available in workspace:
- `serde 1.0` — (not needed for xtask)

### Port 1420 — How to clear it cross-platform

**Windows** (our target):
```
netstat -ano | findstr :1420 | findstr LISTENING
```
Output: `  TCP    [::1]:1420    [::]:0    LISTENING    102972`
→ Parse PID (last column) → `taskkill /F /PID 102972`

**Unix** (for completeness):
```
lsof -ti :1420
```
→ Returns PID directly → `kill -9 {pid}`

**Rust std approach** (no external deps):
```rust
std::net::TcpListener::bind(("127.0.0.1", 1420))
```
→ `Ok(_)` = port free, `Err(_)` = port in use.
This checks availability but can't find/kill the owning process. Still need platform commands for that.

## Findings

### Architecture Decision: Modular with `net.rs`

```
xtask/src/
├── main.rs              — CLI dispatch (minor additions)
├── tools.rs             — ToolResolver + spawn_in + project_root()
├── net.rs               — NEW: port_is_free(), kill_port(), ensure_port_free()
└── commands/
    ├── mod.rs
    ├── dev.rs            — REWRITE: staged pipeline with port management
    ├── preflight.rs      — unchanged
    ├── verify.rs         — unchanged
    └── ip_boundary.rs    — unchanged
```

### `net.rs` Design

Three functions:
1. `port_is_free(port: u16) -> bool` — TcpListener probe
2. `kill_port(port: u16) -> Result<bool>` — platform-specific PID lookup + kill
3. `ensure_port_free(port: u16) -> Result<()>` — combines both: check → kill if needed → verify

### `dev.rs` Design — Staged Pipeline

```
Stage 1: Banner
Stage 2: Preflight (existing)
Stage 3: Port management (ensure 1420 is free)
Stage 4: Launch `pnpm tauri dev` in desktop dir
```

### `tools.rs` Additions

1. `pub fn project_root(&self) -> &Path` — expose root for other modules
2. `pub fn spawn_in(&self, dir, program, args) -> Result<Child>` — non-blocking spawn

## Recommendations

1. Add `net.rs` as a new module — clean separation of port/network concerns
2. Rewrite `dev.rs` with the staged pipeline — each stage prints status, fails fast
3. Add `spawn_in` and `project_root()` to `ToolResolver` — needed for future commands
4. Keep the same deps — `std::net` for port check, `std::process::Command` for platform kill
5. NO new crate dependencies required

## Files Referenced

- `xtask/Cargo.toml`: deps available
- `xtask/src/main.rs`: CLI dispatch, needs no changes for this sprint
- `xtask/src/tools.rs`: ToolResolver, needs spawn_in + project_root()
- `xtask/src/commands/dev.rs`: 31-line stub, complete rewrite
- `xtask/src/commands/mod.rs`: needs no changes
- `interfaces/desktop/vite.config.ts`: port 1420, strictPort: true
- `interfaces/desktop/src-tauri/tauri.conf.json`: devUrl localhost:1420
- `Cargo.toml`: workspace deps
