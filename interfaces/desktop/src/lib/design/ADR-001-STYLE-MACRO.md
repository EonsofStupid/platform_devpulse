# ADR-001: StyleMacro — ColdLight Visual Resolution Architecture

**Status:** ACCEPTED — IRREVERSIBLE
**Date:** 2026-03-21
**Updated:** 2026-03-21 (11-axis, DTCG-aligned)
**Replaces:** useColdLight(), resolveVisual(), registerRecipe(), 8-axis encoding, per-component visual resolution

---

## Decision

All visual resolution in ColdLight flows through a single `<StyleMacro>` component. Components are pure structure + ARIA. UI wrappers are what users import.

---

## 3-Layer Model (LOCKED)

| Layer | Folder | Responsibility |
|-------|--------|---------------|
| **Component** | `components/{kind}/` | Pure structure + ARIA + `class` prop. No visual logic. No recipe imports. No style computation. |
| **Recipe** | DTCG token group in JSON | 11-axis visual definitions. One token per axis, each with its real DTCG `$type`. SD5 processes them. NOT JavaScript. NOT `registerRecipe()`. |
| **UI** | `ui/{kind}/` | What users import. Wraps component with `<StyleMacro>`. Connects recipe to component. Prop-driven. |

### Component (Structure + ARIA)

```svelte
<!-- components/badge/Badge.svelte -->
<script lang="ts">
  import type { BadgeProps } from "./badge.types.js";
  let { children, class: className, ...rest }: BadgeProps = $props();
</script>
<span data-kind="badge" data-slot="root" class={className} {...rest}>
  {@render children?.()}
</span>
```

Components accept `class` + `children` + kind-specific behavioral props (disabled, pressed, expanded). Nothing visual.

### Recipe (DTCG Token Group — one token per axis, real DTCG types)

```json
{
  "style": {
    "button-primary": {
      "backgroundColor": { "$type": "color", "$value": "{color.teal-600}" },
      "backgroundBlur": { "$type": "dimension", "$value": "{blur.none}" },
      "shadow":         { "$type": "shadow", "$value": ["{shadow.z1}"] },
      "border":         { "$type": "border", "$value": { "color": "{color.teal-500}", "width": "{border-width.thin}", "style": "solid" } },
      "animation":      { "$type": "duration", "$value": "{motion.duration.none}" },
      "transition":     { "$type": "transition", "$value": { "duration": "{motion.duration.fast}", "delay": "{motion.delay.none}", "timingFunction": "{motion.ease.out}" } },
      "typography":     { "$type": "typography", "$value": { "fontFamily": "{font.sans}", "fontSize": "{text-size.sm}", "fontWeight": 500, "letterSpacing": "{tracking.normal}", "lineHeight": 1.5 } },
      "gradient":       { "$type": "gradient", "$value": [{ "color": "{color.teal-600}", "position": 0 }, { "color": "{color.teal-500}", "position": 1 }] },
      "color":          { "$type": "color", "$value": "{color.white}" },
      "borderRadius":   { "$type": "dimension", "$value": "{radius.lg}" },
      "opacity":        { "$type": "number", "$value": 1 }
    }
  }
}
```

Each axis is its own token with its REAL DTCG `$type`. The group name (`button-primary`) is the style ID. SD5 processes every token natively because they are spec-compliant. No invented types.

### UI Wrapper (What Users Import)

```svelte
<!-- ui/badge/Badge.svelte -->
<script lang="ts">
  import { StyleMacro } from "$lib/design/style/index.js";
  import BadgeRoot from "$lib/design/components/badge/Badge.svelte";

  let { children, class: className, ...rest } = $props();
</script>
<StyleMacro kind="badge">
  <BadgeRoot class={className} {...rest}>
    {@render children?.()}
  </BadgeRoot>
</StyleMacro>
```

Users import from `ui/`. They never touch `components/` directly. They never think about StyleMacro.

### Structural Sizing (NOT a visual axis)

`size="md"` → `h-10 px-4 text-sm` is STRUCTURAL (height, padding, font-size). It is NOT one of the 11 visual axes. It does NOT go through StyleMacro.

Structural size maps live in the component as const maps:

