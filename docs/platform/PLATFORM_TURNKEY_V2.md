# Platform Turnkey — V2 (Single SSOT)

**Date:** 2026-05-26
**Authority:** This is the merged plan. It supersedes:

- `TURNKEY_WIZARD_PLAN.md` (2026-05-20) — retired in §11. Setup-wizard
  boundary is invalid; the surface lives in the Slot Orchestrator
  devtool now.
- `INTELLIGENCE_LAYER.md` Phases A–G (2026-05-15) — phases A/B/xtask
  build env are preserved; phases C–G fold into §6 with updated
  ownership.
- `SEAMLESS_GPU_FOUNDATION.md` (2026-05-12) — referenced from §5, no
  longer free-standing.
- `LLAMA_CPP_FFI_SPEC.md` (2026-05-09) — referenced from §5; FFI
  architecture stays canonical there.
- `HONEST_BASELINE_2026-05-20.md` — folded into §1 (verified status).

If anything in those docs contradicts this one, **this one wins**.
Reconcile the older artifact in the same PR that diverged. Keep the
plan thin enough that "single source of truth" is a fact, not a
slogan.

---

## 1. Status today — verified, no aspirations

The 4-DB boot works end-to-end. Last clean run on disk:
`.userdata/logs/boot.log` 2026-05-12 22:10:31 UTC — 17.7 s total to
`[READY]`, all critical services confirmed.

| Subsystem | Authored | Wired in boot | Observable in UI |
|---|---|---|---|
| LibSQL (system + user) | ✓ | ✓ | ✓ /devtools/system/datastores/libsql/ |
| DuckDB (system + user) | ✓ | ✓ | ✓ /devtools/system/datastores/duckdb/ |
| SurrealKV (embedded, 3 namespaces) | ✓ | ✓ | ✓ /devtools/system/datastores/surrealdb/ |
| Qdrant (embedded, RRO collection) | ✓ | ✓ (feature `rro`) | ✓ /devtools/system/datastores/qdrant/ |
| RRD daemon | ✓ (kernel/rrd/) | partial | partial |
| Burn encoder/embedder | ✓ (kernel/devpulse-clyffy/src/cortex/persistence/burn/) | ✗ feature `burn` not in desktop Cargo.toml | ✗ |
| Model loader (registry + slot symlinks) | ✓ | ✓ | ✓ but Apply→Load chain unverified end-to-end |
| Cortex anatomy constellation | ✓ (in slots devtool) | n/a (UI) | ✓ /devtools/runtimes/orchestrator/slots/ |
| Staged-indexing pipeline orchestrator | **✗** | **✗** | **✗** |
| Boot-blur UI gate over shell | **✗** | n/a (UI) | partial (BootOverlay exists, blur gate not wired) |
| Unified SignalKind/SignalType taxonomy | partial | partial | n/a |
| Chat-window auto-open post-boot | **✗** | **✗** | **✗** |

What is **not** in the shipped binary's runtime path today:

- Burn (engine feature flag missing — `interfaces/desktop/src-tauri/Cargo.toml:53`).
- Staged-indexing orchestrator (the pipeline that drives every other
  embedded service in concert — this is the foundation gap that has
  blocked end-to-end for three months).
- Chat window auto-spawn on `Platform::ready` (typed roles exist; nothing
  fires `open_window(Chat)`).

---

## 2. Locked architecture (non-negotiable)

These rules govern every phase below. Violating any is a structural
bug, not a stylistic preference. Most are cross-referenced from
`memory/` LOCKED entries.

