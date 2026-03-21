# ADR-001: StyleMacro — ColdLight Visual Resolution Architecture

**Status:** ACCEPTED
**Date:** 2026-03-21
**Replaces:** useColdLight(), resolveVisual() per-component pattern

---

## Decision

All visual resolution in ColdLight flows through a single `<StyleMacro>` component that produces CSS custom properties. Components are dumb — structure + ARIA only. The macro wraps them and sets `--cl-*` vars that the browser's CSS engine resolves natively.

## Context

The previous architecture (`useColdLight()` + `resolveVisual()` per component) had critical problems:

1. **Per-component execution** — 1000 components = 1000 `resolveVisual()` calls on theme change
2. **Getter hack anti-pattern** — wrapping every property in `get x() { return resolved.x }` to preserve Svelte 5 reactivity, a known early-runes mistake
3. **`cn()` in `$derived` per component** — string concatenation + deduplication running reactively on every DOM node
4. **Components know about styling** — importing recipes, computing classes, managing visual state

## Architecture

### Three Files

```
design/style/
  base-state.svelte.ts      — $state global reactive theme state (~20 lines)
  macro-mappings.ts          — static dictionary, token prop → CSS var mapping (~50 lines)
  StyleMacro.svelte          — the component, $derived.by resolver (~60 lines)
```

### Layer Model

```
DTCG JSON Tokens
  → SD5 build → CSS custom properties + Tailwind @theme
    → Compiled Base (build-time: pulls all colocated *.visual.ts)
      → StyleMacro (runtime: base → kind → local override resolution)
        → CSS custom properties on wrapper div
          → Browser CSS engine resolves + paints
            → Dumb components render structure + ARIA
```

### Resolution Order (later wins)

1. **Global base** — `platformBase.globalTokens` ($state, VPB can update)
2. **Kind defaults** — `compiledBase[kind]` (build-time compiled from colocated visual files)
3. **Local overrides** — `localOverrides` prop on StyleMacro instance

```ts
const value = local[key] ?? kindDefaults[key] ?? baseTokens[key];
```

### Colocated Visual Extensions

Every component declares its visual defaults in a colocated file:

```ts
// components/badge/badge.visual.ts
import type { StyleMacroProps } from "$lib/design/style/macro-mappings.js";

export const badgeVisual = {
  backgroundColor: "accent-teal",
  borderRadius: "full",
  padding: "xs",
  fontSize: "xs",
} satisfies Partial<StyleMacroProps>;
```

At build time, all `*.visual.ts` files compile into one static map:

```ts
// design/style/compiled-base.ts (generated)
export const compiledBase: Record<string, Partial<StyleMacroProps>> = {
  badge: { backgroundColor: "accent-teal", borderRadius: "full", ... },
  card: { backgroundColor: "layer-1", borderRadius: "lg", ... },
  // ... every component
};
```

### Runtime Override

```svelte
<!-- Base visual for all badges -->
<StyleMacro kind="badge">
  <Badge.Root>Default teal badge</Badge.Root>
</StyleMacro>

<!-- This specific badge gets purple — no recompile, CSS var swap only -->
<StyleMacro kind="badge" localOverrides={{ backgroundColor: "accent-purple" }}>
  <Badge.Root>Purple badge</Badge.Root>
</StyleMacro>
```

### VPB Integration

StyleMacro emits data attributes for VPB to read:

```html
<div
  data-macro-id="pulseos-default"
  data-macro-kind="badge"
  data-encoding="s3d1b1"
  style="--cl-bg: var(--color-pulseos-default-accent-teal); --cl-radius: var(--radius-full); ..."
>
  <!-- dumb component inside -->
</div>
```

VPB pushes updates via custom event:

```ts
window.dispatchEvent(new CustomEvent('vpb:style-update', {
  detail: { newStyleId: 'dark-mode', newTokens: { backgroundColor: 'layer-2' } }
}));
```

`platformBase` $state reacts. ONE macro re-resolves. Browser repaints.

### SVG Filters

The macro mapping dictionary includes SVG filter resolution:

```ts
export const propMappings = {
  // ... color, spacing, etc.
  bevel: { varName: '--cl-bevel', category: 'bevel', svgFilter: true },
  glow:  { varName: '--cl-glow',  category: 'glow',  svgFilter: true },
};
```

When `svgFilter: true`, the macro also emits a filter class on the wrapper:

```ts
if (mapping.svgFilter && value) {
  filterClasses += `filter-${mapping.category}-${value} `;
}
```

### Encoding Serialization

The macro produces an encoding string for VPB persistence:

```ts
// Inside $derived.by
let encodingParts = '';
for (let i = 0; i < macroKeys.length; i++) {
  const key = macroKeys[i];
  const value = local[key] ?? kindDefaults[key] ?? baseTokens[key];
  if (value && mapping.encodingCode) {
    encodingParts += `${mapping.encodingCode}${valueIndex} `;
  }
}
```

Emitted as `data-encoding` on the wrapper div.

## What Gets Deleted

| File/Pattern | Why |
|---|---|
| `useColdLight()` | Per-component hook. Replaced by macro. |
| `resolveVisual()` | Resolution logic moves into macro's `$derived.by`. |
| `components/_base/use-coldlight.svelte.ts` | The hook file itself. |
| `cn()` in component `$derived` blocks | Components don't compute classes. |
| Recipe imports in components | Components are dumb. UI/macro handles styling. |
| `visual.segments` class approach | CSS vars instead. |
| Getter hack return objects | `$derived.by` returns a plain string. |

## What Stays

| Asset | Why |
|---|---|
| `token-categories.ts` | 8-axis registry data. Macro mappings derive from this. |
| `presets.ts` | Named compositions. Macro resolves presets. |
| `recipes/` | Per-kind class generation for structural layout (flex, grid, padding). Separate from visual. |
| DTCG JSON tokens | Source of truth. Unchanged. |
| SD5 pipeline | Generates CSS vars the macro references. |
| Component contracts | ARIA, slots, states. Unchanged. |
| Primitive hooks | Behavioral ARIA. Unchanged. |

## What Recipes Become

Recipes shift from "visual + structural" to "structural only":
- Layout: flex, grid, gap, padding
- Typography: font size, weight, line height
- NOT: surface colors, depth shadows, glow effects, bevel

Visual treatment comes from the macro. Structural layout comes from recipes.
Components accept both `class` (from recipe/structural) and the macro's CSS vars (for visual).

## Component Pattern (Post-Macro)

```svelte
<!-- Component: DUMB -->
<script lang="ts">
  let { children, class: className, ...rest } = $props();
</script>
<div data-kind="badge" data-slot="root" class={className} {...rest}>
  {@render children?.()}
</div>
```

```svelte
<!-- Consumer: StyleMacro wraps -->
<StyleMacro kind="badge">
  <Badge.Root class="inline-flex items-center">
    Active
  </Badge.Root>
</StyleMacro>
```

## Performance

| Metric | Old (useColdLight) | New (StyleMacro) |
|---|---|---|
| Theme change with 1000 components | 1000 resolveVisual() + 1000 cn() + 1000 DOM class updates | 1 $derived.by + 1 style attribute + browser CSS cascade |
| Object allocations per update | 1000 ResolvedVisual objects | 0 (string concatenation only) |
| Memory | Getter-wrapped objects per component | One $state + one string per macro instance |

## Consequences

- Every component authored before this ADR needs `useColdLight()` removed
- Components become simpler — fewer imports, no visual logic
- StyleMacro must be built and tested before further component work
- The compiled-base build step must be created
- VPB reads `data-encoding` + `data-macro-kind` instead of component-level encoding

---

## Decision Record

**Decided by:** Owner
**Rationale:** Per-component visual resolution is a known Svelte 5 anti-pattern. CSS custom properties + browser cascade is the correct approach for scale. The StyleMacro pattern eliminates 95% of the visual resolution code while improving performance by orders of magnitude.
**Irreversible:** Yes. This is the visual architecture. No going back to per-component hooks.
