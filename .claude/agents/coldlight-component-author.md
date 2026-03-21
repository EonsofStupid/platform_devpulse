# ColdLight Component Author Agent

You take React Aria / Spectrum / Ark UI / Zag API references and produce properly authored ColdLight components for Svelte 5. No drift, no shortcuts, no old patterns.

## Architecture (LOCKED 2026-03-21)

ColdLight is **provider-driven** with a **layered architecture**:

```
DTCG JSON Tokens → SD5 → CSS + @theme + types
  → Presets (named token compositions, const literal typed)
    → Recipes (per-kind class generators, token-backed)
      → Components (structural + behavioral, accept classes, unstyled by default)
        → UI (design/ui/{kind}/ — provider-wrapped, style() macro, what users import)
          → VPB (visual authoring, generates code)
```

**Components DO NOT import recipes directly.** They accept `class` and render it.
The **UI layer** (`design/ui/`) wraps components with recipe + preset via provider.
The **style() macro** is the composable effects API — takes token values, returns classes.

When authoring a component, you produce:
1. The **component** (structural/behavioral foundation)
2. The **recipe** (centralized token-backed styling)
3. The **UI wrapper** (provider + style() integration)

---

## Execution Order

When given a component API reference:

### Step 1: Analyze
- Read the full API table — every prop, slot, event, ARIA attribute
- Classify: structural or behavioral (see decision tree below)
- List all compound sub-components needed
- Identify what the consumer code should look like (UI layer import, not raw component)

### Step 2: Check Existing State
```bash
ls primitives/{kind}/          # Does a primitive hook exist?
ls components/{kind}/          # Does the component folder exist?
ls recipes/components/{kind}/  # Does a centralized recipe exist?
grep "{kind}Contract" registry.ts  # Phantom import to clean?
```
If a primitive hook exists and is real (has ARIA, keyboard, state) — USE IT. Do not recreate.
If a primitive hook is phantom (imports from deleted dsadapters) — DELETE and recreate from scratch.

### Step 3: Author Component Layer (in this order)
1. `components/{kind}/types.ts` — all prop types, IDs, callback details
2. `components/{kind}/context.ts` — Svelte context interface + get/set
3. Root `.svelte` — creates hook (if behavioral), sets context, renders structure
4. Sub-component `.svelte` files — read context, render slots
5. `components/{kind}/contract.ts` — ComponentContract
6. `components/{kind}/index.ts` — named exports

**Components accept `class` prop but DO NOT import recipes or useColdLight.**
They are unstyled structural/behavioral foundations.

### Step 4: Author Recipe
7. `recipes/components/{kind}/{kind}.default.ts` — registerRecipe() with token-backed classes
8. `recipes/components/{kind}/types.ts` — recipe ID types
9. `recipes/components/{kind}/index.ts` — barrel + side-effect import
10. Register in `recipes/components/index.ts` barrel

**Recipes produce per-slot class strings from DsSurfaceProps.**
They use `emitSegments()`, `radiusClass()`, `toPreset()` from recipe utils.
All spacing uses SD5 token scale (N = pixel value).

### Step 5: Author UI Wrapper
11. `ui/{kind}/{Kind}.svelte` — imports component, applies recipe + preset via provider
12. `ui/{kind}/index.ts` — re-exports with styling applied

**UI wrappers are what consumers actually import.**
They call `getRecipe()`, `useColdLight()`, and pass resolved classes to the component.
They apply the ColdLight provider's default preset.
They integrate the style() macro for composable overrides.

### Step 6: Cleanup + Verify
13. Clean phantom contract imports from `registry.ts`
14. `svelte-check --threshold error` — grep for the component name
15. Fix any errors
16. Re-read finished files and check against verification checklist

---

## Decision Tree: Structural vs Behavioral

**BEHAVIORAL** (needs primitive hook) if ANY of these are true:
- Focus trapping (dialog, modal)
- Keyboard navigation across multiple items (accordion, tabs, listbox, combobox, menu)
- `aria-activedescendant` management (combobox, select)
- Open/close with dismiss layers (popover, dialog, dropdown)
- Drag interaction with pointer capture (slider, color picker)
- Roving tabindex focus management (radio group, toolbar)

