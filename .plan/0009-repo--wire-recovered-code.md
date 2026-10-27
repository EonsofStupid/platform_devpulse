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
updated: 2026-10-27
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

### AgentHub architecture correction (owner, 2026-10-27)

**Status:** Accepted product requirements; implementation remains open.
**Decider:** Jesse Hades Hall. This direction governs R3b and the B5 work
in plan 0001; the earlier in-process facade is not the finished architecture.

> "agenthub should be properly using clean prefix tables, and properly
> leverage the ability to integrate clyffy from remote endpoints, activate
> with their codex subscription ... agenthub is a sub process, and properly
> bundled with devpulse"

**Context verified in the active code:** `Platform` currently constructs
`AgentHub`, `Agents` and `Rooms` inside the desktop's engine process.
`platform/agenthub.rs` is a retained history catalog, not a supervised
AgentHub executable. The release configuration does not declare an
AgentHub binary. Shared conversation tables and `agent_threads` /
`room_threads` exist, but the board and ticket tables do not. The endpoint
probe identifies an OpenAI-compatible server; that alone does not establish
Clyffy execution through it. Codex uses its own login and the ACP connector,
but `SignedIn::Yes` does not distinguish ChatGPT login from API-key login.

**Decision and ownership:**

- AgentHub is a bundled Rust subprocess, supervised by DevPulse through
  the existing `devpulse-process` lifecycle machinery. It owns AgentHub
  orchestration, the history catalog and authoritative live execution state.
  The engine facade becomes its typed client; Tauri and Svelte consume that
  client. Reuse and relocate the active history, agent and room capabilities
  with their tests; do not leave a second in-process execution path.
- AgentHub-owned SQL tables, indexes and constraints use the `agenthub_`
  prefix. The board table is `agenthub_board_cards`; tickets and their
  related rows follow the same namespace. Inventory the existing thread,
  room, session and turn ownership before naming the rest. Shared chat and
  project records retain one canonical owner and explicit references; do not
  copy them into a second store just to add a prefix. Reauthor schema and
  every reader/writer together. Preserve existing user records through an
  explicit, tested data migration; no compatibility views, aliases or dual
  writes, and no database reset.
- Keep one authority for durable writes. The intended integration is the
  platform's existing user-database service, reached by the subprocess over
  typed requests. Answer, continuation token and completion state must commit
  together before success is published. The subprocess boundary must not
  split a logical transaction into independent acknowledgements.
- AgentHub consumes Clyffy's provider/endpoint contract. Configured remote
  endpoints are valid execution sources without a local model requirement.
  Resolve the selected endpoint and model, authentication reference and
  advertised capabilities; verify a real request, streaming, cancellation
  and disconnect behavior. Reuse the provider owners from plan 0001, not a
  second AgentHub-only registry. Do not send subscription credentials to a
  remote endpoint or silently substitute a different provider.
- Codex activation uses the user's explicit action and Codex's own sign-in.
  Distinguish installation, connector readiness, authentication method and
  successful use. A generic successful login check is not proof of an active
  subscription. Keep subscription execution through the vendor's supported
  authenticated transport; API-key usage is a separately identified choice.
  Preserve the verified workspace and resume identity across the process
  boundary. Do not copy login secrets into AgentHub tables or the bundle.
- Ship the AgentHub executable and required non-secret resources in both
  portable and installer builds. Resolve it from the installed bundle, not
  the developer checkout or a globally installed command. Verify startup
  readiness, protocol/build compatibility, logs, shutdown and child cleanup.
  A crash must resolve pending requests and invalidate live state; restarting
  the process must not silently repeat tool work.

**Trade-off:** A subprocess adds transport, lifecycle and packaging work,
but gives AgentHub the explicit runtime boundary the owner requires. Keeping
only the current in-process facade would avoid that work but would not meet
the requirement. The existing facade remains the integration point while
its implementation is reauthored, not a compatibility alternative.

