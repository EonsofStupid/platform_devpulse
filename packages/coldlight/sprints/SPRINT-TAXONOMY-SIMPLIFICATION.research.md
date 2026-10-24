# Research: Taxonomy Simplification

**Date**: 2026-02-10
**Sprint**: SPRINT-TAXONOMY-SIMPLIFICATION
**Status**: COMPLETE

## Question/Goal

Simplify taxonomy from 42 per-name mirror folders to single master contracts per kind. Reduce cognitive overhead for AI sessions. Make enforcement actually work.

## Codebase Analysis

### Current Structure

```
taxonomy/
├── schema.ts               ← Zod PrimitiveContractSchema (KEEP — this IS the master contract shape)
├── types.ts                ← PrimitiveContract interface + manifest types (KEEP)
├── scanner.ts              ← Scans taxonomy/kinds/primitives/ folders (MUST UPDATE)
├── registry.ts             ← Runtime registry
├── accessor.ts             ← Accessor utilities
├── index.ts                ← Barrel
├── api/adapter/meltui/     ← MeltUI adapter taxonomy declaration
├── vpb/                    ← VPB contracts
├── .generated/             ← Manifest output
├── kinds/
│   ├── index.ts            ← Re-exports from kinds/primitives/index.ts
│   └── primitives/
│       ├── index.ts        ← 370-line barrel re-exporting all 42 per-name contracts
│       ├── accordion/      ← contract.ts, types.ts, index.ts (per-name, 42 of these)
│       ├── alert/
│       ├── button/
│       ├── ... (42 total)
│       └── visually-hidden/
```

### What Each Per-Name Folder Contains

Example: `taxonomy/kinds/primitives/button/`
- `contract.ts` — Raw contract object satisfying `PrimitiveContract`, validated via `parseContract()`
- `types.ts` — Slot union types, state union types, slotStates map, slot arrays, state token arrays
- `index.ts` — Re-exports contract + all types from types.ts

### What Imports From These Folders (CRITICAL)

**Real code imports (not docs/generated):**
1. `primitives/button/Button.svelte` → imports `contract` from `taxonomy/kinds/primitives/button/contract.js`
   - Used for `use:aria={{ contract, slot: "root", state: ariaState }}`
   - Only 1 primitive actually does this
2. `components/dialog/schema.ts` → imports `contract` from `taxonomy/kinds/primitives/dialog/contract.js`
   - Used for `validateComponentContract(contract, primitiveContract)`
3. `components/tabs/schema.ts` → same pattern as dialog
4. `components/combobox/schema.ts` → same pattern
5. `api/adapters/coldlight/_internal/dialog/_transport/types.ts` → imports `DialogSlot` type

**Scanner imports:**
- `scanner.ts` dynamically imports `{clPrimitives}/{kind}/contract.js` for each discovered folder

### The Master Contract Already Exists

`taxonomy/schema.ts` ALREADY defines `PrimitiveContractSchema` (Zod) — the shape every primitive contract must satisfy. This IS the master "what a primitive must be" definition. It already enforces:
- Structureless (via `slotSpec.element` field)
- ARIA (via `aria` + `SlotAriaSpec` fields)
- State tokens (via `states` + `slotStates`)
- Keyboard (via `keyboard` + `keyboardMap`)
- Focus strategy (via `focusStrategy` + `focus`)
- SD4 alignment (via state tokens vocabulary)

The per-name folders are just **instances** of this schema. The schema IS the single source of truth already.

### What's Broken

The 42 per-name folders create a mirror structure that:
1. Confuses AI sessions into thinking both sides need 1:1 maintenance
2. Creates 126 files (3 per kind) that are never referenced by most primitives
3. Only 1 primitive (Button) actually imports its taxonomy contract
4. Scanner reads these folders as truth — but the contracts aren't enforced downstream
5. Every AI session tries to "wire up" taxonomy imports and fails

## Findings

### Key Insight: The User's Proposal Changes WHERE Contracts Live, Not What They Are

**Current:** Contract instances live in `taxonomy/kinds/primitives/{name}/contract.ts`
**Proposed:** Contract instances live in `primitives/{name}/contract.ts`

The master shape (`PrimitiveContractSchema` in `schema.ts`) stays exactly where it is. It's already the single source of truth for "what a primitive IS."

