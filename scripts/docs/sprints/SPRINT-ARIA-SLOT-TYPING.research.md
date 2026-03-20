# Research: ARIA-Aligned Slot Attribute Typing

**Date**: 2026-03-20
**Sprint**: SPRINT-ARIA-SLOT-TYPING
**Status**: COMPLETE

## SSOT Map

### Type Infrastructure (existing)
| File | What | Status |
|------|------|--------|
| `_internal/types/common.ts` | `SlotAttrs = Record<string, unknown>`, `ColdLightDataAttrs` | SSOT — needs update |
| `_internal/types/index.ts` | Re-exports `SlotAttrs`, `ColdLightDataAttrs` | Barrel — will re-export new types |
| `schema/anatomy.schema.ts` | `Anatomy<T>`, `createAnatomy()` → `{ "data-kind": string, "data-slot": T }` | SSOT — keep as-is |
| `schema/a11y.schema.ts` | `A11ySpec`, `FocusStrategy`, `KeyboardBinding` | SSOT — keep as-is |
| `_internal/utils/data-attr.ts` | `dataAttr()` → `"" \| string \| undefined`, `disabledAttr()` → `true \| undefined` | SSOT — keep as-is |
| `config/coldlight/vocabularies.cfg.ts` | `ARIA_ROLES` (69), `ARIA_ATTRIBUTES` (30), `STATE_TOKENS` (34) | Reference — informs type design |

### Per-Primitive Types (44 files with `Record<string, unknown>`)
Every `.types.ts` file in `primitives/{kind}/` uses `Record<string, unknown>` for slot attrs.

### No Duplicates Found
No competing type definitions for slot attributes exist. `SlotAttrs` in `common.ts` is the only alias, used nowhere except the barrel export. The per-primitive `.types.ts` files inline `Record<string, unknown>` directly — they don't reference `SlotAttrs`.

---

## Question/Goal

Replace all `Record<string, unknown>` in primitive `.types.ts` return interfaces with properly typed interfaces that declare the exact ARIA attributes, data attributes, HTML attributes, and event handlers each slot returns.

---

## Codebase Analysis

### Current Pattern (every primitive)
```typescript
// button.types.ts
export interface UseButtonReturn {
  readonly root: Record<string, unknown>;  // ← UNTYPED
  readonly pressed: boolean | undefined;
  readonly isDisabled: boolean;
  press(): void;
  unpress(): void;
  toggle(): void;
}
```

### What hooks ACTUALLY return (verified by reading all 44 implementations)
```typescript
// use-button.svelte.ts returns:
root = {
  id: string,
  "data-kind": "button",     // from anatomy
  "data-slot": "root",       // from anatomy
  type: "button" | "submit" | "reset",
  role: "button",
  "aria-disabled": true | undefined,
  "aria-pressed": boolean | undefined,
  "aria-expanded": boolean | undefined,
  "aria-busy": true | undefined,
  "data-disabled": "" | undefined,
  "data-loading": "" | undefined,
  "data-state": "on" | "off" | undefined,
  onclick: (e: MouseEvent) => void,
  onkeydown: (e: KeyboardEvent) => void,
}
```

### Scope: 44 primitives, ~130 slot interfaces needed

**Interactive primitives** (36 kinds, ~110 slots):
accordion (4 slots), alert-dialog (7), badge (1), breadcrumbs (5), button (1),
checkbox (3), color-field (4), color-slider (4), combobox (6), dialog (6),
field (5), grid-list (2), heading (1), label (1), link (1), listbox (4),
menu (6), meter (4), number-field (4), popover (4), progress (4),
radio-group (4), search-field (4), select (6), separator (1), sheet (6),
slider (5), switch (3), table (6), tabs (4), tag-group (5), text-field (5),
toggle (1), toolbar (2), tooltip (2), tree (3)

**Interaction utilities** (8 kinds, ~8 prop objects):
focus (1), focus-ring (1), focus-within (1), hover (1),
keyboard-handler (1), long-press (1), move (1), press (1)

**Pure utilities (NO Record<string, unknown>)**: filter, locale — skip

---

## Complete Slot Inventory (verified from hook implementations)

