> # ⚠️ UNVERIFIED — OUTPUT NOT TRUSTED
>
> This sprint was marked COMPLETE in a prior session log. That status is
> **not binding.** The setup wizard does not currently pass a live audit
> against the 10 Commandments in `POAM-MODEL-LOADER-WIZARD.md`.
>
> - Prior commits shipped. Prior code lives on disk. Neither proves the UX works.
> - Every file this sprint touched must be re-checked against the 10
>   Commandments (POAM §top) before being cited as "done."
> - Acceptance criteria below are aspirational, not retired.
>
> **Authority** → `scripts/docs/sprints/POAM-MODEL-LOADER-WIZARD.md`

---

# Sprint 9: Subsequent Launch Logic + Missing Model Detection

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md |
| **Status** | `PLANNED` |
| **Files** | 3 modified (no new files) |
| **Depends on** | Sprint 8 (orchestrator wired, onboarding_complete persisted) |

---

## PRE-FLIGHT

1. Read `wizard.service.ts` — confirm `checkOnboardingComplete()` works
2. Read `modelsState` — confirm `slots`, `models`, `assignedModel(slotId)` APIs
3. Read `hardwareState` — confirm `metrics.gpu_name` for hardware change detection
4. Verify `get_preference` command returns `null` for missing keys (not error)
5. Read `SetupWizard.svelte` — confirm `init()` flow from Sprint 8

---

## FILE 1 (MODIFY): `features/setup-wizard/wizard.service.ts`

**Add subsequent launch detection methods:**

```typescript
/** Check if all assigned models still exist on disk. */
export async function validateModelPaths(): Promise<{ valid: boolean; missing: string[] }> {
  const missing: string[] = [];
  
  await modelsState.refresh();
  
  modelsState.slots.forEach((slot) => {
    if (slot.assigned_model_id) {
      const model = modelsState.models.find(m => m.id === slot.assigned_model_id);
      if (!model) {
        missing.push(slot.id);
      }
    }
  });
  
  wizardState.missingModels = missing;
  return { valid: missing.length === 0, missing };
}

/** Check if hardware changed since last run. */
export async function detectHardwareChange(): Promise<boolean> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const lastGpu = await invoke<string | null>("get_preference", { key: "last_gpu_name" });
    
    await hardwareState.refresh();
    const currentGpu = hardwareState.gpuName;
    
    // Store current GPU for next comparison
    await invoke("set_preference", { key: "last_gpu_name", value: currentGpu });
    
    if (lastGpu === null) {
      // First run — no change
      return false;
    }
    
    const changed = lastGpu !== currentGpu;
    wizardState.hardwareChanged = changed;
    return changed;
  } catch {
    return false;
  }
}

/** Full subsequent launch check. Returns what to do. */
export async function subsequentLaunchCheck(): Promise<
  | { action: "skip"; reason: "complete_and_valid" }
  | { action: "wizard"; reason: "not_complete" }
  | { action: "repair"; missingSlots: string[] }
  | { action: "redetect"; reason: "hardware_changed" }
> {
  // 1. Check if onboarding was completed
  const complete = await checkOnboardingComplete();
  if (!complete) {
    return { action: "wizard", reason: "not_complete" };
  }
  
  // 2. Check hardware change
  const hwChanged = await detectHardwareChange();
  if (hwChanged) {
    return { action: "redetect", reason: "hardware_changed" };
  }
  
  // 3. Validate model paths
  const { valid, missing } = await validateModelPaths();
  if (!valid) {
    return { action: "repair", missingSlots: missing };
  }
  
  return { action: "skip", reason: "complete_and_valid" };
}
```

**Verification:**
- [ ] `validateModelPaths` iterates `modelsState.slots` and checks `assigned_model_id` against `modelsState.models`
- [ ] Missing model = slot has `assigned_model_id` but model not found in registry (file deleted/moved)
- [ ] `detectHardwareChange` stores `last_gpu_name` preference, compares on next run
- [ ] First run with no stored GPU: returns false (no change)
- [ ] `subsequentLaunchCheck` returns a discriminated union — caller pattern-matches

---

## FILE 2 (MODIFY): `features/setup-wizard/SetupWizard.svelte`

**Update `init()` to use subsequent launch check:**

```typescript
async function init(): Promise<void> {
  const result = await subsequentLaunchCheck();
  
  switch (result.action) {
    case "skip":
      // Everything fine — skip wizard, go straight to app
      onComplete?.();
      return;
    
    case "wizard":
      // Fresh install or incomplete onboarding — full wizard
      await hardwareState.startListening();
      await modelsState.refresh();
      initialized = true;
      break;
    
    case "repair":
      // Models missing — show repair UI (targeted, not full wizard)
      wizardState.missingModels = result.missingSlots;
      showRepairMode = true;
      await modelsState.refresh();
      initialized = true;
      break;
    
    case "redetect":
      // Hardware changed — offer re-detection
      showHardwareChangeNotice = true;
      await hardwareState.startListening();
      await modelsState.refresh();
      initialized = true;
      break;
  }
}
```

