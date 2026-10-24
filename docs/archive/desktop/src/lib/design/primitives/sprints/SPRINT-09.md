# Sprint 09 — Data & Final

> **Scope**: combobox, pagination + aspect-ratio (utility)
> **Goal**: Add final 2 primitives (38 → 40) + 1 utility. ColdLight primitive library complete.
> **Gate**: `pnpm svelte-check` passes. 0 errors. `/cl-primitive-verify` gold standard on both primitives.
> **Created**: 2026-02-01
> **Status**: PLANNED

---

## Scope Summary

| Kind | Type | Provider | Slots | Context | Renderless | Self-closing |
|------|------|----------|-------|---------|------------|--------------|
| combobox | Compound | meltui | 7 (root†, input‡, trigger, content, item, group, empty) | `{ open, value }` | root | input |
| pagination | Compound | meltui | 6 (root, content, item, previous, next, ellipsis) | `{ page }` | — | — |
| aspect-ratio | Utility | coldlight | 1 (root) | — | — | — |

† renderless  ‡ self-closing

---

## Primitive Details

### COMBOBOX (7 slots)

Autocomplete input with dropdown list. role="combobox" on input, role="listbox" on content.
Keyboard: ArrowUp/Down to navigate, Enter to select, Escape to close.
Root is renderless (fragment). Input is self-closing.

| Slot | Element | Children | data-state |
|------|---------|----------|------------|
| root | fragment | renderless | — |
| input | input | self-closing | — |
| trigger | button | snippet | — |
| content | div | snippet | open/closed |
| item | div | snippet | selected/checked |
| group | div | snippet | — |
| empty | div | snippet | — |

Context: `ComboboxContext = { readonly open: boolean; readonly value: string }`

### PAGINATION (6 slots)

Page navigation controls. role="navigation" on root.
Keyboard: standard button keyboard. No special focus management.

| Slot | Element | Children | data-state |
|------|---------|----------|------------|
| root | nav | snippet | — |
| content | div | snippet | — |
| item | button | snippet | selected |
| previous | button | snippet | disabled |
| next | button | snippet | disabled |
| ellipsis | span | snippet | — |

Context: `PaginationContext = { readonly page: number }`

### ASPECT-RATIO (utility, 1 slot)

CSS aspect-ratio wrapper. Not a primitive — no taxonomy contract.
Location: `primitives/aspect-ratio/` (simple structural shell).

| Slot | Element | Children |
|------|---------|----------|
| root | div | snippet |

No context. No taxonomy.

---

## Execution Checklist

### 9.1 COMBOBOX (13 files)

Taxonomy:
- [ ] `taxonomy/kinds/primitives/combobox/types.ts`
- [ ] `taxonomy/kinds/primitives/combobox/contract.ts`
- [ ] `taxonomy/kinds/primitives/combobox/index.ts`

Primitives:
- [ ] `primitives/combobox/types.ts`
- [ ] `primitives/combobox/context.ts`
- [ ] `primitives/combobox/Combobox.svelte` (renderless)
- [ ] `primitives/combobox/ComboboxInput.svelte` (self-closing)
- [ ] `primitives/combobox/ComboboxTrigger.svelte`
- [ ] `primitives/combobox/ComboboxContent.svelte`
- [ ] `primitives/combobox/ComboboxItem.svelte`
- [ ] `primitives/combobox/ComboboxGroup.svelte`
- [ ] `primitives/combobox/ComboboxEmpty.svelte`
- [ ] `primitives/combobox/index.ts`

### 9.2 PAGINATION (12 files)

Taxonomy:
- [ ] `taxonomy/kinds/primitives/pagination/types.ts`
- [ ] `taxonomy/kinds/primitives/pagination/contract.ts`
- [ ] `taxonomy/kinds/primitives/pagination/index.ts`

Primitives:
- [ ] `primitives/pagination/types.ts`
- [ ] `primitives/pagination/context.ts`
- [ ] `primitives/pagination/Pagination.svelte`
- [ ] `primitives/pagination/PaginationContent.svelte`
- [ ] `primitives/pagination/PaginationItem.svelte`
- [ ] `primitives/pagination/PaginationPrevious.svelte`
- [ ] `primitives/pagination/PaginationNext.svelte`
- [ ] `primitives/pagination/PaginationEllipsis.svelte`
- [ ] `primitives/pagination/index.ts`

### 9.3 ASPECT-RATIO (3 files, utility)

- [ ] `primitives/aspect-ratio/types.ts`
- [ ] `primitives/aspect-ratio/AspectRatio.svelte`
- [ ] `primitives/aspect-ratio/index.ts`

### 9.4 BARREL UPDATES

- [ ] `primitives/index.ts` — add 3 re-exports (combobox, pagination, aspect-ratio)
- [ ] `taxonomy/kinds/primitives/index.ts` — add 2 export blocks (combobox, pagination)

### 9.5 GATE CHECK

- [ ] `pnpm svelte-check` — 0 errors
- [ ] All contracts have ALL fields
- [ ] ZERO: meltui imports, role, aria-*, id, event handlers in .svelte
- [ ] `/cl-primitive-verify combobox` → GOLD STANDARD
- [ ] `/cl-primitive-verify pagination` → GOLD STANDARD

---

## FINAL INVENTORY (40 primitives + 1 utility)

| # | Primitive | Sprint | Provider |
|---|-----------|--------|----------|
| 1 | dialog | 01 | meltui |
| 2 | button | 01 | coldlight |
| 3 | tabs | 01 | meltui |
| 4 | sheet | 01 | meltui |
| 5 | alert-dialog | 01 | meltui |
| 6 | popover | 01 | meltui |
| 7 | tooltip | 01 | meltui |
| 8 | select | 01 | meltui |
| 9 | separator | 02 | coldlight |
| 10 | collapsible | 02 | coldlight |
| 11 | accordion | 02 | meltui |
| 12 | scroll-area | 02 | coldlight |
| 13 | toolbar | 02 | coldlight |
| 14 | label | 04 | coldlight |
| 15 | badge | 04 | coldlight |
| 16 | input | 04 | coldlight |
| 17 | textarea | 04 | coldlight |
| 18 | toggle | 04 | coldlight |
| 19 | skeleton | 05 | coldlight |
| 20 | progress | 05 | coldlight |
| 21 | alert | 05 | coldlight |
| 22 | avatar | 05 | coldlight |
| 23 | card | 05 | coldlight |
| 24 | switch | 06 | coldlight |
| 25 | checkbox | 06 | coldlight |
| 26 | radio-group | 06 | coldlight |
| 27 | visually-hidden | 06 | coldlight |
| 28 | spinner | 06 | coldlight |
| 29 | toggle-group | 07 | meltui |
| 30 | slider | 07 | meltui |
| 31 | hover-card | 07 | meltui |
| 32 | pin-input | 07 | meltui |
| 33 | breadcrumb | 07 | coldlight |
| 34 | dropdown-menu | 08 | meltui |
| 35 | context-menu | 08 | meltui |
| 36 | menubar | 08 | meltui |
| 37 | navigation-menu | 08 | coldlight |
| 38 | command | 08 | coldlight |
| 39 | combobox | 09 | meltui |
| 40 | pagination | 09 | meltui |
| U1 | aspect-ratio | 09 | utility |
