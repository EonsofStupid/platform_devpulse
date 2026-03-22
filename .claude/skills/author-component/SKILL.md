# Author Component

Use this skill when the user wants a ColdLight component authored or reauthored per ADR-001.

## When to use
- User says "author this component" or "create this component"
- User pastes a component API reference (Spectrum, Ark UI, Zag)
- User wants an existing component reauthored to ADR-001

## Architecture (ADR-001 — LOCKED, IRREVERSIBLE)

### 3-Layer Model

| Layer | Folder | What It Does |
|-------|--------|-------------|
| **Component** | `components/{kind}/` | DUMB. Structure + ARIA + structural size + `class`. Extends `_base`. ZERO visual logic. |
| **Recipe** | DTCG token group in JSON | 11-axis visual definition. One token per axis, real DTCG `$type`. SD5 processes. NOT JavaScript. |
| **UI** | `ui/{kind}/` | What users import. StyleMacro + component. Prop-driven. Maps intent/variant → style ID. |

### 11 Visual Axes (each = 1 real DTCG `$type`)

backgroundColor (color), backgroundBlur (dimension), shadow (shadow), border (border), animation (duration), transition (transition), typography (typography), gradient (gradient), color (color), borderRadius (dimension), opacity (number)

### Component Pattern (ZERO EXCEPTIONS)

```svelte
<!-- components/{kind}/{Kind}.svelte -->
<script lang="ts">
  import { use{Kind} } from "$lib/design/primitives/{kind}/index.js";
  import type { {Kind}Props, {Kind}Size } from "./{kind}.types.js";

  const SIZE: Record<{Kind}Size, string> = {
    sm: "h-8 px-3 text-sm gap-1.5",
    md: "h-10 px-4 text-sm gap-2",
    lg: "h-12 px-6 text-base gap-2.5",
  };

  let { size = "md", children, class: className, ...rest }: {Kind}Props = $props();
  const {kind} = $derived(use{Kind}({ /* behavioral props */ }));
</script>

<element {...{kind}.root} {...rest} class="{SIZE[size] ?? SIZE.md} {className ?? ''}">
  {@render children?.()}
</element>
```

- Primitive hook → ARIA + keyboard + `data-kind` + `data-slot`
- Structural size → const map, applied directly
- `class` prop → passthrough from caller
- ZERO visual logic. ZERO colors. ZERO backgrounds. ZERO shadows. ZERO token references.

### UI Wrapper Pattern

```svelte
<!-- ui/{kind}/{Kind}.svelte -->
<script lang="ts">
  import { StyleMacro } from "$lib/design/style/index.js";
  import {Kind}Root from "$lib/design/components/{kind}/{Kind}.svelte";

  let { intent = "default", size = "md", children, class: className, ...rest } = $props();
  const styleId = $derived(`{kind}-${intent}`);
</script>
<StyleMacro kind="{kind}" style={styleId}>
  <{Kind}Root {size} class={className} {...rest}>
    {@render children?.()}
  </{Kind}Root>
</StyleMacro>
```

### Recipe (DTCG Token Group)

Author in `tokens/src/style.json`:

```json
{
  "style": {
    "{kind}-default": {
      "backgroundColor": { "$type": "color", "$value": "{color.glass-void}" },
      "backgroundBlur": { "$type": "dimension", "$value": "{blur.none}" },
      "shadow": { "$type": "shadow", "$value": "{shadow.none}" },
      "border": { "$type": "border", "$value": { "color": "{border.subtle}", "width": "{border-width.thin}", "style": "solid" } },
      "animation": { "$type": "duration", "$value": "{motion.duration.none}" },
      "transition": { "$type": "transition", "$value": { "duration": "{motion.duration.fast}", "delay": "{motion.delay.none}", "timingFunction": "{motion.ease.out}" } },
      "typography": { "$type": "typography", "$value": { "fontFamily": "{font.sans}", "fontSize": "{text-size.sm}", "fontWeight": 400, "letterSpacing": "{tracking.normal}", "lineHeight": 1.5 } },
      "gradient": { "$type": "gradient", "$value": [] },
      "color": { "$type": "color", "$value": "{text-primary}" },
      "borderRadius": { "$type": "dimension", "$value": "{radius.md}" },
      "opacity": { "$type": "number", "$value": 1 }
    }
  }
}
```

## What to do

1. **Read ADR-001** at `design/ADR-001-STYLE-MACRO.md`
2. **Check existing state** — does a primitive hook exist? Does the component folder exist?
3. **Author component** — DUMB. Structure + ARIA + structural size + class. Zero visual.
4. **Author DTCG recipe** — 11-axis token group in JSON. One token per axis, real DTCG types.
5. **Author UI wrapper** — StyleMacro + component. Maps intent → style ID.
6. **Verify** — `pnpm svelte-check` — zero new errors

## BANNED

- `useColdLight()` — DELETED
- `registerRecipe()` — DELETED
- `resolveVisual()` — DELETED
- JS `recipe.ts` files — DELETED
- Hardcoded colors in components — NEVER
- `bg-[var(...)]` in components — NEVER
- Visual classes in components — NEVER
- Importing from `recipes/` — DELETED
- Importing from `registry/` — DELETED
- `ColdLightProps` — DELETED
- Old 8-axis anything — DELETED

## Key reference files
- `design/ADR-001-STYLE-MACRO.md` — THE architecture
- `design/style/macro-mappings.ts` — 11 axes → --cl-* vars
- `design/style/StyleMacro.svelte` — the provider
- `design/components/_base/schema.ts` — 11-axis schema, SlotTokenAxesSchema, StyleBindingSchema
- `design/components/_base/types.ts` — ComponentProps (class + children)
