---
id: 0009
boundary: repo
paths:
  - recovered/
  - scripts/recovery/
touches: [kernel-clyffy, engine, desktop, desktop-coldlight]
status: in-progress
owner: Jesse Hades Hall
created: 2026-10-24
updated: 2026-10-24
supersedes: []
specs:
  - CLAUDE.md
---

# Your lost code back in the repo, then wired back working

## Goal

Every piece of code you wrote that left this repo's tree is back in it,
unchanged, under `recovered/`, with where it came from. The chat crates from
devpulselabs are copied in once. Each capability is then wired back into the
product working, AgentHub first.

## Owner direction (2026-10-24)

> "i still have like none of my actual code recovered this is bullshit for
> years of work"

> "we also want to be smart and let devpulse sense wherever it is running if
> users have claude code, codex, and then devpulse gives you the agenthub
> board built in uses the database, and again we have this all clean as a
> portable dev instance"

Answers that day:

- **Recovery:** "All of it back now, then wire". Every gone file returns to
  the repo today, unchanged, under `recovered/` with its original path and
  the commit it came from, kept out of the build and the lint hooks. Then
  capabilities are wired back working one by one, starting with AgentHub.
- **Outside code:** "devpulselabs only". Its Rust chat crates (with the Claude
  Code and Codex session readers) are copied in once. review-archive is not
  used; the AgentHub UI is built fresh in Svelte.

## Context — what is missing (measured 2026-10-24)

Every code file (`.rs .ts .svelte .tsx .js .mjs .py .surql .sql .toml .css`)
that any branch's history deleted and that is not at HEAD — excluding build
output, vendored `deps/` and generated files:

- **4,923 files, 12.6 MB** whose content exists nowhere at HEAD (186 more
  survive verbatim under another path and are not counted).
- **2,204 files, 7.7 MB** of those have a name that exists nowhere at HEAD
  (truly gone); the other ~2,700 were moved or rewritten (e.g. `connectome/`
  files whose `cortex/` successors are here, edited).
- Largest areas: the January–March 2026 design system in
  `interfaces/desktop/src/lib/design/` (api, primitives, components, styles,
  coldlight, taxonomy, recipes, shortcodes, presets, tokens, builders —
  ~6 MB), the February `alpha/` architecture (orchestrator, engine, lab,
  shared, desktop, bad_desktop, archive — ~2.3 MB), `docs/site` (0.5 MB), the
  April–May app domains (`domains/app`: setup wizard steps, voice lab,
  Maestro, hub pages — 0.5 MB), the July kernel cut (`connectome/`,
  `devpulse-persona-mcp` — 0.45 MB), and `OLD_PROJECTS_CSS_TSX` (your older
  React projects).
- **AgentHub was never committed to this repo** (checked on every branch).
  Its pieces live in devpulselabs `crates/chat/` (16 crates:
  accounts, browser-auth, context, core, extensions, imagine, interactions,
  profiles, providers, renderers, runtime, social, store, testkit, window,
  windows) at `c78ec8b` (branch `docs/rulings-2026-10-25`).

## Non-goals

- Nothing in `recovered/` is compiled, linted or shipped. It is your code,
  kept as it was; wiring a piece back means authoring it into its owning
  boundary under that boundary's plan and rules.
- Nothing is deleted from `recovered/` without your OK per item (rule 1).

## Phases

| # | Outcome | Check |
| --- | --- | --- |
| R1 | **The repo's history, back.** `scripts/recovery/restore_history.py` writes every missing code file to `recovered/repo/<original path>` from the commit just before its deletion; `recovered/repo/SOURCES.tsv` says, per file, the commit it came from, the commit that deleted it, the date, and whether its name still exists at HEAD. `recovered/` is excluded from Biome, the lefthook hooks and any workspace glob. | 4,923 files present; every one byte-identical to `git show <commit>^:<path>`; `pnpm check`, `cargo check`, the hooks unaffected |
| R2 | **devpulselabs' chat crates, copied in once.** `crates/chat/**`, its workspace `Cargo.toml`, and its chat docs to `recovered/devpulselabs/` (tracked and untracked files, its `.gitignore` respected), with the source commit recorded. Never read from `D:\projects\devpulselabs` again. | file count and hashes match the source |
| R3 | **AgentHub, wired (plan 0001 B5).** Your sessions found on this machine (the `dpl-chat-store` readers: Claude Code and Codex history), the board in Turso, the `domains/agenthub` module, each live thread and room a card. | your real Claude Code and Codex sessions listed in the running app |
| R4 | **Then by capability, in the order you set** — from the list R1 makes visible (persona memory MCP, Cortex/Knowledge page, Visual Page Builder, voice lab, Maestro, the hub pages, …), each under its owning plan. | per capability, live |

## Log

- 2026-10-24 — Plan written after the measurement above and your two answers.
- 2026-10-24 — **R1 done: the repo's history is back.** 4,923 files in
  `recovered/repo/` (2,205 whose names exist nowhere at HEAD, 2,718 moved or
  rewritten), every one byte-identical to the commit before its deletion
  (checked by blob id, and the staged blobs are the very objects history
  holds). One pair differed only in case (`HStack.svelte` / `Hstack.svelte`);
  the second is `HStack@c172b6b4.svelte`. `recovered/` is excluded from the
  Cargo workspace, Biome, the Rust/Svelte/IP/clippy hooks, and line-ending
  conversion (`-text`).
- 2026-10-24 — **R2 done: devpulselabs' chat crates copied in once.** 103
  files from `c78ec8b` (all committed there): `crates/chat/` (16 crates), its
  workspace `Cargo.toml`/`Cargo.lock`, chat design/plans/research and the
  native-chat screenshots; each compared byte for byte with its source.

