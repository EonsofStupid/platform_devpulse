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

# Sprint 3: Phase 2 Left Panel — Slot Assignment + Import + Download-Assign Flow

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md |
| **Status** | `PLANNED` |
| **Files** | 3 new, 2 modified |
| **Depends on** | Sprint 1 (types, runes), Sprint 2 (wizard.service, seed-families) |
| **Consumers** | Sprint 4 (ModelBrowserPopup, ResourceAllocation wire into ModelLoaderStep) |

---

## PRE-FLIGHT

1. Read Sprint 1+2 output files — verify `wizardState`, `wizard.service.ts`, `wizard.types.ts` exist
2. Read `modelsState` rune — confirm API: `slots`, `models`, `statuses`, `assign()`, `load()`, `scan()`, `refresh()`, `assignedModel()`, `userSlots`
3. Read `download.service.ts` — confirm: `downloadModel(repoId, filename)` returns downloadId, `onDownloadProgress(cb)`, `onDownloadComplete(cb)`, `importLocalModel()` (no params yet)
4. Read `slots.service.ts` — confirm: `assignModelToSlot(slotId, modelId)`, `loadSlot(slotId)`
5. Verify `SlotInfo` fields: `id`, `label`, `capability`, `preferred_device`, `assigned_model_id`, etc.

---

## FILE 1: `features/setup-wizard/steps/ModelLoaderStep.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/ModelLoaderStep.svelte`

**Purpose:** Phase 2 orchestrator. Two-column layout (60/40). Left: SlotAssignmentPanel. Right: placeholder for ResourceAllocationPanel (wired in Sprint 4). VRAM budget bar at top.

**Props:**
```typescript
interface Props {
  onContinue: () => void;
  onBack: () => void;
  continueEnabled: boolean;
  continueBlockers: string[];
}
```

**Imports:**
```typescript
import { Text } from "$lib/design/components/text/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import VramGauge from "../../../components/VramGauge.svelte";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { wizardState } from "../wizard.runes.svelte.js";
import { pickVariation } from "../seed-families.js";
import SlotAssignmentPanel from "./SlotAssignmentPanel.svelte";
// ResourceAllocationPanel imported in Sprint 4
// ModelBrowserPopup imported in Sprint 4
```

**Layout:**
```
┌─────────────────────────────────────────────────────┐
│ VRAM Budget Bar (VramGauge, full width)              │
├───────────────────────────┬─────────────────────────┤
│ SlotAssignmentPanel (60%) │ Right panel (40%)        │
│                           │ (Clyffy narration for    │
│                           │  now — ResourceAlloc     │
│                           │  added in Sprint 4)      │
├───────────────────────────┴─────────────────────────┤
│ [← Back]                           [Continue →]      │
│ (Continue disabled if gate blocked)                  │
│ If blocked, show first blocker from continueBlockers │
└─────────────────────────────────────────────────────┘
```

**Key details:**
- VramGauge reuses existing component from `components/VramGauge.svelte`
- Props for VramGauge: `usedMb={hardwareState.vramUsedMb}`, `totalMb={hardwareState.vramTotalMb}`, `hasGpu={hardwareState.hasGpu}`, `gpuError={hardwareState.gpuError}`, `label={hardwareState.gpuName}`
- Two-column: CSS grid `grid-template-columns: 3fr 2fr` or flex with explicit widths
- Continue button disabled when `!continueEnabled`, shows `continueBlockers[0]` as explanation
- Back button calls `onBack()`

**Verification:**
- [ ] VramGauge receives correct props from hardwareState (verified getter names)
- [ ] Two-column layout renders — left 60%, right 40%
- [ ] Continue button disabled state + blocker message works
- [ ] No raw oklch — all ColdLight token vars

---

## FILE 2: `features/setup-wizard/steps/SlotAssignmentPanel.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/SlotAssignmentPanel.svelte`

**Purpose:** Lists all 7 user-visible slots. Each shows: assigned model name, status badge, device, VRAM estimate. Actions per slot: select model (from downloaded), download recommended. Bulk actions: Install All Suggested, Import, Browse Models.

