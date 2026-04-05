# Sprint 8: Orchestrator — SetupWizard.svelte + BootOverlay + Delete Old

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md |
| **Status** | `PLANNED` |
| **Files** | 1 new, 3 modified, 1 deleted |
| **Depends on** | ALL prior sprints (1-7) — this wires everything together |
| **CRITICAL** | This sprint changes the boot path. Must be verified end-to-end. |

---

## PRE-FLIGHT

1. Read ALL step components from Sprint 2-7 — verify they exist and have correct props
2. Read `BootOverlay.svelte` — confirm current import path and wizard container
3. Read `models/index.ts` — confirm current SetupWizard export path
4. Grep for ALL references to `components/SetupWizard.svelte` — collect every file that imports it
5. Read `wizardState` — confirm all phase state fields exist
6. Read `evaluateContinueGate` in wizard.service.ts — confirm all 5 phases handled

---

## FILE 1 (CREATE): `features/setup-wizard/SetupWizard.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/SetupWizard.svelte`

**Purpose:** Main orchestrator. Phase progress indicator. Renders current phase component. Continue gates enforced. Full viewport — NO wrapper chrome.

**Props:**
```typescript
interface Props {
  onComplete?: () => void;
}
```

**Imports:**
```typescript
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hardwareState } from "../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../runes/models.runes.svelte.js";
import { wizardState } from "./wizard.runes.svelte.js";
import {
  checkOnboardingComplete,
  evaluateContinueGate,
  startHardwareScan,
  fetchRecommendations,
  markOnboardingComplete,
} from "./wizard.service.js";
import { PHASE_INFO, WIZARD_PHASES, type WizardPhase } from "./wizard.types.js";
```

**Lifecycle:**
```typescript
let { onComplete }: Props = $props();
let initialized = $state(false);

$effect(() => {
  init();
});

async function init(): Promise<void> {
  // Check if onboarding already completed (subsequent launch)
  const done = await checkOnboardingComplete();
  if (done) {
    onComplete?.();
    return;
  }
  
  // Start fresh — init hardware and models
  await hardwareState.startListening();
  await modelsState.refresh();
  initialized = true;
}
```

**Phase progress indicator:**
```svelte
<div class={hstack({ gap: "4", align: "center", justify: "center" })}>
  {#each PHASE_INFO as info, i (info.phase)}
    {@const isCurrent = info.phase === wizardState.currentPhase}
    {@const isDone = i < wizardState.currentPhaseIndex}
    <div class={hstack({ gap: "2", align: "center" })}>
      <span
        class="inline-block w-2.5 h-2.5 rounded-full transition-colors"
        style="background: {isDone ? 'var(--signal-success)' : isCurrent ? 'var(--accent-teal-main)' : 'var(--border-subtle)'};"
      ></span>
      <Text
        size="xs"
        color={isCurrent ? "primary" : isDone ? "secondary" : "muted"}
        weight={isCurrent ? "bold" : "normal"}
      >
        {info.label}
      </Text>
    </div>
    {#if i < PHASE_INFO.length - 1}
      <span class="w-8 h-px" style="background: var(--border-subtle);"></span>
    {/if}
  {/each}
</div>
```

