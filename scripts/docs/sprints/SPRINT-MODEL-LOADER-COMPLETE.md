# MODEL LOADER — Complete Sprint (against RC3 spec + owner corrections)

| Field | Value |
|-------|-------|
| **Status** | `IN PROGRESS` |
| **Date** | `2026-04-05` |
| **SSOT** | Model Loader Spec RC3 + owner corrections from ee03f554 conversation |
| **Supersedes** | SPRINT-MODEL-LOADER-WAVES.md, MODEL-LOADER-UX-REQUIREMENTS.md, SPRINT-MODEL-LOADER-UX.md |
| **Last verified** | 2026-04-05 |

---

## WHAT THE OWNER EXPLICITLY DEMANDED (from prior conversation)

These were agreed upon and approved. They are NOT optional.

### 1. CLOUD CLYFFY FALLBACK
Until a local LLM loads, Clyffy is powered by an API key hitting devpulse.app Supabase backend. This means tooltips, callouts, and assistance overlays work FROM FIRST BOOT. The user never sees a dead UI.

### 2. GUIDED LAYMAN ONBOARDING
- Hardware scan on boot → detect GPU, VRAM, RAM
- Show compatible LLMs (Llama 3.1 8B, Phi-4 Mini, Qwen3 4B, Mistral 7B, Gemma 2 9B) with color-coded VRAM fit
- User picks ONE brain model
- Supporting models auto-download (NOT optional): Whisper STT, Kokoro TTS, nomic embedder, reranker
- Voice check step — verify Whisper and Kokoro work before declaring ready
- Onboarding IS the BootOverlay wizard phase — fills the viewport, gates the app

### 3. INTERACTION LIBRARY (Clyffy-powered)
- Tooltips that pull from a central glossary (not just `title` attrs)
- Callouts — contextual help bubbles Clyffy generates
- Spotlights — highlight UI elements with explanations
- Assistance overlays — Clyffy narrates what's happening
- 3-tier content: bundled JSON (offline) → local LLM → cloud API

### 4. DEVHUB OVERLAY
- Ctrl+Shift+. opens floating panel
- Contains: model control, system status, Clyffy config
- Accessible from any screen in dev mode

### 5. SMART IMPORT
- Scan user's Downloads folder for .gguf files
- Show overlay with found models, let user pick
- Copy to models dir, auto-register

### 6. VIEWPORT-FILLING BOOT EXPERIENCE
- The model loader IS the boot gate — fills the entire viewport
- Not a small widget in a corner — THE experience
- Production-grade visual quality

### 7. MIX AND MATCH CPU/GPU
- Per-slot device selection (GPU/CPU/Auto)
- Smaller models on CPU, big brain on GPU
- No "all GPU" assumption

---

## WHAT IS DONE (verified on disk 2026-04-05)

### Rust Infrastructure — COMPLETE
- model-loader crate: slots, registry, discovery, download, Candle backend, flume bridge, pool, VRAM budget
- Engine wiring: LibSqlConfig, TauriEventBridge, narration.rs, TOML config
- Tauri commands: 16 model + 12 voice + 2 preference + 1 VRAM budget

### Frontend Components — BUILT BUT MISSING CRITICAL FEATURES
- 4-card UI (Brain/Vision/Voice/Memory) — catalog-driven from TOML
- Tooltips (26 `title` attrs) — INVISIBLE without hover, owner wants Clyffy-powered callouts
- Narration rune (9 events, all 4 cards wired) — only fires during model events
- Terminology translation (8 functions × 3 levels)
- Advanced subsystem layout (SubsystemGroup toggle)
- VramGauge, GpuUtilGauge, ContextGauge, VramBudgetPlanner
- VoiceSlotStatus, ModelEventCard in chat
- StatusBar model segments
- CompetencyTracker service
- Hardware convenience getters

---

## WHAT IS NOT DONE (the owner's actual demands)

| # | Feature | Status | Why It Matters |
|---|---------|--------|----------------|
| 1 | Cloud Clyffy fallback | NOT STARTED | UI is dead without it — no AI assistance during setup |
| 2 | Guided onboarding flow | NOT STARTED | User sees 4 raw cards, not a guided "pick your brain" experience |
| 3 | Interaction library | NOT STARTED | Tooltips are `title` attrs — invisible, not Clyffy-powered |
| 4 | DevHub overlay | NOT STARTED | No Ctrl+Shift+. panel |
| 5 | Smart import overlay | NOT STARTED | No Downloads folder scan |
| 6 | Viewport-fill boot | PARTIAL | BootOverlay renders panel but it's cramped in max-w-3xl |
| 7 | CPU/GPU per-slot selector | NOT STARTED | No device picker on cards |
| 8 | Whisper + Kokoro in onboarding | NOT STARTED | Voice models not auto-downloaded |
| 9 | Hardware scan → compatible LLMs | NOT STARTED | auto_configure exists in Rust, not wired to onboarding UI |
| 10 | Voice check verification step | NOT STARTED | No verification that voice models work |

---

## EXECUTION PHASES (CORRECTED)

### Phase 1: VIEWPORT-FILL BOOT + GUIDED ONBOARDING
The BootOverlay wizard phase must fill the screen. Replace the 4-card dump with a step-by-step guided flow:
1. Hardware scan (show GPU, VRAM, RAM)
2. Brain picker (compatible models with fit indicators)
3. Supporting models (auto-select Whisper, Kokoro, embedder, reranker)
4. Download all selected
5. Verify everything works
6. "Launch Clyffy"

**Files:** BootOverlay.svelte, NEW OnboardingWizard.svelte, ModelLoaderPanel.svelte

### Phase 2: CLOUD CLYFFY FALLBACK
- Supabase edge function at devpulse.app/functions/v1/clyffy-chat
- Bundled API key in Tauri config (rate-limited per device)
- ClyffyRouter: local LLM → cloud API → bundled JSON fallback
- Wire into narration, tooltips, callouts

**Files:** NEW clyffy-router.service.ts, supabase edge function, Tauri config

### Phase 3: INTERACTION LIBRARY
- Central glossary (JSON) with term definitions
- ClyffyTooltip component — replaces native `title` with rich popover
- ClyffyCallout component — contextual help bubble
- ClyffySpotlight component — highlight + explain
- All powered by ClyffyRouter (local or cloud)

**Files:** NEW glossary.json, NEW ClyffyTooltip.svelte, NEW ClyffyCallout.svelte, NEW ClyffySpotlight.svelte

### Phase 4: SMART IMPORT + CPU/GPU SELECTOR
- Scan Downloads folder for .gguf files
- Import overlay showing found models
- Per-card device selector (GPU/CPU/Auto dropdown)

**Files:** NEW ImportOverlay.svelte, BrainCard.svelte, VisionCard.svelte, VoiceCard.svelte, MemoryCard.svelte

### Phase 5: DEVHUB OVERLAY
- Ctrl+Shift+. keyboard shortcut
- Floating panel with model control, system status, Clyffy config
- Always accessible in dev mode

**Files:** NEW DevHubOverlay.svelte, keyboard listener in app layout

---

## POA&M (blocked by external work)

| # | Item | Blocker |
|---|------|---------|
| P1 | pool.acquire → router for ORT/Sherpa | Voice/vision use different trait families |
| P2 | llama.cpp FFI backend | devpulse-llama-sys fork not started |
| P3 | Constrained decoding | llguidance fork not wired |
| P4 | Standalone model loader window | Window manager routing |
| P5 | devpulse.app Supabase backend | Needs edge function deployed |

---

*Every owner correction from the prior conversation captured. No aspirational features — these were explicitly demanded and approved.*
