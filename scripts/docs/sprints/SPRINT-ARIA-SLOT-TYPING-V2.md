# Sprint: ARIA-Aligned Slot Typing V2 — Derived from SSOT

**Created**: 2026-03-20
**Research**: [SPRINT-ARIA-SLOT-TYPING-V2.research.md](SPRINT-ARIA-SLOT-TYPING-V2.research.md)
**Supersedes**: SPRINT-ARIA-SLOT-TYPING (hand-authored interfaces — deleted)
**Status**: DRAFT — Awaiting owner decisions

---

## Goal

Make anatomy the SSOT for slot attribute types. Each slot declares its target HTML element. Slot attr types are DERIVED as native element attrs (from `svelte/elements`) intersected with ColdLight data attrs. Zero hand-authored ARIA.

**Pattern source**: React Aria / Spectrum S2 — hooks return native DOM element attr types.

---

## SSOT Map

| What | SSOT | Location |
|------|------|----------|
| ARIA attributes | Svelte / DOM spec | `svelte/elements` → `AriaAttributes` |
| Event handlers | Svelte / DOM spec | `svelte/elements` → `DOMAttributes<T>` |
| HTML element attrs | Svelte / DOM spec | `svelte/elements` → `HTMLButtonAttributes`, etc. |
| Slot structure | Anatomy | `primitives/{kind}/{kind}.anatomy.ts` |
| ColdLight data attrs | ColdLight | `_internal/types/common.ts` |
| ARIA contract | A11y spec | `primitives/{kind}/{kind}.a11y.ts` |

**No duplicates. No competing types.**

---

## STOP — Owner Decision Required (2 decisions)

### Decision 1: Anatomy API Shape

**Question**: How should createAnatomy declare element types per slot?

**Option A — Object map** (recommended):
```typescript
createAnatomy("button", {
  root: "button",
  icon: "span",
  label: "span",
} as const);
```
- Pro: Each part's element type is right there in the declaration
- Pro: Element type is a key in the same data structure as the part name
- Con: Breaking change — all 44 anatomy files must update from array to object

**Option B — Tuple pairs**:
```typescript
createAnatomy("button", [
  ["root", "button"],
  ["icon", "span"],
  ["label", "span"],
] as const);
```
- Pro: Preserves ordered array feel
- Con: Less readable, harder to access by name in the type

**Option C — Parallel arrays** (not recommended):
```typescript
createAnatomy("button", ["root", "icon", "label"] as const, ["button", "span", "span"] as const);
```
- Con: Fragile — arrays must stay in sync

**Impact**: This is the foundation type. Every anatomy file, every hook, every type file touches this.

---

### Decision 2: Custom Data Attrs Per Kind

**Question**: Where do kind-specific `data-*` attrs (data-value, data-orientation, data-channel, etc.) live?

**Option A — In the anatomy declaration**:
```typescript
createAnatomy("accordion", {
  root: { element: "div", data: { "data-disabled": "" } },
  trigger: { element: "button", data: { "data-state": "open" | "closed", "data-disabled": "" } },
  item: { element: "div", data: { "data-state": "open" | "closed", "data-value": "string" } },
  content: { element: "div", data: { "data-state": "open" | "closed" } },
} as const);
```
- Pro: Complete SSOT — anatomy declares EVERYTHING about structure
- Con: More complex anatomy declarations
- Con: Runtime data in type position is awkward

**Option B — Small per-kind data interface alongside the anatomy** (recommended):
```typescript
// button.anatomy.ts
export const buttonAnatomy = createAnatomy("button", {
  root: "button",
  icon: "span",
  label: "span",
} as const);

// Per-kind data attrs (only the custom ones — not ARIA, not events, not HTML)
export interface ButtonDataAttrs {
  root: { "data-loading": "" | undefined; "data-state": "on" | "off" | undefined };
}
```
- Pro: Anatomy stays clean (just structure + element type)
- Pro: Custom data attrs are still colocated in the anatomy file
- Pro: Type utility combines: `NativeElementAttrs & ColdLightSlotData & ButtonDataAttrs["root"]`
- Con: Two exports per anatomy file

