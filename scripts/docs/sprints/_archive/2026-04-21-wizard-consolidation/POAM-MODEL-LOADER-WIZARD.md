# POAM: Model Loader Wizard — Full Rewrite

| Field | Value |
|-------|-------|
| **Status** | `UNVERIFIED — NOTHING IN THIS DOC IS TRUSTED AS WORKING` |
| **Date** | 2026-04-08 (reviewed + re-aligned 2026-04-21) |
| **Owner** | Jesse |
| **Scope** | Setup wizard, model loading, Lexicon voice, graceful shutdown, tests |
| **Supersedes** | ALL prior model-loader sprint docs (see bottom) |
| **Workflow SSOT** | **The 10 Commandments (below) — verbatim, non-negotiable** |
| **UX Spec** | `scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md` |

> **READ-BEFORE-WORK:** Every prior claim of "DONE" / ✅ / "COMPLETE" in this doc
> and its children is **UNVERIFIED**. Do not trust any item until the owner has
> watched it work OR a verification gate (`cargo check` + `pnpm svelte-check` +
> `biome check` + vitest-browser run + screenshot) proves it. If you cannot
> produce that evidence, the item is NOT done.

---

## The 10 Commandments — The Workflow (VERBATIM, LOCKED)

Owner-issued SSOT for the Setup Wizard UI. Overrides every prior wizard pattern,
mockup, and sprint draft. Any sprint that contradicts a Commandment is DEAD.

1. **ONE DECISION PER SCREEN** — never show all 7 slots simultaneously.
2. **PRESET FIRST, CUSTOMIZE SECOND** — show a recommended config card, one-click
   "Download & Set Up", small "Customize" link.
3. **LAYMAN NAMES** — "Clyffy's Brain" not "Qwen3-14B-Q4_K_M". Technical name in
   small gray text underneath.
4. **ROLE COLORS** — brain = purple, minion = green, encoders = blue, voice = orange.
5. **VRAM BUDGET BAR** — always visible, green/yellow/red, updates live.
6. **POPUPS ARE DECISION FORKS** — 2–4 options max, closes on selection.
7. **DOWNLOAD IS A BACKGROUND JOB** — per-model progress bars with friendly names,
   user can advance.
8. **ERRORS ARE ACTIONS** — every error has 2–3 action buttons, never just text.
9. **DETECT LOCAL MODELS** — scan disk + HF cache before downloads, show checkmarks.
10. **HAPPY PATH = 2 CLICKS** — Continue from Hardware → "Download & Set Up" → done.

### Slot labels (VERBATIM — no other copy permitted in default view)

| Slot ID          | Layman label         |
|------------------|----------------------|
| `chat.brain`     | Clyffy's Brain       |
| `minion.shared`  | Minion Core          |
| `rag.embedder`   | Memory Search        |
| `rag.reranker`   | Quality Filter       |
| `vision.embedder`| Screen Reader        |
| `voice.stt`      | Voice Input          |
| `voice.tts`      | Voice Output         |

### Role colors (VERBATIM — driven by `--wiz-role-*` vars, never ColdLight vars)

| Role     | Color  | Token              |
|----------|--------|--------------------|
| brain    | purple | `--wiz-role-brain` |
| minion   | green  | `--wiz-role-minion`|
| encoders | blue   | `--wiz-role-encoder`|
| voice    | orange | `--wiz-role-voice` |

### Compliance rule
Any screen, component, popup, sprint acceptance criterion, or test that violates
a Commandment or uses non-verbatim slot labels / role colors is a **defect**, not
a preference. File under `DEFECT-LIST-WIZARD-UI.md` and block the sprint.

---

## MODEL INVENTORY (CONCRETE)

### Brain Models — Qwen 3 Family (GGUF + SafeTensors)

| Tier | Slot | HF Repo | Filename | Size | VRAM | Notes |
|------|------|---------|----------|------|------|-------|
| High | chat.brain | bartowski/Qwen3-14B-GGUF | Qwen3-14B-Q4_K_M.gguf | 8.1 GB | 9.2 GB | Clyffy 14B brain |
| Medium | chat.brain | bartowski/Qwen3-8B-GGUF | Qwen3-8B-Q4_K_M.gguf | 4.9 GB | 5.8 GB | Clyffy 8B brain |
| Low | chat.brain | bartowski/Qwen3-4B-GGUF | Qwen3-4B-Q4_K_M.gguf | 2.6 GB | 3.2 GB | Clyffy 4B — MINIMUM |
| All | minion.shared | Qwen/Qwen3-0.6B-GGUF | qwen3-0.6b-q8_0.gguf | 700 MB | 400 MB | 1 shared instance, 8 minions ref-count it |
| All | minion.escalation | — | — | — | — | Pointer to chat.brain (or independent on 24GB+) |

