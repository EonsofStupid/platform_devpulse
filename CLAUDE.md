# DevPulse Platform — Rust + Svelte 5 + Tauri 2 Monorepo

AI-assisted developer platform. Standalone smart-portable desktop app
(Tier 1) that connects to the operator's own headless Clyffy for the AI
layer (Tier 2) over the gb10-client wire. Multi-window Tauri cockpit
with local model management, voice pipeline, and visual builder.
Pre-release — aggressive reauthoring, no shims.

## Stack
- **Rust workspace** — engine (DevPulse's core), Tauri backend, xtask.
  The AI layer (connectome kernel, inference, RRD daemon) is Clyffy's —
  it lives at github.com/EonsofStupid/clyffyos and is reached over the
  `devpulse-gb10-client` wire (capability computed, never hardcoded).
- **Svelte 5 runes** — `$state`, `$derived`, `$effect`. No legacy stores.
- **Tauri 2.0** — multi-window cockpit via WebviewWindow
- **Turso** (local SSOT — replaces libSQL) + local **DuckDB** (project analytics).
  **SurrealDB** + qortex + inference + AI analytics run on **ClyffyOS/GB10**, not local.
- **Style Dictionary 5** drives ColdLight — DTCG tokens → CSS + TS types
  (OKLCH + REM + container-fluid `cqi` sizing)

## Commands
- `cargo check -p <crate>` — typecheck one crate (NEVER workspace-wide)
- `cargo xtask run-dev` — **THE ONLY dev command** (starts everything)
- `cargo xtask verify` — full verification pipeline
- `cargo xtask build-release [--portable-only]` — release build
- `cd interfaces/desktop && pnpm check` — svelte-check (TS + Svelte)
- `cd interfaces/desktop && pnpm ds:tokens:build` — ColdLight token regen

## Structure
- `systems/devpulse-engine/` — DevPulse's **core backend**: services, boot,
  config, signals, model *management* (`platform/model_loader`), knowledge
  content. **NOT sensitive IP** — cite freely; the layman/Teaching-Mode
  simplify is engine→UI.
- `systems/devpulse-gb10-client/` — the wire to headless Clyffy
  (`GET /v1/capability` handshake; `ConnectionState`; Tier-2 surfaces are a
  pure function of the advertised capability)
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
3. **No AI kernel in this repo — ever.** The AI layer is Clyffy's and lives at
   github.com/EonsofStupid/clyffyos; DevPulse reaches it over the wire only.
   `verify-ip-boundary` + cargo-deny enforce the inference-free build. Layman
   Teaching-Mode simplification runs engine→UI (no sensitive IP, not secrecy).
4. **Pre-release mode.** Reauthor aggressively. No shims. No backcompat.
5. **Verify after every edit.** Never report "done" before compile passes.

## @imports
@.claude/rules/claude-code-countermeasures.md
