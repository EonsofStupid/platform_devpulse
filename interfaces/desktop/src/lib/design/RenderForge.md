# ColdLight Enterprise Macro Law
## Final Architectural Specification — March 2026 (Updated: Canonical Axis Rename)

This document defines the immutable rules governing how every ColdLight component
is styled, resolved, and composed. No exceptions. No "v2 migrations." No hedging.

These rules exist so that:

- Every component follows one pattern
- AI systems generating components produce consistent output
- Contributors have zero ambiguity about how styling works
- The system is inspectable, teachable, and predictable at 145+ components
- Layman users can learn the system by inspecting the DOM

---

## The 20 Canonical Axes

ColdLight resolves 20 CSS custom properties per component. No prefix.
Full CSS property names or design-industry standard terms.
SSOT: `var-to-family.ts` AXIS_REGISTRY.

### The Formula: DTCG Token → CSS Var → CSS Output

```
DTCG JSON token ($type + $value)
  → Style Dictionary 5 transform
  → CSS custom property (the var name below)
  → render-base.css glue reads var()
  → browser paints the CSS property
```

Every column below is a 1:1 mapping. Zero ambiguity.

### SURFACE family — the container's skin

| # | DTCG `$type` | CSS Var (what you write) | CSS Property (what browser paints) | Design Term | Layman Label |
|---|---|---|---|---|---|
| 1 | `color` | `--background-color` | `background-color` | Fill | Background Color |
| 2 | `shadow` | `--box-shadow` | `box-shadow` | Elevation | Shadow & Depth |
| 3 | `color` | `--border-color` | `border-color` | Stroke Color | Border Color |
| 4 | `gradient` | `--gradient` | `background-image` | Gradient Fill | Gradient |
| 5 | `string` | `--background-image` | `background-image` | Surface Image | Background Image |
| 6 | `number` | `--background-alpha` | oklch alpha channel | Fill Opacity | Background Transparency |

### FRAME family — the container's shape

| # | DTCG `$type` | CSS Var (what you write) | CSS Property (what browser paints) | Design Term | Layman Label |
|---|---|---|---|---|---|
| 7 | `dimension` | `--border-width` | `border-width` | Stroke Width | Border Thickness |
| 8 | `string` | `--border-style` | `border-style` | Stroke Style | Border Style |
| 9 | `dimension` | `--border-radius` | `border-radius` | Corner Radius | Roundness |

### TEXT family — typography

| # | DTCG `$type` | CSS Var (what you write) | CSS Property (what browser paints) | Design Term | Layman Label |
|---|---|---|---|---|---|
| 10 | `color` | `--color` | `color` | Foreground | Text Color |
| 11 | `string` | `--font-family` | `font-family` | Typeface | Font |
| 12 | `dimension` | `--font-size` | `font-size` | Size | Text Size |
| 13 | `number` | `--font-weight` | `font-weight` | Weight | Text Weight |
| 14 | `dimension` | `--tracking` | `letter-spacing` | Tracking | Letter Spacing |
| 15 | `dimension` | `--leading` | `line-height` | Leading | Line Height |

### OVERLAY family — layering & glass

| # | DTCG `$type` | CSS Var (what you write) | CSS Property (what browser paints) | Design Term | Layman Label |
|---|---|---|---|---|---|
| 16 | `string` | `--backdrop-filter` | `backdrop-filter` | Glass Blur | Glass Effect |

### MOTION — universal, not family-gated

| # | DTCG `$type` | CSS Var (what you write) | CSS Property (what browser paints) | Design Term | Layman Label |
|---|---|---|---|---|---|
| 17 | `number` | `--opacity` | `opacity` | Opacity | Transparency |
| 18 | `string` | `--animation` | `animation` | Animation | Animation |
| 19 | `duration` | `--transition-duration` | `transition-duration` | Duration | Speed |
| 20 | `string` | `--transition-timing` | `transition-timing-function` | Easing | Easing |

### Composite DTCG Types (SD5 expands these)