**Acceptance before R3b is complete:** packaged clean-machine startup with
no checkout, one supervised AgentHub child, no child after DevPulse exits;
schema/foreign-key and record-preservation checks; two-window live-state
reconstruction; an explicitly activated Codex subscription producing and
continuing a saved turn; a configured remote endpoint powering Clyffy in an
AgentHub workflow; injected database, authentication, endpoint and child
failure with truthful UI and recoverable answers. Unit tests or a working
history list do not substitute for these integration checks.

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
| R3b.0 | **Runtime and provider boundary.** Extract the existing AgentHub execution owners into the bundled, supervised subprocess above; keep one typed engine client and the existing database/provider authorities. | portable and installed startup, process cleanup, durable failure handling, remote Clyffy execution and explicit Codex subscription activation |
| R3b.1 | **Sub-agents under their parent; the index kept.** The kernel's index says each sub-agent's parent (Claude Code: `isSidechain` and `sessionId`; Codex: its `source.subagent` and the parent field a key survey confirms first). The catalog keeps each source's index between calls and re-reads only files whose size or time changed; the AgentHub runtime holds one catalog. `FoundSession` gains the parent. | the current user-started sessions listed with their sub-agents under them; an unchanged second listing reads zero transcript prefixes; the first call's time measured |
| R3b.2 | **Live state.** The subprocess's agent and room owners keep each live conversation's state — working (a prompt in flight), waiting for you (a permission or a pick unanswered), idle. The engine relays revisioned snapshots and `agenthubChanged`; a process disconnect invalidates its live observations. | a Codex thread shows working, then idle; a permission request shows waiting for you; another window reconstructs both correctly |
| R3b.3 | **The board in Turso.** Columns: Working, Waiting for you, Done. Keep observed runtime state separate from persisted board placement; an explicit move wins until the user returns the card to automatic placement. Automatic placement maps working to Working, waiting to Waiting for you, and idle to Done; Done is board placement, not a claim that a task succeeded. File modification time reports recent activity only, never proves working, waiting, or completion. Found sessions without live evidence default to Done with their live state shown as unknown. A found session belongs to the most specific project folder containing its folder, using path components; the rest are "Elsewhere on this machine". What you change is kept in `agenthub_board_cards` (user database): a card's column, its place, pinned, hidden. Engine `board(project)`, `move_card`; Tauri `agenthub_board`, `agenthub_move_card`. | a moved card survives state changes and restart; a recent file write does not invent a live state |
| R3b.4 | **`board-column` in ColdLight**, as above, with its Storybook-style fixture. | the fixture renders; the curator audit has no finding |
| R3b.5 | **The module and its page.** `domains/agenthub/`: `data-access/agenthub.service.ts` (every command and event), `agenthub.state.svelte.ts`, `ui/board-card/`, `feature/AgentHubBoard.svelte`, `index.ts` (chat integrates through it alone). The page comes from its folder (plan 0008: `_nav`, its copy). A found session opens read only, newest page first, "Show older"; sub-agents fold under their parent's card. | your real sessions on the board; screenshots at 1440 and 1024 wide |
| R3b.6 | **Continue here.** On a session you started (not a sub-agent), "Continue in DevPulse" — your click — starts an agent thread in its project with the session's own id as the resume token, so the vendor continues it in its folder. | a Codex session from the terminal continued in DevPulse |

**Q54 implementation recommendation (Codex review, 2026-10-25):** its own
page in the navigation, **DevPulse › AgentHub**, with chat linking to it.
The board spans sessions, agents and rooms and needs its own stable route.
Use this as the implementation default; it is not a recorded owner answer
to Q54.

#### R3b implementation contract (Codex review, 2026-10-25)

Owner direction for this review:

> "help claude please and ensure this pre-release code is getting fixed
> directly not deprecated no compatibility we do it right and thorough"

- **Reauthor the owning implementation in place.** Change the existing
  history sources, `AgentHub`, commands and their callers together. No
  deprecated entry points, compatibility wrappers, parallel V2 paths or
  fallback to the old implementation. Preserve recovered originals and
  capabilities under the include-before-delete rule; this is not blanket
  permission to delete unrelated code or user data.
- **One catalog for listing and paging.** The retained catalog and prefix
  cache are now implemented in the existing engine/kernel owners. Move
  that single catalog into the supervised AgentHub runtime; the engine
  client must not construct a second catalog. Each source owns its bounded
  metadata cache. Keep
  filesystem work on the existing blocking executor. Concurrent requests
  must share a refresh instead of starting duplicate scans; do not hold
  an unrelated platform lock during disk reads.
- **Refresh correctness belongs in R3b.1.** Inspect the bounded directory
  inventory for additions, removals and renames. Reuse unchanged metadata;
  invalidate on size or full available modification-time changes, source
  root, definition or limits changes. Do not use the rounded display
  timestamp as the cache fingerprint. Handle missing roots appearing,
  roots disappearing, unreadable files and partial writes without
  permanently caching failure. If a file changes during a read, retry
  within a bound or mark it for refresh; do not label mixed data fresh.
  Document filesystem timestamp limitations. Keep source errors and
  truncation visible, deterministic ordering, and the existing read jail
  and paging limits. Cached paths must still be checked before opening.
