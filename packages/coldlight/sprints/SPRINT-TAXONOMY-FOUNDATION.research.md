# Research: Taxonomy Foundation — Primitive & Component Master Contracts

**Date**: 2026-02-14
**Sprint**: SPRINT-TAXONOMY-FOUNDATION
**Status**: COMPLETE

## Question/Goal

Restructure `taxonomy/` so the master contract definitions for primitives and components live in their own directories:

```
taxonomy/primitive/   <- contract, schema, types for ALL primitives
taxonomy/component/   <- contract, schema, types for ALL components
```

Currently, `taxonomy/schema.ts` (577 lines) and `taxonomy/types.ts` (319 lines) are monolithic files sitting at taxonomy root containing primitive-specific contracts, Zod schemas, type definitions, and validation functions. There is no `taxonomy/primitive/` or `taxonomy/component/` directory.

The component contract currently lives in a completely different location: `components/schema.ts` (499 lines) and `components/types.ts` (12 lines).

## Codebase Analysis

### Current State (What Exists)

```
taxonomy/
├── schema.ts          <- 577 lines: ALL Zod schemas for primitives (roles, attrs, states, etc.)
├── types.ts           <- 319 lines: PrimitiveContract interface + manifest/scanner types
├── scanner.ts         <- Build-time validation (reads kinds/primitives/)
├── registry.ts        <- Runtime manifest lookup
├── accessor.ts        <- Contract lazy-loading
├── index.ts           <- Barrel: re-exports types.ts, kinds/, registry, scanner
├── ARIA_SCHEMA_DESIGN.md
├── README.md
├── api/adapter/meltui/   <- Adapter declaration
├── vpb/                  <- VPB block contracts
├── .generated/           <- Scanner output
└── kinds/
    ├── index.ts          <- Re-exports kinds/primitives/index.ts
    └── primitives/       <- 42 per-kind folders (contract.ts, types.ts, index.ts each)
        ├── index.ts      <- 370-line barrel
        ├── button/
        ├── dialog/
        └── ... (42 total)

components/
├── schema.ts          <- 499 lines: ComponentContractSchema, validation, ARIA value types
├── types.ts           <- 12 lines: ComponentSurfaceProps
├── index.ts
├── dialog/            <- Full implementation
├── tabs/              <- Full implementation
├── combobox/          <- Full implementation
└── panel/             <- Full implementation
```

### What Should Change

