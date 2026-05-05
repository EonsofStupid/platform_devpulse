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

# Sprint ML-03: SlotAssignmentPanel — Glass Cards + Inline Expand

| Field | Value |
|-------|-------|
| **Status** | `PLANNED` |
| **Depends on** | ML-01 (clean registry), ML-02 (download tracking state) |
| **Blocks** | ML-04, ML-05, ML-06 |
| **Files** | 1 deleted, 1 rewritten (~450-550 lines) |
| **Risk** | MEDIUM — full rewrite of primary UI component |

---

## PROBLEM STATEMENT

The current SlotAssignmentPanel is text-xs rows on flat backgrounds with a broken floating modal (ModelPicker) for assignment. The owner requires:
- Glass cards with teal glow on loaded slots
- Inline expandable model lists (no floating layers)
- Real metadata display (arch, quant, size, VRAM, context, fit)
- Download progress with speed/ETA/cancel inline in the card
- Hard VRAM guard (Load button disabled when impossible)
- Subsystem grouping with chat.brain first
- Minimum text-sm everywhere

---

## PRE-FLIGHT

1. Read `steps/SlotAssignmentPanel.svelte` — CURRENT full file
2. Read `steps/ModelPicker.svelte` — being deleted, confirm no other imports reference it
3. Read `steps/ModelLoaderStep.svelte` — confirm it imports SlotAssignmentPanel and how
4. GREP `ModelPicker` across entire `features/setup-wizard/` — list ALL references
5. Read `$lib/design/components/card/Card.svelte` — confirm `preset="glass"` resolves
6. Read `$lib/design/components/progress/Progress.svelte` — confirm `value`/`max`/`size` props
7. Read `$lib/design/components/badge/Badge.svelte` — confirm variant/size props
8. Read `$lib/design/utils/clamp/clamp.ts` — confirm FLUID_PADDING/FLUID_SPACE exports
9. Confirm `renderForge({ kind: "card", preset: "glass" })` test exists and passes (renderforge/resolve.test.ts:71)

---

## FILE 1: DELETE `steps/ModelPicker.svelte`

Before deleting:
- GREP for `ModelPicker` in ALL files under `domains/app/models/`
- List every file that imports it
- Update those files to remove the import and any rendering

Expected: only `SlotAssignmentPanel.svelte` imports it. The rewrite removes that import.

---

## FILE 2: REWRITE `steps/SlotAssignmentPanel.svelte`

### Component contract:

```typescript
interface Props {
    onBrowseModels: () => void;  // Scrolls to HF search section (ML-05)
    onImport: (slotId: SlotId) => void;  // Opens native file picker for slot
}
```

### Imports:

```typescript
import { Brain, ChevronDown, ChevronUp, Cpu, Download, Eye, FolderOpen,
    Mic, Power, PowerOff, Search, Volume2, X } from "lucide-svelte";
import { Card } from "$lib/design/components/card/index.js";
import { Progress } from "$lib/design/components/progress/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { Button } from "$lib/design/components/button/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { Separator } from "$lib/design/components/separator/index.js";
import { Spinner } from "$lib/design/components/spinner/index.js";
import { renderForge, cssVarString } from "$lib/design/renderforge/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { ModelInfo, SlotInfo } from "$lib/sys/generated/bindings.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import type { SlotId } from "../../../types/models.types.js";
import {
    calculateFit, fitColor, fitLabel, formatContext, formatEta,
    formatMb, formatSpeed, friendlySlotLabel, isInferenceReady,
    slotDescription, statusColor, statusLabel,
} from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
import {
    autoAssignAllSlots, bulkDownloadAndAssign, cancelActiveDownload,
    downloadAndAssign,
} from "../wizard.service.js";
import type { ModelRec } from "../wizard.types.js";
```

### State:

```typescript
let expandedSlot = $state<string | null>(null);
const cardMacro = $derived(renderForge({ kind: "card", preset: "glass" }));
```

### Slot icon map (const, not reactive):

```typescript
const SUBSYSTEM_ICON: Record<string, typeof Brain> = {
    chat: Brain, minion: Cpu, rag: Search, vision: Eye, voice: Mic,
};
function slotIcon(slotId: string): typeof Brain {
    if (slotId === "voice.tts") return Volume2;
    const sub = slotId.split(".")[0];
    return SUBSYSTEM_ICON[sub] ?? Brain;
}
```

### Slot ordering (chat.brain first, then by subsystem):

```typescript
const orderedSubsystems = $derived(() => {
    const subs = modelsState.userSubsystems;
    const order = ["chat", "minion", "rag", "vision", "voice"];
    return order.filter(k => subs[k]?.length > 0).map(k => ({
        key: k,
        label: modelsState.subsystemLabels[k] ?? k,
        slots: subs[k],
    }));
});
```

### VRAM guard (per slot, derived):

