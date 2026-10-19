# DTCG 1.0 Compliance Audit — ColdLight Token Sources

> Audited against: https://www.designtokens.org/TR/drafts/format/
> Source files: `tokens/src/tier-1/`, `tier-2/`, `tier-3/`

---

## Legend

- **VALID** — Correct $type AND $value format per DTCG 1.0
- **REAUTHOR** — Must rewrite $value to structured object format
- **RETYPE** — Must change $type to a valid DTCG type
- **EXTENSION** — No DTCG type exists; use `$extensions` with `org.coldlight.*` namespace

---

## tier-1/color.json

### `hue` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| teal, purple, magenta, ember, frost, cyber | `number` | `180`, `280`, etc. | **VALID** | None |

### `color` group (6 scales × 10 stops = 60 tokens)
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| teal.50–900, purple.50–900, etc. | `color` | `"oklch(0.97 0.02 180)"` | **REAUTHOR** | Must use structured: `{"colorSpace":"oklch","components":[0.97,0.02,180]}` |

### `text` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| primary, secondary, muted, disabled, accent, inverse | `color` | `"oklch(0.95 0.01 220)"` | **REAUTHOR** | Structured color object. `accent` also needs alpha: `{"colorSpace":"oklch","components":[0.75,0.14,180]}` |

### `signal` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| success, warning, error, info | `color` | `"oklch(0.65 0.18 145)"` | **REAUTHOR** | Structured color object |

**Total color.json: 72 tokens, ALL need REAUTHOR to structured color objects (except 6 hue numbers)**

---

## tier-1/surfaces.json

### `glass` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| void, deep, smoke, frost, teal, purple | `color` | `"oklch(0.06 0.01 210 / 0.88)"` | **REAUTHOR** | Structured color with alpha: `{"colorSpace":"oklch","components":[0.06,0.01,210],"alpha":0.88}` |

### `matte` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| dark, medium, light | `color` | `"oklch(0.14 0.005 250)"` | **REAUTHOR** | Structured color object (no alpha) |

**Total surfaces.json: 9 tokens, ALL REAUTHOR**

---

## tier-1/effects.json

### `shadow` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| z0 | `shadow` | `"none"` | **REAUTHOR** | Use: `{"color":{"colorSpace":"srgb","components":[0,0,0],"alpha":0},"offsetX":{"value":0,"unit":"px"},"offsetY":{"value":0,"unit":"px"},"blur":{"value":0,"unit":"px"},"spread":{"value":0,"unit":"px"}}` |
| z1 | `shadow` | CSS string | **REAUTHOR** | Multi-shadow = array of shadow objects |
| z2, z3, z4 | `shadow` | CSS string | **REAUTHOR** | Same — array of shadow objects |

### `bevel` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| off | `shadow` | `"none"` | **REAUTHOR** | Zero shadow object |
| subtle, soft, medium | `shadow` | CSS inset string | **REAUTHOR** + **EXTENSION** | DTCG shadow has NO `inset` property. Use `$extensions: {"org.coldlight.inset": true}` on each token, plus structured shadow object |

### `glow` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| off | `shadow` | `"none"` | **REAUTHOR** | Zero shadow object |
| teal–cyber | `shadow` | `"0 0 20px oklch(...)"` | **REAUTHOR** | Structured shadow object. offsetX=0, offsetY=0, blur=20px, spread=0 |

### `glowSpread` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| sm, md, lg, xl | `dimension` | `"12px"` | **REAUTHOR** | `{"value":12,"unit":"px"}` |

### `blur` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| off | `dimension` | `"0px"` | **REAUTHOR** | `{"value":0,"unit":"px"}` |
| sm–2xl | `dimension` | `"4px"` etc. | **REAUTHOR** | Structured dimension objects |

**Total effects.json: 22 tokens, ALL REAUTHOR. Bevel additionally needs $extensions for inset.**

---

## tier-1/motion.json