### accordion
- `root`: `{ "data-kind": "accordion", "data-slot": "root", "data-disabled": "" | undefined }`
- `getItem()`: `{ "data-kind": "accordion", "data-slot": "item", "data-state": "open" | "closed", "data-value": string }`
- `getTrigger()`: `{ "data-kind": "accordion", "data-slot": "trigger", type: "button", id: string, "aria-expanded": boolean, "aria-controls": string, "aria-disabled": true | undefined, "data-state": "open" | "closed", "data-disabled": "" | undefined, onclick: () => void, onkeydown: (e: KeyboardEvent) => void }`
- `getContent()`: `{ "data-kind": "accordion", "data-slot": "content", role: "region", id: string, "aria-labelledby": string, hidden: true | undefined, "data-state": "open" | "closed" }`

### alert-dialog
- `trigger`: `{ "data-kind": "alert-dialog", "data-slot": "trigger", type: "button", "aria-haspopup": "dialog", "data-state": "open" | "closed", onclick: () => void }`
- `overlay`: `{ "data-kind": "alert-dialog", "data-slot": "overlay", "aria-hidden": "true", popover: "manual", "data-state": "open" | "closed" }`
- `content`: `{ "data-kind": "alert-dialog", "data-slot": "content", id: string, role: "alertdialog", "aria-modal": "true", "aria-labelledby": string, "aria-describedby": string, "data-state": "open" | "closed", onclose: () => void, oncancel: (e: Event) => void }`
- `title`: `{ "data-kind": "alert-dialog", "data-slot": "title", id: string }`
- `description`: `{ "data-kind": "alert-dialog", "data-slot": "description", id: string }`
- `cancel`: `{ "data-kind": "alert-dialog", "data-slot": "cancel", type: "button", onclick: () => void }`
- `action`: `{ "data-kind": "alert-dialog", "data-slot": "action", type: "button", onclick: () => void }`

### badge
- `root`: `{ "data-kind": "badge", "data-slot": "root", role: "presentation", "aria-hidden": "true" | undefined, "data-variant": BadgeVariant, "data-fill": BadgeFillStyle, "data-size": BadgeSize }`

### breadcrumbs
- `root`: `{ "data-kind": "breadcrumbs", "data-slot": "root", role: "navigation", "aria-label": string }`
- `list`: `{ "data-kind": "breadcrumbs", "data-slot": "list" }`
- `item`: `{ "data-kind": "breadcrumbs", "data-slot": "item" }`
- `separator`: `{ "data-kind": "breadcrumbs", "data-slot": "separator", "aria-hidden": "true", role: "presentation" }`
- `getLink()`: `{ "data-kind": "breadcrumbs", "data-slot": "link", "aria-current": "page" | undefined, "data-current": "" | undefined }`

### button
- `root`: `{ "data-kind": "button", "data-slot": "root", id: string, type: "button" | "submit" | "reset", role: "button", "aria-disabled": true | undefined, "aria-pressed": boolean | undefined, "aria-expanded": boolean | undefined, "aria-busy": true | undefined, "data-disabled": "" | undefined, "data-loading": "" | undefined, "data-state": "on" | "off" | undefined, onclick: (e: MouseEvent) => void, onkeydown: (e: KeyboardEvent) => void }`

### checkbox
- `root`: `{ "data-kind": "checkbox", "data-slot": "root", id: string, role: "checkbox", type: "button", tabindex: 0, "aria-checked": "true" | "false" | "mixed", "aria-disabled": true | undefined, "aria-required": true | undefined, "aria-label": string | undefined, "aria-labelledby": string | undefined, "aria-describedby": string | undefined, "data-state": "checked" | "unchecked" | "indeterminate", "data-disabled": "" | string | undefined, onclick: () => void, onkeydown: (e: KeyboardEvent) => void }`
- `indicator`: `{ "data-kind": "checkbox", "data-slot": "indicator", id: string, "aria-hidden": "true", "data-state": "checked" | "unchecked" | "indeterminate" }`
- `label`: `{ "data-kind": "checkbox", "data-slot": "label", id: string, "data-disabled": "" | string | undefined, onclick: () => void }`

### color-field
- `root`: `{ "data-kind": "color-field", "data-slot": "root", id: string, "data-disabled": "" | string | undefined, "data-invalid": "" | undefined }`
- `input`: `{ "data-kind": "color-field", "data-slot": "input", id: string, type: "text", value: string, placeholder: string, disabled: true | undefined, readonly: true | undefined, "aria-label": string | undefined, "aria-labelledby": string | undefined, "aria-invalid": true | undefined, "aria-disabled": true | undefined, "data-disabled": "" | string | undefined, oninput: (e: Event) => void }`
- `label`: `{ "data-kind": "color-field", "data-slot": "label", id: string, for: string, "data-disabled": "" | string | undefined }`
- `swatch`: `{ "data-kind": "color-field", "data-slot": "swatch", id: string, "aria-hidden": "true", "data-valid": "" | string | undefined, style: string | undefined }`

