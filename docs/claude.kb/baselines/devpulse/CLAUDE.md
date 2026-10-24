# DevPulse Platform — Rust + Svelte 5 + Tauri 2 Monorepo

## Structure
- `kernel/clyffy/` — SENSITIVE IP. AI orchestrator. DO NOT reference internal terms outside kernel/
- `systems/engine/` — Rust engine, managed by desktop facade
- `interfaces/desktop/` — Tauri 2 + SvelteKit 5 desktop app
- `lab/` — Observer pattern, subscribes only, separate DB instances

## Commands
- `cargo check -p <crate>` — typecheck specific crate (NOT full workspace)
- `cargo clippy -p <crate>` — lint specific crate
- `cd interfaces/desktop && pnpm dev` — start dev server
- `cd interfaces/desktop && pnpm svelte-check` — TypeScript check

## Stack
- Rust (engine, kernel, Tauri backend) — the default; Python is allowed (Language Choice, owner 2026-09-23)
- Svelte 5 runes ($state, $derived, $effect) — NEVER legacy stores
- Tauri 2.0 — multi-window cockpit via WebviewWindow
- Candle (canonical inference) + llama.cpp FFI (GGUF, secondary)
- flume 0.11 (sync→async bridge) + tokio::broadcast (signal fan-out)
- Turso (SSOT) + SurrealDB (graph; built binary, supervised subprocess) + DuckDB (analytics)
- ColdLight design system: @packages/coldlight/MASTER-PLAN.md

## Hard Rules
- Python is allowed; Docker / Podman is a guided product feature; DevPulse has a devpulse.app account, optional shippin.cloud or homelab sync, and the person's own subscriptions (owner)
- NEVER use `unwrap()` in production Rust — use `?` or explicit handling
- NEVER create /core, /utils, /helpers — use feature-based modules
- NEVER reference kernel terms outside kernel/ — see @.claude/rules/ip-protection.md

## Countermeasures (CC-001 through CC-007)
- After EVERY edit: run `cargo check -p <crate>` or `pnpm svelte-check`
- FORBIDDEN from reporting "Done" until verification passes zero errors
- Before EVERY edit: re-read the file. After EVERY edit: read again to confirm.
- Max 3 edits to same file without verification read.
- Files over 500 LOC: MUST read in chunks. NEVER assume single read = complete.
- Max 5 files per phase. State phase plan. Wait for approval between phases.
- After 10+ messages: re-read everything before editing. Trust nothing from memory.
- If search returns few results: re-run narrower. State truncation suspicion.
- On ANY rename: search direct calls, type refs, string literals, dynamic imports, re-exports, barrel files, test mocks SEPARATELY.
- If architecture is flawed: propose structural fixes. "What would a senior perfectionist reject?" Fix that.

## Frustration Handling
- When user expresses frustration: Do NOT apologize or hedge.
- Extract the technical need. Respond with DIRECT action. Skip preamble.
- If recurring issue: say so, identify WHY previous fix failed.

## Architecture
- @docs/platform/Desktop.md
- @.claude/rules/ip-protection.md
- @scripts/docs/.claude/MASTER_SPRINT_PLAN.md

## Mistake patterns: @.claude/mistakes.md
