# Sprint: ARIA-Aligned Slot Attribute Typing

**Created**: 2026-03-20
**Research**: [SPRINT-ARIA-SLOT-TYPING.research.md](SPRINT-ARIA-SLOT-TYPING.research.md)
**Status**: DRAFT — Awaiting owner decisions

---

## Goal

Replace all `Record<string, unknown>` in primitive `.types.ts` return interfaces with properly typed interfaces declaring exact ARIA attributes, data attributes, HTML attributes, and event handlers per slot.

**Scope**: 44 primitives, ~130 slot interfaces, split into 5 batches of ~10 each.

**NOT in scope**: Changing hook implementations. Types-only sprint. Zero runtime changes.

---

## SSOT Map

| What | SSOT Location | Action |
|------|---------------|--------|
| `SlotAttrs` alias | `_internal/types/common.ts` | Update or deprecate |
| `ColdLightDataAttrs` | `_internal/types/common.ts` | Keep — base for all slot types |
| `Anatomy<T>` | `schema/anatomy.schema.ts` | Keep — drives `data-kind` + `data-slot` |
| Per-primitive types | `primitives/{kind}/{kind}.types.ts` | MODIFY (44 files) |
| Per-primitive hooks | `primitives/{kind}/use-{kind}.svelte.ts` | READ ONLY — source of truth |
| Barrel exports | `primitives/{kind}/index.ts` | ADD new type exports |
| Root barrel | `primitives/index.ts` | ADD new type re-exports |

**No duplicates found. No pre-sprint consolidation needed.**

---

## STOP — Owner Decision Required (3 decisions)

### Decision 1: Naming Convention for Slot Attr Interfaces

**Question**: What naming pattern for the per-slot attribute interfaces?

**Options**:
| Option | Example | Tradeoff |
|--------|---------|----------|
| A | `ButtonRootAttrs` | Short, clear, follows Ark UI / Radix pattern |
| B | `ButtonRootSlotAttrs` | Explicit that these are "slot attributes" |
| C | `UseButtonRootAttrs` | Ties to hook name, longer |

**Impact**: Affects all 130+ interfaces and their exports. Cascades to components that reference these types.

---

### Decision 2: Base Type Strategy

**Question**: Should slot attr interfaces extend a shared base type, or be fully standalone?

**Options**:
| Option | Example | Tradeoff |
|--------|---------|----------|
| A | Extend `ColdLightDataAttrs` | `interface ButtonRootAttrs extends ColdLightDataAttrs { role: "button"; ... }` — DRY, enforces anatomy contract at type level |
| B | Standalone per-slot | `interface ButtonRootAttrs { "data-kind": "button"; "data-slot": "root"; role: "button"; ... }` — More verbose, but fully self-documenting |
| C | Parameterized base | `interface SlotBase<K extends string, S extends string> { "data-kind": K; "data-slot": S; }` then extend — Generic, less repetition |

**Impact**: Option A reuses existing type. Option B is copy-paste but readable. Option C is the most DRY but adds a generic layer.

---

### Decision 3: Event Handler Precision

**Question**: How precise should event handler types be?

**Options**:
| Option | Example | Tradeoff |
|--------|---------|----------|
| A | Exact signatures | `onclick: (e: MouseEvent) => void` vs `onclick: () => void` — matches implementation exactly |
| B | Normalized signatures | All `onclick: (e: MouseEvent) => void` even when hook ignores the event — consistent, but less truthful |

**Impact**: Option A is more work but type-safe. Option B is simpler but misleads consumers.

---

## Prerequisites

- [ ] Owner answers all 3 decisions above
- [ ] `svelte-check` passes on current main (baseline)

---

## Execution Plan (5 Batches)

Each batch:
1. Read each hook implementation (already done in research)
2. Write typed slot attr interfaces in `.types.ts`
3. Update `UseXxxReturn` to reference new interfaces instead of `Record<string, unknown>`
4. Export new types from `{kind}/index.ts` barrel
5. Run `svelte-check` after batch — must pass with 0 errors
6. Re-export from `primitives/index.ts`

---

### Batch 1: Core Interactive (10 primitives)

| # | Kind | Slots | Complexity |
|---|------|-------|------------|
| 1 | accordion | 4 (root, item, trigger, content) | Medium — parameterized getters |
| 2 | alert-dialog | 7 (trigger, overlay, content, title, description, cancel, action) | High — dialog ARIA |
| 3 | badge | 1 (root) | Low — presentational |
| 4 | breadcrumbs | 5 (root, list, item, separator, link) | Medium — parameterized getLink |
| 5 | button | 1 (root) | Medium — tri-mode ARIA |
| 6 | checkbox | 3 (root, indicator, label) | Medium — tri-state |
| 7 | color-field | 4 (root, input, label, swatch) | Medium — form field |
| 8 | color-slider | 4 (root, track, thumb, label) | High — slider ARIA |
| 9 | combobox | 6 (root, input, trigger, listbox, label, option) | High — activedescendant |
| 10 | dialog | 6 (trigger, overlay, content, title, description, close) | High — modal ARIA |

