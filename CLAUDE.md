# DevPulse Platform — Rust + Svelte 5 + Tauri 2 Monorepo

## Structure
- `kernel/devpulse-clyffy/` — SENSITIVE IP. AI orchestrator. Kernel **paths and filenames are OK to cite**; kernel **vocabulary, recipes, and prompt bodies** are banned outside `kernel/`. See @.claude/rules/ip-protection.md.
- `systems/devpulse-engine/` — Rust engine, managed by desktop facade
- `interfaces/desktop/` — Tauri 2 + SvelteKit 5 desktop app
- `lab/` — Observer pattern, subscribes only, separate DB instances

## Commands
- `cargo check -p <crate>` — typecheck specific crate (NOT full workspace)
- `cargo clippy -p <crate>` — lint specific crate
- `cd interfaces/desktop && pnpm dev` — start dev server
- `cd interfaces/desktop && pnpm check` — TypeScript check (runs svelte-check)

## Stack
- Rust (engine, kernel, Tauri backend) — **NO PYTHON. NO EXCEPTIONS.**
- Svelte 5 runes ($state, $derived, $effect) — NEVER legacy stores
- Tauri 2.0 — multi-window cockpit via WebviewWindow
- Candle (canonical inference) + llama.cpp FFI (GGUF, secondary)
- flume 0.11 (sync→async bridge) + tokio::broadcast (signal fan-out)
- libSQL (SSOT) + SurrealDB (graph, implement last) + DuckDB (analytics)
- ColdLight design system: @interfaces/desktop/src/lib/design/MASTER-PLAN.md

## Hard Rules
- NEVER suggest Python, Docker, npm servers, or external services
- NEVER use `unwrap()` in production Rust — use `?` or explicit handling
- NEVER create /core, /helpers, or domain-level `utils/` — domains use Nx library-types: `feature` / `ui` / `data-access` / `util`. See @docs/platform/Desktop.md §1.1.1 and §2.1.
- NEVER reference kernel terms outside kernel/ — see @.claude/rules/ip-protection.md

## Domain Library-Types (LOCKED 2026-04-14)
- `feature/` — smart/routed Svelte 5 components. May import `ui`, `data-access`, `util`.
- `ui/` — dumb/presentational Svelte 5 components. May import `util` only.
- `data-access/` — rune state (`*.state.svelte.ts`) + services (`*.svc.ts`) + IPC. May import `util` only.
- `util/` — ArkType contracts, types, pure helpers. Imports nothing else in-domain.
- Cross-domain: always through the target domain's `index.ts`. No reaching into internals.
- Dep direction enforced by preflight. Forbidden: `ui → data-access`, `data-access → feature`, `util → *`.

## Countermeasures (CC-001 through CC-007)
- After EVERY edit: run `cargo check -p <crate>` or `pnpm check`
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
