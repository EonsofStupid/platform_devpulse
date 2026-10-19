# Claude Instructions for ColdLight

> **Read this first when working on ColdLight.**
> **The owner is in charge. ColdLight serves the owner's vision.**

---

## The One Rule

**ADR-001 is the source of truth. Read `design/ADR-001-RENDER-FORGE.md`.**

---

## 2-Layer Enterprise Pattern (LOCKED)

| Layer | Folder | What |
|-------|--------|------|
| **BEHAVIORS Hook** | `behaviors/{kind}/` | Behavior. WAI-ARIA APG. ARIA, keyboard, focus, state. NO styling. |
| **Component** | `components/{kind}/` | THE PRODUCT. Hook + RenderForge in ONE file. What users import. |

**There is NO `ui/` folder. NO dumb middle layer. The component IS the product.**

### Component Pattern

```svelte
<script lang="ts">
  import { useButton } from "#coldlight/primitives/button/index.js";
  import { renderForge, cssVarString } from "#coldlight/renderforge/index.js";

  let { preset = 'primary', disabled = false, children } = $props();
  const state = $derived(disabled ? 'disabled' : 'default');
  const m = $derived(renderForge({ kind: 'button', preset, state }));
</script>
<button {...m.dataAttrs} style={cssVarString(m.cssVars)} {disabled}>
  {@render children()}
</button>
```

## 20-Axis Visual System

See `RenderForge.md` for the full 20-axis table.
6 families: surface, frame, text, overlay, interactive, layout.
Motion axes are universal (not family-gated).

## Key Files

| File | Purpose |
|------|---------|
| `ADR-001-RENDER-FORGE.md` | THE architecture. Read first. |
| `RenderForge.md` | 20-axis spec, 6 laws, glue CSS. |
| `renderforge/render.ts` | Pure resolver — `renderForge()` |
| `renderforge/index.ts` | Public API barrel |
| `renderforge/intent.ts` | Shared intent resolution (Law 6) |
| `components/_base/types.ts` | ComponentProps + ComponentDef + SlotAxes |
| `generated/render-base.css` | Glue CSS — `[data-kind]` + `[data-cl-*]` consume vars |

## Banned

- `ui/` folder — deleted, over-engineered
- `useColdLight()` — deleted
- `registerRecipe()` — deleted
- `recipes/` folder — deleted
- `registry/` folder — deleted
- `style-macro/` folder — renamed to `renderforge/`
- `StyleMacro` — renamed to `renderForge()`
- `resolveMacro()` — renamed to `renderForge()`
- Zod component schemas — deleted, use const literal + ComponentDef
- `.schema.ts` files in components — deleted
- `.props.ts` files in primitives — deleted
- `.svelte` components in primitives — deleted, hooks only
- JS `recipe.ts` in component folders — deleted
- `ColdLightProps` / `PreparedComponentProps` — deleted
- Hardcoded colors in components — never
- Shorthand transforms in SD5 — removed
- Third-party headless UI libraries in product code
- `any` types
- jsdom testing
- Inventing CSS variable names without checking SD5 output

---

**ColdLight is the public API. The owner directs ColdLight. ColdLight directs everything else.**
