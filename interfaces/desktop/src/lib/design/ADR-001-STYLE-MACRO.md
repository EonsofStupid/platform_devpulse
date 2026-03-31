# ADR-001: ColdLight Visual Resolution Architecture

**Status:** ACCEPTED — IRREVERSIBLE
**Date:** 2026-03-21
**Updated:** 2026-03-22 (2-layer enterprise pattern, 11-axis DTCG)
**Replaces:** useColdLight(), resolveVisual(), registerRecipe(), 8-axis encoding, per-component visual resolution, 3-layer model, ui/ folder

---

## Decision

2-layer enterprise pattern. Primitive hooks for behavior. Components are the product — hook + StyleMacro in one file. No third layer. No dumb middle components. No ui/ folder.

---

## 2-Layer Model (LOCKED)

| Layer | Folder | Responsibility |
|-------|--------|---------------|
| **Primitive Hook** | `primitives/{kind}/` | Pure behavior. WAI-ARIA APG. ARIA, keyboard, focus, state. Anatomy declares slots. Returns reactive attrs. NO styling. NO schema. |
| **Component** | `components/{kind}/` | THE PRODUCT. What users import. Uses hook for ARIA + StyleMacro for visual. Prop-driven. Colocated schema for VPB. |

### Primitive Hook (Behavior)

```
primitives/{kind}/
  {kind}.anatomy.ts       — createAnatomy(kind, slots) → data-kind + data-slot
  {kind}.types.ts         — behavioral props, per-slot typed attrs, return type
  use-{kind}.svelte.ts    — $state + $derived. ARIA, keyboard, focus, state.
  index.ts                — barrel
```

```ts
// Returns reactive attrs to spread onto elements
const button = $derived(useButton({ disabled, loading, pressed }));
// button.root → { data-kind: "button", data-slot: "root", role: "button", aria-disabled: ..., onclick: ... }
```

### Component (The Product)

```
components/{kind}/
  {Kind}.svelte           — hook + StyleMacro in ONE file. The product.
  {kind}.types.ts         — extends ComponentProps from _base. Intent + size + behavioral.
  {kind}.schema.ts         — ArkType schema. `.toJsonSchema()` feeds A2UI catalog + llguidance.
  index.ts                — barrel (public API, what users import)
```

```svelte
<script lang="ts">
  import { useButton } from "$lib/design/primitives/button/index.js";
  import { StyleMacro } from "$lib/design/style/index.js";
  import "./button.schema.js";
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
  <button {...button.root} {...rest} class="{SIZE[size] ?? SIZE.md} {className ?? ''}">
    {@render children?.()}
  </button>
</StyleMacro>
```

### Structural Sizing (NOT a visual axis)

Size is structural (height, padding, font-size). Const map in the component. Not StyleMacro.

### Intent/Variant → Style ID

Component maps intent prop to style ID: `intent="primary"` → `style="button-primary"`.
StyleMacro resolves the DTCG token group. Component owns this mapping.

---

## 11-Axis Visual System (LOCKED)

Every axis = 1 real DTCG `$type`. No invented types. No gaps.

| # | Axis | DTCG `$type` | CSS Property | Composite? |
|---|------|-------------|-------------|------------|
| 1 | `backgroundColor` | `color` | `background-color` | No |
| 2 | `backgroundBlur` | `dimension` | `backdrop-filter: blur()` | No |
| 3 | `shadow` | `shadow` | `box-shadow` | Yes — color, offsetX/Y, blur, spread, inset |
| 4 | `border` | `border` | `border` | Yes — color, width, style |
| 5 | `animation` | `duration` | `animation` | No |
| 6 | `transition` | `transition` | `transition` | Yes — duration, delay, timingFunction |
| 7 | `typography` | `typography` | `font-*`, spacing, height | Yes — fontFamily, fontSize, fontWeight, letterSpacing, lineHeight |
| 8 | `gradient` | `gradient` | `background-image` | Yes — array of color stops |
| 9 | `color` | `color` | `color` (foreground) | No |
| 10 | `borderRadius` | `dimension` | `border-radius` | No |
| 11 | `opacity` | `number` | `opacity` | No |