**Props:**
```typescript
interface Props {
  onBrowseModels: () => void;
  onImport: () => void;
}
```

**Imports:**
```typescript
import { Download, FolderOpen, Search, Zap, Check, Loader2, X } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { modelsState } from "../../../runes/hardware.runes.svelte.js";  // WRONG — should be models
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import {
  formatMb,
  friendlySlotLabel,
  statusLabel,
  statusColor,
  calculateFit,
  fitColor,
} from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
import { downloadAndAssign } from "../wizard.service.js";
import type { ModelRec } from "../wizard.types.js";
```

**Per-slot row renders:**
```
─── AI Brain (chat.brain) ──────────────────────────────
[Qwen3-8B-Q4_K_M.gguf ▼]  [● LOADED]  4.8 GB  GPU
```

**Data source for each row:**
- Slot list: `modelsState.userSlots` (filters out embedded slots)
- Assigned model: `modelsState.assignedModel(slot.id)` → `ModelInfo | null`
- Status: `modelsState.statuses[slot.id]` → `ModelStatus`
- Friendly name: `friendlySlotLabel(slot.id)`
- Status text: `statusLabel(status)`
- Status color: `statusColor(status)`
- Recommendation: `wizardState.recommendations.find(r => r.slot === slot.id)`
- Fit indicator: `calculateFit(rec.vramMb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)`

**Per-slot actions:**
- If recommendation exists + model not downloaded: [Download] button → calls `downloadAndAssign(rec)`
- If model downloaded but not assigned: [Assign] button → calls `modelsState.assign(slotId, modelId)`
- If model assigned but not loaded: [Load] button → calls `modelsState.load(slotId)`

**Bulk actions (bottom):**
- [Install All Suggested] → calls `bulkDownloadAndAssign(wizardState.recommendations)` (from wizard.service)
- [Import from Disk] → calls `onImport()` prop (opens ImportPrompt)
- [Browse Models] → calls `onBrowseModels()` prop (opens ModelBrowserPopup)

**Verification:**
- [ ] `modelsState.userSlots` used — not `modelsState.slots` (filters embedded)
- [ ] `modelsState.assignedModel(slotId)` returns `ModelInfo | null` (verified in rune line 188)
- [ ] `modelsState.statuses[slotId]` returns `ModelStatus` discriminated union (verified in rune line 28)
- [ ] `friendlySlotLabel` maps all 8 slot IDs (verified in models.types.ts line 142-153)
- [ ] Each action button calls the correct service method with correct params
- [ ] Status badge variant maps: loaded→positive, loading→informative, failed→negative, not_loaded→neutral
- [ ] All styling via ColdLight token vars

---

## FILE 3: `features/setup-wizard/steps/ImportPrompt.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/ImportPrompt.svelte`

**Purpose:** Modal overlay for import mode selection. Shows after file picker. User picks: copy (portable) or symlink (saves space). Shows target path, disk impact, warnings.

**Props:**
```typescript
interface Props {
  /** The slot this import targets. */
  targetSlot: string;
  /** Close the prompt. */
  onClose: () => void;
  /** Import completed. */
  onComplete: (filename: string) => void;
}
```

**Imports:**
```typescript
import { Copy, Link, X } from "lucide-svelte";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { friendlySlotLabel } from "../../../types/models.types.js";
import { slotToSubdir } from "../import-router.js";
import type { ImportMode } from "../wizard.types.js";
```

**State:**
```typescript
let importMode = $state<ImportMode>("copy");
let importing = $state(false);
let error = $state<string | null>(null);
```

**Behavior:**
- Displays target slot name via `friendlySlotLabel(targetSlot)`
- Shows target directory: `~/.devpulse/models/${slotToSubdir(targetSlot)}/`
- Two radio options:
  - **Copy to DevPulse** — portable, uses disk space, safe default
  - **Create Symlink** — no extra space, NOT portable, breaks if source moves
