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
updated: 2026-10-25
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
| R3 | **AgentHub, wired (plan 0001 B5).** **R3a** your sessions found on this machine: `recovered/devpulselabs/crates/chat/store` (bounded, jailed, paged history reading, 1,111 lines) with its Claude Code and Codex readers (`providers/claude`, `providers/codex` — `impl HistoryDecoder`) authored into the kernel's `providers/history/` on DevPulse's `ProviderId`, their tests with them; an engine `agenthub` facade; Tauri intents. **R3b** the board in Turso and the `domains/agenthub` module: every live thread, room and found session a card, by state. **R3c** hand-offs between cards. | your real Claude Code and Codex sessions listed in the running app |
| R4 | **Then by capability, in the order you set** — from the list R1 makes visible (persona memory MCP, Cortex/Knowledge page, Visual Page Builder, voice lab, Maestro, the hub pages, …), each under its owning plan. | per capability, live |

### R3b — the board, in detail (written 2026-10-25)

What R3a's live check showed, which R3b builds on:

- The 173 transcripts on this machine are **60 sessions you started**
  (Claude Code 26, Codex 34) and **113 sub-agents** those sessions spawned
  (Claude Code 105, under `<session>/subagents/agent-*.jsonl`, each marked
  `isSidechain` with its parent's `sessionId`; Codex 8, marked
  `source.subagent`). R3a lists them flat.
- Each listing re-reads every file's start, about 29 MB here: about 200 ms
  warm, 3.8–4.8 s for the first call while the app boots.
- Your design material: `recovered/devpulselabs/docs/proof/` is chat — a
  provider sidebar with each provider's found-session count, pinned rooms,
  a read-only "Past transcript" reader. Nothing in your material designs a
  board. ColdLight's `useDragAndDrop` is kept for "kanban future work"
  (`packages/coldlight/docs/BEHAVIORS-ORPHAN-HOOKS.md:23`).

The library inventory for the board (plan 0001 B4.3b's first step):

- **A card is covered:** `card` (`as="button"`, header/body/footer slots,
  `variant`, `disabled`) with `status-dot` for its state, `badge` for its
  agent, `avatar`. The board's card is a domain adapter,
  `domains/agenthub/ui/board-card/`, with its preset beside it. No
  `seat-card` kind for the board; the rooms' seat is decided with the rooms
  in B4.3b.
- **A column is not:** nothing is a labelled, ordered list that takes a
  dropped card and has a keyboard way to move one. New kind `board-column`
  (anatomy, component, types, tokens, schema, index) on `useDragAndDrop`,
  with list semantics and its count in its heading.

| # | Outcome | Check |
| --- | --- | --- |
| R3b.1 | **Sub-agents under their parent; the index kept.** The kernel's index says each sub-agent's parent (Claude Code: `isSidechain` and `sessionId`; Codex: its `source.subagent` and the parent field a key survey confirms first). The catalog keeps each source's index between calls and re-reads only files whose size or time changed; the engine holds one catalog. `FoundSession` gains the parent. | 60 sessions listed with their sub-agents under them; a second listing re-reads no file; the first call's time measured |
| R3b.2 | **Live state.** `Agents` and `Rooms` keep each live conversation's state — working (a prompt in flight), waiting for you (a permission or a pick unanswered), idle — and the engine publishes `agenthubChanged` when one changes. | a Codex thread shows working, then idle; a permission request shows waiting for you |
| R3b.3 | **The board in Turso.** Columns: Working, Waiting for you, Done. A live card's column is its state; a found session written in the last two minutes is Working (in the vendor's own app), else Done. A found session belongs to the project whose folder holds its folder; the rest are "Elsewhere on this machine". What you change is kept in `board_cards` (user database): a card's column, its place, pinned, hidden. Engine `board(project)`, `move_card`; Tauri `agenthub_board`, `agenthub_move_card`. | a moved card is where you put it after a restart |
| R3b.4 | **`board-column` in ColdLight**, as above, with its Storybook-style fixture. | the fixture renders; the curator audit has no finding |
| R3b.5 | **The module and its page.** `domains/agenthub/`: `data-access/agenthub.service.ts` (every command and event), `agenthub.state.svelte.ts`, `ui/board-card/`, `feature/AgentHubBoard.svelte`, `index.ts` (chat integrates through it alone). The page comes from its folder (plan 0008: `_nav`, its copy). A found session opens read only, newest page first, "Show older"; sub-agents fold under their parent's card. | your real sessions on the board; screenshots at 1440 and 1024 wide |
| R3b.6 | **Continue here.** On a session you started (not a sub-agent), "Continue in DevPulse" — your click — starts an agent thread in its project with the session's own id as the resume token, so the vendor continues it in its folder. | a Codex session from the terminal continued in DevPulse |

