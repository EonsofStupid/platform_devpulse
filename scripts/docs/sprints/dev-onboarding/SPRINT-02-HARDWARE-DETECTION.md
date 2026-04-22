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

# Sprint 2: Phase 1 — Hardware Detection + Welcome + Wizard Service

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md |
| **Status** | `PLANNED` |
| **Files** | 3 new, 2 modified |
| **Depends on** | Sprint 1 (types, runes, seed-families) |
| **Consumers** | Sprint 3+ (wizard.service used by all phases) |

---

## PRE-FLIGHT

Before writing ANY code:
1. Read Sprint 1 output files to verify they exist and exports are correct
2. Read `hardwareState` rune — confirm available getters: `metrics`, `hasGpu`, `gpuError`, `gpuName`, `vramUsedMb`, `vramTotalMb`, `vramFreeMb`, `tier`, `gpuUtilPercent`, `gpuTempC`
3. Read `HardwareInfo` type from `$lib/sys/generated/bindings.js` — confirm fields: `cpu_usage_percent`, `cpu_cores`, `cpu_name`, `ram_total_mb`, `ram_used_mb`, `ram_available_mb`, `gpu_error`, `gpu_name`, `gpu_vram_total_mb`, `gpu_vram_used_mb`, `gpu_vram_free_mb`, `gpu_utilization_percent`, `gpu_temperature_c`, `process_ram_mb`, `process_vram_mb`
4. Read `autoConfigureHardware()` from `download.service.ts` — returns raw JSON string, needs JSON.parse

---

## FILE 1: `features/setup-wizard/steps/WelcomeStep.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/WelcomeStep.svelte`

**Purpose:** Entry screen. Clyffy greeting. "Let me take a look at what we're working with..." Single CTA button to trigger hardware scan.

**Props:**
```typescript
interface Props {
  onContinue: () => void;
}
```

**Imports:**
```typescript
import { Sparkles } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { pickVariation } from "../seed-families.js";
```

**Behavior:**
- On mount: nothing. Just displays greeting.
- CTA button: calls `onContinue()` which triggers wizard to advance + start hardware scan.
- Clyffy greeting text comes from `pickVariation("welcome.greeting")` — need to add a welcome family to seed-families.

**Layout:**
- Centered vertically and horizontally in full viewport
- Clyffy avatar placeholder (text "Clyffy" with icon for now — no Rive yet)
- Greeting text
- Subtitle: "Let me take a look at what we're working with..."
- CTA button: "Let's Go" with Sparkles icon

**Styling:**
- All via ColdLight token vars: `var(--text-primary)`, `var(--surface-base)`, `var(--accent-teal-main)`
- No raw oklch values
- Layout via `stack()` utility

**Verification:**
- [ ] Props interface matches — single `onContinue` callback
- [ ] No $effect needed — purely presentational
- [ ] All styling via token vars — grep for oklch returns 0 hits
- [ ] Imports use `.js` extension

---

## FILE 2: `features/setup-wizard/steps/HardwareDetectionStep.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/HardwareDetectionStep.svelte`

**Purpose:** Shows real hardware metrics as they're detected. All data from `hardwareState` rune. No mocks.

**Props:**
```typescript
interface Props {
  onContinue: () => void;
  continueEnabled: boolean;
}
```

**Imports:**
```typescript
import { Check, AlertTriangle, Loader2 } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { formatMb } from "../../../types/models.types.js";
import { pickVariation } from "../seed-families.js";
import type { HardwareProfile } from "../wizard.types.js";
import { tierToProfile } from "../wizard.types.js";
```

**Reactive state:**
```typescript
const m = hardwareState.metrics;
const profile = $derived<HardwareProfile>(tierToProfile(hardwareState.tier));
const isScanning = $derived(hardwareState.loading);
const hasData = $derived(m !== null);
```

**Display rows (from spec Section 2):**

| Row | Source | Icon |
|-----|--------|------|
| CPU | `m?.cpu_name` + `m?.cpu_cores` | Check or AlertTriangle |
| RAM | `m?.ram_total_mb` + `m?.ram_available_mb` (formatMb) | Check |
| GPU | `m?.gpu_name` or `m?.gpu_error` | Check or AlertTriangle |
| VRAM | `m?.gpu_vram_total_mb` + `m?.gpu_vram_free_mb` (formatMb) | Check or AlertTriangle |
| Disk | Not available from HardwareInfo — OMIT or note as POA&M | — |
| CUDA | Not directly in HardwareInfo — inferred from gpu_name presence | Check or "N/A" |

