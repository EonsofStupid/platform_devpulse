# SPRINT: Enterprise Primitive Authoring

**Date**: 2026-03-28
**Status**: APPROVED — Execute immediately
**Prerequisite**: None — this is foundation work
**Blocks**: Component alignment cannot start until this completes

---

## Gold Standard Pattern (Verified from 14 existing primitives)

Every primitive folder MUST have exactly 3 files: `anatomy.ts`, `types.ts`, `index.ts`.
Layout primitives (dot, icon-slot, row, stack, surface, text, separator) additionally have `.svelte`.

### anatomy.ts — STRUCTURE CONTRACT

```typescript
import { createAnatomy } from "../../schema/anatomy.schema.js";

/**
 * {Kind} anatomy — {one-line description}.
 *
 * WAI-ARIA: {link to relevant APG pattern}
 *
 * {2-4 lines describing the interaction pattern, what makes this
 *  primitive different from similar ones, and critical accessibility notes.}
 *
 * Keyboard:
 * {list every keyboard interaction per APG spec}
 */
export const {kind}Anatomy = createAnatomy("{kind}", {
	{slot}: {
		description: "{2-3 sentences: what this slot is, what element it renders as, ARIA requirements, edge cases}",
		element: "{semantic HTML element(s)}",
		required: {true|false},
		aria: {
			role: "{ARIA role if not implied by element}",
			required: ["{aria attributes that MUST be present}"],
			conditional: ["{aria attributes applied based on state}"],
		},
		accepts: ["{content types: any|text|interactive|structural|media|none}"],
		stateAttrs: ["{data-state, data-disabled, data-orientation, etc.}"],
		keyboard: {
			activates: ["{keys that activate: Space, Enter}"],
			navigates: ["{keys for navigation: ArrowUp, ArrowDown, Home, End}"],
			dismisses: "{key to dismiss: Escape}",
			focusable: {true|false},
		},
		repeatable: {true — only for slots that appear multiple times (list items, options)},
	},
});
```

**RULES:**
- Every slot MUST have `description`, `element`, `required`
- `aria` MUST be present on any interactive slot or any slot with a role
- `keyboard` MUST be present on any focusable slot
- `accepts` MUST be present on every slot
- `stateAttrs` on any slot that changes visual state
- `repeatable: true` on slots that appear N times (items, options, rows)
- NO empty objects. If a field has no value, omit it.

### types.ts — STRUCTURAL PROPS

```typescript
import type { Snippet } from "svelte";
import type { HTML{Element}Attributes } from "svelte/elements";

/** {Helper type if needed} */
export type {Kind}{TypeName} = "value1" | "value2";

/**
 * Structural props for the {Kind} primitive.
 *
 * {2-3 sentences: what this primitive is, how it behaves, key distinction
 *  from similar primitives, and when to use an alternative instead.}
 *
 * @example
 * ```svelte
 * {3-6 lines showing anatomy attrs spread on real HTML elements}
 * ```
 */
export interface {Kind}PrimitiveProps
	extends Omit<HTML{Element}Attributes, "children"> {
	/** Snippet content rendered inside the {kind} */
	children?: Snippet;
	/** Additional CSS classes */
	class?: string;
	/** {Every structural prop with JSDoc} */
	{prop}?: {type};
}
```

**RULES:**
- Extends the CORRECT native HTML attrs (HTMLButtonAttributes for buttons, HTMLDialogAttributes for dialogs, etc.)
- Omits "children" from native attrs (Svelte 5 uses Snippet)
- `children` and `class` ALWAYS present
- Every prop has JSDoc comment
- The @example shows anatomy attrs being spread — this IS the usage pattern
- Helper types exported (e.g., SheetSide, PopoverPlacement, FieldOrientation)
- Props are STRUCTURAL (state, callbacks, orientation, mode) — NOT visual (no size, color, variant)

### index.ts — PUBLIC API

```typescript
/**
 * @file primitives/{kind} — {one-line description}.
 * @package @devpulse/coldlight
 * @layer primitive
 */

export { {kind}Anatomy } from "./anatomy.js";
export type { {Kind}PrimitiveProps } from "./types.js";
// Layout primitives ONLY:
// export { default as {Kind} } from "./{Kind}.svelte";
```

**RULES:**
- Exports anatomy + types
- Layout primitives additionally export .svelte default
- NEVER export .spec.ts files
- NEVER export test utilities
- `.js` extensions on all imports

---

## Behavior Anatomy Fix Pattern

Every behavior that has a matching primitive MUST re-export from the primitive:

```typescript
/**
 * Re-export anatomy from primitives — primitives own structure,
 * behaviors add interaction on top.
 */
export { {kind}Anatomy } from "$lib/design/primitives/{kind}/anatomy.js";
```

Delete the `createAnatomy` call. Delete the array. One line re-export.

---

## Execution Plan

### Batch 1: Fix the accordion anatomy.ts I already created (verify it matches gold standard)

### Batch 2: Author 20 remaining behavior-backed primitives

For each, author anatomy.ts + upgrade types.ts + fix index.ts.
Then fix the matching behavior anatomy file to re-export.

