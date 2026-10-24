# Turnkey Wizard Loading — Senior-Dev Plan

**Date:** 2026-05-20
**Status:** Plan only. Zero code changes proposed yet.
**Authority:** Every claim here is grounded in a file + line citation
read in this session. Gaps where I have not read the source are
labeled `[UNREAD]` — those become "read before acting" tasks, not
guesses.

This is the document that pays back three months. It maps Rust-first
boot, the four-DB topology, the wizard surface, the slot save chain,
the Burn + llama.cpp wiring, the RRD/RRO substrate, the intelligence
pipeline, and the DevForge removal target — each tied to the actual
file that owns it.

---

## 1. Multi-window architecture (what the customer sees)

**Source of truth read:**
[interfaces/desktop/src-tauri/src/commands/window/mod.rs:1-174](../../interfaces/desktop/src-tauri/src/commands/window/mod.rs#L1-L174),
[interfaces/desktop/src-tauri/src/commands/window/types.rs:1-115](../../interfaces/desktop/src-tauri/src/commands/window/types.rs#L1-L115),
[interfaces/desktop/src-tauri/tauri.conf.json:13-26](../../interfaces/desktop/src-tauri/tauri.conf.json#L13-L26).

Five window roles exist as typed `WindowRole` enum:

| Role | Label | Route | Default size | always_on_top | parent |
|---|---|---|---|---|---|
| `Main` | `main` | `/devpulse` | 1280×800 | false | — |
| `Chat` | `chat` | `/chat` | 480×700 | **true** | Main |
| `CortexViewer` | `cortex-viewer` | `/cortex` | 600×450 | true | Main |
| `ModelLoader` | `model-loader` | `/model-loader` | 700×500 | false | Main |
| `DevTools` | `devtools` | `/devtools` | 720×560 | true | Main |

`tauri.conf.json` declares only `main` — Main auto-opens on launch.
Every other role is spawned via `open_window(WindowRole)` (window/mod.rs:26-68).

**What is broken:** Nothing auto-calls `open_window(Chat)` on app
start. The customer flow you described — chat window loaded BEHIND
the wizard, wizard runs in front on Main — requires one call from
`routes/+layout.svelte` onMount after platformState reaches ready.

**Fix surface:** `interfaces/desktop/src/routes/+layout.svelte` —
already touched (BootOverlay mount), already imports
`platformState`. Add 8-line block: subscribe to `platformState.isReady`,
on first `true` transition invoke `commands.openWindow({ role: "Chat" })`,
guard with an "already opened" boolean so re-render doesn't respawn.

---

## 2. Rust boot pipeline (what loads first, in what order)

**Source of truth read:**
[systems/devpulse-engine/src/platform/boot/mod.rs:1-561](../../systems/devpulse-engine/src/platform/boot/mod.rs#L1-L561) (entire orchestrator).

Stage map, with feature gates:

```
Stage 1  Preflight (directory hierarchy)              CRITICAL
Stage 2  System libSQL (relational)                   CRITICAL
Stage 3  System DuckDB (analytics)                    CRITICAL
Stage 4  Graph (SurrealDB consolidated:               CRITICAL  ┐
         system + user + global namespaces)                     │ tokio::join!
Stage 4  Model Loader (registry + presets + HF cache) feature=inference  ┘
Stage 5  Moka cache                                   CRITICAL
Stage 6  User libSQL (relational)                     CRITICAL
Stage 6b Knowledge library sync (embedded JSON → libSQL)
Stage 6c User DuckDB (analytics)                      non-critical
Stage 7  Vector store (RRO embedded Qdrant)           feature=rro
Stage 9  Grammar service row write (kernel-owned)     critical-if-enabled
         Embedder + Whisper REMOVED — slot-managed by model loader
         DevForge REMOVED — lazy on first ensure_devforge_started()
Stage 10 validate_critical() — config-driven assertions
```

**Four databases per your spec — all wired:**

| Database | Stage | Scope | File |
|---|---|---|---|
| libSQL | 2, 6 | System + User | `services/relational.rs` `[UNREAD]` |
| DuckDB | 3, 6c | System + User | `services/analytics.rs` (schema partially read, see §5) |
| SurrealDB | 4 | system + user + global namespaces in ONE in-process store | `services/surreal.rs` + `boot/graph.rs` `[UNREAD]` |
| Qdrant | 7 | RRO embedded, feature-gated | `services/vector.rs` `[UNREAD]` + `kernel/devpulse-clyffy/src/cortex/persistence/rro/` `[UNREAD]` |

**DevForge from boot:** removed per the explicit comment at
[boot/mod.rs:390-393](../../systems/devpulse-engine/src/platform/boot/mod.rs#L390-L393). Customer-facing UI
removal is separate work (see §10).

**Event emission:** every stage calls `on_event(InitEvent::...)`. The
Tauri side bridges to `platform:subsystem-status` window events.
That feeds `platformState` rune in the frontend, which drives
`BootOverlay.svelte`.

---

## 3. UI boot → wizard handoff (where the gap is)

**Source of truth read:**
[interfaces/desktop/src/routes/+layout.svelte:1-193](../../interfaces/desktop/src/routes/+layout.svelte#L1-L193) (entire),
[interfaces/desktop/src/lib/layouts/app/BootOverlay.svelte:1-323](../../interfaces/desktop/src/lib/layouts/app/BootOverlay.svelte#L1-L323) (entire),
[interfaces/desktop/src/lib/layouts/app/Frame.svelte:1-147](../../interfaces/desktop/src/lib/layouts/app/Frame.svelte#L1-L147) (entire),
[interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/wizard.state.svelte.ts:1-129](../../interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/wizard.state.svelte.ts#L1-L129) (entire).

**The chain that runs today:**

1. App launches → Main window only (per tauri.conf.json:13-26).
2. `routes/+layout.svelte:22-137` onMount: installs global handlers,
   calls `platformState.init()`, `authState.init()`, etc.
3. `BootOverlay.svelte:39-148` listens for `platform:boot-failed`
   and `platformState.isReady`.
4. Fade $effect at `BootOverlay.svelte:135-148`: when
   `bootComplete && platformState.modelsStatusReceived`, fade after
   600ms, unmount.
5. `+layout.svelte:172-174` renders children when
   `authState.phase !== "pending"` → root route `/devpulse`
   redirects per `routes/+page.ts:13`.
6. `Frame.svelte:140` mounts `<SetupWizardOverlay />` — but the
   overlay's `wizardState.isOpen` defaults to `false`
   (wizard.state.svelte.ts:62). **NOTHING auto-opens it.**
7. `wizardState.refreshFirstRun()` exists (wizard.state.svelte.ts:103-111)
   but no caller invokes it after boot.

**THE GAP, plainly:** the kernel knows whether this is a first run
(`is_first_run` Tauri command exists). The UI never asks. Wizard
stays closed; customer with no profile sees an empty dashboard with
console errors.

**The errors you pasted earlier trace to:**

- `[downloader] getWizardCopy failed: Platform is still booting` —
  `<ModelDownloaderOverlay />` is mounted globally at
  `+layout.svelte:162`. Its `onMount` fires `getWizardCopy()` before
  Platform boots. The Tauri command at
  `commands/models/mod.rs:1655-1666` gates on `platform.load_full()`
  even though `WizardCopy::load(userdata_dir)` only reads embedded
  TOML + a userdata override file — the gate is structurally wrong.
- `Failed to query daily_stats: Failed to prepare analytics query`
  — dashboard at `/devpulse` fires the query before boot Stage 6c
  has finished, OR the user-analytics DuckDB schema hasn't been
  applied yet. The schema is correct (analytics.rs:439-452 — every
  column the query references exists). The remaining options are
  connection lifecycle and prepare-before-schema-applied.
- `[updates] check failed: ... Could not fetch a valid release JSON`
  — auto-updater hits
  `https://github.com/EonsofStupid/platform_devpulse/releases/latest/download/latest.json`
  (tauri.conf.json:37) — no release exists yet, 404.
- `[devforge.svc] openDevforgeWindow() FAILED: ... reh.tree: no REH
  tree found` — `devforge.svc.ts` is wired (read in full), being
  called 4× from some surface (DevForge devtool tile +
  `ProjectSwitcher.svelte` per Glob hits). The platform pull is
  done; the UI pull is not.

---

## 4. Slot save → symlink chain (the locked-broken chain)

**Source of truth read:**
[kernel/model-loader/src/slots/symlink.rs:1-305](../../kernel/model-loader/src/slots/symlink.rs#L1-L305) (entire),
[kernel/model-loader/src/slots/defaults.rs:1-503](../../kernel/model-loader/src/slots/defaults.rs#L1-L503) (entire),
[kernel/model-loader/src/slots/registry.rs:1-230](../../kernel/model-loader/src/slots/registry.rs#L1-L230) (entire),
[kernel/model-loader/src/slots/mod.rs:1-15](../../kernel/model-loader/src/slots/mod.rs#L1-L15).

**What is authored and tested:**

- `slot_dir(userdata_dir, slot_id)` → `{userdata}/slots/{slot_id}/`
  (symlink.rs:33-35).
- `symlink_path(userdata_dir, slot_id, format)` →
  `{userdata}/slots/{slot_id}/model.<ext>` (symlink.rs:41-47).
- `assign(userdata_dir, slot_id, format, target)` (symlink.rs:84-105) —
  creates slot dir, removes any stale link, calls platform-specific
  `create_symlink`. Windows path detects `ERROR_PRIVILEGE_NOT_HELD`
  (1314) and emits a Developer-Mode hint
  (symlink.rs:212-232).
- `unassign(userdata_dir, slot_id)` (symlink.rs:117-154) — sweeps
  `model.*` entries + removes empty slot dir.
- `resolve(userdata_dir, slot_id)` (symlink.rs:165-176) — finds
  existing symlink.
- Tests pass when Developer Mode is on (symlink.rs:277-303).

**Baseline slot IDs (slots/defaults.rs:49-67):**
```
chat.brain, minion.shared, minion.escalation, vision.embedder,
voice.tts, voice.stt, voice.brain, voice.wake,
rag.embedder, rag.reranker, chat.suggest
```
All loaded from `kernel/model-loader/config/slots.default.toml`
(slots/defaults.rs:36).
Default loading strategy is `OnDemand` (slots/defaults.rs:132-137) —
**by owner directive, no auto-load.** Wake-word slot defaults to
`OnDemand` + no default model (defaults.rs:349-361).

**The chain end-to-end (each step's owner):**

| Step | Owner | Status |
|---|---|---|
| 1. Customer clicks Save in wizard | `feature/views/CortexView.svelte` | `[UNREAD]` |
| 2. Frontend invokes Tauri | `installToSlot(repoId, file, slotId, scope?)` binding | exists per `downloader.state.svelte.ts:312` |
| 3. Tauri command receives | `commands::models::install_to_slot` | `[UNREAD]` location in `commands/models/mod.rs` |
| 4. Engine emits install events | `LoaderEvent::Install*` | exists per kernel grep |
| 5. HF download (if needed) | `kernel/model-loader/src/models/download.rs` | `[UNREAD]` |
| 6. Registry entry resolved | `kernel/model-loader/src/models/registry.rs` | `[UNREAD]` |
| 7. Symlink created | `slots::symlink::assign` | ✓ symlink.rs read in full |
| 8. Engine loads model into slot's backend | router → backend (see §5) | partially read |
| 9. Slot status emits `ready` | per slot rune | `[UNREAD]` location |
| 10. UI reflects "model loaded" | dashboard + slot card | `[UNREAD]` |

**Memory lock `project_apply_save_chain_broken`** says steps 1-7 work
in isolation; the runtime chain from picker → symlink → encoder
load has never been verified end-to-end. To verify with Harrier
0.6B I need to: read `install_to_slot` command, then trace the
engine call into the slot loader, then trace the slot loader to
the Burn adapter for an embedder slot.

---

## 5. Engine routing: GGUF → llama.cpp, embedding → Burn

**Source of truth read:**
[kernel/model-loader/src/backends/router.rs:1-179](../../kernel/model-loader/src/backends/router.rs#L1-L179) (entire),
[kernel/model-loader/src/backends/bridge.rs:1-530](../../kernel/model-loader/src/backends/bridge.rs#L1-L530) (entire),
[kernel/model-loader/src/backends/burn_adapter.rs:1-149](../../kernel/model-loader/src/backends/burn_adapter.rs#L1-L149) (entire),
[kernel/model-loader/src/backends/llamacpp/mod.rs:1-26](../../kernel/model-loader/src/backends/llamacpp/mod.rs#L1-L26).

**Routing rules (router.rs:29-63):**

| Format | Capability | → Backend |
|---|---|---|
| GGUF | any (incl. embedding) | `llama-cpp-2` via FFI bridge |
| SafeTensors | Embedding / Reranking / VisionEmbedding | **Burn** (the locked encoder path) |
| SafeTensors | TextGeneration etc | Candle |
| ONNX, SherpaDir | — | ort |
| (override allowed via `BackendType` arg) | | |

**llama.cpp supported architectures** (router.rs:72-95):
llama, mistral, mixtral, qwen2, qwen3, phi2, phi3, phi4, gemma,
gemma2, gemma3, stablelm, starcoder, starcoder2, deepseek,
deepseek2, command-r, dbrx, olmo. Niche archs fall back to Candle.

**Inference bridge** (bridge.rs:245-332): dedicated OS thread per
backend. `InferenceBridge::spawn_candle(device)` and
`spawn_llamacpp()` each spawn a thread named `inference-worker` /
`inference-worker-llamacpp`. Both panic-catch the worker loop and
log on death (bridge.rs:268-282, 304-318).

**Bridge protocol:** flume-traced `InferenceRequest::{ Load, Unload,
Forward, Tokenize, Detokenize, Generate, MemoryUsage, Shutdown }`
(bridge.rs:20-78), per-message OTel context propagation
(bridge.rs:356-358), streaming tokens via
`InferenceResponse::{ Token, Done, Error }` (bridge.rs:81-94).
`Generate` carries `trace_id` for cross-thread span correlation
(bridge.rs:67-70).

**Burn adapter** (burn_adapter.rs:78-143): the model-loader-facing
trait that bridges into the clyffy Burn encoder.
- `load_blocking(path) -> MemoryFootprint`
- `unload_blocking() -> ()`
- `is_loaded() -> bool`
- `embed_texts_blocking(texts: &[&str]) -> Vec<Vec<f32>>`
- `swap_blocking(weights_path) -> SwapStats { dim, elapsed_ms,
  phases_observed }` — drives RRD daemon through one full
  pause→drain→load→validate→swap→resume cycle.

Implementor lives at
`kernel/devpulse-clyffy/src/cortex/persistence/burn/adapter.rs`
`[UNREAD]`. The trait is type-erased (Arc<dyn ...>) so the
model-loader doesn't depend on Burn directly.

**Engine ↔ model assignment per memory lock
`project_engine_per_model_assignment`:**
- **Burn owns Harrier 0.6B** (the encoder, the locked Sync-clean
  authoring).
- **llama.cpp owns Nemotron 7.6B** (and other LLM GGUF).
- **Candle owns SigLIP HD** (vision embedder via safetensors,
  routed because vision falls under VisionEmbedding capability — wait,
  router.rs:50-56 routes VisionEmbedding to **Burn**, not Candle.
  This is a router-vs-memory contradiction that needs reconciling.
  The router code is newer than the memory lock; the memory may be
  stale).

---

## 6. RRD daemon (the hot-update orchestrator)

**Source of truth read:**
[kernel/rrd/src/lib.rs:1-60](../../kernel/rrd/src/lib.rs#L1-L60),
[kernel/rrd/src/daemon.rs:1-347](../../kernel/rrd/src/daemon.rs#L1-L347) (entire),
[kernel/rrd/src/lifecycle.rs:1-77](../../kernel/rrd/src/lifecycle.rs#L1-L77) (entire),
[kernel/rrd/src/state.rs:1-197](../../kernel/rrd/src/state.rs#L1-L197) (entire),
[kernel/rrd/src/traits.rs:1-118](../../kernel/rrd/src/traits.rs#L1-L118) (entire).
Spec at `scripts/docs/specs/cortex/rro/HOT_UPDATE_PATTERN.md` `[UNREAD]`
and `scripts/docs/specs/cortex/rro/RRD.md` `[UNREAD]`.

**State machine (state.rs:36-50):**
`Loading → Running → Paused → Updating → Failed`, with explicit
legal transition matrix (state.rs:78-89). Every illegal transition
yields `RRDError::StateTransitionInvalid`.

**Traits (traits.rs:40-118):**
- `HotUpdateable` (kernel-side trait, implementor owns Source +
  Snapshot + LoadError, methods `load / validate / into_live`).
- `HotSwap<C>` (orchestrator trait, methods `pause / swap /
  resume`, type-state encoded via `PauseHandle`).

**Daemon (daemon.rs:77-92):**
- `live: Arc<ArcSwap<C>>` — atomic pointer (H1).
- `state_tx: watch::Sender<RRDState>` — single-producer broadcast
  (H3).
- `cycle: Mutex<CycleState>` — per-cycle drain
  (CancellationToken + TaskTracker).
- `drain_timeout: Duration` — default 30s (daemon.rs:42).

**Pause/drain/swap/resume (daemon.rs:180-346):**
- `pause()` rejects concurrent pause (daemon.rs:187-189), cancels
  pending tasks, drains via `tracker.wait()` with timeout, emits
  `pause_requested / drain_begin / drain_complete | drain_timeout`.
- `swap()` validates BEFORE atomic swap; ArcSwap commit + drop-off-
  hot-path (daemon.rs:298-305).
- `resume()` refreshes the cycle state with fresh tracker + cancel
  token (daemon.rs:336-339).

**Lifecycle events (lifecycle.rs:28-51):** every event on tracing
target `rrd.lifecycle` with one of 11 phase constants. Engine
translator `RrdLifecycleTranslator` mirrors them to typed
`InternalEvent::RrdPhaseTransition` per H12 dual-observability —
translator file at
`systems/devpulse-engine/src/platform/services/rrd_translator.rs`
`[UNREAD]`.

**Verdict:** RRD daemon is **fully authored, fully tested,
correct against the spec.** What's missing is the customer-facing
"this is what's happening right now" UI surface in the devtool —
the registry has the `rrd` devtool at
`/devtools/clyffy/reasoning/rrd` but I haven't read the
`ReasoningTopology.svelte` to confirm what it shows.

---

## 7. RRO substrate (Qdrant + embedder + encoder)

**Source of truth read:**
[kernel/devpulse-clyffy/src/cortex/rro/mod.rs:1-39](../../kernel/devpulse-clyffy/src/cortex/rro/mod.rs#L1-L39) (entire — just a barrel).

Spec at `scripts/docs/specs/cortex/rro/RRO.md` `[UNREAD]`.

The barrel re-exports from three other modules:
- `crate::cortex::reasoning::{ RroDepth, RroState, RroStateHandle,
  RroStateSnapshot, RroStateTransition, DEFAULT_PROXIMITY }` `[UNREAD]`
- `crate::cortex::persistence::RroAdapter` feature `rro` `[UNREAD]`
- `crate::cortex::persistence::embedder` feature `candle` `[UNREAD]`
- `crate::cortex::persistence::encoder` feature `model-loader` `[UNREAD]`

The RRO state machine, embedder concrete impl, encoder concrete
impl, and Qdrant adapter all live in unread paths. I will read
them as part of the execution pass — none of these are blocking
for the wizard-load fix.

---

## 8. Intelligence layer (the chat → memory pipeline)

**Source of truth read:**
[kernel/devpulse-clyffy/src/cortex/intelligence/mod.rs:1-43](../../kernel/devpulse-clyffy/src/cortex/intelligence/mod.rs#L1-L43) (entire),
[kernel/devpulse-clyffy/src/cortex/intelligence/pipeline.rs:1-319](../../kernel/devpulse-clyffy/src/cortex/intelligence/pipeline.rs#L1-L319) (entire),
[kernel/devpulse-clyffy/src/cortex/intelligence/store.rs:1-118](../../kernel/devpulse-clyffy/src/cortex/intelligence/store.rs#L1-L118) (entire),
[kernel/devpulse-clyffy/src/cortex/intelligence/schema.rs:1-40](../../kernel/devpulse-clyffy/src/cortex/intelligence/schema.rs#L1-L40) (entire).
Spec at `docs/platform/INTELLIGENCE_LAYER.md` (770 lines) `[UNREAD]`.

**Pipeline (pipeline.rs:130-196):**
`process_chat_message(store, embedder, sink, project_slug, text, kind, priority) -> Result<String>`
walks **classify → embed → save_memory** in order, emitting
`PipelineSignal::ClassifyStarted / EmbedComplete / MemorySaved`
between hops. Fail-soft: enrichment, not blocking.

**Dim guard (pipeline.rs:153-158):** rejects embedders that produce
the wrong dimension with a loud anyhow error — prevents HNSW index
corruption.

**Store contract (store.rs:50-117):** five operations:
- `init_project(slug)` — apply `MEMORY_SCHEMA` to project namespace.
- `save_memory(slug, record) -> id` — connectors MAY dedupe by
  cosine > 0.92.
- `recall_by_embedding(slug, query, top_k, kind?)` — HNSW NN
  query, returns RecallHits with cosine score.
- `relate(slug, from_id, to_id, edge)` — typed edge between
  memories.
- `write_archive` / `read_archive_bytes` — rkyv-archived
  `RroRecord` blobs.

**Schema (schema.rs:24-39):** `memories` table with HNSW index on
embedding column (dim = 384, `MiniLM-L6-v2`), `rro_archive`
sidecar table.

**The gap (per memory `project_staged_indexing_missing`):**
- `process_chat_message` writes ONE message at a time. ✓
- The orchestrator that walks **`add project → discover files →
  classify → embed → store → verify`** for an entire project tree
  is missing. This is the 3-month gap.
- Suggested location: `kernel/devpulse-clyffy/src/cortex/indexing/`
  (does not exist today — Glob returns no match per session search).
- The pieces it would compose: filesystem walker, file classifier
  (Burn minion per `project_intelligence_model_layering` lock),
  the `TextEmbedder` trait (already abstract), `IntelligenceStore`
  trait, and `MemoryRecord` shape (all authored).

---

## 9. Wizard surface (what already exists, where the gap is)

**Source of truth read:**
[interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/wizard.state.svelte.ts:1-129](../../interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/wizard.state.svelte.ts#L1-L129) (entire),
[interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte:1-100](../../interfaces/desktop/src/lib/domains/app/models/feature/setup-wizard/SetupWizardOverlay.svelte#L1-L100) (partial — line 100+ `[UNREAD]`),
[kernel/model-loader/src/wizard/copy.rs:1-947](../../kernel/model-loader/src/wizard/copy.rs#L1-L947) (entire).

**View order** (wizard.state.svelte.ts:50-58):
`welcome → hardware → preset → cortex → installing → clyffy-collab → complete`.
`slot-save` is in the type union for back-compat but not reachable
via next() — superseded by `cortex` (the anatomy-tile constellation).

**Tauri commands the wizard fires:**
- `getWizardCopy` (commands/models/mod.rs:1655) — broken gate, see §3.
- `getTierDisplay` (commands/models/mod.rs:1674) — gates on platform
  via `get_loader(&state)`.
- `autoConfigure` — recommendation engine call.
- `installToSlot(repoId, file, slotId, scope?)` — chain start.
- `isFirstRun()` / `markSetupComplete()` — first-run flag flips.

**Layer-by-layer view files** (`feature/views/*.svelte`):
- WelcomeView.svelte `[UNREAD]`
- HardwareView.svelte `[UNREAD]`
- PresetView.svelte `[UNREAD]`
- CortexView.svelte `[UNREAD]` — owns the Save button per Save chain
- InstallingView.svelte `[UNREAD]`
- ClyffyCollabView.svelte `[UNREAD]`
- CompleteView.svelte `[UNREAD]`

**Wizard copy SSOT** (wizard/copy.rs:1-947): full TOML→struct
mapping, every visible string lives in
`systems/devpulse-engine/config/wizard_copy.default.toml`. Layman
rule per `coldlight-curator` Rule 6.

---

## 10. DevForge customer-pull (everywhere it surfaces today)

**Source of truth read:**
[interfaces/desktop/src/lib/domains/app/devforge/data-access/devforge.svc.ts:1-66](../../interfaces/desktop/src/lib/domains/app/devforge/data-access/devforge.svc.ts#L1-L66) (entire),
plus Glob hits across `interfaces/desktop/src/lib/devtools/registry.ts:194-202`,
`interfaces/desktop/src/lib/domains/app/projects/feature/ProjectSwitcher.svelte`,
`interfaces/desktop/src-tauri/src/commands/devforge/{mod.rs, window.rs, types.rs}`
`[UNREAD detail]`.

**Six TS service functions** (devforge.svc.ts):
- `getDevforgeStatus()` line 10
- `openDevforgeWindow()` line 20
- `closeDevforgeWindow()` line 30
- `listRecentProjects()` line 39
- `addProject(path)` line 49
- `removeProject(path)` line 58

**Auto-fire callsite** producing the 4× console errors:
some component (likely the DevForge devtool tile or the
ProjectSwitcher) mounts and calls openDevforgeWindow on mount.
`[UNREAD detail]` until I open the consumer files.

**Pull plan:**
1. Remove the `devforge` tile from devtool registry
   (`interfaces/desktop/src/lib/devtools/registry.ts:194-202`).
2. Remove the `/devtools/system/ide/devforge/+page.svelte` route
   folder.
3. Remove any sidebar entry referencing DevForge.
4. Delete `interfaces/desktop/src/lib/domains/app/devforge/` (4
   subdirs).
5. Remove `commands::devforge` registration in
   `interfaces/desktop/src-tauri/src/lib.rs`.
6. **Keep the Rust crate `kernel/devforge` or its services code on
   disk** — pull is from customer surfaces, not from the Rust
   crate as a future-slice resource.

---

## 11. Error → fix mapping (your console)

| Error | Source line | Cause | Fix |
|---|---|---|---|
| `[downloader] getWizardCopy failed: Platform is still booting` | `commands/models/mod.rs:1655-1666` | Platform gate is wrong — wizard copy is embedded TOML | Drop the `state.platform.load_full().ok_or_else(...)?` gate. Read `data_dir` via `paths::resolve_data_dir(&app)` directly. No fallback, no `Option` — `paths::resolve_data_dir` already always returns a valid dir. |
| `Failed to query daily_stats: Failed to prepare analytics query` | `commands/devpulse/mod.rs:211-249` | UI fires query before User DuckDB analytics is up | The Tauri command should gate on `platform.user_analytics().is_some()` AND let the dashboard rune check `platformState.isReady` before firing. Currently the command handles `None` (returns empty vec) but the prepare-fail path bubbles. Real fix: investigate WHY prepare fails despite schema (probably the connection lifecycle hasn't completed Stage 6c on first launch — Stage 6c runs AFTER `platform:ready` is emitted because the validate_critical block runs LAST). Verify by adding a tracing::span around Stage 6c → check whether prepare-fail timing aligns. |
| `[updates] check failed` | `tauri.conf.json:37` + auto-updater plugin | Pointing at a release that doesn't exist | Either (a) ship a stub `latest.json` so the GET succeeds with "no update", or (b) gate the auto-check on a release-channel toggle that defaults to off in dev. Currently `updatesState.bootstrap()` fires from `+layout.svelte:86`. |
| `[knowledge] sync_knowledge_from_remote → failed` | unknown — `[UNREAD]` | Knowledge sync remote endpoint missing | Find the caller. Likely needs the same dev-mode gate as the auto-updater. |
| `[devforge.svc] openDevforgeWindow() FAILED` ×4 | `devforge.svc.ts:20` | Auto-fired on mount of some surface | DevForge pull (§10) removes the surface; problem dissolves. |

---

## 12. The eight-step execution checklist

Doing in order, stopping for verification between each:

```
STEP 1  Chat window auto-open
        Edit: routes/+layout.svelte onMount
        After platformState.isReady transitions true, call
        commands.openWindow({ role: "Chat" }).
        Guard with `chatOpened` boolean to prevent re-fire.

STEP 2  Wizard auto-open on first run
        Edit: lib/layouts/app/BootOverlay.svelte fade $effect
        After fade timeout starts, await wizardState.refreshFirstRun().
        If wizardState.firstRun === true, wizardState.open() before
        unmount.

STEP 3  Decouple get_wizard_copy from Platform boot gate
        Edit: interfaces/desktop/src-tauri/src/commands/models/mod.rs
        Lines 1655-1666. Replace state.platform.load_full() with
        paths::resolve_data_dir(&app). No fallback — paths always
        returns a valid dir.

STEP 4  Pull DevForge from customer-facing surfaces
        Edit: registry.ts (remove tile), routes (remove +page),
        Sidebar.svelte (if applicable), lib/domains/app/devforge/*
        (delete), src-tauri/src/lib.rs (remove command registration).
        Rust crate stays on disk for future slice.

STEP 5  Auto-updater + knowledge-sync dev noise
        Gate updatesState.bootstrap() on a release-channel toggle.
        Default to "off" in dev. Same shape for knowledge-sync.

STEP 6  Verify slot save → symlink chain end-to-end with Harrier 0.6B
        Read: install_to_slot command path (commands/models/mod.rs
        section UNREAD), download.rs, registry.rs, then symlink::assign,
        then the slot loader's call into BurnEncoderAdapter::load_blocking.
        Walk one full Harrier 0.6B Apply in a running app. Don't claim
        chain works without confirming step 10 (slot status emits ready,
        UI reflects).

STEP 7  Author staged indexing orchestrator
        New: kernel/devpulse-clyffy/src/cortex/indexing/mod.rs +
        state.rs + walker.rs + classifier.rs + embedder_driver.rs +
        store_driver.rs + verifier.rs.
        State machine: Discover → Classify → Embed → Store → Verify.
        Wires Burn embedder (via BurnEncoderAdapter) + local Qdrant
        (via RroAdapter) + libSQL (project memory) + SurrealDB graph.
        Drives off TextEmbedder + IntelligenceStore traits already
        authored in cortex/intelligence/.

STEP 8  Verify
        cargo check -p devpulse-clyffy -p devpulse_engine
        -p devpulse_desktop_backend.
        pnpm check.
        Manual: launch .exe with cleared .userdata, watch BootOverlay,
        confirm Chat window opens behind, Wizard overlays Main, console
        is clean of the 4 specific errors above.
```

---

## 13. Honest gaps in this plan (files I have not yet read)

I will read each of these before claiming work that depends on them.

**Rust kernel:**
- `kernel/model-loader/src/backends/llamacpp/backend.rs` — actual
  llama-cpp-2 FFI calls.
- `kernel/model-loader/src/backends/candle/backend.rs` — Candle
  fallback.
- `kernel/model-loader/src/models/{download.rs, registry.rs,
  recommender.rs, search.rs, secrets.rs, manifest.rs}` — install
  pipeline.
- `kernel/model-loader/src/wizard/{mod.rs, analytics.rs,
  tier_display.rs, tooltips.rs}` — wizard kernel side.
- `kernel/rrd/src/{handle.rs, error.rs}` — PauseHandle + RRDError
  details.
- `kernel/devpulse-clyffy/src/cortex/reasoning/state.rs` — RRO state
  machine.
- `kernel/devpulse-clyffy/src/cortex/persistence/{rro/, embedder/,
  encoder/, burn/adapter.rs}` — concrete impls.
- `kernel/devpulse-clyffy/src/cortex/intelligence/{record.rs,
  slug.rs}` — record shape + slug derivation.

**Engine:**
- `systems/devpulse-engine/src/platform/services/{relational.rs,
  surreal.rs, vector.rs, cache.rs, model_loader.rs, status.rs,
  devforge.rs, rrd_translator.rs, manifest.rs}`.
- `systems/devpulse-engine/src/platform/boot/{relational.rs,
  analytics.rs, graph.rs, cache.rs, model_loader.rs, vector.rs,
  preflight.rs, retry.rs}`.

**Tauri commands:**
- `commands/models/mod.rs` lines 1-1645 (read 1645-1680 only).
- `commands/devpulse/mod.rs` lines outside 180-250.
- `commands/devforge/{mod.rs, window.rs, types.rs}`.

**UI:**
- All 7 wizard view files under `feature/setup-wizard/feature/views/`.
- `domains/app/models/data-access/baseline.state.svelte.ts` (the
  auto-kick removed previous session).
- `lib/sys/runes/platformState.svelte.ts` (the typed boot rune).
- `domains/app/devforge/feature/*.svelte` — DevForge UI surfaces.
- `lib/layouts/app/Sidebar.svelte` — for DevForge entry detection.

**Specs:**
- `scripts/docs/specs/cortex/rro/{RRO.md, RRD.md,
  HOT_UPDATE_PATTERN.md}`.
- `docs/platform/INTELLIGENCE_LAYER.md` (770 lines).
