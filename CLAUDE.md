# DevPulse Platform — Rust + Svelte 5 + Tauri 2 Monorepo

AI-assisted developer platform. Local-first inference. Multi-window
Tauri desktop with managed models, voice pipeline, and visual builder.
Pre-release — aggressive reauthoring, no shims.

## Stack
- **Rust workspace** — kernel, engine, Tauri backend, xtask
- **Svelte 5 runes** — `$state`, `$derived`, `$effect`. No legacy stores.
- **Tauri 2.0** — multi-window cockpit via WebviewWindow
- **Candle** (primary inference) + **llama.cpp FFI** (GGUF, secondary)
- **libSQL** (SSOT) + **SurrealDB** (graph) + **DuckDB** (analytics)
- **Style Dictionary 5** drives ColdLight — DTCG tokens → CSS + TS types

## Commands
- `cargo check -p <crate>` — typecheck one crate (NEVER workspace-wide)
- `cargo xtask run-dev` — **THE ONLY dev command** (starts everything)
- `cargo xtask verify` — full verification pipeline
- `cargo xtask build-release [--portable-only]` — release build
- `cd interfaces/desktop && pnpm check` — svelte-check (TS + Svelte)
- `cd interfaces/desktop && pnpm ds:tokens:build` — ColdLight token regen

## Structure
- `kernel/devpulse-clyffy/`, `kernel/model-loader/` — **SENSITIVE IP**. Kernel
  paths are OK to cite; kernel vocabulary is banned outside `kernel/` (CI-enforced).
- `systems/devpulse-engine/` — platform engine (services, boot, config, signals)
- `systems/devpulse-media/` — audio/media crate
- `systems/infra/{devpulse-telemetry, devpulse-telemetry-macros}/` — peer
  infrastructure crates (upward-only dependency direction)
- `interfaces/desktop/` — Tauri 2 + SvelteKit 5 app
- `xtask/` — Rust build orchestrator (`cargo xtask <command>`)
- `scripts/` — build tooling, lefthook hooks, preflight AST checks
- `docs/` — platform specs, knowledge library
- `deps/` — vendored external forks (ort, kokoros, etc.)

## Top 5 Hard Rules
1. **No Python. No Docker. No external services.** Full Rust + TS + Svelte.
2. **No `unwrap()` in production Rust.** Use `?` or explicit handling.
3. **Kernel vocabulary stays in `kernel/`.** IP boundary is CI-enforced.
4. **Pre-release mode.** Reauthor aggressively. No shims. No backcompat.
5. **Verify after every edit.** Never report "done" before compile passes.

## @imports
@.claude/rules/claude-code-countermeasures.md