### color-slider
- `root`: `{ "data-kind": "color-slider", "data-slot": "root", id: string, "data-channel": ColorChannel, "data-orientation": "horizontal" | "vertical", "data-disabled": "" | string | undefined }`
- `track`: `{ "data-kind": "color-slider", "data-slot": "track", id: string, "data-channel": ColorChannel, "data-orientation": "horizontal" | "vertical", "data-disabled": "" | string | undefined }`
- `thumb`: `{ "data-kind": "color-slider", "data-slot": "thumb", id: string, role: "slider", tabindex: 0 | -1, "aria-valuenow": number, "aria-valuemin": number, "aria-valuemax": number, "aria-orientation": "horizontal" | "vertical", "aria-label": string, "aria-disabled": "true" | undefined, "data-channel": ColorChannel, "data-disabled": "" | string | undefined, style: string, onkeydown: (e: KeyboardEvent) => void, onpointerdown: (e: PointerEvent) => void }`
- `label`: `{ "data-kind": "color-slider", "data-slot": "label", id: string, "data-disabled": "" | string | undefined }`

### combobox
- `root`: `{ "data-kind": "combobox", "data-slot": "root" }`
- `input`: `{ "data-kind": "combobox", "data-slot": "input", id: string, role: "combobox", type: "text", value: string, placeholder: string | undefined, "aria-expanded": boolean, "aria-haspopup": "listbox", "aria-activedescendant": string | undefined, "aria-autocomplete": "list", "aria-controls": string, "aria-disabled": "true" | undefined, "aria-label": string | undefined, "aria-labelledby": string | undefined, "data-state": "open" | "closed", disabled: true | undefined, oninput: (e: Event) => void, onkeydown: (e: KeyboardEvent) => void, onfocus: () => void }`
- `trigger`: `{ "data-kind": "combobox", "data-slot": "trigger", type: "button", tabindex: -1, "aria-label": "Toggle options", "data-state": "open" | "closed", onclick: () => void }`
- `listbox`: `{ "data-kind": "combobox", "data-slot": "listbox", id: string, role: "listbox" }`
- `label`: `{ "data-kind": "combobox", "data-slot": "label" }`
- `getOption()`: `{ "data-kind": "combobox", "data-slot": "option", id: string, role: "option", "aria-selected": boolean, "aria-disabled": boolean | undefined, "data-value": string, "data-state": "selected" | "unselected", "data-highlighted": "" | undefined, "data-disabled": "" | undefined, onclick: () => void, onpointerenter: () => void }`

### dialog
- `trigger`: `{ "data-kind": "dialog", "data-slot": "trigger", type: "button", "aria-haspopup": "dialog", "aria-expanded": boolean, "aria-controls": string, "data-state": "open" | "closed", onclick: () => void }`
- `overlay`: `{ "data-kind": "dialog", "data-slot": "overlay", "aria-hidden": "true", popover: "manual", "data-state": "open" | "closed" }`
- `content`: `{ "data-kind": "dialog", "data-slot": "content", id: string, role: "dialog", "aria-modal": "true", "aria-labelledby": string, "aria-describedby": string, "data-state": "open" | "closed", onclose: () => void, oncancel: (e: Event) => void }`
- `title`: `{ "data-kind": "dialog", "data-slot": "title", id: string }`
- `description`: `{ "data-kind": "dialog", "data-slot": "description", id: string }`
- `close`: `{ "data-kind": "dialog", "data-slot": "close", type: "button", onclick: () => void }`

### field
- `root`: `{ "data-kind": "field", "data-slot": "root", id: string, role: "group", "aria-labelledby": string, "data-invalid": "" | undefined, "data-required": "" | undefined, "data-disabled": "" | undefined }`
- `label`: `{ "data-kind": "field", "data-slot": "label", id: string, for: string, "data-required": "" | undefined, "data-disabled": "" | undefined }`
- `control`: `{ "data-kind": "field", "data-slot": "control", id: string, "aria-describedby": string | undefined, "aria-invalid": "true" | undefined, "aria-required": "true" | undefined, "aria-disabled": "true" | undefined, "data-invalid": "" | undefined, "data-required": "" | undefined, "data-disabled": "" | undefined }`
- `description`: `{ "data-kind": "field", "data-slot": "description", id: string }`
- `error`: `{ "data-kind": "field", "data-slot": "error", id: string, role: "alert", "aria-live": "polite", "data-invalid": "" | undefined }`

