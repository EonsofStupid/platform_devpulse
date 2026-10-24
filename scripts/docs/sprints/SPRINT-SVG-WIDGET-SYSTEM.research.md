# Research: SVG Widget Visual System

**Date**: 2026-03-25
**Sprint**: SPRINT-SVG-WIDGET-SYSTEM
**Status**: IN_PROGRESS

## Question/Goal

Design a DTCG-aligned visual system for SVG widgets that:
- Follows the same pipeline as HTML components (DTCG → SD5 → resolver → CSS vars → paint)
- Handles all widget types: gauges, sparklines, bar charts, line charts, node graphs, flow diagrams, heatmaps
- Supports the ColdLight aesthetic (glass, glow, neumorphism, liquid metal)
- Is accent-aware (teal/purple/ember/cyber/frost/magenta)
- Is preset-driven (default/glass/stark/flat/matte per widget kind)
- Scales to the CAG visualization reference images (complex node graphs with glowing edges)

## SSOT Map

| Concern | Current Location | Status |
|---------|-----------------|--------|
| HTML visual axes (11) | `styles/macro-mappings.ts` | LOCKED — backgroundColor, backgroundBlur, shadow, border, animation, transition, typography, gradient, color, borderRadius, opacity |
| HTML StyleMacro | `styles/StyleMacro.svelte` | LOCKED — intent resolver, --cl-* vars, macro-base.css paints |
| HTML presets | `style-presets.json` | 431 presets, 17 properties each |
| SVG visual axes | **DOES NOT EXIST** | Needs design |
| SVG StyleMacro / resolver | **DOES NOT EXIST** | Needs design |
| SVG presets | **DOES NOT EXIST** | Needs design |
| Accent tokens | `generated/aliases.css` | 6 hues × 3 roles (main/glow/fill) = 18 tokens |
| SVG filter defs | `svg/filters/SvgFilters.svelte` | Exists — bevel, noise, glow filters |
| SVG filter CSS | `svg/filters/filters.css` | Exists — @utility classes for SVG filters |

## Codebase Analysis — What SVG Widgets Exist Today

### RadialGauge.svelte (blocks/widgets/)
SVG circular gauge with:
- Track ring (stroke)
- Value arc (stroke with dasharray animation)
- Tick marks (stroke)
- Glow filter (drop-shadow)
- Center text (font-family, color, text-shadow)
- Accent-driven: stroke color, glow color from `--accent-{hue}-main/glow`

**SVG properties used:**
- `stroke` (track, value arc, ticks)
- `stroke-width` (track, value arc)
- `stroke-dasharray` + `stroke-dashoffset` (value arc animation)
- `stroke-linecap` (round)
- `fill` (none on arcs, text fill)
- `filter` (drop-shadow for glow)
- `opacity` (track)
- `r`, `cx`, `cy` (structural, not visual)
- `font-family`, `font-size`, `font-weight` (text elements)
- `text-shadow` (CSS on text, not SVG attr)

### SparkLine.svelte (blocks/widgets/)
SVG polyline chart with:
- Line stroke
- Area fill (gradient below line)
- End dot (circle)
- Glow filter (Gaussian blur)
- Accent-driven: stroke, fill, glow from `--accent-{hue}-main/glow/fill`

**SVG properties used:**
- `stroke` (polyline)
- `stroke-width` (polyline)
- `fill` (area path, end dot)
- `fill-opacity` (area)
- `filter` (Gaussian blur glow)
- `r` (end dot radius — structural)

### Reference Images — What WILL Be Built

**DASHBOARD-REFERENCE-01.png:**
- Multiple RadialGauges with different accent colors
- SparkLine charts with area fills
- Tab bar for switching chart data
- All wrapped in glass Widget containers

**reference-cag.png + refrence-liquid.png:**
- 3D sphere with particle effects (likely WebGL/Canvas, not SVG)
- Node graph with glowing edges and pulsing nodes (SVG or Canvas)
- Flow arrows with gradient strokes
- Label cards floating on connections
- Governance sliders panel

**CHAT-REFERENCE-01/02.png:**
- Context visualization panel (right side) — shows a node graph
- Glowing connection lines between nodes

## SVG Visual Axis Candidates

Based on all current and planned SVG widgets:

