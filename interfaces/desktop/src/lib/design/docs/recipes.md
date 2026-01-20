# ColdLight Recipes

> Recipe system reference for @devpulse/coldlight

---

## Overview

Recipes are CSS rules that style surfaces via data attributes. They consume tokens and produce visual output.

**Key principle**: Components don't style themselves — they apply recipe output via `class` and `data-*` attributes.

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

**Variants** (darkness levels):

| Variant | Attribute | Description |
|---------|-----------|-------------|
| Void | `data-variant="void"` | Darkest, near-black |
| Deep | `data-variant="deep"` | Default depth |
| Smoke | `data-variant="smoke"` | Slightly lighter |
| Frost | `data-variant="frost"` | Lightest, frosted |

```svelte
<div class="dp-surface" data-surface="glass" data-variant="frost">
  Frosted glass
</div>
```

### Matte

Solid, non-transparent surface with subtle depth.

```svelte
<div class="dp-surface" data-surface="matte">
  Matte surface
</div>
```

**Variants**:

| Variant | Attribute | Description |
|---------|-----------|-------------|
| Dark | (default) | Darkest matte |
| Mid | `data-variant="mid"` | Medium matte |
| Light | `data-variant="light"` | Lightest matte |

### Solid

Opaque surface using the surface scale.

```svelte
<div class="dp-surface" data-surface="solid">
  Solid surface
</div>
```

**Depth levels**:

| Depth | Attribute | Description |
|-------|-----------|-------------|
| 1 | `data-depth="1"` | Deepest/base |
| 2 | `data-depth="2"` | Panel/sunken |
| 3 | `data-depth="3"` | Raised/card |
| 4 | `data-depth="4"` | Overlay/pop |

---

## Role Modifiers

Roles define the semantic function of a surface.

### Button

```svelte
<button class="dp-surface" data-surface="glass" data-role="button">
  Click me
</button>
```

- Adds cursor pointer
- Hover lift effect
- Active press effect

**Button variants**:

| Variant | Attribute | Description |
|---------|-----------|-------------|
| Default | (none) | Standard button |
| Primary | `data-variant="primary"` | Primary action |

### Input

```svelte
<div class="dp-surface" data-surface="glass" data-role="input">
  <input type="text" />
</div>
```

- Focus glow effect
- Distinct border styling

### Panel

```svelte
<div class="dp-surface" data-surface="glass" data-role="panel">
  Panel content
</div>
```

- Gradient overlay
- Hover border glow
- Inner gradient (teal by default)

**Panel accent**:

```svelte
<div class="dp-surface" data-surface="glass" data-role="panel" data-accent="purple">
  Purple gradient panel
</div>
```

### Scrim

```svelte
<div class="dp-surface" data-surface="glass" data-role="scrim">
  Modal backdrop
</div>
```

- Heavy backdrop blur
- Used for modal overlays

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
<button class="dp-surface" data-surface="glass" data-role="button" data-glow="cyber">
  Cyber glow button
</button>
```

---

## Bevel Modifiers

Add depth via inset/outset edges.

| Bevel | Attribute | Effect |
|-------|-----------|--------|
| Subtle | `data-bevel="subtle"` | Light outset |
| Soft | `data-bevel="soft"` | Outset + shadow |
| Medium | `data-bevel="medium"` | Imprint + shadow |
| Inset | `data-bevel="inset"` | Sunken edges |
| Deep | `data-bevel="deep"` | Strong inset |
| Pressed | `data-bevel="pressed"` | Active/pressed look |

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
  data-role="panel"
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

Add ripple on click:

```svelte
<script>
  import { ripple } from '@devpulse/coldlight/recipes/actions';
</script>

<button use:ripple class="dp-surface" data-surface="glass" data-role="button">
  Ripple button
</button>
```

### Glow Tracking

Track mouse for dynamic glow position:

```svelte
<script>
  import { glowTrack } from '@devpulse/coldlight/recipes/actions';
</script>

<div use:glowTrack class="dp-surface" data-surface="glass" data-role="panel">
  Glow follows cursor
</div>
```

---

## Generated CSS

Recipe CSS is generated from `tokens.ts` by the Vite plugin.

**Output**: `recipes/css/surfaces.gen.css`

**Never hand-edit this file.**

---

## Adding New Recipes

1. Define the pattern in the Vite plugin's `generateRecipeCSS()` function
2. Reference only `var(--dp-*)` tokens
3. Use `data-*` attributes for variants
4. Document in this file