**Question for you:**

- **Q54 Where the board lives.** Its own page in the navigation
  (DevPulse › AgentHub), with chat linking to it — or a tab inside chat?

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
- 2026-10-25 — **R3a done: your sessions, found wherever DevPulse runs.**
  - Kernel `providers/history/`, authored from `recovered/devpulselabs`:
    `store` (the bounded, read-only, jailed history reader with cursor paging
    and usage recovery) → `history/mod.rs`; the part of `core` it uses →
    `history/events.rs`; the Claude and Codex readers and usage dialects →
    `history/claude.rs`, `history/codex.rs`, their shared helpers (each crate
    had a copy) → `history/record.rs`. On DevPulse's `ProviderId`; readers
    and sources are `Send + Sync` so the engine can share the catalog.
  - Taught the formats written today (surveyed on this machine, key names
    only): Claude Code 2.1.310's tool results inside `user` records,
    thinking-only records, its own session title (`ai-title`), PR links and
    bookkeeping records; Codex's `event_msg.item_completed` (PascalCase item
    types), `token_usage_record`, `thread_settings_applied`, agent-to-agent
    messages and developer instructions. Titles skip context a tool put in
    front of your first request.
  - Found in the live check and fixed (surveyed 2026-10-25, key names and
    offsets only):
    - Codex writes up to 201 KB of instructions, tools and environment
      before your first request, past the 64 KiB a reader looks at to name a
      session; every Codex session fell back to "Codex · folder · date". A
      definition now says how far to look (`[history] prefix_bytes`, Codex
      512 KiB, validated against the 1 KiB–1 MiB the store allows), and the
      reader stops at the title.
    - A session Codex forks for a sub-agent carries its parent's
      `session_meta` second; it overwrote the session's id, folder and
      start (5 of 42). The first one is the session's own.
    - Codex sub-agents (`source.subagent`) are named by the task their
      parent sent (`agent_message`, when not encrypted), else
      "Codex sub-agent {nickname}"; a fork's copy of its parent's history
      does not name it. Codex Desktop's "## My request for Codex:" heading
      after attached context (in-app browser, files) is honoured.
    - Claude Code's `queue-operation` (what you type while it works:
      enqueue, dequeue, remove) is bookkeeping; a delivered one is in the
      history again as your message.
    - Not yet: a sub-agent session's link to its parent
      (`parent_thread_id`) — the board groups sub-agents under their
      parent in R3b.
  - Each definition says where its history is (`[history]`: format, root,
    and the variable that moves the vendor's home — `CLAUDE_CONFIG_DIR`,
    `CODEX_HOME`); a reader may only read its own provider's files.
  - Engine `platform/agenthub.rs` (no database needed) and Tauri
    `agenthub_sessions`, `agenthub_session_page` (`CommandError`).
  - Verified: 28 history tests (your store's 6, the readers' 13 plus the
    current-format, titling, fork, sub-agent, prefix and catalog tests);
    clippy (all targets), rustfmt clean.
  - Live, through the app's IPC: 173 transcripts (Claude Code 131 from
    `~/.claude/projects`, Codex 42 from `~/.codex/sessions`), newest first —
    *corrected the same day:* 60 sessions you started and 113 of their
    sub-agents, listed flat until R3b.1;
    40 of 42 Codex sessions named by your request or a sub-agent's task (the
    other two are empty sessions, rightly "Codex · folder · date"); pages in
    both directions in under 50 ms; no unknown record on the newest pages.
  - Measured, for R3b: each listing re-reads every file's start (about
    29 MB here) — about 200 ms warm, 3.8–4.8 s for the first call while the
    app boots. The board keeps the index between calls and re-reads only
    files whose size or time changed.
