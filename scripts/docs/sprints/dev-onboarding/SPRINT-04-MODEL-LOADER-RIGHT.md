# Sprint 4: Phase 2 Right Panel — Model Browser Popup + Resource Allocation

| Field | Value |
|-------|-------|
| **Parent** | SPRINT-DEV-ONBOARDING-WIZARD.md |
| **Status** | `PLANNED` |
| **Files** | 2 new, 3 modified |
| **Depends on** | Sprint 1 (types, seed-families), Sprint 3 (ModelLoaderStep, downloadAndAssign) |

---

## PRE-FLIGHT

1. Read Sprint 3 output: `ModelLoaderStep.svelte` — confirm right panel slot exists
2. Read `search.service.ts` — confirm: `searchHuggingFace(query, limit)` returns HF results
3. Read `HfSearchResultInfo` type from bindings — confirm fields: `repo_id`, `author`, `model_name`, `downloads`, `likes`, `gguf_files` (Vec of `{filename, size_bytes, quant_level}`)
4. Read `catalog.service.ts` — confirm: `getCatalog()`, `getCatalogForSlot(slotId)`
5. Read `searchState` rune — confirm: `results`, `query`, `searching`, `search()`, `clear()`
6. Verify `ModelInfo.filename` field name from specta bindings (flagged as risk in Sprint 3)

---

## FILE 1: `features/setup-wizard/steps/ModelBrowserPopup.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/ModelBrowserPopup.svelte`

**Purpose:** Full popup overlay WITHIN the wizard viewport. Three sections: Curated (per hardware profile), Full Catalog (HF search), Local/Symlink. Per-model shows quant variants with fit indicators.

**Props:**
```typescript
interface Props {
  onClose: () => void;
  onDownload: (repoId: string, filename: string, targetSlot: string) => void;
  onImport: (targetSlot: string) => void;
}
```

**Imports:**
```typescript
import { X, Download, Search, FolderOpen, Link, Star } from "lucide-svelte";
import { Badge } from "$lib/design/components/badge/index.js";
import { Text } from "$lib/design/components/text/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { searchState } from "../../../runes/search.runes.svelte.js";
import { calculateFit, fitColor, formatMb, formatBytes } from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
import { pickVariation, getCoreFacts } from "../seed-families.js";
import type { HardwareProfile } from "../wizard.types.js";
```

**Layout (from spec Section 3.2):**
```
┌─────────────────────────────────────────────────────────────────┐
│ MODEL BROWSER                                              [X]  │
├─────────────────────────────────────────────────────────────────┤
│ [Search: _____________________]  [Filter: GGUF ▼]  [All ▼]     │
│                                                                 │
│ ─── CURATED: Recommended for {profile} ──────────────────────── │
│ (from wizardState.recommendations — already fetched in Sprint 2)│
│                                                                 │
│ Per model card:                                                 │
│   Model Name                                           ★ REC   │
│   ├── Q4_K_M.gguf    4.8 GB  [Download]  ✅ Fits GPU          │
│   ├── Q6_K.gguf      6.2 GB  [Download]  ⚠️ Tight            │
│   └── Q8_0.gguf      8.0 GB  [Download]  ❌ Won't fit         │
│   Seed family tooltip on quant badge                            │
│                                                                 │
│ ─── FULL CATALOG (HuggingFace) ──────────────────────────────── │
│ (uses searchState.search() + searchState.results)               │
│                                                                 │
│ ─── LOCAL / SYMLINK ─────────────────────────────────────────── │
│ [Scan models dir]  [Import from path...]  [Create Symlink...]   │
└─────────────────────────────────────────────────────────────────┘
```

**Curated section data source:**
- `wizardState.recommendations` — already populated by `fetchRecommendations()` in Sprint 2
- Group by model family (same repo = same card, different quant files = rows within card)
- Fit indicator per quant: `calculateFit(vramMb, hardwareState.vramFreeMb, hardwareState.vramTotalMb)`
- Fit badge color: `fitColor(fit)` — but use as ColdLight signal vars: `var(--signal-success)`, `var(--signal-warning)`, `var(--signal-error)`, `var(--text-muted)`

**HF Search section:**
- Text input bound to search query
- On input (debounced 500ms): `searchState.search(query)`
- Results from `searchState.results` — each has `gguf_files` array
- Per GGUF file: show size, quant level, download button, fit indicator

