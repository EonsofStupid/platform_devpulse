# SD5 OKLCH + ColdLight — Verified Reference

> SD5 v5.3.0+ has native OKLCH support. No custom transform needed.

---

## Structured DTCG Color Token (OKLCH)

```json
{
  "$type": "color",
  "$value": {
    "colorSpace": "oklch",
    "components": [0.72, 0.19, 192],
    "alpha": 1,
    "hex": "#00d4b4"
  },
  "$description": "ColdLight primary teal.",
  "$extensions": {
    "com.coldlight": {
      "axis": "surface",
      "scope": "primitive",
      "stability": "stable"
    }
  }
}
```

- `colorSpace` — `"oklch"` → native CSS `oklch()` output
- `components` — `[L, C, H]` (Lightness 0–1, Chroma 0–0.4, Hue 0–360)
- `alpha` — optional, 0–1 (omit for fully opaque)
- `hex` — sRGB fallback for `color/hex` transform (progressive enhancement)

---

## ColdLight Transforms

```javascript
transforms: [
  "attribute/cti",            // CTI attributes from token path
  "name/kebab",               // kebab-case names
  "color/oklch",              // SD5 built-in → oklch() CSS output
  "time/seconds",             // Duration objects → seconds
  "size/rem",                 // Dimension objects → rem
  "cubicBezier/css",          // [P1x,P1y,P2x,P2y] → cubic-bezier()
  "shadow/css/shorthand",     // Shadow object → CSS shadow string
  "transition/css/shorthand", // Transition composite → CSS transition string
  "fontFamily/css",           // Array → CSS font-family string
]
```

---

## ColdLight Extension Namespace: `com.coldlight`

```json
"$extensions": {
  "com.coldlight": {
    "axis": "surface",
    "scope": "primitive",
    "stability": "stable",
    "inset": true,
    "cssRuntime": true,
    "defaultValue": { "colorSpace": "oklch", "components": [0.4, 0.13, 180] }
  }
}
```

| Key | Values | Purpose |
|-----|--------|---------|
| `axis` | `surface`, `material`, `depth`, `bevel`, `glow`, `frame`, `motion`, `transition` | Maps to 8-axis encoding (s/z/d/b/g/f/m/t) |
| `scope` | `primitive`, `semantic`, `composite` | Token tier |
| `stability` | `stable`, `experimental`, `deprecated` | Lifecycle |
| `inset` | `true` | Shadow is CSS `inset` (DTCG shadow has no inset property) |
| `cssRuntime` | `true` | Value uses CSS runtime features (e.g., `oklch(from var(...))`) |
| `defaultValue` | DTCG structured value | Fallback when `cssRuntime: true` — always available |

---

## CTI Pattern (Category / Type / Item)

```
Token path: ["color", "teal", "500"]
  → category = "color"
  → type     = "teal"
  → item     = "500"

Token path: ["motion", "animation", "pulse-glow"]
  → category = "motion"
  → type     = "animation"
  → item     = "pulse-glow"
```

`attribute/cti` transform adds `.attributes.category`, `.attributes.type`, `.attributes.item`.

---

## DTCG Valid $type Values (used by ColdLight)

| $type | $value format | ColdLight usage |
|-------|--------------|-----------------|
| `color` | `{"colorSpace":"oklch","components":[L,C,H],"alpha":A,"hex":"#..."}` | Color scales, surfaces, text, signal, border, glow colors |
| `dimension` | `{"value":N,"unit":"px"\|"rem"}` | Spacing, radius, blur, glowSpread, textSize |
| `duration` | `{"value":N,"unit":"ms"\|"s"}` | Transition/animation timing |
| `cubicBezier` | `[P1x, P1y, P2x, P2y]` | Easing functions |
| `number` | `N` | Hue angles, z-index |
| `shadow` | `{"color":{...},"offsetX":{...},"offsetY":{...},"blur":{...},"spread":{...}}` | Depth, bevel (+ inset ext), glow |
| `fontFamily` | `["Font", "fallback"]` | Font stacks |
| `transition` | `{"duration":{...},"timingFunction":[...],"delay":{...}}` | Semantic transition presets |

### Types requiring $extensions (no DTCG equivalent)

| ColdLight concept | $extensions approach |
|-------------------|---------------------|
| Animation shorthand | `"com.coldlight": {"type": "animation"}` + string $value |
| Inset shadow (bevel) | `"com.coldlight": {"inset": true}` on shadow tokens |
| CSS runtime values | `"com.coldlight": {"cssRuntime": true, "defaultValue": {...}}` |
| Padding shorthand | Split to `padding-y` + `padding-x` as separate dimensions |

---

## Dual Platform Config

```javascript
platforms: {
  css: {
    transforms: [..., "color/oklch"],
    buildPath: "packages/coldlight/style/",
    // → oklch(0.72 0.19 192) in CSS output
  },
  cssLegacy: {
    transforms: [..., "color/hex"],
    buildPath: "packages/coldlight/style/legacy/",
    // → #00d4b4 from hex fallback field
  },
}
```