**IMPORTANT: HardwareInfo does NOT have disk_free or cuda_version fields.** The spec asks for disk + CUDA. Current Rust backend doesn't expose these. This sprint documents the gap. The hardware detection step shows what's available. A POA&M item notes: "Add disk_free_mb and cuda_version to HardwareInfo Rust struct."

**Clyffy narration:**
- If GPU found: `pickVariation("hardware.gpu_found")`
- If no GPU: `pickVariation("hardware.no_gpu")`
- Tier summary: `pickVariation("hardware.tier_${hardwareState.tier}")`

**Continue gate (from props):**
- `continueEnabled` passed from parent based on `wizardState.evaluateGate("hardware").allMet`
- Gate condition: `hardwareState.metrics !== null && !hardwareState.loading`
- If GPU error but CPU available: still allow continue (CPU-only mode)

**Verification:**
- [ ] Every metric row reads from `hardwareState.metrics` — real data, not mock
- [ ] If `hardwareState.error` is set, the RAW error displays — not "something went wrong"
- [ ] If `hardwareState.gpuError` is set, shows the exact error string
- [ ] Profile badge shows correct tier: "ENTRY_8GB", "ENTHUSIAST_24GB", etc.
- [ ] formatMb used for all MB values (e.g., 32768 → "32.0 GB")
- [ ] All styling via ColdLight token vars
- [ ] disk_free and cuda_version are NOT faked — if not in HardwareInfo, they're not shown

---

## FILE 3: `features/setup-wizard/wizard.service.ts`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/wizard.service.ts`

**Purpose:** Orchestrates wizard operations. Calls IPC commands, coordinates state updates. NOT a rune — a service with async methods.

**Imports:**
```typescript
import { hardwareState } from "../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../runes/models.runes.svelte.js";
import { autoConfigureHardware } from "../../services/download.service.js";
import { scanModels } from "../../services/registry.service.js";
import type { AutoConfig } from "../../types/models.types.js";
import { wizardState } from "./wizard.runes.svelte.js";
import type { ContinueGate, ModelRec, WizardPhase } from "./wizard.types.js";
```

**Methods for Sprint 2 (Phase 1 only — other methods added in later sprints):**

```typescript
/** Start hardware detection. Called when user clicks "Let's Go" on WelcomeStep. */
export async function startHardwareScan(): Promise<void> {
  wizardState.error = null;
  try {
    await hardwareState.startListening();
    wizardState.hardwareScanned = true;
  } catch (e) {
    wizardState.error = e instanceof Error ? e.message : String(e);
  }
}

/** Fetch auto-configuration recommendations based on detected hardware. */
export async function fetchRecommendations(): Promise<void> {
  wizardState.error = null;
  try {
    const raw = await autoConfigureHardware();
    const config: AutoConfig = JSON.parse(raw);
    wizardState.setRecommendations(config);
  } catch (e) {
    wizardState.error = e instanceof Error ? e.message : String(e);
  }
}

/** Evaluate continue gate for a phase. */
export function evaluateContinueGate(phase: WizardPhase): ContinueGate {
  switch (phase) {
    case "hardware": {
      const conditions = ["Hardware metrics detected"];
      const metricsPresent = hardwareState.metrics !== null;
      const notLoading = !hardwareState.loading;
      const allMet = metricsPresent && notLoading;
      const blockers: string[] = [];
      if (!metricsPresent) blockers.push("Waiting for hardware scan to complete");
      if (hardwareState.loading) blockers.push("Scan in progress...");
      return { phase, conditions, allMet, blockers };
    }
    case "models": {
      const conditions = ["Brain model (chat.brain) must be LOADED"];
      const brainStatus = modelsState.statuses["chat.brain"];
      const brainLoaded = brainStatus?.type === "loaded";
      const blockers: string[] = [];
      if (!brainLoaded) blockers.push("We need the main brain loaded before we can move on. Pick a model and hit Load.");
      return { phase, conditions, allMet: brainLoaded, blockers };
    }
    case "voice": {
      const conditions = ["STT model assigned", "TTS model assigned"];
      const sttSlot = modelsState.slots.find(s => s.id === "voice.stt");
      const ttsSlot = modelsState.slots.find(s => s.id === "voice.tts");
      const sttAssigned = !!sttSlot?.assigned_model_id;
      const ttsAssigned = !!ttsSlot?.assigned_model_id;
      const allMet = sttAssigned && ttsAssigned;
      const blockers: string[] = [];
      if (!sttAssigned) blockers.push("Voice Input (STT) needs a model assigned");
      if (!ttsAssigned) blockers.push("Clyffy's Voice (TTS) needs a model assigned");
      return { phase, conditions, allMet, blockers };
    }
    case "clyffy": {
      const conditions = ["3+ successful exchanges OR manual confirm"];
      const allMet = wizardState.roundTripCount >= 3 || wizardState.clyfConfirmed;
      const blockers: string[] = [];
      if (!allMet) blockers.push("Have a conversation with Clyffy or confirm manually");
      return { phase, conditions, allMet, blockers };
    }
    case "project": {
      // Project phase always allows continue (indexing is optional)
      return { phase: "project", conditions: ["Dev profile exists"], allMet: true, blockers: [] };
    }
  }
}

/** Check if onboarding was already completed (subsequent launch). */
export async function checkOnboardingComplete(): Promise<boolean> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    const result = await invoke<string | null>("get_preference", { key: "onboarding_complete" });
    return result === "true";
  } catch {
    return false;
  }
}

/** Mark onboarding as complete. */
export async function markOnboardingComplete(): Promise<void> {
  try {
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("set_preference", { key: "onboarding_complete", value: "true" });
    wizardState.onboardingComplete = true;
  } catch (e) {
    console.error("[wizard.service] Failed to persist onboarding complete:", e);
  }
}
```

