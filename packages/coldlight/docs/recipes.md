# ColdLight Recipes

> Recipe system reference for @devpulse/coldlight

---

## Overview

Recipes are CSS rules that style surfaces via data attributes. They consume tokens and produce visual output.

**Key principle**: Components don't style themselves — they apply recipe output via `class` and `data-*` attributes.

---

## Architecture

```
Primitives (behavior) + Recipes (appearance) = Styled UI
```

| Layer | What It Does |
|-------|-------------|
| **Primitives** | ARIA, focus, keyboard (via Melt UI) |
| **Recipes** | Visual styling via CSS |
| **Semantics** | Combined primitive + recipe |

---

## Base Pattern

Every styled surface uses the `dp-surface` class:

```svelte
<div class="dp-surface" data-surface="glass">
  Content
</div>
```

---

## Surface Types

### Glass

Semi-transparent with backdrop blur. The default ColdLight surface.

```svelte
<div class="dp-surface" data-surface="glass">
  Glass surface
</div>
```

**Variants** (clarity levels):

| Variant | Attribute | Description |
|---------|-----------|-------------|
| Void | `data-variant="void"` | Darkest, near-black |
| Deep | `data-variant="deep"` | Default depth |
| Smoke | `data-variant="smoke"` | Slightly lighter |
| Frost | `data-variant="frost"` | Lightest, frosted |

### Matte

Solid, non-transparent surface with subtle depth.

```svelte
<div class="dp-surface" data-surface="matte">
  Matte surface
</div>
```

**Variants**:

| Variant | Description |
|---------|-------------|
| Dark | Darkest matte (default) |
| Mid | Medium matte |
| Light | Lightest matte |

### Solid

Opaque surface using the surface scale.

```svelte
<div class="dp-surface" data-surface="solid">
  Solid surface
</div>
```

**Depth levels**:

| Depth | Description |
|-------|-------------|
| 1 | Deepest/base |
| 2 | Panel/sunken |
| 3 | Raised/card |
| 4 | Overlay/pop |

---

## Glow Modifiers

Add accent glow to any surface.

| Glow | Attribute | Color |
|------|-----------|-------|
| Teal | `data-glow="teal"` | Teal glow |
| Purple | `data-glow="purple"` | Purple glow |
| Magenta | `data-glow="magenta"` | Magenta glow |
| Ember | `data-glow="ember"` | Orange/ember glow |
| Frost | `data-glow="frost"` | Ice blue glow |
| Cyber | `data-glow="cyber"` | Neon green glow |

```svelte
<button class="dp-surface" data-surface="glass" data-glow="cyber">
  Cyber glow button
</button>
```

---

## Bevel Modifiers

Add depth via inset/outset edges.

| Bevel | Effect |
|-------|--------|
| Subtle | Light outset |
| Soft | Outset + shadow |
| Medium | Imprint + shadow |
| Inset | Sunken edges |
| Deep | Strong inset |
| Pressed | Active/pressed look |

```svelte
<div class="dp-surface" data-surface="matte" data-bevel="deep">
  Deep bevel panel
</div>
```

---

## Combining Modifiers

Modifiers can be combined:

```svelte
<div
  class="dp-surface"
  data-surface="glass"
  data-variant="deep"
  data-glow="teal"
  data-bevel="subtle"
>
  Fully styled panel
</div>
```

---

## Actions

Some recipes require JavaScript actions for interactive effects.

### Ripple Effect

```svelte
<script>
  import { ripple } from '#coldlight/recipes/actions';
</script>

<button use:ripple class="dp-surface" data-surface="glass">
  Ripple button
</button>
```

### Glow Tracking

```svelte
<script>
  import { glowTrack } from '#coldlight/recipes/actions';
</script>

<div use:glowTrack class="dp-surface" data-surface="glass">
  Glow follows cursor
</div>
```

---

## Generated CSS

Recipe CSS is generated from `tokens.ts` by the Vite plugin.

**Output**: `recipes/css/surfaces.gen.css`

**Never hand-edit this file.**

---

## File Structure

```
recipes/
├── index.ts              # Recipe registry
├── css/
│   ├── keyframes.css     # Animation keyframes (ONLY manual CSS)
│   └── surfaces.gen.css  # GENERATED from tokens
├── actions/
│   ├── index.ts          # Action exports
│   ├── ripple.ts         # Ripple effect
│   └── glowTrack.ts      # Glow tracking
└── readme.md             # Documentation
```

---

## Adding New Recipes

1. Define the pattern in Vite plugin's `generateRecipeCSS()` function
2. Reference only `var(--*)` tokens
3. Use `data-*` attributes for variants
4. Document in `docs/recipes.md`

---

**This is the canonical recipe reference.**