### Minion Architecture (LOCKED — from owner's MINION BRAIN ARCHITECTURE spec)

Minions are NOT simple watchers. They are **specialist AI agents** with their own
inference path, escalation chain, and brain-sharing model.

- 8 minions: GUARDIAN, ENFORCER, DIARY, PSYCH, TEACHER, SCRIBE, VISION, RESEARCHER
- ALL share ONE 0.6B instance (ref-counted via BackendPool Arc)
- Specialist identity from system prompt + llguidance constrained output schemas
- Why shared: 0.6B × 1 = 0.5GB vs 0.6B × 8 = 4.8GB. Sequential per signal.
- Complexity check determines escalation (rule-based Phase 1, MLP scorer Phase 2)
- Escalation chain: minion.escalation → chat.brain → queue+degrade
- Same prompt + constrained schema regardless of backend size (0.6B or 14B)
- BackendPool ref-counting: escalation and brain share same Arc when same model

### Dynamic Brain Policy — ActiveIdle (from owner's spec)

| VRAM | Policy | Active (LARGE_LLM) | Idle (SMALL_LLM) |
|------|--------|---------------------|-------------------|
| 8GB floor | Static | 4B only | — |
| 12GB mid | ActiveIdle | 9-15B | 4B |
| 16GB high | ActiveIdle | 14-15B | 4-9B |
| 24GB ultra | Static | 27B+ | — |

- User chatting → swap to LARGE_LLM. Idle 5min → swap to SMALL_LLM.
- Swap: drain pending → unload → load new → emit BrainSwapped.
- Clyffy narrates: "Let me think on that for a sec..."
- Config: BrainSwapPolicy enum (Static / ActiveIdle / EscalationDriven).

**RULES:**
- Clyffy brain minimum = **4B**. NEVER 1.7B, NEVER 0.6B.
- Minion shared = **0.6B**. Escalation via fallback to brain when complex.
- Both GGUF and SafeTensors versions must be downloadable.

### Encoder Models — 0.6B

| Slot | HF Repo | Filename | Size | VRAM | Format |
|------|---------|----------|------|------|--------|
| rag.embedder | BAAI/bge-m3 | model.safetensors | 600 MB | 600 MB | SafeTensors |
| rag.reranker | Qwen/Qwen3-Reranker-0.6B | model.safetensors | 600 MB | 600 MB | SafeTensors |

### Vision Model

| Slot | HF Repo | Filename | Size | VRAM | Format |
|------|---------|----------|------|------|--------|
| vision.embedder | google/siglip2-so400m-patch14-384 | model.safetensors | 400 MB | 500 MB | SafeTensors/ONNX |

### Voice Models (Lexicon System)

| Slot | Backend | HF Repo | Filename | Size | Device |
|------|---------|---------|----------|------|--------|
| voice.tts | Qwen3-TTS (default) | Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice | model.safetensors | 600 MB | GPU/CPU |
| voice.tts | Kokoro (fallback) | hexgrad/Kokoro-82M-v1.0-GGUF | kokoro-v1.0.gguf | 82 MB | CPU |
| voice.stt | Whisper | ggerganov/whisper.cpp | ggml-small.bin | 466 MB | CPU |

---

## FOLDER STRUCTURE

```
.userdata/models/
├── chat/           ← brain GGUF/SafeTensors (Clyffy + minion if separate)
├── rag/            ← embedder + reranker SafeTensors
├── vision/         ← SigLIP2 SafeTensors/ONNX
└── voice/          ← Whisper .bin, Kokoro .gguf, Qwen3-TTS SafeTensors
```

**Flow:** Download from HF → verify file integrity → copy to `.userdata/models/{kind}/` → register in model registry → confirm in UI.

---

## LOADING PIPELINE (Which Backend Loads What)

| Format | Backend | Rust Module | Loader |
|--------|---------|-------------|--------|
| `.gguf` | llama.cpp FFI | `backends/bridge.rs` | `LlamaCppBackend` |
| `.safetensors` | Candle | `backends/candle/backend.rs` | `CandleBackend` |
| `.onnx` | ORT | `backends/ort/mod.rs` | `OrtBackend` |
| `.bin` (Whisper GGML) | sherpa-rs | `backends/ort/whisper.rs` | `WhisperBackend` |