| DTCG Composite | Expands To | Axes Produced |
|---|---|---|
| `shadow` | `color` + `offsetX` + `offsetY` + `blur` + `spread` | `--box-shadow` (assembled) |
| `border` | `color` + `width` + `style` | `--border-color` + `--border-width` + `--border-style` |
| `typography` | `fontFamily` + `fontSize` + `fontWeight` + `letterSpacing` + `lineHeight` | `--font-family` + `--font-size` + `--font-weight` + `--tracking` + `--leading` |
| `transition` | `duration` + `timingFunction` + `delay` | `--transition-duration` + `--transition-timing` |
| `gradient` | array of `{ color, position }` stops | `--gradient` (assembled) |

### What Tailwind Owns (NOT axes — structural layout)

| Concern | Tailwind Class Examples | Why Not an Axis |
|---|---|---|
| Display | `flex`, `grid`, `block`, `hidden` | Structural, not visual |
| Direction | `flex-row`, `flex-col` | Structural |
| Justify/Align | `justify-center`, `items-center` | Structural |
| Gap | `gap-2`, `gap-4` | Spacing scale |
| Padding | `px-3`, `py-2`, `p-4` | Spacing scale |
| Margin | `mt-4`, `mb-2`, `mx-auto` | Spacing scale |
| Width/Height | `w-full`, `h-16`, `min-h-screen` | Sizing |
| Position | `relative`, `absolute`, `fixed` | Structural |
| Grid | `grid-cols-12`, `col-span-8` | Structural |
| Aspect Ratio | `aspect-video`, `aspect-square` | Structural |
| Overflow | `overflow-hidden`, `overflow-y-auto` | Behavioral |

**20 axes own visual appearance. Tailwind owns layout. Zero overlap.**

---

## Law 1: One Public Styling Path — The Pure Resolver

### Rule

Every component calls `renderForge()`. There is no second path.

### Contract

```typescript
// ── Input: what the component provides ──────────────────
interface MacroInput {
  kind: string;           // scoped kind string (see Law 3)
  preset?: string;        // defaults to 'primary'
  state?: MacroState;     // runtime state only
}

type MacroState = 'default' | 'disabled' | 'active';

// ── Output: sealed contract, no escape hatches ──────────
interface ResolvedMacro {
  kind: string;
  dataAttrs: {
    'data-kind': string;
    [key: `data-cl-${string}`]: '';  // family markers
  };
  cssVars: Record<string, string>;   // canonical axis names
}

function renderForge(input: MacroInput): ResolvedMacro;
```

### Resolution Chain

```
var(--style-{kind}-{preset}-{axis},    ← per-kind VPB override
    var(--preset-{preset}-{axis},      ← shared preset default
        {fallback}))                    ← absolute fallback
```

### Why No Axis Props on Components

Components do NOT accept `intent`, `tone`, `density`, or `emphasis` as individual
props. Those axes exist at the preset authoring layer (build time, token definitions).
The component selects a preset by name. The preset IS the pre-composed recipe.

```svelte
<!-- WRONG: component decomposes visual axes -->
<Button intent="teal" density="compact" tone="muted" emphasis="high">Save</Button>

<!-- RIGHT: component selects a preset -->
<Button preset="compact-teal-muted">Save</Button>

<!-- RIGHT: default preset -->
<Button>Save</Button>
```

### Canonical Component Pattern

```svelte
<script lang="ts">
  import { renderForge, cssVarString } from '$lib/design/renderforge';

  interface Props {
    preset?: string;
    disabled?: boolean;
    children: import('svelte').Snippet;
  }

  let { preset = 'primary', disabled = false, children }: Props = $props();
  const state = $derived(disabled ? 'disabled' : 'default');
  const m = $derived(renderForge({ kind: 'button', preset, state }));
</script>

<button {...m.dataAttrs} style={cssVarString(m.cssVars)} {disabled}>
  {@render children()}
</button>
```

### The Format Helper

```typescript
export function cssVarString(vars: Record<string, string>): string {
  let s = '';
  for (const k in vars) {
    if (s) s += ';';
    s += `${k}:${vars[k]}`;
  }
  return s;
}
```