### grid-list
- `root`: `{ "data-kind": "grid-list", "data-slot": "root", id: string, role: "grid", "aria-label": string | undefined, "aria-multiselectable": boolean | undefined, "aria-disabled": "true" | undefined, onkeydown: (e: KeyboardEvent) => void }`
- `getItem()`: `{ "data-kind": "grid-list", "data-slot": "item", role: "row", tabindex: 0, "aria-selected": boolean, "aria-disabled": boolean | undefined, "data-key": string, "data-selected": "" | undefined, "data-disabled": "" | undefined, onclick: () => void }`

### heading
- `root`: `{ "data-kind": "heading", "data-slot": "root", "data-level": HeadingLevel }`

### label
- `root`: `{ "data-kind": "label", "data-slot": "root", id: string, for: string | undefined, "data-disabled": "" | undefined }`

### link
- `root` (native): `{ "data-kind": "link", "data-slot": "root", id: string, href: string | undefined, target: string | undefined, rel: string | undefined, "aria-disabled": true | undefined, "aria-label": string | undefined, "aria-current": "page" | "step" | "location" | "date" | "time" | "true" | "false" | undefined, "data-disabled": "" | undefined, onclick: (e: MouseEvent) => void, onkeydown: (e: KeyboardEvent) => void }`
- `root` (non-native): `{ "data-kind": "link", "data-slot": "root", id: string, role: "link", tabindex: 0 | -1, "aria-disabled": true | undefined, "aria-label": string | undefined, "aria-current": ..., "data-disabled": "" | undefined, onclick: (e: MouseEvent) => void, onkeydown: (e: KeyboardEvent) => void }`

### listbox
- `root`: `{ "data-kind": "listbox", "data-slot": "root", id: string, role: "listbox", tabindex: 0, "aria-multiselectable": boolean | undefined, "aria-activedescendant": string | undefined, "aria-label": string | undefined, "aria-labelledby": string | undefined, "aria-disabled": "true" | undefined, "data-disabled": "" | undefined, onkeydown: (e: KeyboardEvent) => void }`
- `getOption()`: `{ "data-kind": "listbox", "data-slot": "option", id: string, role: "option", "aria-selected": boolean, "aria-disabled": boolean | undefined, "data-value": string, "data-state": "selected" | "unselected", "data-highlighted": "" | undefined, "data-disabled": "" | undefined, onclick: () => void, onpointerenter: () => void }`
- `getGroup()`: `{ "data-kind": "listbox", "data-slot": "group", role: "group", "aria-label": string }`

### menu
- `trigger`: `{ "data-kind": "menu", "data-slot": "trigger", type: "button", "aria-expanded": boolean, "aria-haspopup": "menu", "aria-controls": string, "data-state": "open" | "closed", onclick: () => void, onkeydown: (e: KeyboardEvent) => void }`
- `content`: `{ "data-kind": "menu", "data-slot": "content", id: string, role: "menu", "aria-label": string | undefined, "data-state": "open" | "closed", onkeydown: (e: KeyboardEvent) => void }`
- `separator`: `{ "data-kind": "menu", "data-slot": "separator", role: "separator" }`
- `getItem()`: `{ "data-kind": "menu", "data-slot": "item", role: "menuitem", tabindex: -1, "data-value": string, "data-disabled": "" | undefined, "aria-disabled": boolean | undefined, onclick: () => void, onkeydown: (e: KeyboardEvent) => void }`
- `getGroup()`: `{ "data-kind": "menu", "data-slot": "group", role: "group", "aria-label": string }`

### meter
- `root`: `{ "data-kind": "meter", "data-slot": "root", id: string, role: "meter", "aria-valuenow": number, "aria-valuemin": number, "aria-valuemax": number, "aria-valuetext": string | undefined, "aria-label": string | undefined, "aria-labelledby": string | undefined, "data-state": "safe" | "caution" | "danger", "data-value": number, "data-max": number }`
- `track`: `{ "data-kind": "meter", "data-slot": "track", id: string, "data-state": "safe" | "caution" | "danger" }`
- `fill`: `{ "data-kind": "meter", "data-slot": "fill", id: string, "data-state": "safe" | "caution" | "danger", style: string }`
- `label`: `{ "data-kind": "meter", "data-slot": "label", id: string }`