### What Changes

1. **DELETE** `taxonomy/kinds/primitives/{name}/` — all 42 folders (126 files)
2. **DELETE** `taxonomy/kinds/primitives/index.ts` — the 370-line barrel
3. **KEEP** `taxonomy/schema.ts` — master Zod schema (this IS the enforcement)
4. **KEEP** `taxonomy/types.ts` — TypeScript interfaces
5. **KEEP** `taxonomy/scanner.ts` — BUT UPDATE to scan `primitives/` instead of `taxonomy/kinds/primitives/`
6. **ADD** `contract.ts` to each `primitives/{name}/` folder (move from taxonomy)
7. **UPDATE** 4 import paths (Button.svelte, 3 component schemas)
8. **UPDATE** preflight checks to match new structure

### What Stays the Same

- `taxonomy/kinds/` can hold the master contract SHAPE definitions (singular: `primitive/`, `component/`)
- `taxonomy/api/adapter/meltui/` stays (adapter taxonomy declaration)
- `taxonomy/vpb/` stays
- `taxonomy/.generated/` stays
- All 42 `primitives/{name}/` folders stay, gain a `contract.ts`

### Proposed New Structure

```
taxonomy/
├── schema.ts               ← MASTER: PrimitiveContractSchema (Zod) — THE contract shape
├── types.ts                ← PrimitiveContract interface
├── scanner.ts              ← UPDATED: scans primitives/ folders, loads contract.ts from each
├── kinds/
│   ├── primitive/          ← NEW: Master primitive kind definition (re-exports schema)
│   │   └── index.ts        ← Re-exports PrimitiveContractSchema, parseContract, etc.
│   └── component/          ← NEW: Master component kind definition
│       └── index.ts        ← Re-exports ComponentContractSchema, parseComponentContract, etc.

primitives/{name}/
├── types.ts                ← Slot/state types (MOVED from taxonomy/kinds/primitives/{name}/)
├── contract.ts             ← Instance contract (MOVED from taxonomy/kinds/primitives/{name}/)
├── index.ts                ← Barrel
├── {Name}.svelte           ← Structural shell
└── {NameSlot}.svelte       ← Sub-slots
```

### Impact on Scanner

Scanner currently:
- Scans `taxonomy/kinds/primitives/` for subfolders
- Loads `contract.js` from each
- Checks parity with `primitives/` and `api/adapters/`

After change:
- Scans `primitives/` for subfolders
- Loads `contract.js` from each
- Validates contract against `PrimitiveContractSchema`
- Checks parity with `api/adapters/` (for meltui-backed primitives)

This is actually simpler — one source directory instead of cross-referencing two.

## Recommendations

1. Move contracts + types FROM `taxonomy/kinds/primitives/{name}/` TO `primitives/{name}/`
2. Delete all 42 taxonomy/kinds/primitives/{name}/ folders after move
3. Create `taxonomy/kinds/primitive/index.ts` as thin re-export of schema.ts
4. Create `taxonomy/kinds/component/index.ts` as thin re-export of components/schema.ts
5. Update scanner to scan `primitives/` root
6. Update 4 import paths (1 primitive + 3 component schemas)
7. Update preflight `taxonomy-alignment` check to verify `contract.ts` exists in each `primitives/{name}/`
8. Update preflight to validate each contract against master schema

## Files Referenced

- `taxonomy/schema.ts`: Master Zod schema — THE source of truth for primitive shape
- `taxonomy/types.ts`: TypeScript interfaces derived from schema
- `taxonomy/scanner.ts`: Build-time scanner — must be updated to scan primitives/ root
- `taxonomy/kinds/primitives/index.ts`: 370-line barrel — DELETE
- `taxonomy/kinds/primitives/button/contract.ts`: Example per-name contract — MOVE to primitives/button/
- `primitives/button/Button.svelte`: Only primitive that imports taxonomy contract — UPDATE import
- `components/dialog/schema.ts`: Component schema importing primitive contract — UPDATE import
- `components/tabs/schema.ts`: Same — UPDATE import
- `components/combobox/schema.ts`: Same — UPDATE import
- `config/coldlight/roots.cfg.ts`: Root paths used by scanner