**Seed family tooltips:**
- On quant badge hover/focus: show `pickVariation("quant.q4_k_m")` etc.
- Implementation: title attribute for Sprint 4 (Clyffy-powered tooltips are interaction library — future sprint)

**Download action:**
- [Download] button calls `onDownload(repoId, filename, targetSlot)`
- Parent (ModelLoaderStep) routes this to `downloadAndAssign(rec)` from wizard.service

**Verification:**
- [ ] Popup renders as overlay with `fixed inset-0 z-50` or equivalent — within wizard, not a new window
- [ ] Close button [X] calls `onClose()`
- [ ] Curated section uses `wizardState.recommendations` — NOT a separate fetch
- [ ] HF search uses `searchState` rune — the REAL API
- [ ] Fit indicators use `calculateFit()` from `models.types.ts` — NOT reimplemented
- [ ] Fit colors use ColdLight signal vars (`--signal-success`, etc.) — NOT raw oklch from `fitColor()`
  - **NOTE:** `fitColor()` in models.types.ts returns raw oklch strings. For ColdLight compliance, map fit→signal var instead: green→`var(--signal-success)`, yellow→`var(--signal-warning)`, red→`var(--signal-error)`, gray→`var(--text-muted)`
- [ ] Seed family tooltips on quant badges
- [ ] All styling via ColdLight token vars

---

## FILE 2: `features/setup-wizard/steps/ResourceAllocationPanel.svelte`

**Path:** `interfaces/desktop/src/lib/domains/app/models/features/setup-wizard/steps/ResourceAllocationPanel.svelte`

**Purpose:** Right 40% panel in ModelLoaderStep. Shows resource allocation tiers: GPU Reserved, GPU Shared, CPU/DDR, Disk. Per-slot tier assignment. Persists via preferences.

**Props:**
```typescript
interface Props {
  /** No props needed — reads from wizardState + modelsState directly. */
}
```

**Imports:**
```typescript
import { Text } from "$lib/design/components/text/index.js";
import { Badge } from "$lib/design/components/badge/index.js";
import { box } from "$lib/design/utils/box/index.js";
import { stack } from "$lib/design/utils/stack/index.js";
import { hstack } from "$lib/design/utils/hstack/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { modelsState } from "../../../runes/models.runes.svelte.js";
import { hardwareState } from "../../../runes/hardware.runes.svelte.js";
import { formatMb, friendlySlotLabel } from "../../../types/models.types.js";
import { wizardState } from "../wizard.runes.svelte.js";
import { pickVariation } from "../seed-families.js";
import type { ResourceTier, ResourceRule } from "../wizard.types.js";
```

**Layout (from spec Section 3.6):**
```
RESOURCE ALLOCATION
──────────────────────────────

GPU Reserved (never unloaded):
  ▓ chat.brain      4.8 GB  [Lock to GPU ▼]
  ▓ minion.shared   0.4 GB  [Lock to GPU ▼]
  Total: 5.2 / 8.0 GB

GPU Shared (load/unload on signal):
  ░ vision.embedder  ~0.4 GB
  ░ voice.tts        ~0.3 GB
  Priority: voice > vision

CPU/DDR (always available):
  ▓ rag.embedder     0.6 GB
  ▓ rag.reranker     0.6 GB
  ▓ voice.stt        CPU

Disk (cold storage):
  All downloaded models available for swap
```

**Data sources:**
- Slot list: `modelsState.userSlots`
- Per-slot tier: `wizardState.resourceRules.find(r => r.slotId === slot.id)?.tier ?? defaultTier`
- Default tier derived from slot's `preferred_device`: GPU slots → gpu_reserved, CPU slots → cpu_ddr
- VRAM estimates: from `wizardState.recommendations` or `modelsState.assignedModel(slotId)?.vram_estimate_mb`
- Total VRAM: `hardwareState.vramTotalMb`

**Tier selector (per slot):**
- Dropdown: `<select>` with options: gpu_reserved, gpu_shared, cpu_ddr, disk_cold
- On change: update `wizardState.resourceRules` + persist via `set_preference("resource_rules", JSON.stringify(rules))`