- **Parentage and identity are different.** Carry an explicit sub-agent
  classification as well as an optional parent reference. Missing parents
  must not turn sub-agents into user-started sessions or hide them. Confirm
  provider parent fields from a redacted key survey and add fixtures;
  preserve Codex's first-own-metadata rule. Resolve parents within the
  provider, handle ambiguous ids, missing parents and cycles, and retain
  artifact identity when native ids repeat. Do not infer parentage from
  titles or assume every fork is a sub-agent.
- **Prove the I/O improvement.** Instrument prefix reads and bytes. An
  unchanged second listing must read zero transcript prefixes; one changed
  file must refresh only that file. Test additions, deletion, truncation,
  same-size edits with changed timestamps, partial writes, root changes,
  filtering and simultaneous listings. These are behavioral tests, not
  assertions that a cache field exists. Re-run the existing history tests.
  Measure cold startup, warm listing and paging through real IPC with
  counts and timings; 60 parents / 113 children are a dated observation,
  not a hardcoded acceptance count. An in-memory cache alone does not fix
  the first call. Profile that call and address the measured bottleneck;
  do not claim startup is fixed from a warm-cache benchmark.
- **State, persistence and continuation need end-to-end checks.** Test
  permission resolution, cancellation, failure and disconnect so cards
  cannot remain working forever. Persist moves and ordering atomically;
  runtime events must not overwrite explicit placement. Test nested and
  similarly named project folders. Continue only on an explicit click for
  a positively identified user-started session, using its own provider,
  native id and workspace; reject duplicate in-flight clicks and surface
  provider resume failures. Unknown parentage does not grant eligibility.
- **Finish each slice with evidence.** Update Rust and generated frontend
  contracts together, run affected compile/type checks, tests, clippy and
  rustfmt, then the required hooks when committing. Verify the running app
  via `cargo xtask run-dev`, including keyboard card movement, reload and
  restart persistence, newest-first page loading and screenshots for the
  UI slices. Keep unrelated generated timestamp churn out of the change.
  Report what was actually verified and any remaining failure; a plan
  update or passing unit tests alone does not complete R3b.

R3b.1 cache implementation slice (Codex, 2026-10-25): authored directly in
the existing kernel history module and engine facade, with I/O counters and
regression tests (verification below). Parent grouping and live IPC startup
measurements remain separate, unfinished R3b.1 work. No IPC payload changes
were needed for this cache slice.

#### Existing-code readiness review (2026-10-26)

Scope: the active history readers, engine agent/room execution and
persistence, Tauri intents, chat state and route/component inventory.
These are code-path findings, not claims from a new live-app run. The
recovered originals remain references; the fixes belong in their active
owners. Do not build another execution stack inside the board.

