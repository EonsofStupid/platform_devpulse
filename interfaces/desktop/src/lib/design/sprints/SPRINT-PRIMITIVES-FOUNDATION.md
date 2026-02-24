# Sprint: Primitives Foundation

**Created**: 2026-02-20
**Updated**: 2026-02-21
**Research**: [SPRINT-PRIMITIVES-FOUNDATION.research.md](./SPRINT-PRIMITIVES-FOUNDATION.research.md)
**Priority**: CRITICAL — Nothing renders without this
**Status**: IN PROGRESS

---

## Architecture (LOCKED 2026-02-21)

Three layers. Contracts travel WITH implementations. Taxonomy = registry only.

```
primitives/{kind}/
  contract.ts       ← SSOT. Scanner reads this. Lives with implementation.
  {Name}.svelte     ← Zero ARIA. Zero styling. data-kind + data-slot + spread only.
  types.ts          ← ButtonSlot, ButtonState, ButtonRootProps
  index.ts          ← barrel: ButtonRoot + contract + types
  {Name}.test.ts    ← Tests stored WITH the code (Vitest browser/Chromium)

components/{kind}/
  contract.ts       ← Component contract (ARIA + recipe declarations)
  {Name}.svelte     ← Wraps primitive. Applies ARIA + data-state + recipe class.
  types.ts          ← ComponentProps
  recipe.ts         ← cva recipe
  index.ts          ← barrel

taxonomy/
  kinds/primitives/ ← Zod schema (PrimitiveContractSchema) + scanner types
  scanner.ts        ← Scans primitives/*/contract.ts, validates, generates manifest
  types.ts          ← Runtime type registry
```

**What taxonomy/ is NOT:**
- NOT a contracts folder
- NOT a components folder
- taxonomy/button/ was WRONG — deleted 2026-02-21

---

## Completed

### ✅ MASTER-PLAN.md Updated (2026-02-21)
- Architecture diagram reflects 3-layer structure
- Taxonomy = registry ONLY (not contracts folder)
- SD5 pipeline documented
- Locked decisions table current

### ✅ Button Primitive — Gold Standard (2026-02-21)

**`primitives/button/contract.ts`** — WRITTEN
- Correct location (with implementation, not taxonomy)
- Satisfies `PrimitiveContract<"button", ButtonSlot, ButtonState>`
- Proper JSDoc header with WAI-ARIA APG reference

**`primitives/button/types.ts`** — UPDATED
- ButtonSlot, ButtonState vocabulary exported
- buttonSlots, buttonStateTokens, buttonSlotStates constants
- ButtonRootProps (structural HTML props)
- Proper JSDoc header

**`primitives/button/index.ts`** — UPDATED
- Exports: ButtonRoot + contract + buttonSlots + buttonStateTokens + buttonSlotStates + types
- Correct comment: "Contract lives HERE — with the implementation"

**`primitives/button/Button.svelte`** — UPDATED
- Proper JSDoc header with @file, @kind, @layer, @package
- Zero ARIA. Zero behavior. Zero styling (unchanged, correct)

**`primitives/button/Button.test.ts`** — CREATED
- Stored WITH the code (not in a separate test folder)
- Contract integrity tests
- Structural attribute tests (data-kind, data-slot)
- Zero ARIA enforcement tests
- Prop passthrough tests

**`taxonomy/button/`** — DELETED
- Entire folder removed (wrong location)
- 4 files: Button.svelte, contract.ts, index.ts, types.ts — all gone

---

## Pending

### Phase A: Wire SD5 as Default Pipeline

**Status**: NEEDS VERIFICATION

#### A1. Verify `ds:tokens:build` points to SD5 script

**File**: `interfaces/desktop/package.json`

Must be:
```json
"ds:tokens:build": "node scripts/dev/design/ds-tokens-sd5.ts",
"ds:tokens:watch": "node --watch scripts/dev/design/ds-tokens-sd5.ts"
```

Run:
```bash
cd interfaces/desktop && pnpm ds:tokens:build
```

Must output `[SD5]` prefix on all generated file lines.

#### A2. Delete old hand-rolled script (if it still exists)

Check: `scripts/dev/design/ds-tokens-build.ts`
If exists → delete it.

---

### Phase B: Update Scanner to Read Correct Paths

**Status**: NOT STARTED

The scanner at `taxonomy/scanner.ts` currently scans `taxonomy/kinds/primitives/` for contract folders.
Per locked decisions, contracts are at `primitives/*/contract.ts`.

#### B1. Update `taxonomy/scanner.ts` path resolution

`resolvePaths()` must point `clPrimitives` at the `primitives/` root.
Scanner globs `primitives/*/contract.ts` not `taxonomy/kinds/primitives/*/contract.ts`.

#### B2. Update scanner contract loader

`loadContract()` must resolve:
```ts
const contractPath = `${primitivesRoot}/${kind}/contract.js`;
```

#### B3. Verify scan result against button

Run scanner with button. Must load `primitives/button/contract.ts`, validate, emit manifest entry.

---

### Phase C: Run svelte-check

**Status**: NOT STARTED

```bash
cd interfaces/desktop && pnpm svelte-check
```

Zero errors on:
- `primitives/button/Button.svelte`
- `primitives/button/contract.ts`
- `primitives/button/types.ts`
- `components/button/Button.svelte`

---

### Phase D: Run Button Tests

**Status**: NOT STARTED

```bash
cd interfaces/desktop && pnpm vitest run src/lib/design/primitives/button/Button.test.ts
```

All tests green.

---

## Acceptance Criteria

| Criteria | Status |
|----------|--------|
| `primitives/button/contract.ts` exists with proper JSDoc | ✅ DONE |
| `primitives/button/types.ts` has ButtonSlot, ButtonState | ✅ DONE |
| `primitives/button/index.ts` exports contract | ✅ DONE |
| `primitives/button/Button.test.ts` exists alongside Button.svelte | ✅ DONE |
| `taxonomy/button/` deleted | ✅ DONE |
| MASTER-PLAN.md reflects locked decisions | ✅ DONE |
| `pnpm ds:tokens:build` runs SD5 | ⏳ VERIFY |
| `pnpm svelte-check` zero errors on button | ⏳ PENDING |
| `pnpm vitest run` button tests green | ⏳ PENDING |
| Scanner reads `primitives/*/contract.ts` | ⏳ PENDING |

---

## Out of Scope

- All other primitives (after button is gold standard, repeat the pattern)
- VPB implementation
- Recipe system changes
- MeltUI adapter primitives (dialog, tabs, etc.) — separate sprint
