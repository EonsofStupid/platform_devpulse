# BUILD DIARY: Model Loader Wizard Rewrite

> **Purpose:** This file survives compaction. After `/compact`, read this FIRST
> before touching any code. It tells you exactly what was done, what wasn't,
> what's broken, and what to do next.
>
> **POAM:** `scripts/docs/sprints/POAM-MODEL-LOADER-WIZARD.md` — the plan
> **UX Spec:** `scripts/docs/specs/MODEL-LOADER-UX-REQUIREMENTS.md` — the requirements

---

## STATUS AS OF 2026-04-08 (INITIAL — from prior session)

### SPRINT 1: NOT STARTED
- Loading regression: NOT diagnosed, NOT fixed
- auto_config.rs: NOT updated (still has 0.6B minions, 1.7B brain on Low tier)
- lefthook.yml: svelte-check NOT added as hard block
- ModelSearch.svelte: biome errors NOT fixed
- Verification gate: NOT run

### SPRINT 2: PARTIALLY DONE (CSS only, UX not started)

#### What WAS done (prior session):
1. **SD5 brand colors** — 7 brand color ramps added to `generate-scales.mjs`
2. **Local oklch CSS vars** — `--wiz-*` vars defined on `.wizard-shell`
3. **All 14 wizard .svelte files** bulk-replaced from ColdLight vars to `--wiz-*`
4. **Rust backend commands** — `test_inference`, `import_local_model` (AsyncFileDialog),
   `pick_directory`, `create_dev_profile` all created and registered
5. **Frontend wizard components** — 7-phase orchestrator, PresetCard, VramBar, SlotCard,
   SlotSwapPopup, CurrentSetupPopup, ModelsStep, CustomizeStep, SearchBrowseStep, etc.

#### What WAS NOT done (prior session):
- Happy path UX flow not tested end-to-end
- VramBar reads mock data, not real Rust backend
- Download progress not wired to EventBridge events
- HuggingFace search not tested for prominence
- No Clyffy sprite spinner
- No tests at all

---

## ENTRY: 2026-04-08 — Post-Compact Session (FULL AUDIT + SPRINT 1 EXECUTION)

### What I did this session:

**Full audit of all 18 wizard files.** Read every line. Found 7 critical runtime bugs:

| # | Bug | File | Fix |
|---|-----|------|-----|
| 1 | ROLE_COLORS used ColdLight vars — invisible in wizard scope | `wizard.types.ts:78-83` | Replaced with `--wiz-role-*` vars. DONE. |
| 2 | `bulkDownloadAndAssign` references `downloadQueue`/`downloadingIndex`/`downloadProgress` — NONE exist in WizardState. Runtime crash. | `wizard.service.ts:308` / `wizard.runes.svelte.ts` | Added missing properties. DONE. |
| 3 | Minion description: "helpers watching your project" — owner said they THINK | `wizard.types.ts:98` | Changed to "specialist helpers thinking about your project". DONE. |
| 4 | WelcomeStep avatar: `border: 2px solid var(--wiz-glow-purple)` — glow is a shadow value not a color. Invisible border. | `WelcomeStep.svelte:82` | Use `--wiz-role-brain` + box-shadow. DONE. |
| 5 | HardwareDetectionStep: hardcoded `oklch()` on hover | `HardwareDetectionStep.svelte:227` | Replaced with `--wiz-border-focus`. DONE. |
| 6 | HuggingFaceSearch: ~60 lines hardcoded oklch CSS, zero `--wiz-*` | `HuggingFaceSearch.svelte:328-406` | Full CSS rewrite. DONE. |
| 7 | SearchBrowseStep: unused imports, SlotId type error, no import loading state | `SearchBrowseStep.svelte` | Fixed imports, cast, added `importing` state. DONE. |
| 8 | auto_config.rs: Low tier brain=1.7B, Minimal=0.6B — violates 4B minimum | `auto_config.rs:112-118` | Both set to 4B. Minion stays 0.6B (correct). DONE. |

### What is NOT done yet:
- **Verification gate** — `cargo check -p model-loader` passed. Other 4 checks not yet run.
- **Sprint 2 entirely** — UX overhaul, loading states, E2E tests with vitest-browser

