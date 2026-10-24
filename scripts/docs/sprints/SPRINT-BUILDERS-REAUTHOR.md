# SPRINT: Builder Re-Authoring — MeltUI Gold Standard

> **Status**: READY FOR APPROVAL
> **Date**: 2026-02-26
> **Research**: `SPRINT-BUILDERS-REAUTHOR.research.md`
> **Depends On**: _internal layer (exists, correct)
> **Blocks**: Component layer completion, svelte-check clean pass

---

## Problem Statement

All 55 ColdLight builders return `SlotAttrs` (`Record<string, unknown>`) for every slot getter. This destroys TypeScript precision — auto-generated `.d.ts` declarations would show useless generic types instead of MeltUI-quality exact attribute shapes.

Additionally: missing JSDoc, missing helper methods, missing sub-classes for compound builders.

**Root cause**: `export type SlotAttrs = Record<string, unknown>;` in `_internal/types.ts`.

---

## Approach

**In-place rewrite** — not delete-and-recreate.

The builder LOGIC (state management, ARIA computation, keyboard handlers) is correct and tested (1,286 passing tests). The problem is the TYPE LAYER. Deleting working code to rewrite identical logic wastes effort and risks regressions.

**The fix is surgical:**
1. Kill `SlotAttrs` type alias
2. Remove `: SlotAttrs` return type annotation from every getter
3. TypeScript inference immediately produces exact typed returns
4. Add JSDoc, helpers, sub-classes per category

---

## Prerequisites

- [x] _internal layer exists and is correct (Synced, extract, metadata, keyboard, selection-state)
- [x] 55 builders exist with correct ARIA/state/keyboard logic
- [x] 1,286 tests passing
- [x] Research complete (gap analysis documented)

---

## Phase 0: Foundation Fix (1 file, unblocks everything)

### Task 0.1: Kill `SlotAttrs` in `_internal/types.ts`

```diff
- /** Slot attribute object — spread onto HTML element. */
- export type SlotAttrs = Record<string, unknown>;
+ /** Loose attribute type for external consumers who accept any builder output. */
+ export type BuilderAttrs = Record<string, unknown>;
```

### Task 0.2: Update `_internal/index.ts` barrel

Replace `SlotAttrs` export with `BuilderAttrs`.

### Task 0.3: Fix Schema — `primitives/_schema/schema.ts`

Add missing tokens the builders actually produce:

- **StateTokens**: add `"loaded"`, `"inactive"`
- **AriaDocumentRoles**: add `"table"`, `"row"`, `"rowgroup"`, `"cell"`, `"columnheader"`, `"rowheader"`

### Task 0.4: Fix 2 Contracts — Focus Strategy

- `components/toggle-group/contract.ts`: `"roving-tabindex"` → `"roving"`
- `components/toolbar/contract.ts`: `"roving-tabindex"` → `"roving"`

### Task 0.5: Fix Component Types — Omit null-bearing HTML props

6 files need `Omit` for `disabled`, `readonly`, `required`, `prefix` to prevent `null` leak:

- `components/button/types.ts`
- `components/checkbox/types.ts`
- `components/switch/types.ts`
- `components/input/types.ts`
- `components/textarea/types.ts`
- `components/input-group/types.ts`

### Task 0.6: Fix 16 Test Files — HTMLElement Cast

Add `as HTMLElement | null` to every `container.querySelector()` call in:

`aspect-ratio`, `box`, `center`, `code`, `container`, `data-table`, `flex`, `grid`, `heading`, `hstack`, `kbd`, `prose`, `spacer`, `stack`, `sticky`, `text`

---

## Phase 1: Category A — Simple Display Builders (29 builders)

**What changes**: Remove `: SlotAttrs` return types, add JSDoc.

Each builder file: open `factory.ts`, remove `import type { SlotAttrs }` and all `: SlotAttrs` return type annotations, add JSDoc to every public member.

### Batch 1A (10 builders — layout/structure)
- [ ] `box/factory.ts`
- [ ] `flex/factory.ts`
- [ ] `grid/factory.ts`
- [ ] `stack/factory.ts`
- [ ] `hstack/factory.ts`
- [ ] `center/factory.ts`
- [ ] `container/factory.ts`
- [ ] `spacer/factory.ts`
- [ ] `sticky/factory.ts`
- [ ] `divider/factory.ts`

### Batch 1B (10 builders — display/typography)
- [ ] `badge/factory.ts`
- [ ] `spinner/factory.ts`
- [ ] `skeleton/factory.ts`
- [ ] `separator/factory.ts`
- [ ] `label/factory.ts`
- [ ] `kbd/factory.ts`
- [ ] `code/factory.ts`
- [ ] `prose/factory.ts`
- [ ] `heading/factory.ts`
- [ ] `text/factory.ts`

### Batch 1C (9 builders — multi-slot display)
- [ ] `aspect-ratio/factory.ts`
- [ ] `skip-link/factory.ts`
- [ ] `loading-overlay/factory.ts`
- [ ] `empty-state/factory.ts`
- [ ] `callout/factory.ts`
- [ ] `inline-message/factory.ts`
- [ ] `stat/factory.ts`
- [ ] `banner/factory.ts`
- [ ] `card/factory.ts`

---

## Phase 2: Category B — Interactive Controls (13 builders)