**Router:** `backends/router.rs` — inspects file extension + header, routes to correct backend.

---

## AUDIT FINDINGS (2026-04-08 — this session)

> Every "DONE" claim below was written by an AI session with no owner verification.
> **Treat all rows as `UNVERIFIED`.** A fix is only real once the Sprint 1
> verification gate (§1.9) is green AND the owner has watched the wizard boot
> without role-color regressions, invisible borders, or runtime crashes.

### CRITICAL RUNTIME BUGS (found by full read of all 18 wizard files)

| # | File | Bug | Claimed fix | Status |
|---|------|-----|-------------|--------|
| 1 | `wizard.types.ts:78-83` | ROLE_COLORS uses ColdLight vars (`--accent-purple-main` etc.) — these DON'T EXIST in `--wiz-*` scope. Role colors INVISIBLE on slot cards, preset borders, completion dots. | Replace with `var(--wiz-role-brain)` etc. | ⚠️ UNVERIFIED |
| 2 | `wizard.service.ts:308-326` | `bulkDownloadAndAssign` references `downloadQueue`, `downloadingIndex`, `downloadProgress` — NONE exist in WizardState. Runtime crash on bulk download. | Add properties to WizardState. | ⚠️ UNVERIFIED |
| 3 | `HuggingFaceSearch.svelte:328-406` | ~60 lines of HARDCODED oklch CSS. Zero `--wiz-*` vars. Violates local CSS rule. | Full CSS rewrite with `--wiz-*`. | ⚠️ UNVERIFIED |
| 4 | `wizard.types.ts:98` | Minion description: "helpers watching your project" — owner said they THINK, not just watch. | Changed to "specialist helpers thinking about your project". | ⚠️ UNVERIFIED |
| 5 | `WelcomeStep.svelte:82` | `border: 2px solid var(--wiz-glow-purple)` — glow is a BOX-SHADOW value, not a color. Invisible border. | Use `var(--wiz-role-brain)` + add `box-shadow`. | ⚠️ UNVERIFIED |
| 6 | `HardwareDetectionStep.svelte:227` | Hardcoded `oklch(0.63 0.08 173 / 0.35)` hover color. | Replace with `var(--wiz-border-focus)`. | ⚠️ UNVERIFIED |
| 7 | `SearchBrowseStep.svelte:15` | Unused imports `getSlotLabel`, `ROLE_COLORS`. Type error on `targetSlot` (string vs SlotId). No loading state on import button. | Fix imports, cast, add importing state. | ⚠️ UNVERIFIED |

### UX PROBLEMS (not yet fixed — Sprint 2)

| # | Problem | Evidence |
|---|---------|----------|
| 8 | HuggingFace search is tiny, hard to find, unclear messaging | Owner: "search hugging face is fucking tiny and hard to find" |
| 9 | No loading indicators when model loading — UI freezes | Owner: "no fucking clue if you are loading a model shit just freezes" |
| 10 | Folder browsing has no loading state during file dialog | Import button shows no feedback while rfd dialog is open |
| 11 | No E2E tests — nothing proves the wizard works | Zero vitest-browser or playwright tests |
| 12 | No ColdLight base component verification (Spinner import used in wizard) | Spinner from `$lib/design/` used — needs to work without ColdLight scope |

---

## SPRINT 1: FIX ALL RUNTIME BUGS + VERIFY COMPILATION

**Goal:** Every file compiles. Zero type errors. Zero biome errors. Runtime crashes eliminated.
**Max 5 files per phase. Verification after each edit.**
**Commandments in play:** #4 (role colors must actually render), #5 (VRAM bar cannot
crash), #3 (layman copy in minion description), #8 (errors must be actionable, not
silent crashes).

> **Status convention:** `⚠️ UNVERIFIED` = code change was attempted in a prior
> session but has NOT been re-checked against a green verification gate this
> sprint. Moving an item to `✅ VERIFIED` requires all 5 checks in §1.9 green
> AND the owner signing off in the worklog.