```typescript
function canLoadModel(model: ModelInfo | null): boolean {
    if (!model) return false;
    if (!hardwareState.hasGpu) return true; // CPU mode, always allow
    // Hard block: model needs more VRAM than GPU physically has
    return model.vram_estimate_mb <= hardwareState.vramTotalMb;
}

function vramGuardMessage(model: ModelInfo | null): string | null {
    if (!model || !hardwareState.hasGpu) return null;
    if (model.vram_estimate_mb > hardwareState.vramTotalMb) {
        return `Too large for your GPU (needs ${formatMb(model.vram_estimate_mb)}, GPU has ${formatMb(hardwareState.vramTotalMb)})`;
    }
    return null;
}
```

### Template structure:

See the detailed spec in the approved plan file (snuggly-meandering-cake.md Phase 2 / Sprint 3 section). Every element specified there is implemented:
- Glass Card per slot with data-loaded/data-status attributes
- Teal glow CSS on loaded, red glow on failed
- Header: icon + label (text-base) + description (text-sm) + status Badge
- Model info section with full metadata
- Inline expandable model list with compatible/incompatible sections
- Download progress bar with speed/ETA/cancel
- Action footer with VRAM-guarded Load, Unload, Loading spinner, Failed error + Retry
- Bulk section: Auto-Configure, Download All, Browse HF
- Subsystem section headers with Separator

### Scoped CSS:

```css
<style>
.slot-card {
    transition: border-color 0.3s ease, box-shadow 0.3s ease;
}
.slot-card[data-loaded="true"] {
    border-color: var(--accent-teal-main);
    box-shadow: 0 0 24px oklch(0.7 0.15 190 / 0.35),
                inset 0 1px 0 oklch(1 0 0 / 0.06);
}
.slot-card[data-status="failed"] {
    border-color: var(--signal-error);
    box-shadow: 0 0 16px oklch(0.5 0.2 25 / 0.3);
}
.model-list-enter {
    animation: model-list-expand 200ms ease-out;
}
@keyframes model-list-expand {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
}
.model-row:hover {
    background: oklch(0.2 0.01 220 / 0.3);
}
.model-row[data-assigned="true"] {
    outline: 2px solid var(--accent-teal-main);
    outline-offset: -2px;
}
</style>
```

---

## VERIFICATION CHECKLIST

### Before writing:

- [ ] **Confirmed ModelPicker.svelte references** — GREP output pasted, all references identified
- [ ] **Confirmed Card preset="glass" works** — test file renderforge/resolve.test.ts:71 referenced
- [ ] **Read Progress component** — confirmed value/max/size props exist

### After deleting ModelPicker.svelte:

- [ ] **GREP `ModelPicker` in entire models domain** — 0 results
- [ ] **No broken imports** — no file references deleted component

### After writing SlotAssignmentPanel.svelte:

- [ ] **Re-read the FULL file** in chunks (it's 450+ lines)
  - Chunk 1: imports + state (first 50 lines)
  - Chunk 2: helper functions (lines 50-100)
  - Chunk 3: template — card structure (lines 100-250)
  - Chunk 4: template — expandable list + download + actions (lines 250-400)
  - Chunk 5: bulk section + scoped CSS (lines 400+)
- [ ] **Confirm NO text-xs** — GREP `text-xs` in the file — must return 0 results
- [ ] **Confirm NO floating layers** — GREP `fixed|absolute|z-50|portal` in the file — must return 0 results (except scoped CSS animations)
- [ ] **Confirm renderForge used** — `renderForge({ kind: "card", preset: "glass" })` present, `cssVarString()` applied to card element
- [ ] **Confirm data attributes** — `{...cardMacro.dataAttrs}` spread on card element. No custom `data-*` beyond `data-loaded` and `data-status` for CSS hooks
- [ ] **Confirm VRAM guard** — Load button has `disabled={!canLoadModel(model)}`, guard message displayed when model too large
- [ ] **Confirm download progress** — `wizardState.downloadForSlot(slot.id)` checked, ColdLight Progress rendered when active
- [ ] **Confirm cancel button** — calls `cancelActiveDownload(dl.downloadId)` not some other function
- [ ] **Confirm no unused imports** — every import statement's exports are referenced in the template

### Compilation:

- [ ] `pnpm svelte-check` — **PASTE the COMPLETED line**. `0 ERRORS` required.
- [ ] Count warnings — **STATE the count and what each warning is**. a11y warnings documented with reason.

### Visual (requires running app):

Owner will verify:
- [ ] Glass cards visible with depth (not flat)
- [ ] Teal glow on loaded slot cards
- [ ] Subsystem headers visible (Chat, Search Pipeline, Voice)
- [ ] chat.brain card appears FIRST
- [ ] Model metadata visible inline (arch, quant, size, VRAM, context)
- [ ] Inline expand works — card grows, no floating layer
- [ ] Load button disabled on oversized models with message
- [ ] Download progress bar with speed/ETA inline in card

---

## WHAT THIS SPRINT DOES NOT TOUCH

- ModelLoaderStep.svelte layout (ML-04)
- ResourceAllocationPanel.svelte VRAM bar (ML-04)
- SwapOverlay.svelte retry (ML-04)
- HuggingFaceSearch.svelte (ML-05)
- Toaster mounting (ML-04)
- Any Rust code
- wizard.runes.svelte.ts (done in ML-02)
- wizard.service.ts (done in ML-02)