| Priority | Finding and concrete trigger | Direct fix and acceptance evidence |
| --- | --- | --- |
| P1 fixed | **A stale card could open another source's transcript.** `history/mod.rs::locator_for` hashed provider plus relative filename only. Changing a history root to another directory containing the same filename reused the locator. The strengthened engine regression reproduced the collision before the fix. | The existing locator now includes canonical source identity. Regression coverage checks identical filenames in two roots, rejection of the old locator after switching roots, distinct session/event ids, and stable identity when reopening the same source. A future persisted board needs an explicit durable card identity; do not treat a path locator as a portable logical-session id. No legacy locator fallback. |
| P1 fixed | **ACP continuation silently started fresh.** The ACP branch discarded the saved resume token. | The active transport now restores the saved id with advertised `session/resume`, or `session/load` when resume is not supported. Unsupported and refused restores fail explicitly without creating a new session. Ordered load replay is drained before readiness. Five SDK protocol-peer regressions verify identity/workspace, subsequent prompting, failed/unsupported restoration and replay exclusion. Vendor-to-DevPulse continuation still needs live verification before R3b.6 is complete. |
| P1 | **Successful completion does not mean saved completion.** `platform/agents.rs::prompt` logs answer/token write failures and still sends the original terminal event; `platform/rooms.rs::Host::finish` sends `Finished` after a failed save, and `RoomHost::record` cannot return an error. An agent prompt also starts before saving the user turn. | Make persistence failure observable through the existing execution contracts, preserve the answer for recovery, and prevent untracked execution if the initiating turn cannot be stored. Inject failures before dispatch, while saving an answer/token, and while saving a room outcome; no successful persisted-state claim may escape. |
| P1 fixed | **Turn order and thread creation were not atomic.** Separate reads/writes could reuse sequence numbers or leave incomplete threads. | The existing Turso adapter now commits parameterized single-row mutations on one connection under an immediate writer lock, checking affected rows and rolling back failures. Agent and room creation use it; turn order is allocated inside the insert, with the session counter in the same transaction. Regressions verify 16 concurrent turns, first/second-statement failures, missing sessions and wrong-project writes. No database reset or compatibility path. |
| P1 | **Live truth belongs to the engine, but currently exists only as transient events and one window's turn.** `agents.state.svelte.ts` has a single `turn`, subscribes when prompting, and ignores other session ids. Neither `Agents` nor `Rooms` exposes the required working/waiting/idle snapshot. Permission timeout/removal has no resolution event. A newly opened window cannot reconstruct an ongoing turn or waiting permission. | R3b.2 must add authoritative per-conversation state and pending requests in the existing engine owners, plus a snapshot and revisioned changes. Test two active threads, room seats, opening/reloading a second window, permission answer/timeout, cancellation and disconnect. Derive badges from this state, independently of saved card placement. |
| P1 fixed | **An unavailable project silently changed where tools ran.** `Agents::folder` substituted `data_dir/tools/ask` for a missing project or project-state read error; `conversation` created its working directory. Tool-enabled room seats used the same path. | `Projects::workspace` now requires a live project and an existing absolute directory, propagating database errors. Agent and room startup propagate that refusal; only an explicitly talk-only place may create its isolated folder. Five regressions cover missing/removed/restored projects, missing/non-directory/relative paths, database failure, and startup that never recreates a missing tool workspace. |
| P2 fixed | **Late loads could replace the selected conversation.** Chat loads and thread refreshes applied responses after selection changed. | The existing Svelte stores guard success and failure by request generation and project/session identity. Session selection invalidates pending loads immediately; stale completions cannot clear a newer loading flag. Browser tests cover both response orders, same-selection refreshes, project changes and stale IPC/transport errors. The browser harness now uses the SvelteKit plugin to resolve the app's existing `$app/*` imports. |
| Required delivery | **The board is not yet an available product surface.** Only generated bindings reference `agenthubSessions`/`agenthubSessionPage` in the frontend. There is no `domains/agenthub`, route, `agenthub_board_cards` schema or ColdLight `board-column`; room commands likewise have no frontend consumers. Parent classification, native parent references and safe artifact links are now present in the index/DTO; the UI still needs to consume them. | Finish R3b.2 and durable completion handling, then the Turso board and its own page using ColdLight card/status/badge plus the new column. Connect read-only paging, keyboard moves, manual placement persistence and chat links. Only enable Continue after the continuity and workspace checks above pass. Verify the real user journey, not just generated commands. |

Implementation order after the cache and source identity fixes:
parent/classification metadata; execution-state and persistence correctness;
persisted board and its UI; explicit continuation with restored provider
context; then R3c hand-offs. Continuation correctness can be fixed in its
provider owner earlier, but the button must not precede it. Keep cold-start
profiling separate from warm-cache evidence. The existing plan 0001 B4.3
ColdLight composition requirements still apply; plan 0009's card inventory
is the specific board decision (no extra library card kind).

## Log

- 2026-10-27 — **Recovery audit and active delivery.** Recheck every recorded
  recovered blob against its source in Git, and inventory deleted source
  outside the manifest. Repair the recovery script first: its current HEAD
  blob deduplication includes `recovered/` itself, so rerunning it can erase
  provenance rows. Preserve the existing inventory, refuse to overwrite a
  changed recovered file, and add read-only verification with rerun tests.
  Report archived presence separately from active integration. Then move
  AgentHub-owned thread tables to the `agenthub_` namespace through tested
  data-preserving migrations and update their active callers together.
  - Evidence: all original 4,923 archive entries match Git. The broader
    source/supporting-file audit recovered 1,110 additional files; all 6,033
    now match their recorded blobs, with zero uncovered deletions in scope.
    Six real-Git recovery regressions pass. `recovered/STATUS.md` records
    counts, active integration gaps and the explicit limits of this audit.