1. ~~App is embedded; kv-surrealkv (no port)~~ — **superseded by the
   owner.** Surreal is upstream's built binary in a supervised subprocess,
   never compiled in (plan 0007 decision 6, 2026-10-24: "surreal is suppose
   to be a prebuilt binary subprocess that can easily be detached"; April:
   "surreal was never suppose to be just useless embedded i wanted the full
   version properly sidecar and managed by devpulse"). AI runtimes are
   subprocesses too (plan 0007). The database is Turso, not LibSQL
   (owner 2026-07-01).
2. ~~No Python. No Docker. No external services.~~ — **superseded by the
   owner.** Rust is the default and Python is allowed (CLAUDE.md
   "Language Choice", owner 2026-09-23). Docker / Podman is a guided product
   feature ("I want docker available for the app made easy for users …
   portable all within devpulse"). DevPulse has a required devpulse.app
   account, optional shippin.cloud or homelab sync, and the person's own
   subscriptions (plan 0001).
3. **No `unwrap()` in production Rust.** Use `?` or explicit handling.
4. ~~Kernel vocabulary stays in `kernel/`~~ — **superseded by the owner**
   (2026-10-19: "everything is public"): the term list maps layman ↔
   advanced labels, enforcement off; the prompt recipes stay the kernel's.
5. **Pre-release mode.** Reauthor aggressively. No shims. No
   backcompat.
6. **Verify after every edit.** Never claim "done" before `cargo
   check -p <crate>` or `pnpm check` passes.
7. **Four customer-facing slots — locked.** `clyffy` (Cascade 2 /
   Nano-9B) + `minion` (Harrier 0.6B) + `voice` (Sherpa Whisper+Kokoro)
   + `rag_embed` (Nemotron ColEmbed VL). Vision is brain-capability,
   not a slot.
8. ~~Routing by file format at load time (GGUF→llama.cpp;
   SafeTensors+embedding→Burn; ONNX/Sherpa→ort; others→Candle)~~ —
   **superseded by the owner**: every slot points at an endpoint, a runtime
   subprocess or a remote URL; no inference engine is compiled in (plan 0007
   decision 5, 2026-10-13).
9. **Setup-wizard boundary INVALID.** Slot Orchestrator devtool is
   SSOT. Devtools are the dev-diagnostic surface; the customer never
   reaches `/devtools/`.
10. **ColdLight tokens + WAI-ARIA APG + layman copy** preserved across
    every UI surface. ABSORB before DELETE.
11. **Service-supervisor lifecycle.** Every managed runtime
    (LibSQL / DuckDB / SurrealKV / Qdrant / Burn / RRD) emits BOTH
    `tracing::*` lifecycle events AND typed `InternalEvent` variants
    onto a shared taxonomy (`sidecar.lifecycle` target). Dual
    observability is required — tracing-only or events-only is
    incomplete work.
12. **No backcompat shims for in-flight artifacts.** Pre-release rule.

---

## 3. The gap that pays back three months

`grep` across the workspace for the orchestrator that sequences
`project_init → filewalk → classify → Burn embed → RRO upsert +
DuckDB row + Surreal node + LibSQL record → verify`:

```
indexing_pipeline | index_stage | staged_index | index_project
indexer_run | IndexingStage | index.*stage.*log
```

Returns **zero files** (re-verified 2026-05-26).

This is the foundation slice. Not specs, not wizard polish, not
component restoration. The four DBs boot. The Burn encoder is
authored. The RRO collection lifecycle is authored. The model-loader
slot symlink layer is authored + tested. Nothing drives them in
concert; the runtime chain has never been observed end-to-end.

Locking this in: the V2 plan exists primarily to fill this gap. Every
phase below either feeds into the staged-indexing pipeline or is
deferred behind it.

---

## 4. Today's slice — turnkey app actually boots, UI actually loads

Goal: `DevPulse.exe` double-click → boot-blur covers the shell → all
six managed runtimes start in order, each emitting typed lifecycle
events → ready signal lifts the blur → chat window auto-opens → user
sees a real, functional shell with animated media + fluid clamp
layout.

Sequenced steps. Each is its own commit/PR. Each has an exit
criterion that fits on one line.

### 4.1 Flip the Burn feature on

- **File:** `interfaces/desktop/src-tauri/Cargo.toml:53`
- **Change:** add `"burn"` to the engine feature list alongside `"rro"`,
  `"candle"`, `"inference"`.
- **Exit:** `cargo check -p devpulse_desktop_backend` clean; the
  `#[cfg(feature = "burn")]` adapter constructor at
  `boot/model_loader.rs:182-217` returns `Some` at boot.

### 4.2 Author the staged-indexing pipeline orchestrator

- **New module:** `kernel/devpulse-clyffy/src/cortex/indexing/`
  - `pipeline.rs` — drives the stages, emits typed events per stage.
  - `stages/discover.rs` — filewalk + filter.
  - `stages/classify.rs` — minion (Harrier 0.6B) categorization.
  - `stages/embed.rs` — Burn embedder over classified content.
  - `stages/store.rs` — fan-out: Qdrant upsert + DuckDB row + Surreal
    node + LibSQL record.
  - `stages/verify.rs` — read-back assertion per artifact.
- **Wired into:** `Platform::index_project(path)` engine method;
  exposed via Tauri command `intel_index_project(path, confirmation)`.
- **Per-stage telemetry:** every stage emits `tracing::event!(target =
  "indexing.pipeline", stage = ..., status = ..., ...)` AND a typed
  `InternalEvent::IndexingStage { stage, status, ... }` variant.
- **Exit:** end-to-end test passes — add a single file to a project,
  pipeline runs every stage, Qdrant has the vector + DuckDB has the
  row + Surreal has the node, all visible in the existing devtools.

### 4.3 Unified SignalKind / SignalType taxonomy

- **File:** new `systems/devpulse-engine/src/signals/mod.rs` (or extend
  `events/`).
- **Author:** typed enums for `SignalKind` (lifecycle / indexing /
  inference / pipeline / persistence / network / ui) and `SignalType`
  (info / warn / error / progress / ready). Every service
  supervisor emits via the shared taxonomy.
- **Cross-cut:** each existing service in
  `systems/devpulse-engine/src/platform/services/` (LibSQL, DuckDB,
  SurrealKV, Qdrant, RRD, Burn, Ollama, DevForge) gets a `lifecycle.rs`
  helper that maps state transitions to signals.
- **Exit:** every boot stage in `boot/mod.rs:115-561` produces both a
  tracing event and an `InternalEvent::ServiceLifecycle { signal_kind,
  signal_type, ... }` variant. Devtool log panels read the unified
  stream.

### 4.4 Service supervisor — owns 6 runtimes

- **File:** new `systems/devpulse-engine/src/platform/services/supervisor.rs`.
- **Author:** `ServiceSupervisor` struct that owns the lifecycle of
  LibSQL + DuckDB + SurrealKV + Qdrant + Burn + RRD as a single
  ordered chain. Replaces the current scattered service init calls
  with one orchestrator. Each service implements a shared
  `ManagedService` trait (`start`, `stop`, `health`, `hot_swap`).
- **Boot integration:** `Platform::boot` constructs the supervisor,
  runs the ordered start sequence, surfaces ready/failure through the
  unified signal stream.
- **Exit:** every service start/stop/restart goes through the
  supervisor; devtool can stop+restart any single service
  individually; tracing shows the supervisor's own lifecycle events.

### 4.5 Boot-blur UI gate over the shell

- **File:** `interfaces/desktop/src/routes/+layout.svelte` (subscribe
  to `platformState.isReady`), new
  `interfaces/desktop/src/lib/layouts/app/BootBlur.svelte` (gate).
- **ColdLight preset:** `boot-blur` preset extending `glass` with
  heavier blur + animated media slot. xy fluid clamp via the existing
  `fluidDimensionToClamp` SD5 transform.
- **Media:** animated MP4/WebP loop inside the gate. ffmpeg-based
  conversion pipeline at `scripts/media/convert.mjs` produces the
  optimised assets from source MP4 — committed assets only.
- **Behaviour:** mounted on first render; covers the entire shell
  with `position: fixed; inset: 0`. Stays up until
  `platformState.isReady === true`. Then fades out and triggers
  `open_window(WindowRole.Chat)` (one-shot guarded boolean).
- **Exit:** double-click `DevPulse.exe` → blur visible immediately →
  every service emits ready → blur fades, chat window auto-opens, no
  blank shell at any point.

### 4.6 Portable build flush + recreate semantics

- **File:** `xtask/src/commands/package_portable.rs` (existing).
- **Change:** before packaging, run a flush pass that deletes any
  prior `target/release/portable/` tree + Tauri-generated bundles,
  then recreates fresh. Already partially done in `clear_tree()` in
  fetch_devforge — extend the same pattern to portable packaging.
- **Exit:** `cargo xtask build-release --portable-only` always
  produces a known-clean folder; never inherits cruft from a prior
  run.

---

## 5. Existing-doc-references (do not re-state, just link)

- **GPU + LLM seed evaluation:** `SEAMLESS_GPU_FOUNDATION.md` —
  CUDA/Vulkan/ROCm auto-detect at build AND runtime; reserves GPU
  for the brain slot. Bench is Nemotron-Nano-9B-v2 vs Qwen3-0.6B × 4
  parallel-vote council. Foundation spec authoritative.
- **llama.cpp FFI:** `LLAMA_CPP_FFI_SPEC.md` — sub-repo prebuilt
  pipeline at `EonsofStupid/llama-cpp-prebuilt`, vendored
  `llama-cpp-rs` fast-path linking the static libs.
- **Cloud preflight:** `CLOUD_PREFLIGHT.md` — the SSOT for SurrealDB
  cloud + Qdrant cloud + Infisical credential paths.
  **Lowercase headers always.** Use `_surreal.js` lib from any hook.
- **Hot-update pattern:** `scripts/docs/specs/cortex/rro/HOT_UPDATE_PATTERN.md`
  — Drop-guard discipline for binary swap during runtime.

---

## 6. After-today phases (preserved from INTELLIGENCE_LAYER)

These are not abandoned. They depend on §4 landing first.

| Phase | Was | Status | Owner |
|---|---|---|---|
| C | Hooks ↔ MCP server bridge | QUEUED | post-§4.2 |
| D | 0.6B minion classifier (continuous pre-sort) | QUEUED | post-§4.2 (sits IN the pipeline) |
| E | Cloud-Surreal connector + devpulse-secrets crate | QUEUED | parallel to §4 (no shared file dependency) |
| F | Deep-reasoning recalls intelligence layer | PLANNED | post-§4 |
| G | AGENTS.md auto-regen for non-MCP clients | PLANNED | post-§4 |

Open questions still live in their phase blocks inside
`INTELLIGENCE_LAYER.md`. When a phase moves to DONE there, its row
here moves with it.

---

## 7. PR cadence + branch hygiene

Branches merge in this order. Don't open the next one until the
prior one lands green.

1. **rro PR #5** (dev → alpha) — v2 milestone (RRO schema + rkyv +
   llguidance + governance). CI fixes pushed 2026-05-26: memory/build.rs
   improved, git-cliff-action bumped to v4, clippy.toml disallowed-methods
   commented out (3000+ legacy unwraps incompatible with strict policy).
2. **rro pin bump** in `platform_devpulse/Cargo.toml` (alpha SHA).
3. **platform_devpulse PR #8** (cleanup) — post-API-alignment cleanup.
   Already has cargo `insteadOf` workflow step for private rro
   fetch — depends on operator `gh secret set RRO_DEPLOY_TOKEN
   --repo EonsofStupid/platform_devpulse`.
4. **platform_devpulse PR #9** (DevForge auto-track) — xtask now
   auto-pulls latest DevForge release; `--pin` opt-in for hermetic
   builds.
5. **platform_devpulse PR #7** (absorb setup-wizard into slots
   devtool) — rebase on new main, force-push, land.