- Warnings from spec Section 3.5 verbatim
- [Import] button triggers file picker + import
- **NOTE:** Until Sprint 5 modifies the Rust command, import ALWAYS copies to `models/chat/` regardless of UI selection. The UI is correct — the backend catches up in Sprint 5. This is documented, not hidden.
- After Sprint 5: calls `importLocalModel(targetSlot, importMode)` with new params

**Current workaround (until Sprint 5):**
```typescript
async function handleImport(): Promise<void> {
  importing = true;
  error = null;
  try {
    // TODO(Sprint-5): Pass targetSlot + importMode to backend
    // Current backend hardcodes to models/chat/ — Sprint 5 fixes this
    const { importLocalModel } = await import("../../../services/download.service.js");
    const filename = await importLocalModel();
    onComplete(filename);
  } catch (e) {
    error = e instanceof Error ? e.message : String(e);
  } finally {
    importing = false;
  }
}
```

**Verification:**
- [ ] Two radio options: copy (default) and symlink
- [ ] `slotToSubdir(targetSlot)` shows correct target path
- [ ] Warning text matches spec Section 3.5 verbatim
- [ ] Error displayed raw — no generic messages
- [ ] TODO comment documents Sprint 5 dependency explicitly
- [ ] All styling via ColdLight token vars

---

## FILE 4 (MODIFY): `features/setup-wizard/wizard.service.ts`

**Add methods for Phase 2:**

```typescript
import { downloadModel, onDownloadProgress, onDownloadComplete } from "../../services/download.service.js";
import { scanModels } from "../../services/registry.service.js";

/** Download a single model and assign it to its target slot. */
export async function downloadAndAssign(rec: ModelRec): Promise<void> {
  wizardState.error = null;
  try {
    // 1. Start download
    const downloadId = await downloadModel(rec.repo, rec.file);

    // 2. Wait for download complete event
    await new Promise<void>((resolve, reject) => {
      const unsub = onDownloadComplete((data) => {
        if (data.downloadId === downloadId) {
          unsub();
          resolve();
        }
      });
      // Timeout after 30 minutes
      setTimeout(() => { unsub(); reject(new Error("Download timed out")); }, 30 * 60 * 1000);
    });

    // 3. Scan registry to discover the new file
    await modelsState.scan();
    await modelsState.refresh();

    // 4. Find the model by filename in registry
    const model = modelsState.models.find(m => m.filename === rec.file);
    if (!model) {
      throw new Error(`Downloaded ${rec.file} but not found in registry after scan`);
    }

    // 5. Assign to target slot
    await modelsState.assign(rec.slot, model.id);

  } catch (e) {
    wizardState.error = e instanceof Error ? e.message : String(e);
    throw e;
  }
}

/** Download all recommendations sequentially, assigning each after download. */
export async function bulkDownloadAndAssign(recs: ModelRec[]): Promise<void> {
  wizardState.downloadQueue = [...recs];
  wizardState.error = null;

  for (let i = 0; i < recs.length; i++) {
    wizardState.downloadingIndex = i;
    wizardState.downloadProgress = 0;
    try {
      await downloadAndAssign(recs[i]);
    } catch (e) {
      // Log but continue with remaining downloads
      console.error(`[wizard] Failed to download ${recs[i].file}:`, e);
    }
  }

  wizardState.downloadingIndex = -1;
  wizardState.downloadQueue = [];
}
```

**Import additions at top of file:**
```typescript
import type { ModelRec } from "./wizard.types.js";
```

**Verification:**
- [ ] `downloadModel(rec.repo, rec.file)` matches `download.service.ts` signature: `downloadModel(repoId: string, filename: string): Promise<string>`
- [ ] `onDownloadComplete` callback receives `{ downloadId: string }` (verified in download.service.ts line 96-99)
- [ ] `modelsState.scan()` triggers `scanModels()` from registry service (verified in rune line 64-76)
- [ ] `modelsState.assign(slotId, modelId)` calls `assignModelToSlot` (verified in rune line 79-91)
- [ ] `model.filename` field exists on `ModelInfo` (need to verify — check specta bindings)
- [ ] Bulk download is SEQUENTIAL (not parallel) — prevents VRAM/disk contention
- [ ] Error in bulk doesn't stop remaining downloads — continues with next
- [ ] All imports use `.js` extension