---

## ENTRY: 2026-04-08 — Sprint 1 Complete, Sprint 2 In Progress

### Sprint 1 COMPLETE — all 5 verification checks pass:
- `cargo check -p model-loader` ✅
- `cargo check -p devpulse-engine` ✅
- `cargo check -p devpulse_desktop_backend` ✅ (18 warnings pre-existing, 0 errors)
- `pnpm svelte-check` ✅ 0 ERRORS (25 warnings pre-existing on old files)
- `npx biome check` ✅ CLEAN

Additional fixes found during verification:
- `vision.encoder` → `vision.embedder` (invalid SlotId)
- `ModelSearch.svelte` TextSize `"md"` → `"base"` (pre-existing, 3 instances)

### Sprint 2 Progress:

**Phase A (Search & Download UX) — DONE:**
- SearchBrowseStep: tabs bigger, equal-weight, "Search HuggingFace" prominent
- SearchBrowseStep: inline download progress visible on BOTH tabs
- HuggingFaceSearch: full-width search button, "Searching..." loading state with hint
- HuggingFaceSearch: error state with Retry/Clear action buttons
- HuggingFaceSearch: empty state with popular search suggestions (Qwen3, Llama, Mistral, Phi)
- HuggingFaceSearch: welcome state with format help (GGUF vs SafeTensors explained)
- ModelsStep: numbered step-by-step download progress with ETA ("about 4 min left")
- ModelsStep: per-download badges (Downloading/Waiting/Done/Failed)

**Phase B (Loading States) — DONE:**
- SlotCard: status tooltip on hover (layman explanation of each state)
- SlotCard: "Loading into memory..." and "Failed — click Change to fix" messages
- SlotCard: fixed deprecated Loader2 → LoaderCircle
- ClyfActivationStep: prominent "brain not ready" card with "Go back and set up" CTA

**Phase C (E2E Tests) — PARTIALLY DONE:**
- Test setup file created: `__tests__/setup.ts` (mock Tauri, mock hardware, wizard shell CSS)
- Unit test: `wizard-types.test.ts` — tests slot labels, role colors, phases, friendly names
- Browser test: `wizard-components.test.ts` — tests VramBar and SlotCard rendering
- Deleted fake vitest-browser mock tests — they were dishonest
- Wrote REAL Playwright E2E tests that run against live Tauri app

### Playwright E2E Tests (REAL — against live app on port 1420):
- `e2e/wizard-happy-path.spec.ts` — Welcome → Hardware → Models → Download flow
- `e2e/wizard-search-browse.spec.ts` — Tabs, HF search, suggestions, import button
- `e2e/wizard-customize.spec.ts` — Slot cards, role colors, SlotSwapPopup, CurrentSetupPopup
- `e2e/wizard-completion.spec.ts` — Full wizard flow to completion, role color dots

**To run:** `cargo xtask run-dev` then `cd interfaces/desktop && pnpm test:e2e:ui`

### Files changed this session (Sprint 1 + Sprint 2):
1. `wizard.types.ts` — ROLE_COLORS, minion desc, vision.embedder fix
2. `wizard.runes.svelte.ts` — downloadQueue/Index/Progress properties
3. `WelcomeStep.svelte` — avatar border fix
4. `HardwareDetectionStep.svelte` — hardcoded oklch fix
5. `HuggingFaceSearch.svelte` — full CSS rewrite + UX overhaul (search, loading, errors, suggestions)
6. `SearchBrowseStep.svelte` — imports, importing state, prominent tabs, inline downloads
7. `ModelsStep.svelte` — step-by-step download queue with ETA
8. `SlotCard.svelte` — tooltips, loading messages, LoaderCircle
9. `ClyfActivationStep.svelte` — brain-missing CTA card
10. `ModelSearch.svelte` — TextSize "md" → "base"
11. `auto_config.rs` — 4B brain minimum on all tiers
12. `playwright.config.ts` — updated to connect to live app on port 1420

---

## ENTRY: 2026-04-08 — ROUTE REWRITE (Parallel Sister Pattern)