**taxonomy/primitive/** — Master contract shape for ALL primitives:

| File | Content (moved from) |
|------|---------------------|
| `contract.ts` | PrimitiveContractSchema + parseContract + validateContract (from `taxonomy/schema.ts`) |
| `schema.ts` | All Zod schemas: AriaRoleSchema, StateTokenSchema, SlotSpecSchema, etc. (from `taxonomy/schema.ts`) |
| `types.ts` | PrimitiveContract interface, AriaRequirements, SlotSpec, etc. (from `taxonomy/types.ts`) |
| `index.ts` | Barrel — import/export only |

**taxonomy/component/** — Master contract shape for ALL components:

| File | Content (moved from) |
|------|---------------------|
| `contract.ts` | ComponentContractSchema + parseComponentContract + validateComponentContract (from `components/schema.ts`) |
| `schema.ts` | All Zod schemas: ComponentSlotAriaSchema, ComponentSlotContractSchema, etc. (from `components/schema.ts`) |
| `types.ts` | ComponentContract, ComponentSlotContract, etc. (derived from schema types) |
| `index.ts` | Barrel — import/export only |

### Import Chain Analysis

**Who imports `taxonomy/schema.ts`:**
1. `taxonomy/kinds/primitives/*/contract.ts` — All 42 contracts use `parseContract()`
2. `taxonomy/scanner.ts` — Uses `PrimitiveContractSchema` for validation
3. `components/schema.ts` — Imports `PrimitiveContract`, Zod schemas

**Who imports `taxonomy/types.ts`:**
1. `taxonomy/accessor.ts` — Uses `PrimitiveContract` type
2. `taxonomy/scanner.ts` — Uses manifest types, ScanResult, etc.
3. `taxonomy/index.ts` — Re-exports everything
4. `taxonomy/kinds/primitives/*/types.ts` — Some import `SlotStateMap`, `StateToken`

**Who imports `components/schema.ts`:**
1. `components/dialog/schema.ts` — Uses `deriveSlotContract`, `ComponentContractSchema`
2. `components/tabs/schema.ts` — Same
3. `components/combobox/schema.ts` — Same
4. `components/index.ts` — Re-exports

### Schema.ts Breakdown (577 lines → split)

Lines 1-101: ARIA role const arrays + `AriaRoleSchema` → `taxonomy/primitive/schema.ts`
Lines 102-191: ARIA attribute const arrays + schemas → `taxonomy/primitive/schema.ts`
Lines 192-239: Keyboard keys/actions + schemas → `taxonomy/primitive/schema.ts`
Lines 240-247: Orientations → `taxonomy/primitive/schema.ts`
Lines 248-256: Focus strategies → `taxonomy/primitive/schema.ts`
Lines 257-299: State tokens → `taxonomy/primitive/schema.ts`
Lines 300-329: Slot actions → `taxonomy/primitive/schema.ts`
Lines 330-388: HTML elements → `taxonomy/primitive/schema.ts`
Lines 389-401: Slot children modes → `taxonomy/primitive/schema.ts`
Lines 402-409: ARIA state providers → `taxonomy/primitive/schema.ts`
Lines 410-576: Composite schemas (SlotSpec, PrimitiveContractSchema, validation) → `taxonomy/primitive/contract.ts`

### Types.ts Breakdown (319 lines → split)

Lines 1-70: Derived vocabulary types (AriaRole, StateToken, etc.) → `taxonomy/primitive/types.ts`
Lines 71-147: ARIA/Slot interfaces (AriaRequirements, SlotSpec, DismissBehavior) → `taxonomy/primitive/types.ts`
Lines 148-235: PrimitiveContract interface → `taxonomy/primitive/types.ts`
Lines 236-285: ManifestPrimitive, ColdLightManifest → stays at `taxonomy/types.ts` (manifest is taxonomy-wide)
Lines 286-319: ScanError, ScanResult → stays at `taxonomy/types.ts` (scanner is taxonomy-wide)

### Components/schema.ts Breakdown (499 lines → split)

Lines 1-81: ARIA value types (HasPopup, AutoComplete, etc.) → `taxonomy/component/schema.ts`
Lines 82-144: AriaAttrValueSchemas map → `taxonomy/component/schema.ts`
Lines 145-230: ComponentSlotAriaSchema, ComponentSlotContractSchema → `taxonomy/component/schema.ts`
Lines 231-326: ComponentContractSchema → `taxonomy/component/contract.ts`
Lines 327-498: Validation functions → `taxonomy/component/contract.ts`

## Findings

### 1. taxonomy/schema.ts IS the primitive master contract — it just needs a proper home

The file already defines exactly what primitives must be. It enforces:
- Structureless via `slotSpec.element` (no layout logic in primitive)
- ARIA via `AriaRequirementsSchema`, `SlotAriaSpecSchema`
- State via `StateTokenSchema`, `slotStates`
- Keyboard via `KeyboardKeySchema`, `KeyboardContextSchema`
- Focus via `FocusStrategySchema`, `FocusSpecSchema`
- SD4 alignment via state token vocabulary

### 2. components/schema.ts IS the component master contract — it just needs to move

Already defines:
- Per-slot ARIA enforcement with value types
- Accessible name requirements
- Focus management
- State → ARIA mappings
- Relationship to primitive contracts (validation)
- AI introspection metadata

### 3. Manifest/Scanner types should stay at taxonomy root

ManifestPrimitive, ColdLightManifest, ScanResult — these are taxonomy-wide concerns, not primitive-specific. They stay at `taxonomy/types.ts`.

### 4. vocabularies.cfg.ts relationship

`taxonomy/types.ts` currently imports from `config/coldlight/vocabularies.cfg.ts`. After the move to `taxonomy/primitive/types.ts`, the import path changes from `../config/coldlight/vocabularies.cfg.js` to `../../config/coldlight/vocabularies.cfg.js`.

Meanwhile `taxonomy/schema.ts` defines its own const arrays (duplicating vocabularies). After the move, `taxonomy/primitive/schema.ts` will carry these. The duplication between schema.ts Zod arrays and vocabularies.cfg.ts arrays already exists — schema.ts is authoritative for Zod, vocabularies.cfg.ts is authoritative for TypeScript-only derivation.

## Recommendations

### Target Structure

```
taxonomy/
├── primitive/
│   ├── contract.ts    <- PrimitiveContractSchema + parseContract + validate (from schema.ts L410-576)
│   ├── schema.ts      <- All Zod primitive schemas: roles, attrs, states, etc. (from schema.ts L1-409)
│   ├── types.ts       <- PrimitiveContract interface, SlotSpec, etc. (from types.ts L1-235)
│   └── index.ts       <- Barrel: import/export only
│
├── component/
│   ├── contract.ts    <- ComponentContractSchema + validate (from components/schema.ts L231-498)
│   ├── schema.ts      <- Slot ARIA schemas, value types (from components/schema.ts L1-230)
│   ├── types.ts       <- ComponentContract, ComponentSlotContract (derived from Zod infer)
│   └── index.ts       <- Barrel: import/export only
│
├── types.ts           <- REDUCED: ManifestPrimitive, ColdLightManifest, ScanResult only
├── scanner.ts         <- UPDATED imports: from ./primitive/contract.js
├── registry.ts        <- UPDATED imports: from ./types.js (manifest types stay)
├── accessor.ts        <- UPDATED imports: from ./primitive/types.js
├── index.ts           <- UPDATED: re-exports from primitive/, component/
├── api/               <- Unchanged
├── vpb/               <- Unchanged
├── .generated/        <- Unchanged
└── kinds/             <- 42 per-kind folders (SEPARATE SPRINT to move these)
```

### Execution Order

1. Create `taxonomy/primitive/` with schema.ts, types.ts, contract.ts, index.ts
2. Create `taxonomy/component/` with schema.ts, types.ts, contract.ts, index.ts
3. Update `taxonomy/types.ts` to only contain manifest/scanner types, re-export from primitive/
4. Delete old `taxonomy/schema.ts` (content now in primitive/)
5. Update all imports (scanner, registry, accessor, 42 contracts, components)
6. Verify compilation

### Separate Future Sprint

Moving the 42 per-kind contract folders from `taxonomy/kinds/primitives/{name}/` into `primitives/{name}/` is a separate concern (already planned in SPRINT-TAXONOMY-SIMPLIFICATION). This sprint focuses ONLY on creating the proper `taxonomy/primitive/` and `taxonomy/component/` master contract directories.

## Files Referenced

- `taxonomy/schema.ts`: 577 lines — ALL content moves to `taxonomy/primitive/`
- `taxonomy/types.ts`: 319 lines — primitive types move, manifest types stay
- `components/schema.ts`: 499 lines — ALL content moves to `taxonomy/component/`
- `components/types.ts`: 12 lines — stays (ComponentSurfaceProps is component-specific)
- `config/coldlight/vocabularies.cfg.ts`: Vocabulary arrays referenced by types
- `taxonomy/scanner.ts`: Must update imports
- `taxonomy/registry.ts`: Must update imports
- `taxonomy/accessor.ts`: Must update imports
- `taxonomy/kinds/primitives/*/contract.ts`: 42 files must update `parseContract` import