**Add repair mode UI:**
```typescript
let showRepairMode = $state(false);
let showHardwareChangeNotice = $state(false);
```

**Repair mode renders a focused UI — NOT the full 5-phase wizard:**
```svelte
{#if showRepairMode}
  <div class={stack({ gap: "4", align: "center" })}>
    <Text size="lg" weight="bold" color="primary">Missing Models</Text>
    <Text size="sm" color="muted">
      Some models are no longer available at their registered paths.
    </Text>
    {#each wizardState.missingModels as slotId (slotId)}
      <div class={hstack({ gap: "3", align: "center" })}>
        <Text size="sm" color="secondary">{friendlySlotLabel(slotId)}</Text>
        <Badge variant="negative" size="sm">Missing</Badge>
        <button
          class="rounded px-3 py-1 text-xs"
          style="background: var(--accent-teal-main); color: var(--surface-base);"
          onclick={() => handleRedownload(slotId)}
        >
          Redownload
        </button>
        <button
          class="rounded px-3 py-1 text-xs"
          style="background: var(--surface-base); border: 1px solid var(--border-subtle); color: var(--text-muted);"
          onclick={() => handleReassign(slotId)}
        >
          Reassign
        </button>
        <button
          class="rounded px-3 py-1 text-xs"
          style="color: var(--text-muted);"
          onclick={() => handleSkipSlot(slotId)}
        >
          Skip
        </button>
      </div>
    {/each}
    <button
      class="rounded-lg px-6 py-2 text-sm font-bold"
      style="background: var(--accent-teal-main); color: var(--surface-base);"
      onclick={handleRepairComplete}
    >
      Continue to DevPulse
    </button>
  </div>
{/if}
```

**Hardware change notice:**
```svelte
{#if showHardwareChangeNotice}
  <div class={stack({ gap: "4", align: "center" })}>
    <Text size="lg" weight="bold" color="primary">Hardware Changed</Text>
    <Text size="sm" color="muted">
      Your GPU changed since last run. Want to re-run hardware detection?
    </Text>
    <div class={hstack({ gap: "3" })}>
      <button onclick={handleRedetect}>Re-detect Hardware</button>
      <button onclick={handleSkipRedetect}>Keep Current Config</button>
    </div>
  </div>
{/if}
```

**Handler stubs:**
```typescript
import { friendlySlotLabel } from "../../types/models.types.js";
import { subsequentLaunchCheck } from "./wizard.service.js";

async function handleRedownload(slotId: string): Promise<void> {
  // Find recommendation for this slot and re-download
  const rec = wizardState.recommendations.find(r => r.slot === slotId);
  if (rec) {
    const { downloadAndAssign } = await import("./wizard.service.js");
    await downloadAndAssign(rec);
  }
  wizardState.missingModels = wizardState.missingModels.filter(s => s !== slotId);
}

async function handleReassign(slotId: string): Promise<void> {
  // Open model browser for this specific slot
  wizardState.showModelBrowser = true;
  wizardState.importTargetSlot = slotId;
}

function handleSkipSlot(slotId: string): void {
  // Remove from missing list — user accepts the gap
  wizardState.missingModels = wizardState.missingModels.filter(s => s !== slotId);
}

function handleRepairComplete(): void {
  onComplete?.();
}

function handleRedetect(): void {
  showHardwareChangeNotice = false;
  wizardState.currentPhase = "hardware";
  // Full wizard from Phase 1
}

function handleSkipRedetect(): void {
  showHardwareChangeNotice = false;
  onComplete?.();
}
```

**Verification:**
- [ ] Returning user with all models present: wizard never renders, `onComplete()` fires immediately
- [ ] Missing model: shows ONLY affected slots — NOT full 5-phase wizard
- [ ] Per-slot actions: Redownload, Reassign, Skip — all work
- [ ] Hardware change: shows notice with re-detect or skip option
- [ ] "Continue to DevPulse" works even with missing models (user chose to skip)
- [ ] All raw data — "Model file not found" with exact slot ID, not generic
- [ ] All styling via ColdLight token vars

---

## FILE 3 (MODIFY): `features/setup-wizard/wizard.runes.svelte.ts`

**Add missing state fields:**

```typescript
// Subsequent launch
missingModels = $state<string[]>([]);
hardwareChanged = $state(false);
```

**Verification:**
- [ ] Both fields added to WizardState class
- [ ] Default values: empty array, false

---

## MANDATORY EXECUTION CHECKLIST

This checklist MUST be completed IN ORDER. Every item verified. No item skipped. No assumptions.

### Phase A: Per-File Authoring Verification

For EACH file modified:

- [ ] **Re-read after writing** — every line matches sprint doc
- [ ] **Zero unused imports** — every import used. Wire or delete.
- [ ] **Zero undefined references** — every identifier defined or imported
- [ ] **Zero `any` types**
- [ ] **All imports use `.js` extension**
- [ ] **No raw oklch/hex/rgb/hsl** — all colors via ColdLight token vars
- [ ] **No legacy Svelte stores** — $state/$derived/$effect only
- [ ] **File matches sprint doc description**

### Phase B: Service Method Verification

- [ ] **validateModelPaths** — iterates `modelsState.slots`. For each slot with `assigned_model_id`, checks if model exists in `modelsState.models`. Missing slots added to array. Verify the find logic.
- [ ] **detectHardwareChange** — stores `last_gpu_name` via `set_preference`. Compares on next run. First run returns false (no stored value). Verify null handling.
- [ ] **subsequentLaunchCheck** — returns discriminated union with 4 branches: skip, wizard, repair, redetect. EACH branch tested mentally with specific inputs.

### Phase C: UI Branch Verification

- [ ] **Skip branch** — when `onboarding_complete=true` AND all models present AND GPU unchanged → `onComplete()` fires immediately. Wizard NEVER renders.
- [ ] **Wizard branch** — when `onboarding_complete=false` → full wizard starts at Phase 1. Normal flow.
- [ ] **Repair branch** — when models missing → repair UI shows. Each missing slot has: Redownload, Reassign, Skip buttons. "Continue to DevPulse" always available.
- [ ] **Redetect branch** — when GPU changed → notice shows. "Re-detect" goes to Phase 1. "Keep Current" skips to app.
- [ ] **Repair UI shows raw slot info** — `friendlySlotLabel(slotId)` for names. Badge "Missing" for each. No generic "something is wrong."
- [ ] **State fields added** — `missingModels: string[]` and `hardwareChanged: boolean` exist in wizard.runes.svelte.ts.

### Phase D: Biome Enforcement (MANDATORY)

```bash
cd interfaces/desktop && npx biome check src/lib/domains/app/models/features/setup-wizard/ --diagnostic-level=warn
```

- [ ] **Zero errors** — fix ROOT CAUSE
- [ ] **Zero warnings** — ALL warnings are blockers
- [ ] **Re-run after fixes** — confirm zero

```bash
cd interfaces/desktop && npx biome format --write src/lib/domains/app/models/features/setup-wizard/
```

- [ ] **Format applied and verified**

### Phase E: TypeScript Verification (MANDATORY)

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] **Zero errors from our files**
- [ ] **Zero warnings from our files**
- [ ] **Read FULL output** — do not skim

### Phase F: All 4 Launch Scenarios Verified

- [ ] **Scenario 1 — Fresh install:** No preferences stored. `checkOnboardingComplete` returns false. Full wizard starts.
- [ ] **Scenario 2 — Clean return:** `onboarding_complete=true`, all models present, same GPU. Wizard skips. App loads.
- [ ] **Scenario 3 — Missing model:** `onboarding_complete=true`, but a model file was deleted. Repair UI for that slot.
- [ ] **Scenario 4 — New GPU:** `onboarding_complete=true`, `last_gpu_name` differs from current. Hardware change notice.

### Phase G: FINAL Sprint Done Gate

- [ ] **ALL above checked**
- [ ] **Sprint doc status → COMPLETE**
- [ ] **ALL 9 sprints complete** — verify each sprint doc shows status COMPLETE

---

## FULL SYSTEM VERIFICATION (after Sprint 9)

The FULL dev onboarding wizard is operational. Confirm:

1. [ ] **Fresh install:** 5-phase wizard (Hardware → Models → Voice → Clyffy → Project)
2. [ ] **Returning user:** Skip wizard, auto-load models
3. [ ] **Missing models:** Targeted repair UI
4. [ ] **Hardware change:** Re-detection offer
5. [ ] **Full viewport:** Wizard owns the screen
6. [ ] **Real data:** Every metric, every status, every error is REAL — no mocks, no stubs, no fallbacks
7. [ ] **Continue gates:** Can't skip phases without meeting conditions
8. [ ] **Persistence:** Config saved to preferences, survives restart
9. [ ] **Raw errors everywhere:** Every failure shows the exact error string, not generic messages
10. [ ] **ColdLight compliance:** Zero raw color values in any wizard file
11. [ ] **Svelte 5 compliance:** Zero legacy stores, zero $: statements
12. [ ] **Biome clean:** Zero errors, zero warnings across ALL wizard files
13. [ ] **svelte-check clean:** Zero errors, zero warnings from wizard module

### What's NOT done (POA&M):
- P1: Voice inference (STT/TTS stubs) — engine-level work
- P2: Project indexing (RAG not wired) — engine-level work
- P3: Minion animations (Rive assets needed)
- P4: Cloud Clyffy fallback (Supabase not deployed)
- P5: Customer onboarding — separate spec after dev track proves defaults
