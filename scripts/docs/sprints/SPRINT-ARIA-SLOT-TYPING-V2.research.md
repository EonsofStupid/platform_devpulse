# Research: ARIA-Aligned Slot Typing V2 — Derived from SSOT

**Date**: 2026-03-20
**Sprint**: SPRINT-ARIA-SLOT-TYPING-V2
**Status**: COMPLETE
**Supersedes**: SPRINT-ARIA-SLOT-TYPING (hand-authored interfaces — WRONG approach)

---

## SSOT Map

### What Svelte Provides (DOM spec SSOT for element attrs)

`svelte/elements` exports typed interfaces for EVERY HTML element. Inheritance chain:

```
AriaAttributes                     ← ALL ARIA attrs (aria-*, 50+ properties)
  └── DOMAttributes<T>             ← ALL event handlers (onclick, onkeydown, etc.)
       └── HTMLAttributes<T>       ← Standard HTML (id, class, role, tabindex, hidden, style, etc.)
            └── HTMLButtonAttributes    ← Button-specific (type, disabled, form*, etc.)
            └── HTMLDialogAttributes    ← Dialog-specific (open, closedby)
            └── HTMLInputAttributes     ← Input-specific (value, type, placeholder, etc.)
            └── HTMLLabelAttributes     ← Label-specific (for)
            └── HTMLOutputAttributes    ← Output-specific (for, form, name)
            └── HTMLMeterAttributes     ← Meter-specific (value, min, max, low, high, optimum)
            └── HTMLProgressAttributes  ← Progress-specific (max, value)
            └── HTMLSelectAttributes    ← Select-specific (multiple, size, etc.)
            └── HTMLTextareaAttributes  ← Textarea-specific (rows, cols, etc.)
```

**Key**: These types already include ALL ARIA attributes, ALL event handlers, role, tabindex, id, hidden, style, class. We don't need to hand-author any of this.

### What ColdLight Adds (on top of native)

ColdLight adds only:
- `data-kind` — which primitive kind (string literal)
- `data-slot` — which part (string literal)
- `data-state` — optional state token
- `data-disabled` — optional disabled flag
- Additional `data-*` attrs per kind (data-value, data-orientation, data-channel, etc.)

### Current State (what needs to change)

| File | Current | Target |
|------|---------|--------|
| `schema/anatomy.schema.ts` | Parts as string list, no element type | Parts as map: name → element type |
| `_internal/types/common.ts` | `SlotAttrs = Record<string, unknown>`, `ColdLightDataAttrs` | Derived SlotAttrs type utility |
| 44 `*.types.ts` files | Hand-authored interfaces (WRONG) | Derived from anatomy element map |
| 44 `*.anatomy.ts` files | `createAnatomy(kind, [parts])` | `createAnatomy(kind, { part: element })` |

---

## Question/Goal

Make anatomy the SSOT for slot types. Each slot declares its target HTML element. The slot attrs type is DERIVED as: `NativeElementAttrs & ColdLightSlotAttrs<Kind, Slot>`. Zero hand-authored ARIA — it comes from `svelte/elements`.

---

## How React Aria Does It

React Aria hooks return **native DOM attribute types** per slot:

```typescript
// useButton returns:
{ buttonProps: ButtonHTMLAttributes<HTMLButtonElement>, isPressed: boolean }

// useCheckbox returns:
{ inputProps: InputHTMLAttributes<HTMLInputElement>, labelProps: LabelHTMLAttributes<HTMLLabelElement> }

// useDialog returns:
{ dialogProps: HTMLAttributes<HTMLElement>, titleProps: HTMLAttributes<HTMLElement> }
```