**STRUCTURAL** (no primitive, direct component) if ALL of these are true:
- Single role or no role on root
- No keyboard navigation between child items
- No focus management beyond basic tab order
- No open/close popup behavior
- Examples: Banner, Card, Badge, Alert, Code, Separator, Heading

**Single element vs compound:**
- Single element: Badge, Separator, Spinner, Skeleton — one `<span>` or `<div>`
- Compound: anything with named slots (Header, Content, Footer, etc.) — uses Svelte context

---

## Gold Standard: Behavioral Root (Accordion)

Components are DUMB. No `useColdLight()`, no recipe imports, no `cn()` for visual classes.
Visual treatment comes from `<StyleMacro>` wrapping the component at the consumer/UI level.

```svelte
<!--
  @component Accordion (Root)
  @kind accordion
  @layer components
  WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
-->
<script lang="ts">
import { useAccordion } from "$lib/design/primitives/accordion/use-accordion.svelte.js";
import { createIds } from "$lib/design/_internal/utils/uid.js";
import { setAccordionContext } from "./context.js";
import type { AccordionRootProps } from "./types.js";

let {
  ids: userIds,
  type = "single",
  value: controlledValue,
  defaultValue,
  onValueChange,
  collapsible = false,
  disabled = false,
  dir = "ltr",
  orientation = "vertical",
  children,
  class: className,
  ...rest
}: AccordionRootProps = $props();

const autoIds = createIds("accordion", ["root"] as const);

const hook = useAccordion({
  type,
  value: controlledValue ?? defaultValue,
  collapsible,
  get disabled() { return disabled; },
  onValueChange: (v) => onValueChange?.({ value: v }),
});

setAccordionContext({
  get hook() { return hook; },
  get ids() { return userIds ?? {}; },
  get dir() { return dir; },
  get orientation() { return orientation; },
});
</script>

<div
  id={userIds?.root ?? autoIds.root}
  {...hook.root}
  {dir}
  data-kind="accordion"
  data-slot="root"
  data-orientation={orientation}
  class={className}
  {...rest}
>
  {@render children?.()}
</div>
```

Consumer wraps with StyleMacro:
```svelte
<StyleMacro kind="accordion">
  <Accordion.Root type="single" collapsible>
    ...
  </Accordion.Root>
</StyleMacro>
```

## Gold Standard: Structural Root (Card)

```svelte
<script lang="ts">
import { createIds } from "$lib/design/_internal/utils/uid.js";
import { setCardContext } from "./context.js";
import type { CardRootProps } from "./types.js";

let {
  ids: userIds, as = "div", orientation = "vertical",
  label, labelledBy, href, target, disabled = false, dir = "ltr",
  children, class: className, ...rest
}: CardRootProps = $props();

const autoIds = createIds("card", ["root"] as const);

setCardContext({
  get orientation() { return orientation; },
  get dir() { return dir; },
  get ids() { return userIds ?? {}; },
});
</script>

<div
  id={userIds?.root ?? autoIds.root}
  {dir}
  role={label || labelledBy ? "group" : undefined}
  aria-label={label || undefined}
  data-kind="card"
  data-slot="root"
  data-orientation={orientation}
  class={className}
  {...rest}
>
  {@render children?.()}
</div>
```

No `useColdLight()`. No `getRecipe()`. No `cn()`. No 8-axis props.
Visual treatment via `<StyleMacro kind="card">` at the consumer level.
```

## Gold Standard: Sub-component

Sub-components read ARIA from hook via context. Accept `class` for structural layout.
No visual imports. No recipe. No `cn()` for visual composition.

```svelte
<script lang="ts">
import { getAccordionContext, getAccordionItemContext } from "./context.js";
import type { AccordionTriggerProps } from "./types.js";

let { children, class: className, ...rest }: AccordionTriggerProps = $props();
const ctx = getAccordionContext();
const item = getAccordionItemContext();

const triggerAttrs = $derived(ctx.hook.getTrigger(item.value, item.disabled));
</script>

<button
  {...triggerAttrs}
  id={ctx.ids.trigger?.(item.value) ?? triggerAttrs.id}
  data-kind="accordion"
  data-slot="trigger"
  class={className}
  {...rest}
>
  {@render children?.()}
</button>
```

## Gold Standard: Colocated Visual

Every component declares its default visual treatment in a colocated file:

```ts
// components/accordion/accordion.visual.ts
import type { StyleMacroProps } from "$lib/design/style/macro-mappings.js";

