# SPRINT: Taxonomy Foundation — Primitive & Component Master Contracts

**Status**: READY
**Priority**: P0 — Foundation. Nothing builds correctly without this.
**Research**: [SPRINT-TAXONOMY-FOUNDATION.research.md](./SPRINT-TAXONOMY-FOUNDATION.research.md)
**Date**: 2026-02-14

## Goal

Create `taxonomy/primitive/` and `taxonomy/component/` as proper homes for the master contract definitions that ALL primitives and ALL components must adhere to. ARIA-backed, Zod-validated, Style Dictionary 4 compatible, A11Y complete.

Currently the primitive master contract is a loose 577-line file at `taxonomy/schema.ts`. The component master contract lives outside taxonomy entirely at `components/schema.ts`. This sprint moves them to where they belong.

## Prerequisites

- [x] Research complete — all imports mapped, content splits documented
- [ ] Clean git state on working branch

## Target Structure

```
taxonomy/
├── primitive/
│   ├── schema.ts      <- All Zod schemas: AriaRoleSchema, StateTokenSchema, SlotSpecSchema, etc.
│   ├── contract.ts    <- PrimitiveContractSchema + parseContract + validateContract
│   ├── types.ts       <- PrimitiveContract interface, SlotSpec, AriaRequirements, etc.
│   └── index.ts       <- Barrel (import/export only)
│
├── component/
│   ├── schema.ts      <- ARIA value schemas, ComponentSlotAriaSchema, ComponentSlotContractSchema
│   ├── contract.ts    <- ComponentContractSchema + parseComponentContract + validateComponentContract
│   ├── types.ts       <- ComponentContract, ComponentSlotContract, etc.
│   └── index.ts       <- Barrel (import/export only)
│
├── types.ts           <- REDUCED: ManifestPrimitive, ColdLightManifest, ScanResult, ScanError only
├── scanner.ts         <- Updated imports
├── registry.ts        <- Updated imports
├── accessor.ts        <- Updated imports
├── index.ts           <- Updated barrel: re-exports primitive/, component/, registry, scanner
```

---

## Phase 1: Create taxonomy/primitive/

### Task 1.1: Create `taxonomy/primitive/schema.ts`

Content: Lines 1-409 of current `taxonomy/schema.ts` — all Zod enum schemas.

Includes:
- AriaRoleSchema (widget, document, landmark, presentation roles)
- AriaAttributeSchema (relationship, state, property, live region, position attrs)
- KeyboardKeySchema + KeyboardActionSchema
- OrientationSchema
- FocusStrategySchema
- StateTokenSchema
- SlotActionSchema
- HtmlElementSchema
- SlotChildrenModeSchema
- AriaStateProviderSchema

- [ ] Create `taxonomy/primitive/schema.ts` with all Zod enum definitions
- [ ] All `as const` arrays + Zod schemas + inferred types in one file
- [ ] No imports from old `taxonomy/schema.ts`

### Task 1.2: Create `taxonomy/primitive/contract.ts`

Content: Lines 410-657 of current `taxonomy/schema.ts` — composite schemas + validation.

Includes:
- SlotAriaSpecSchema
- SlotSpecSchema
- SlotRelationshipSchema
- KeyboardContextSchema
- SelectionModelSchema
- FocusSpecSchema
- DismissBehaviorSchema
- FilteringSpecSchema
- ExpansionModelSchema
- AriaRequirementsSchema
- **PrimitiveContractSchema** (the main one)
- parseContract()
- safeParseContract()
- validateSlotRelationships()
- validateKeyboardMap()
- validateContract()

- [ ] Create `taxonomy/primitive/contract.ts`
- [ ] Imports Zod schemas from `./schema.js`
- [ ] Exports PrimitiveContractSchema + all validation functions

### Task 1.3: Create `taxonomy/primitive/types.ts`

Content: Lines 1-235 of current `taxonomy/types.ts` — TypeScript interfaces.

Includes:
- Derived vocabulary types (AriaStateProvider, AriaRole, AriaAttribute, etc.)
- AriaRequirements interface
- SlotStateMap type
- SlotAriaSpec interface
- SlotSpec interface
- DismissBehavior interface
- **PrimitiveContract** interface (the generic one)

- [ ] Create `taxonomy/primitive/types.ts`
- [ ] Imports from `../../config/coldlight/vocabularies.cfg.js` (updated path)
- [ ] Exports all primitive-level interfaces and type aliases

### Task 1.4: Create `taxonomy/primitive/index.ts`

- [ ] Create barrel file — import/export ONLY, zero logic
- [ ] Re-exports from `./schema.js`, `./contract.js`, `./types.js`

### Checkpoint 1

- [ ] Verify `taxonomy/primitive/` has 4 files: schema.ts, contract.ts, types.ts, index.ts
- [ ] Zero logic in index.ts

---

## Phase 2: Create taxonomy/component/

### Task 2.1: Create `taxonomy/component/schema.ts`

Content: Lines 1-230 of current `components/schema.ts` — ARIA value types + slot schemas.

Includes:
- AriaHasPopupSchema, AriaAutoCompleteSchema, AriaOrientationSchema, etc.
- AriaAttrValueSchemas map (typed ARIA attribute value validation)
- ComponentSlotAriaSchema
- ComponentSlotDataSchema
- ComponentSlotContractSchema
- AccessibleNameSourceSchema

- [ ] Create `taxonomy/component/schema.ts`
- [ ] Imports base schemas from `../primitive/schema.js` (AriaAttributeSchema, AriaRoleSchema, etc.)
- [ ] All ARIA value type schemas in one file

### Task 2.2: Create `taxonomy/component/contract.ts`

Content: Lines 231-499 of current `components/schema.ts` — ComponentContractSchema + validation.

