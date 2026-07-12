# Honest Baseline — 2026-05-20

> Authored after a session where the owner called out three months of
> "yes" answers followed by "actually nothing works." This document is
> the truth as of today, citing files and line numbers. It supersedes
> any prior session's narrative.
>
> ## ⚠ REFRAMED — 2026-06-28
>
> Point-in-time honest baseline (2026-05-20) — its verified boot evidence, file:line citations, and gap analysis are accurate, but it predates the 2026-06-27 DevPulse/ClyffyOS split.
>
> - **Split / relocation** — This baseline describes a single-process monolith: all four DBs + Burn embedding + RRO upsert + inference run inside one binary. Post-pivot, SurrealDB + qortex (the Qdrant vector store) + the encoder/embedder/reranker stack + ALL inference + the connectome live on ClyffyOS (GB10 / networked VRAM pool). DevPulse is the standalone frontend (Turso + DuckDB local), connecting via Bonjour + /v1/capability + MCP verbs. The "staged indexing orchestrator" gap named here is GB10-side work.
> - **Renames land in Phase 2, with the code** — cortex → connectome, Qdrant → qortex, libSQL → Turso. The code paths and constants cited below (`kernel/devpulse-clyffy/src/cortex/persistence/{burn,rro}/`, `boot/relational.rs`, the `qdrant` devtool folder, `cortex_swap_encoder`) stay ACCURATE until Phase 2 renames them. The qwen3/Burn embedder + RRO collection dim are GB10-side, model-size-agnostic config (8GB LLM floor, scales up), not DevPulse architecture.
> - **Still valid** — The verified four-DB boot.log, all file:line citations, the staged-indexing-pipeline gap, the branch-fossil net-diff analysis, the memory-patch records, and the cloud-SurrealDB attribution corrections are preserved as the project's memory.
>
> Current truth: `CLYFFY-COGNITIVE-FOUNDATION.md` (v2.0.0) + the 2026-06-27 architecture corrections. Records below preserved.
>
> **⚠ CUT LANDED — 2026-07-08.** The split described above happened: the kernel left this repo (AI layer = `github.com/EonsofStupid/clyffyos`). Every `kernel/…` path below is a git-history reference. This point-in-time baseline is preserved as the project's memory.

## What boots today (verified)

The four-DB boot already works. The last clean run is on disk:
`.userdata/logs/boot.log` (2026-05-12 22:10:31 UTC) shows:

```
[+000.090s] [  OK ] System relational: LibSQL ...platform.db (6ms)
[+005.513s] [  OK ] System analytics: DuckDB ...analytics.duckdb (5345ms)
[+010.464s] [  OK ] SurrealKV embedded: open at ...surreal\devpulse (4886ms)
[+016.302s] [  OK ] Graph store: 3 namespaces ready (5837ms)
[+016.910s] [  OK ] Vector store: RRO verified ...system/rro/storage (107ms)
[+017.705s] [READY] All critical services confirmed — UI may render (17705ms total)
```

Boot path (top-down):