**Phase rendering (dynamic import for code splitting):**
```svelte
{#if initialized}
  {#if wizardState.currentPhase === "hardware"}
    {#await import("./steps/WelcomeStep.svelte") then mod}
      <!-- Show welcome first, then hardware detection -->
      {#if !wizardState.hardwareScanned}
        <mod.default onContinue={handleWelcomeContinue} />
      {:else}
        {#await import("./steps/HardwareDetectionStep.svelte") then hwMod}
          <hwMod.default
            onContinue={handleAdvance}
            continueEnabled={currentGate.allMet}
          />
        {/await}
      {/if}
    {/await}
  {:else if wizardState.currentPhase === "models"}
    {#await import("./steps/ModelLoaderStep.svelte") then mod}
      <mod.default
        onContinue={handleAdvance}
        onBack={handleBack}
        continueEnabled={currentGate.allMet}
        continueBlockers={currentGate.blockers}
      />
    {/await}
  {:else if wizardState.currentPhase === "voice"}
    {#await import("./steps/VoicePipelineStep.svelte") then mod}
      <mod.default
        onContinue={handleAdvance}
        onBack={handleBack}
        continueEnabled={currentGate.allMet}
        continueBlockers={currentGate.blockers}
      />
    {/await}
  {:else if wizardState.currentPhase === "clyffy"}
    {#await import("./steps/ClyfActivationStep.svelte") then mod}
      <mod.default
        onContinue={handleAdvance}
        onBack={handleBack}
        continueEnabled={currentGate.allMet}
        continueBlockers={currentGate.blockers}
      />
    {/await}
  {:else if wizardState.currentPhase === "project"}
    {#await import("./steps/ProjectSetupStep.svelte") then mod}
      <mod.default
        onContinue={handleComplete}
        onBack={handleBack}
      />
    {/await}
  {/if}
{:else}
  <Text size="sm" color="muted">Initializing...</Text>
{/if}
```

**Navigation handlers:**
```typescript
const currentGate = $derived(evaluateContinueGate(wizardState.currentPhase));

async function handleWelcomeContinue(): Promise<void> {
  await startHardwareScan();
  await fetchRecommendations();
}

function handleAdvance(): void {
  const gate = evaluateContinueGate(wizardState.currentPhase);
  if (!gate.allMet) return;
  
  const idx = WIZARD_PHASES.indexOf(wizardState.currentPhase);
  if (idx < WIZARD_PHASES.length - 1) {
    wizardState.currentPhase = WIZARD_PHASES[idx + 1];
  }
}

function handleBack(): void {
  const idx = WIZARD_PHASES.indexOf(wizardState.currentPhase);
  if (idx > 0) {
    wizardState.currentPhase = WIZARD_PHASES[idx - 1];
  }
}

async function handleComplete(): Promise<void> {
  await markOnboardingComplete();
  onComplete?.();
}
```

**Root element — FULL VIEWPORT:**
```svelte
<div
  class={cn(
    stack({ gap: "6", align: "center" }),
    "w-full h-full overflow-y-auto scrollbar-thin p-6",
  )}
  style="background: var(--surface-base); color: var(--text-primary);"
  data-component="setup-wizard"
>
  <!-- Phase indicator -->
  <!-- Current phase content -->
</div>
```

**Verification:**
- [ ] `checkOnboardingComplete()` called on init — skips if already done
- [ ] Phase progress indicator shows 5 dots with correct colors
- [ ] Dynamic imports for code splitting — each step loaded on demand
- [ ] Continue gates enforced — `handleAdvance` checks `gate.allMet`
- [ ] Back button works — goes to previous phase
- [ ] Welcome → hardware scan → fetch recommendations happens on Phase 1 continue
- [ ] Phase 5 "Finish" calls `markOnboardingComplete()` + `onComplete()`
- [ ] Root div is `w-full h-full` — fills the container
- [ ] All styling via ColdLight token vars
- [ ] `$effect` for init runs once on mount

---

## FILE 2 (MODIFY): `layouts/app/BootOverlay.svelte`

**Path:** `interfaces/desktop/src/lib/layouts/app/BootOverlay.svelte`

**Changes:**

### 1. Update import path (line 219)

Current:
```svelte
{#await import("$lib/domains/app/models/components/SetupWizard.svelte") then module}
```

New:
```svelte
{#await import("$lib/domains/app/models/features/setup-wizard/SetupWizard.svelte") then module}
```

### 2. Remove `setupError` dead variable (line 83)

Delete:
```typescript
let setupError = $state<string | null>(null);
```

### 3. Expand wizard container for full viewport (lines 126-133)

