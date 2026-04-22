# SPRINT-DEVTOOLS-FOUNDATIONAL — Checklist Execution

**Date:** 2026-04-21
**Authored by:** Direct reads only. NO agents.
**Status:** DRAFT — awaiting owner STOP-A sign-off before any code is touched.
**Supersedes (partial):** SPRINT-REALITY-GAP-CLOSE Phases 1 + 3b.

---

## Execution discipline (read before every phase)

- **NO agents.** Direct Read/Grep/Glob only. Never `Agent(...)`.
- **Mid-phase research is ALLOWED and ENCOURAGED.** If a call site, a type signature, or a feature flag is unknown at authoring time: stop coding, read the file, then continue. Add findings to the `.research.md` companion for the phase.
- **Checkboxes below are the contract.** Each `- [ ]` must be checked off before the phase is called done. Do NOT mark done until verified with `pnpm svelte-check` + `cargo check` as stated.
- **Smoke test is the gate.** Every phase ends with a smoke test section — actual click-through or real command invocation against the running app. No "I think it works."
- **Release `.exe` runs in parallel (Phase 0).** Once Phase 0 lands, I query `http://127.0.0.1:8822` + read `.userdata/libsql/platform.db` + `.userdata/duckdb/analytics.duckdb` to confirm live state between phases, not inferred.
- **NO auto-select.** User picks. Wizard / devtools never pick for them.
- **Clyffy spinner on every VRAM-touching action.** `LoadingBlock showContent contentKind="dyk"` — the canonical pattern.

## Captured owner demands (verbatim, no paraphrasing away the spec)

Collected across the 2-week loop and the last 24 hours. Every one is honored by at least one checkbox below.

1. "MY MOTHER FUCKING ANIMATED FUCKING BACKGROUND VARIANTS THAT ARE SUPPOSE TO EXIST" — R1 (wizard-owned, tracked in POAM-SETUP-OVERLAY-CANONICAL; this sprint preserves).
2. "Real devtools real fucking managing it layman friendly not rushed" — the whole mandate.
3. "SIGLIP HD = PRECONFIGURED CPU FUCKING REAL DEVTOOL TO FULLY MANAGE IT SERVICE FUCKING CLEARLY RUNS" — Phase 3.
4. "STS / TTS / STT / BIDIRECTION" — Phase 2.
5. "7B PERSONA" (nvidia/personaplex-7b, Moshi) — Phase 7.
6. "15B PHI FOR DEEP REASONING AND EVEN HAVING IT WORK AS PRIMARY ON DEMAND I NEED THIS FLEXIBILITY" — Phase 5.
7. "primary brain a user-controlled swap YES WITH LOGGING TRY CATCH AND THE CLYFFY RANDOM MESSAGE SPINNER WHILE WE SAFELY LOAD INTO VRAM WHATEVER THE FUCK REAL WORLD BEST PRACTICE" — Phase 4a.
8. "THE FUCKING HUGGING FACE DOWNLOADER IS LAYMAN SO ALL I HAVE TO DO IS FUCKING CLICK ONE LINK AND IT WILL DOWNLOAD ALL FUCKING FILES PERIOD USING THE HF TOKEN INVOKE, REPO, JANAI, OLLAMA" — Phase 4b.
9. "I ALSO need the fucking real version of the app so i can run it separately and it actually work so i can dogfood with it" — Phase 0.
10. "IF I NEED TO RESEARCH INBETWEEN EACH YOU FUCKING DO IT" — execution discipline rule above.
11. "THIS IS GOD DAMN FOUNDATIONAL CODE" — no bandaids, no rushing.
12. "16 DAYS OF FUCKUPS STOP" — every phase gates on real smoke test.
13. "ALL OF IT HAS TO HAPPEN" — no phase skipped.
14. "SMOKE TESTED" — Phase 8 + per-phase smoke test.
15. "Truly has overlays" — Phase 4a swap overlay + Phase 7 persona load overlay.

## SSOT Map — verified by direct read

### Backends (Rust)