| Axis | What it controls | SVG property | DTCG type |
|------|-----------------|--------------|-----------|
| `stroke` | Primary line/arc color | `stroke` | color |
| `strokeWidth` | Line thickness | `stroke-width` | dimension |
| `strokeLinecap` | Line end shape | `stroke-linecap` | string (round/butt/square) |
| `fill` | Area/shape fill color | `fill` | color |
| `fillOpacity` | Fill transparency | `fill-opacity` | number |
| `glowColor` | Glow/emission color | `filter: drop-shadow` color | color |
| `glowRadius` | Glow spread size | `filter: drop-shadow` blur | dimension |
| `trackStroke` | Background track color | `stroke` on track element | color |
| `trackOpacity` | Background track transparency | `opacity` on track | number |
| `filterUrl` | SVG filter reference | `filter: url(#id)` | string |
| `textColor` | Label/value text color | `fill` on text | color |
| `textGlow` | Text emission effect | `text-shadow` / filter | shadow |
| `animation` | Motion (pulse, breathe) | CSS `animation` | string |
| `transition` | State change speed | CSS `transition` | string |

### STOP — Owner Decision Required

**Question 1:** Is this the right axis set? Are there axes missing for the node graph / CAG visualization widgets?

**Possible additions:**
- `edgeStroke` — graph edge color
- `edgeWidth` — graph edge thickness
- `nodeRadius` — graph node size
- `nodeStroke` — graph node border
- `nodeFill` — graph node fill
- `particleColor` — particle effect color (if SVG, not WebGL)

**Question 2:** How should accent interact with SVG presets?

**Option A — Accent as a separate axis:**
Preset defines structural values (stroke-width, glow-radius, linecap, animation). Accent prop overlays color values. This means fewer presets (no teal-glass, purple-glass — just glass + accent=teal).

**Option B — Accent baked into preset:**
Each preset includes color. `gauge-glass-teal`, `gauge-glass-purple`. More presets but fully explicit — AI can read the exact color from the token manifest.

**Option C — Accent as a CSS var layer:**
Preset references `var(--accent-current-main)` etc. A parent element sets `--accent-current-main: var(--accent-teal-main)` based on the accent prop. Preset is color-agnostic, accent is injected.

**Impact:** Option A = cleanest separation, fewest presets, but runtime composition. Option B = most presets but fully DTCG explicit. Option C = middle ground, single accent resolution point.

**Question 3:** Are the CAG visualization reference images (liquid metal sphere, node graph) SVG or WebGL/Canvas?

If WebGL → different rendering pipeline entirely, outside SVG widget system scope.
If SVG → need to plan for complex filter chains (feSpecularLighting, feTurbulence, feGaussianBlur stacks).

**Question 4:** Should SVG widgets get their own StyleMacro variant (`SvgStyleMacro`) or extend the existing one?

**Option A — Separate `SvgStyleMacro`:**
Own component, own axis set, own `--cl-svg-*` vars, own glue CSS. Clean separation. HTML and SVG never mix.

**Option B — Extend existing StyleMacro:**
Add SVG axes to the existing component. It detects whether child is SVG or HTML and applies the right vars. More complex but one resolver.

**Option C — No StyleMacro for SVG:**
SVG widgets consume accent tokens + preset tokens directly via `var()`. No wrapper component. Simpler. But loses the intent resolver.

## Anti-Pattern Risks

1. **Inventing SVG axes that no widget uses** — only add axes that actual widgets need
2. **Duplicating the accent system** — accent tokens already exist in aliases.css, don't redefine
3. **Over-engineering for WebGL** — if CAG viz is Canvas/WebGL, don't shoehorn it into SVG preset system
4. **Composing at runtime** — presets should be flat resolved values, not "accent + preset" assembly

## Files Referenced
- `blocks/widgets/RadialGauge.svelte`: Current SVG gauge implementation
- `blocks/widgets/SparkLine.svelte`: Current SVG chart implementation
- `styles/StyleMacro.svelte`: HTML visual resolver
- `styles/macro-mappings.ts`: 11-axis mapping dictionary
- `generated/aliases.css`: Accent tokens
- `svg/filters/SvgFilters.svelte`: SVG filter definitions
- `svg/filters/filters.css`: SVG filter utility classes
- `REFERENCES/DASHBOARD-REFERENCE-01.png`: Target gauge/chart visuals
- `REFERENCES/reference-cag.png`: Target node graph visuals
- `REFERENCES/refrence-liquid.png`: Target liquid metal sphere visuals