Current:
```svelte
<div class={cn(
  stack({ gap: "6", align: "center" }),
  "overflow-y-auto scrollbar-thin",
  isWizardPhase
    ? "w-full max-w-5xl max-h-[95vh] px-8 py-6"
    : "min-w-[320px] max-w-[400px] max-h-[85vh] p-8",
  "transition-all duration-300 ease-out",
)}>
```

New (wizard phase gets FULL viewport — no max-w, no padding):
```svelte
<div class={cn(
  isWizardPhase
    ? "w-full h-full"
    : cn(stack({ gap: "6", align: "center" }), "overflow-y-auto scrollbar-thin min-w-[320px] max-w-[400px] max-h-[85vh] p-8"),
  "transition-all duration-300 ease-out",
)}>
```

### 4. Delete the `handleWizardComplete` function that references `setupError`

The wizard now calls `onComplete` which triggers `platformState.isFullyReady` → fade. The BootOverlay doesn't need its own `handleWizardComplete` — the wizard handles completion internally via `markOnboardingComplete()`.

**BUT:** The wizard's `onComplete` prop IS the trigger for the platform to know models are ready. Review `handleWizardComplete` (lines 87-103) — it calls `commands.completeModelSetup()` which emits "platform:models-status" → `platformState.modelsReady`. This MUST still happen.

**Solution:** Keep `handleWizardComplete` but remove `setupError` from it. Or move the `completeModelSetup` call into `wizard.service.markOnboardingComplete()`.

**Better: Move to wizard.service.ts.** Update `markOnboardingComplete()` to ALSO call `completeModelSetup`:

```typescript
// In wizard.service.ts
export async function markOnboardingComplete(): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    
    // 1. Persist onboarding flag
    await invoke("set_preference", { key: "onboarding_complete", value: "true" });
    
    // 2. Signal platform that models are ready
    const { commands } = await import("$lib/sys/generated/bindings.js");
    const result = await commands.completeModelSetup();
    if (result.status === "error") {
      console.error("[wizard] complete_model_setup:", result.error);
    }
    
    wizardState.onboardingComplete = true;
  } catch (e) {
    console.error("[wizard] Failed to complete onboarding:", e);
  }
}
```

Then BootOverlay's `handleWizardComplete` becomes just:
```typescript
function handleWizardComplete(): void {
  // Wizard handles everything internally — this is just the callback
  // platformState.modelsReady will be set by the "platform:models-status" event
  // triggered by completeModelSetup() inside markOnboardingComplete()
}
```

Or even simpler — pass no-op, since the wizard calls `markOnboardingComplete()` which triggers the event chain.

**Verification:**
- [ ] Dynamic import path resolves to new location
- [ ] `setupError` variable DELETED — not just commented out
- [ ] Wizard phase container is `w-full h-full` — true full viewport
- [ ] Boot phase container unchanged (narrow centered column)
- [ ] `completeModelSetup()` still gets called — now from `markOnboardingComplete()` in wizard.service
- [ ] BootOverlay fade-out still works: `platformState.isFullyReady` → `fading` → `visible = false`
- [ ] Re-read BootOverlay AFTER editing to confirm no dead variables remain

---

## FILE 3 (MODIFY): `domains/app/models/index.ts`

**Path:** `interfaces/desktop/src/lib/domains/app/models/index.ts`

**Changes:**

Replace line 9:
```typescript
export { default as SetupWizard } from "./components/SetupWizard.svelte";
```

With:
```typescript
export { default as SetupWizard } from "./features/setup-wizard/SetupWizard.svelte";
```

**Also add wizard module exports:**
```typescript
// Wizard module
export { wizardState } from "./features/setup-wizard/wizard.runes.svelte.js";
export { pickVariation, getCoreFacts } from "./features/setup-wizard/seed-families.js";
export { slotToSubdir, slotToModelPath } from "./features/setup-wizard/import-router.js";
export type {
  WizardPhase,
  HardwareProfile,
  ModelRec,
  ImportMode,
  ResourceTier,
  ContinueGate,
} from "./features/setup-wizard/wizard.types.js";
```