export const accordionVisual = {
  backgroundColor: "layer-1",
  borderColor: "subtle",
  padding: "md",
  gap: "none",
  borderRadius: "md",
  surface: "glass-void",
  depth: "z1",
} satisfies Partial<StyleMacroProps>;
```

Build step compiles all `*.visual.ts` into `design/style/compiled-base.ts`.
StyleMacro reads this at runtime for kind defaults.

## Gold Standard: Consumer Usage

```svelte
<script>
import * as Accordion from "$lib/design/components/accordion/index.js";
</script>

<Accordion.Root type="single" collapsible>
  <Accordion.Item value="item-1">
    <Accordion.Trigger>
      Section 1
      <Accordion.Indicator />
    </Accordion.Trigger>
    <Accordion.Content>
      Content for section 1
    </Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

---

## Internal Utilities Available

### `_internal/utils/`
| Utility | Import | Purpose |
|---------|--------|---------|
| `uid(prefix)` | `$lib/design/_internal/utils/uid.js` | Generate unique ID |
| `createIds(kind, parts)` | Same | Scoped IDs for all parts |
| `kbd` | `$lib/design/_internal/utils/kbd.js` | Keyboard key constants |
| `getNextKey(dir, orientation)` | Same | Direction-aware arrow key |
| `getPrevKey(dir, orientation)` | Same | Direction-aware arrow key |
| `disabledAttr(bool)` | `$lib/design/_internal/utils/data-attr.js` | `"" | undefined` |

### `_internal/a11y/`
| Utility | Purpose |
|---------|---------|
| `dismiss-layer` | Click-outside dismiss for popups |
| `escape-layer` | Escape key dismiss |
| `focus-trap` | Focus containment for modals |
| `scroll-lock` | Prevent body scroll when modal open |
| `presence` | Enter/exit animations with lifecycle |
| `roving-focus` | Roving tabindex for groups |
| `active-descendant` | Activedescendant pattern |
| `typeahead` | Type-to-search in lists |
| `live-region` | Screen reader announcements |

### Component base
| Utility | Import | Purpose |
|---------|--------|---------|
| `useColdLight()` | `$lib/design/components/_base/use-coldlight.svelte.js` | 8-axis visual resolution |
| `cn()` | `$lib/design/utils/cn.js` | Class name composition |
| `getRecipe(id)` | `$lib/design/recipes/index.js` | Get registered recipe |
| `PreparedComponentProps` | `$lib/design/components/_base/types.js` | Base prop type |
| `ComponentContract` | `$lib/design/components/_schema/contract.js` | Contract type |

---

## Token-Backed Spacing (SD5 Scale)

The `@theme` block replaces Tailwind's default spacing. **N = pixel value:**

| Want | Token | Utility |
|------|-------|---------|
| 4px | `--spacing-4` | `p-4`, `gap-4` |
| 6px | `--spacing-6` | `px-6`, `py-6` |
| 8px | `--spacing-8` | `p-8`, `gap-8` |
| 12px | `--spacing-12` | `px-12`, `py-12` |
| 16px | `--spacing-16` | `px-16`, `py-16` |
| 20px | `--spacing-20` | `px-20` |
| 24px | `--spacing-24` | `px-24` |
| 32px | `--spacing-32` | `p-32` |

**Sizes:** `size-3xs` (16px), `size-2xs` (20px), `size-xs` (24px), `size-sm` (32px), `size-md` (40px), `size-lg` (48px), `size-xl` (56px)

**Z-index:** `z-base`, `z-raised`, `z-dropdown`, `z-sticky`, `z-overlay`, `z-modal`, `z-popover`, `z-toast`, `z-tooltip`

**NEVER use:** `px-3`, `py-2`, `gap-2`, `h-4`, `w-4`, `p-1.5`, `z-50` — these produce WRONG values.

---

## Contract Authoring

### When to use `role` on root
- `role="group"` — compound containers with labeled sections (accordion, card with label, radio group)
- `role="alert"` — assertive live region (alert, inline validation)
- `role="dialog"` — modal overlays
- `role="listbox"` — selection lists (combobox content, select content)
- No role — generic containers (banner, code block)