**Clyffy narration:**
- Right panel includes a Clyffy speech bubble using `pickVariation("resource.allocation_tip")`
- Context-dependent: if VRAM headroom < 20%, warn about shared GPU conflicts

**Verification:**
- [ ] All 4 tiers from spec visible: GPU Reserved, GPU Shared, CPU/DDR, Disk
- [ ] Per-slot tier selector works — changes `wizardState.resourceRules`
- [ ] Total GPU reserved calculated from assigned models' VRAM estimates
- [ ] `formatMb()` used for all size displays
- [ ] Persistence via `set_preference` — uses raw invoke (same pattern as wizard.service)
- [ ] All styling via ColdLight token vars

---

## FILE 3 (MODIFY): `features/setup-wizard/steps/ModelLoaderStep.svelte`

**Wire the two new panels:**

```svelte
{#if wizardState.showModelBrowser}
  <ModelBrowserPopup
    onClose={() => wizardState.showModelBrowser = false}
    onDownload={handleBrowserDownload}
    onImport={handleBrowserImport}
  />
{/if}

<!-- Two-column layout -->
<div class="grid grid-cols-[3fr_2fr] gap-6 w-full min-h-0 flex-1">
  <SlotAssignmentPanel
    onBrowseModels={() => wizardState.showModelBrowser = true}
    onImport={() => { wizardState.importTargetSlot = "chat.brain"; wizardState.showImportPrompt = true; }}
  />
  <ResourceAllocationPanel />
</div>

{#if wizardState.showImportPrompt && wizardState.importTargetSlot}
  <ImportPrompt
    targetSlot={wizardState.importTargetSlot}
    onClose={() => wizardState.showImportPrompt = false}
    onComplete={handleImportComplete}
  />
{/if}
```

**Add imports:**
```typescript
import ModelBrowserPopup from "./ModelBrowserPopup.svelte";
import ResourceAllocationPanel from "./ResourceAllocationPanel.svelte";
import ImportPrompt from "./ImportPrompt.svelte";
import { downloadAndAssign } from "../wizard.service.js";
```

**Add handler functions:**
```typescript
async function handleBrowserDownload(repoId: string, filename: string, targetSlot: string): Promise<void> {
  const rec = wizardState.recommendations.find(r => r.repo === repoId && r.file === filename)
    ?? { name: filename, purpose: "", slot: targetSlot, sizeMb: 0, vramMb: 0, repo: repoId, file: filename, device: "any" as const };
  await downloadAndAssign(rec);
  wizardState.showModelBrowser = false;
}

function handleBrowserImport(targetSlot: string): void {
  wizardState.importTargetSlot = targetSlot;
  wizardState.showImportPrompt = true;
  wizardState.showModelBrowser = false;
}

async function handleImportComplete(filename: string): Promise<void> {
  wizardState.showImportPrompt = false;
  await modelsState.scan();
  await modelsState.refresh();
}
```

**Verification:**
- [ ] ModelBrowserPopup renders as overlay when `showModelBrowser` is true
- [ ] ImportPrompt renders when `showImportPrompt` is true
- [ ] ResourceAllocationPanel in right column
- [ ] SlotAssignmentPanel in left column
- [ ] Browser download flows through `downloadAndAssign`
- [ ] Import triggers scan + refresh after completion

---

## FILE 4 (MODIFY): `features/setup-wizard/seed-families.ts`

**Add families needed by Sprint 4:**

```typescript
// Model-specific families
{ id: "model.qwen3", coreFacts: ["Alibaba Cloud", "Strong multilingual", "Excellent at code"],
  variations: [...4 phrasings...], contextTriggers: ["model_browser:card"] }

{ id: "model.phi4", coreFacts: ["Microsoft", "3.8B params", "Punches above weight on math/code"],
  variations: [...4 phrasings...], contextTriggers: ["model_browser:card"] }

{ id: "model.gemma3", coreFacts: ["Google", "4B params", "Balanced general-purpose"],
  variations: [...4 phrasings...], contextTriggers: ["model_browser:card"] }

// Resource allocation families
{ id: "resource.allocation_tip", coreFacts: ["GPU reserved = always loaded", "Shared = on-demand"],
  variations: [...4 phrasings...], contextTriggers: ["resource_panel:mount"] }

{ id: "resource.vram_tight", coreFacts: ["VRAM near full", "Consider moving models to CPU"],
  variations: [...4 phrasings...], contextTriggers: ["resource_panel:vram_low"] }
```