### What Components MUST NOT Do

```svelte
<!-- FORBIDDEN: style prop passthrough -->
<Button preset="teal" style="--background-color: red;">

<!-- FORBIDDEN: className override for visual concerns -->
<Button preset="teal" class="my-custom-bg">
```

The component's style attribute contains ONLY what the resolver returned.

---

## Law 2: No Wrapper Elements. Ever.

### Rule

The styled element IS the semantic root. No exceptions.

```
✓ <button data-kind="button" style="--background-color:...">
✓ <a data-kind="link" style="--color:...">
✓ <dialog data-kind="dialog" style="--background-color:...">
✓ <nav data-kind="nav-rail" style="--background-color:...">
✓ <input data-kind="input" style="--border-color:...">

✗ <div class="button-wrapper"><button>...</button></div>
✗ <div class="dialog-chrome"><dialog>...</dialog></div>
```

### Consequences

- `data-kind` goes on the semantic root
- `data-cl-*` family markers go on the semantic root
- CSS custom properties go on the semantic root via `style={cssVarString(m.cssVars)}`
- State selectors (`:hover`, `:focus-visible`, `:disabled`) target the semantic root
- Layout parent sees the semantic root directly

### Complex Shells

Layers are CHILD elements inside the semantic root, not a wrapper around it:

```svelte
<dialog {...m.dataAttrs} style={cssVarString(m.cssVars)}>
  <div class="dialog-frame">
    <header class="dialog-header">{@render header?.()}</header>
    <div class="dialog-body">{@render children()}</div>
  </div>
</dialog>
```

---

## Law 3: One Root = One Resolved Preset

### Rule

A component gets one root, one `renderForge()` call, one visual contract.

### Scoped Kind Strings

- Top-level: `button`, `badge`, `separator`
- Sub-components: `card/header`, `card/body`, `card/footer`

```html
<article data-kind="card" data-cl-surface data-cl-frame>
  <header data-kind="card/header" data-cl-text>
    ...
  </header>
</article>
```

### Composite Components

Each sub-element is independently resolved:

```svelte
<article {...m.dataAttrs} style={cssVarString(m.cssVars)}>
  {#if header}
    <CardHeader {preset}>{@render header()}</CardHeader>
  {/if}
  <CardBody {preset}>{@render children()}</CardBody>
</article>
```

---

## Law 4: No Visual Context Inheritance

### Rule

A parent NEVER implicitly influences a child's visual resolution.
Preset flows through snippet parameters, not context:

```svelte
<Toolbar preset="compact">
  {#snippet children({ preset })}
    <Button {preset}>Cut</Button>
    <Button {preset}>Copy</Button>
    <Separator {preset} />
  {/snippet}
</Toolbar>
```

Context IS fine for behavioral concerns (form state, navigation, keyboard scope).
Context must NOT carry visual styling dependencies.

---

## Law 5: Family-Split Glue CSS (Derived)

### Rule

CSS property binding is split by visual family. Components receive
only the families their preset uses. Families derived at build time.

### The Families (must match render-base.css and resolve.ts EXACTLY)