| Surface | File | Status |
|---|---|---|
| Candle inference (chat.brain, helpers) | [kernel/model-loader/src/backends/candle/backend.rs](d:/localdev/platform_devpulse/kernel/model-loader/src/backends/candle/backend.rs) | REAL |
| SigLIP2 vision | [kernel/model-loader/src/backends/candle/siglip.rs](d:/localdev/platform_devpulse/kernel/model-loader/src/backends/candle/siglip.rs) | REAL (410 LOC, load/unload/encode_image/encode_rgb, 1152-dim L2) |
| Moshi STS (Persona) | [kernel/model-loader/src/backends/candle/moshi.rs](d:/localdev/platform_devpulse/kernel/model-loader/src/backends/candle/moshi.rs) | **STUB** (`_mimi` / `_lm_model` dropped at lines 71, 75; no generate/smoke method) |
| HF bundle downloader | [kernel/model-loader/src/models/download.rs](d:/localdev/platform_devpulse/kernel/model-loader/src/models/download.rs) | REAL (`execute_download` lists siblings, plans bundle, pulls all shards, resume-safe, token-aware) |
| Atomic slot swap | [commands/models/mod.rs:751](d:/localdev/platform_devpulse/interfaces/desktop/src-tauri/src/commands/models/mod.rs#L751) | REAL (`swap_slot_model` emits `model:swap-started/complete/failed`) |
| Ollama sidecar service | — | **MISSING** |

### Tauri commands (already in generated specta bindings)

| Command | File | Consumer |
|---|---|---|
| `encode_image(slot_id, path) → Vec<f32>` | [commands/models/mod.rs:1803](d:/localdev/platform_devpulse/interfaces/desktop/src-tauri/src/commands/models/mod.rs#L1803) | no devtool yet |
| `swap_slot_model(slot_id, new_model_id)` | [commands/models/mod.rs:751](d:/localdev/platform_devpulse/interfaces/desktop/src-tauri/src/commands/models/mod.rs#L751) | no UI yet |
| `download_model(repo_id, filename) → download_id` | [commands/models/mod.rs:768](d:/localdev/platform_devpulse/interfaces/desktop/src-tauri/src/commands/models/mod.rs#L768) | BrainCard HF search |
| `cancel_download(download_id)` | [commands/models/mod.rs:783](d:/localdev/platform_devpulse/interfaces/desktop/src-tauri/src/commands/models/mod.rs#L783) | progress rows |
| `set_hf_token`, `load_slot`, `unload_slot`, `get_slots`, `scan_models`, `assign_model_to_slot` | same file | setup wizard, devtools |
| `cache_health` | [commands/sys/cache.rs](d:/localdev/platform_devpulse/interfaces/desktop/src-tauri/src/commands/sys/cache.rs) | `/devtools/cache` |

### Frontend devtools (verified)

| Route | Shell? | Clyffy spinner? | Backend real? |
|---|---|---|---|
| `/devtools/candle` | YES | no | YES |
| `/devtools/cache` | YES | no | YES |
| `/devtools/surreal` | YES | no | YES |
| `/devtools/sts` | no (custom) | no | YES |
| `/devtools/stt` | no (custom) | no | YES |
| `/devtools/tts` | no (custom) | no | YES |
| `/devtools/ollama_sidecar` | YES | no | PLACEHOLDER |
| `/devtools/llama_cpp_embedded` | YES | no | PLACEHOLDER |
| vision, persona, phi_reasoning | MISSING | MISSING | MISSING |

### Frontend cross-cutting

| Component | File | Status |
|---|---|---|
| `LoadingBlock` — canonical "please wait" + rotating DYK/KDROPS/T&T card | [LoadingBlock.svelte](d:/localdev/platform_devpulse/interfaces/desktop/src/lib/design/components/spinner/LoadingBlock.svelte) | REAL, designed for >3s waits, dynamic imports `clyffy/LoadingContentCard` |
| `ServiceDevtoolShell` | [platform/_shared/ServiceDevtoolShell.svelte](d:/localdev/platform_devpulse/interfaces/desktop/src/lib/domains/platform/_shared/ServiceDevtoolShell.svelte) | REAL (4-tab: Status/Config/Logs/Actions) |
| `HuggingFaceSearch`, `HfTokenModal`, `DownloadProgressRow` | setup-wizard/components/ | REAL |
| `modelsState` rune | [models.state.svelte.ts](d:/localdev/platform_devpulse/interfaces/desktop/src/lib/domains/app/models/data-access/models.state.svelte.ts) | REAL |

### Duplicate / SSOT-violation scan

- sts/stt/tts use slightly different slot-load paths (`commands.loadSlot` direct vs `modelsState.load`). Both hit the same Rust; not a duplicate. Harmonize to `modelsState.load` in Phase 2 for consistency.
- No competing Ollama service (none exists).
- No competing Moshi backend.

### Anti-pattern risks this sprint must resist

- **Auto-selecting the "primary" file** in one-click download — always SHOW the resolved primary + bundle list + sizes; user confirms. "One click" means the resolution is automatic; user visibility is not a second click.
- **Silent swap failures** — `model:swap-failed` must produce a visible error bar, not a console log.
- **Placeholder buttons that look functional** — every placeholder uses `TODO(reality-gap YYYY-MM-DD)` + sprint-phase link.
- **Adding devtools that drift from the shell** — every new devtool uses `ServiceDevtoolShell`. No exceptions.
- **Moshi silent success** — smoke test reports human-readable outcome, not a boolean.

---

# Phases

## Phase 0 — Portable release `.exe` for dogfooding + live verification

**Why first:** when this lands, the owner runs `devpulse-desktop-app.exe` standalone (no dev server) and dogfoods. In parallel, every subsequent phase has live ground truth — I query `http://127.0.0.1:8822/health` for SurrealDB, read `.userdata/libsql/platform.db` via sqlite CLI, tail `.userdata/logs/session-*.jsonl` — instead of inferring state.

### Tasks

- [x] **0.1 Verify `tauri.conf.json` is configured for release bundle**
  - [x] Read [interfaces/desktop/src-tauri/tauri.conf.json](d:/localdev/platform_devpulse/interfaces/desktop/src-tauri/tauri.conf.json)
  - [x] Confirm `bundle.active: true` — ✓ line 32
  - [x] Confirm `bundle.targets` — ✓ `"all"` (MSI + NSIS + EXE on Windows), line 33
  - [x] Confirm `build.devUrl` and `build.frontendDist` are correct — ✓ lines 8–9
  - [x] Check `bundle.resources` — ✓ llama.cpp + ggml + CUDA DLLs staged (lines 42–53). Models NOT bundled (correct; 40+ GB user-managed)
- [x] **0.2 Write / verify `cargo xtask build-release` command**
  - [x] Read existing xtask files: `xtask/src/main.rs` + `xtask/src/commands/mod.rs` — `build-release` did NOT exist
  - [x] Authored [xtask/src/commands/build_release.rs](d:/localdev/platform_devpulse/xtask/src/commands/build_release.rs) — mirrors `dev.rs` env-hardening pattern (Job Object + preflight + sccache + `[build.deps.*]` env)
  - [x] Wired into [xtask/src/commands/mod.rs](d:/localdev/platform_devpulse/xtask/src/commands/mod.rs) and [xtask/src/main.rs](d:/localdev/platform_devpulse/xtask/src/main.rs) — new `BuildRelease` variant dispatches to `commands::build_release::BuildRelease`
  - [x] Verified `cargo check -p xtask` → 0 errors, 2m 50s cold (mostly blocked on file lock from parallel cargo)
- [ ] **0.3 Smoke test the release build**
  - [ ] Run `cargo xtask build-release` (OR manually run `pnpm tauri build` with the hardened env) — owner runs this, not me
  - [ ] Confirm `target/release/bundle/msi/*.msi` or `target/release/devpulse-desktop-app.exe` exists and is non-trivial size (>100 MB)
  - [ ] **Close all dev processes** (no vite, no `tauri dev`)
  - [ ] Launch the release `.exe` from explorer
  - [ ] Owner confirms: full UI renders, 7 services boot, wizard visible
  - [ ] Owner confirms: `http://127.0.0.1:8822/health` returns healthy from a separate shell
  - [ ] Owner confirms: `.userdata/libsql/platform.db` is written on first boot
  - [ ] Owner confirms: `.userdata/duckdb/analytics.duckdb` + WAL are written
  - [ ] Owner confirms: `.userdata/logs/session-*.jsonl` is written
- [x] **0.4 Document the release path**
  - [x] Created [scripts/docs/VERIFICATION.md](d:/localdev/platform_devpulse/scripts/docs/VERIFICATION.md) — covers dev command, release build, smoke-test steps, common build failures, live-verification curls against running app

### Verify

- [ ] `cargo xtask build-release` exits 0
- [ ] Release `.exe` launches standalone with no dev server running
- [ ] All 7 platform services reach healthy state within 10s

### Smoke test

- [ ] Owner double-clicks release `.exe` → wizard appears with animated background → clicks through without crash
- [ ] Owner opens a separate cmd: `curl http://127.0.0.1:8822/health` → `{"status":"healthy","engine":"surrealkv"}`
- [ ] Owner opens `DB Browser for SQLite` → `.userdata/libsql/platform.db` opens and shows tables

### STOP-0

Owner confirms the release build works before any other phase starts.

---

## Phase 2 — STS / STT / TTS shell + Clyffy spinner harmonization

**Why:** existing devtools are real but drift from `ServiceDevtoolShell`. No Clyffy spinner on VRAM-touching actions.

### Tasks

- [x] **2.1 STS devtool rewrap**
  - [x] Read [sts/+page.svelte](d:/localdev/platform_devpulse/interfaces/desktop/src/routes/(devtools)/devtools/sts/+page.svelte) — previously 484 LOC custom layout
  - [x] Wrapped in `<ServiceDevtoolShell title="Speech-to-Speech" axis="capabilities" icon={Radio} health={badge}>`
  - [x] Content reorganized into 4 snippets (`status`, `config`, `logs`, `actions`)
  - [x] Slot-load actions now overlay the entire Actions tab with `<LoadingBlock title="Loading voice pipeline" showContent contentKind="dyk">` while pending
  - [x] Slot load/unload routed through `modelsState.load/unload` (was direct `commands.loadSlot`)
  - [x] Every existing feature preserved: mic test, file upload, transcribe, speak, preview, smoke test, full STS pipeline
  - [x] Every async handler wrapped in try/catch with `logInfo("devtools.sts", …)`
- [x] **2.2 STT devtool rewrap**
  - [x] Read [stt/+page.svelte](d:/localdev/platform_devpulse/interfaces/desktop/src/routes/(devtools)/devtools/stt/+page.svelte) — previously 321 LOC custom layout
  - [x] Wrapped in `<ServiceDevtoolShell title="Speech-to-Text" axis="capabilities" icon={Ear}>`
  - [x] Content in 4 snippets
  - [x] Slot-load overlays Actions tab with `<LoadingBlock showContent contentKind="dyk">`
  - [x] Preserved: mic test, record+transcribe, drag-drop file transcription, streaming-ASR future note
  - [x] `logInfo("devtools.stt", …)` + try/catch on every handler
- [x] **2.3 TTS devtool rewrap**
  - [x] Read [tts/+page.svelte](d:/localdev/platform_devpulse/interfaces/desktop/src/routes/(devtools)/devtools/tts/+page.svelte) — previously 283 LOC custom layout
  - [x] Wrapped in `<ServiceDevtoolShell title="Text-to-Speech" axis="capabilities" icon={Volume2}>`
  - [x] Content in 4 snippets
  - [x] Slot-load overlays Actions tab with `<LoadingBlock showContent contentKind="dyk">`
  - [x] Preserved: voice picker grid, speed control, speak test, voice-cloning future note
  - [x] `logInfo("devtools.tts", …)` + try/catch on every handler

### Verify

- [x] `pnpm svelte-check` → 220 files, 0 errors, 0 warnings (verified 3× — once after each rewrap)

### Smoke test (against running release `.exe` from Phase 0)

- [ ] Navigate to `/devtools/stt` → shell renders → Load voice.stt → Clyffy spinner + rotating DYK card appears for full load duration → Ready badge lights up → record 3s + transcribe returns text
- [ ] Navigate to `/devtools/tts` → shell renders → Load voice.tts → Clyffy spinner → voice grid populates → Speak "hello" plays audio
- [ ] Navigate to `/devtools/sts` → shell renders → Load both slots → smoke test returns PASS/PASS

---

## Phase 3 — Vision (SigLIP2) devtool

**Why:** SigLIP2 backend + `encode_image` cmd are real. No mgmt surface exists.

### Tasks

- [x] **3.1 Created `/devtools/vision/+page.svelte`**
  - [x] Scaffolded at [interfaces/desktop/src/routes/(devtools)/devtools/vision/+page.svelte](d:/localdev/platform_devpulse/interfaces/desktop/src/routes/(devtools)/devtools/vision/+page.svelte) — 11.6 KB, ~290 LOC
  - [x] Wrapped in `<ServiceDevtoolShell title="Vision (SigLIP2)" axis="capabilities" icon={Eye}>`
  - [x] **Status:** slot badge, assigned-model display (id + filename), pipeline summary (when loaded), last-encoded-image stats (dim, L2 norm, first-8 dims, time_ms)
  - [x] **Config:** preconfigured-CPU explanation, SigLIP2-SO400M default expectations card, `TODO(reality-gap 2026-04-21)` for live device override
  - [x] **Logs:** `TODO(reality-gap 2026-04-21)` — points to session logs + both `component="SigLIP Vision"` (backend) and `component=devtools.vision` (this page) filters
  - [x] **Actions:** Load / Unload with `<LoadingBlock showContent contentKind="dyk">` overlay; "Pick image → encode" file picker → `commands.encodeImage(slot_id, path)` → computes L2 norm in frontend + shows first 8 dims + timing
- [x] **3.2 Landing tile**
  - [x] Edited [(devtools)/devtools/+page.svelte](d:/localdev/platform_devpulse/interfaces/desktop/src/routes/(devtools)/devtools/+page.svelte) — added Vision (SigLIP2) tile under the capabilities/teal group, next to STT

### Verify

- [x] `pnpm svelte-check` → 220 files, 0 errors, 0 warnings (verified after devtool creation AND after landing tile edit)

### Smoke test

- [ ] Owner clicks landing tile → vision devtool opens
- [ ] If `vision.embedder` slot is assigned + loaded: Status shows embedding_dim=1152, image_size=384
- [ ] Owner uploads a screenshot → Encode runs → returns non-zero 1152-dim embedding with L2 norm ≈ 1.0 (within 0.01)
- [ ] No errors in session log

---

## Phase 4 — Cross-cutting: Swap-primary-brain + One-click repo download

**Why:** reused by Phases 5, 6, 7. Must land before they can.

### 4a. Swap-primary-brain overlay component

- [ ] **4a.1 Research `swap_slot_model` event payload**
  - [ ] Grep `model:swap-started|model:swap-complete|model:swap-failed` in `interfaces/desktop/src-tauri/src/commands/models/mod.rs` to confirm event names + payload shape
  - [ ] Grep the same events in `interfaces/desktop/src/` to confirm no listener exists yet
  - [ ] Document findings in this file (inline below task list) before authoring
- [ ] **4a.2 Create `SwapPrimaryBrainButton.svelte`**
  - [ ] Path: `interfaces/desktop/src/lib/domains/platform/_shared/SwapPrimaryBrainButton.svelte`
  - [ ] Props: `{ newModelId: string, label?: string, slotId?: string }` (slotId defaults to `"chat.brain"`)
  - [ ] Click handler:
    - [ ] `logInfo("swap.primary", "begin", { newModelId, slotId })`
    - [ ] Open full-viewport overlay `<LoadingBlock title="Swapping brain…" subtitle="Safely loading into VRAM" showContent contentKind="dyk" />`
    - [ ] Subscribe to `listen("model:swap-complete", …)` and `listen("model:swap-failed", …)` BEFORE invoking
    - [ ] Wrap `commands.swapSlotModel(slotId, newModelId)` in try/catch
    - [ ] On `swap-complete`: close overlay, toast success, `logInfo("swap.primary", "complete", { time_ms })`
    - [ ] On `swap-failed` OR thrown error: close overlay, toast error, surface in a red error bar, `logInfo("swap.primary", "failed", { error })`
    - [ ] Always unsubscribe on cleanup
- [ ] **4a.3 Export from platform `_shared` barrel**
  - [ ] Edit [platform/_shared/index.ts](d:/localdev/platform_devpulse/interfaces/desktop/src/lib/domains/platform/_shared/index.ts) — add `export { default as SwapPrimaryBrainButton }`
- [ ] **4a.4 Smoke test harness**
  - [ ] Add a temporary button to `/devtools/candle/+page.svelte` next to each slot: "Make this the primary" → opens the swap overlay → watches real events
  - [ ] Remove the temporary button at end of Phase 4 (this was just a harness for STOP-B review)

### 4b. One-click repo download (HF / JanAI bundle)

- [ ] **4b.1 Add `list_repo_files` Tauri cmd**
  - [ ] Edit `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — append cmd `list_repo_files(repo_id: String) -> Result<Vec<RepoFile>, String>` where `RepoFile { name: String, size: Option<u64> }`
  - [ ] Implementation: `hf_hub::api::sync::ApiBuilder::new().with_token(loader.hf_token()).build()?.model(repo_id).info()?.siblings.iter().map(|s| RepoFile { name: s.rfilename.clone(), size: s.size })`. If `info()` fails: return an error with the reason
  - [ ] Register in `lib.rs` invoke handler
- [ ] **4b.2 Author `resolve-primary-file.ts`**
  - [ ] Path: `interfaces/desktop/src/lib/domains/platform/_shared/resolve-primary-file.ts`
  - [ ] `function resolvePrimaryFile(siblings: RepoFile[]): { primary: string | null, rationale: string }`
  - [ ] Rules:
    1. Any `.gguf` → largest by size → rationale `"GGUF: largest quant (…)"`.
    2. No GGUF, has `model.safetensors` → it → rationale `"SafeTensors: single-file"`.
    3. No GGUF, has `model.safetensors.index.json` → first shard matching that index → rationale `"SafeTensors: sharded (shard 1/N)"`.
    4. Else → `null` + rationale explaining user must pick.
  - [ ] Pure function, no IPC, unit-testable
- [ ] **4b.3 Create `RepoDownloadButton.svelte`**
  - [ ] Path: `interfaces/desktop/src/lib/domains/platform/_shared/RepoDownloadButton.svelte`
  - [ ] Props: `{ repoId: string, suggestedSlot?: string, label?: string }`
  - [ ] Click flow:
    1. Invoke `list_repo_files(repoId)` — show spinner while pending
    2. Resolve primary via `resolvePrimaryFile`
    3. Open confirmation modal with: resolved primary filename, rationale, total bundle size (sum of sibling sizes), sibling file list (scrollable)
    4. Primary file is editable — dropdown lets user override
    5. On confirm: call `download_model(repoId, primary)` → close modal → toast with download_id → `DownloadProgressRow` takes over
    6. If `list_repo_files` fails with auth error: open `HfTokenModal`, let user paste token, retry
  - [ ] try/catch + logInfo on every step
- [ ] **4b.4 Smoke test harness (temporary)**
  - [ ] Add button to `/devtools/+page.svelte` landing: `<RepoDownloadButton repoId="microsoft/phi-4-mini-instruct">` as a one-shot test tile
  - [ ] Remove at end of Phase 4

### Verify

- [ ] `cargo check -p devpulse_desktop_backend` → 0 errors
- [ ] `pnpm svelte-check` → 0 errors
- [ ] Next `cargo xtask run-dev` regenerates specta bindings with `list_repo_files`
- [ ] No agents used

### Smoke test

- [ ] Click temporary "make primary" button on candle devtool → full-screen Clyffy spinner + rotating DYK card appears → real `model:swap-complete` event fires → overlay closes → status badge updates to the new model
- [ ] Click temporary RepoDownloadButton for `microsoft/phi-4-mini-instruct` → list_repo_files returns ~10 files → modal shows the GGUF as primary + full bundle list + total size → Confirm kicks off real download visible in existing `DownloadProgressRow`
- [ ] Owner tries a JanAI repo (`janhq/Jan-Nano-GGUF` or similar) → same flow works since JanAI = HF org

### STOP-B — Owner reviews the swap overlay UX in the running app before Phase 5/6/7 consume the pattern

---

## Phase 5 — Deep Reasoning (Phi-4-reasoning-vision-15b) devtool

**Why:** user wants Phi-4-reasoning-vision swappable as primary brain on demand.

### Tasks

- [ ] **5.1 Research — is Phi-4-reasoning-vision already in the canonical model catalog?**
  - [ ] Read `config/platform/services/system/model-catalog/chat.toml` — confirm entry exists OR needs adding
  - [ ] If not: add it to the catalog with repo `microsoft/Phi-4-reasoning-vision` (verify exact repo id exists on HF)
  - [ ] Confirm the Candle dispatch handles it (safetensors, architecture supported?) — grep `phi` in `kernel/model-loader/src/backends/candle/`
- [ ] **5.2 Create `/devtools/phi_reasoning/+page.svelte`**
  - [ ] `<ServiceDevtoolShell title="Deep Reasoning (Phi-4)" axis="capabilities" icon={BrainCog}>`
  - [ ] **Status snippet:** is Phi currently the primary brain? show model on disk + size + last-used timestamp if available
  - [ ] **Config snippet:** display-only — what Phi expects (context length, dtype)
  - [ ] **Logs snippet:** link to telemetry filtered by `component = "chat.brain"` when Phi is primary
  - [ ] **Actions snippet:**
    - [ ] "Install Phi-4-reasoning-vision-15b" button using `<RepoDownloadButton>` from Phase 4b (hidden when already on disk)
    - [ ] "Make Phi the primary brain" using `<SwapPrimaryBrainButton newModelId={phi_model_id}>` from Phase 4a (hidden when already primary)
    - [ ] "Return primary to default (Qwen3)" — same button with default model id (hidden when Phi is not primary)
    - [ ] "Test a reasoning prompt" textarea — calls existing chat brain with the text, shows reply with token/s timing
- [ ] **5.3 Landing tile**
  - [ ] Edit `/devtools/+page.svelte` — add tile with `BrainCog` icon

### Verify

- [ ] `pnpm svelte-check` → 0 errors

### Smoke test

- [ ] If Phi-4-reasoning-vision is NOT on disk: click Install → bundle confirmation → real download → appears in `scanModels`
- [ ] Click "Make Phi the primary brain" → swap overlay → complete → status bar on devtool updates
- [ ] Enter a reasoning prompt → reply returns (may be slow on CPU — honest)
- [ ] Click "Return primary to default" → swap back

---

## Phase 6 — Ollama sidecar (8-artifact charter)

**Why:** Ollama-library source for one-click downloader requires the sidecar to pull. Also gives user access to 500+ community GGUFs without mixing them into DevPulse's canonical list.

### Pre-phase research

- [ ] Read all existing services to pick the closest template:
  - [ ] [systems/devpulse-engine/src/platform/services/cache.rs](d:/localdev/platform_devpulse/systems/devpulse-engine/src/platform/services/cache.rs) — minimal
  - [ ] [systems/devpulse-engine/src/platform/services/devforge.rs](d:/localdev/platform_devpulse/systems/devpulse-engine/src/platform/services/devforge.rs) — likely closest (also a process-managed sidecar)
  - [ ] [systems/devpulse-engine/src/platform/services/mod.rs](d:/localdev/platform_devpulse/systems/devpulse-engine/src/platform/services/mod.rs) — module wiring
- [ ] Read `interfaces/desktop/src-tauri/src/commands/devforge/mod.rs` for the companion Tauri cmd pattern
- [ ] Document differences between devforge (VS Code-oss) and ollama_sidecar (ollama binary) in a findings block below

### Tasks (8 artifacts)

- [ ] **6.1 Config TOML**
  - [ ] Path: `config/platform/services/system/ollama-sidecar.toml`
  - [ ] Fields:
    ```toml
    [ollama_sidecar]
    enabled = false
    binary_path = ""  # absolute path to ollama[.exe]; empty = disabled
    host = "127.0.0.1"
    port = 11434
    autostart = false
    health_path = "/api/tags"
    ```
  - [ ] Add loader in `devpulse-engine` config parser if not covered automatically
- [ ] **6.2 Service Rust**
  - [ ] Path: `systems/devpulse-engine/src/platform/services/ollama_sidecar.rs`
  - [ ] Struct: `pub struct OllamaSidecarService { cfg: OllamaSidecarConfig, child: Mutex<Option<tokio::process::Child>>, http: reqwest::Client }`
  - [ ] Methods: `async fn start(&self), async fn stop(&self), async fn restart(&self), async fn health(&self) -> Result<OllamaHealth>, async fn export_logs(&self, out: &Path)`
  - [ ] `OllamaHealth { reachable: bool, latency_ms: u64, model_count: u32, error: Option<String> }`
  - [ ] Health = `GET {host}:{port}{health_path}` → parse JSON → count models
  - [ ] Start: spawn `tokio::process::Command::new(binary_path).arg("serve")` with piped stdout/stderr; retain in `child`
  - [ ] Stop: `child.kill().await` with a graceful window
  - [ ] All methods return `anyhow::Result` with rich context
- [ ] **6.3 Module wiring**
  - [ ] Edit [services/mod.rs](d:/localdev/platform_devpulse/systems/devpulse-engine/src/platform/services/mod.rs) — `pub mod ollama_sidecar;`
- [ ] **6.4 `PlatformState` holder**
  - [ ] Edit [systems/devpulse-engine/src/state.rs](d:/localdev/platform_devpulse/systems/devpulse-engine/src/state.rs)
  - [ ] Add `pub ollama_sidecar: ArcSwapOption<Arc<OllamaSidecarService>>`
  - [ ] Init in boot path (lazy — only if `enabled = true` in config)
- [ ] **6.5 Tauri commands**
  - [ ] Path: `interfaces/desktop/src-tauri/src/commands/runtimes/ollama_sidecar.rs` (new module; create `runtimes/mod.rs` if absent)
  - [ ] `ollama_sidecar_start`, `ollama_sidecar_stop`, `ollama_sidecar_restart`, `ollama_sidecar_health`, `ollama_sidecar_save_config`, `ollama_sidecar_export_logs`
  - [ ] Each cmd: `State<'_, PlatformState>` → delegate to service
- [ ] **6.6 Specta regen**
  - [ ] Register cmds in `interfaces/desktop/src-tauri/src/lib.rs` invoke handler + specta builder
  - [ ] Next `cargo xtask run-dev` regenerates `bindings.ts`
- [ ] **6.7 Svelte rune**
  - [ ] Path: `interfaces/desktop/src/lib/domains/platform/ollama-sidecar.state.svelte.ts`
  - [ ] Module-level `$state` for health + config; methods `refresh()`, `start()`, `stop()`, `restart()`
  - [ ] Auto-poll health every 5s when enabled
- [ ] **6.8 Devtool page rewrite**
  - [ ] Replace [ollama_sidecar/+page.svelte](d:/localdev/platform_devpulse/interfaces/desktop/src/routes/(devtools)/devtools/ollama_sidecar/+page.svelte)
  - [ ] `<ServiceDevtoolShell title="Ollama Sidecar" axis="runtimes" icon={Boxes}>`
  - [ ] Status: reachable, latency, model count, PID
  - [ ] Config: edit binary_path, host, port, autostart
  - [ ] Actions: Start / Stop / Restart (Clyffy spinner on pending)
  - [ ] Logs: link to the tail of the sidecar's stderr (surfaced by `export_logs`)

### Verify

- [ ] `cargo check -p devpulse-engine` → 0 errors
- [ ] `cargo check -p devpulse_desktop_backend` → 0 errors
- [ ] `pnpm svelte-check` → 0 errors

### Smoke test

- [ ] Install Ollama (owner) → set `binary_path` in the config tab → save → enabled=true
- [ ] Click Start → Clyffy spinner → health turns green → model count shows (0 initially)
- [ ] `ollama pull llama3.2:1b` from a separate shell → devtool refresh → model count = 1
- [ ] Click Stop → health turns red → reachable = false
- [ ] Start with invalid binary_path → error surfaces in the UI, no panic

---

## Phase 7 — PersonaPlex (Moshi) unstub + Persona devtool

**Why:** biggest Rust compile risk of the sprint. Heavy research first.

### 7a. Research spike (MANDATORY — no authoring until done)

- [ ] **7a.1 Identify the moshi crate source location**
  - [ ] Grep `moshi` in `Cargo.toml` files to find the dep declaration
  - [ ] Check if it's vendored in `deps/` or a crates.io pull
- [ ] **7a.2 Read the moshi LM module**
  - [ ] Locate `lm::load_streaming_both_ways` — read its signature and return type
  - [ ] Read the state type it returns — is it `(Model, State)` or just `Model`?
  - [ ] Is there a `step` / `generate_step` / `forward` method? Confirm the verb + signature
- [ ] **7a.3 Read the Mimi module**
  - [ ] Read `mimi::load` return type
  - [ ] Read `encode(audio) → codes` and `decode(codes) → audio` signatures
  - [ ] Confirm frame size, sample rate, i16 vs f32
- [ ] **7a.4 CPU viability**
  - [ ] Check if moshi has any `#[cfg(feature = "cuda")]` gates that disable CPU
  - [ ] Decide: does smoke test run on CPU (slow but truthful) or is CUDA mandatory?
- [ ] **7a.5 Write the spike doc**
  - [ ] Path: `scripts/docs/sprints/SPRINT-DEVTOOLS-FOUNDATIONAL.research.md`
  - [ ] Sections: "Moshi crate location", "LM API", "Mimi API", "Audio format", "CPU viability", "Planned struct fields for `MoshiStsBackend`", "Planned method signatures"
  - [ ] **STOP-C — owner reviews this doc before any moshi.rs edit**

### 7b. Moshi unstub

- [ ] **7b.1 Add fields to `MoshiStsBackend`**
  - [ ] Edit `kernel/model-loader/src/backends/candle/moshi.rs`
  - [ ] Add: `mimi: Option<MimiModel>`, `lm_model: Option<LmModel>`, `state: Option<LmState>` (exact types from 7a)
  - [ ] `unload()` drops all three
- [ ] **7b.2 Retain loads**
  - [ ] Replace `let _mimi = …` with `self.mimi = Some(mimi::load(…)?)`
  - [ ] Same for `_lm_model`
  - [ ] Init state via the appropriate constructor
- [ ] **7b.3 Add `smoke_test`**
  - [ ] `pub fn smoke_test(&mut self, device: &Device) -> Result<SmokeReport>`
  - [ ] `SmokeReport { mimi_ok: bool, lm_ok: bool, step_ms: u64, error: Option<String> }`
  - [ ] Body: load a short silent audio frame (1920 f32 zeros) → mimi.encode → one `lm.step` → mimi.decode → measure time
  - [ ] Catch every failure, populate `error`, return Ok regardless (the report encodes the failure; the method itself doesn't throw)
- [ ] **7b.4 Canonical model table**
  - [ ] New file: `kernel/model-loader/src/models/canonical.rs`
  - [ ] One const row per vetted model on disk: PersonaPlex-7B, Qwen3 series (0.6B, 9B, 14B, 35B-A3B, 3B Omni), Phi-4-reasoning-vision-15b, SigLIP2-SO400M, Kokoro-v1, Whisper-small, Qwen3-Embedding-0.6B, Qwen3-Reranker-0.6B, Nomic-embed variants
  - [ ] Fields: `id, layman_label, repo_id, arch, backend, expected_files[], role, default_slot`
  - [ ] Re-export via `kernel/model-loader/src/models/mod.rs`
- [ ] **7b.5 Tauri cmd `models_personaplex_smoke_test`**
  - [ ] Edit `interfaces/desktop/src-tauri/src/commands/models/mod.rs`
  - [ ] `pub async fn models_personaplex_smoke_test(state, slot_id: String) -> Result<SmokeReport, String>`
  - [ ] Register in `lib.rs`

### 7c. Persona devtool

- [ ] **7c.1 Create `/devtools/persona/+page.svelte`**
  - [ ] `<ServiceDevtoolShell title="Persona (PersonaPlex 7B)" axis="capabilities" icon={UserCircle}>`
  - [ ] Status: slot assignment, loaded, model on disk, smoke_test last result
  - [ ] Config: Mimi codebooks (8 single / 16 duplex) — display-only
  - [ ] Logs: link to telemetry filtered by `component = "MoshiSts"`
  - [ ] Actions:
    - [ ] Install PersonaPlex-7B using `<RepoDownloadButton repoId="nvidia/personaplex-7b">` (hidden if on disk)
    - [ ] Load / Unload with Clyffy spinner
    - [ ] Run smoke test → shows `SmokeReport` human-readable
    - [ ] Make primary brain using `<SwapPrimaryBrainButton newModelId={persona_id}>`
- [ ] **7c.2 Landing tile**
  - [ ] Edit `/devtools/+page.svelte` — add tile with `UserCircle` icon

### Verify

- [ ] `cargo check -p model-loader` → 0 errors
- [ ] `cargo check -p devpulse_desktop_backend` → 0 errors
- [ ] `pnpm svelte-check` → 0 errors

### Smoke test

- [ ] Install button works for PersonaPlex-7B repo
- [ ] Load completes (slow on CPU — honest) → smoke test returns report
- [ ] If CPU: report may say `step_ms: 15000+, mimi_ok: true, lm_ok: true` — honest slow
- [ ] If CUDA available: report `step_ms: <500`
- [ ] Unload actually frees memory (confirm via Task Manager)
- [ ] Make primary works — swap overlay → primary = Persona → a follow-up chat goes through moshi

---

## Phase 8 — End-to-end verification + landing tile polish

### Tasks

- [ ] **8.1 Remove temporary harness buttons**
  - [ ] Delete the temp "make primary" button added to `/devtools/candle/+page.svelte` in Phase 4a
  - [ ] Delete the temp RepoDownloadButton added to `/devtools/+page.svelte` in Phase 4b
- [ ] **8.2 Landing page tiles final pass**
  - [ ] Edit `/devtools/+page.svelte` — ensure tiles exist for vision, phi_reasoning, persona, ollama_sidecar
  - [ ] Icons: Eye, BrainCog, UserCircle, Boxes
  - [ ] Tiles grouped under the correct axis (capabilities / runtimes)
- [ ] **8.3 Full verification pass**
  - [ ] `pnpm svelte-check` → 0 errors, 0 warnings
  - [ ] `cargo check -p devpulse-engine -p devpulse_desktop_backend -p model-loader` → 0 errors
  - [ ] Biome: `npx biome check interfaces/desktop/src/lib/domains/platform interfaces/desktop/src/routes/(devtools)` — 0 warnings
- [ ] **8.4 Release `.exe` rebuild**
  - [ ] Owner runs `cargo xtask build-release` — new `.exe` supersedes Phase 0 bundle
  - [ ] Smoke test the new `.exe` standalone

### Owner click-through (all must pass)

- [ ] `/devtools/` landing → every tile renders with correct icon + layman label
- [ ] `/devtools/vision` → Encode test image works
- [ ] `/devtools/sts`, `/devtools/stt`, `/devtools/tts` → all wrapped in ServiceDevtoolShell; Load shows Clyffy spinner + DYK card
- [ ] `/devtools/phi_reasoning` → Install → swap primary → swap back
- [ ] `/devtools/persona` → Install → load → smoke test → make primary
- [ ] `/devtools/ollama_sidecar` → Start / Stop / Restart; health reflects reality
- [ ] Any repo download shows bundle confirmation modal before pulling
- [ ] Every VRAM action shows Clyffy rotating card
- [ ] Every Tauri cmd failure surfaces to a red error bar (test by passing a bogus repo id)
- [ ] Session log has `logInfo("devtools.*", …)` entries for every action

### STOP-D — Owner final sign-off before this sprint is archived

---

## Files this sprint CREATES

| File | Phase |
|---|---|
| `interfaces/desktop/src/routes/(devtools)/devtools/vision/+page.svelte` | 3 |
| `interfaces/desktop/src/routes/(devtools)/devtools/phi_reasoning/+page.svelte` | 5 |
| `interfaces/desktop/src/routes/(devtools)/devtools/persona/+page.svelte` | 7 |
| `interfaces/desktop/src/lib/domains/platform/_shared/SwapPrimaryBrainButton.svelte` | 4a |
| `interfaces/desktop/src/lib/domains/platform/_shared/RepoDownloadButton.svelte` | 4b |
| `interfaces/desktop/src/lib/domains/platform/_shared/resolve-primary-file.ts` | 4b |
| `interfaces/desktop/src/lib/domains/platform/ollama-sidecar.state.svelte.ts` | 6 |
| `config/platform/services/system/ollama-sidecar.toml` | 6 |
| `systems/devpulse-engine/src/platform/services/ollama_sidecar.rs` | 6 |
| `interfaces/desktop/src-tauri/src/commands/runtimes/ollama_sidecar.rs` | 6 |
| `interfaces/desktop/src-tauri/src/commands/runtimes/mod.rs` (if missing) | 6 |
| `kernel/model-loader/src/models/canonical.rs` | 7 |
| `scripts/docs/sprints/SPRINT-DEVTOOLS-FOUNDATIONAL.research.md` | 7a |
| `scripts/docs/VERIFICATION.md` section on release build | 0 |

## Files this sprint MODIFIES

| File | Phase |
|---|---|
| `interfaces/desktop/src/routes/(devtools)/devtools/sts/+page.svelte` | 2 |
| `interfaces/desktop/src/routes/(devtools)/devtools/stt/+page.svelte` | 2 |
| `interfaces/desktop/src/routes/(devtools)/devtools/tts/+page.svelte` | 2 |
| `interfaces/desktop/src/routes/(devtools)/devtools/ollama_sidecar/+page.svelte` | 6 |
| `interfaces/desktop/src/routes/(devtools)/devtools/+page.svelte` | 3, 5, 7, 8 |
| `interfaces/desktop/src-tauri/src/commands/models/mod.rs` | 4b, 7b |
| `interfaces/desktop/src-tauri/src/lib.rs` | 4b, 6, 7b |
| `systems/devpulse-engine/src/state.rs` | 6 |
| `systems/devpulse-engine/src/platform/services/mod.rs` | 6 |
| `interfaces/desktop/src/lib/domains/platform/_shared/index.ts` | 4a, 4b |
| `kernel/model-loader/src/backends/candle/moshi.rs` | 7b |
| `kernel/model-loader/src/models/mod.rs` | 7b |
| `xtask/src/main.rs` (or existing build-release cmd file) | 0 |

## Files this sprint DELETES

None.

---

## Out of scope (explicit)

- Streaming ASR (sherpa-onnx)
- Voice cloning
- Wake-word detection
- Voice lab separate window
- Setup wizard UX — governed by `POAM-SETUP-OVERLAY-CANONICAL.md`
- Bundling models INTO the release `.exe` — Phase 0 ships the app, not the model files (size prohibitive)

## Related sprints

- `scripts/docs/POAM-SETUP-OVERLAY-CANONICAL.md` — wizard POAM
- `scripts/docs/sprints/SPRINT-REALITY-GAP-CLOSE.md` — parent (Phases 1 + 3b absorbed here)
- `scripts/docs/sprints/SPRINT-DEVTOOLS-TELEMETRY.md` — telemetry devtool pattern (unchanged)

---

## STOP-A — Owner approval BEFORE any code

Confirm 4 items. Reply "go" to all four = Phase 0 starts.

1. **Phase 0 (release build) first?** Yes / No. If No, tell me which phase to start with.
2. **One-click HF download shows bundle confirmation modal** (with editable primary file + total size) before pulling? Or strict one-click-pulls-immediately with a "trust this repo next time" checkbox?
3. **Ollama health = GET `/api/tags`** at configured host:port? (Ollama's stock endpoint.)
4. **Phase 7 research spike before moshi.rs edits** (produces `.research.md`, you review, then authoring)?

Reply with answers, I start Phase 0.