### number-field
- `root`: `{ "data-kind": "number-field", "data-slot": "root", id: string, role: "group", "aria-label": string | undefined, "data-disabled": "" | undefined }`
- `input`: `{ "data-kind": "number-field", "data-slot": "input", id: string, role: "spinbutton", type: "text", inputmode: "numeric", value: number, "aria-valuenow": number, "aria-valuemin": number | undefined, "aria-valuemax": number | undefined, "aria-valuetext": string | undefined, "aria-disabled": "true" | undefined, "aria-readonly": true | undefined, "aria-required": true | undefined, "aria-describedby": string | undefined, disabled: true | undefined, readonly: true | undefined, "data-disabled": "" | undefined, oninput: (e: Event) => void, onkeydown: (e: KeyboardEvent) => void }`
- `increment`: `{ "data-kind": "number-field", "data-slot": "increment", id: string, type: "button", tabindex: -1, "aria-label": "Increase value", "aria-disabled": "true" | undefined, "data-disabled": "" | undefined, onclick: () => void }`
- `decrement`: `{ "data-kind": "number-field", "data-slot": "decrement", id: string, type: "button", tabindex: -1, "aria-label": "Decrease value", "aria-disabled": "true" | undefined, "data-disabled": "" | undefined, onclick: () => void }`

### popover
- `trigger`: `{ "data-kind": "popover", "data-slot": "trigger", type: "button", "aria-expanded": boolean, "aria-haspopup": "dialog", "aria-controls": string, "data-state": "open" | "closed", onclick: () => void }`
- `content`: `{ "data-kind": "popover", "data-slot": "content", id: string, role: "dialog", "data-state": "open" | "closed" }`
- `arrow`: `{ "data-kind": "popover", "data-slot": "arrow", "aria-hidden": "true" }`
- `close`: `{ "data-kind": "popover", "data-slot": "close", type: "button", onclick: () => void }`

### progress
- `root`: `{ "data-kind": "progress", "data-slot": "root", id: string, role: "progressbar", "aria-valuenow": number | undefined, "aria-valuemin": number, "aria-valuemax": number, "aria-valuetext": string | undefined, "aria-label": string | undefined, "aria-labelledby": string | undefined, "data-state": "indeterminate" | "loading" | "complete", "data-value": number | undefined, "data-max": number }`
- `track`: `{ "data-kind": "progress", "data-slot": "track", id: string, "data-state": "indeterminate" | "loading" | "complete" }`
- `fill`: `{ "data-kind": "progress", "data-slot": "fill", id: string, "data-state": "indeterminate" | "loading" | "complete", style: string | undefined }`
- `label`: `{ "data-kind": "progress", "data-slot": "label", id: string }`

### radio-group
- `root`: `{ "data-kind": "radio-group", "data-slot": "root", id: string, role: "radiogroup", "aria-orientation": "vertical" | "horizontal", "aria-label": string | undefined, "aria-labelledby": string | undefined, "aria-required": true | undefined, "aria-disabled": "true" | undefined, "data-orientation": "vertical" | "horizontal", "data-disabled": "" | undefined }`
- `getRadio()`: `{ "data-kind": "radio-group", "data-slot": "radio", role: "radio", id: string, tabindex: 0 | -1, "aria-checked": boolean, "aria-disabled": "true" | undefined, "aria-labelledby": string, "aria-describedby": string, "data-state": "checked" | "unchecked", "data-value": string, "data-disabled": "" | undefined, onclick: () => void, onkeydown: (e: KeyboardEvent) => void }`
- `getLabel()`: `{ "data-kind": "radio-group", "data-slot": "label", id: string, onclick: () => void }`
- `getDescription()`: `{ "data-kind": "radio-group", "data-slot": "description", id: string }`

### search-field
- `root`: `{ "data-kind": "search-field", "data-slot": "root", id: string, role: "search", "aria-label": string, "data-disabled": "" | undefined, "data-has-value": "" | undefined }`
- `input`: `{ "data-kind": "search-field", "data-slot": "input", id: string, role: "searchbox", type: "search", value: string, placeholder: string, disabled: true | undefined, "aria-label": string, "aria-describedby": string | undefined, "aria-disabled": "true" | "false", "data-disabled": "" | undefined, oninput: (e: Event) => void, onkeydown: (e: KeyboardEvent) => void }`
- `icon`: `{ "data-kind": "search-field", "data-slot": "icon", id: string, "aria-hidden": "true" }`
- `clear`: `{ "data-kind": "search-field", "data-slot": "clear", id: string, type: "button", tabindex: 0 | -1, "aria-label": "Clear search", "aria-disabled": "true" | "false", "data-disabled": "" | undefined, "data-visible": "" | undefined, onclick: () => void }`