### Composite Expansion (SD5 `expand: true`, NO shorthand transforms)

SD5 expands every composite into named sub-properties. Every sub-value individually addressable by VPB. More readable than shorthand — each value is named.

StyleMacro assembles shorthand in `$derived.by` from expanded sub-vars. Glue CSS consumes assembled values.

### DTCG Style Tokens (Recipes)

Token groups in `tokens/src/component.json` under `style.{kind}-{variant}`:

```json
{
  "style": {
    "button-primary": {
      "backgroundColor": { "$type": "color", "$value": "{glass.deep}" },
      "backgroundBlur":  { "$type": "dimension", "$value": "{blur.lg}" },
      "shadow":          { "$type": "shadow", "$value": "{shadow.z1}" },
      "border":          { "$type": "border", "$value": { "color": "{border.strong}", "width": "1px", "style": "solid" } },
      "animation":       { "$type": "duration", "$value": "0ms" },
      "transition":      { "$type": "transition", "$value": { "duration": "150ms", "delay": "0ms", "timingFunction": [0, 0, 0.2, 1] } },
      "typography":      { "$type": "typography", "$value": { "fontFamily": "{font.sans}", "fontSize": "14px", "fontWeight": 500, "letterSpacing": "0em", "lineHeight": 1.5 } },
      "gradient":        { "$type": "gradient", "$value": [] },
      "color":           { "$type": "color", "$value": "#ffffff" },
      "borderRadius":    { "$type": "dimension", "$value": "{radius.lg}" },
      "opacity":         { "$type": "number", "$value": 1 }
    }
  }
}
```

Each axis = own token with real DTCG `$type`. SD5 expands composites. No invented types.

---

## StyleMacro Provider

Three files in `design/style/`:

| File | Purpose |
|------|---------|
| `base-state.svelte.ts` | `$state` global reactive theme. VPB pushes updates. |
| `macro-mappings.ts` | 11 axes → `--cl-*` var names + DTCG types. |
| `StyleMacro.svelte` | Schema-driven `$derived.by` resolver. Reads component's registered schema. Constructs var() refs to expanded SD5 output. Assembles composite shorthands. |

### Resolution

StyleMacro constructs `var(--style-{styleId}-{axis})` references from style ID. CSS cascade resolves at paint time.

### Glue CSS (`generated/macro-base.css`)

Maps `--cl-*` vars to CSS properties on `[data-kind]` elements. StyleMacro assembles composites. Glue CSS consumes assembled values.

```css
[data-kind] {
  background-color: var(-bg);
  backdrop-filter: blur(var(--cl-blur));
  box-shadow: var(--box-shadow);
  border: var(--cl-border);
  animation: var(--cl-animation);
  transition: var(--cl-transition);
  font-family: var(--font-family);
  font-size: var(--font-size);
  font-weight: var(--font-weight);
  letter-spacing: var(--tracking);
  line-height: var(--tracking);
  background-image: var(--cl-gradient);
  color: var(--cl-color);
  border-radius: var(--border-radius);
  opacity: var(--opacity);
}
```

### VPB Integration

VPB pushes updates via custom event → `platformBase` `$state` reacts → StyleMacro re-resolves → browser repaints. One update, entire app. Or per-instance.

---

## _base Contract (Styling, NOT Primitives)

Primitives have anatomy. Components have `_base`.

- `ComponentProps` — `class?: string`, `children?: Snippet`
- `ComponentDef` — interface for const literal defs (kind, styleIds, slots)
- `SlotAxes` — "all" | "none" | per-axis booleans
- `catalog.ts` — UI catalog of all defs. `getCatalogEntry(kind)`.

Every component has a colocated `{kind}.def.ts` — const literal `as const satisfies ComponentDef`. Added to catalog with one line. No Zod. No runtime validation. TypeScript validates at compile time.