```ts
const SIZE: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm gap-1.5",
  md: "h-10 px-4 text-sm gap-2",
  lg: "h-12 px-6 text-base gap-2.5",
};
```

Components apply structural classes directly. StyleMacro handles visual treatment. These are separate concerns.

### Intent / Variant → Style ID Mapping

The UI wrapper maps semantic props to style IDs. This is the UI wrapper's job, not the component's:

```svelte
<!-- ui/button/Button.svelte -->
<script lang="ts">
  import { StyleMacro } from "$lib/design/style/index.js";
  import ButtonRoot from "$lib/design/components/button/Button.svelte";

  let { intent = "primary", size = "md", children, class: className, ...rest } = $props();

  const styleId = $derived(`button-${intent}`);
</script>
<StyleMacro kind="button" style={styleId}>
  <ButtonRoot {size} class={className} {...rest}>
    {@render children?.()}
  </ButtonRoot>
</StyleMacro>
```

`intent="primary"` → `style="button-primary"` → StyleMacro resolves DTCG token group `style.button-primary` → 11-axis CSS custom properties.

---

## 11-Axis Visual System (LOCKED)

Every axis maps to a real DTCG `$type`. No invented types. No gaps.

| # | Axis | DTCG `$type` | CSS Property | Composite? |
|---|------|-------------|-------------|------------|
| 1 | `backgroundColor` | `color` | `background-color` | No |
| 2 | `backgroundBlur` | `dimension` | `backdrop-filter: blur()` | No |
| 3 | `shadow` | `shadow` | `box-shadow` (depth+bevel+glow as layers) | Yes — color, offsetX/Y, blur, spread, inset |
| 4 | `border` | `border` | `border` | Yes — color, width, style |
| 5 | `animation` | `duration` | `animation` | No |
| 6 | `transition` | `transition` | `transition` | Yes — duration, delay, timingFunction |
| 7 | `typography` | `typography` | `font-*`, `letter-spacing`, `line-height` | Yes — fontFamily, fontSize, fontWeight, letterSpacing, lineHeight |
| 8 | `gradient` | `gradient` | `background-image: linear-gradient()` | Yes — array of color stops |
| 9 | `color` | `color` | `color` (foreground/text/icon) | No |
| 10 | `borderRadius` | `dimension` | `border-radius` | No |
| 11 | `opacity` | `number` | `opacity` | No |

### Composite Type Expansion (SD5 `expand: true` — ALL composites expand, NO shorthand)

DTCG defines structured composites. SD5 expands every composite into individual CSS custom properties. The glue CSS assembles them into CSS shorthand. No shorthand transforms. Every sub-value is individually addressable by VPB.

| DTCG Type | Expands To |
|-----------|-----------|
| `shadow` | `--{name}-color`, `--{name}-offset-x`, `--{name}-offset-y`, `--{name}-blur`, `--{name}-spread`, `--{name}-inset` |
| `border` | `--{name}-color`, `--{name}-width`, `--{name}-style` |
| `transition` | `--{name}-duration`, `--{name}-delay`, `--{name}-timing-function` |
| `typography` | `--{name}-font-family`, `--{name}-font-size`, `--{name}-font-weight`, `--{name}-letter-spacing`, `--{name}-line-height` |
| `gradient` | `--{name}-{index}-color`, `--{name}-{index}-position` (per stop) |

### CSS Custom Property Names (StyleMacro output)

| Axis | `--cl-*` var | Composite sub-vars |
|------|--------------|--------------------|
| backgroundColor | `--cl-bg` | — |
| backgroundBlur | `--cl-blur` | — |
| shadow | `--cl-shadow` | `--cl-shadow-color`, `--cl-shadow-offset-x`, `--cl-shadow-offset-y`, `--cl-shadow-blur`, `--cl-shadow-spread` |
| border | `--cl-border` | `--cl-border-color`, `--cl-border-width`, `--cl-border-style` |
| animation | `--cl-animation` | — |
| transition | `--cl-transition` | `--cl-transition-duration`, `--cl-transition-delay`, `--cl-transition-easing` |
| typography | `--cl-typography` | `--cl-font-family`, `--cl-font-size`, `--cl-font-weight`, `--cl-letter-spacing`, `--cl-line-height` |
| gradient | `--cl-gradient` | — (full shorthand) |
| color | `--cl-color` | — |
| borderRadius | `--cl-radius` | — |
| opacity | `--cl-opacity` | — |