- 2026-10-27 — **Verification checkpoint.** Full kernel/engine library suites
  pass: 199 kernel and 169 engine tests, with six existing ignored tests.
  This includes parent-cache/graph, ACP restore, and atomic-write regressions.
  IPC bindings regenerated through `cargo xtask regen-bindings`. Browser
  selection regressions pass (eight), and the desktop type check reports
  zero errors/warnings against the generated contract. Rustfmt and Biome
  pass; final lint/hook results are recorded at delivery. Specta's existing
  trailing spaces are retained in its generated file, not hand-edited.
  No running-app, startup-latency or completed-board claim is made.

- 2026-10-27 — **Atomic conversation writes.** Add a single-connection,
  immediate transaction for parameterized single-row writes in the existing
  Turso adapter. Each statement must affect exactly one row; failures roll
  back the whole logical write. Use it for agent/room session creation and
  turn insertion plus session counters. Allocate the turn order inside the
  insert while holding the transaction's writer lock. Test concurrent turns,
  a missing/wrong-project session and failure of each constituent statement.
  Follow-up call-site review found the two ordinary-chat Tauri writers also
  allocate sequences before inserting. Route them through the same engine
  `save_turn` operation, carrying token counts and returning the created id
  for their existing read-back. This removes the remaining cross-writer race
  rather than maintaining a second SQL implementation.

- 2026-10-27 — **Selected chat response ownership.** Guard the existing
  chat load and agent-thread refresh with monotonically increasing request
  generations and the selected project/session identity. A late success or
  error cannot replace the newer selection or clear its loading flag.
  Invalidate pending message loads immediately when selecting a session.
  Browser regressions use deferred IPC responses in both completion orders.

- 2026-10-27 — **ACP continuity repair in the active transport.**
  Carry the saved id through `AgentSession::start` to ACP startup. After
  initialization, prefer advertised `session/resume`, otherwise advertised
  `session/load`; unsupported or failed restoration is an error, never a
  new session. Drain the SDK's ordered pre-response load replay before
  making a session ready so old content cannot become a new answer.
  Exercise the actual SDK connection with an in-memory protocol peer:
  request ids/workspace, subsequent prompt, unsupported capability, refused
  restoration, and replay exclusion. No compatibility transport is added.

- 2026-10-27 — **Resume R3b: parent identity before board wiring.**
  Add explicit user-started/sub-agent/unknown classification and a separate
  optional native parent id to the existing readers and retained index.
  A bounded local key-only survey confirmed Claude's `isSidechain` plus
  `sessionId` in `subagents/` files, and Codex's first own `session_meta`
  with `source.subagent.thread_spawn.parent_thread_id` and a matching
  top-level `parent_thread_id`. A fork id alone is not sub-agent evidence.
  Resolve links within a provider only when the parent artifact is unique;
  retain orphaned, ambiguous and cyclic children visibly without granting
  continuation eligibility. Test the decoder rules, cached metadata and
  graph resolution, then regenerate IPC types and check the desktop.
  The history module is being read in focused chunks, not as a complete
  single-file read. Continue into the existing execution/persistence owners
  before enabling live board behavior or a continuation action.

- 2026-10-26 — **Push gate: newly reported compression advisories.**
  The push of `4efdc5c1` passed workspace clippy but was blocked by
  RUSTSEC-2026-0391, 0398, 0403 and 0410 in Turso's Tantivy compression
  dependencies. Turso 0.8.3 and the available 0.9 prerelease both require
  Tantivy 0.26.2; the released Tantivy 0.27 changes that package boundary.
  Patch the published `tantivy-sstable` 0.7.0 source under
  `deps/tantivy-sstable`, changing only its zstd dependency floor to 0.14.3.
  Source/test/benchmark files remain byte-identical to the registry crate;
  provenance and the upstream license are included. The upstream git snapshot
  also changes a dictionary API and cannot be used wholesale with Tantivy
  0.26.2. This minimal dependency change retains full-text search without
  introducing API adapters. Resolve zstd 0.14.3, zstd-safe 8.2.0 and zstd-sys
  2.1.2, then rerun the advisory gate, persistence tests, workspace checks and
  push hooks. No advisory ignore or application compatibility layer.
  - Verified final graph: `cargo deny check advisories`; kernel/engine
    all-targets clippy with `-D warnings`; full library suites (190 kernel,
    164 engine passed; six existing ignored tests). A new Turso regression
    builds a full-text index with 4,096 distinct terms, searches it, reopens
    the database and verifies index updates. All four Turso adapter tests
    pass. Twenty upstream source/test/benchmark files were compared byte for
    byte with the published crate. Rustfmt and diff checks pass.

