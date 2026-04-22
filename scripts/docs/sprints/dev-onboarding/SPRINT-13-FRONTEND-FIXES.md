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

# Sprint 13: Frontend — Gap Fixes

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md (Phase 2) |
| **Status** | `PLANNED` |
| **Depends on** | Sprint 10 (SSOT alignment), Sprint 11 (Rust fields), Sprint 12 (keyring) |
| **Files** | 9 modified (0 new, 0 deleted) |

---

## AUDIT RESULTS — What's Already Done (DO NOT re-implement)

These items were listed in the prior sprint doc but are ALREADY DONE from Sprint 10:

| Item | Current State | Evidence |
|------|---------------|----------|
| ResourceAllocationPanel tier selectors | Already READ-ONLY, 109 lines, zero editable controls | Lines 6-7 comment: "No arbiter exists yet — no editable tier selectors" |
| LatencyTuningPanel protocol selector | Already removed, zero memoryLaneProtocol refs | 110 lines, only slider + delivery mode |
| seed-families state.warm + state.standby | Already exist | Lines 154-183: both with 4 variations each |

---

## FIX 1: Add "completion" Phase to Wizard

**Problem:** CompletionStep.svelte exists (105 lines) but is NEVER rendered. SetupWizard.svelte has 5 phases, "project" is the last one and calls `handleComplete()` directly. There is no summary screen.

**Solution:** Add 6th phase `"completion"` to `WizardPhase` union and `WIZARD_PHASES` array. Wire it in SetupWizard.svelte.

### File: `wizard.types.ts`

**Line 15** — Add "completion" to WizardPhase union:
```typescript
// BEFORE:
export type WizardPhase = "hardware" | "models" | "voice" | "clyffy" | "project";

// AFTER:
export type WizardPhase = "hardware" | "models" | "voice" | "clyffy" | "project" | "completion";
```

**Line 18** — Add to WIZARD_PHASES array:
```typescript
// BEFORE:
export const WIZARD_PHASES: WizardPhase[] = ["hardware", "models", "voice", "clyffy", "project"];

// AFTER:
export const WIZARD_PHASES: WizardPhase[] = ["hardware", "models", "voice", "clyffy", "project", "completion"];
```

**Lines 27-33** — Add to PHASE_INFO array:
```typescript
// ADD after the "project" entry:
{ phase: "completion", label: "Done", description: "Review configuration and launch" },
```

### File: `SetupWizard.svelte`

**Lines 238-244** — Change "project" phase to advance to completion instead of calling handleComplete. Add "completion" phase block:
```svelte
<!-- "project" phase — onContinue now advances to completion, NOT handleComplete -->
{:else if wizardState.currentPhase === "project"}
  {#await import("./steps/ProjectSetupStep.svelte") then mod}
    <mod.default
      onContinue={handleAdvance}
      onBack={handleBack}
    />
  {/await}
{:else if wizardState.currentPhase === "completion"}
  {#await import("./steps/CompletionStep.svelte") then mod}
    <mod.default onComplete={handleComplete} />
  {/await}
```

### File: `wizard.service.ts`

**Lines 91-98** — Add continue gate for "project" phase (currently always returns true, needs profile check) and add "completion" gate:
```typescript
case "project": {
  const conditions = ["Dev profile created or skipped"];
  return { phase, conditions, allMet: true, blockers: [] };
}
case "completion": {
  return { phase: "completion", conditions: [], allMet: true, blockers: [] };
}
```

---

## FIX 2: ModelBrowserPopup — Slot Selector for Downloads/Imports

**Problem:** `"chat.brain"` is hardcoded at lines 205, 229, 238 of ModelBrowserPopup.svelte. HF search downloads and local imports all route to chat.brain regardless of which slot the user is working on.

**Solution:** Add `targetSlot` prop passed from parent (ModelLoaderStep). Add slot selector dropdown at top of popup. Default to parent's target slot.

### File: `ModelBrowserPopup.svelte`

**Props interface (line 25-29)** — Add `targetSlot` prop:
```typescript
interface Props {
  targetSlot: SlotId;
  onClose: () => void;
  onDownload: (repoId: string, filename: string, targetSlot: string) => void;
  onImport: (targetSlot: string) => void;
}
```

**After line 31** — Add local slot state + import SlotId + user slots:
```typescript
import { modelsState } from "../../../runes/models.runes.svelte.js";
import type { SlotId } from "../../../types/models.types.js";
import { friendlySlotLabel } from "../../../types/models.types.js";

let selectedSlot = $state<SlotId>(targetSlot);
```