**Option C — In the types file**:
```typescript
// button.types.ts
export interface ButtonRootData {
  "data-loading": "" | undefined;
  "data-state": "on" | "off" | undefined;
}
```
- Pro: Keeps anatomy files minimal
- Con: Data attrs split from structure — not colocated

**Impact**: This decides how much info the anatomy file carries vs the types file.

---

## Execution Plan

### Phase 1: Infrastructure (3 files)

1. Rewrite `schema/anatomy.schema.ts`:
   - `createAnatomy` takes object map `{ partName: elementTag }` instead of array
   - New `Anatomy<K, Parts>` type with element-aware attrs
   - Derives `SlotAttrs` per part from `svelte/elements`

2. Rewrite `_internal/types/common.ts`:
   - `ElementAttrMap` — maps tag name → Svelte attribute interface
   - `ColdLightSlotData<K, S>` — typed data-kind + data-slot
   - `SlotAttrs<K, S, E>` — native attrs & ColdLight data
   - Delete `SlotAttrs = Record<string, unknown>`

3. Rewrite `_internal/types/index.ts`:
   - Re-export new types

**Verify**: `pnpm svelte-check` — expect errors in anatomy files (breaking API change)

### Phase 2: Anatomy Files (44 files, batches of 10)

Update every `{kind}.anatomy.ts` from:
```typescript
createAnatomy("button", ["root", "icon", "label"] as const);
```
To (Option A):
```typescript
createAnatomy("button", { root: "button", icon: "span", label: "span" } as const);
```

Add per-kind data attr interfaces if Decision 2 = Option B.

**Verify after each batch**: `pnpm svelte-check`

### Phase 3: Types Files (44 files, batches of 10)

Rewrite every `{kind}.types.ts`:
- Delete ALL hand-authored slot attr interfaces (the 130 from V1)
- Import derived slot attrs from anatomy
- Update `UseXxxReturn` to use derived types

**Verify after each batch**: `pnpm svelte-check`

### Phase 4: Pre-existing Errors

Fix all pre-existing errors:
- `vitest.config.ts` — dirname conflicts (already fixed)
- `registry.ts` — contract imports from deleted `_schema/`
- `components/_schema/` — imports from deleted primitives `_schema/`
- `style/` — stale exports
- `_internal/a11y/` — null checks
- Component `.svelte` files — missing adapter imports, ClassValue mismatches

### Phase 5: Verification

```bash
pnpm svelte-check   # 0 errors
pnpm build           # succeeds
```

---

## Element Map (researched — what element each slot targets)

This is the complete map of every primitive slot → target HTML element, derived from reading all 44 hook implementations:

### Interactive Primitives