### Glue CSS (`generated/macro-base.css`)

Maps `--cl-*` vars to CSS properties on `[data-kind]` elements. Without this file, StyleMacro outputs vars into the void.

**StyleMacro assembles composite shorthands in JavaScript** (inside `$derived.by`). The glue CSS just consumes the assembled values. CSS custom properties cannot dynamically compose N shadow layers or N gradient stops — that's JavaScript's job.

```css
[data-kind] {
  background-color: var(--cl-bg);
  backdrop-filter: blur(var(--cl-blur));
  box-shadow: var(--cl-shadow);
  border: var(--cl-border);
  animation: var(--cl-animation);
  transition: var(--cl-transition);
  font-family: var(--cl-font-family);
  font-size: var(--cl-font-size);
  font-weight: var(--cl-font-weight);
  letter-spacing: var(--cl-letter-spacing);
  line-height: var(--cl-line-height);
  background-image: var(--cl-gradient);
  color: var(--cl-color);
  border-radius: var(--cl-radius);
  opacity: var(--cl-opacity);
}
```

### Assembly Responsibility

| Concern | Who | How |
|---------|-----|-----|
| Token storage | DTCG JSON | Structured composite objects. Expanded by SD5. |
| Token → CSS custom properties | SD5 | `expand: true`. Each sub-value = own CSS property. |
| Composite assembly → shorthand | StyleMacro `$derived.by` | Reads expanded sub-values, builds CSS shorthand string. |
| Shorthand → paint | Glue CSS | `[data-kind]` rule consumes `--cl-*` vars. |
| Individual sub-value control | VPB | Reads/writes individual expanded sub-value tokens. |

Typography is the exception — it does NOT need shorthand assembly. Its 5 sub-values map to 5 separate CSS properties directly (font-family, font-size, font-weight, letter-spacing, line-height).

---

## StyleMacro

Three files in `design/style/`:

| File | Purpose |
|------|---------|
| `base-state.svelte.ts` | `$state` global reactive theme. VPB pushes updates. |
| `macro-mappings.ts` | Static dictionary: 11 axes → `--cl-*` var names + DTCG types. Pre-computed key arrays. |
| `StyleMacro.svelte` | `$derived.by` resolver. Produces CSS custom properties + encoding on wrapper div. |

### Resolution Order (later wins)

```
1. platformBase.globalTokens  ($state — VPB can update)
2. compiledBase[kind]         (build-time — SD5 output from DTCG token groups)
3. localOverrides             (per-instance prop on StyleMacro)
```

```ts
const value = local[key] ?? kindDefaults[key] ?? baseTokens[key];
```

### Output

```html
<div
  data-macro-id="coldlight-default"
  data-macro-kind="badge"
  data-encoding="backgroundColor:accent-teal shadow:none border:subtle color:teal-400 borderRadius:full opacity:1"
  style="--cl-bg: var(--style-badge-default-background-color); --cl-shadow: var(--style-badge-default-shadow); ..."
>
  <!-- component renders inside, [data-kind] rule consumes --cl-* vars -->
</div>
```

### VPB Integration

VPB pushes updates via custom event:

```ts
window.dispatchEvent(new CustomEvent('vpb:style-update', {
  detail: { newStyleId: 'dark-mode', newTokens: { backgroundColor: 'layer-2' } }
}));
```

`platformBase` reacts. StyleMacro re-resolves. Browser repaints. One update, entire app.

---

## Performance

| Metric | Old (useColdLight) | New (StyleMacro) |
|---|---|---|
| Theme change, 1000 components | 1000 resolveVisual() + 1000 cn() + 1000 DOM class updates | 1 $derived.by + 1 style attribute + browser CSS cascade |
| Object allocations per update | 1000 ResolvedVisual objects | 0 (string concatenation only) |
| Memory | Getter-wrapped objects per component | One $state + one string per macro instance |

---

## Encoding Format (11-Axis)

```
backgroundColor:glass-void backgroundBlur:frosted shadow:card-elevated border:soft animation:none transition:fast typography:body-default gradient:none color:teal-400 borderRadius:full opacity:1
```