**After the search bar (line 116)** — Add slot selector:
```svelte
<!-- Target slot selector -->
<div class={hstack({ gap: "3", align: "center" })}>
  <Text size="xs" weight="bold" color="secondary">Target Slot:</Text>
  <select
    class="rounded-lg px-3 py-1.5 text-sm border"
    style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
    value={selectedSlot}
    onchange={(e) => { selectedSlot = e.currentTarget.value as SlotId; }}
  >
    {#each modelsState.userSlots as slot (slot.id)}
      <option value={slot.id}>{friendlySlotLabel(slot.id)}</option>
    {/each}
  </select>
</div>
```

**Lines 205, 229, 238** — Replace `"chat.brain"` with `selectedSlot`:
```typescript
// Line 205:
onclick={() => onDownload(result.repo_id, file.filename, selectedSlot)}
// Line 229:
onclick={() => onImport(selectedSlot)}
// Line 238:
onclick={() => onImport(selectedSlot)}
```

### File: `ModelLoaderStep.svelte`

**Line 70-74** — Pass active slot to ModelBrowserPopup. The slot comes from whichever slot row triggered "Browse Models". Add state tracking:

After line 33, add:
```typescript
let browserTargetSlot = $state<SlotId>("chat.brain");
```

Update ModelBrowserPopup render:
```svelte
<ModelBrowserPopup
  targetSlot={browserTargetSlot}
  onClose={() => (wizardState.showModelBrowser = false)}
  onDownload={handleBrowserDownload}
  onImport={handleBrowserImport}
/>
```

Update SlotAssignmentPanel onBrowseModels to pass slot:
```svelte
<SlotAssignmentPanel
  onBrowseModels={(slotId?: SlotId) => { browserTargetSlot = slotId ?? "chat.brain"; wizardState.showModelBrowser = true; }}
  onImport={(slotId?: SlotId) => { wizardState.importTargetSlot = slotId ?? "chat.brain"; wizardState.showImportPrompt = true; }}
/>
```

**NOTE:** SlotAssignmentPanel.svelte's `onBrowseModels` prop signature may need updating to accept optional SlotId. Verify during execution.

---

## FIX 3: ModelBrowserPopup — Format Filter Dropdown

**Problem:** ModelBrowserFilter type exists in wizard.types.ts (lines 136-140) with `format`, `maxSizeMb`, `fitOnly` fields. But ModelBrowserPopup has no filter UI. All search results show regardless of format.

**Solution:** Add filter state using ModelBrowserFilter. Add filter dropdown below search bar. Apply client-side filtering to search results (HF API returns all formats, filter locally).

### File: `ModelBrowserPopup.svelte`

After slot selector, add:
```typescript
import type { ModelBrowserFilter } from "../wizard.types.js";

let filter = $state<ModelBrowserFilter>({ format: "gguf", maxSizeMb: null, fitOnly: false });
```

Add filter UI after slot selector:
```svelte
<!-- Format filter -->
<div class={hstack({ gap: "3", align: "center" })}>
  <Text size="xs" weight="bold" color="secondary">Format:</Text>
  <select
    class="rounded-lg px-3 py-1.5 text-xs border"
    style="background: var(--surface-base); border-color: var(--border-subtle); color: var(--text-primary);"
    value={filter.format}
    onchange={(e) => { filter = { ...filter, format: e.currentTarget.value as ModelBrowserFilter["format"] }; }}
  >
    <option value="gguf">GGUF only</option>
    <option value="safetensors">SafeTensors only</option>
    <option value="all">All formats</option>
  </select>
  <label class="flex items-center gap-1.5 cursor-pointer">
    <input
      type="checkbox"
      checked={filter.fitOnly}
      onchange={(e) => { filter = { ...filter, fitOnly: e.currentTarget.checked }; }}
      class="accent-[var(--accent-teal-main)]"
    />
    <Text size="xs" color="muted">Fits GPU only</Text>
  </label>
</div>
```

Apply filter to search results rendering — wrap the `{#each searchState.results}` block with filtered derived:
```typescript
const filteredResults = $derived(
  searchState.results.filter((r) => {
    if (filter.format === "gguf") return r.gguf_files.length > 0;
    // safetensors and all pass through — HF search already returns mixed
    return true;
  })
);
```

Use `filteredResults` in the each block instead of `searchState.results`.

---

## FIX 4: ModelBrowserPopup — Quant Variant Grouping

**Problem:** Search results show flat list of GGUF files. Multiple quant variants of the same model (Q4_K_M, Q6_K, Q8_0) appear as separate entries. Hard to compare.