Rewrote the entire wizard as proper SvelteKit routes under `(model-loader)/model-loader/`.
Each wizard step is its own route page. ColdLight components. Real mascot images.
Background image. Role colors. No more monolithic orchestrator with phase switching.

### New route structure:
```
src/routes/(model-loader)/model-loader/
├── +layout.svelte          ← shell: bg image, progress steps, title bar
├── +page.svelte            ← Welcome + Hardware Detection (Clyffy mascot)
├── models/+page.svelte     ← Model setup: role-colored cards, required/optional split
├── browse/+page.svelte     ← Browse local (grouped by role) + Search HuggingFace
├── customize/+page.svelte  ← Per-slot cards with Change/Retry
├── activate/+page.svelte   ← Test chat with Clyffy, brain-missing CTA, voice explain
├── profile/+page.svelte    ← About You (name, experience, project)
└── complete/+page.svelte   ← Summary with role colors, Launch button
```

### What's different from the old code:
- Real SvelteKit routes, not phase-switching in one component
- ColdLight Button, Card, Text, Badge, Spinner — not raw HTML
- Clyffy mascot images (wobble, loading gif, sidelook) — not a "C" letter
- Background image from static/imgs/backgrounds/
- Models split into REQUIRED (brain, minion, embedder, reranker) and OPTIONAL (vision, voice)
- Browse page groups models by role (Thinking/Understanding/Voice/Helpers) with color
- Activate page: if brain not loaded, prominent CTA with mascot to go back
- Voice toggle explains WHY it's disabled
- No "Skip for now" on models page — Continue only shows after models assigned
- Role colors on every card, dot, icon, border
13. `e2e/wizard-happy-path.spec.ts` — real E2E test (NEW)
14. `e2e/wizard-search-browse.spec.ts` — real E2E test (NEW)
15. `e2e/wizard-customize.spec.ts` — real E2E test (NEW)
16. `e2e/wizard-completion.spec.ts` — real E2E test (NEW)