**Verification:**
- [ ] Old `./components/SetupWizard.svelte` path removed
- [ ] New `./features/setup-wizard/SetupWizard.svelte` path added
- [ ] No other file imports directly from `./components/SetupWizard.svelte` (grep confirms)
- [ ] Wizard module types exported for external consumers

---

## FILE 4 (DELETE): `components/SetupWizard.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/components/SetupWizard.svelte`

**Action:** DELETE this file entirely. 604 lines. All logic has been extracted to the module.

**Pre-delete checklist:**
- [ ] Grep: `from ".*components/SetupWizard"` — must be ZERO results
- [ ] Grep: `components/SetupWizard.svelte` in string literals — ZERO
- [ ] Grep: `SetupWizard` in barrel files — only in `features/setup-wizard/index.ts` and `models/index.ts`
- [ ] The dynamic import in BootOverlay points to the NEW path

**Verification:**
- [ ] File deleted — not renamed, not moved, GONE
- [ ] `pnpm svelte-check` passes — no broken imports
- [ ] No file in the codebase references the old path

---

## FILE 5 (MODIFY): `features/setup-wizard/index.ts`

**Final barrel — add ALL exports:**

```typescript
// Main component
export { default as SetupWizard } from "./SetupWizard.svelte";

// Types
export type * from "./wizard.types.js";
export { WIZARD_PHASES, PHASE_INFO, tierToProfile } from "./wizard.types.js";

// State
export { wizardState } from "./wizard.runes.svelte.js";

// Service
export {
  startHardwareScan,
  fetchRecommendations,
  evaluateContinueGate,
  checkOnboardingComplete,
  markOnboardingComplete,
  downloadAndAssign,
  bulkDownloadAndAssign,
  testInference,
  createDevProfile,
  checkDevProfile,
} from "./wizard.service.js";

// Import routing
export { slotToSubdir, slotToModelPath } from "./import-router.js";

// Seed families
export { pickVariation, getCoreFacts } from "./seed-families.js";

// Step components (prefer dynamic import, but export for direct use)
export { default as WelcomeStep } from "./steps/WelcomeStep.svelte";
export { default as HardwareDetectionStep } from "./steps/HardwareDetectionStep.svelte";
export { default as ModelLoaderStep } from "./steps/ModelLoaderStep.svelte";
export { default as VoicePipelineStep } from "./steps/VoicePipelineStep.svelte";
export { default as ClyfActivationStep } from "./steps/ClyfActivationStep.svelte";
export { default as ProjectSetupStep } from "./steps/ProjectSetupStep.svelte";
export { default as CompletionStep } from "./steps/CompletionStep.svelte";
```

---

## MANDATORY EXECUTION CHECKLIST

This checklist MUST be completed IN ORDER. Every item verified. No item skipped. No assumptions. **THIS SPRINT IS HIGH RISK — it changes the boot path. Triple-verify everything.**

### Phase A: Per-File Authoring Verification

For EACH file written, modified, or deleted:

- [ ] **Re-read after writing** — every line matches sprint doc
- [ ] **Zero unused imports** — every import used. Wire or delete.
- [ ] **Zero undefined references** — every identifier defined or imported
- [ ] **Zero `any` types**
- [ ] **All imports use `.js` extension**
- [ ] **No raw oklch/hex/rgb/hsl** — all colors via ColdLight token vars
- [ ] **No legacy Svelte stores** — $state/$derived/$effect only
- [ ] **File matches sprint doc description**

### Phase B: Orchestrator Verification