**Solution:** Results are ALREADY grouped by `repo_id` (the `{#each searchState.results}` loop iterates repos, and inner `{#each result.gguf_files}` shows variants). The grouping exists structurally. What's missing is visual grouping — quant variants should be visually grouped with collapsible sections per repo.

### File: `ModelBrowserPopup.svelte`

The current structure (lines 168-214) already iterates `results → gguf_files`. This IS grouping by repo. The fix is cosmetic:
- Add a separator between repo groups (already has rounded-md border per repo)
- Add file count badge: `{result.gguf_files.length} variants`
- No structural change needed — mark this as ALREADY DONE in the existing structure

---

## FIX 5: ClyfActivationStep — Pipeline Monitor Expansion

**Problem:** Pipeline monitor (lines 139-157) has 4 fields: Brain status, VRAM, Last RT, Round-trips. Missing: STT status, TTS status, Token/s, Voice latency.

**Solution:** Expand to 8 fields. Most will show "—" since inference/voice are stubs in dev track. That's correct.

### File: `ClyfActivationStep.svelte`

**Lines 139-157** — Replace the pipeline monitor with expanded version:
```svelte
<!-- Pipeline monitor -->
<div
  class={cn(box({ paddingX: "8", paddingY: "4" }), "rounded border")}
  style="background: var(--surface-elevated); border-color: var(--border-subtle);"
>
  <div class="flex flex-wrap gap-x-6 gap-y-1">
    <Text size="xs" color="muted">
      STT: {sttStatus?.type === "hot" || sttStatus?.type === "standby" ? "ready" : "offline"}
    </Text>
    <Text size="xs" color="muted">
      Brain: {brainLoaded ? "hot" : "cold"}
    </Text>
    <Text size="xs" color="muted">
      TTS: {ttsStatus?.type === "hot" || ttsStatus?.type === "standby" ? "ready" : "offline"}
    </Text>
    <Text size="xs" color="muted">
      VRAM: {formatMb(hardwareState.vramUsedMb)}/{formatMb(hardwareState.vramTotalMb)}
    </Text>
    <Text size="xs" color="muted">
      Last: {lastRoundTripMs !== null ? `${lastRoundTripMs}ms` : "—"}
    </Text>
    <Text size="xs" color="muted">
      Token/s: —
    </Text>
    <Text size="xs" color="muted">
      Voice latency: —
    </Text>
    <Text size="xs" color="muted">
      Round-trips: {wizardState.roundTripCount}/3
    </Text>
  </div>
</div>
```

**Add derived state** for STT and TTS status (after line 38):
```typescript
const sttStatus = $derived(modelsState.statuses["voice.stt"]);
const ttsStatus = $derived(modelsState.statuses["voice.tts"]);
```

---

## FIX 6: ProjectSetupStep — Path Derivation + Profile Check + Portable Copy

**Problem:** Line 92 has hardcoded `D:\localdev\platform_devpulse\`. Path should derive from `.userdata/` (the portable data dir). Also doesn't call `checkDevProfile()` on mount.

**Context:** `hardwareState.metrics.model_dir` returns the `.userdata/models/` path. Parent is `.userdata/`. Projects folder is `.userdata/projects/`.

**Solution:** Derive path from `model_dir`. Add profile check on mount. Add portable copy offer when user browses external path.

### File: `ProjectSetupStep.svelte`

**Imports (line 9-16)** — Add:
```typescript
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { checkDevProfile } from "../wizard.service.js";
```

**After line 26** — Add derived paths + mount effect:
```typescript
/** Derive .userdata/ from model_dir (which ends in /models or \models) */
const dataDir = $derived(
  hardwareState.metrics?.model_dir?.replace(/[/\\]models[/\\]?$/, "") ?? ""
);
const projectsDir = $derived(dataDir ? `${dataDir}/projects` : "");

let browsedPath = $state<string | null>(null);
let showPortableCopyOffer = $state(false);

$effect(() => {
  checkDevProfile();
});
```

**Line 88-94** — Replace hardcoded path display:
```svelte
<!-- BEFORE -->
<Text size="xs" color="muted">
  Path: D:\localdev\platform_devpulse\
</Text>

<!-- AFTER -->
<Text size="xs" color="muted">
  Path: {projectsDir || "(detecting...)"}
