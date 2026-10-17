# SPRINT: Component Alignment to Primitives

**Date**: 2026-03-28
**Status**: DRAFT — Owner approval required
**Prerequisite**: SPRINT-PRIMITIVES-ENTERPRISE (COMPLETE — 64 primitives authored)
**Blocks**: Route wiring, VPB integration, dashboard rendering

---

## Problem

91 component folders exist. Zero import from primitives. The anatomy contracts
we authored are invisible to the component layer. Components independently
re-declare HTML attrs, re-omit "style", and don't spread anatomy slot attrs.

## What's RIGHT (do NOT change)

1. `.svelte` files use `behaviors/` hooks — CORRECT
2. `.svelte` files use `resolveMacro` + `cssVarString` — CORRECT (Macro Law)
3. `.svelte` files spread `hook.root` etc. — CORRECT
4. `@defaults` annotations in HTML comments — CORRECT (scanner SSOT)
5. `preset` prop (not intent) — CORRECT

## What needs to change

### 1. Component types extend primitive types

**Before (button.types.ts):**
```typescript
import type { HTMLButtonAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export interface ButtonProps
  extends ComponentProps,
    Omit<HTMLButtonAttributes, "style" | "children" | "class" | "disabled" | "type"> {
  preset?: ButtonPreset;
  size?: ButtonSize;
  disabled?: boolean;
  ...
}
```

**After:**
```typescript
import type { ButtonPrimitiveProps } from "$lib/design/primitives/button/index.js";

export interface ButtonProps extends ButtonPrimitiveProps {
  /** Visual preset — selects style configuration. Default: "primary" */
  preset?: ButtonPreset;
  /** Size — structural class. Default: "md" */
  size?: ButtonSize;
}
```

**Why:** The primitive type already includes:
- Correct HTML attrs (HTMLButtonAttributes)
- Omit<..., "children"> (only children, NOT style)
- children?: Snippet
- class?: string
- All structural props (disabled, loading, pressed, onPressedChange, expanded, type)

The component type ONLY adds:
- `preset` (visual — Macro Law)
- `size` (structural sizing class)
- Any component-specific props not in the primitive

### 2. Component .svelte files spread anatomy attrs

**Before:**
```svelte
<button {...button.root} {...rest} {...m.dataAttrs} style={cssVarString(m.cssVars)}>
```

**After:**
```svelte
<button
  {...buttonAnatomy.attrs.root}
  {...button.root}
  {...rest}
  {...m.dataAttrs}
  style={cssVarString(m.cssVars)}
>
```

