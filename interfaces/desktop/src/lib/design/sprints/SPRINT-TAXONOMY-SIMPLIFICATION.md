# SPRINT: Taxonomy Simplification

**Status**: READY
**Priority**: P0 — Unblocks all future primitive/component work
**Research**: [SPRINT-TAXONOMY-SIMPLIFICATION.research.md](./SPRINT-TAXONOMY-SIMPLIFICATION.research.md)

## Goal

Eliminate the 42 mirror folders under `taxonomy/kinds/primitives/`. Move per-primitive contracts into `primitives/{name}/`. Taxonomy declares the SHAPE (master contract), primitives carry their INSTANCES. Scanner validates instances against the master.

## Prerequisites

- [x] Research complete — all imports identified, blast radius known
- [ ] Clean git state on working branch

## Phase 1: Move Contracts to Primitives (42 folders)

For each of the 42 primitives, the contract.ts and types.ts from `taxonomy/kinds/primitives/{name}/` move to `primitives/{name}/`:

- [ ] For each `taxonomy/kinds/primitives/{name}/`:
  - Move `types.ts` content to `primitives/{name}/types.ts` (merge if types.ts exists — it does for all 42)
  - Move `contract.ts` to `primitives/{name}/contract.ts`
  - Update contract.ts import of `../../../schema.js` to `$lib/design/taxonomy/schema.js`
  - Update contract.ts import of `./types.js` (stays local — no change needed)
- [ ] Verify: each `primitives/{name}/` now has contract.ts, types.ts, index.ts, *.svelte

## Phase 2: Update Imports (4 files)

- [ ] `primitives/button/Button.svelte`: change import from `$lib/design/taxonomy/kinds/primitives/button/contract.js` to `./contract.js`
- [ ] `components/dialog/schema.ts`: change import from `$lib/design/taxonomy/kinds/primitives/dialog/contract.js` to `$lib/design/primitives/dialog/contract.js`
- [ ] `components/tabs/schema.ts`: change import from `$lib/design/taxonomy/kinds/primitives/tabs/contract.js` to `$lib/design/primitives/tabs/contract.js`
- [ ] `components/combobox/schema.ts`: change import from `$lib/design/taxonomy/kinds/primitives/combobox/contract.js` to `$lib/design/primitives/combobox/contract.js`
- [ ] `api/adapters/coldlight/_internal/dialog/_transport/types.ts`: change import from `$lib/design/taxonomy/kinds/primitives/dialog/types.js` to `$lib/design/primitives/dialog/types.js`

## Phase 3: Delete Mirror Folders

- [ ] Delete `taxonomy/kinds/primitives/accordion/` through `taxonomy/kinds/primitives/visually-hidden/` (42 folders, 126 files)
- [ ] Delete `taxonomy/kinds/primitives/index.ts` (370-line barrel)
- [ ] Update `taxonomy/kinds/index.ts` to remove re-export of primitives barrel

## Phase 4: Create Master Kind Entries

- [ ] Create `taxonomy/kinds/primitive/index.ts` — thin re-export of `taxonomy/schema.ts` exports:
  ```ts
  export { PrimitiveContractSchema, parseContract, safeParseContract, validateContract } from "../../schema.js";
  export type { PrimitiveContract } from "../../types.js";
  ```
- [ ] Create `taxonomy/kinds/component/index.ts` — thin re-export of `components/schema.ts` exports:
  ```ts
  export { parseComponentContract, validateComponentContract } from "$lib/design/components/schema.js";
  export type { ComponentContract } from "$lib/design/components/schema.js";
  ```

## Phase 5: Update Scanner

- [ ] In `scanner.ts`: change `resolvePaths()` to use `primitivesRoot` as contract source
  - `clPrimitives` path now = `primitivesRoot` (not `taxonomyRoot/kinds/primitives`)
  - `loadContract()` now loads from `{primitivesRoot}/{kind}/contract.js`
- [ ] Scanner still validates each loaded contract via `isContractShape()` / `parseContract()`
- [ ] Parity check simplifies: contract + svelte must both exist in `primitives/{name}/`
  - meltui-backed: also needs `api/adapters/meltui/_internal/{kind}/`

## Phase 6: Update Preflight Checks

- [ ] `check.taxonomy-alignment.ts`: Rewrite — now checks:
  1. Each `primitives/{name}/` has a `contract.ts`
  2. `contract.ts` exports a `contract` that satisfies `PrimitiveContractSchema`
  3. No need to cross-reference taxonomy/kinds/ (it's gone)
- [ ] `check.primitive-structure.ts`: Add `contract.ts` to REQUIRED_FILES
- [ ] `cowlevel.policy.json`: Update `taxonomy-alignment` description

## Phase 7: Verify

- [ ] `pnpm svelte-check` passes
- [ ] Preflight: `npx tsx scripts/docs/preflight/engine/preflight.ts --check` passes or shows only known issues
- [ ] Scanner: contract loading still works from new paths

## Compact Checkpoint

After Phase 3 (deletion), pause and verify with user before continuing.

## Risk

- **Low**: Only 4 real import paths change. Scanner path change is config-driven.
- **Medium**: 42 contract moves — but mechanical, same content just different location.
- **Mitigation**: types.ts merge is the only tricky part (existing types.ts in primitives/ may differ from taxonomy version). Research shows they're different files — primitive types.ts has component prop types, taxonomy types.ts has slot/state unions. Both are needed, they don't conflict.