```css
/* ── Universal: every [data-kind] element ──────────────── */
[data-kind] {
  box-sizing: border-box;
  transition-duration: var(--transition-duration, 150ms);
  transition-timing-function: var(--transition-timing, ease-out);
  transition-property: background-color, border-color, box-shadow, color, opacity, filter;
  opacity: var(--opacity, 1);
  animation: var(--animation, none);
}

/* ── Surface: background, borders, shadows ─────────────── */
[data-cl-surface] {
  background-color: var(--background-color, transparent);
  border-color: var(--border-color, transparent);
  box-shadow: var(--box-shadow, none);
  background-image: var(--gradient, none);
}

/* ── Text: typography properties ───────────────────────── */
[data-cl-text] {
  color: var(--color, inherit);
  font-family: var(--font-family, inherit);
  font-size: var(--font-size, inherit);
  font-weight: var(--font-weight, inherit);
  letter-spacing: var(--tracking, 0);
  line-height: var(--leading, inherit);
}

/* ── Frame: dimensional properties ─────────────────────── */
[data-cl-frame] {
  border-radius: var(--border-radius, 0);
  border-width: var(--border-width, 0);
  border-style: var(--border-style, solid);
}

/* ── Interactive: behavioral visual properties ─────────── */
[data-cl-interactive] {
  cursor: pointer;
  outline-offset: var(--focus-offset, 2px);
  -webkit-tap-highlight-color: transparent;
}
[data-cl-interactive]:focus-visible {
  outline: 2px solid var(--focus-ring, currentColor);
  outline-offset: var(--focus-offset, 2px);
}
[data-cl-interactive]:disabled,
[data-cl-interactive][aria-disabled="true"] {
  cursor: not-allowed;
  pointer-events: none;
}
[data-cl-interactive]:hover {
  filter: var(--hover-filter, brightness(1.1));
}
[data-cl-interactive]:active {
  filter: var(--active-filter, brightness(0.9));
}

/* ── Layout: spacing and flow ──────────────────────────── */
[data-cl-layout] {
  gap: var(--gap);
}

/* ── Overlay: layering and backdrop ────────────────────── */
[data-cl-overlay] {
  backdrop-filter: var(--backdrop-filter, none);
  z-index: var(--z, auto);
  isolation: isolate;
}
```

### What Tailwind Owns (NOT in the 20 axes)

| Concern | Tailwind Class Examples |
|---------|------------------------|
| Display | `flex`, `grid`, `block`, `hidden` |
| Direction | `flex-row`, `flex-col` |
| Justify | `justify-center`, `justify-between` |
| Align | `items-center`, `items-start` |
| Gap | `gap-2`, `gap-4` |
| Padding | `px-3`, `py-2`, `p-4` |
| Margin | `mt-4`, `mb-2`, `mx-auto` |
| Width/Height | `w-full`, `h-16`, `min-h-screen` |
| Position | `relative`, `absolute`, `fixed`, `sticky` |
| Grid | `grid-cols-12`, `col-span-8` |
| Aspect Ratio | `aspect-video`, `aspect-square` |
| Overflow | `overflow-hidden`, `overflow-y-auto` |
| Z-index (layout) | `z-10`, `z-50` |

---

## Law 6: Shared Intent Resolution

### Rule

One `resolveIntent()` function. One `INTENT_MAP`. All renderers import it.

Both HTML and SVG resolvers import from this single module.

---

## State Handling

| Concern | Owner | Why |
|---------|-------|-----|
| Colors, shadows, borders | Resolver (per-preset, per-state) | Design decisions that vary by intent |
| Cursor, pointer-events, outline | CSS (universal) | Behavioral, identical for all presets |
| Hover brightness | CSS (with `--hover-filter` var) | CSS-only state |
| Focus ring | CSS (with `--focus-ring` var) | Browser manages focus |
| Disabled appearance | Resolver (authored palette) | NOT `opacity: 0.4` — real authored disabled colors |

---

## Build Pipeline

```bash
pnpm ds:tokens:build
```

```
Step 1: generate-scales.mjs → fluid clamp DTCG tokens
Step 2: enrich-presets.mjs → axis defaults + typography per kind
Step 3: deriveKindFamilies() → kind → family[] mapping
Step 4: SD5 transforms + platforms → CSS vars, theme, types
Step 5: Glue CSS generation → render-base.css with family-split selectors
```

---

## Summary

| # | Law | Absolute? |
|---|-----|-----------|
| 1 | One public path: pure resolver, preset-only model | Yes |
| 2 | No wrapper elements | Yes |
| 3 | One root = one preset, scoped kind strings | Yes |
| 4 | No visual context inheritance, snippet param forwarding | Yes |
| 5 | Family-split glue CSS, derived from presets | Yes |
| 6 | Shared intent resolution, single source of truth | Yes |

No exceptions. No "v2 migration." No escape hatches.