### 1.1 Fix ROLE_COLORS (wizard.types.ts) — ⚠️ UNVERIFIED
- Replace ColdLight vars with `--wiz-*` role vars (Commandment #4).

### 1.2 Fix missing WizardState properties (wizard.runes.svelte.ts) — ⚠️ UNVERIFIED
- Add `downloadQueue`, `downloadingIndex`, `downloadProgress` (Commandment #7).

### 1.3 Fix minion description (wizard.types.ts) — ⚠️ UNVERIFIED
- Copy MUST read: "specialist helpers thinking about your project" (Commandment #3).

### 1.4 Fix WelcomeStep avatar border — ⚠️ UNVERIFIED
- Border uses `--wiz-role-brain`, glow via `box-shadow` (Commandment #4).

### 1.5 Fix HardwareDetectionStep hardcoded oklch — ⚠️ UNVERIFIED
- Hover uses `--wiz-border-focus`.

### 1.6 Fix HuggingFaceSearch CSS — ⚠️ UNVERIFIED
- All hardcoded oklch → `--wiz-*` vars.

### 1.7 Fix SearchBrowseStep diagnostics — ⚠️ UNVERIFIED
- Remove unused imports, fix `SlotId` type, add `importing` state (Commandment #7).

### 1.8 Fix auto_config.rs brain minimums — ⚠️ UNVERIFIED
File: `kernel/model-loader/src/hardware/auto_config.rs`
- Line 113: Low tier brain → **4B** (currently 1.7B — VIOLATES 4B minimum)
- Line 117: Minimal/CpuOnly brain → **4B** (currently 0.6B — VIOLATES 4B minimum)

### 1.9 Verification gate (the ONLY thing that retires a ⚠️ UNVERIFIED)
```bash
cargo check -p model-loader
cargo check -p devpulse-engine
cargo check -p devpulse_desktop_backend
cd interfaces/desktop && pnpm svelte-check
npx biome check src/lib/domains/app/models/ --diagnostic-level=warn
```
ALL five must pass. Sprint 1 is NOT done until:
1. All five commands return zero errors in the same session.
2. `cargo xtask run-dev` boots to the wizard.
3. Owner watches Welcome → Hardware → Models render with visible role colors
   (purple/green/blue/orange) on every card.
4. Owner signs off in the worklog line (`scripts/docs/sprints/BUILD-DIARY-WIZARD.md`).

**Acceptance:** All five checks green. Brain minimums enforced. Zero runtime
crashes from missing vars/state. Role colors visible. Owner sign-off present.

---

## SPRINT 2: COMMERCIAL-QUALITY UX + E2E TESTING

**Goal:** A layman can configure Clyffy, load models, see real progress, understand every screen. Proven by E2E tests running in vitest-browser where Jesse can watch.
**Status:** ⚠️ UNVERIFIED — Phase D gate has NOT run green this sprint. Every
sub-phase below is a requirement, not a claim.
**Commandments in play:** #1 ONE DECISION PER SCREEN, #2 PRESET FIRST,
#3 LAYMAN NAMES, #7 DOWNLOAD IS A BACKGROUND JOB, #8 ERRORS ARE ACTIONS,
#9 DETECT LOCAL MODELS, #10 HAPPY PATH = 2 CLICKS.

### Phase A: Search & Download UX Overhaul (3 files)

#### A.1 SearchBrowseStep.svelte — Make HF search PROMINENT
- "Search Online" tab: larger text, cyan accent, icon prominent
- Add descriptive subheading: "Search HuggingFace for thousands of AI models"
- When downloading from search: show inline progress bar (not just toast)
- Import button: clear "Importing..." loading state with spinner (DONE in 1.7)
- Add "What are these?" help text explaining GGUF vs SafeTensors in layman terms

#### A.2 HuggingFaceSearch.svelte — Clear loading/progress messaging
- Search button larger, more prominent
- During search: "Searching HuggingFace..." with animated spinner, center of screen
- Results: larger cards, clearer model names (strip technical suffixes)
- Download button: shows progress inline "Downloading Clyffy's Brain... 2.3 / 4.9 GB"
- After download: "✓ Downloaded — assigning to [slot name]..."
- Error: action buttons (Retry / Try Different / Skip)
- Empty state: "No models found. Try searching for 'Qwen3' or 'Llama'"

#### A.3 ModelsStep.svelte — Loading state for model activation
- When "Download & Set Up" clicked: clear step-by-step progress
  1. "Downloading Clyffy's Brain..." (progress bar)
  2. "Downloading Minion Core..." (progress bar)
  3. "Setting up..." (spinner)
  4. "Ready!" (green check)
- Each model shows ETA: "about 4 min left"
- Cancel button per download
- If model loading after download: "Loading into GPU memory..."

### Phase B: Loading States Everywhere (3 files)

#### B.1 SlotCard.svelte — Real-time slot status
- When model is loading: animated progress indicator
- When model is loaded: "Ready" with green check animation
- When model fails: red X with "Retry" and "Change" buttons
- Tooltip on hover: "This model is loaded in GPU memory and ready to use"

#### B.2 VramBar.svelte — Live updates during loading
- Show loading animation when VRAM is being allocated
- Per-model VRAM segments with role colors
- Tooltip: "Clyffy's Brain: 3.2 GB | Minion Core: 0.4 GB | Free: 6.4 GB"

#### B.3 ClyfActivationStep.svelte — Loading feedback for inference
- When sending message: "Clyffy is thinking..." with brain pulse animation
- If brain not loaded: clear CTA "Go back and set up Clyffy's Brain first"
- First response: celebration "Clyffy is alive! 🎉"
- Voice toggle: clear "Voice not available — download Voice Output model first"

### Phase C: E2E Tests with vitest-browser (Jesse watches)

#### C.1 Test setup
File: `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/__tests__/wizard.browser.test.ts`
- vitest-browser config: opens real Chromium
- Test utilities: mock Tauri invoke, mock hardware state, mock model state

#### C.2 Test: Welcome → Hardware → Models happy path
- Renders WelcomeStep with hardware preview
- Click "Let's Go" → transitions to HardwareDetectionStep
- Tier badge shows correct tier for mocked VRAM
- Click "Continue" → transitions to ModelsStep
- PresetCard shows recommendations with layman names
- Role color borders visible (not transparent)
- VRAM bar shows budget

#### C.3 Test: Download & Set Up flow
- Click "Download & Set Up" on PresetCard
- Download progress bars appear with friendly names
- Progress updates (mock download events)
- Completion: success message, models assigned

#### C.4 Test: Search & Browse flow
- Navigate to SearchBrowseStep
- "Search Online" tab visible and clickable
- Search for "Qwen3" → results appear with model cards
- Download button shows slot selector
- Import button shows loading state during file pick

#### C.5 Test: Customize flow
- Navigate to CustomizeStep
- Slot cards grouped by role (Thinking, Watching, Understanding, Talking)
- Role color borders visible
- Click "Change" → SlotSwapPopup with 2-4 options
- Select model → popup closes, slot updated

#### C.6 Test: Completion summary
- Navigate to CompletionStep
- All assigned slots show with role colors
- Ready count accurate
- "Launch DevPulse" button enabled

### Phase D: Verification
```bash
cd interfaces/desktop && pnpm svelte-check          # 0 errors
npx biome check src/lib/domains/app/models/ --diagnostic-level=warn  # 0 errors
pnpm vitest run --browser src/lib/domains/app/models/features/setup-wizard/  # all pass
```

**Acceptance:**
- Layman can complete wizard without knowing AI terminology
- Every loading state has visible feedback (spinner, progress bar, message)
- HuggingFace search is prominent and easy to use
- Download progress shows per-model with friendly names and ETA
- E2E tests prove it all works — Jesse can watch in browser
- Zero hardcoded oklch in any wizard component
- All --wiz-* CSS vars resolve correctly (role colors visible)

---

## SPRINTS 3-6 (OUTLINED — DETAILED WHEN SPRINTS 1-2 COMPLETE)

### Sprint 3: Real Backend State & Honest UI
- VramBar reads actual GPU data (not mock)
- Slot status from Rust backend, not frontend guess
- Download progress from EventBridge events
- Config-driven brain mode toggle
- Dynamic tooltips from model metadata

### Sprint 4: Lexicon Voice System
- Create `engine/src/lexicon/` module structure
- Implement `TtsBackend` + `SttBackend` traits
- Wire WhisperBackend (sherpa-rs)
- Wire Qwen3TtsBackend (qwen_tts crate)
- Wire KokoroBackend (fallback)
- Register voice slots in slot system
- Config loading from TOML

### Sprint 5: Tests + Clyffy Sprite
- Vitest unit: types, runes, services
- Vitest browser: component rendering (STARTED in Sprint 2)
- Playwright E2E: full happy path
- Rust: model loading, auto-config, import
- Clyffy sprite spinner asset

### Sprint 6: Graceful Shutdown
- `on_window_close` handler in Tauri
- Signal all services to stop
- 3-check/30s timeout: check progress at 0s, 10s, 20s
- Force kill at 30s ONLY if no progress since last check
- Verify: no orphan processes, no leaked VRAM
- Tests prove cleanup works

---

## WAVE DEPENDENCIES

```
Sprint 1 (fix bugs) ──> Sprint 2 (UX + E2E tests)
                            │
                            ├──> Sprint 3 (real state)
                            ├──> Sprint 4 (Lexicon voice)
                            │
                            └──> Sprint 5 (more tests) ← continuous alongside 3+4
                                     │
                                     └──> Sprint 6 (graceful shutdown)
```

---

## SUPERSEDED DOCUMENTS

These sprint docs are DEAD. Do not follow them. Each file now carries a
top-of-file `SUPERSEDED` banner pointing back here. If you find one without a
banner, stamp it. Do not delete until owner has audited.

### Tier 1 — Wizard / Model-Loader plans (rewritten into this POAM)
- `SPRINT-MODEL-LOADER-UX.md`
- `SPRINT-MODEL-LOADER-REAL.md`
- `SPRINT-MODEL-LOADER-WAVES.md`
- `SPRINT-MODEL-LOADER-COMPLETE.md`
- `SPRINT-MODEL-LOADER-FOUNDATION.md` (+ `.research.md`)
- `SPRINT-DEV-ONBOARDING-WIZARD.md`
- `SPRINT-ML-01-FOUNDATION.md`
- `SPRINT-ML-02-BROWSE-LOAD.md`
- `SPRINT-BOOT-HALT-WIZARD.md` (+ `.research.md`)
- `SPRINT-BOOT-WIZARD-FIX.md` (+ `.research.md`)
- `SPRINT-WIZARD-OVERLAY-ABSORPTION.md` — violates Commandment #1
- `SPRINT-MODEL-TIERS.md` (+ `.research.md`) — tiering replaced by preset-first flow (#2)
- `SPRINT-SMOKETEST-ONBOARDING.md` — onboarding happy-path replaced by E2E in Sprint 2 Phase C

### Tier 2 — `dev-onboarding/` wave (all UNVERIFIED regardless of prior "complete" claim)
- `dev-onboarding/SPRINT-01-FOUNDATION.md`
- `dev-onboarding/SPRINT-02-HARDWARE-DETECTION.md`
- `dev-onboarding/SPRINT-03-MODEL-LOADER-LEFT.md`
- `dev-onboarding/SPRINT-04-MODEL-LOADER-RIGHT.md`
- `dev-onboarding/SPRINT-05-RUST-IMPORT.md`
- `dev-onboarding/SPRINT-06-VOICE-PIPELINE.md`
- `dev-onboarding/SPRINT-07-CLYFFY-PROJECT.md`
- `dev-onboarding/SPRINT-08-ORCHESTRATOR.md`
- `dev-onboarding/SPRINT-09-SUBSEQUENT-LAUNCH.md`
- `dev-onboarding/SPRINT-10-SSOT-ALIGNMENT.md`
- `dev-onboarding/SPRINT-11-RUST-HARDWARE-SLOTS.md`
- `dev-onboarding/SPRINT-12-RUST-KEYRING.md`
- `dev-onboarding/SPRINT-13-FRONTEND-FIXES.md`
- `dev-onboarding/SPRINT-14-VOICE-OVERHAUL.md`
- `dev-onboarding/SPRINT-ML-01-RUST-DISCOVERY.md`
- `dev-onboarding/SPRINT-ML-02-DOWNLOAD-WIRING.md`
- `dev-onboarding/SPRINT-ML-03-SLOT-PANEL-REWRITE.md`
- `dev-onboarding/SPRINT-ML-04-LAYOUT-VRAM-SWAP.md`
- `dev-onboarding/SPRINT-ML-05-HF-SEARCH-CROSSLINKS.md`
- `dev-onboarding/SPRINT-ML-06-COMPLIANCE-VERIFICATION.md`

> The dev-onboarding sprints were marked COMPLETE in a prior memory record.
> That status is not binding. The wizard does not currently pass a Commandment
> audit in a live `cargo xtask run-dev` session. Until it does, every
> dev-onboarding sprint is UNVERIFIED and its output must be re-checked against
> the 10 Commandments in this POAM.

### Tier 3 — Reference-only (not a sprint, not authoritative)
- `DEFECT-LIST-WIZARD-UI.md` — inventory of defects. Live list, not a plan.
- `BUILD-DIARY-WIZARD.md` — session worklog. Reference, not authority.
- `POAM-MODEL-LOADER-WIZARD.md` (this file) — **SOLE AUTHORITY.**

**This POAM is the SOLE AUTHORITY for model loader, wizard, and voice work.**