### `duration` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| snap, fast, normal, smooth, glacial, moderate | `duration` | `"50ms"` etc. | **REAUTHOR** | `{"value":50,"unit":"ms"}`. moderate `"3s"` → `{"value":3,"unit":"s"}` |

### `ease` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| linear | `cubicBezier` | `"linear"` | **REAUTHOR** | `[0, 0, 1, 1]` (linear equivalent) |
| in | `cubicBezier` | `"cubic-bezier(0.4, 0, 1, 1)"` | **REAUTHOR** | `[0.4, 0, 1, 1]` |
| out | `cubicBezier` | `"cubic-bezier(0, 0, 0.2, 1)"` | **REAUTHOR** | `[0, 0, 0.2, 1]` |
| inOut | `cubicBezier` | `"cubic-bezier(0.4, 0, 0.2, 1)"` | **REAUTHOR** | `[0.4, 0, 0.2, 1]` |
| spring | `cubicBezier` | `"cubic-bezier(0.34, 1.56, 0.64, 1)"` | **REAUTHOR** | `[0.34, 1.56, 0.64, 1]` |
| bounce | `cubicBezier` | `"cubic-bezier(0.68, -0.55, 0.27, 1.55)"` | **REAUTHOR** | `[0.68, -0.55, 0.27, 1.55]` |

### `animation` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| pulse-glow, breathe, shimmer, drift, pulse, fade-in, slide-up, slide-down, scale-in | `other` | CSS shorthand string | **RETYPE** + **EXTENSION** | No DTCG animation type. Use `$type` inherited from group `$extensions`: `{"org.coldlight.type": "animation"}`. Keep $value as string — SD5 passes through. |

**Total motion.json: 21 tokens. duration + ease = REAUTHOR. animation = RETYPE to $extensions.**

---

## tier-1/spacing.json

### `space` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| 1–8 | `dimension` | `"0.25rem"` etc. | **REAUTHOR** | `{"value":0.25,"unit":"rem"}` |

### `padding` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| sm, md, lg | `dimension` | `"0.375rem 0.75rem"` | **RETYPE** + **EXTENSION** | Multi-value NOT valid dimension. DTCG has no "padding" type. Two options: (A) Split into `padding-y` and `padding-x` as separate dimensions, or (B) Use `$extensions: {"org.coldlight.type": "padding-shorthand"}` and keep as string. Recommend (A) — split. |

**Total spacing.json: 10 tokens. space = REAUTHOR. padding = RETYPE + split or extend.**

---

## tier-1/layout.json

### `radius` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| none | `dimension` | `"0"` | **REAUTHOR** | `{"value":0,"unit":"px"}` (unit required even when 0) |
| xs–xl | `dimension` | `"0.125rem"` etc. | **REAUTHOR** | Structured dimension |
| full | `dimension` | `"9999px"` | **REAUTHOR** | `{"value":9999,"unit":"px"}` |

### `z` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| base, raised, dropdown, sticky, overlay, modal, popover, toast, tooltip | `number` | `0`, `10`, etc. | **VALID** | None |

**Total layout.json: 16 tokens. radius = REAUTHOR. z = VALID.**

---

## tier-1/typography.json

### `font` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| display, sans, mono | `fontFamily` | String | **REAUTHOR** | Should be array: `["Orbitron", "system-ui", "sans-serif"]` not `"\"Orbitron\", system-ui, sans-serif"` |

### `textSize` group
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| xs–2xl | `dimension` | `"0.75rem"` etc. | **REAUTHOR** | Structured dimension |

**Total typography.json: 9 tokens. ALL REAUTHOR.**

---

## tier-2/semantic.json

### `surface` group — 7 tokens
| Status | Fix |
|--------|-----|
| **VALID** (references) | `$type: "color"` with `"{glass.void}"` etc. — references are DTCG-compliant. Values resolve from tier-1. |