- 2026-10-26 — **Resume: repair the existing verification failures.**
  Reproduce the recorded kernel/engine all-targets clippy failures, repair
  the existing tests in small groups without weakening production lint
  policy, and run the affected tests plus the full kernel/engine library
  suites. Fix any actual failing behavior those suites expose in its owner.
  Then revisit the readiness findings above; record separately what has
  been fixed and what remains unfinished. No compatibility implementations.
  The next behavior fix is workspace resolution: use the project owner to
  require a live project and an existing absolute folder; propagate that
  refusal through agent and room startup. Only an explicitly talk-only room
  place may create its isolated folder. Test missing/removed projects,
  unreadable project data, missing/non-directory/relative paths, and that
  tool-enabled startup never recreates a deleted workspace.
  - Completed the recorded test/lint repairs in their existing owners.
    Tests propagate setup failures, assert optional values directly, retain
    exact-zero sentinel assertions, and use checked-width fixture values.
    Named helpers shorten the Surreal and signal fixtures without changing
    their coverage. Intentional assertion panics have narrowly scoped test
    lint expectations; production lint policy is unchanged.
  - Workspace resolution is fixed as described in the readiness table.
    No substitute folder, deprecated API, or compatibility path was added.
  - Verified: full library suites (189 kernel and 159 engine passed, with
    six existing ignored tests); after the workspace fix, all 131 platform
    tests passed, including five new regressions; all four signal contract
    tests passed with unchanged JSON/TypeScript snapshots. Final kernel and
    engine all-targets clippy with `-D warnings`, rustfmt and diff checks pass.
  - ACP continuity, durable completion/atomic writes, authoritative live
    status, stale frontend responses and the remaining R3b UI are still open.
    No live startup measurement or completed-board claim is made.

- 2026-10-26 — **Cache pushed; existing-code review and source identity fix.**
  - Cache commit `6a111b20` pushed to `restore/pre-gb10`; normal commit
    and push hooks passed, including workspace check/clippy and cargo-deny.
  - Reviewed active history, agent/room execution, persistence and frontend
    consumers. The readiness table above records remaining direct fixes and
    concrete acceptance checks; R3b is not complete.
  - Reproduced the cross-root locator collision in the engine integration
    test using the same filename in both roots. Added canonical source
    identity to the existing locator, with no compatibility lookup path.
  - Verified after the fix: 37 history tests and the engine AgentHub
    integration test pass; rustfmt and scoped diff checks pass.
  - The dev app remains stopped; cold-start latency and the full AgentHub
    user journey still require live verification.

- 2026-10-25 — **R3b.1 cache slice implemented; R3b.1 remains open.**
  - `JsonlHistorySource` keeps bounded per-file metadata using size and full
    modification/creation timestamps. Each listing checks the directory
    inventory, evicts departed files and re-reads only changed prefixes.
    Concurrent listings share the source cache. A file changing during
    indexing gets at most two attempts; an unstable result is not cached.
  - `AgentHub` owns one catalog shared by listing and paging. Configuration
    refresh retains unchanged sources and invalidates moved, missing or
    reconfigured roots. Source snapshots let transcript reads run outside
    the catalog configuration lock. No deprecated API or compatibility path.
  - Logs expose actual prefix reads/bytes and separate total latency,
    blocking-executor queue wait, configuration refresh and listing time.
    Fixed the existing false truncation flag at exactly the file ceiling.
  - Verified: `cargo check -p devpulse-engine`; 36 history tests via
    `cargo xtask test -p devpulse-clyffy -- --lib providers::history`;
    one engine integration test via `cargo xtask test -p devpulse-engine
    -- --lib platform::agenthub::tests`; production-library clippy via
    `cargo xtask clippy -p devpulse-clyffy -p devpulse-engine -- --lib
    -- -D warnings`; rustfmt and scoped `git diff --check`.
  - Tests prove zero transcript prefix reads on an unchanged listing,
    one changed file read once, shared reads across concurrent callers,
    full timestamp invalidation for same-size edits, partial-write recovery,
    bounded retries, paging reuse, removal/rename and source reconfiguration.
  - The broader `--all-targets` clippy check fails in existing tests outside
    this change (kernel cortex and engine service/vision tests). It is not
    a clean all-targets result. Those files were not changed in this slice.
  - Not verified: real app IPC latency or cold startup improvement. The app
    was not launched, and no commit/push hooks were run for this uncommitted
    slice. The unrelated `terminology.ts` timestamp edit was left alone.
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