- [ ] **SetupWizard.svelte** — phase progress indicator shows 5 dots. Current phase highlighted. Past phases filled. Future phases muted.
- [ ] **SetupWizard.svelte init** — calls `checkOnboardingComplete()`. If done, fires `onComplete()` immediately (no wizard render).
- [ ] **SetupWizard.svelte navigation** — `handleAdvance` checks gate before advancing. `handleBack` goes to previous phase. Phase index logic correct.
- [ ] **SetupWizard.svelte dynamic imports** — each phase step loaded via `{#await import(...)}`. Import paths all correct and resolve.
- [ ] **SetupWizard.svelte full viewport** — root div is `w-full h-full`. No max-w wrapper.
- [ ] **SetupWizard.svelte welcome flow** — on Phase 1 continue: calls `startHardwareScan()` + `fetchRecommendations()`. Then advances to hardware detection.

### Phase C: BootOverlay Verification

- [ ] **Import path updated** — `$lib/domains/app/models/features/setup-wizard/SetupWizard.svelte`. NOT old components/ path.
- [ ] **setupError DELETED** — grep for `setupError` in BootOverlay. Must be ZERO hits. The variable, the display, ALL gone.
- [ ] **Wizard container full viewport** — when `isWizardPhase`, container is `w-full h-full`. NOT max-w-5xl.
- [ ] **Boot phase container unchanged** — non-wizard phase still uses narrow centered column (min-w-320, max-w-400).
- [ ] **completeModelSetup still fires** — trace the path: wizard onComplete → markOnboardingComplete → commands.completeModelSetup → "platform:models-status" event → platformState.modelsReady → isFullyReady → fade. EVERY link in this chain must work.

### Phase D: Rename/Delete Safety (MANDATORY)

- [ ] **Grep: `components/SetupWizard`** — search ALL of `interfaces/desktop/src/`. Must be ZERO results.
- [ ] **Grep: `"SetupWizard"` string literals** — only in new feature paths and index.ts
- [ ] **Dynamic imports checked** — BootOverlay import path is the new one. No other file imports old path.
- [ ] **index.ts updated** — `domains/app/models/index.ts` exports SetupWizard from `features/setup-wizard/`, NOT `components/`.
- [ ] **Old file DELETED** — `components/SetupWizard.svelte` does not exist on disk. Verify with `ls`.

### Phase E: Biome Enforcement (MANDATORY)

```bash
cd interfaces/desktop && npx biome check src/lib/domains/app/models/ --diagnostic-level=warn
```

- [ ] **Zero errors** — covers both features/ and components/ and runes/ and services/
- [ ] **Zero warnings** — ALL warnings are blockers
- [ ] **Re-run after fixes**

```bash
cd interfaces/desktop && npx biome format --write src/lib/domains/app/models/features/setup-wizard/
```

- [ ] **Format applied and verified**

### Phase F: TypeScript Verification (MANDATORY)

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] **Zero errors** — if broken import from deleted file, fix ALL consumers
- [ ] **Zero warnings from our files**
- [ ] **Read FULL output** — this sprint touches the boot path. EVERY error matters.

### Phase G: End-to-End Boot Path Verification

Owner must verify:
1. [ ] App launches → BootOverlay appears
2. [ ] Platform services boot (subsystem list with progress)
3. [ ] `platformState.needsModelSetup` → wizard phase activates
4. [ ] NEW wizard renders (Phase 1: Welcome)
5. [ ] Can navigate through all 5 phases
6. [ ] "Enter DevPulse" → BootOverlay fades → main app loads
7. [ ] No console errors related to missing modules or broken imports

### Phase H: Sprint Done Gate

- [ ] **ALL above checked**
- [ ] **Sprint doc status → COMPLETE**
- [ ] **Next sprint dependencies met** — Sprint 9 needs: onboarding_complete preference persisted, wizard renders correctly, checkOnboardingComplete returns true after completion

**If ANY checkbox unchecked, do NOT proceed to Sprint 9. This sprint changes the boot path — a broken boot means the app is unusable.**