**Verification:**
- [ ] `startHardwareScan` calls `hardwareState.startListening()` — the REAL API from the rune
- [ ] `fetchRecommendations` calls `autoConfigureHardware()` and parses JSON — handles the raw string return
- [ ] `evaluateContinueGate` has logic for ALL 5 phases
- [ ] Phase 2 gate reads `modelsState.statuses["chat.brain"]` — real status from rune
- [ ] Phase 3 gate checks `assigned_model_id` on voice slots — not `statuses` (voice inference is stub)
- [ ] `checkOnboardingComplete` uses raw `invoke` for `get_preference` — matches Rust command signature
- [ ] All imports use `.js` extension
- [ ] No circular import with wizard.runes.svelte.ts (service imports rune, rune does NOT import service)

---

## FILE 4 (MODIFY): `features/setup-wizard/wizard.runes.svelte.ts`

**Changes from Sprint 1 version:**

Add the `setRecommendations` method that converts `AutoConfig` to `ModelRec[]`:

```typescript
/** Convert kernel AutoConfig to wizard ModelRec array. */
setRecommendations(config: AutoConfig): void {
  this.recommendations = config.recommendations.map((rec: SlotRecommendation) => ({
    name: rec.modelFilename.replace(/\.gguf$/i, "").replace(/-/g, " "),
    purpose: friendlySlotPurpose(rec.slotId),
    slot: rec.slotId,
    sizeMb: rec.modelSizeMb,
    vramMb: rec.vramEstimateMb,
    repo: rec.modelRepoId,
    file: rec.modelFilename,
    device: rec.device,
  }));
}
```

**Also add import:**
```typescript
import { friendlySlotPurpose } from "../../types/models.types.js";
```

**Verification:**
- [ ] `setRecommendations` correctly maps `SlotRecommendation` → `ModelRec`
- [ ] `friendlySlotPurpose` is imported from types (exists — verified in models.types.ts line 157)
- [ ] No new $state fields needed — all were defined in Sprint 1

---

## FILE 5 (MODIFY): `features/setup-wizard/index.ts`

**Add exports for new files:**

```typescript
// Service
export {
  startHardwareScan,
  fetchRecommendations,
  evaluateContinueGate,
  checkOnboardingComplete,
  markOnboardingComplete,
} from "./wizard.service.js";

// Step components (dynamic import preferred for code splitting, but export for type access)
export { default as WelcomeStep } from "./steps/WelcomeStep.svelte";
export { default as HardwareDetectionStep } from "./steps/HardwareDetectionStep.svelte";
```

**Verification:**
- [ ] All new exports resolve
- [ ] No duplicate exports from Sprint 1

---

## MANDATORY EXECUTION CHECKLIST

This checklist MUST be completed IN ORDER. Every item verified. No item skipped. No assumptions. A passing check does NOT mean "good" — you READ the output and CONFIRM it matches expectations.

### Phase A: Per-File Authoring Verification

For EACH file written or modified in this sprint, complete ALL of the following:

- [ ] **Re-read the file after writing** — confirm every line matches the sprint doc
- [ ] **Zero unused imports** — if an import exists, it MUST be used in the file. If not used, either wire it into the code or delete it. Do NOT leave unused imports.
- [ ] **Zero undefined references** — every type, function, variable referenced MUST be defined or imported. Grep the file for any identifier that has no definition.
- [ ] **Zero `any` types** — no implicit or explicit `any`. Every variable typed.
- [ ] **All imports use `.js` extension** — grep for `from "` lines, confirm every relative import ends in `.js`
- [ ] **No raw oklch/hex/rgb/hsl values** — grep for `oklch`, `#[0-9a-f]`, `rgb(`, `hsl(`. Must be zero hits. All colors via ColdLight token vars (`var(--signal-success)`, `var(--accent-teal-main)`, etc.).
- [ ] **No legacy Svelte stores** — grep for `writable`, `readable`, `derived` from `svelte/store`. Must be zero.
- [ ] **Svelte 5 runes only** — confirm $state, $derived, $effect used. No $: reactive statements.
- [ ] **File purpose matches sprint doc** — re-read the sprint doc description for this file, confirm the implementation matches

### Phase B: Component-Specific Verification

For EACH .svelte component:

- [ ] **Props interface defined** — matches sprint doc exactly
- [ ] **All props used** — every prop in the interface is referenced in the template or script
- [ ] **No dead event handlers** — every `onclick`, `onsubmit` etc. calls a real function
- [ ] **Reactive derivations correct** — each $derived actually depends on reactive state that changes
- [ ] **Cleanup on unmount** — if $effect starts listeners, confirm they clean up (return function or explicit stop)
- [ ] **Accessibility** — interactive elements have labels or aria attributes

### Phase C: Cross-File Integrity

- [ ] **All exports from index.ts resolve** — trace each export to its definition
- [ ] **No circular imports** — draw the import graph, confirm no cycles
- [ ] **wizard.service.ts does NOT import from .svelte files** — services import types and runes only
- [ ] **Runes do NOT import from wizard.service.ts** — prevent circular dependency

### Phase D: Biome Enforcement (MANDATORY)

```bash
cd interfaces/desktop && npx biome check src/lib/domains/app/models/features/setup-wizard/ --diagnostic-level=warn
```

- [ ] **Zero errors** — fix ROOT CAUSE, not symptoms
- [ ] **Zero warnings** — ALL warnings are blockers. Fix them.
- [ ] **Re-run after fixes** — confirm zero on second run

```bash
cd interfaces/desktop && npx biome format --write src/lib/domains/app/models/features/setup-wizard/
```

- [ ] **Format applied** — re-read files to confirm formatting didn't break logic

### Phase E: TypeScript Verification (MANDATORY)

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] **Zero errors from our files** — filter for `features/setup-wizard/`. Zero errors.
- [ ] **Zero warnings from our files** — warnings are blockers.
- [ ] **Read the FULL output** — do not skim. Scroll through every line.

### Phase F: Faithfulness Check

- [ ] **HardwareDetectionStep shows ALL metrics from spec** — CPU (name, cores), RAM (total, available), GPU (name), VRAM (total, free). Each row reads from `hardwareState.metrics`.
- [ ] **Metrics that don't exist in HardwareInfo are NOT faked** — disk_free and cuda_version are documented as POA&M, not shown with fake values.
- [ ] **WelcomeStep has onContinue prop** — matches sprint doc
- [ ] **wizard.service.ts has ALL 5 functions listed** — startHardwareScan, fetchRecommendations, evaluateContinueGate (all 5 phases), checkOnboardingComplete, markOnboardingComplete
- [ ] **evaluateContinueGate handles ALL 5 phases** — hardware, models, voice, clyffy, project. No missing case.
- [ ] **Raw errors displayed** — if hardwareState.error is set, the EXACT error string renders. Grep for the error display to confirm.

### Phase G: Sprint Done Gate

ALL above checked. Then and ONLY then:

- [ ] **Sprint doc status → COMPLETE**
- [ ] **No open questions**
- [ ] **Next sprint dependencies met** — re-read "WHAT SPRINT 3 NEEDS FROM THIS SPRINT." Confirm every item exists and is exported.
- [ ] **POA&M items documented** — S2-1 (disk_free), S2-2 (cuda_version), S2-3 (seed families for hardware/welcome)

**If ANY checkbox is unchecked, do NOT proceed to Sprint 3.**