---

## FILE 5 (MODIFY): `features/setup-wizard/wizard.types.ts`

**Add `ModelBrowserFilter` type:**

```typescript
export interface ModelBrowserFilter {
  format: "gguf" | "safetensors" | "all";
  maxSizeMb: number | null;
  fitOnly: boolean;
}
```

---

## MANDATORY EXECUTION CHECKLIST

This checklist MUST be completed IN ORDER. Every item verified. No item skipped. No assumptions.

### Phase A: Per-File Authoring Verification

For EACH file written or modified:

- [ ] **Re-read after writing** — every line matches sprint doc
- [ ] **Zero unused imports** — wire or delete
- [ ] **Zero undefined references** — every identifier traced
- [ ] **Zero `any` types**
- [ ] **All imports use `.js` extension**
- [ ] **No raw oklch/hex/rgb/hsl** — all colors via ColdLight token vars. Specifically: fit indicator colors MUST use `var(--signal-success)`, `var(--signal-warning)`, `var(--signal-error)`, `var(--text-muted)` — NOT the raw oklch strings from `fitColor()`.
- [ ] **No legacy Svelte stores**
- [ ] **File matches sprint doc**

### Phase B: Component-Specific Verification

- [ ] **ModelBrowserPopup** — renders as overlay (fixed/absolute positioned) WITHIN wizard viewport. Has [X] close button. Three sections: Curated, HF Search, Local/Symlink.
- [ ] **ModelBrowserPopup curated** — reads from `wizardState.recommendations`. Groups by model family. Shows quant variants per model.
- [ ] **ModelBrowserPopup search** — uses `searchState` rune. Input debounced. Results show gguf_files with sizes.
- [ ] **ModelBrowserPopup fit indicators** — `calculateFit()` from models.types used (NOT reimplemented). Colors mapped to signal vars.
- [ ] **ModelBrowserPopup seed tooltips** — quant badges have title attrs with `pickVariation("quant.q4_k_m")` etc.
- [ ] **ResourceAllocationPanel** — shows 4 tiers: GPU Reserved, GPU Shared, CPU/DDR, Disk. Each slot has tier selector.
- [ ] **ResourceAllocationPanel persistence** — tier changes call `set_preference`. Verify invoke params match Rust command.
- [ ] **ModelLoaderStep wired** — ModelBrowserPopup opens when `showModelBrowser` true. ResourceAllocationPanel in right column. ImportPrompt opens when `showImportPrompt` true.

### Phase C: Biome Enforcement (MANDATORY)

```bash
cd interfaces/desktop && npx biome check src/lib/domains/app/models/features/setup-wizard/ --diagnostic-level=warn
```

- [ ] **Zero errors**
- [ ] **Zero warnings**
- [ ] **Re-run after fixes**

```bash
cd interfaces/desktop && npx biome format --write src/lib/domains/app/models/features/setup-wizard/
```

- [ ] **Format applied and verified**

### Phase D: TypeScript Verification (MANDATORY)

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] **Zero errors from our files**
- [ ] **Zero warnings from our files**
- [ ] **Read FULL output**

### Phase E: Faithfulness Check

- [ ] **Model browser has all 3 sections** — curated, HF search, local/symlink. Visually verify.
- [ ] **Curated models match hardware profile** — if ENTRY_8GB, shows 8GB-appropriate models
- [ ] **Resource allocation shows all 4 tiers** — count them
- [ ] **New seed families added** — model.qwen3, model.phi4, model.gemma3, resource.allocation_tip, resource.vram_tight. Count >= 5 new families.
- [ ] **ModelBrowserFilter type added to wizard.types.ts**
- [ ] **Full Phase 2 end-to-end** — scan hardware → see recommendations → open browser → select model → download → assign → close browser → continue enabled

### Phase F: Sprint Done Gate

- [ ] **ALL above checked**
- [ ] **Sprint doc status → COMPLETE**
- [ ] **Next sprint dependencies met** — Sprint 5 needs ImportPrompt ready to receive real params

**If ANY checkbox unchecked, do NOT proceed to Sprint 5.**
