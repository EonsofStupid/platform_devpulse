# DevPulse Platform — Rust + Svelte 5 + Tauri 2 Monorepo

AI-assisted developer platform. Local-first inference. Multi-window
Tauri desktop with managed models, voice pipeline, and visual builder.
Pre-release — aggressive reauthoring, no shims.

## Stack
- **Rust workspace** — kernel, engine, Tauri backend, xtask
- **Svelte 5 runes** — `$state`, `$derived`, `$effect`. No legacy stores.
- **Tauri 2.0** — multi-window cockpit via WebviewWindow
- **AI = providers over endpoints** — local runtimes are prebuilt, supervised
  subprocesses (plan 0007); subscriptions run as the vendor's own CLI over ACP;
  no new compiled-in inference (plan 0001)
- **Turso** (SSOT, `kernel/.../persistence/turso/` — one connection per
  operation; DBs at `.userdata/{system,user}/turso/`) + **SurrealDB** (graph;
  upstream's built binary as a supervised subprocess, never compiled in —
  plan 0007 Part S, until RRFlow replaces it) + **DuckDB** (analytics)
- **Docker / Podman** — a product feature: DevPulse sets it up for the
  person's projects, guided, per real-world best practice, inside the
  portable folder (owner: "I want docker available for the app made easy for
  users … portable all within devpulse"; 2026-10-20 "effortlessly sets up
  Docker or podman per real world best practices")

## Language Choice
- Rust is the default. Use it wherever it is viable and best practice.
- Python is allowed. It is not the default choice.
- Python is the obvious choice for ML training, fine-tuning, and data
  pipelines (collection, cleaning, dataset prep, ONNX/GGUF export). Use it
  there — do not force those into Rust.
- (Owner 2026-09-23, `1921fc48`; again 2026-10-24: "Python is allowed".)
- **Style Dictionary 5** drives ColdLight — DTCG tokens → CSS + TS types

## Commands
- `cargo check -p <crate>` — typecheck one crate while iterating (the
  pre-commit and pre-push hooks run the workspace-wide checks)
- `cargo xtask run-dev` — **THE ONLY dev command** (starts everything)
- `cargo xtask verify` — full verification pipeline
- `cargo xtask build-release [--portable-only]` — release build
- `cd interfaces/desktop && pnpm check` — svelte-check (TS + Svelte)
- `cd packages/coldlight && pnpm check` — svelte-check for ColdLight
- `cd interfaces/desktop && pnpm ds:tokens:build` — ColdLight token regen

## Structure
- `kernel/devpulse-clyffy/`, `kernel/model-loader/` — the kernel: AI only
  (AI config and anything that drives an AI connection); the engine is
  everything else. Vocabulary is public (owner 2026-10-19: "everything is
  public"): `systems/devpulse-engine/ip/kernel_terms.toml` maps layman ↔
  advanced labels and its enforcement is `off`. The prompt recipes stay the
  kernel's (owner: "COSTAR+ will be allowed, the actual prompt recipe system
  will not be").
- `systems/devpulse-engine/` — platform engine (services, boot, config, signals)
- `systems/devpulse-media/` — audio/media crate
- `systems/infra/{devpulse-telemetry, devpulse-telemetry-macros}/` — peer
  infrastructure crates (upward-only dependency direction)
- `interfaces/desktop/` — Tauri 2 + SvelteKit 5 app
  - Devtool taxonomy SSOT: `src/lib/devtools/registry.ts` (+ `meta.ts`)
    drives `/devtools/{tier}/{bucket}/{id}` — three tiers (System / Clyffy /
    Runtimes), each bucketed. Add a devtool = one registry entry + one route
    folder under that path.
- `packages/coldlight/` — ColdLight, the design system: internal workspace
  package `@devpulse/coldlight`. The app imports it only through its
  `exports`; inside, modules import each other as `#coldlight/*`. It imports
  nothing from the app.
- `xtask/` — Rust build orchestrator (`cargo xtask <command>`)
- `scripts/` — build tooling, lefthook hooks, preflight AST checks
- `docs/` — platform specs, knowledge library
- `deps/` — vendored external forks (ort, kokoros, etc.)

## Top 5 Hard Rules
1. **Include before delete.** Unused code stays, or is wired in or proven
   covered first; deletion only per item with the owner's OK (owner
   2026-10-19: "dead code needs to exist in the codebase or be properly
   included before deleted this is a fucking rule").
2. **No `unwrap()` in production Rust.** Use `?` or explicit handling.
3. **Pre-release mode.** Reauthor the existing code in place, aggressively.
   No shims. No backcompat. Reauthoring never means deleting (rule 1) or
   writing a parallel version.
4. **Plan before change.** Extend the `.plan` that owns the topic; never a
   parallel plan.
5. **Verify after every edit.** Never report "done" before compile passes.

## @imports
@.claude/rules/claude-code-countermeasures.md
