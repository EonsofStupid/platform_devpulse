# SPRINT 1: Fix All Runtime Bugs

| Field | Value |
|-------|-------|
| **Status** | `⚠️ UNVERIFIED — prior session marked COMPLETE but owner has not re-run the 5 checks. Do not trust.` |
| **Parent** | `POAM-MODEL-LOADER-WIZARD.md` (SSOT for the 10 Commandments) |
| **Goal** | Every wizard file compiles. Zero type errors. Zero runtime crashes. Brain minimums enforced. Role colors (Commandment #4) visible on every card. |
| **Max files per phase** | 5 |
| **Verification** | After EVERY edit. Status only flips from UNVERIFIED to VERIFIED when §1.9 of POAM runs green in a single session. |

> The "COMPLETE — ALL 5 CHECKS PASS" claim in an earlier revision of this file
> was written without owner witness and without a re-run after 2026-04-08.
> Status is now `⚠️ UNVERIFIED`. See `POAM-MODEL-LOADER-WIZARD.md` §1.9 for
> the gate that retires UNVERIFIED.

---

## TASKS

### 1.1 ⚠️ UNVERIFIED — Fix ROLE_COLORS — ColdLight vars → --wiz-* vars
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.types.ts`
**Lines:** 78-83
**Bug:** Used `var(--accent-purple-main)`, `var(--brand-green)`, `var(--brand-blue)`, `var(--brand-coral)` — these ColdLight vars DON'T EXIST inside `.wizard-shell` scope. Role colors were INVISIBLE on slot cards, preset borders, completion dots.
**Fix:** Replaced with `var(--wiz-role-brain)`, `var(--wiz-role-minion)`, `var(--wiz-role-encoder)`, `var(--wiz-role-voice)`

### 1.2 ⚠️ UNVERIFIED — Fix WizardState — add missing bulk download properties
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.runes.svelte.ts`
**Bug:** `wizard.service.ts:308-326` calls `wizardState.downloadQueue`, `wizardState.downloadingIndex`, `wizardState.downloadProgress` — none existed. Runtime crash on "Download & Set Up" button.
**Fix:** Added `downloadQueue = $state<ModelRec[]>([])`, `downloadingIndex = $state(-1)`, `downloadProgress = $state(0)`

### 1.3 ⚠️ UNVERIFIED — Fix minion description
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.types.ts`
**Line:** 98
**Bug:** "helpers watching your project" — owner said minions THINK, not just watch.
**Fix:** "specialist helpers thinking about your project"

### 1.4 ⚠️ UNVERIFIED — Fix WelcomeStep avatar border
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/WelcomeStep.svelte`
**Line:** 82
**Bug:** `border: 2px solid var(--wiz-glow-purple)` — `--wiz-glow-purple` is a BOX-SHADOW value (`0 0 12px oklch(...)`) not a color. Border was invisible.
**Fix:** `border: 2px solid var(--wiz-role-brain); box-shadow: var(--wiz-glow-purple);`

### 1.5 ⚠️ UNVERIFIED — Fix HardwareDetectionStep hardcoded oklch
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/HardwareDetectionStep.svelte`
**Line:** 227
**Bug:** `.metric:hover { border-color: oklch(0.63 0.08 173 / 0.35); }` — raw oklch, not a `--wiz-*` var.
**Fix:** `border-color: var(--wiz-border-focus);`

### 1.6 ⚠️ UNVERIFIED — Fix HuggingFaceSearch CSS — all hardcoded oklch
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/HuggingFaceSearch.svelte`
**Lines:** 328-406
**Bug:** ~60 lines of raw `oklch(...)` values. Zero `--wiz-*` vars. Entire style block violated the local CSS rule.
**Fix:** Full rewrite of style block — every color, radius, border, background now uses `--wiz-*` vars.

### 1.7 ⚠️ UNVERIFIED — Fix SearchBrowseStep diagnostics
**File:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/SearchBrowseStep.svelte`
**Bugs:**
- Unused imports `getSlotLabel`, `ROLE_COLORS` (removed)
- `targetSlot` typed as `string` but `trackDownload` expects `SlotId` (added cast)
- No loading state on import button — UI frozen while rfd dialog open (added `importing` state + "Importing — please wait..." text)

### 1.8 ⚠️ UNVERIFIED — Fix auto_config.rs brain minimums
**File:** `kernel/model-loader/src/hardware/auto_config.rs`
**Lines:** 112-118
**Bug:** Low tier brain was 1.7B (Qwen3-1.7B), Minimal/CpuOnly was 0.6B. Both violate 4B minimum for Clyffy brain.
**Fix:** Both now use `bartowski/Qwen3-4B-GGUF` / `Qwen3-4B-Q4_K_M.gguf`. Minion stays 0.6B on all tiers (correct — 4B rule is ONLY for chat.brain).

### 1.9a ⚠️ UNVERIFIED — Fix vision.encoder → vision.embedder (found during svelte-check)
**File:** `wizard.types.ts:112` — `vision.encoder` not a valid `SlotId`, correct is `vision.embedder`

### 1.9b ⚠️ UNVERIFIED — Fix ModelSearch.svelte TextSize "md" → "base"
**File:** `ModelSearch.svelte:248,280,285` — `TextSize` has "base" not "md" (pre-existing)

### 1.10 ⚠️ UNVERIFIED — Verification gate — ALL PASS
```bash
cargo check -p model-loader                # ⚠️ CLAIMED PASS (unverified, re-run required)
cargo check -p devpulse-engine             # ⚠️ CLAIMED PASS (unverified, re-run required)
cargo check -p devpulse_desktop_backend    # ⚠️ CLAIMED PASS (unverified, re-run required) (18 warnings pre-existing, 0 errors)
cd interfaces/desktop && pnpm svelte-check # ⚠️ CLAIMED 0 ERRORS (unverified, re-run required) (25 warnings pre-existing)
npx biome check src/lib/domains/app/models/ --diagnostic-level=warn  # ⚠️ CLAIMED CLEAN (unverified, re-run required)
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
