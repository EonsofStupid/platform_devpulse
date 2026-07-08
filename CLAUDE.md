# DevPulse Platform — Rust + Svelte 5 + Tauri 2 Monorepo

AI-assisted developer platform. Local-first inference. Multi-window
Tauri desktop with managed models, voice pipeline, and visual builder.
Pre-release — aggressive reauthoring, no shims.

## Stack
- **Rust workspace** — engine (DevPulse's core), Tauri backend, xtask. `kernel/` is legacy → headless ClyffyOS
- **Svelte 5 runes** — `$state`, `$derived`, `$effect`. No legacy stores.
- **Tauri 2.0** — multi-window cockpit via WebviewWindow
- **Candle** (primary inference) + **llama.cpp FFI** (GGUF, secondary)
- **Turso** (local SSOT — replaces libSQL) + local **DuckDB** (project analytics).
  **SurrealDB** + qortex + AI analytics run on **ClyffyOS/GB10**, not local.
- **Style Dictionary 5** drives ColdLight — DTCG tokens → CSS + TS types

## Commands
- `cargo check -p <crate>` — typecheck one crate (NEVER workspace-wide)
- `cargo xtask run-dev` — **THE ONLY dev command** (starts everything)
- `cargo xtask verify` — full verification pipeline
- `cargo xtask build-release [--portable-only]` — release build
- `cd interfaces/desktop && pnpm check` — svelte-check (TS + Svelte)
- `cd interfaces/desktop && pnpm ds:tokens:build` — ColdLight token regen

## Structure
- `kernel/devpulse-clyffy/`, `kernel/model-loader/` — **not DevPulse's.** The kernel is
  Clyffy's, headless on ClyffyOS/GB10 (optional local install later); these dirs are
  **legacy pending extraction**. Engine is DevPulse's core ("the kernel" of DevPulse).
  **NOT sensitive IP** — cite freely; the layman/Teaching-Mode simplify is engine→UI.
- `systems/devpulse-engine/` — DevPulse's **core backend** ("the kernel" of DevPulse):
  services, boot, config, signals, wire client
- `systems/devpulse-media/` — audio/media crate
- `systems/infra/{devpulse-telemetry, devpulse-telemetry-macros}/` — peer
  infrastructure crates (upward-only dependency direction)
- `interfaces/desktop/` — Tauri 2 + SvelteKit 5 app
  - Devtool taxonomy SSOT: `src/lib/domains/platform/_shared/devtool-registry.ts`
    drives `/devtools/{tier}/{bucket}/{id}` — three tiers (System / Clyffy /
    Runtimes), each bucketed. Add a devtool = one registry entry + one route
    folder under that path.
- `xtask/` — Rust build orchestrator (`cargo xtask <command>`)
- `scripts/` — build tooling, lefthook hooks, preflight AST checks
- `docs/` — platform specs, knowledge library
- `deps/` — vendored external forks (ort, kokoros, etc.)

## Top 5 Hard Rules
1. **No Python. No Docker. No external services.** Full Rust + TS + Svelte.
2. **No `unwrap()` in production Rust.** Use `?` or explicit handling.
3. **No kernel in DevPulse.** The kernel is Clyffy's (headless ClyffyOS/GB10);
   `kernel/` here is legacy pending extraction. Engine is DevPulse's core; layman
   Teaching-Mode simplification runs engine→UI (no sensitive IP, not secrecy).
4. **Pre-release mode.** Reauthor aggressively. No shims. No backcompat.
5. **Verify after every edit.** Never report "done" before compile passes.

## @imports
@.claude/rules/claude-code-countermeasures.md
