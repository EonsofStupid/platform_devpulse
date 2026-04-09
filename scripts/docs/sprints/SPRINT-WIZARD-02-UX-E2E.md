# SPRINT 2: Commercial-Quality UX + E2E Testing

| Field | Value |
|-------|-------|
| **Status** | `READY FOR TESTING — run cargo xtask run-dev then pnpm test:e2e:ui` |
| **Parent** | `POAM-MODEL-LOADER-WIZARD.md` |
| **Depends on** | Sprint 1 verification gate (all 5 checks green) |
| **Goal** | A layman can configure Clyffy, load models, see real progress. Proven by E2E tests in vitest-browser where Jesse watches. |
| **Max files per phase** | 5 |

---

## PHASE A: Search & Download UX Overhaul (3 files)

### A.1 SearchBrowseStep.svelte — Make HF search PROMINENT
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/SearchBrowseStep.svelte`

**Current state:** Two small tabs — "On Your Computer" and "Search Online". The online tab is tiny, easy to miss. No messaging about what's happening during downloads. Import button now has loading state (Sprint 1.7).

**Changes:**
- "Search Online" tab: larger font, cyan accent border, icon bigger
- Add subheading under tab bar: "Search HuggingFace for thousands of AI models"
- When downloading from search: show inline progress bar below the download button (not just a toast)
- Add help text: "GGUF = single file, ready to use. SafeTensors = may have multiple parts."
- When no search yet: show popular suggestions "Try: Qwen3, Llama, Mistral, Phi"
- Download progress: inline per-file "Downloading... 2.3 / 4.9 GB — about 4 min left"

**Vitest-browser test:** Tab renders, click "Search Online", search for "Qwen3", results appear, download button visible with slot selector.

### A.2 HuggingFaceSearch.svelte — Clear loading/progress messaging
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/HuggingFaceSearch.svelte`

**Current state:** CSS fixed (Sprint 1.6). But search button is small. Loading state is a generic spinner. Results are dense. No ETA on downloads.

**Changes:**
- Search button: full-width, prominent, `--wiz-cyan` background
- During search: "Searching HuggingFace..." centered with animated spinner, min-height so layout doesn't jump
- Results: larger cards with clear model name (strip `-Q4_K_M.gguf` suffix for display)
- Per-file download: show slot assignment + progress inline
  - "Downloading Clyffy's Brain... 2.3 / 4.9 GB"
  - After complete: "✓ Downloaded — assigning to Clyffy's Brain..."
- Error state: action buttons (Retry / Try Different / Skip) — not just red text
- Empty: "No models found. Try searching for 'Qwen3' or 'Llama'"
- Disk space: warning BEFORE download if not enough space

**Vitest-browser test:** Search renders, type query, search executes, results cards show with download buttons, slot chips selectable.

### A.3 ModelsStep.svelte — Step-by-step download progress
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/ModelsStep.svelte`

**Current state:** Has download queue UI but messages are minimal. No ETA. No step-by-step progress.

**Changes:**
- When "Download & Set Up" clicked, show numbered steps:
  1. "Downloading Clyffy's Brain..." (progress bar with %)
  2. "Downloading Minion Core..." (progress bar)
  3. "Downloading Memory Search..." (progress bar)
  4. "Setting up..." (spinner)
  5. "✓ Ready!" (green check, celebration)
- Each download shows: friendly name, progress bar, size, ETA
- Cancel button per download
- After download: "Loading into GPU memory..." with spinner
- If model already local: "✓ Already on your computer" (no download needed)

**Vitest-browser test:** PresetCard renders with recommendations, click "Download & Set Up", download queue appears with friendly names and progress bars.

---

## PHASE B: Loading States Everywhere (3 files)

### B.1 SlotCard.svelte — Real-time slot status with feedback
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/components/SlotCard.svelte`

**Current state:** Shows status badge but no animated feedback. No tooltips.

