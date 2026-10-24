# Sprint 07 — Interactive Controls & Navigation

> **Scope**: ToggleGroup, Slider, HoverCard, PinInput, Breadcrumb
> **Goal**: Add 5 primitives bringing total from 28 → 33. Full taxonomy contracts + structural shells.
> **Gate**: `pnpm svelte-check` passes. 0 errors. `/cl-primitive-verify` gold standard on all 5.
> **Created**: 2026-02-01
> **Status**: IN PROGRESS

---

## Scope Summary

| Kind | Type | Provider | Slots | Context | Files |
|------|------|----------|-------|---------|-------|
| toggle-group | Compound | meltui | 2 (root, item) | `{ value }` | 8 |
| slider | Compound | meltui | 4 (root, track, range, thumb) | `{ value }` | 10 |
| hover-card | Compound | meltui | 4 (root†, trigger, content, arrow) | `{ open }` | 10 |
| pin-input | Compound | meltui | 2 (root, input‡) | None | 7 |
| breadcrumb | Simple | coldlight | 6 (root, list, item, link, separator, page) | None | 11 |

† renderless root (fragment)  ‡ self-closing (input element)

**Total: 46 new files + 2 barrel updates = 48 operations**

---

## Execution Checklist

### 7.1 TOGGLE-GROUP (Compound, 8 files)

- [ ] `taxonomy/kinds/primitives/toggle-group/types.ts`
- [ ] `taxonomy/kinds/primitives/toggle-group/contract.ts`
- [ ] `taxonomy/kinds/primitives/toggle-group/index.ts`
- [ ] `primitives/toggle-group/types.ts`
- [ ] `primitives/toggle-group/context.ts`
- [ ] `primitives/toggle-group/ToggleGroup.svelte`
- [ ] `primitives/toggle-group/ToggleGroupItem.svelte`
- [ ] `primitives/toggle-group/index.ts`

### 7.2 SLIDER (Compound, 10 files)

- [ ] `taxonomy/kinds/primitives/slider/types.ts`
- [ ] `taxonomy/kinds/primitives/slider/contract.ts`
- [ ] `taxonomy/kinds/primitives/slider/index.ts`
- [ ] `primitives/slider/types.ts`
- [ ] `primitives/slider/context.ts`
- [ ] `primitives/slider/Slider.svelte`
- [ ] `primitives/slider/SliderTrack.svelte`
- [ ] `primitives/slider/SliderRange.svelte`
- [ ] `primitives/slider/SliderThumb.svelte`
- [ ] `primitives/slider/index.ts`

### 7.3 HOVER-CARD (Compound, 10 files)

- [ ] `taxonomy/kinds/primitives/hover-card/types.ts`
- [ ] `taxonomy/kinds/primitives/hover-card/contract.ts`
- [ ] `taxonomy/kinds/primitives/hover-card/index.ts`
- [ ] `primitives/hover-card/types.ts`
- [ ] `primitives/hover-card/context.ts`
- [ ] `primitives/hover-card/HoverCard.svelte` (renderless)
- [ ] `primitives/hover-card/HoverCardTrigger.svelte`
- [ ] `primitives/hover-card/HoverCardContent.svelte`
- [ ] `primitives/hover-card/HoverCardArrow.svelte`
- [ ] `primitives/hover-card/index.ts`

### 7.4 PIN-INPUT (Compound, 7 files)

- [ ] `taxonomy/kinds/primitives/pin-input/types.ts`
- [ ] `taxonomy/kinds/primitives/pin-input/contract.ts`
- [ ] `taxonomy/kinds/primitives/pin-input/index.ts`
- [ ] `primitives/pin-input/types.ts`
- [ ] `primitives/pin-input/PinInput.svelte`
- [ ] `primitives/pin-input/PinInputInput.svelte` (self-closing)
- [ ] `primitives/pin-input/index.ts`

### 7.5 BREADCRUMB (Simple, 11 files)

- [ ] `taxonomy/kinds/primitives/breadcrumb/types.ts`
- [ ] `taxonomy/kinds/primitives/breadcrumb/contract.ts`
- [ ] `taxonomy/kinds/primitives/breadcrumb/index.ts`
- [ ] `primitives/breadcrumb/types.ts`
- [ ] `primitives/breadcrumb/Breadcrumb.svelte`
- [ ] `primitives/breadcrumb/BreadcrumbList.svelte`
- [ ] `primitives/breadcrumb/BreadcrumbItem.svelte`
- [ ] `primitives/breadcrumb/BreadcrumbLink.svelte`
- [ ] `primitives/breadcrumb/BreadcrumbSeparator.svelte`
- [ ] `primitives/breadcrumb/BreadcrumbPage.svelte`
- [ ] `primitives/breadcrumb/index.ts`

### 7.6 BARREL UPDATES

- [ ] `primitives/index.ts` — add 5 re-exports
- [ ] `taxonomy/kinds/primitives/index.ts` — add 5 export blocks

### 7.7 GATE CHECK

- [ ] `pnpm svelte-check` — 0 errors
- [ ] Every `.svelte` has: `data-kind`, `data-slot`, `class={cn(className)}`, `{@render children?.()}`
- [ ] Every `.svelte` has: `{...rest}` spread, DEV `stripStyleProp` guard
- [ ] Renderless roots: only `{@render children?.()}`, no HTML element, no data-attrs
- [ ] Self-closing elements (PinInputInput): no children, no `{@render}`
- [ ] Types use `OmitStyle<T>` + `BaseProps` (or just `BaseProps` for renderless)
- [ ] ZERO: `@melt-ui/svelte` imports, `use:melt`, `role`, `aria-*`, `id`, event handlers
- [ ] Context uses Symbol-keyed pattern with typed get/set functions
- [ ] All contracts have ALL fields: kind, ariaStateProvider, slots, slotSpec, states, slotStates, slotActions, aria, keyboard, focusStrategy, compound
- [ ] Barrels export all components + types + context

---

## Remaining After Sprint 07

**33/40 complete. 7 remaining for Sprints 08-09:**
- dropdown-menu, context-menu, menubar (Sprint 08 — Menus)
- navigation-menu, command (Sprint 08 — Menus)
- combobox, pagination (Sprint 09 — Data & Final)