6. **Stale-branch sweep** — delete
   `claude/vigilant-bardeen-d6515d`, `claude/eager-yalow-db8378`,
   `pr/llguidance-kernel-boundary`, `claude/bold-pare` (all net-DELETE
   vs main, fossils not work-in-flight).
7. **Stash apply** — both main stashes (stderr non-blocking writer +
   keyring crate Cargo.lock fix) land.
8. **§4.1 — §4.6** commits, one per slice, in order.

---

## 8. Verification gates per slice

Each §4 slice is "done" when ALL of the following pass:

- `cargo check -p <touched-crate>` clean, 0 warnings.
- `pnpm check` clean, 0 errors.
- Runtime smoke test described in that slice's `Exit` line passes
  in a running app — NOT just compile-green.
- Both tracing events AND `InternalEvent` variants emit per the
  taxonomy in §4.3 — 1:1 callsite parity (cross-check by grep).
- Devtool reflects the new state (the dev-diagnostic surface is the
  observability surface).

---

## 9. Non-goals for today

These are real, but they are not in §4 and do not block §4 landing:

- **Account establishment + offline-first flow.** Foundation slice
  must land before we wire customer onboarding.
- **Coral-surface turnkey download button.** Asset/UI work waits on
  the visual editor + ColdLight preset polish pass.