Includes:
- **ComponentContractSchema**
- validateComponentContract()
- validateSlotAttrs()
- deriveSlotContract()
- parseComponentContract()
- safeParseComponentContract()

- [ ] Create `taxonomy/component/contract.ts`
- [ ] Imports from `./schema.js` and `../primitive/contract.js`
- [ ] Exports ComponentContractSchema + all validation functions

### Task 2.3: Create `taxonomy/component/types.ts`

Content: Zod-inferred types re-exported for convenience.

- [ ] Create `taxonomy/component/types.ts`
- [ ] Types derived from Zod schemas via `z.infer<>`
- [ ] Exports: ComponentContract, ComponentSlotContract, ComponentSlotAria, ComponentSlotData, AccessibleNameSource

### Task 2.4: Create `taxonomy/component/index.ts`

- [ ] Create barrel file — import/export ONLY, zero logic
- [ ] Re-exports from `./schema.js`, `./contract.js`, `./types.js`

### Checkpoint 2

- [ ] Verify `taxonomy/component/` has 4 files: schema.ts, contract.ts, types.ts, index.ts
- [ ] Zero logic in index.ts

---

## Phase 3: Update taxonomy root files

### Task 3.1: Reduce `taxonomy/types.ts`

- [ ] Remove all primitive-specific types (PrimitiveContract, SlotSpec, etc.)
- [ ] Keep ONLY manifest/scanner types: ManifestPrimitive, ColdLightManifest, ScanError, PrimitiveScanResult, ScanResult
- [ ] Add re-exports from `./primitive/types.js` for backward compatibility
- [ ] ManifestPrimitive references primitive types — import from `./primitive/types.js`

### Task 3.2: Delete `taxonomy/schema.ts`

- [ ] All content now lives in `taxonomy/primitive/schema.ts` and `taxonomy/primitive/contract.ts`
- [ ] Delete the file

### Task 3.3: Update `taxonomy/index.ts`

- [ ] Re-export from `./primitive/index.js`
- [ ] Re-export from `./component/index.js`
- [ ] Keep existing re-exports for registry, scanner, kinds

### Checkpoint 3

- [ ] `taxonomy/schema.ts` deleted
- [ ] `taxonomy/types.ts` reduced to manifest/scanner types + re-exports
- [ ] `taxonomy/index.ts` updated

---

## Phase 4: Update all imports

### Task 4.1: Update `taxonomy/scanner.ts`

- [ ] Change `import { PrimitiveContractSchema, ... } from "./schema.js"` → `from "./primitive/contract.js"`
- [ ] Change type imports to `from "./primitive/types.js"`

### Task 4.2: Update `taxonomy/registry.ts`

- [ ] Update imports for manifest types (should still work from `./types.js` re-exports)

### Task 4.3: Update `taxonomy/accessor.ts`

- [ ] Change `import type { PrimitiveContract } from "./types"` → still works via re-export

### Task 4.4: Update 42 primitive contracts

All `taxonomy/kinds/primitives/*/contract.ts` import `parseContract` from `../../schema.js`.
New path: `../../primitive/contract.js` (relative from `kinds/primitives/*/`)

Wait — `kinds/primitives/button/contract.ts` → `../../schema.js` resolves to `taxonomy/schema.ts`.
After delete, this must point to `taxonomy/primitive/contract.js`.
From `taxonomy/kinds/primitives/button/`, relative path is `../../../primitive/contract.js`.

- [ ] Update all 42 `taxonomy/kinds/primitives/*/contract.ts` files:
  - `from "../../schema.js"` → `from "../../../primitive/contract.js"`
  - OR use `#coldlight/taxonomy/primitive/contract.js` (absolute alias)

### Task 4.5: Update 42 primitive types

Some `taxonomy/kinds/primitives/*/types.ts` import from `../../types.js`.
New path needs to resolve to `taxonomy/primitive/types.js` or work via re-export.

- [ ] Check and update any `taxonomy/kinds/primitives/*/types.ts` that import from taxonomy root

### Task 4.6: Update `components/schema.ts`

This file's content MOVED to `taxonomy/component/`. Replace with re-export.

- [ ] Replace `components/schema.ts` content with re-export from `#coldlight/taxonomy/component/index.js`
- [ ] All existing importers of `components/schema.ts` still work (backward compat)

### Task 4.7: Update component implementations

- [ ] `components/dialog/schema.ts` — update any direct imports
- [ ] `components/tabs/schema.ts` — update any direct imports
- [ ] `components/combobox/schema.ts` — update any direct imports

### Checkpoint 4

- [ ] `pnpm svelte-check` passes in `interfaces/desktop/`
- [ ] No import errors

---

## Phase 5: Verify

- [ ] `pnpm svelte-check` — clean
- [ ] All taxonomy contracts still parse (42 primitives)
- [ ] Components that use ComponentContract still import correctly
- [ ] Scanner still works (if runnable)
- [ ] No orphaned imports to deleted `taxonomy/schema.ts`

---

## Compact Checkpoint

After Phase 2, pause and verify with user before modifying existing files.

## Risk

- **Low**: Content moves, no logic changes. All schemas and types are identical.
- **Medium**: 42 contract files need import path updates — mechanical but volume.
- **Mitigation**: Use `#coldlight/taxonomy/primitive/contract.js` absolute alias to avoid relative path hell. Re-export from `taxonomy/types.ts` for backward compatibility during transition.

## What This Sprint Does NOT Do

- Does NOT move the 42 per-kind folders out of `taxonomy/kinds/primitives/` (that's SPRINT-TAXONOMY-SIMPLIFICATION)
- Does NOT change any contract content — only moves files
- Does NOT create new schemas — only reorganizes existing ones
- Does NOT touch primitives/*.svelte or components/*.svelte