**What changes**: Remove `: SlotAttrs`, add JSDoc, add helper methods.

### Batch 2A (7 builders — form controls)
- [ ] `button/factory.ts` — add JSDoc; consider `press()` helper for toggle mode
- [ ] `checkbox/factory.ts` — add JSDoc, add `check()`, `uncheck()` (already has `toggle()`)
- [ ] `switch/factory.ts` — add JSDoc, add `toggle()`, `turnOn()`, `turnOff()`
- [ ] `input/factory.ts` — add JSDoc, add `focus()`, `blur()`, `clear()` helpers
- [ ] `textarea/factory.ts` — add JSDoc, same helpers as input
- [ ] `number-input/factory.ts` — add JSDoc, add `increment()`, `decrement()`
- [ ] `search-input/factory.ts` — add JSDoc, add `clear()`

### Batch 2B (6 builders — interactive widgets)
- [ ] `color-input/factory.ts` — add JSDoc
- [ ] `toggle-group/factory.ts` — add JSDoc, add `isSelected()`, `select()`, `deselect()`. Return typed item object from `getItem()`.
- [ ] `toolbar/factory.ts` — add JSDoc
- [ ] `form-field/factory.ts` — add JSDoc
- [ ] `form/factory.ts` — add JSDoc
- [ ] `alert/factory.ts` — add JSDoc, add `dismiss()` helper

---

## Phase 3: Category C — Stateful Multi-Part Builders (13 builders)

**What changes**: Remove `: SlotAttrs`, add JSDoc, add typed method returns, add sub-classes or helper methods where items have state.

### Batch 3A (7 builders)
- [ ] `table/factory.ts` — typed `getRow()`, `getCell()`, `getHeadCell()` returns
- [ ] `data-table/factory.ts` — typed row/column/cell returns
- [ ] `steps/factory.ts` — add `getStep()` sub-class/typed return, `goTo()`, `next()`, `prev()`
- [ ] `breadcrumb/factory.ts` — add `getItem()` with `isCurrent` state
- [ ] `nav/factory.ts` — add `getItem()` with `isActive` state
- [ ] `nav-item/factory.ts` — typed returns
- [ ] `list/factory.ts` — add `getItem()`

### Batch 3B (6 builders)
- [ ] `description-list/factory.ts` — add `getTerm()`, `getDescription()`
- [ ] `sidebar/factory.ts` — add `getSection()`, `getItem()`, `toggle()`
- [ ] `scroll-area/factory.ts` — typed returns
- [ ] `table-of-contents/factory.ts` — add `getItem()` with `isActive`
- [ ] `notification-center/factory.ts` — typed returns
- [ ] `sheet/factory.ts` — add `open()`, `close()`, `toggle()`

---

## Phase 4: Verification

### Task 4.1: svelte-check
```bash
cd interfaces/desktop && pnpm svelte-check
```
**Expected**: 0 errors (was 117)

### Task 4.2: Full test suite
```bash
cd interfaces/desktop && npx vitest run
```
**Expected**: All tests pass (1,286+)

### Task 4.3: Spot-check type precision

For 5 representative builders, verify return types are exact (not Record):
- button `get root()` — exact `{ "data-cl-button-root": ""; id: string; ... }`
- checkbox `get root()` — exact with `aria-checked`, `onclick`, `onkeydown`
- toggle-group `get root()` — exact with `role: "group"`, `aria-orientation`
- spinner `get root()` — exact with `role: "status"`, `data-state`
- table `get root()` — exact with `role: "table"`

---

## Execution Strategy

### Wave 1 (Parallel): Phase 0 + Phase 1
- Agent A: Phase 0 (foundation fixes — schema, contracts, types, tests)
- Agent B: Phase 1 Batch 1A (10 layout builders)
- Agent C: Phase 1 Batch 1B (10 display builders)
- Agent D: Phase 1 Batch 1C (9 multi-slot builders)

### Wave 2 (Parallel): Phase 2
- Agent A: Batch 2A (7 form controls)
- Agent B: Batch 2B (6 interactive widgets)

### Wave 3 (Parallel): Phase 3
- Agent A: Batch 3A (7 builders)
- Agent B: Batch 3B (6 builders)

### Wave 4 (Sequential): Phase 4
- svelte-check
- Full test suite
- Type precision spot-check

---

## What This Sprint Does NOT Cover

1. **MeltUI adapter layer** (`api/adapters/meltui/_internal/`) — separate sprint
2. **Component layer re-authoring** — separate sprint after builders are solid
3. **New builders for adapter-backed kinds** (dialog, accordion, etc.) — these use MeltUI adapter, no ColdLight builder needed
4. **BaseOverlay pattern** — future sprint for sheet/notification-center inheritance
5. **[DELETED — no ui/ layer. Components ARE the styled final product]** (styled components) — Phase 6 in master plan

---

## Success Criteria

| Criterion | Metric |
|-----------|--------|
| Zero `SlotAttrs` usage | `grep -r "SlotAttrs" builders/` returns 0 |
| Exact typed returns | Representative builders return exact object types, not Record |
| JSDoc coverage | Every public member on every builder has JSDoc |
| Helper methods | Category B/C builders have programmatic control methods |
| svelte-check | 0 errors |
| Tests | All pass |
