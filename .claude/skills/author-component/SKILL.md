# Author Component

Author or reauthor a ColdLight component per ADR-001 (2-layer enterprise pattern).

## When to use
- User says "author this component" or "create this component"
- User pastes a component API reference (Spectrum S2, Ark UI, Zag, Skeleton)
- User wants an existing component reauthored

## Architecture (2 Layers — ADR-001 LOCKED)

### Layer 1: Primitive Hook (`primitives/{kind}/`)
- Pure behavior. WAI-ARIA APG. No styling. No schema.
- `{kind}.anatomy.ts` — `createAnatomy(kind, slots)`
- `{kind}.types.ts` — behavioral props, per-slot typed attrs, return type
- `{kind}.a11y.ts` — APG reference, keyboard, roles
- `use-{kind}.svelte.ts` — `$state` + `$derived`. ARIA, keyboard, focus.
- NO .svelte components. NO .props.ts. Hook only.

### Layer 2: Component (`components/{kind}/`) — THE PRODUCT
- What users import. Hook + StyleMacro in ONE file.
- `{Kind}.svelte` — uses hook for ARIA + StyleMacro for visual
- `{kind}.types.ts` — extends ComponentProps from `_base`
- `{kind}.def.ts` — const literal `as const satisfies ComponentDef`
- `index.ts` — barrel (public API)

**No `ui/` folder. No dumb middle layer. No Zod schemas. No registry.**

### Component Pattern

```svelte
<script lang="ts">
  import { use{Kind} } from "$lib/design/primitives/{kind}/index.js";
  import { StyleMacro } from "$lib/design/style/index.js";
  import { cn } from "$lib/design/utils/cn.js";
  import type { {Kind}Props, {Kind}Size } from "./{kind}.types.js";

  const SIZE: Record<{Kind}Size, string> = {
    sm: "...", md: "...", lg: "...",
  };

  let { intent = "default", size = "md", children, class: className,
        ...rest }: {Kind}Props = $props();

  const hook = $derived(use{Kind}({ /* behavioral props */ }));
  const styleId = $derived(`{kind}-${intent}`);
</script>

<StyleMacro kind="{kind}" style={styleId}>
  <element {...hook.root} {...rest}
    class={cn("structural classes", SIZE[size] ?? SIZE.md, className)}>
    {@render children?.()}
  </element>
</StyleMacro>
```

### Def Pattern (const literal + map)

```ts
// {kind}.def.ts
import type { ComponentDef } from "$lib/design/components/_base/types.js";

export const {kind}Def = {
  kind: "{kind}",
  defaultStyleId: "{kind}-default",
  styleIds: ["{kind}-default"],
  slots: { root: "all" },
} as const satisfies ComponentDef;
```

Add one line to `_base/component-map.ts`:
```ts
import { {kind}Def } from "../{kind}/{kind}.def.js";
// then add to map: {kind}: {kind}Def,
```

### Types Pattern

```ts
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type {Kind}Intent = "default" | "primary" | ...;
export type {Kind}Size = "sm" | "md" | "lg";

export interface {Kind}Props extends ComponentProps,
  Omit<HTML{Element}Attributes, "style" | "children" | "class" | ...> {
  intent?: {Kind}Intent;
  size?: {Kind}Size;
  // behavioral props forwarded to hook
}
```

### DTCG Style Tokens

In `tokens/src/component.json` under `style.{kind}-{intent}`:
```json
{
  "style": {
    "{kind}-default": {
      "backgroundColor": { "$type": "color", "$value": "..." },
      "backgroundBlur":  { "$type": "dimension", "$value": "..." },
      "shadow":          { "$type": "shadow", "$value": "..." },
      "border":          { "$type": "border", "$value": { "color": "...", "width": "...", "style": "..." } },
      "animation":       { "$type": "duration", "$value": "..." },
      "transition":      { "$type": "transition", "$value": { "duration": "...", "delay": "...", "timingFunction": [...] } },
      "typography":      { "$type": "typography", "$value": { "fontFamily": "...", "fontSize": "...", "fontWeight": ..., "letterSpacing": "...", "lineHeight": ... } },
      "gradient":        { "$type": "gradient", "$value": [] },
      "color":           { "$type": "color", "$value": "..." },
      "borderRadius":    { "$type": "dimension", "$value": "..." },
      "opacity":         { "$type": "number", "$value": 1 }
    }
  }
}
```

## What to do

1. **Check if primitive hook exists** — if not, author it (anatomy + types + a11y + hook)
2. **Author component** — hook + StyleMacro in ONE file. Extends ComponentProps.
3. **Author def** — const literal, add to component-map
4. **Author DTCG style tokens** — 11-axis token group per intent/variant
5. **Update consumers** — import from components/{kind}/
6. **Verify** — `pnpm svelte-check`, `pnpm ds:tokens:build`

## BANNED

- `ui/` folder
- `useColdLight()`
- `registerRecipe()` / `recipes/` folder
- `registry/` folder
- `_schema/` folder
- Zod component schemas (schema.ts, registry.ts)
- JS `recipe.ts` files
- Hardcoded colors in components
- Visual classes in components
- `ColdLightProps` / `PreparedComponentProps`
- `.svelte` components in primitives
- `.props.ts` in primitives
- Shorthand transforms in SD5

## Key files
- `design/ADR-001-STYLE-MACRO.md` — THE architecture
- `design/style/StyleMacro.svelte` — the provider
- `design/style/macro-mappings.ts` — 11 axes
- `design/components/_base/types.ts` — ComponentProps + ComponentDef + SlotAxes
- `design/components/_base/component-map.ts` — const map, getComponentDef()
- `design/schema/anatomy.schema.ts` — createAnatomy for primitives
- `design/generated/macro-base.css` — glue CSS, [data-kind] consumes --cl-*
