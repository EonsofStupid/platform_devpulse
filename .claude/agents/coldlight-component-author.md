# Plan: ColdLight Foundation — 2-Layer Enterprise Pattern

## Context

The design system has been over-layered (behaviors → dumb components → ui wrappers = 3 layers). No enterprise system does this. The correct 2026 pattern is 2 layers: primitive hooks for behavior + styled components as the product. Every session has been patching instead of authoring the foundation correctly. This plan establishes the correct pattern from the ground up.

## Architecture (2 Layers)

### Layer 1: Primitive Hooks (`behaviors/{kind}/`)

Pure behavior. WAI-ARIA APG compliant. No styling. No schema.

```
behaviors/{kind}/
  {kind}.anatomy.ts       — createAnatomy(kind, slots) → data-kind + data-slot per part
  {kind}.types.ts         — behavioral props, per-slot typed attrs, return type
  use-{kind}.svelte.ts    — $state + $derived. ARIA, keyboard, focus, state.
  index.ts                — barrel exports
```

Pattern: hook returns reactive attrs object. Component spreads onto elements.

### Layer 2: Components (`components/{kind}/`)

THE product. What users import. Uses primitive hook + StyleMacro provider.

```
components/{kind}/
  {Kind}.svelte           — uses hook for ARIA + StyleMacro for visual. Prop-driven.
  {kind}.types.ts         — extends ComponentProps. Intent/variant + size + behavioral.
  {kind}.schema.ts        — colocated VPB schema. Registers in registry. StyleMacro reads.
  index.ts                — barrel (what users import)
```

Pattern:
```svelte
<script lang="ts">
  import { useButton } from "$lib/design/behaviors/button/index.js";
  import { StyleMacro } from "$lib/design/style/index.js";
  import type { ButtonProps, ButtonSize } from "./button.types.js";

  const SIZE: Record<ButtonSize, string> = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2.5",
  };

  let { intent = "primary", size = "md", disabled, loading, pressed,
        onPressedChange, expanded, type, children, class: className, ...rest
  }: ButtonProps = $props();

  const button = $derived(useButton({ disabled, loading, pressed, onPressedChange, expanded, type }));
  const styleId = $derived(`button-${intent}`);
</script>

<StyleMacro kind="button" style={styleId}>
  <button {...button.root} {...rest}
    class="{SIZE[size] ?? SIZE.md} {className ?? ''}"
  >
    {@render children?.()}
  </button>
</StyleMacro>
```

- Hook provides ARIA + data-kind + data-slot
- StyleMacro wraps, sets --cl-* CSS vars from DTCG style tokens
- Structural size = const map in component
- Intent/variant maps to style ID
- class prop for caller overrides
- ZERO hardcoded colors. ZERO visual logic outside StyleMacro.

### What Gets Deleted

- `ui/` folder — unnecessary wrapper layer
- `components/_base/use-coldlight.svelte.ts` — already deleted
- `recipes/` folder — JS recipe system, replaced by DTCG JSON
- `registry/` folder — old 8-axis system
- JS `recipe.ts` files in component folders
- `components/_schema/` — references deleted modules

### What Stays

- `behaviors/` — hooks, anatomy, types (behavioral layer)
- `components/_base/` — ComponentProps, schema.ts (11-axis Zod), registry.ts
- `components/{kind}/` — the product (hook + StyleMacro)
- `style/` — StyleMacro, macro-mappings, base-state
- `generated/render-base.css` — glue CSS
- DTCG token JSON in `tokens/src/`
- SD5 pipeline with `expand: true`

## _base Contract

`_base` is for styling, not behaviors. It provides:

- `ComponentProps` — `class?: string`, `children?: Snippet`
- `SlotTokenAxesSchema` — 11 DTCG axes (Zod, for VPB)
- `StyleBindingSchema` — available style IDs per kind
- `ComponentSchemaZ` — full component registration schema
- `registry.ts` — register/get schemas (StyleMacro + VPB consume)

Zod schemas need clean defaults so extending is frictionless:
- `required`, `advanced`, `segmented`, `multiline` etc. should default via `.default(false)`
- Components use `satisfies` but Zod `.parse()` at import handles defaults

## Execution Order

### Step 1: Fix _base to be frictionless
- `_base/types.ts` — ComponentProps (class + children). Clean.
- `_base/schema.ts` — Fix Zod schemas so `satisfies` works without explicit `required: false` etc. Use `.default()` properly OR change validation approach so extending isn't boilerplate.
- `_base/registry.ts` — clean, stays as-is.

### Step 2: Author Button (gold standard)
- Delete `ui/button/` — no more wrapper layer
- Rewrite `components/button/Button.svelte` — hook + StyleMacro in ONE file
- `components/button/button.types.ts` — extends ComponentProps, adds intent + size + behavioral
- `components/button/button.schema.ts` — colocated, registers, frictionless
- `components/button/index.ts` — barrel (this IS the public API now)
- Import schema in Button.svelte to trigger registration

### Step 3: Author Accordion (compound gold standard)
- Delete `ui/accordion/`
- Rewrite `components/accordion/Accordion.svelte` — hook + StyleMacro, sets context
- Sub-components (Item, Trigger, Content, Indicator) — read context, spread hook attrs
- `accordion.types.ts` — extends ComponentProps
- `accordion.schema.ts` — colocated, registers
- `index.ts` — compound barrel (Root, Item, Trigger, Content, Indicator)

### Step 4: Verify end-to-end
- `pnpm ds:tokens:build` — DTCG tokens generate
- `pnpm svelte-check` — zero errors in button + accordion
- `pnpm dev` — both render with token-driven visual

### Step 5: Delete old systems
- `ui/` folder
- `recipes/` folder
- `registry/` folder
- `_schema/` folder
- All `recipe.ts` files in component folders

### Step 6: Batch remaining components
- One at a time, same pattern as Button/Accordion
- Compile-check after each

## Files to Modify

| File | Change |
|------|--------|
| `components/_base/schema.ts` | Fix Zod defaults so satisfies works clean |
| `components/button/Button.svelte` | Hook + StyleMacro in one file |
| `components/button/button.types.ts` | Extends ComponentProps, adds intent |
| `components/button/button.schema.ts` | Fix prop boilerplate |
| `components/button/index.ts` | Public API (no more ui/ indirection) |
| `components/accordion/Accordion.svelte` | Hook + StyleMacro, context |
| `components/accordion/types.ts` | Extends ComponentProps |
| `components/accordion/accordion.schema.ts` | Already exists, fix props |
| `components/accordion/index.ts` | Compound barrel |

## Files to Delete

| File/Dir | Why |
|----------|-----|
| `ui/` | Unnecessary layer — components ARE the product |
| `recipes/` | JS recipes replaced by DTCG JSON |
| `registry/` | Old 8-axis system |
| `_schema/` | References deleted modules |
| `components/*/recipe.ts` | 46 files — JS recipes |

## Verification

1. `pnpm ds:tokens:build` — clean
2. `pnpm svelte-check` — zero errors in modified files
3. `pnpm dev` — Button + Accordion render with token-driven styling
4. Change token value in JSON → rebuild → visual changes


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