---

## Assembly Responsibility

| Concern | Who |
|---------|-----|
| Token storage | DTCG JSON — structured composite objects |
| Token → CSS custom properties | SD5 — `expand: true`, each sub-value = own property |
| Composite assembly → shorthand | StyleMacro `$derived.by` — reads expanded sub-vars, builds CSS shorthand |
| Shorthand → paint | Glue CSS — `[data-kind]` consumes `--cl-*` vars |
| Individual sub-value control | VPB — reads/writes individual expanded sub-values |
| ARIA + keyboard + focus | Primitive hooks — WAI-ARIA APG compliant |
| Structure + class + size | Component — extends _base, const map for size |

---

## What Is DELETED

| Deleted | Why |
|---|---|
| `ui/` folder | Over-engineered third layer. Component IS the product. |
| `useColdLight()` | Per-component hook. Replaced by StyleMacro. |
| `resolveVisual()` | Per-component resolution. |
| `registerRecipe()` / `recipes/` JS | Recipes are DTCG token groups. |
| `registry/` folder | Old 8-axis system. |
| `_schema/` folder | References deleted modules. |
| JS `recipe.ts` files | Visual classes in JS. |
| `*.visual.ts` / `compiled-base.ts` | Recipes are in token JSON. |
| `ColdLightProps` / `PreparedComponentProps` | Components extend ComponentProps. |
| 8-axis encoding | Replaced by 11-axis DTCG. |
| 3-layer model | Replaced by 2-layer. |
| Dumb middle components | Over-engineered. |
| Shorthand transforms in SD5 | Removed. Expand only. |

## What Stays

| Asset | Why |
|---|---|
| DTCG JSON tokens | Source of truth. |
| SD5 pipeline (`expand: true`) | Generates expanded CSS vars. |
| Primitive hooks | Behavioral ARIA. Unchanged. |
| Anatomy (`createAnatomy`) | Slot declaration for primitives. |
| `data-kind` / `data-slot` / `data-state` | Three data attributes. |
| `_base` (ComponentProps, schema, registry) | Styling contract. |
| `cn()` utility | Structural class composition. |

---

## Checklist — Per Component

- [ ] Primitive hook exists (`primitives/{kind}/use-{kind}.svelte.ts`)
- [ ] Anatomy declared (`{kind}.anatomy.ts`)
- [ ] Primitive types with per-slot typed attrs (`{kind}.types.ts`)
- [ ] Component extends ComponentProps (`components/{kind}/{kind}.types.ts`)
- [ ] Component uses hook + StyleMacro in ONE file (`{Kind}.svelte`)
- [ ] Intent/variant maps to style ID in component
- [ ] Structural size as const map in component
- [ ] ZERO hardcoded colors/backgrounds/shadows in component
- [ ] Const literal def declares axes + style IDs (`{kind}.def.ts`)
- [ ] Def added to `_base/catalog.ts`
- [ ] Schema validates + registers at import time
- [ ] DTCG style tokens authored (`tokens/src/component.json` → `style.{kind}-{variant}`)
- [ ] SD5 generates expanded sub-properties for style tokens
- [ ] Barrel exports component as public API (`index.ts`)
- [ ] `pnpm svelte-check` — zero errors
- [ ] `pnpm ds:tokens:build` — clean
- [ ] Visual renders with token-driven styling

---

## Decision Record

**Decided by:** Owner
**Rationale:** 2-layer pattern (hooks + styled components) is the enterprise standard in 2026. React Spectrum S2, Ark UI, Radix — none use a third layer. The 3-layer split was over-engineering. StyleMacro + primitive hooks give full ARIA compliance + full visual control + VPB integration in the minimum possible architecture. 11 axes cover every visual concern. Every axis = real DTCG type.
**Irreversible:** Yes.

---

**ColdLight is the public API. The owner directs ColdLight. ColdLight directs everything else.**
