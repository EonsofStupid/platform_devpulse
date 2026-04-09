RRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRRR# SPRINT 1: Fix All Runtime Bugs

| Field | Value |
|-------|-------|
| **Status** | `COMPLETE — ALL 5 CHECKS PASS` |
| **Parent** | `POAM-MODEL-LOADER-WIZARD.md` |
| **Goal** | Every wizard file compiles. Zero type errors. Zero runtime crashes. Brain minimums enforced. |
| **Max files per phase** | 5 |
| **Verification** | After EVERY edit |

---

## TASKS

### 1.1 ✅ Fix ROLE_COLORS — ColdLight vars → --wiz-* vars
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.types.ts`
**Lines:** 78-83
**Bug:** Used `var(--accent-purple-main)`, `var(--brand-green)`, `var(--brand-blue)`, `var(--brand-coral)` — these ColdLight vars DON'T EXIST inside `.wizard-shell` scope. Role colors were INVISIBLE on slot cards, preset borders, completion dots.
**Fix:** Replaced with `var(--wiz-role-brain)`, `var(--wiz-role-minion)`, `var(--wiz-role-encoder)`, `var(--wiz-role-voice)`

### 1.2 ✅ Fix WizardState — add missing bulk download properties
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.runes.svelte.ts`
**Bug:** `wizard.service.ts:308-326` calls `wizardState.downloadQueue`, `wizardState.downloadingIndex`, `wizardState.downloadProgress` — none existed. Runtime crash on "Download & Set Up" button.
**Fix:** Added `downloadQueue = $state<ModelRec[]>([])`, `downloadingIndex = $state(-1)`, `downloadProgress = $state(0)`

### 1.3 ✅ Fix minion description
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.types.ts`
**Line:** 98
**Bug:** "helpers watching your project" — owner said minions THINK, not just watch.
**Fix:** "specialist helpers thinking about your project"

### 1.4 ✅ Fix WelcomeStep avatar border
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/WelcomeStep.svelte`
**Line:** 82
**Bug:** `border: 2px solid var(--wiz-glow-purple)` — `--wiz-glow-purple` is a BOX-SHADOW value (`0 0 12px oklch(...)`) not a color. Border was invisible.
**Fix:** `border: 2px solid var(--wiz-role-brain); box-shadow: var(--wiz-glow-purple);`

### 1.5 ✅ Fix HardwareDetectionStep hardcoded oklch
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/HardwareDetectionStep.svelte`
**Line:** 227
**Bug:** `.metric:hover { border-color: oklch(0.63 0.08 173 / 0.35); }` — raw oklch, not a `--wiz-*` var.
**Fix:** `border-color: var(--wiz-border-focus);`

### 1.6 ✅ Fix HuggingFaceSearch CSS — all hardcoded oklch
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/HuggingFaceSearch.svelte`
**Lines:** 328-406
**Bug:** ~60 lines of raw `oklch(...)` values. Zero `--wiz-*` vars. Entire style block violated the local CSS rule.
**Fix:** Full rewrite of style block — every color, radius, border, background now uses `--wiz-*` vars.

### 1.7 ✅ Fix SearchBrowseStep diagnostics
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/SearchBrowseStep.svelte`
**Bugs:**
- Unused imports `getSlotLabel`, `ROLE_COLORS` (removed)
- `targetSlot` typed as `string` but `trackDownload` expects `SlotId` (added cast)
- No loading state on import button — UI frozen while rfd dialog open (added `importing` state + "Importing — please wait..." text)

### 1.8 ✅ Fix auto_config.rs brain minimums
**File:** `kernel/model-loader/src/hardware/auto_config.rs`
**Lines:** 112-118
**Bug:** Low tier brain was 1.7B (Qwen3-1.7B), Minimal/CpuOnly was 0.6B. Both violate 4B minimum for Clyffy brain.
**Fix:** Both now use `bartowski/Qwen3-4B-GGUF` / `Qwen3-4B-Q4_K_M.gguf`. Minion stays 0.6B on all tiers (correct — 4B rule is ONLY for chat.brain).

### 1.9a ✅ Fix vision.encoder → vision.embedder (found during svelte-check)
**File:** `wizard.types.ts:112` — `vision.encoder` not a valid `SlotId`, correct is `vision.embedder`

### 1.9b ✅ Fix ModelSearch.svelte TextSize "md" → "base"
**File:** `ModelSearch.svelte:248,280,285` — `TextSize` has "base" not "md" (pre-existing)

### 1.10 ✅ Verification gate — ALL PASS
```bash
cargo check -p model-loader                # ✅ PASSED
cargo check -p devpulse-engine             # ✅ PASSED
cargo check -p devpulse_desktop_backend    # ✅ PASSED (18 warnings pre-existing, 0 errors)
cd interfaces/desktop && pnpm svelte-check # ✅ 0 ERRORS (25 warnings pre-existing)
npx biome check src/lib/domains/app/models/ --diagnostic-level=warn  # ✅ CLEAN
```

**Sprint 1 is NOT DONE until all 5 verification checks pass.**

---

## ACCEPTANCE CRITERIA

- [ ] `cargo check -p model-loader` — 0 errors
- [ ] `cargo check -p devpulse-engine` — 0 errors
- [ ] `cargo check -p devpulse_desktop_backend` — 0 errors
- [ ] `pnpm svelte-check` — 0 errors
- [ ] `npx biome check` — 0 errors/warnings
- [ ] chat.brain = 4B minimum on ALL hardware tiers
- [ ] minion.shared = 0.6B on all tiers (unchanged)
- [ ] Zero ColdLight vars in wizard CSS (all `--wiz-*`)
- [ ] Zero hardcoded oklch in wizard CSS
- [ ] All ROLE_COLORS resolve to visible colors
- [ ] `bulkDownloadAndAssign` won't crash (state properties exist)
- [ ] Import button shows loading state during file dialog