| Kind | Slot | Element |
|------|------|---------|
| accordion | root | div |
| accordion | item | div |
| accordion | trigger | button |
| accordion | content | div |
| alert-dialog | trigger | button |
| alert-dialog | overlay | div |
| alert-dialog | content | dialog |
| alert-dialog | title | h2 |
| alert-dialog | description | p |
| alert-dialog | cancel | button |
| alert-dialog | action | button |
| badge | root | span |
| breadcrumbs | root | nav |
| breadcrumbs | list | ol |
| breadcrumbs | item | li |
| breadcrumbs | separator | span |
| breadcrumbs | link | a |
| button | root | button |
| button | icon | span |
| button | label | span |
| checkbox | root | button |
| checkbox | indicator | span |
| checkbox | label | span |
| color-field | root | div |
| color-field | input | input |
| color-field | label | label |
| color-field | swatch | div |
| color-slider | root | div |
| color-slider | track | div |
| color-slider | thumb | div |
| color-slider | label | label |
| combobox | root | div |
| combobox | input | input |
| combobox | trigger | button |
| combobox | listbox | div |
| combobox | label | label |
| combobox | option | div |
| dialog | trigger | button |
| dialog | overlay | div |
| dialog | content | dialog |
| dialog | title | h2 |
| dialog | description | p |
| dialog | close | button |
| field | root | div |
| field | label | label |
| field | control | input |
| field | description | div |
| field | error | div |
| grid-list | root | div |
| grid-list | item | div |
| heading | root | h2 |
| label | root | label |
| link | root | a |
| listbox | root | div |
| listbox | option | div |
| listbox | group | div |
| menu | trigger | button |
| menu | content | div |
| menu | separator | div |
| menu | item | div |
| menu | group | div |
| meter | root | div |
| meter | track | div |
| meter | fill | div |
| meter | label | span |
| number-field | root | div |
| number-field | input | input |
| number-field | increment | button |
| number-field | decrement | button |
| popover | trigger | button |
| popover | content | div |
| popover | arrow | div |
| popover | close | button |
| progress | root | div |
| progress | track | div |
| progress | fill | div |
| progress | label | span |
| radio-group | root | div |
| radio-group | radio | div |
| radio-group | label | span |
| radio-group | description | span |
| search-field | root | div |
| search-field | input | input |
| search-field | icon | span |
| search-field | clear | button |
| select | root | div |
| select | trigger | button |
| select | value | span |
| select | listbox | div |
| select | label | label |
| select | option | div |
| separator | root | div |
| sheet | trigger | button |
| sheet | overlay | div |
| sheet | content | dialog |
| sheet | title | h2 |
| sheet | description | p |
| sheet | close | button |
| slider | root | div |
| slider | track | div |
| slider | thumb | div |
| slider | label | label |
| slider | output | output |
| switch | root | button |
| switch | thumb | span |
| switch | label | span |
| table | root | div |
| table | header | div |
| table | body | div |
| table | row | div |
| table | cell | div |
| table | column-header | div |
| tabs | root | div |
| tabs | list | div |
| tabs | trigger | button |
| tabs | content | div |
| tag-group | root | div |
| tag-group | label | span |
| tag-group | description | span |
| tag-group | tag | div |
| tag-group | remove | button |
| text-field | root | div |
| text-field | input | input |
| text-field | label | label |
| text-field | description | div |
| text-field | error | div |
| toggle | root | button |
| toolbar | root | div |
| toolbar | item | div |
| tooltip | trigger | div |
| tooltip | content | div |
| tree | root | div |
| tree | item | div |
| tree | group | div |

### Interaction Utilities (no anatomy — pure prop objects)

| Kind | Prop Name | Element | Native Type |
|------|-----------|---------|-------------|
| focus | focusProps | any | `{ onfocus, onblur }` |
| focus-ring | focusRingProps | any | `{ onfocus, onblur, data-focus-visible, autofocus }` |
| focus-within | focusWithinProps | any | `{ onfocusin, onfocusout }` |
| hover | hoverProps | any | `{ onpointerenter, onpointerleave }` |
| keyboard-handler | keyboardProps | any | `{ onkeydown?, onkeyup? }` |
| long-press | longPressProps | any | `{ onpointerdown, onpointerup, onpointercancel, onpointerleave }` |
| move | moveProps | any | `{ onpointerdown, onkeydown, tabindex }` |
| press | pressProps | any | `{ onpointerdown, onpointerup, onpointercancel, onpointerleave }` |

Interaction utilities use a subset of `HTMLAttributes<HTMLElement>` — they don't target a specific element.

---

## What This Sprint Does NOT Touch

- Hook implementations (`use-{kind}.svelte.ts`) — READ ONLY
- A11y spec files (`.a11y.ts`) — unchanged
- Props files (`.props.ts`) — unchanged
- Svelte component files (`.svelte`) — unchanged
- Recipe files — unchanged
- CSS/tokens — unchanged