- **Cross-platform Linux/Mac.** Windows-first per
  `project_cross_platform_trajectory`; design seams exist, fill
  targets later.
- **MCP server productionisation.** Phase C from INTELLIGENCE_LAYER
  covers it; depends on §4.2.

---

## 10. How to keep this doc honest

1. Every move that touches §4 updates this doc in the same commit.
2. When a slice exits, its row in §1 flips and the slice block in
   §4 gets a "LANDED <date>" header at the top.
3. New plan docs do not get authored — they get folded into V2.
   "Single SSOT" is a fact, not a slogan.
4. When this doc and a referenced doc disagree, fix the referenced
   doc to match in the same PR that diverged.

---

## 11. Retired plans

- **TURNKEY_WIZARD_PLAN.md** (2026-05-20). 602 lines, citation-rich,
  but framed around the setup-wizard boundary which is now locked
  INVALID. Capabilities absorbed into Slot Orchestrator devtool per
  PR #7. Keep the doc on disk for archeology; treat it as superseded.
- **HONEST_BASELINE_2026-05-20.md** — folded into §1.
- Stale memory entries referencing the wizard boundary or the 13-slot
  taxonomy or Phi-15B / SigLIP HD / Nvidia 7B as anchors are already
  patched in the memory store (see `memory/MEMORY.md` LOCKED 2026-05-22
  block).