Order:
1. breadcrumbs
2. color-field
3. color-slider
4. combobox
5. grid-list
6. listbox
7. menu
8. meter
9. number-field
10. progress
11. radio-group
12. search-field
13. select
14. slider
15. table
16. tabs
17. tag-group
18. text-field
19. toolbar
20. tree

### Batch 3: Author 6 layout primitives

For each, author anatomy.ts + upgrade types.ts + fix index.ts.
These have NO matching behavior. Anatomy authored from scratch.

Order:
1. dot
2. icon-slot
3. row
4. stack
5. surface
6. text

### Batch 4: Fix 22 behavior anatomy files

Replace `createAnatomy(kind, [...])` with re-export from primitives.

### Batch 5: svelte-check — ZERO errors from primitives/behaviors

### Batch 6: Final verification checklist

---

## Per-Primitive Slot Definitions

### behavior-backed (slots from behavior anatomy files, enriched to full SlotMeta)

| Primitive | Slots | Key ARIA |
|---|---|---|
| accordion | root, item, trigger, content | trigger: aria-expanded, aria-controls; content: role=region, aria-labelledby |
| breadcrumbs | root, list, item, link, separator | root: role=navigation; list: role=list; link: aria-current |
| color-field | root, input, label, swatch | input: aria-label; swatch: aria-hidden |
| color-slider | root, track, thumb, label | root: role=slider; thumb: aria-valuenow/min/max |
| combobox | root, input, trigger, listbox, option, label | input: role=combobox, aria-expanded, aria-autocomplete; listbox: role=listbox |
| grid-list | root, item | root: role=grid; item: role=gridcell |
| listbox | root, option, group, label | root: role=listbox; option: role=option, aria-selected |
| menu | root, trigger, content, item, separator, group, label | trigger: aria-haspopup=menu, aria-expanded; content: role=menu; item: role=menuitem |
| meter | root, track, fill, label | root: role=meter, aria-valuenow/min/max/text |
| number-field | root, input, increment, decrement | input: role=spinbutton, aria-valuenow/min/max; buttons: aria-label |
| progress | root, track, fill, label | root: role=progressbar, aria-valuenow/min/max |
| radio-group | root, radio, label, description | root: role=radiogroup; radio: role=radio, aria-checked |
| search-field | root, input, icon, clear | root: role=search; input: type=search; clear: aria-label |
| select | root, trigger, value, listbox, option, label | trigger: role=combobox, aria-expanded; listbox: role=listbox; option: role=option |
| slider | root, track, thumb, label, output | root: role=slider; thumb: aria-valuenow/min/max; output: aria-live |
| table | root, header, body, row, cell, column-header | root: role=table; row: role=row; cell: role=cell; column-header: role=columnheader |
| tabs | root, list, trigger, content | list: role=tablist; trigger: role=tab, aria-selected; content: role=tabpanel |
| tag-group | root, tag, label, description, remove | root: role=grid; tag: role=gridcell; remove: aria-label |
| text-field | root, input, label, description, error | same as field but specific to text/textarea |
| toolbar | root, item | root: role=toolbar, aria-orientation |
| tree | root, item, group | root: role=tree; item: role=treeitem, aria-expanded; group: role=group |

### layout (no behavior, author from scratch)

| Primitive | Slots | Semantics |
|---|---|---|
| dot | root | aria-hidden decorative, or aria-label when meaningful |
| icon-slot | root | aria-hidden decorative container |
| row | root | no semantics — pure layout |
| stack | root | no semantics — pure layout |
| surface | root | role=group when labeled, role=region when aria-label |
| text | root | inherits from semantic element choice (span, p, strong, em, small, div) |

---

## CHECKLIST (Execute After ALL Code Is Written)

For EVERY primitive folder (42 total):

- [ ] `anatomy.ts` exists
- [ ] `anatomy.ts` uses `createAnatomy` from `../../schema/anatomy.schema.js`
- [ ] `anatomy.ts` has full `SlotMeta` objects (not string arrays)
- [ ] Every slot has `description`, `element`, `required`
- [ ] Interactive slots have `aria` and `keyboard`
- [ ] `types.ts` has `{Kind}PrimitiveProps` interface
- [ ] `types.ts` extends correct native HTML attributes
- [ ] `types.ts` has JSDoc with `@example` showing anatomy attrs
- [ ] `types.ts` has structural props beyond just `children` + `class`
- [ ] `index.ts` exports `{kind}Anatomy` from `./anatomy.js`
- [ ] `index.ts` exports `{Kind}PrimitiveProps` type from `./types.js`
- [ ] `index.ts` does NOT export `.spec.ts` files
- [ ] All imports use `.js` extensions

For EVERY behavior anatomy file (36 total):

- [ ] Files with matching primitives: single re-export line from `$lib/design/primitives/{kind}/anatomy.js`
- [ ] NO `createAnatomy` calls in behavior anatomy files that have a matching primitive
- [ ] NO `createSimpleAnatomy` anywhere (banned by Biome GritQL rule)

Final gate:

- [ ] `npx svelte-check --threshold error` — ZERO errors from primitives/ or behaviors/
- [ ] `npx biome check` — ZERO violations from the new GritQL rule