### select
- `root`: `{ "data-kind": "select", "data-slot": "root" }`
- `trigger`: `{ "data-kind": "select", "data-slot": "trigger", id: string, role: "combobox", type: "button", tabindex: 0, "aria-expanded": boolean, "aria-haspopup": "listbox", "aria-activedescendant": string | undefined, "aria-controls": string, "aria-disabled": "true" | "false" | undefined, "aria-required": boolean | undefined, "aria-label": string | undefined, "aria-labelledby": string | undefined, "data-state": "open" | "closed", "data-disabled": "" | undefined, "data-placeholder": "" | undefined, onclick: () => void, onkeydown: (e: KeyboardEvent) => void }`
- `value`: `{ "data-kind": "select", "data-slot": "value" }`
- `listbox`: `{ "data-kind": "select", "data-slot": "listbox", id: string, role: "listbox" }`
- `label`: `{ "data-kind": "select", "data-slot": "label" }`
- `getOption()`: `{ "data-kind": "select", "data-slot": "option", id: string, role: "option", "aria-selected": boolean, "aria-disabled": boolean | undefined, "data-value": string, "data-state": "selected" | "unselected", "data-highlighted": "" | undefined, "data-disabled": "" | undefined, onclick: () => void, onpointerenter: () => void }`

### separator
- `root` (decorative): `{ "data-kind": "separator", "data-slot": "root", role: "none", "aria-hidden": "true", "data-orientation": "horizontal" | "vertical" }`
- `root` (semantic): `{ "data-kind": "separator", "data-slot": "root", role: "separator", "aria-orientation": "horizontal" | "vertical", "data-orientation": "horizontal" | "vertical" }`

### sheet
- `trigger`: `{ "data-kind": "sheet", "data-slot": "trigger", type: "button", "aria-haspopup": "dialog", "aria-expanded": boolean, "data-state": "open" | "closed", onclick: () => void }`
- `overlay`: `{ "data-kind": "sheet", "data-slot": "overlay", "aria-hidden": "true", popover: "manual", "data-state": "open" | "closed" }`
- `content`: `{ "data-kind": "sheet", "data-slot": "content", id: string, role: "dialog", "aria-modal": "true", "aria-labelledby": string, "aria-describedby": string, "data-state": "open" | "closed", "data-side": "top" | "right" | "bottom" | "left", onclose: () => void, oncancel: (e: Event) => void }`
- `title`: `{ "data-kind": "sheet", "data-slot": "title", id: string }`
- `description`: `{ "data-kind": "sheet", "data-slot": "description", id: string }`
- `close`: `{ "data-kind": "sheet", "data-slot": "close", type: "button", onclick: () => void }`

### slider
- `root`: `{ "data-kind": "slider", "data-slot": "root", id: string, "data-orientation": "horizontal" | "vertical", "data-disabled": "" | undefined }`
- `track`: `{ "data-kind": "slider", "data-slot": "track", id: string, "data-orientation": "horizontal" | "vertical", "data-disabled": "" | undefined }`
- `thumb`: `{ "data-kind": "slider", "data-slot": "thumb", id: string, role: "slider", tabindex: 0 | -1, "aria-valuenow": number, "aria-valuemin": number, "aria-valuemax": number, "aria-valuetext": string | undefined, "aria-orientation": "horizontal" | "vertical", "aria-disabled": "true" | "false", "aria-label": string | undefined, "aria-labelledby": string | undefined, "data-disabled": "" | undefined, style: string, onkeydown: (e: KeyboardEvent) => void, onpointerdown: (e: PointerEvent) => void }`
- `label`: `{ "data-kind": "slider", "data-slot": "label", id: string, "data-disabled": "" | undefined }`
- `output`: `{ "data-kind": "slider", "data-slot": "output", id: string, for: string, "aria-live": "off" }`

### switch
- `root`: `{ "data-kind": "switch", "data-slot": "root", id: string, role: "switch", type: "button", tabindex: 0, "aria-checked": boolean, "aria-disabled": "true" | "false", "aria-required": true | undefined, "aria-label": string | undefined, "aria-labelledby": string | undefined, "aria-describedby": string | undefined, "data-state": "checked" | "unchecked", "data-disabled": "" | undefined, onclick: () => void, onkeydown: (e: KeyboardEvent) => void }`
- `thumb`: `{ "data-kind": "switch", "data-slot": "thumb", "aria-hidden": "true", "data-state": "checked" | "unchecked" }`
- `label`: `{ "data-kind": "switch", "data-slot": "label", "data-disabled": "" | undefined, onclick: () => void }`