### `border` group — 6 tokens
| Token | Status | Fix |
|-------|--------|-----|
| subtle, soft, emphasis | **REAUTHOR** | Uses `"oklch(from var(--color-teal-700) l c h / 0.22)"` — this is a CSS relative color, NOT a DTCG reference or literal. Must either: (A) use DTCG color object, or (B) use `$extensions` for CSS-native values. **Recommend $extensions** — these are CSS-runtime values that can't be resolved at build time. |
| focus | **VALID** | Reference `"{color.teal.400}"` |
| divider, divider-faint | **REAUTHOR** | `"oklch(1 0 0 / 0.06)"` → structured color object |

### `interaction` group — 3 tokens
| Status | Fix |
|--------|-----|
| **REAUTHOR** | `"oklch(1 0 0 / 0.06)"` → structured color with alpha |

### `overlay` group — 2 tokens
| Status | Fix |
|--------|-----|
| **REAUTHOR** | `"oklch(0.06 0.02 195 / 0.40)"` → structured color with alpha |

### `depth` group — 5 tokens
| Status | Fix |
|--------|-----|
| **VALID** | References: `"{shadow.z0}"` etc. |

### `transition` group — 4 tokens
| Token | $type | $value | Status | Fix |
|-------|-------|--------|--------|-----|
| instant, fast, normal, slow | `other` | `"{duration.snap} {ease.out}"` | **RETYPE** | Must use DTCG `transition` composite type: `{"duration": "{duration.snap}", "timingFunction": "{ease.out}", "delay": {"value":0,"unit":"ms"}, "property": "all"}` |

### `backdrop` group — 11 tokens
| Status | Fix |
|--------|-----|
| **REAUTHOR** | String oklch → structured color objects |

### `scrollbar` group — 2 tokens
| Status | Fix |
|--------|-----|
| **REAUTHOR** | String oklch → structured color objects |

**Total semantic.json: 40 tokens. transition = RETYPE. border.subtle/soft/emphasis = $extensions (CSS-runtime). Rest = REAUTHOR or VALID.**

---

## tier-3/components.json

All 25 component groups use references (`"{surface.primary}"`, `"{border.subtle}"`, `"{depth.raised}"` etc.)

| $type used | Status |
|-----------|--------|
| `color` with references | **VALID** |
| `shadow` with references | **VALID** |

**Total components.json: ~120 tokens, ALL VALID (references resolve from tier-1 and tier-2)**

---

## Summary

| File | Total | Valid | Reauthor | Retype | Extension |
|------|-------|-------|----------|--------|-----------|
| color.json | 72 | 6 | 66 | 0 | 0 |
| surfaces.json | 9 | 0 | 9 | 0 | 0 |
| effects.json | 22 | 0 | 22 | 0 | 3 (bevel inset) |
| motion.json | 21 | 0 | 12 | 9 | 9 (animation) |
| spacing.json | 10 | 0 | 7 | 3 | 3 (padding) |
| layout.json | 16 | 9 | 7 | 0 | 0 |
| typography.json | 9 | 0 | 9 | 0 | 0 |
| semantic.json | 40 | 12 | 17 | 4 | 3 (border CSS-runtime) |
| components.json | ~120 | ~120 | 0 | 0 | 0 |
| **TOTAL** | **~319** | **~147** | **~149** | **16** | **18** |

---

## $extensions Vendor Namespace

All ColdLight extensions use `org.coldlight.*`:

```json
{
  "$extensions": {
    "org.coldlight.inset": true,
    "org.coldlight.type": "animation",
    "org.coldlight.type": "padding-shorthand",
    "org.coldlight.cssRuntime": true
  }
}
```

---

## Decisions Needed

1. **padding** — Split into `padding-y` + `padding-x` (pure DTCG) or keep as shorthand with `$extensions`?
2. **border.subtle/soft/emphasis** — These use CSS `oklch(from var(...))` relative color syntax which can't resolve at build time. Keep as `$extensions` with `org.coldlight.cssRuntime: true`?
3. **animation** — No DTCG type exists. Use `$extensions` with `org.coldlight.type: "animation"` and string $value?
4. **Color format** — Go full structured `{"colorSpace":"oklch","components":[L,C,H]}` for all 75+ color tokens?