Space-separated `axis:value` pairs. Human-readable. VPB reads and writes this format.

NOT the old `v-s1z0d2b1g0f1m0t2` format.

---

## What Is DELETED

| Deleted | Why |
|---|---|
| `useColdLight()` | Per-component hook. Replaced by StyleMacro. |
| `resolveVisual()` | Per-component resolution. Logic is in StyleMacro `$derived.by`. |
| `components/_base/use-coldlight.svelte.ts` | The hook file. |
| `registerRecipe()` / `recipes/` JS system | Recipes are DTCG token groups in JSON. SD5 processes them. |
| `*.visual.ts` / `compiled-base.ts` | Recipes are in token JSON, not TypeScript. |
| `cn()` in component `$derived` blocks | Components don't compute classes. |
| `visual.segments` class approach | CSS custom properties instead. |
| Getter hack return objects | `$derived.by` returns a plain string. |
| 8-axis encoding (`v-s1z0d2b1g0f1m0t2`) | Replaced by 11-axis DTCG-aligned encoding. |
| `ColdLightProps` interface | Components don't accept visual props. |
| `registry/resolve-visual.ts` | Old resolution pipeline. |
| `registry/presets.ts` | Old preset system. |
| `registry/token-categories.ts` | Old 8-axis encoding SSOT. |
| `registry/encoding.ts` | Old encoding system. |
| `registry/kind-definitions.ts` | Old CDO definitions. |
| JS `recipe.ts` files in component folders | Visual classes in JS. Replaced by DTCG JSON. |

## What Stays

| Asset | Why |
|---|---|
| DTCG JSON tokens | Source of truth. Unchanged. |
| SD5 pipeline | Generates CSS vars the macro references. |
| Primitive hooks | Behavioral ARIA (useButton, useAccordion, etc.). Unchanged. |
| Component contracts | ARIA spec per slot. Unchanged. |
| `data-kind` / `data-slot` / `data-state` | Three data attributes on components. Unchanged. |
| `cn()` utility | Still used in UI wrappers for structural class composition. |
| `_base/` | Contract that every component extends. Declares 11-axis schema. Automatic macro-driven provider. |

## `_base` Contract (LOCKED)

Every component extends `_base`. This is what makes StyleMacro automatic:

- `ComponentProps` — `class` + `children` + kind-specific behavioral props. Zero visual.
- `SlotTokenAxesSchema` — 11 DTCG axes. Declares which axes each slot receives.
- Components extending `_base` automatically get `data-kind` → glue CSS applies → `--cl-*` vars cascade → browser paints.
- ONE change to `platformBase.globalTokens` → every component that extends `_base` repaints.
- ONE `localOverrides` on a specific StyleMacro → only that instance changes.

Components ONLY consume DTCG composite style tokens (the recipes). No raw CSS values. No hardcoded colors. No JS recipe functions. No invented token names. The `_base` contract enforces this — if it's not in the 11 axes, it doesn't exist as a visual concern.

---

## Consequences

1. Every component authored before this ADR needs visual logic removed
2. Components become pure structure — no visual imports, no style computation
3. `ui/` folder must be created — this is what users import
4. DTCG token group JSON files must be created for each component's recipe (11 axes per style)
5. `generated/macro-base.css` must be created — glue CSS that maps `--cl-*` to CSS properties
6. The old `recipes/` JS system must be deleted
7. The old `registry/` folder must be deleted
8. JS `recipe.ts` files in component folders must be deleted
9. StyleMacro var() construction must reference actual SD5 output names
10. VPB reads `data-encoding` + `data-macro-kind` from StyleMacro wrapper

---

## Decision Record

**Decided by:** Owner
**Rationale:** Per-component visual resolution is a Svelte 5 anti-pattern. CSS custom properties + browser cascade is the correct approach. StyleMacro eliminates 95% of visual resolution code while improving performance by orders of magnitude. 11 axes cover every visual concern a UI compiler needs. Every axis maps to a real DTCG `$type` — no invented types, no gaps.
**Irreversible:** Yes. This is the visual architecture. No going back to per-component hooks.

---

**ColdLight is the public API. The owner directs ColdLight. ColdLight directs everything else.**
