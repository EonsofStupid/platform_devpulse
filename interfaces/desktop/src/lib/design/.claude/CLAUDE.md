# Claude Instructions for ColdLight

> **Read this first when working on ColdLight.**
> **The owner is in charge. ColdLight serves the owner's vision.**

---

## The One Rule

**ADR-001 is the source of truth. Read `design/ADR-001-STYLE-MACRO.md`.**

---

## 2-Layer Enterprise Pattern (LOCKED)

| Layer | Folder | What |
|-------|--------|------|
| **Primitive Hook** | `primitives/{kind}/` | Behavior. WAI-ARIA APG. ARIA, keyboard, focus, state. NO styling. |
| **Component** | `components/{kind}/` | THE PRODUCT. Hook + StyleMacro in ONE file. What users import. |

**There is NO `ui/` folder. NO dumb middle layer. The component IS the product.**

### Component Pattern

```svelte
<script lang="ts">
  import { useButton } from "$lib/design/primitives/button/index.js";
  import { StyleMacro } from "$lib/design/style/index.js";
  // no schema import needed — def is in component-map

  const button = $derived(useButton({ disabled, loading, pressed }));
  const styleId = $derived(`button-${intent}`);
</script>
<StyleMacro kind="button" style={styleId}>
  <button {...button.root} class="{SIZE[size]} {className}">
    {@render children?.()}
  </button>
</StyleMacro>
```

## 11-Axis Visual System

backgroundColor (color), backgroundBlur (dimension), shadow (shadow), border (border), animation (duration), transition (transition), typography (typography), gradient (gradient), color (color), borderRadius (dimension), opacity (number)

All composites expand. No shorthand. StyleMacro assembles in `$derived.by`.

## Key Files

| File | Purpose |
|------|---------|
| `ADR-001-STYLE-MACRO.md` | THE architecture. Read first. |
| `style/StyleMacro.svelte` | Visual provider |
| `style/macro-mappings.ts` | 11 axes → --cl-* vars |
| `components/_base/types.ts` | ComponentProps + ComponentDef + SlotAxes |
| `components/_base/component-map.ts` | Const map, getComponentDef() |
| `schema/anatomy.schema.ts` | createAnatomy for primitives |
| `generated/macro-base.css` | Glue CSS — [data-kind] consumes --cl-* |

## Banned

- `ui/` folder — deleted, over-engineered
- `useColdLight()` — deleted
- `registerRecipe()` — deleted
- `recipes/` folder — deleted
- `registry/` folder — deleted
- Zod component schemas — deleted, use const literal + ComponentDef
- `.schema.ts` files in components — deleted
- `.props.ts` files in primitives — deleted
- `.svelte` components in primitives — deleted, hooks only
- JS `recipe.ts` in component folders — deleted
- `ColdLightProps` / `PreparedComponentProps` — deleted
- Hardcoded colors in components — never
- Shorthand transforms in SD5 — removed
- Direct `@melt-ui/svelte` imports
- `any` types
- jsdom testing
- Inventing CSS variable names without checking SD5 output

---

**ColdLight is the public API. The owner directs ColdLight. ColdLight directs everything else.**