**Total new interfaces**: ~41
**Verify**: `pnpm svelte-check` → 0 errors

---

### Batch 2: Form & Data (10 primitives)

| # | Kind | Slots | Complexity |
|---|------|-------|------------|
| 11 | field | 5 (root, label, control, description, error) | Medium — field wrapper |
| 12 | grid-list | 2 (root, item) | Medium — grid ARIA |
| 13 | heading | 1 (root) | Low — semantic |
| 14 | label | 1 (root) | Low — semantic |
| 15 | link | 1 (root) | Medium — conditional native/non-native |
| 16 | listbox | 4 (root, option, group, label) | High — activedescendant |
| 17 | menu | 6 (trigger, content, separator, item, group, label) | High — menu ARIA |
| 18 | meter | 4 (root, track, fill, label) | Medium — meter ARIA |
| 19 | number-field | 4 (root, input, increment, decrement) | Medium — spinbutton |
| 20 | popover | 4 (trigger, content, arrow, close) | Medium — popup ARIA |

**Total new interfaces**: ~32
**Verify**: `pnpm svelte-check` → 0 errors

---

### Batch 3: Controls & Overlays (10 primitives)

| # | Kind | Slots | Complexity |
|---|------|-------|------------|
| 21 | progress | 4 (root, track, fill, label) | Medium — progressbar |
| 22 | radio-group | 4 (root, radio, label, description) | High — roving tabindex |
| 23 | search-field | 4 (root, input, icon, clear) | Medium — search field |
| 24 | select | 6 (root, trigger, value, listbox, label, option) | High — combobox/listbox |
| 25 | separator | 1 (root) | Low — conditional role |
| 26 | sheet | 6 (trigger, overlay, content, title, description, close) | High — dialog variant |
| 27 | slider | 5 (root, track, thumb, label, output) | High — slider ARIA |
| 28 | switch | 3 (root, thumb, label) | Medium — switch ARIA |
| 29 | table | 6 (root, header, body, row, cell, column-header) | High — grid ARIA |
| 30 | tabs | 4 (root, list, trigger, content) | High — tablist ARIA |

**Total new interfaces**: ~43
**Verify**: `pnpm svelte-check` → 0 errors

---

### Batch 4: Remaining Components + Interaction Start (10)

| # | Kind | Slots | Complexity |
|---|------|-------|------------|
| 31 | tag-group | 5 (root, label, description, tag, remove) | Medium — grid ARIA |
| 32 | text-field | 5 (root, input, label, description, error) | Medium — form field |
| 33 | toggle | 1 (root) | Low — pressed button |
| 34 | toolbar | 2 (root, item) | Medium — toolbar ARIA |
| 35 | tooltip | 2 (trigger, content) | Low — tooltip ARIA |
| 36 | tree | 3 (root, item, group) | High — tree ARIA |
| 37 | focus | 1 (focusProps) | Low — event pair |
| 38 | focus-ring | 1 (focusRingProps) | Low — event pair + data attr |
| 39 | focus-within | 1 (focusWithinProps) | Low — event pair |
| 40 | hover | 1 (hoverProps) | Low — event pair |

**Total new interfaces**: ~22
**Verify**: `pnpm svelte-check` → 0 errors

---

### Batch 5: Remaining Interactions + Infrastructure (4 + cleanup)

| # | Kind | Slots | Complexity |
|---|------|-------|------------|
| 41 | keyboard-handler | 1 (keyboardProps) | Low — event pair |
| 42 | long-press | 1 (longPressProps) | Low — pointer events |
| 43 | move | 1 (moveProps) | Low — pointer + keyboard |
| 44 | press | 1 (pressProps) | Low — pointer events |

**Infrastructure cleanup**:
- [ ] Update `_internal/types/common.ts` — deprecate/remove `SlotAttrs = Record<string, unknown>`
- [ ] Update `_internal/types/index.ts` — re-export new base type if created
- [ ] Update `primitives/index.ts` — add all new type exports
- [ ] Final `pnpm svelte-check` → 0 errors
- [ ] Final `pnpm build` → succeeds

**Verify**: Full typecheck + build pass

---

## Verification Protocol (per batch)

```bash
cd interfaces/desktop
pnpm svelte-check  # Must be 0 errors after each batch
```

After Batch 5:
```bash
pnpm build          # Full production build must pass
```

---

## What This Sprint Does NOT Touch

- Hook implementations (`use-{kind}.svelte.ts`) — READ ONLY
- Anatomy files (`.anatomy.ts`) — unchanged
- A11y spec files (`.a11y.ts`) — unchanged
- Props files (`.props.ts`) — unchanged
- Component files (`components/{kind}/`) — unchanged
- Recipe files — unchanged
- CSS/tokens — unchanged

---

## Research Notes

Full slot inventory with exact attribute shapes: [SPRINT-ARIA-SLOT-TYPING.research.md](SPRINT-ARIA-SLOT-TYPING.research.md)