### table
- `root`: `{ "data-kind": "table", "data-slot": "root", id: string, role: "grid", "aria-label": string | undefined, "aria-rowcount": number | undefined, "aria-colcount": number | undefined, "aria-multiselectable": boolean | undefined }`
- `header`: `{ "data-kind": "table", "data-slot": "header", role: "rowgroup" }`
- `body`: `{ "data-kind": "table", "data-slot": "body", role: "rowgroup" }`
- `getRow()`: `{ "data-kind": "table", "data-slot": "row", role: "row", "aria-selected": boolean | undefined, "aria-disabled": boolean | undefined, "data-key": string, "data-selected": "" | undefined, "data-disabled": "" | undefined, onclick: () => void }`
- `getCell()`: `{ "data-kind": "table", "data-slot": "cell", role: "gridcell" }`
- `getColumnHeader()`: `{ "data-kind": "table", "data-slot": "column-header", role: "columnheader", "aria-sort": "ascending" | "descending" | undefined, "data-sort": "ascending" | "descending" | "none", onclick: () => void }`

### tabs
- `root`: `{ "data-kind": "tabs", "data-slot": "root", "data-orientation": "horizontal" | "vertical" }`
- `list`: `{ "data-kind": "tabs", "data-slot": "list", role: "tablist", "aria-orientation": "horizontal" | "vertical", "data-orientation": "horizontal" | "vertical" }`
- `getTrigger()`: `{ "data-kind": "tabs", "data-slot": "trigger", role: "tab", type: "button", id: string, "aria-selected": boolean, "aria-controls": string, tabindex: 0 | -1, "data-state": "active" | "inactive", "data-value": string, "data-disabled": "" | undefined, "aria-disabled": boolean | undefined, onclick: () => void, onkeydown: (e: KeyboardEvent) => void }`
- `getContent()`: `{ "data-kind": "tabs", "data-slot": "content", role: "tabpanel", id: string, "aria-labelledby": string, tabindex: 0, hidden: true | undefined, "data-state": "visible" | "hidden" }`

### tag-group
- `root`: `{ "data-kind": "tag-group", "data-slot": "root", id: string, role: "grid", "aria-label": string | undefined, "data-disabled": "" | undefined }`
- `label`: `{ "data-kind": "tag-group", "data-slot": "label" }`
- `description`: `{ "data-kind": "tag-group", "data-slot": "description" }`
- `getTag()`: `{ "data-kind": "tag-group", "data-slot": "tag", role: "row", tabindex: 0, "data-value": string, "data-disabled": "" | undefined, onkeydown: (e: KeyboardEvent) => void }`
- `getRemove()`: `{ "data-kind": "tag-group", "data-slot": "remove", type: "button", tabindex: -1, "aria-label": string, "aria-disabled": boolean | undefined, "data-disabled": "" | undefined, onclick: () => void }`

### text-field
- `root`: `{ "data-kind": "text-field", "data-slot": "root", id: string, "data-disabled": "" | undefined, "data-invalid": "" | undefined }`
- `input`: `{ "data-kind": "text-field", "data-slot": "input", id: string, type: "text" | "email" | "password" | "url" | "tel", value: string, placeholder: string | undefined, disabled: true | undefined, readonly: true | undefined, required: true | undefined, "aria-invalid": true | undefined, "aria-required": true | undefined, "aria-disabled": true | undefined, "aria-readonly": true | undefined, "aria-label": string | undefined, "aria-labelledby": string, "aria-describedby": string | undefined, "aria-errormessage": string | undefined, "data-disabled": "" | undefined, "data-readonly": "" | undefined, "data-invalid": "" | undefined, oninput: (e: Event) => void }`
- `label`: `{ "data-kind": "text-field", "data-slot": "label", id: string, for: string, "data-disabled": "" | undefined }`
- `description`: `{ "data-kind": "text-field", "data-slot": "description", id: string }`
- `error`: `{ "data-kind": "text-field", "data-slot": "error", id: string, role: "alert", "aria-live": "polite", "data-invalid": "" | undefined }`

### toggle
- `root`: `{ "data-kind": "toggle", "data-slot": "root", id: string, type: "button", role: "button", "aria-pressed": boolean, "aria-disabled": true | undefined, "aria-label": string | undefined, "data-state": "on" | "off", "data-disabled": "" | undefined, onclick: (e: MouseEvent) => void, onkeydown: (e: KeyboardEvent) => void }`

