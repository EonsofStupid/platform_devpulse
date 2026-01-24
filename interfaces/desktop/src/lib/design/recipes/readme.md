# ColdLight Recipes

> **Reusable visual presets for styling primitives.**
>
> Recipes are NOT components. They are CSS patterns that ANY element can consume.

---

## Architecture

```
Primitives (behavior) + Recipes (appearance) = Styled UI
```

| Layer | Responsibility | Example |
|-------|---------------|---------|
| **Primitives** | Behavior, ARIA (via Melt UI) | `dialog.svelte` |
| **Recipes** | Visual styling | `data-surface="glass"` |
| **Semantics** | Composed styled components | `MainButton.svelte` |

---

## How Recipes Work

Recipes are CSS rules keyed off `data-*` attributes:

```css
/* Base surface */
.dp-surface { ... }

/* Surface type */
.dp-surface[data-surface="glass"] { ... }
.dp-surface[data-surface="matte"] { ... }
.dp-surface[data-surface="solid"] { ... }

/* Modifiers */
.dp-surface[data-glow="teal"] { ... }
.dp-surface[data-bevel="subtle"] { ... }
```

---

## Using Recipes

Components CONSUME recipes — they don't own styling:

```svelte
<!-- Primitive + Recipe = Styled Component -->
<button
  use:melt={$trigger}
  class="dp-surface"
  data-kind="dialog"
  data-slot="trigger"
  data-surface="glass"
  data-glow="teal"
>
  Open Dialog
</button>
```

---

## Surface Types

### Glass

Semi-transparent with backdrop blur.

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

Solid, non-transparent surface.

```svelte
<div class="dp-surface" data-surface="matte">
  Matte surface
</div>
```

### Solid

Opaque surface using the surface scale.

```svelte
<div class="dp-surface" data-surface="solid" data-depth="2">
  Solid surface
</div>
```

---

## Modifiers

### Glow

| Glow | Attribute | Color |
|------|-----------|-------|
| Teal | `data-glow="teal"` | Teal |
| Purple | `data-glow="purple"` | Purple |
| Magenta | `data-glow="magenta"` | Magenta |
| Ember | `data-glow="ember"` | Orange |
| Frost | `data-glow="frost"` | Ice blue |
| Cyber | `data-glow="cyber"` | Neon green |

### Bevel

| Bevel | Attribute | Effect |
|-------|-----------|--------|
| Subtle | `data-bevel="subtle"` | Light outset |
| Soft | `data-bevel="soft"` | Outset + shadow |
| Medium | `data-bevel="medium"` | Imprint |
| Inset | `data-bevel="inset"` | Sunken |
| Deep | `data-bevel="deep"` | Strong inset |

---

## Actions (Interactive Effects)

Some recipes require Svelte actions for dynamic effects:

```svelte
<script>
  import { ripple, glowTrack } from '$lib/design/recipes/actions';
</script>

<button use:ripple class="dp-surface" data-surface="glass">
  Ripple effect
</button>

<div use:glowTrack class="dp-surface" data-surface="glass">
  Glow follows cursor
</div>
```

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
└── readme.md             # This file
```

---

## Rules

1. **Recipes are reusable** — library of presets, not component-specific
2. **Components consume recipes** — via `class` and `data-*` attributes
3. **No CSS in components** — all styling comes from recipes
4. **Token references only** — use `var(--dp-*)`, never raw values
5. **Generated CSS** — `surfaces.gen.css` is generated from tokens

---

## Recipe vs Primitive vs Semantic

| Layer | What It Is | Owns |
|-------|-----------|------|
| **Primitive** | Melt UI wrapper | data-kind, data-slot, data-state |
| **Recipe** | CSS patterns | class, data-surface, data-glow |
| **Semantic** | Styled component | Combines primitive + recipe |

**Example flow:**

```
dialog.svelte (primitive)
    + dp-surface + data-surface="glass" (recipe)
    = GlassDialog.svelte (semantic)
```

---

## Checklist

### Before Adding a Recipe

- [ ] Verify tokens exist in `tokens/tokens.ts`
- [ ] Determine surface type (glass, matte, solid)
- [ ] Determine modifiers needed (glow, bevel, etc.)
- [ ] Check for existing similar recipe

### File Requirements

- [ ] CSS uses only `var(--dp-*)` token references
- [ ] No raw color values (`#fff`, `oklch()`, `rgb()`)
- [ ] Uses `data-*` attribute selectors
- [ ] Documented in this README
- [ ] Added to `surface.registry.ts` if new surface

### Auto-Documentation

When recipe CSS is generated:
1. Vite plugin reads `tokens/tokens.ts`
2. Generates `css/surfaces.gen.css`
3. Updates registry with new tokens
4. Docusaurus picks up changes

---

**This is the canonical recipe system.**