**RISK:** `ModelInfo.filename` field — need to verify this exists. The `ModelInfo` type comes from specta bindings. If the field name is different (e.g., `file_name` or `path`), the `find` will fail silently. READ the generated bindings before implementing.

---

## FILE 5 (MODIFY): `features/setup-wizard/wizard.runes.svelte.ts`

**Add download tracking state that Sprint 1 stubbed:**

No structural changes needed — `downloadQueue`, `downloadingIndex`, `downloadProgress` already defined in Sprint 1. Verify they're there.

**Add `showImportPrompt` target slot:**
```typescript
importTargetSlot = $state<string | null>(null);
```

This tracks WHICH slot the import prompt is for.

---

## MANDATORY EXECUTION CHECKLIST

This checklist MUST be completed IN ORDER. Every item verified. No item skipped. No assumptions.

### Phase A: Per-File Authoring Verification

For EACH file written or modified:

- [ ] **Re-read the file after writing** — every line matches sprint doc
- [ ] **Zero unused imports** — every import used. If not, wire it or delete it.
- [ ] **Zero undefined references** — every identifier defined or imported
- [ ] **Zero `any` types** — no implicit or explicit any
- [ ] **All imports use `.js` extension**
- [ ] **No raw oklch/hex/rgb/hsl** — all colors via ColdLight token vars
- [ ] **No legacy Svelte stores** — $state/$derived/$effect only
- [ ] **File matches sprint doc description**

### Phase B: Component-Specific Verification

- [ ] **ModelLoaderStep** — two-column layout renders (60/40 split). VramGauge in header. SlotAssignmentPanel in left. Right column has placeholder for Sprint 4.
- [ ] **SlotAssignmentPanel** — uses `modelsState.userSlots` (NOT `.slots`). Each slot shows: friendly name via `friendlySlotLabel()`, status via `statusLabel()`, assigned model via `modelsState.assignedModel()`.
- [ ] **SlotAssignmentPanel** — per-slot actions work: Download calls `downloadAndAssign`, Assign calls `modelsState.assign`, Load calls `modelsState.load`.
- [ ] **ImportPrompt** — two radio options (copy/symlink). Default is copy. Target path uses `slotToSubdir()`. TODO comment documents Sprint 5 dependency.
- [ ] **All props interfaces match sprint doc exactly**
- [ ] **All event handlers wired** — no dead onclick/onsubmit

### Phase C: Service Method Verification

- [ ] **downloadAndAssign(rec)** — calls `downloadModel(rec.repo, rec.file)`, waits for `onDownloadComplete`, calls `modelsState.scan()`, finds model by `rec.file`, calls `modelsState.assign(rec.slot, model.id)`. Verify EACH step.
- [ ] **bulkDownloadAndAssign(recs)** — iterates sequentially. Error in one does NOT stop the rest. Updates `wizardState.downloadingIndex` per iteration.
- [ ] **ModelInfo.filename field verified** — READ the specta bindings to confirm the field name. If it's different, fix the find() call.

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

### Phase F: Faithfulness Check

- [ ] **All 7 slots visible** — chat.brain, minion.shared, rag.embedder, rag.reranker, vision.embedder, voice.stt, voice.tts. Count them in the rendered output.
- [ ] **Continue gate enforced** — Continue button disabled until chat.brain status is "loaded"
- [ ] **Blocker message shown** — when gate blocked, first blocker string from `continueBlockers` displays
- [ ] **Import prompt shows correct path** — `slotToSubdir(targetSlot)` renders the right subdirectory
- [ ] **Error display is RAW** — no generic messages. The exact error string from the service renders.

### Phase G: Sprint Done Gate

- [ ] **ALL above checked**
- [ ] **Sprint doc status → COMPLETE**
- [ ] **Next sprint dependencies met** — Sprint 4 needs: ModelLoaderStep with right panel slot, wizardState.showModelBrowser flag, downloadAndAssign accessible

**If ANY checkbox unchecked, do NOT proceed to Sprint 4.**