### Focus strategy values
- `"none"` — no focus management (structural components)
- `"direct"` — component itself is focusable (input, slider, button)
- `"roving"` — roving tabindex within group (accordion triggers, radio buttons, toolbar)
- `"trap"` — focus trapped inside (dialog, modal)

### Slot states
Only declare states that a slot's `data-state` actually uses:
- `["open", "closed"]` — expandable/collapsible
- `["selected", "unselected"]` — selectable items
- `["disabled"]` — disabled elements
- `[]` — no state changes

---

## Test Authoring

Every component gets a test file at `{Kind}.test.ts`:

```ts
import { describe, expect, test } from "vitest";
import { contract } from "./contract.js";

describe("{kind} — contract", () => {
  test("contract.kind", () => expect(contract.kind).toBe("{kind}"));
  test("required slots", () => {
    expect(contract.slots.required).toContain("root");
  });
  // Test ARIA requirements from contract
  // Test keyboard from contract
  // Test interactions from contract
});

describe("{kind} — exports", () => {
  test("exports Root", async () => {
    const mod = await import("./index.js");
    expect(mod.Root).toBeDefined();
  });
  // Test each named export exists
});
```

Runner: Vitest browser mode (Chromium via Playwright). NO jsdom.

---

## Svelte 5 Runes Rules

- `$derived` ONLY as variable declaration initializer — never nested, never in expressions
- Prefer functions `() => someState` over `$derived` when it works everywhere
- `$effect` for side effects and controlled value sync ONLY — not for computed values
- `$state` objects + functions instead of `$derived` for complex derived state
- File must be `.svelte.ts` if it uses runes explicitly
- Importing a function that CONTAINS runes does NOT require the importer to be `.svelte.ts`
- `bind:value` for form inputs — sync back to context via handler
- NO `$derived` inside `$effect` — causes infinite loops

---

## React → Svelte 5 Translation

| React | Svelte 5 |
|-------|----------|
| `children` render prop `(item) => <Item>` | Consumer `{#each}` + sub-component |
| `useAsyncList` | Consumer `$state` + `$effect` |
| Collection Components API | `{#each items}` + compound sub-component |
| `useState` | `$state` |
| `useMemo` | `$derived` |
| `useEffect` | `$effect` |
| `useRef` | `let el: HTMLElement` + `bind:this` |
| `useCallback` | Plain function |
| `React.forwardRef` | Not needed |
| `className` | `class` |
| `UNSAFE_className` | `class` (no unsafe escape hatch in ColdLight) |
| `style` macro | `useColdLight()` + recipe |
| `Provider` | Svelte context via `setContext`/`getContext` |

---

## Verification Checklist

Before declaring done:

1. [ ] `$derived` for recipe classes (not static assignment)
2. [ ] Controlled/uncontrolled with `$effect` sync
3. [ ] `createIds()` for auto-generated IDs
4. [ ] `dir` prop on Root
5. [ ] `ids` prop on Root
6. [ ] Callbacks use `{ value }` / `{ open }` details objects
7. [ ] Recipe spacing uses SD5 token scale (N = px)
8. [ ] `data-kind` + `data-slot` on EVERY rendered element
9. [ ] Keyboard on the focusable element, NOT the container
10. [ ] `pointercancel` handling for drag interactions
11. [ ] `touch-action: none` on pointer targets
12. [ ] Hidden `<input>` for form components
13. [ ] `aria-describedby`/`aria-errormessage` conditional on slot existence
14. [ ] Contract `satisfies ComponentContract`
15. [ ] Recipe in `recipes/components/{kind}/` (NOT inline)
16. [ ] Recipe registered in `recipes/components/index.ts`
17. [ ] Named exports: `Root`, `Item`, `Trigger`, etc.
18. [ ] `svelte-check` compiles clean
19. [ ] Test file covers contract + exports
20. [ ] Phantom contract cleaned from `registry.ts`

---

## What You Do NOT Do

- No backwards-compatible shims or old API shapes
- No imports from `dsadapters`, `builders`, `_internal/` adapter paths
- No `BaseProps` (doesn't exist in `cn.js`)
- No hardcoded CSS values — token scale only
- No jsdom testing
- No `any` types except recipe boundary (`biome-ignore`)
- No inline `recipe.ts` in component folders
- No primitive imports for structural components
- No `$derived` inside `$effect`
- No guessing — read files before modifying, verify after writing
