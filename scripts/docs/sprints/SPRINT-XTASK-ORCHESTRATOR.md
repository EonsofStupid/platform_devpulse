# SPRINT: xtask Modular Orchestrator

**Date**: 2026-03-03
**Research**: `SPRINT-XTASK-ORCHESTRATOR.research.md`
**Status**: COMPLETE

## Goal

Make `cargo xtask` a senior-grade, trait-based orchestrator with shared context, timed stages, cross-platform port management, and modular architecture that scales.

## Architecture — What Was Built

```
xtask/src/
├── main.rs              — CLI dispatch. Workspace created ONCE, dispatched via Task trait.
├── workspace.rs         — Shared Workspace context (replaced tools.rs/ToolResolver).
├── stage.rs             — Timed stage reporting: start → ok/warn/skip with duration.
├── net.rs               — Cross-platform port management: probe + kill + ensure.
└── commands/
    ├── mod.rs           — Task trait definition.
    ├── dev.rs           — Dev: banner → preflight → port clear → tauri dev.
    ├── preflight.rs     — Preflight: node_modules, pnpm, node, cargo — all timed.
    ├── verify.rs        — Verify: svelte-check + cargo check — all timed.
    └── ip_boundary.rs   — IpBoundary: cargo-metadata facade checks — all timed.
```

**Deleted**: `tools.rs` (replaced by `workspace.rs`)

## Senior Patterns Applied

| Pattern | Implementation |
|---------|---------------|
| **Trait dispatch** | `trait Task { fn name(); fn run(&self, ws: &Workspace); }` — every command implements it |
| **Shared context** | `Workspace` discovered once in `main()`, threaded to all tasks — no re-discovery |
| **Timed stages** | `Stage::start("label")` → `stage.ok()` / `.ok_with()` / `.warn()` / `.skip()` with ms |
| **Cross-platform** | `cfg(windows)` netstat+taskkill / `cfg(unix)` lsof+kill in `net.rs` |
| **Error context** | `anyhow::Context` on every fallible operation with actionable messages |
| **Proper naming** | `Workspace` not "ToolResolver", `exec`/`exec_in` not "run"/"run_in", `Task` trait |

## Verification

- `cargo check -p xtask` = 0 errors, 3 warnings (unused API surface: `name()`, `skip()`, `spawn_in()`)
- Architecture is composable — adding a new command = struct + `impl Task` + match arm
