# Sprint: MeltUI Adapter Foundation

**Date**: 2026-03-05
**Status**: READY FOR REVIEW
**Blocks**: SPRINT-STARTUP-EXPERIENCE (toggle error blocks app launch)
**Priority**: CRITICAL (app cannot start without this)

---

## Problem Statement

The MeltUI adapter layer has 6 structural defects:

1. **2 missing adapter folders** (toggle, accordion) — toggle blocks every route
2. **3 wrong contracts** (dialog, tabs, spatialmenu say "coldlight" but have meltui adapter folders)
3. **3 missing adapter.contract.ts** files (dialog, tabs, spatialmenu)
4. **Naming inconsistency** (hyphenated kinds vs flat folder names)
5. **No shared-builder pattern** (Dialog builder should back dialog + alert-dialog + sheet)
6. **Scanner is permissive** (failOnParity: false, no content validation, no orphan detection)

## Architecture Decision: MeltUI-First

**Owner directive**: If MeltUI has a builder for it, MeltUI handles it. Period.

ColdLight builders EXTEND MeltUI to cover primitives MeltUI doesn't have builders for.
One MeltUI builder can back multiple ColdLight primitives (2-4 per builder for overlay/floating patterns).

### Builder-to-Primitive Mapping (SSOT)

```
MeltUI Builder        ColdLight Primitives (all share same builder)
-----------------------------------------------------------------
Accordion          -> accordion
Avatar             -> avatar
Collapsible        -> collapsible
Combobox           -> combobox
Dialog             -> dialog, alert-dialog, sheet
FileUpload         -> file-upload
PinInput           -> pin-input
Popover            -> popover, link-preview
Progress           -> progress
RadioGroup         -> radio-group
Select             -> select
Slider             -> slider
SpatialMenu        -> (internal — navigation patterns)
Tabs               -> tabs
Toaster            -> toaster
Toggle             -> toggle
Tooltip            -> tooltip
Tree               -> tree
```

### Naming Convention (LOCKED after this sprint)

```
Primitive kind:     kebab-case   (file-upload, pin-input, radio-group, alert-dialog)
Adapter folder:     kebab-case   (file-upload/, pin-input/, radio-group/, alert-dialog/)
Factory function:   camelCase    (createFileUploadTransport, createPinInputTransport)
MeltUI class:       PascalCase   (FileUpload, PinInput, RadioGroup)
Transport type:     PascalCase   (FileUploadTransport, PinInputTransport)
```

Current violations to fix:
- `fileupload/` -> `file-upload/`
- `pininput/` -> `pin-input/`
- `radiogroup/` -> `radio-group/`

### Adapter Folder Contract (8 files per adapter)

Every MeltUI adapter folder MUST contain exactly these files:

```
api/dsadapters/meltui/_internal/{kind}/
  factory.ts              # ONLY file that imports from "melt/builders"
  adapter.contract.ts     # Maps MeltUI slots/props/keyboard -> ColdLight vocabulary
  schema.ts               # ComponentSchema with engine: "meltui"
  adapter.ts              # AdapterFactory -> AdapterResult
  index.ts                # Barrel export
  _transport/
    types.ts              # Transport config, states, transport type
    factory.ts            # Creates transport wrapping melt instance
    index.ts              # Barrel export
```

### Shared Builder Pattern (NEW)

When one MeltUI builder backs multiple primitives, the adapter folder is organized as:

```
api/dsadapters/meltui/_internal/dialog/
  factory.ts              # Imports Dialog from "melt/builders"
  _transport/
    types.ts              # DialogTransport, AlertDialogTransport, SheetTransport
    factory.ts            # createDialogTransport(), createAlertDialogTransport(), createSheetTransport()
    index.ts
  _variants/
    dialog/
      adapter.contract.ts
      schema.ts
      adapter.ts
    alert-dialog/
      adapter.contract.ts
      schema.ts
      adapter.ts
    sheet/
      adapter.contract.ts
      schema.ts
      adapter.ts
  index.ts                # Exports all variant transports
```

The factory.ts is SHARED (one melt import). Each variant has its own contract, schema, and adapter
that configure the shared builder differently (e.g., alert-dialog disables outsideClick).

---

## Phase 1: Fix Critical Blockers (toggle + accordion)

**Goal**: App can start. Zero missing adapter imports.