1. `cargo xtask run-dev` ([xtask/src/commands/dev.rs:182](../../xtask/src/commands/dev.rs#L182))
   compiles + launches.
2. `interfaces/desktop/src-tauri/src/main.rs:29` →
   `devpulse_desktop_backend::run()`.
3. Tauri setup at
   [interfaces/desktop/src-tauri/src/lib.rs:601-899](../../interfaces/desktop/src-tauri/src/lib.rs#L601-L899)
   shows the window first, then spawns boot_task.
4. `Platform::boot()` at
   [systems/devpulse-engine/src/platform/mod.rs:427-510](../../systems/devpulse-engine/src/platform/mod.rs#L427-L510)
   delegates to `boot::execute()` at
   [systems/devpulse-engine/src/platform/boot/mod.rs:115](../../systems/devpulse-engine/src/platform/boot/mod.rs#L115).

Per-DB init, all wired and currently `enabled = true, critical = true`:

| DB        | Init module                                                               | Boot site                                   | Config                                                 | Devtool                                                                 |
|-----------|---------------------------------------------------------------------------|---------------------------------------------|--------------------------------------------------------|-------------------------------------------------------------------------|
| LibSQL    | [boot/relational.rs:28](../../systems/devpulse-engine/src/platform/boot/relational.rs#L28) | boot/mod.rs:180-189 + 266-275               | config/platform/services/system/libsql.toml            | interfaces/desktop/src/lib/devtools/system/datastores/libsql/           |
| DuckDB    | [boot/analytics.rs:24](../../systems/devpulse-engine/src/platform/boot/analytics.rs#L24)  | boot/mod.rs:194-203 + 304-313               | config/platform/services/system/duckdb.toml            | interfaces/desktop/src/lib/devtools/system/datastores/duckdb/           |
| SurrealKV | [boot/graph.rs:33](../../systems/devpulse-engine/src/platform/boot/graph.rs#L33)          | boot/mod.rs:229-243 (parallel via tokio::join!) | config/platform/services/system/surreal.toml (3 NS/DB) | interfaces/desktop/src/lib/devtools/system/datastores/surrealdb/        |
| Qdrant    | [boot/vector.rs:30](../../systems/devpulse-engine/src/platform/boot/vector.rs#L30)        | boot/mod.rs:319-325 (`#[cfg(feature = "rro")]`) | config/platform/services/system/cache-vector.toml      | interfaces/desktop/src/lib/devtools/system/datastores/qdrant/           |

## What is gated off

- **Burn feature not in dev binary.** `interfaces/desktop/src-tauri/Cargo.toml:53`
  declares `devpulse-engine = { ..., features = ["rro", "candle", "inference"] }`.
  `"burn"` is absent. The `#[cfg(feature = "burn")]` adapter constructor at
  `systems/devpulse-engine/src/platform/boot/model_loader.rs:182-217`
  therefore returns `None` at boot, and `burn_embed` / `encoder_embed` /
  `cortex_swap_encoder` all dead-end with "adapter not wired."
- **No automatic RRO write at boot.** Engine creates the Qdrant collection
  container but does not embed anything or upsert points. Search for
  `upsert_points` outside `kernel/devpulse-clyffy/src/cortex/persistence/rro/mod.rs`
  returns zero. There is no Tauri command that upserts to RRO — only
  `vector_test_search` + collection create/delete.
- **Model loader does NOT auto-load slots.** Owner decision documented
  at `systems/devpulse-engine/src/platform/boot/model_loader.rs:115-119`
  (2026-04-20): `auto_load_hot_slots()` was deliberately removed. Slots
  stay COLD until the user clicks Apply/Load. Any "encoder + embedder"
  end-to-end path requires the user to load `chat.suggest` (or
  equivalent) first.
- **No `enabled = false` runtime gates on the four DBs.** Single
  `enabled = false` in `config/platform/build/deps.toml:55` is a
  build-time `code_oss` toggle, unrelated.

## The missing piece — staged indexing pipeline

Grep across the workspace:

```
indexing_pipeline | index_stage | staged_index | index_project |
indexer_run | IndexingStage | index.*stage.*log
```

Returns **zero files** (verified 2026-05-20).

This is the gap that's never closed. The pieces that DO exist:

- `systems/devpulse-engine/src/platform/services/project_init.rs`
- `interfaces/desktop/src-tauri/src/commands/projects/mod.rs`
- `kernel/rrd/` (daemon, lifecycle, state, traits, e2e tests)
- `kernel/devpulse-clyffy/src/cortex/persistence/burn/`
  (loader, embedder_impl, adapter, qwen3, hot_update, tokenizer)
- `kernel/devpulse-clyffy/src/cortex/persistence/rro/`
  (embedded Qdrant + collection lifecycle)
- The four-DB boot (verified above)

What does NOT exist: the orchestrator that sequences project_init →
filewalk → classify → Burn embed → RRO upsert + DuckDB row + Surreal
node + libSQL record → verify. **That is the foundation slice.** Not
specs, not wizard polish, not component restoration.

## What memory claimed that the code disproved (now patched)

Fixed in memory store on 2026-05-20:

- `project_clyffy_persona_representation.md` — was citing `:8822` for
  embedded SurrealKV (false — embedded uses file lock, no port). Added
  cloud-vs-embedded note + corrected the sessions-table NS attribution
  (`agents/claude`, not `projects/devpulse`).
- `project_qdrant_surreal_dev_prod_split.md` — was implying cloud
  connectors were wired in code. They are not. Patched with the
  in-repo cloud reference being only `.claude/hooks/banter-dump.js`
  and the eight-namespace cloud layout.
- `project_rro_burn_authorship.md` — was citing "currently zero Burn
  deps on disk." Patched with the actual Burn surface (`kernel/rrd/`,
  `kernel/devpulse-clyffy/src/cortex/persistence/burn/`,
  `kernel/model-loader/src/backends/burn_adapter.rs`,
  `systems/devpulse-engine/src/platform/services/rrd_translator.rs`)
  and the Cargo feature gap.
- `feedback_check_runtime_gates_first.md` — added the 2026-05-20
  Cargo-feature instance to keep the rule warm.

New memories added:

- `project_staged_indexing_missing.md` — names the gap.
- `project_rrd_daemon_authored.md` — counters future rot.
- `feedback_main_churns_on_maintenance.md` — pattern note.

## Cloud SurrealDB — verified working, mis-attributed

- Cred + lowercase headers (`surreal-ns`/`surreal-db`) work. Direct
  `CREATE diag_probe:test_<ts>` against
  `devpulse-06e6sbjhctrt511bgpdvd3d6c8.aws-use1.surreal.cloud`
  landed in 10ms with `status: "OK"`.
- Sessions table is in NS=`agents` DB=`claude` (2 records as of
  2026-05-20). NS=`projects` DB=`devpulse` does NOT contain a sessions
  table — it's project memory (architecture/commits/context/decisions/
  file_conventions/governance_decision/lesson_progress/patterns/tasks).
- The save-hooks "PATCHED 2026-05-09 ... Verified end-to-end" claim
  in restored context is partly right (writes land) and partly wrong
  (only 2 sessions ever saved; restored-context's session-record NS
  attribution is incorrect).

## Branches — fossils, not work-in-flight

The four "unmerged" local branches are stale experiments, not pending
work that needs to land in main. Net diff vs main:

- `claude/vigilant-bardeen-d6515d` (May 5, "RRD devtool"):
  462 files, +5,953 / -49,141 (net DELETE 43k lines vs main)
- `claude/eager-yalow-db8378` (May 11, "SurrealDB hero"):
  338 files, +2,956 / -34,449 (net DELETE 31k)
- `pr/llguidance-kernel-boundary` (Apr 9):
  2,919 files, +172,440 / -291,272 (net DELETE 119k)
- `claude/bold-pare` (Apr 14, "setup wizard reauthor"):
  1,841 files, +159,446 / -239,172 (net DELETE 80k)

Merging any of these today would regress main. They should be deleted
(owner confirmation required). The work concepts they explored ARE in
main already by other commits.

Plus two stashes on main (both legit, not band-aids):

- `stash@{0}` — stderr non-blocking writer (Chromium WebView2 stderr
  flood blocks IPC dispatch thread). Should land.
- `stash@{1}` — `keyring` crate landed in Cargo.lock, gpu_name borrow
  fix, per-slot import target, SlotAssignmentPanel doc improvements.
  Should land.

## Smallest verifiable next slice

Two options, both small, depending on the owner's call:

**Option A — Light up the existing chain.** One feature flag flip plus
a rebuild. Add `"burn"` to the engine feature list in
`interfaces/desktop/src-tauri/Cargo.toml:53`. This compiles the Burn
encoder into the dev binary, unblocks `cortex_swap_encoder` and
`encoder_embed`, and gives the existing `EncoderPanel.svelte` live
state. Combined with `cargo xtask run-dev` rebuild, the four DBs + a
linked encoder become observable in devtools — but no project content
flows through them because nothing drives the pipeline.

**Option B — Build the missing orchestrator.** Author the staged
indexing pipeline (per `project_staged_indexing_missing.md`).
Stages: discover → classify → embed → store → verify. Per-stage
tracing + `InternalEvent` events. Per-stage devtool at
`/devtools/clyffy/indexing/`. This is the actual foundation slice
the owner has been describing for three months.

Option A is one-character-of-intent (Cargo.toml edit) plus a rebuild.
Option B is the real foundation work and will take multiple sessions.
A unblocks B but A alone does not earn a "this works" milestone — the
runtime chain isn't driven by anything.