</Text>
```

**"Browse" option (lines 97-114)** — When user picks "browse", show file picker + portable copy offer:

After `selectedOption = "browse"` handling, add file picker logic:
```typescript
async function browseForProject(): Promise<void> {
  const { open } = await import("@tauri-apps/plugin-dialog");
  const selected = await open({ directory: true, title: "Select project folder" });
  if (!selected) return;
  browsedPath = selected as string;
  // Check if path is outside .userdata — if so, offer portable copy
  if (dataDir && !browsedPath.startsWith(dataDir)) {
    showPortableCopyOffer = true;
  }
}
```

Add portable copy offer UI after the browse option label:
```svelte
{#if selectedOption === "browse" && showPortableCopyOffer && browsedPath}
  <div
    class={cn(box({ paddingX: "8", paddingY: "4" }), "rounded border")}
    style="background: var(--surface-elevated); border-color: var(--accent-teal-main);"
  >
    <div class={stack({ gap: "2" })}>
      <Text size="xs" weight="bold" color="primary">
        Portability Notice
      </Text>
      <Text size="xs" color="secondary">
        For a fully portable install, copy this project into {projectsDir}.
        We'll copy it for you — remember to delete the original if you want the space back.
      </Text>
      <div class={hstack({ gap: "2" })}>
        <button
          class="rounded px-3 py-1 text-xs border"
          style="background: var(--accent-teal-main); color: var(--surface-base);"
          onclick={() => { /* TODO: invoke copy command */ }}
        >
          Copy to .userdata/projects
        </button>
        <button
          class="rounded px-3 py-1 text-xs border"
          style="border-color: var(--border-subtle); color: var(--text-muted);"
          onclick={() => { showPortableCopyOffer = false; }}
        >
          Keep external (symlink)
        </button>
      </div>
    </div>
  </div>
{/if}
```

**Delete duplicate createDevProfile()** (lines 35-56) — Use the one from wizard.service.ts:
```typescript
import { checkDevProfile, createDevProfile } from "../wizard.service.js";
```

Remove the inline `createDevProfile` function and use the imported one.

---

## FIX 7: Seed Families — Add state.hot + state.cold

**Problem:** ClyfActivationStep line 145 shows `brainLoaded ? "hot" : "cold"`. Seed families have `state.warm` and `state.standby` but NO `state.hot` or `state.cold`. Missing families for the two most common model states.

### File: `seed-families.ts`

Add after the existing `state.standby` family (around line 183):

```typescript
{
  id: "state.hot",
  label: "Hot (Inference Ready)",
  coreFacts: [
    "Model is loaded and actively running inference",
    "GPU memory allocated and weights in VRAM",
    "Lowest possible latency — no load time",
  ],
  variations: [
    "Clyffy's brain is fully warmed up and ready to think.",
    "This model is live — responses come as fast as hardware allows.",
    "Loaded and locked in. Zero wait time.",
    "Running hot — the model has everything it needs in memory right now.",
  ],
  contextTriggers: ["slot_status:hot"],
},
{
  id: "state.cold",
  label: "Cold (On Disk)",
  coreFacts: [
    "Model file exists on disk but is not loaded into memory",
    "Must be loaded before inference (takes seconds to minutes)",
    "Zero resource usage while cold",
  ],
  variations: [
    "This model is on disk but hasn't been loaded yet.",
    "Sitting on the shelf. Need to load it before Clyffy can use it.",
    "Cold storage — the file is there, but it needs to be brought into memory.",
    "Not using any resources right now. Load it when you're ready.",
  ],
  contextTriggers: ["slot_status:cold"],
},
```

---

## FIX 8: ResourceAllocationPanel — Per-Slot Load Time Estimates

**Problem:** Timing estimates (lines 89-95) are generic ("GPU reserved: instant", "CPU burst: ~1-3s", "Cold storage: 3-30s"). Should show per-slot estimates based on model size and device.

### File: `ResourceAllocationPanel.svelte`

**Lines 89-95** — Replace generic estimates with per-slot estimates:
```svelte
<!-- Timing estimates per slot -->
<div class={stack({ gap: "1" })}>
  <Text size="xs" weight="bold" color="secondary">Estimated Load Times</Text>
  {#each modelsState.userSlots as slot (slot.id)}
    {@const model = modelsState.assignedModel(slot.id)}
    {@const isGpu = slot.preferred_device === "Gpu" || slot.preferred_device === "GpuWithCpuFallback"}
    {#if model}
      <Text size="xs" color="muted">
        {friendlySlotLabel(slot.id)}: {isGpu
          ? model.vram_estimate_mb > 4000 ? "~5-15s (large GPU model)" : "~2-5s (GPU)"
          : model.vram_estimate_mb > 1000 ? "~3-10s (CPU, large)" : "~1-3s (CPU)"}
      </Text>
    {/if}
  {/each}
  {#if modelsState.userSlots.every(s => !modelsState.assignedModel(s.id))}
    <Text size="xs" color="muted">Assign models to see load time estimates.</Text>
  {/if}
</div>
```

---

## FILES MODIFIED (Summary)

| # | File | Changes |
|---|------|---------|
| 1 | `wizard.types.ts` | Add "completion" to WizardPhase, WIZARD_PHASES, PHASE_INFO |
| 2 | `SetupWizard.svelte` | Add "completion" phase block rendering CompletionStep, change "project" onContinue to handleAdvance |
| 3 | `wizard.service.ts` | Add "completion" gate case |
| 4 | `ModelBrowserPopup.svelte` | Add targetSlot prop + slot selector + format filter + replace hardcoded "chat.brain" |
| 5 | `ModelLoaderStep.svelte` | Add browserTargetSlot state, pass to popup, update SlotAssignmentPanel callbacks |
| 6 | `ClyfActivationStep.svelte` | Expand pipeline monitor from 4→8 fields, add STT/TTS derived status |
| 7 | `ProjectSetupStep.svelte` | Derive path from model_dir, add checkDevProfile on mount, add portable copy offer, delete inline createDevProfile |
| 8 | `seed-families.ts` | Add state.hot + state.cold families |
| 9 | `ResourceAllocationPanel.svelte` | Replace generic timing with per-slot estimates |

---

## DEPENDENCIES TO VERIFY DURING EXECUTION

| Dependency | How to Check |
|-----------|-------------|
| `hardwareState.metrics.model_dir` available | Read `models.types.ts` HardwareInfo type — should have `model_dir?: string` from Sprint 11 |
| `modelsState.assignedModel(slotId)` returns model with `vram_estimate_mb` | Read `models.runes.svelte.ts` — verify method exists and return type |
| `SlotAssignmentPanel` onBrowseModels prop accepts optional SlotId | Read SlotAssignmentPanel.svelte — verify/update Props interface |
| `@tauri-apps/plugin-dialog` available for file picker | Check Cargo.toml for `tauri-plugin-dialog` or use `rfd` via custom command |
| `friendlySlotLabel` imported in all modified files | Grep after edits |

---

## MANDATORY EXECUTION CHECKLIST

### Completion Phase
- [ ] `WizardPhase` type includes "completion"
- [ ] `WIZARD_PHASES` array has 6 entries
- [ ] `PHASE_INFO` has 6 entries (6th dot in progress bar)
- [ ] SetupWizard renders CompletionStep for "completion" phase
- [ ] ProjectSetupStep onContinue advances to completion (NOT handleComplete)
- [ ] CompletionStep "Enter DevPulse" calls markOnboardingComplete → onComplete

### Model Browser
- [ ] ModelBrowserPopup has `targetSlot` prop (SlotId type)
- [ ] Slot selector dropdown renders all userSlots with friendlySlotLabel
- [ ] `selectedSlot` defaults to prop value
- [ ] Lines 205, 229, 238 use `selectedSlot` — ZERO "chat.brain" hardcodes remain
- [ ] Format filter dropdown (GGUF / SafeTensors / All)
- [ ] "Fits GPU only" checkbox filters results
- [ ] ModelLoaderStep passes browserTargetSlot to popup

### Pipeline Monitor
- [ ] ClyfActivationStep monitor has 8 fields: STT, Brain, TTS, VRAM, Last RT, Token/s, Voice latency, Round-trips
- [ ] STT/TTS status derived from modelsState

### Project Setup
- [ ] Path derived from `hardwareState.metrics.model_dir` → parent → /projects
- [ ] NO hardcoded `D:\localdev\` anywhere
- [ ] `checkDevProfile()` called on mount via $effect
- [ ] Inline createDevProfile DELETED, uses wizard.service import
- [ ] Portable copy offer shown when browsed path is outside .userdata
- [ ] Symlink mention for external paths

### Seed Families
- [ ] state.hot family with 4 variations + coreFacts
- [ ] state.cold family with 4 variations + coreFacts

### Resource Panel
- [ ] Per-slot timing estimates based on model size + device
- [ ] "Assign models to see estimates" fallback when no models assigned

### Quality Gates
- [ ] Grep for `"chat.brain"` in ModelBrowserPopup → 0 hardcoded hits
- [ ] Grep for `memoryLaneProtocol` in wizard module → 0 hits
- [ ] Grep for `resourceRules` in wizard module → 0 hits
- [ ] Grep for `D:\\localdev` in wizard module → 0 hits
- [ ] biome: 0 errors, 0 warnings on all modified files
- [ ] svelte-check: 0 errors

**If ANY checkbox unchecked, sprint is NOT done.**