### Task 1.1: Create toggle adapter
- [ ] Create `api/dsadapters/meltui/_internal/toggle/`
- [ ] `factory.ts` — import Toggle from "melt/builders", export createMeltToggle()
- [ ] `_transport/types.ts` — ToggleTransportStates (pressed), ToggleTransportConfig, ToggleTransport
- [ ] `_transport/factory.ts` — createToggleTransport() wrapping melt Toggle
- [ ] `_transport/index.ts` — barrel export
- [ ] `adapter.contract.ts` — map melt Toggle -> coldlight (trigger slot, aria-pressed, Enter/Space)
- [ ] `schema.ts` — ComponentSchema with engine: "meltui", kind: "toggle"
- [ ] `adapter.ts` — AdapterFactory returning AdapterResult
- [ ] `index.ts` — barrel export
- [ ] Verify: `pnpm svelte-check` passes (toggle import resolves)

### Task 1.2: Create accordion adapter
- [ ] Create `api/dsadapters/meltui/_internal/accordion/`
- [ ] `factory.ts` — import Accordion from "melt/builders", export createMeltAccordion()
- [ ] `_transport/types.ts` — AccordionTransportStates, AccordionTransportConfig, AccordionTransport
- [ ] `_transport/factory.ts` — createAccordionTransport() wrapping melt Accordion
- [ ] `_transport/index.ts` — barrel export
- [ ] `adapter.contract.ts` — map melt Accordion -> coldlight (root, item, trigger, content slots)
- [ ] `schema.ts` — ComponentSchema with engine: "meltui", kind: "accordion"
- [ ] `adapter.ts` — AdapterFactory returning AdapterResult
- [ ] `index.ts` — barrel export
- [ ] Verify: accordion component import resolves

### Task 1.3: Verify app starts
- [ ] Run `pnpm dev` — no adapter import errors
- [ ] All routes load (toggle was in layout chain)

---

## Phase 2: Fix Wrong Contracts

**Goal**: Contracts match reality. dialog, tabs declare "meltui".

### Task 2.1: Fix dialog contract
- [ ] Change `primitives/dialog/contract.ts` ariaStateProvider to "meltui"
- [ ] Verify dialog component imports from meltui adapter

### Task 2.2: Fix tabs contract
- [ ] Change `primitives/tabs/contract.ts` ariaStateProvider to "meltui"
- [ ] Verify tabs component imports from meltui adapter

### Task 2.3: Audit spatialmenu
- [ ] Determine if spatialmenu has a primitive contract or is internal-only
- [ ] If internal: document as internal adapter (no primitive contract needed)
- [ ] If primitive: fix contract to declare "meltui"

### Task 2.4: Add missing adapter.contract.ts files
- [ ] Create `dialog/adapter.contract.ts`
- [ ] Create `tabs/adapter.contract.ts`
- [ ] Create `spatialmenu/adapter.contract.ts` (if applicable)

---

## Phase 3: Fix Naming Inconsistency

**Goal**: Adapter folder names match kind names (kebab-case).

### Task 3.1: Rename adapter folders
- [ ] `fileupload/` -> `file-upload/`
- [ ] `pininput/` -> `pin-input/`
- [ ] `radiogroup/` -> `radio-group/`

### Task 3.2: Update all imports
- [ ] Find every import referencing old folder names
- [ ] Update to new kebab-case paths
- [ ] Verify: `pnpm svelte-check` passes

### Task 3.3: Update scanner path resolution
- [ ] Verify scanner resolves adapter paths using kind name directly (kebab-case)
- [ ] If scanner has a name transform, remove it (folder = kind, no mapping needed)

---

## Phase 4: Shared Builder Pattern (dialog -> dialog + alert-dialog + sheet)

**Goal**: Dialog builder backs 3 primitives. Pattern established for future reuse.

### Task 4.1: Restructure dialog adapter for variants
- [ ] Create `dialog/_variants/` structure
- [ ] Move existing dialog adapter.contract.ts, schema.ts, adapter.ts into `_variants/dialog/`
- [ ] Create `_variants/alert-dialog/` with adapted contract (dismissBehavior: escape only)
- [ ] Create `_variants/sheet/` with adapted contract (side positioning via recipe, ARIA same as dialog)

### Task 4.2: Create alert-dialog transport
- [ ] Add AlertDialogTransportConfig to `_transport/types.ts`
- [ ] Add createAlertDialogTransport() to `_transport/factory.ts` (reuses Dialog builder, closeOnOutsideClick: false)
- [ ] Update barrel exports