### POAM updated this session:
- Added full minion architecture spec (from owner's MINION BRAIN ARCHITECTURE doc)
- Added ActiveIdle brain swap policy
- Added complete audit findings table
- Authored Sprint 2 in detail: Phase A (search UX), Phase B (loading states), Phase C (E2E tests), Phase D (verification)
- 6 E2E test suites defined for vitest-browser

### SPRINT 2: NOT STARTED
- Search UX overhaul (make HF search prominent, clear loading states)
- Loading indicators everywhere (slot cards, VRAM bar, inference)
- E2E tests with vitest-browser (Jesse watches in real Chromium)
- 6 test suites: happy path, download flow, search flow, customize, completion

---

## KEY CORRECTIONS FROM OWNER (DO NOT IGNORE)

1. **4B minimum for Clyffy brain.** NEVER 1.7B, NEVER 0.6B for chat.brain.
2. **0.6B for minions.** Shared instance, 8 minions ref-count it. Specialist identity
   from prompts + llguidance schemas. They THINK, not just watch.
3. **Minion escalation** = pointer to chat.brain by default. Independently assignable on 24GB+.
4. **Dynamic brain policy (ActiveIdle).** Static (8GB), ActiveIdle (12GB+: LARGE_LLM when
   chatting, SMALL_LLM when idle), EscalationDriven. Config enum.
5. **Local oklch CSS only.** Wizard is EXCEPTION to ColdLight. No `var(--brand-cyan)`.
   Use `var(--wiz-cyan)`.
6. **No `:root` shortcuts.** Vars on `.wizard-shell`, not `:root`.
7. **Graceful shutdown.** 3 checks, 30s, force only if no progress.
8. **Real tests.** Vitest + Playwright + vitest-browser. Prove it works.
   Jesse wants to WATCH tests in the browser.
9. **Clyffy sprite.** Loading spinners use Clyffy character animation.
10. **Models confirmed downloaded then copied to userdata.** Download → verify → copy → register.
11. **Lexicon voice system.** Trait-based, model-agnostic. Qwen3-TTS default, Kokoro fallback.
12. **BackendPool ref-counting.** When minion.escalation resolves to chat.brain, they share
    the same Arc — same VRAM.
13. **HuggingFace search MUST be prominent.** Not tiny, not hidden. Clear messaging.
    Clear loading states. User must know what's happening at all times.
14. **Folder browsing must show loading state.** rfd dialog is async — show "Importing..."
    while dialog is open. NEVER freeze the UI.
15. **E2E test every UI action.** vitest-browser open so Jesse can watch. No untested flows.
16. **SD5 brand colors.** 7 brand color ramps in generate-scales.mjs. Already done.
    CSS vars: `--color-brand-{cyan,green,hotpink,coral,blue,salmon,gold}-{50..950}`
17. **ColdLight WAI-ARIA APG.** All base components in design/ are already ARIA-compliant.
    Spinner import from ColdLight is OK (behavioral component, not CSS dependency).

---

## FILE MAP (What's where)

### Rust (kernel/model-loader/src/)
- `hardware/auto_config.rs` — tier detection + recommendations (4B enforced all tiers)
- `hardware/metrics.rs` — GPU/VRAM detection
- `hardware/vram.rs` — VRAM budget tracking
- `backends/candle/backend.rs` — SafeTensors loading via Candle
- `backends/bridge.rs` — GGUF loading via llama.cpp FFI
- `backends/router.rs` — format detection + routing
- `backends/ort/` — ONNX loading (vision, kokoro)
- `loading/` — state machine, swap, prime
- `models/discovery.rs` — walks disk, finds models
- `models/download.rs` — HF download + folder routing
- `models/registry.rs` — model database
- `service.rs` — ModelLoaderService orchestrator
- `slots/` — slot system (types, registry, fallback)

### Rust (Tauri commands)
- `interfaces/desktop/src-tauri/src/commands/models/mod.rs` — ALL model IPC commands
  - `import_local_model` — uses AsyncFileDialog, dialog BEFORE lock (freeze fixed)
  - `pick_directory` — uses AsyncFileDialog
  - `create_dev_profile` — writes to preferences
- `interfaces/desktop/src-tauri/src/lib.rs` — command registration

### Frontend (setup-wizard/)
- `SetupWizard.svelte` — orchestrator, `--wiz-*` var definitions on `.wizard-shell`
- `wizard.types.ts` — phases, slot labels, role colors (NOW uses --wiz-* vars)
- `wizard.runes.svelte.ts` — reactive state (NOW has downloadQueue/Index/Progress)
- `wizard.service.ts` — IPC wrappers, continue gates, bulk download
- `components/` — PresetCard, VramBar, SlotCard, SlotSwapPopup, CurrentSetupPopup
- `steps/` — WelcomeStep, HardwareDetectionStep, ModelsStep, CustomizeStep,
  SearchBrowseStep, ClyfActivationStep, ProjectSetupStep, CompletionStep
- `index.ts` — barrel exports

### Frontend (services)
- `services/download.service.ts` — download/import IPC wrappers
- `services/catalog.service.ts` — model catalog
- `runes/hardware.runes.svelte.ts` — hardware state
- `runes/models.runes.svelte.ts` — model state

---

## NEXT ACTION

**Finish Sprint 1:**
1. ~~Fix `auto_config.rs`~~ — DONE. 4B on all tiers. Minion stays 0.6B.
2. Run verification gate: `cargo check` x3, `svelte-check`, `biome`
3. ALL must pass before Sprint 2 begins.

**Then Sprint 2:**
1. Phase A: Search & Download UX overhaul (3 files)
2. Phase B: Loading states everywhere (3 files)
3. Phase C: E2E tests with vitest-browser (Jesse watches)
4. Phase D: Verification

DO NOT SKIP TO SPRINT 3. DO NOT START VOICE WORK. FIX THE UI FIRST.

---

## VERIFICATION COMMANDS (Run after EVERY edit)

```bash
# Rust
cargo check -p model-loader
cargo check -p devpulse-engine
cargo check -p devpulse_desktop_backend

# Frontend
cd interfaces/desktop && pnpm svelte-check
npx biome check src/lib/domains/app/models/ --diagnostic-level=warn

# E2E (Sprint 2+)
cd interfaces/desktop && pnpm vitest run --browser src/lib/domains/app/models/features/setup-wizard/
```