**Why:** Anatomy attrs add `data-kind` and `data-slot` which:
- Glue CSS targets via `[data-kind="button"][data-slot="root"]`
- VPB identifies components structurally
- Preflight validates correct slot usage
- The behavior hook may override some attrs (that's fine — spread order matters)

### 3. Delete _base deprecated aliases

**File:** `components/_base/types.ts`

Delete:
- `ComponentProps` alias (use `UIBaseProps`)
- `ComponentCategory` alias (use `UICategory`)

Update all consumers to use `UIBaseProps` directly — or better, extend the
primitive type instead (which already includes children + class).

### 4. Remove "style" from all component type Omit patterns

Every component types file that has `Omit<..., "style" | ...>` needs "style" removed.
Components should NOT omit style — users may need inline styles for edge cases.

---

## Gold Standard Component Pattern

```typescript
// button.types.ts
import type { ButtonPrimitiveProps } from "$lib/design/primitives/button/index.js";

export type ButtonPreset = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

/**
 * Button component props.
 *
 * Extends ButtonPrimitiveProps (structural + behavioral) with visual
 * preset and size. All other props (disabled, loading, pressed, type,
 * class, children) come from the primitive.
 */
export interface ButtonProps extends ButtonPrimitiveProps {
  /** Visual preset — selects style configuration. Default: "primary" */
  preset?: ButtonPreset;
  /** Size class. Default: "md" */
  size?: ButtonSize;
}
```

```svelte
<!-- Button.svelte -->
<script lang="ts">
import { buttonAnatomy } from "$lib/design/primitives/button/index.js";
import { useButton } from "$lib/design/behaviors/button/index.js";
import { cssVarString, resolveMacro } from "$lib/design/style-macro";
import { cn } from "$lib/design/utils/cn.js";
import type { ButtonProps, ButtonSize } from "./button.types.js";

const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};

let {
  preset = "primary",
  size = "md",
  disabled = false,
  loading = false,
  pressed,
  onPressedChange,
  expanded,
  type,
  children,
  class: className,
  ...rest
}: ButtonProps = $props();

const button = $derived(useButton({ disabled, loading, pressed, onPressedChange, expanded, type }));
const m = $derived(resolveMacro({ kind: "button", preset }));
</script>

<button
  {...buttonAnatomy.attrs.root}
  {...button.root}
  {...rest}
  {...m.dataAttrs}
  style={cssVarString(m.cssVars)}
  class={cn(
    "inline-flex items-center justify-center font-medium cursor-pointer select-none",
    "focus-visible:outline-2 focus-visible:outline-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    SIZE[size] ?? SIZE.md,
    className)}
>
  {@render children?.()}
</button>
```

**Spread order matters:**
1. `anatomy.attrs.root` — base data-kind + data-slot
2. `button.root` — behavior attrs (aria-*, data-state)
3. `...rest` — user overrides
4. `m.dataAttrs` — style-macro data attrs
5. `style={cssVarString(m.cssVars)}` — style-macro CSS vars

---

## Execution Plan

### Phase 1: Reference component (Button)
Rewrite button types + .svelte to gold standard. Verify it compiles and renders.
This proves the pattern works before touching 90 more.

### Phase 2: _base cleanup
- Delete `ComponentProps` alias → `UIBaseProps` only
- Delete `ComponentCategory` alias → `UICategory` only
- Find and update all consumers

### Phase 3: Batch alignment (5 at a time, by family)

**Interactive family (most used):**
1. button, checkbox, switch, toggle, toggle-group
2. link, badge, separator, label, heading

**Disclosure family:**
3. dialog, alert-dialog, sheet, popover, tooltip
4. accordion, collapsible, tabs, menu, combobox

**Field family:**
5. text-field, textarea, number-field, search-field, color-field
6. select, color-slider, slider, radio-group, field

**Data family:**
7. table, data-table, tree, listbox, grid-list

**Feedback family:**
8. progress, meter, spinner, skeleton, loading-overlay
9. toaster, empty-state, banner, alert, inline-message

**Navigation family:**
10. breadcrumbs, pagination, steps, sidebar, toolbar

**Structural family:**
11. form, form-field, input-group, tag-group, notification-center
12. scroll-area, kbd, list, description-list, skip-link

**Display family:**
13. text, prose, table-of-contents, code, card

**Domain/composition (types only — no primitive):**
14-18. Remaining ~30 components that compose from existing primitives

### Phase 4: Final gate
- svelte-check: 0 errors
- Every component imports from its matching primitive
- Every component .svelte spreads anatomy attrs
- No `"style"` in any Omit
- No `ComponentProps` references (all UIBaseProps or primitive types)

---

## CHECKLIST (per component)

- [ ] `types.ts` extends `{Kind}PrimitiveProps` from primitive
- [ ] `types.ts` does NOT independently extend HTML attrs
- [ ] `types.ts` does NOT omit "style"
- [ ] `types.ts` does NOT import `ComponentProps` from `_base`
- [ ] `types.ts` only adds visual props (preset, size) and component-specific props
- [ ] `.svelte` imports `{kind}Anatomy` from primitive
- [ ] `.svelte` spreads `{kind}Anatomy.attrs.{slot}` on correct DOM elements
- [ ] `.svelte` spread order: anatomy → behavior → rest → macro
- [ ] svelte-check passes after each component

---

## STOP — Owner Decision Required

**Do you want me to:**
1. Execute Phase 1 (Button reference) now to prove the pattern?
2. Review/adjust the batch order first?
3. Adjust the gold standard pattern?