### Task 4.3: Create sheet transport
- [ ] Add SheetTransportConfig to `_transport/types.ts`
- [ ] Add createSheetTransport() to `_transport/factory.ts` (reuses Dialog builder)
- [ ] Update barrel exports

### Task 4.4: Migrate alert-dialog primitive
- [ ] Change `primitives/alert-dialog/contract.ts` ariaStateProvider to "meltui"
- [ ] Update `components/alert-dialog/` to import from dialog adapter's alert-dialog variant

### Task 4.5: Migrate sheet primitive
- [ ] Change `primitives/sheet/contract.ts` ariaStateProvider to "meltui"
- [ ] Update `components/sheet/` to import from dialog adapter's sheet variant

### Task 4.6: Migrate link-preview (popover/tooltip shared builder)
- [ ] Change `primitives/link-preview/contract.ts` ariaStateProvider to "meltui"
- [ ] Add link-preview variant to tooltip or popover adapter

---

## Phase 5: Scanner Enforcement

**Goal**: Scanner catches all adapter issues at build time. No more silent gaps.

### Task 5.1: Enable failOnParity
- [ ] Change `enforcement.cfg.ts` failOnParity to `true`
- [ ] Run scanner — fix any newly surfaced parity errors

### Task 5.2: Add adapter content validation
- [ ] Scanner checks adapter folder contains all 8 required files (not just folder existence)
- [ ] New error code: `ADAPTER_INCOMPLETE` — folder exists but missing required files

### Task 5.3: Add orphan adapter detection
- [ ] Scanner checks for adapter folders that have no corresponding meltui primitive contract
- [ ] New error code: `ADAPTER_ORPHAN` — folder exists but no primitive claims it
- [ ] Exception list for internal adapters (spatialmenu if internal-only)

### Task 5.4: Add naming validation
- [ ] Scanner validates adapter folder name === primitive kind name (kebab-case match)
- [ ] New error code: `ADAPTER_NAME_MISMATCH`

### Task 5.5: Add shared-builder validation
- [ ] Scanner validates _variants/ subfolders each have contract + schema + adapter
- [ ] Scanner validates shared factory.ts exists at adapter root

### Task 5.6: Regenerate manifest
- [ ] Run `pnpm coldlight:generate`
- [ ] Verify manifest reflects corrected ariaStateProvider values
- [ ] Verify all primitives show status: "complete" (not "contract-only")

---

## Phase 6: Documentation

### Task 6.1: Update builder mapping SSOT
- [ ] Create `api/dsadapters/meltui/BUILDER-MAP.md` documenting builder-to-primitive mapping
- [ ] Reference from MASTER-PLAN.md

### Task 6.2: Update MEMORY.md
- [ ] Record naming convention (kebab-case folders)
- [ ] Record shared-builder pattern
- [ ] Record builder-to-primitive mapping

---

## Verification Checklist

After all phases:
- [ ] `pnpm dev` starts without adapter import errors
- [ ] `pnpm svelte-check` passes
- [ ] `pnpm coldlight:generate` produces clean manifest (zero warnings)
- [ ] `pnpm coldlight:verify` passes
- [ ] Every primitive with ariaStateProvider: "meltui" has a complete adapter folder
- [ ] No orphan adapter folders exist
- [ ] All adapter folders use kebab-case matching their primitive kind
- [ ] Dialog builder backs dialog, alert-dialog, sheet
- [ ] Popover/Tooltip builder backs link-preview
- [ ] All adapter folders contain exactly 8 required files

---

## Owner Questions

**Q1**: For the shared-builder pattern (Phase 4), I'm proposing `_variants/` subfolders within the parent adapter. Does this structure feel right, or do you want a different organization?

**Q2**: Should we migrate link-preview to share the **tooltip** adapter or the **popover** adapter? Tooltip is simpler (hover reveal), popover is more flexible (click + hover). Link-preview is hover-triggered, so tooltip feels like the natural parent.

**Q3**: The naming fix (Phase 3) will touch imports across the codebase. Should I do this as a single atomic commit, or break it per-kind?

**Q4**: Should `failOnParity: true` be enabled immediately (Phase 5.1), or should we gate it behind all other phases completing first?

**Q5**: SpatialMenu appears to be an internal MeltUI concept without a user-facing primitive. Should it remain as an internal adapter (no contract required), or should we create a primitive contract for it?
