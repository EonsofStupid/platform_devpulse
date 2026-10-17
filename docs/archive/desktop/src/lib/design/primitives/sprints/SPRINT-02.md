# Sprint 02 — Layout & Structure Primitives

> **Scope**: Separator, Collapsible, Accordion, ScrollArea, Toolbar
> **Goal**: Establish layout/structure primitives following Sprint 1 golden patterns.
> **Gate**: `pnpm svelte-check` passes. 0 errors. Zero ARIA/behavior/melt in primitives.
> **Created**: 2026-01-31
> **Status**: COMPLETE

---

## Scope Summary

| Kind | Type | Slots | Context | Files |
|------|------|-------|---------|-------|
| Separator | Simple | 1 (root) | No | 6 |
| Collapsible | Compound | 3 (root, trigger, content) | `{ open, disabled }` | 9 |
| Accordion | Compound | 5 (root, item, header, trigger, content) | Nested: root + item | 11 |
| ScrollArea | Compound | 5 (root, viewport, scrollbar, thumb, corner) | No | 10 |
| Toolbar | Compound | 5 (root, group, item, separator, link) | No | 10 |

**Total: 46 new files + 2 barrel updates**

**Deferred**: AspectRatio — utility, not primitive. Goes to `src/lib/design/utils/`.

---

## Execution Checklist

### 2.1 SEPARATOR (Simple, 6 files)

- [x] `taxonomy/kinds/primitives/separator/types.ts`
- [x] `taxonomy/kinds/primitives/separator/contract.ts`
- [x] `taxonomy/kinds/primitives/separator/index.ts`
- [x] `primitives/separator/types.ts`
- [x] `primitives/separator/Separator.svelte`
- [x] `primitives/separator/index.ts`

### 2.2 COLLAPSIBLE (Compound, 9 files)

- [x] `taxonomy/kinds/primitives/collapsible/types.ts`
- [x] `taxonomy/kinds/primitives/collapsible/contract.ts`
- [x] `taxonomy/kinds/primitives/collapsible/index.ts`
- [x] `primitives/collapsible/types.ts`
- [x] `primitives/collapsible/context.ts`
- [x] `primitives/collapsible/Collapsible.svelte`
- [x] `primitives/collapsible/CollapsibleTrigger.svelte`
- [x] `primitives/collapsible/CollapsibleContent.svelte`
- [x] `primitives/collapsible/index.ts`

### 2.3 ACCORDION (Compound, 11 files)

- [x] `taxonomy/kinds/primitives/accordion/types.ts`
- [x] `taxonomy/kinds/primitives/accordion/contract.ts`
- [x] `taxonomy/kinds/primitives/accordion/index.ts`
- [x] `primitives/accordion/types.ts`
- [x] `primitives/accordion/context.ts`
- [x] `primitives/accordion/Accordion.svelte`
- [x] `primitives/accordion/AccordionItem.svelte`
- [x] `primitives/accordion/AccordionHeader.svelte`
- [x] `primitives/accordion/AccordionTrigger.svelte`
- [x] `primitives/accordion/AccordionContent.svelte`
- [x] `primitives/accordion/index.ts`

### 2.4 SCROLL AREA (Compound, 10 files)

- [x] `taxonomy/kinds/primitives/scroll-area/types.ts`
- [x] `taxonomy/kinds/primitives/scroll-area/contract.ts`
- [x] `taxonomy/kinds/primitives/scroll-area/index.ts`
- [x] `primitives/scroll-area/types.ts`
- [x] `primitives/scroll-area/ScrollArea.svelte`
- [x] `primitives/scroll-area/ScrollAreaViewport.svelte`
- [x] `primitives/scroll-area/ScrollAreaScrollbar.svelte`
- [x] `primitives/scroll-area/ScrollAreaThumb.svelte`
- [x] `primitives/scroll-area/ScrollAreaCorner.svelte`
- [x] `primitives/scroll-area/index.ts`

### 2.5 TOOLBAR (Compound, 10 files)

- [x] `taxonomy/kinds/primitives/toolbar/types.ts`
- [x] `taxonomy/kinds/primitives/toolbar/contract.ts`
- [x] `taxonomy/kinds/primitives/toolbar/index.ts`
- [x] `primitives/toolbar/types.ts`
- [x] `primitives/toolbar/Toolbar.svelte`
- [x] `primitives/toolbar/ToolbarGroup.svelte`
- [x] `primitives/toolbar/ToolbarItem.svelte`
- [x] `primitives/toolbar/ToolbarSeparator.svelte`
- [x] `primitives/toolbar/ToolbarLink.svelte`
- [x] `primitives/toolbar/index.ts`

### 2.6 BARREL UPDATES

- [x] `primitives/index.ts` — add 5 re-exports
- [x] `taxonomy/kinds/primitives/index.ts` — add 5 export blocks

### 2.7 GATE CHECK

- [x] `pnpm svelte-check` — 0 errors (12 warnings, all pre-existing in Inspector.svelte/TopBar.svelte/Frame.svelte)
- [x] Every `.svelte` has: `data-kind`, `data-slot`, `class={cn(className)}`, `{@render children?.()}`
- [x] Every `.svelte` has: `{...rest}` spread, DEV `stripStyleProp` guard
- [x] Types use `OmitStyle<T>` + `BaseProps`
- [x] ZERO: `@melt-ui/svelte` imports, `use:melt`, `role`, `aria-*`, `id`, event handlers
- [x] Context uses Symbol-keyed pattern with typed get/set functions
- [x] Barrels export all components + types + context
