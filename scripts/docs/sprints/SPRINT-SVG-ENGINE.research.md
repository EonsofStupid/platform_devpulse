# Research: SVG Visual Engine — Schema, Axes, Presets, Infrastructure

**Date**: 2026-03-26
**Sprint**: SPRINT-SVG-ENGINE
**Status**: DECISIONS LOCKED — ready for sprint plan

## Decisions Locked

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Axis count | **20 individual axes** | Max granularity. Defaults simplify for layman. AI reads exact values. |
| Accent handling | **Preset references var(--cl-svg-accent-main)** | Accent-agnostic presets. Color injected at runtime. No preset explosion. |
| DTCG source | **Separate svg-presets.json** | Clean separation from HTML presets. Own SD5 platform config. |
| Rendering model | **Pure resolver function + $derived** | No wrapper component. Widget owns `<svg>`. Resolver returns style + data attrs. |
| Accent reactivity | **Separate reactive layer** | Accent change flips 3 vars, not 20. Structural preset stays stable. |
| Slot pattern | **Caller owns `<svg>`** | Widget controls viewBox, geometry, defs. Macro is computation, not DOM. |
| Multi-element | **One root scope per widget** | Child elements read vars they need. `data-svg-slot` for debugging/targeting. |
| Filters | **Preset stores url(#id), resolver exposes --cl-svg-filter** | Filter ref is data in preset, CSS var is runtime mechanism. |
| DOM application | **Svelte 5 attachment or direct spread** | `{@attach svgStyleAttachment()}` or spread attrs onto `<svg>`. No action. |

## Architecture

### Core API Shape

```typescript
// Pure resolver — no DOM, no component, no side effects
function resolveSvgPreset(kind: string, intent: string): Record<string, string>;
function resolveSvgAccent(accent: string): Record<string, string>;
function resolveSvgMacro(opts: { kind: string; intent: string; accent?: string }): SvgMacroResolved;

interface SvgMacroResolved {
  /** CSS custom property string for style attr */
  style: string;
  /** Data attributes for glue CSS targeting */
  attrs: {
    'data-svg-kind': string;
    'data-svg-intent': string;
    'data-svg-accent'?: string;
  };
}
```

### Widget Usage Pattern

```svelte
<script lang="ts">
import { resolveSvgMacro } from "$lib/design/svg/index.js";

let { value, max, accent = "teal", intent = "default" } = $props();

const svg = $derived(resolveSvgMacro({ kind: "radial-gauge", intent, accent }));
</script>

<svg
  style={svg.style}
  data-svg-kind={svg.attrs['data-svg-kind']}
  data-svg-intent={svg.attrs['data-svg-intent']}
  data-svg-accent={svg.attrs['data-svg-accent']}
  viewBox="0 0 200 200"
>
  <!-- Track ring reads var(--cl-svg-track-stroke) -->
  <circle
    cx="100" cy="100" r="80"
    fill="none"
    stroke="var(--cl-svg-track-stroke)"
    stroke-width="var(--cl-svg-stroke-width)"
    opacity="var(--cl-svg-track-opacity)"
  />
  <!-- Value arc reads var(--cl-svg-stroke) = accent main -->
  <circle
    cx="100" cy="100" r="80"
    fill="none"
    stroke="var(--cl-svg-stroke)"
    stroke-width="var(--cl-svg-stroke-width)"
    stroke-linecap="var(--cl-svg-stroke-linecap)"
    style="filter: var(--cl-svg-filter)"
  />
  <!-- Label text reads var(--cl-svg-text-color) -->
  <text
    x="100" y="100"
    fill="var(--cl-svg-text-color)"
    font-family="var(--cl-svg-font-family)"
    font-size="var(--cl-svg-font-size)"
    font-weight="var(--cl-svg-font-weight)"
  >
    {value}
  </text>
</svg>
```

### Reactive Boundaries

```
$derived layer 1: resolveSvgPreset(kind, intent)
  → computes 17 structural --cl-svg-* vars
  → only re-derives when kind or intent changes

$derived layer 2: resolveSvgAccent(accent)
  → computes 3 --cl-svg-accent-* vars
  → only re-derives when accent changes

$derived layer 3: resolveSvgMacro({ kind, intent, accent })
  → merges both into final style string + attrs
  → cheap merge, not recomputation
```

### 20 SVG Axes — Complete

| # | Axis | CSS Var | DTCG Type | Default |
|---|------|---------|-----------|---------|
| 1 | stroke | `--cl-svg-stroke` | color | `var(--cl-svg-accent-main)` |
| 2 | strokeWidth | `--cl-svg-stroke-width` | dimension | `0.125rem` |
| 3 | strokeLinecap | `--cl-svg-stroke-linecap` | string | `round` |
| 4 | strokeOpacity | `--cl-svg-stroke-opacity` | number | `1` |
| 5 | fill | `--cl-svg-fill` | color | `var(--cl-svg-accent-fill)` |
| 6 | fillOpacity | `--cl-svg-fill-opacity` | number | `0.08` |
| 7 | glowColor | `--cl-svg-glow-color` | color | `var(--cl-svg-accent-glow)` |
| 8 | glowBlur | `--cl-svg-glow-blur` | dimension | `1.25rem` |
| 9 | glowOpacity | `--cl-svg-glow-opacity` | number | `0.7` |
| 10 | trackStroke | `--cl-svg-track-stroke` | color | `oklch(1 0 0 / 0.06)` |
| 11 | trackOpacity | `--cl-svg-track-opacity` | number | `1` |
| 12 | textColor | `--cl-svg-text-color` | color | `var(--cl-svg-accent-main)` |
| 13 | textGlowColor | `--cl-svg-text-glow-color` | color | `var(--cl-svg-accent-glow)` |
| 14 | textGlowBlur | `--cl-svg-text-glow-blur` | dimension | `0.75rem` |
| 15 | fontFamily | `--cl-svg-font-family` | string | `inherit` |
| 16 | fontSize | `--cl-svg-font-size` | dimension | `inherit` |
| 17 | fontWeight | `--cl-svg-font-weight` | string | `inherit` |
| 18 | filterUrl | `--cl-svg-filter` | string | `none` |
| 19 | animation | `--cl-svg-animation` | string | `none` |
| 20 | transition | `--cl-svg-transition` | string | `all 150ms ease-out` |

### Accent Var Layer

```css
/* svg-accent.css — generated or hand-authored */
/* SvgStyleMacro sets these based on accent prop */

/* No CSS selectors needed — resolver sets vars directly in style string */
/* These are the var names that accent-referencing preset values point to */
```

Resolver sets:
```
--cl-svg-accent-main: var(--accent-{accent}-main)
--cl-svg-accent-glow: var(--accent-{accent}-glow)
--cl-svg-accent-fill: var(--accent-{accent}-fill)
```

Preset values that say `var(--cl-svg-accent-main)` resolve through this chain:
```
--cl-svg-stroke: var(--cl-svg-accent-main)
                → var(--accent-teal-main)
                → var(--color-teal-400)
                → oklch(0.63 0.08 173)
```

### Glue CSS

```css
/* svg-macro-base.css */
/* Unlike HTML macro-base.css, this is OPTIONAL. */
/* SVG elements read --cl-svg-* vars directly in their attributes. */
/* This file provides fallback defaults and data-svg-slot targeting. */

[data-svg-kind] {
  --cl-svg-stroke: var(--cl-svg-accent-main, currentColor);
  --cl-svg-fill: var(--cl-svg-accent-fill, none);
  --cl-svg-glow-color: var(--cl-svg-accent-glow, transparent);
}

[data-svg-slot="track"] {
  stroke: var(--cl-svg-track-stroke);
  opacity: var(--cl-svg-track-opacity);
}

[data-svg-slot="value"] {
  stroke: var(--cl-svg-stroke);
  stroke-width: var(--cl-svg-stroke-width);
  stroke-linecap: var(--cl-svg-stroke-linecap);
  filter: drop-shadow(0 0 var(--cl-svg-glow-blur) var(--cl-svg-glow-color));
}

[data-svg-slot="label"] {
  fill: var(--cl-svg-text-color);
  font-family: var(--cl-svg-font-family);
  font-size: var(--cl-svg-font-size);
  font-weight: var(--cl-svg-font-weight);
}
```

### DTCG Preset Example (svg-presets.json)

```json
{
  "svg-style": {
    "radial-gauge-default": {
      "stroke": { "$value": "var(--cl-svg-accent-main)", "$type": "color" },
      "stroke-width": { "$value": "0.1875rem", "$type": "dimension" },
      "stroke-linecap": { "$value": "round", "$type": "string" },
      "stroke-opacity": { "$value": "1", "$type": "number" },
      "fill": { "$value": "none", "$type": "color" },
      "fill-opacity": { "$value": "0", "$type": "number" },
      "glow-color": { "$value": "var(--cl-svg-accent-glow)", "$type": "color" },
      "glow-blur": { "$value": "0.5rem", "$type": "dimension" },
      "glow-opacity": { "$value": "0.5", "$type": "number" },
      "track-stroke": { "$value": "oklch(1 0 0 / 0.06)", "$type": "color" },
      "track-opacity": { "$value": "1", "$type": "number" },
      "text-color": { "$value": "var(--cl-svg-accent-main)", "$type": "color" },
      "text-glow-color": { "$value": "var(--cl-svg-accent-glow)", "$type": "color" },
      "text-glow-blur": { "$value": "0.75rem", "$type": "dimension" },
      "font-family": { "$value": "var(--font-display)", "$type": "string" },
      "font-size": { "$value": "1.5rem", "$type": "dimension" },
      "font-weight": { "$value": "700", "$type": "string" },
      "filter-url": { "$value": "none", "$type": "string" },
      "animation": { "$value": "none", "$type": "string" },
      "transition": { "$value": "all 150ms ease-out", "$type": "string" },
      "$description": "radial-gauge — default seed preset"
    },
    "radial-gauge-glass": {
      "stroke-width": { "$value": "0.25rem", "$type": "dimension" },
      "glow-blur": { "$value": "1.25rem", "$type": "dimension" },
      "glow-opacity": { "$value": "0.8", "$type": "number" },
      "text-glow-blur": { "$value": "1rem", "$type": "dimension" },
      "filter-url": { "$value": "url(#bevel-soft)", "$type": "string" },
      "transition": { "$value": "all 250ms ease-out", "$type": "string" },
      "$description": "radial-gauge — glass seed preset (heavier glow, bevel filter)"
    }
  }
}
```

Note: glass preset only declares values that DIFFER from default. The resolver falls back to default for unlisted axes. This keeps presets DRY.

### SD5 Config Addition

New platform in `sd.config.mjs`:

```javascript
'css-svg-presets': {
  transformGroup: 'css',
  buildPath: `${paths.design}/svg/presets/`,
  files: [{
    destination: 'svg-presets.generated.css',
    format: 'css/variables',
    filter: (token) => token.path[0] === 'svg-style',
    options: { outputReferences: true }, // accent vars need to pass through
  }],
},
```

`outputReferences: true` for SVG presets because accent var references (`var(--cl-svg-accent-main)`) must pass through as-is. This is different from HTML presets which use `outputReferences: false`.

### File Structure (Final)

```
design/
├── svg/
│   ├── resolve-svg-macro.ts       ← pure resolver function (resolveSvgMacro, resolveSvgPreset, resolveSvgAccent)
│   ├── svg-macro-mappings.ts      ← 20-axis dictionary (axis name → CSS var name → DTCG type)
│   ├── svg-macro-base.css         ← glue CSS for data-svg-slot targeting
│   ├── svg-types.ts               ← SvgMacroResolved, SvgAccent, SvgIntent types
│   ├── index.ts                   ← public API barrel
│   ├── filters/                   ← EXISTING
│   │   ├── SvgFilters.svelte
│   │   └── filters.css
│   └── presets/                   ← SD5 output
│       └── svg-presets.generated.css
```

## Anti-Pattern Risks

1. Making resolveSvgMacro a component — IT IS A FUNCTION, not a component
2. Wrapping `<svg>` in a div — widget owns `<svg>`, no wrappers
3. Using actions instead of attachments or direct spread — actions are legacy in Svelte 5
4. Mixing accent into preset recomputation — accent is its own reactive layer
5. One macro per sub-element — one root scope, children read vars
6. Hardcoding filter IDs — store in preset as data, expose via --cl-svg-filter var
7. Using outputReferences: false for SVG presets — accent var refs MUST pass through