**Changes:**
- Loading: animated pulse on status badge + "Loading into memory..."
- Loaded/Ready: green check with brief flash animation
- Failed: red X with "Retry" and "Change" action buttons (Commandment #8)
- Tooltip on hover over status: explain what it means in layman terms
  - Ready: "This model is loaded and ready to use"
  - Loading: "Loading model into GPU memory — this takes a few seconds"
  - Assigned: "Model selected but not yet loaded"
  - Empty: "No model selected — click Change to pick one"

**Vitest-browser test:** SlotCard renders for each role, role color border visible, Change button opens popup.

### B.2 VramBar.svelte — Live segments with role colors
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/components/VramBar.svelte`

**Current state:** Shows total allocated vs total. No per-model breakdown.

**Changes:**
- Segmented bar: each model gets its own colored segment using role color
- Tooltip on hover: "Clyffy's Brain: 3.2 GB | Minion Core: 0.4 GB | Free: 6.4 GB"
- When model loading: animated fill for that segment
- Show model count: "4 models using 5.2 GB of 10.0 GB GPU memory"

**Vitest-browser test:** VramBar renders, segments visible with role colors, tooltip shows breakdown.

### B.3 ClyfActivationStep.svelte — Inference loading feedback
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/ClyfActivationStep.svelte`

**Current state:** "Thinking..." text during inference. No visual feedback if brain not loaded.

**Changes:**
- When brain not loaded: prominent CTA card "Clyffy's Brain isn't ready yet"
  - "Go back and download it" button (navigates to ModelsStep)
  - "Skip for now" link
- When sending: animated brain pulse icon + "Clyffy is thinking..."
- First successful response: brief celebration "Clyffy is working!"
- Voice toggle: if TTS not available, show "Download Voice Output to enable speech"
- Exchange counter: more prominent, show as progress bar not just dots

**Vitest-browser test:** Chat renders, send message, response appears, exchange counter updates.

---

## PHASE C: E2E Tests with vitest-browser (Jesse watches)

### C.0 Test Infrastructure Setup
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/__tests__/setup.ts`

- vitest-browser config: opens real Chromium window
- Test utilities:
  - `mockInvoke(command, response)` — mock Tauri `invoke()` calls
  - `mockHardwareState(vramMb, gpuName)` — mock hardware detection
  - `mockModelsState(models, slots)` — mock model registry
  - `mockDownloadEvents(events)` — mock download progress events
- Mount helper: renders component inside `.wizard-shell` div (so `--wiz-*` vars cascade)

### C.1 Test: Welcome → Hardware → Models happy path
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/__tests__/happy-path.browser.test.ts`

```
- Render WelcomeStep with mocked hardware (RTX 3080, 10GB VRAM)
- Assert: GPU name visible, VRAM visible, "Let's Go" button enabled
- Click "Let's Go"
- Assert: transitions to HardwareDetectionStep
- Assert: tier badge shows "Mainstream" with green color
- Assert: VRAM bar visible with usage %
- Assert: tooltips appear on hover over metrics
- Click "Continue"
- Assert: transitions to ModelsStep
- Assert: PresetCard shows "Recommended for your RTX 3080"
- Assert: role color borders visible (not transparent)
- Assert: VramBar shows budget at bottom
- Assert: "Download & Set Up" button visible and enabled
```

### C.2 Test: Download & Set Up flow
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/__tests__/download-flow.browser.test.ts`

```
- Render ModelsStep with mocked recommendations (3 models)
- Click "Download & Set Up"
- Assert: download queue appears
- Assert: each download shows friendly name (not technical filename)
- Mock download progress events (50%, 75%, 100%)
- Assert: progress bars update
- Assert: completed downloads show green check
- Assert: success message appears when all done
```

### C.3 Test: Search & Browse flow
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/__tests__/search-browse.browser.test.ts`

```
- Render SearchBrowseStep
- Assert: "On Your Computer" tab active by default
- Assert: Import button visible and says "Import Model from File"
- Click "Search Online" tab
- Assert: tab switches, search input visible
- Assert: search input has placeholder "Search for models..."
- Type "Qwen3" and click Search
- Mock search results (2 repos)
- Assert: result cards appear with model name and author
- Assert: GGUF files show with download buttons
- Assert: slot selector chips visible
- Click download
- Assert: downloading state visible
```

### C.4 Test: Customize flow
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/__tests__/customize.browser.test.ts`

```
- Render CustomizeStep with mocked slots (7 slots, 4 assigned)
- Assert: slot cards grouped by role (Thinking, Watching, Understanding, Talking)
- Assert: role color borders visible on each group
- Assert: assigned slots show model name + "Ready"/"Assigned" badge
- Assert: empty slots show "Not set up"
- Click "Change" on first slot
- Assert: SlotSwapPopup opens
- Assert: 2-4 model options shown with "Recommended" badge on best fit
- Assert: "Browse all models" link at bottom
- Click recommended model
- Assert: popup closes, slot updated
```

### C.5 Test: Completion summary
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/__tests__/completion.browser.test.ts`

```
- Render CompletionStep with mocked state (5/7 slots ready)
- Assert: "You're All Set!" heading
- Assert: "5 of 7 capabilities ready" count
- Assert: each slot row shows role color dot
- Assert: ready slots show green dot, empty show gray
- Assert: "Launch DevPulse" button enabled
- Assert: "You can change models anytime from Settings" hint visible
```

### C.6 Test: Error handling
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/__tests__/error-handling.browser.test.ts`

```
- Render ModelsStep, trigger download failure
- Assert: error box appears with message
- Assert: "Retry" button visible
- Assert: "Pick manually" button visible
- Assert: "Skip for now" button visible
- Click "Retry"
- Assert: download restarts
```

---

## PHASE D: Verification

```bash
# Type safety
cd interfaces/desktop && pnpm svelte-check        # 0 errors

# Lint
npx biome check src/lib/domains/app/models/ --diagnostic-level=warn  # 0 errors

# E2E tests (Jesse watches in Chromium)
pnpm vitest run --browser src/lib/domains/app/models/features/setup-wizard/__tests__/

# Rust (in case any Tauri command types changed)
cargo check -p devpulse_desktop_backend
```

---

## ACCEPTANCE CRITERIA

- [ ] Layman can complete wizard without knowing AI terminology
- [ ] HuggingFace search is prominent: large tab, clear messaging, easy to use
- [ ] Every loading state has visible feedback: spinner, progress bar, message
- [ ] Download progress: per-model, friendly name, progress bar, ETA
- [ ] Import: "Importing..." shown while file dialog open
- [ ] Model loading: "Loading into GPU memory..." feedback
- [ ] Inference: "Clyffy is thinking..." with animation
- [ ] Errors always have action buttons (Retry / Change / Skip)
- [ ] Role colors visible on slot cards, preset borders, completion dots
- [ ] VramBar shows segmented usage with role colors
- [ ] 6 E2E test suites pass in vitest-browser
- [ ] Jesse can watch all tests execute in real Chromium
- [ ] Zero svelte-check errors
- [ ] Zero biome errors
- [ ] Zero hardcoded oklch in any wizard file

---

## EXECUTION ORDER

1. Phase A.1 → A.2 → A.3 (search/download UX)
2. Verify: svelte-check + biome
3. Phase B.1 → B.2 → B.3 (loading states)
4. Verify: svelte-check + biome
5. Phase C.0 (test infra)
6. Phase C.1 → C.2 → C.3 → C.4 → C.5 → C.6 (tests)
7. Phase D (full verification — Jesse watches)

**DO NOT skip phases. DO NOT start Phase B before Phase A passes verification.**