**Pattern**: Each slot's return type IS the native element's attribute interface. The hook narrows what it actually sets, but the TYPE allows anything valid for that element. This means:
- No hand-authored ARIA types (comes from the DOM spec via React's type defs)
- No drift — if the DOM spec adds new attrs, the types update automatically
- IDE autocomplete shows ALL valid attrs for that element
- Type-safe spreading guaranteed by the compiler

---

## Svelte 5 Equivalent

Svelte provides the same via `svelte/elements`:

```typescript
import type {
  HTMLButtonAttributes,
  HTMLAttributes,
  HTMLDialogAttributes,
  HTMLInputAttributes,
  HTMLLabelAttributes,
  HTMLOutputAttributes,
  HTMLMeterAttributes,
  HTMLProgressAttributes,
} from "svelte/elements";
```

Each extends `HTMLAttributes<T>` which extends `AriaAttributes` + `DOMAttributes<T>`.

---

## Proposed Architecture

### 1. Element map type

```typescript
// Map of HTML element tag → Svelte attribute type
type ElementAttrMap = {
  button: HTMLButtonAttributes;
  div: HTMLAttributes<HTMLDivElement>;
  span: HTMLAttributes<HTMLSpanElement>;
  dialog: HTMLDialogAttributes;
  input: HTMLInputAttributes;
  label: HTMLLabelAttributes;
  output: HTMLOutputAttributes;
  nav: HTMLAttributes<HTMLElement>;
  ol: HTMLAttributes<HTMLOListElement>;
  li: HTMLAttributes<HTMLLIElement>;
  meter: HTMLMeterAttributes;
  // ... every element ColdLight uses
};
```

### 2. Enriched anatomy

```typescript
// Current:
createAnatomy("button", ["root", "icon", "label"] as const);

// New:
createAnatomy("button", {
  root: "button",    // → HTMLButtonAttributes
  icon: "span",      // → HTMLAttributes<HTMLSpanElement>
  label: "span",     // → HTMLAttributes<HTMLSpanElement>
} as const);
```

### 3. Derived slot attr type

```typescript
// ColdLight data attrs narrowed per slot
type ColdLightSlotData<K extends string, S extends string> = {
  "data-kind": K;
  "data-slot": S;
  "data-state"?: string;
  "data-disabled"?: "" | undefined;
};

// The derived type: native element attrs + ColdLight data
type SlotAttrs<K extends string, S extends string, E extends keyof ElementAttrMap> =
  ElementAttrMap[E] & ColdLightSlotData<K, S>;

// Usage in hooks:
// buttonAnatomy.attrs.root → SlotAttrs<"button", "root", "button">
// = HTMLButtonAttributes & { "data-kind": "button"; "data-slot": "root"; ... }
```

### 4. Per-kind types file (MINIMAL)

```typescript
// button.types.ts — NO hand-authored ARIA interfaces
import type { ButtonSlotAttrs } from "./button.anatomy.js";

export interface UseButtonProps { ... }

export interface UseButtonReturn {
  readonly root: ButtonSlotAttrs["root"];  // derived from anatomy
  readonly pressed: boolean | undefined;
  readonly isDisabled: boolean;
  press(): void;
  unpress(): void;
  toggle(): void;
}
```

---

## What This Eliminates

- 130 hand-authored slot attr interfaces → DELETED
- Manual `aria-disabled`, `aria-expanded`, etc. type definitions → comes from `svelte/elements`
- Manual event handler types → comes from `DOMAttributes`
- Drift between hook implementation and type declaration → both derive from same source
- The entire previous sprint's output

---

## Anti-Pattern Risks

1. **Over-restricting**: If we intersect native attrs with ONLY the specific ColdLight data attrs, consumers can still pass any valid HTML/ARIA attr. This is correct — the hook sets specific ones, but `{...button.root}` should accept anything the target element accepts.

2. **Under-restricting**: If we just use `HTMLButtonAttributes` without ColdLight data attrs, we lose type safety on `data-kind`, `data-slot`. The intersection gives us both.

3. **Forgetting data-* attrs**: Custom data attrs (`data-value`, `data-orientation`, etc.) aren't in native types. These need to be declared per-kind. But there are only a handful per kind, not 15+ ARIA attrs.

---

## Files to Modify

| File | Action |
|------|--------|
| `schema/anatomy.schema.ts` | Rewrite: parts become element-typed map |
| `_internal/types/common.ts` | Rewrite: derive SlotAttrs from anatomy |
| 44 `*.anatomy.ts` | Update: add element type per part |
| 44 `*.types.ts` | Rewrite: use derived types, delete hand-authored interfaces |
| `_internal/utils/data-attr.ts` | Keep overload (already done) |

---

## Files Referenced

- `svelte/elements.d.ts` — Native HTML attr types (AriaAttributes, HTMLButtonAttributes, etc.)
- `schema/anatomy.schema.ts` — Current anatomy schema
- `schema/a11y.schema.ts` — A11y spec declarations
- `_internal/types/common.ts` — Current SlotAttrs/ColdLightDataAttrs
- All 44 `primitives/{kind}/{kind}.anatomy.ts` — Need element type per part
- All 44 `primitives/{kind}/{kind}.types.ts` — Need derived types