### toolbar
- `root`: `{ "data-kind": "toolbar", "data-slot": "root", id: string, role: "toolbar", "aria-orientation": "horizontal" | "vertical", "aria-label": string | undefined, "data-orientation": "horizontal" | "vertical", "data-disabled": "" | undefined }`
- `getItem()`: `{ "data-kind": "toolbar", "data-slot": "item", tabindex: 0 | -1, "data-value": string, "data-disabled": "" | undefined, "aria-disabled": true | undefined, onkeydown: (e: KeyboardEvent) => void }`

### tooltip
- `trigger`: `{ "data-kind": "tooltip", "data-slot": "trigger", "aria-describedby": string | undefined, onpointerenter: () => void, onpointerleave: () => void, onfocus: () => void, onblur: () => void, onkeydown: (e: KeyboardEvent) => void }`
- `content`: `{ "data-kind": "tooltip", "data-slot": "content", id: string, role: "tooltip", "data-state": "open" | "closed" }`

### tree
- `root`: `{ "data-kind": "tree", "data-slot": "root", id: string, role: "tree", "aria-label": string | undefined, "aria-disabled": true | undefined, onkeydown: (e: KeyboardEvent) => void }`
- `getItem()`: `{ "data-kind": "tree", "data-slot": "item", role: "treeitem", tabindex: 0, "aria-expanded": boolean | undefined, "aria-selected": boolean, "aria-level": number, "aria-disabled": boolean | undefined, "data-key": string, "data-has-children": "" | undefined, "data-expanded": "" | undefined, "data-selected": "" | undefined, "data-disabled": "" | undefined, onclick: () => void }`
- `getGroup()`: `{ "data-kind": "tree", "data-slot": "group", role: "group" }`

### Interaction Utilities

#### focus
- `focusProps`: `{ onfocus: (e: FocusEvent) => void, onblur: (e: FocusEvent) => void }`

#### focus-ring
- `focusRingProps`: `{ onfocus: (e: FocusEvent) => void, onblur: (e: FocusEvent) => void, "data-focus-visible": "" | undefined, autofocus: boolean | undefined }`

#### focus-within
- `focusWithinProps`: `{ onfocusin: (e: FocusEvent) => void, onfocusout: (e: FocusEvent) => void }`

#### hover
- `hoverProps`: `{ onpointerenter: (e: PointerEvent) => void, onpointerleave: (e: PointerEvent) => void }`

#### keyboard-handler
- `keyboardProps`: `{ onkeydown: ((e: KeyboardEvent) => void) | undefined, onkeyup: ((e: KeyboardEvent) => void) | undefined }`

#### long-press
- `longPressProps`: `{ onpointerdown: (e: PointerEvent) => void, onpointerup: (e: PointerEvent) => void, onpointercancel: () => void, onpointerleave: () => void }`

#### move
- `moveProps`: `{ onpointerdown: (e: PointerEvent) => void, onkeydown: (e: KeyboardEvent) => void, tabindex: 0 }`

#### press
- `pressProps`: `{ onpointerdown: (e: PointerEvent) => void, onpointerup: (e: PointerEvent) => void, onpointercancel: () => void, onpointerleave: () => void }`

---

## Anti-Pattern Risks

1. **Over-generalization**: Don't create a generic `SlotAttrs<Kind, Slot>` that tries to compute attrs from anatomy + a11y spec. Each slot's attrs are hand-authored in the hook — type them directly.
2. **Drift**: Typed interfaces must match hook implementations exactly. If a hook changes, the type must change. No runtime validation gap.
3. **Bandaid unions**: Don't union `Record<string, unknown>` with the typed interface as a "migration path". Replace directly — pre-release mode.
4. **Event handler generics**: Don't over-abstract `onclick: (e: MouseEvent) => void` vs `onclick: () => void`. Some hooks pass the event, some don't. Type exactly what the hook returns.

---

## Recommendations

See sprint document for full plan.

## Files Referenced
- `_internal/types/common.ts`: Current `SlotAttrs` alias
- `schema/anatomy.schema.ts`: `createAnatomy()` generates base data attrs
- `schema/a11y.schema.ts`: A11ySpec contract
- `_internal/utils/data-attr.ts`: Helper return types
- All 44 `primitives/{kind}/use-{kind}.svelte.ts`: Source of truth for actual attrs
- All 44 `primitives/{kind}/{kind}.types.ts`: Files to modify
- All 44 `primitives/{kind}/{kind}.anatomy.ts`: Anatomy part lists
