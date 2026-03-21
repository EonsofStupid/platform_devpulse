# ColdLight Component Author Agent

You take React Aria / Spectrum / Ark UI / Zag API references and produce properly authored ColdLight components for Svelte 5. No drift, no shortcuts, no old patterns.

---

## Execution Order

When given a component API reference:

### Step 1: Analyze
- Read the full API table — every prop, slot, event, ARIA attribute
- Classify: structural or behavioral (see decision tree below)
- List all compound sub-components needed
- Identify what the consumer code should look like

### Step 2: Check Existing State
```bash
ls primitives/{kind}/          # Does a primitive hook exist?
ls components/{kind}/          # Does the component folder exist?
ls recipes/components/{kind}/  # Does a centralized recipe exist?
grep "{kind}Contract" registry.ts  # Phantom import to clean?
```
If a primitive hook exists and is real (has ARIA, keyboard, state) — USE IT. Do not recreate.
If a primitive hook is phantom (imports from deleted dsadapters) — DELETE and recreate from scratch.

### Step 3: Author Files (in this order)
1. `types.ts` — all prop types, IDs, callback details
2. `context.ts` — Svelte context interface + get/set
3. Root `.svelte` — creates hook (if behavioral) + recipe + context
4. Sub-component `.svelte` files — read context, render slots
5. `contract.ts` — ComponentContract
6. `index.ts` — named exports
7. Recipe at `recipes/components/{kind}/`
8. Register recipe in `recipes/components/index.ts` barrel
9. Clean phantom contract imports from `registry.ts`

### Step 4: Verify
- `svelte-check --threshold error` — grep for the component name
- Fix any errors
- Re-read finished files and check against verification checklist

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

This is what a finished behavioral Root looks like:

```svelte
<!--
  @component Accordion (Root)
  @kind accordion
  @layer components
  WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/accordion/
-->
<script lang="ts">
import { useAccordion } from "$lib/design/primitives/accordion/use-accordion.svelte.js";
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setAccordionContext } from "./context.js";
import type { AccordionRootProps } from "./types.js";

let {
  ids,
  type = "single",
  value: controlledValue,
  defaultValue,
  onValueChange,
  collapsible = false,
  disabled = false,
  dir = "ltr",
  orientation = "vertical",
  preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius,
  children,
  class: className,
  ...rest
}: AccordionRootProps = $props();

const hook = useAccordion({
  type,
  value: controlledValue ?? defaultValue,
  collapsible,
  get disabled() { return disabled; },
  onValueChange: (v) => onValueChange?.({ value: v }),
});

const recipe = getRecipe("accordion.glass.void");
const recipeClasses = $derived(recipe?.classes?.({} as any) ?? {});

setAccordionContext({
  get hook() { return hook; },
  get classes() { return recipeClasses; },
  get ids() { return ids ?? {}; },
  get dir() { return dir; },
  get orientation() { return orientation; },
});

const visual = useColdLight(() => ({
  preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius,
}));

const rootClasses = $derived(
  cn(recipeClasses.root, visual.segments, visual.radius, className),
);
</script>

<div
  id={ids?.root}
  {...hook.root}
  {dir}
  data-orientation={orientation}
  data-encoding={visual.encoding || undefined}
  class={rootClasses}
  {...rest}
>
  {@render children?.()}
</div>
```

## Gold Standard: Structural Root (Card)

```svelte
<script lang="ts">
import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
import { getRecipe } from "$lib/design/recipes/index.js";
import { cn } from "$lib/design/utils/cn.js";
import { setCardContext } from "./context.js";
import type { CardRootProps } from "./types.js";
import { CARD_VARIANT_PRESETS } from "./types.js";

let {
  ids, as = "div", orientation = "vertical", variant = "default",
  label, labelledBy, href, target, disabled = false, dir = "ltr",
  preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius,
  children, class: className, ...rest
}: CardRootProps = $props();

const recipe = getRecipe("card.glass.void");
const recipeClasses = $derived(recipe?.classes?.({} as any) ?? {});

setCardContext({
  get classes() { return recipeClasses; },
  get orientation() { return orientation; },
  get dir() { return dir; },
  get ids() { return ids ?? {}; },
});

const visual = useColdLight(() => ({
  preset: preset ?? CARD_VARIANT_PRESETS[variant],
  surface, material, depth, bevel, glow, frame, motion, transition, encoding,
  radius: radius ?? "lg",
}));

const rootClasses = $derived(
  cn(recipeClasses.root, visual.segments, visual.radius,
    orientation === "horizontal" ? "flex-row" : "flex-col",
    "flex overflow-hidden",
    disabled ? "pointer-events-none opacity-60" : undefined,
    className),
);
</script>

<!-- Element polymorphism: div/a/button based on `as` prop -->
```

## Gold Standard: Sub-component

```svelte
<script lang="ts">
import { cn } from "$lib/design/utils/cn.js";
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
  class={cn(ctx.classes.trigger, className)}
>
  {@render children?.()}
</button>
```

## Gold Standard: Recipe

```ts
import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
  id: "accordion.glass.void",
  kind: "accordion",
  label: "Glass Void Accordion",
  defaults: {
    surface: "glass-void", material: "none", depth: "z1", bevel: "subtle",
    glow: "none", frame: "soft", motion: "none", transition: "none",
    radius: "md", size: "md",
  },
  classes: (props: DsSurfaceProps): Record<string, string> => ({
    root: cn("accordion", emitSegments(toPreset(props)), radiusClass(props.radius)),
    item: cn("accordion-item", "border-b border-[var(--border-subtle)]"),
    trigger: cn("accordion-trigger", "flex w-full items-center justify-between",
      "px-16 py-12", "text-sm font-medium text-text-primary",
      "hover:bg-[var(--surface-hover)]", "transition-colors"),
    content: cn("accordion-content", "px-16 pb-16", "text-sm text-text-secondary"),
    indicator: cn("accordion-indicator", "shrink-0", "text-text-muted",
      "transition-transform duration-200"),
  }),
});
```

### Recipe utilities explained:
- `emitSegments(toPreset(props))` — generates `v-s1 v-d2 v-b1` classes from 8-axis props
- `radiusClass(props.radius)` — generates `rounded-{token}` class
- `toPreset(props)` — converts DsSurfaceProps to Preset object for emission
- Slots in recipe MUST match slots in contract

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
