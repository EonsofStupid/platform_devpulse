# DTCG Design Tokens Format — Reference (2025.10 / April 10 2026 draft)

> **This document is the canonical DevPulse reference for the DTCG specification.**
> Source of truth for all DevPulse token authoring, Style Dictionary v5 configuration, and preset composition.
>
> **Spec version**: 2025.10 (CG-DRAFT, published 2026-04-10)
> **Canonical URL**: https://www.designtokens.org/TR/2025.10/
> **Source repo**: https://github.com/design-tokens/community-group
>
> **Spec status**: Draft Community Group Report. Published by the Design Tokens Community Group (DTCG), incubated inside the W3C Community & Business Groups programme. **It is NOT a W3C Standard nor on the W3C Standards Track.** The spec page explicitly warns "do not attempt to implement this version of the specification" — BUT it is the only public formal contract we have, every production tooling (Style Dictionary v5, Tokens Studio, Figma Variables, Supernova, etc.) implements against it, and it is the industry convergence point. DevPulse treats it as authoritative for authoring + interchange and accepts the draft-stability risk.
>
> **First stable milestone** was reached 2025-10-28: <https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/>
>
> This reference captures every detail DevPulse depends on so contributors never have to re-read the upstream spec.

---

## Table of contents

1. [Modules](#1-modules)
2. [File format](#2-file-format)
3. [Token structure](#3-token-structure)
4. [Reserved characters and names](#4-reserved-characters-and-names)
5. [Token types](#5-token-types)
6. [Composite token types](#6-composite-token-types)
7. [Color Module (full schema)](#7-color-module-full-schema)
8. [Groups and inheritance](#8-groups-and-inheritance)
9. [References and aliases](#9-references-and-aliases)
10. [Extensions convention](#10-extensions-convention)
11. [Resolution order](#11-resolution-order)
12. [Resolver Module (themes, modes, merging)](#12-resolver-module-themes-modes-merging)
13. [DevPulse compliance status (as of 2026-04-11)](#13-devpulse-compliance-status-as-of-2026-04-11)
14. [DevPulse target structure](#14-devpulse-target-structure)
15. [Authoring rules for DevPulse contributors](#15-authoring-rules-for-devpulse-contributors)
16. [Sources](#16-sources)

---

## 1. Modules

DTCG 2025.10 is published as three independent but complementary modules. DevPulse implements all three.

| Module | URL | Scope |
|---|---|---|
| **Format Module** | https://www.designtokens.org/TR/2025.10/format/ | File format, token structure, types, groups, references, extensions |
| **Color Module** | https://www.designtokens.org/TR/2025.10/color/ | Color spaces, component arrays, gamut mapping, interpolation |
| **Resolver Module** | https://www.designtokens.org/TR/2025.10/resolver/ | Multi-file merging, theme switching, modifier precedence |

All three share the `2025.10` version number and the `CG-DRAFT` status. Publication date: **2026-04-10**.

---

## 2. File format

| Requirement | Value |
|---|---|
| **Media type (preferred)** | `application/design-tokens+json` |
| **Media type (fallback)** | `application/json` |
| **File extensions** | `.tokens` or `.tokens.json` |
| **Format** | Standard JSON |

DevPulse authors every token file with the `.tokens.json` extension. `.json` alone is non-compliant and treated as drift.

---

## 3. Token structure

Every design token is a JSON object with **exactly one required property**: `$value`. Everything else is optional.

### Required property

| Property | Type | Notes |
|---|---|---|
| `$value` | Depends on `$type` | The token's data payload. |

### Optional properties

| Property | Type | Notes |
|---|---|---|
| `$type` | string | Token category. Declares how `$value` is interpreted. Inheritable from ancestor groups. |
| `$description` | string | Plain text explanation. Tools preserve this verbatim. |
| `$deprecated` | boolean OR string | `true` marks the token as obsolete; a string supplies a deprecation reason / migration hint. |
| `$extensions` | object | Vendor-specific metadata. Reverse-DNS keys. |

### Minimal valid token

```json
{
  "primary": {
    "$type": "color",
    "$value": {
      "colorSpace": "oklch",
      "components": [0.55, 0.12, 173]
    }
  }
}
```

---

## 4. Reserved characters and names

Token and group names are JSON strings with the following hard restrictions (**violating any of these breaks the spec**):

| Restriction | Forbidden | Reason |
|---|---|---|
| Leading dollar sign | `$foo` at the start of a name | `$` is reserved for spec properties like `$value`, `$type`, `$description`. |
| Curly braces anywhere | `{foo}`, `foo{bar}` | `{` and `}` are reserved for reference syntax. |
| Periods anywhere | `color.primary` | `.` is the path separator used in references. |

**Reserved name**: `$root`. Used inside a group to define a token at the group's own path — see [§ 8](#8-groups-and-inheritance).

**DevPulse rule**: kebab-case at every level. No spaces, no mixed-case, no underscores except at depth zero if required by a vendor extension.

---

## 5. Token types

Every leaf token declares a `$type` (or inherits one from its nearest ancestor group). The spec defines **7 atomic types** and **7 composite types**.

### Atomic types

| `$type` | `$value` shape | Notes |
|---|---|---|
| `color` | Object (see [§ 7](#7-color-module-full-schema)) | Color Module schema. Hex strings alone are non-compliant. |
| `dimension` | `{ "value": <number>, "unit": "px" \| "rem" }` | Distance measurements. Integer or float. |
| `fontFamily` | string OR `string[]` | Single family name or ordered fallback stack. |
| `fontWeight` | integer (1–1000) OR string alias | Aliases: `thin`, `hairline`, `extra-light`, `ultra-light`, `light`, `normal`, `regular`, `book`, `medium`, `semi-bold`, `demi-bold`, `bold`, `extra-bold`, `ultra-bold`, `heavy`, `black`, `extra-black`, `ultra-black`. |
| `duration` | `{ "value": <number>, "unit": "ms" \| "s" }` | Animation / transition timings. |
| `cubicBezier` | `[P1x, P1y, P2x, P2y]` | Easing curves. `P1x` and `P2x` must be in `[0, 1]`. `P1y` and `P2y` are unbounded (allows overshoot). |
| `number` | JSON number | Unitless quantities (line-height ratios, opacity, z-index). |

### Dimension examples

```json
{
  "space": {
    "$type": "dimension",
    "xs": { "$value": { "value": 0.25, "unit": "rem" } },
    "sm": { "$value": { "value": 0.5, "unit": "rem" } },
    "md": { "$value": { "value": 1, "unit": "rem" } }
  }
}
```

### Duration examples

```json
{
  "motion": {
    "$type": "duration",
    "fast":   { "$value": { "value": 120, "unit": "ms" } },
    "normal": { "$value": { "value": 240, "unit": "ms" } },
    "slow":   { "$value": { "value": 400, "unit": "ms" } }
  }
}
```

### CubicBezier examples

```json
{
  "ease": {
    "$type": "cubicBezier",
    "out":     { "$value": [0, 0, 0.2, 1] },
    "in":      { "$value": [0.4, 0, 1, 1] },
    "in-out":  { "$value": [0.4, 0, 0.2, 1] },
    "spring":  { "$value": [0.25, -0.5, 0.75, 1.5] }
  }
}
```

---

## 6. Composite token types

Composite tokens reference atomic tokens (or inline values) inside a structured object or array.

### 6.1 StrokeStyle

String shortcut OR object form:

```json
{
  "solid":  { "$type": "strokeStyle", "$value": "solid" },
  "dashed": {
    "$type": "strokeStyle",
    "$value": {
      "dashArray": [ { "value": 4, "unit": "px" }, { "value": 2, "unit": "px" } ],
      "lineCap": "round"
    }
  }
}
```

**`lineCap` options**: `round`, `butt`, `square`.

### 6.2 Border

Always an object with three sub-values:

```json
{
  "hairline": {
    "$type": "border",
    "$value": {
      "color": { "colorSpace": "oklch", "components": [0.55, 0.12, 173], "alpha": 0.25 },
      "width": { "value": 1, "unit": "px" },
      "style": "solid"
    }
  }
}
```

Each sub-value MAY be replaced with a reference like `"{color.border.subtle}"` or a `$ref` object.

### 6.3 Transition

```json
{
  "fade-in": {
    "$type": "transition",
    "$value": {
      "duration":       { "value": 240, "unit": "ms" },
      "delay":          { "value": 0, "unit": "ms" },
      "timingFunction": [0, 0, 0.2, 1]
    }
  }
}
```

### 6.4 Shadow

Object (single shadow) OR array (layered shadows). **This is the correct shape — DevPulse currently uses CSS shorthand strings which is non-compliant.**

```json
{
  "z1": {
    "$type": "shadow",
    "$value": [
      {
        "color":   { "colorSpace": "oklch", "components": [0.2, 0.01, 224], "alpha": 0.08 },
        "offsetX": { "value": 0, "unit": "rem" },
        "offsetY": { "value": 0.0625, "unit": "rem" },
        "blur":    { "value": 0.1875, "unit": "rem" },
        "spread":  { "value": 0, "unit": "rem" }
      },
      {
        "color":   { "colorSpace": "oklch", "components": [0.2, 0.01, 224], "alpha": 0.05 },
        "offsetX": { "value": 0, "unit": "rem" },
        "offsetY": { "value": 0.0625, "unit": "rem" },
        "blur":    { "value": 0.125, "unit": "rem" },
        "spread":  { "value": 0, "unit": "rem" }
      }
    ]
  }
}
```

### 6.5 Gradient

Array of stops. Each stop has a color and a position (number between 0 and 1):

```json
{
  "teal-sweep": {
    "$type": "gradient",
    "$value": [
      { "color": { "colorSpace": "oklch", "components": [0.55, 0.12, 173] }, "position": 0 },
      { "color": { "colorSpace": "oklch", "components": [0.72, 0.15, 200] }, "position": 0.5 },
      { "color": { "colorSpace": "oklch", "components": [0.88, 0.10, 230] }, "position": 1 }
    ]
  }
}
```

### 6.6 Typography

```json
{
  "heading-xl": {
    "$type": "typography",
    "$value": {
      "fontFamily":    ["Inter", "system-ui", "sans-serif"],
      "fontSize":      { "value": 2.25, "unit": "rem" },
      "fontWeight":    700,
      "lineHeight":    1.2,
      "letterSpacing": { "value": -0.01, "unit": "rem" }
    }
  }
}
```

---

## 7. Color Module (full schema)

Published alongside the Format Module as its own module at https://www.designtokens.org/TR/2025.10/color/.

### Supported color spaces (14 total)

| `colorSpace` value | Components | Ranges |
|---|---|---|
| `srgb` | `[R, G, B]` | `[0, 1]` each |
| `srgb-linear` | `[R, G, B]` | `[0, 1]` each |
| `hsl` | `[H, S, L]` | `[0, 360)`, `[0, 100]`, `[0, 100]` |
| `hwb` | `[H, W, B]` | `[0, 360)`, `[0, 100]`, `[0, 100]` |
| `lab` | `[L, A, B]` | `[0, 100]`, unbounded, unbounded |
| `lch` | `[L, C, H]` | `[0, 100]`, `[0, ∞)`, `[0, 360)` |
| `oklab` | `[L, A, B]` | `[0, 1]`, unbounded, unbounded |
| `oklch` | `[L, C, H]` | `[0, 1]`, `[0, ∞)`, `[0, 360)` |
| `display-p3` | `[R, G, B]` | `[0, 1]` each |
| `a98-rgb` | `[R, G, B]` | `[0, 1]` each |
| `prophoto-rgb` | `[R, G, B]` | `[0, 1]` each |
| `rec2020` | `[R, G, B]` | `[0, 1]` each |
| `xyz-d65` | `[X, Y, Z]` | `[0, 1]` each |
| `xyz-d50` | `[X, Y, Z]` | `[0, 1]` each |

DevPulse uses **`oklch`** throughout per the platform's color system decision.

### Color `$value` shape

```
{
  "colorSpace": "<one of the 14 above>",
  "components": [<number | "none">, ...],
  "alpha":      <optional, 0..1, defaults to 1>,
  "hex":        <optional, 6-digit CSS hex fallback>
}
```

- **`colorSpace`** (required) — the identifier from the table above.
- **`components`** (required) — JSON array whose length matches the color space's component count. Each entry is a number OR the keyword `"none"`. `"none"` means "this component is not applicable or not specified" — distinct from `0`. Useful in HSL where hue `0` carries meaning (= red) whereas `"none"` signals "no hue, this is grey".
- **`alpha`** (optional) — `0` fully transparent through `1` fully opaque. Defaults to `1` when omitted.
- **`hex`** (optional) — a 6-digit CSS hex fallback. Used by legacy tools that can't process the components array. **DevPulse always emits `hex` alongside `components`** to maximise portability.

### Gamut mapping

> *"Gamut mapping is the process of converting colors from one color space to another... translation tools MAY use the gamut mapping algorithm that best fits the use case."*
> — [Color Module § Gamut Mapping](https://www.designtokens.org/TR/2025.10/color/)

Tools may pick their algorithm. DevPulse uses the CSS Color 4 default gamut mapping (CSS Color spec, chroma reduction in OKLCH) for `oklch` → `srgb` conversions emitted as hex fallbacks.

### Interpolation

> *"Colors may be interpolated, or blended, to create new colors... the choice of color space can affect the appearance of the resulting colors."*
> — [Color Module § Interpolation](https://www.designtokens.org/TR/2025.10/color/)

DevPulse interpolates in `oklch` for gradients and state transitions (perceptually uniform). `srgb` interpolation is forbidden for visual tokens.

### DevPulse canonical color example

```json
{
  "teal": {
    "$type": "color",
    "500": {
      "$value": {
        "colorSpace": "oklch",
        "components": [0.55, 0.12, 173],
        "alpha": 1,
        "hex": "#0c7c66"
      },
      "$description": "Primary teal — core DevPulse brand accent"
    }
  }
}
```

---

## 8. Groups and inheritance

A **group** is any JSON object that does NOT contain a `$value` property. Groups organise tokens hierarchically and can carry their own metadata.

### Group properties

| Property | Purpose |
|---|---|
| `$description` | Explains the group's role. |
| `$type` | Default type applied to every descendant leaf that doesn't declare its own. |
| `$extends` | Inherits from another group by path. Deep-merged, descendant values override. |
| `$deprecated` | Marks the entire group obsolete. |
| `$extensions` | Vendor metadata attached to the group. |

### `$type` inheritance

When a leaf omits `$type`, the resolver walks up the ancestor chain until it finds one.

```json
{
  "color": {
    "$type": "color",
    "brand": {
      "teal":    { "$value": { "colorSpace": "oklch", "components": [0.55, 0.12, 173] } },
      "purple":  { "$value": { "colorSpace": "oklch", "components": [0.55, 0.18, 310] } }
    }
  }
}
```

Both `color.brand.teal` and `color.brand.purple` inherit `$type: "color"` from the root.

### `$root` reserved name

A group may contain a reserved token named `$root` that represents the token at the group's own path. Useful for groups that both hold children AND have a direct value themselves.

```json
{
  "color": {
    "accent": {
      "$root": {
        "$type": "color",
        "$value": { "colorSpace": "oklch", "components": [0.55, 0.12, 173] }
      },
      "light": { "$value": "{color.accent.$root}" },
      "dark":  { "$value": "{color.accent.$root}" }
    }
  }
}
```

Here `color.accent` is both a group (containing `light` and `dark`) AND a token (its own value via `$root`).

### `$extends` deep merge

`$extends` follows JSON Schema `$ref` semantics. Local overrides win at the same path. Circular references are **invalid** and must be detected by the resolver.

---

## 9. References and aliases

Two reference mechanisms exist.

### 9.1 Curly-brace path syntax (complete token references)

```json
{
  "color": {
    "brand": {
      "primary": {
        "$type": "color",
        "$value": { "colorSpace": "oklch", "components": [0.55, 0.12, 173] }
      }
    },
    "semantic": {
      "accent": { "$value": "{color.brand.primary}" }
    }
  }
}
```

- Target path is dot-separated.
- Resolves to the target token's **complete `$value`** (the curly-brace form always implicitly appends `/$value`).
- Can only target complete tokens, not sub-properties.
- Supports chained references: A → B → C.
- Case-sensitive.

### 9.2 JSON Pointer syntax (property-level references)

Uses `$ref` per [RFC 6901](https://datatracker.ietf.org/doc/html/rfc6901):

```json
{
  "color": {
    "primary": {
      "$type": "color",
      "$value": { "colorSpace": "oklch", "components": [0.55, 0.12, 173] }
    }
  },
  "hue": {
    "$type": "number",
    "$value": { "$ref": "#/color/primary/$value/components/2" }
  }
}
```

- Targets any location in the document, including sub-properties of composite values.
- Requires the full JSON Pointer path.
- Enables reusing a single channel of a composite value.

### 9.3 Circular references

Both forms forbid circular references. A resolver that encounters one MUST raise an error.

---

## 10. Extensions convention

Vendor-specific metadata lives under `$extensions` with **reverse-DNS keys**:

```json
{
  "teal-500": {
    "$type": "color",
    "$value": { "colorSpace": "oklch", "components": [0.55, 0.12, 173] },
    "$extensions": {
      "com.devpulse.coldlight": {
        "aliases": ["accent-teal-main", "brand-primary"],
        "vpbCategory": "color.brand",
        "laymanName": "Teal",
        "technicalName": "oklch(0.55 0.12 173)"
      },
      "org.example.plugin": {}
    }
  }
}
```

**Rules**:
- Keys MUST be reverse-DNS (domain you own).
- Tools MUST preserve unknown extensions verbatim when saving files — **this is a round-trip guarantee**.
- DevPulse's vendor namespace is `com.devpulse.coldlight`.

---

## 11. Resolution order

When a token's type must be determined, the resolver walks this precedence chain top-to-bottom:

1. The token's own `$type` property (if declared).
2. The nearest ancestor group's `$type` property.
3. The resolved target type if the token is an alias (the alias inherits from whatever it points at).
4. **Invalid** — error out if no type can be determined.

When merging multiple sources (see [Resolver Module § 12](#12-resolver-module-themes-modes-merging)), sources later in the merge order override sources earlier in the order.

---

## 12. Resolver Module (themes, modes, merging)

The Resolver Module defines how a tool combines multiple token files into a single resolved output, supporting themes, modes, and contextual overrides without combinatorial explosion.

### File format

| Requirement | Value |
|---|---|
| **File extension** | `.resolver.json` |
| **Format** | Standard JSON (or JSONC / JSON5 with optional support) |
| **MIME type** | `application/json` |

### Root properties

| Property | Required | Purpose |
|---|---|---|
| `version` | yes | Must be `"2025.10"` |
| `name` | no | Human-readable name |
| `description` | no | Free-text explanation |
| `sets` | yes | Collections of token sources |
| `modifiers` | no | Conditional token collections mapped to context values (themes, modes) |
| `resolutionOrder` | yes | Array of set and modifier names determining merge precedence |
| `$schema` | no | Schema URI |
| `$extensions` | no | Vendor metadata |
| `$defs` | no | Reusable definitions |

### Resolution pipeline (4 stages)

> *"The order is significant, with tokens later in the array overriding any tokens that came before them, in case of conflict."*
> — [Resolver Module § Resolution](https://www.designtokens.org/TR/2025.10/resolver/)

1. **Input validation** — verify that every supplied modifier input matches a defined context.
2. **Ordering** — flatten the `sets` in order, then apply the active modifier contexts in the order declared by `resolutionOrder`.
3. **Aliases** — resolve token references after flattening.
4. **Resolution** — produce the final merged token structure.

### Modifier shape (theme / mode switching)

```json
{
  "version": "2025.10",
  "name": "DevPulse ColdLight Theme Resolver",
  "sets": {
    "primitives": { "sources": ["tokens/primitives.tokens.json"] },
    "semantic":   { "sources": ["tokens/semantic.tokens.json"] },
    "components": { "sources": ["tokens/components.tokens.json"] }
  },
  "modifiers": {
    "theme": {
      "default": "dark",
      "contexts": {
        "dark":  { "sources": ["tokens/modes/dark.tokens.json"] },
        "light": { "sources": ["tokens/modes/light.tokens.json"] }
      }
    },
    "density": {
      "default": "normal",
      "contexts": {
        "compact": { "sources": ["tokens/modes/compact.tokens.json"] },
        "normal":  { "sources": ["tokens/modes/normal.tokens.json"] },
        "roomy":   { "sources": ["tokens/modes/roomy.tokens.json"] }
      }
    }
  },
  "resolutionOrder": [
    "primitives",
    "semantic",
    "theme",
    "density",
    "components"
  ]
}
```

- **Precedence** — the last entry in `resolutionOrder` wins.
- **Defaults** — modifiers may declare a `default` context applied when the caller doesn't specify.
- **Orthogonality** — recommended (but not required) that modifiers operate on disjoint token sets so the merge order doesn't accidentally clobber unrelated tokens.

### `$ref` in resolver files

Resolver files can reference:

| Form | Example |
|---|---|
| External file (full) | `{ "$ref": "tokens/primitives.tokens.json" }` |
| Internal structure | `{ "$ref": "#/sets/primitives" }` |
| Partial external | `{ "$ref": "tokens/primitives.tokens.json#/color/brand" }` |

Circular references and self-references are invalid. **Modifiers cannot reference other modifiers** — prevents cascading conditionals.

### Bundling strategies

Two supported approaches:

1. **Inlining** — copy file contents into the resolver for self-contained distribution.
2. **$defs organisation** — store reusable blocks under `$defs` and reference them from multiple sets.

---

## 13. DevPulse compliance status (as of 2026-04-11)

**The real source of truth for Tier 1 tokens is [`scripts/build/styledictionary/generate-scales.mjs`](../../../../scripts/build/styledictionary/generate-scales.mjs) — a 468-line parameterized formula script, not hand-authored JSON.** It generates every color ramp, gradient pair, fluid-clamp dimension, shadow stack, easing curve, and duration from formulas. The current single output file `generated-scales.tokens.json` is 2472 lines and already contains the complete 28-hue color wheel, fluid space scale, shadow depth scale, cubic-bezier easings, and mesh gradients. The DTCG rewrite is a **generator rewrite** — the formulas stay, the emit shape changes.

### What the generator already produces (accurate inventory, 2026-04-11)

| Scale | Generator function | Stops / count | Parameters |
|---|---|---|---|
| **Color ramp** | `colorRamp(hue, chroma)` | 11 stops per hue (`50..950`), OKLCH lightness sweep `0.97 → 0.12` | hue in degrees, chroma fixed per hue |
| **Void ramp** | `voidRamp(220, 0.01)` | 11 stops + `base` anchor at `oklch(0.08 0.01 220)` | ultra-low chroma dark scale |
| **Brand primaries** | 6 hues via `colorRamp` | teal (173°), purple (280°), magenta (330°), ember (25°), frost (220°), cyber (160°) | = 66 color tokens |
| **Named brand accents** | 7 hues via `colorRamp` | brand-cyan (195°), brand-green (155°), brand-hotpink (355°), brand-coral (10°), brand-blue (240°), brand-salmon (15°), brand-gold (100°) | = 77 color tokens |
| **30° color wheel** | 22 hues via `colorRamp` | red (17°), red-orange (38°), orange (58°), amber (87°), yellow (110°), chartreuse (124°), lime (134°), green-yellow (140°), green (143°), green-cyan (150°), spring (155°), mint (170°), cyan (195°), sky (225°), azure (250°), royal (265°), blue (270°), indigo (285°), violet (300°), rose (340°), pink (350°), crimson (10°) | = 242 color tokens |
| **Achromatic** | `colorRamp(0, 0)` + static | neutral (11 stops), white, black | = 13 tokens |
| **Gradient pairs** | `gradientPairs({…})` | 3 variants (surface / glow / accent) × 13 hues | = 39 gradients |
| **Mesh gradients** | hand-authored in generator | aurora, sunset, frost, void | = 4 multi-stop gradients |
| **Space scale** | `fluidDim(minPx, maxPx)` with 2-px threshold gate | 32 steps (`0` through `128`) | `linearScale` interpolation + `clamp()` emission |
| **Padding** | `fluidDim` pairs | `xs-y/xs-x` through `2xl-y/2xl-x` — 6 pairs | y/x per T-shirt size |
| **Size scale** | `fluidDim` | `3xs..5xl` + `container-xs..2xl` (6 static containers) | 16 entries |
| **Breakpoints** | Static table | `xs` (20rem) through `2xl` (96rem) | 6 entries |
| **Z-index** | Static table | base, raised, dropdown, sticky, overlay, modal, popover, toast, tooltip | 9 entries |
| **Text size** | `fluidDim` from dual-ratio compounding | `3xs..5xl` — minor third mobile (1.2) → perfect fourth desktop (1.333) with inversion-guard | 11 entries |
| **Radius** | `fluidDim` + static `none` + static `full` | none, xs, sm, md, lg, xl, 2xl, full | 8 entries |
| **Blur** | Static table | off, sm, md, lg, xl, 2xl | 6 entries |
| **Opacity** | `linearScale(0.1, 1.0, 10)` | `10..100` in 10 steps | 10 entries |
| **Shadow depth** | `shadowScale(5, 0.0625, 0.1875, 'oklch(0 0 0')` | z0 (none) through z4, multipliers `[0, 1, 3, 10, 15]` | 5 entries |
| **Easing** | Static table | linear, ease-in, ease-out, ease-in-out, spring, bounce | 6 cubic-beziers |
| **Duration** | Static table | snap (50), fast (150), normal (250), smooth (400), glacial (700), moderate (3000) | 6 durations |

**Total tokens emitted today**: ~460 entries computed by formula + table, every one DTCG-shaped at the `$type` level, but the `$value` bodies are CSS strings (non-compliant — the rewrite fixes that without touching the formulas).

### DTCG compliance audit (pre-rewrite)

| Area | Current (post-generator) | DTCG 2025.10 requires | Status |
|---|---|---|---|
| **File extension** | `.json` and `.tokens.json` mixed | `.tokens.json` or `.tokens` uniformly | ❌ mixed |
| **Color `$value`** | CSS function string `"oklch(0.55 0.12 173)"` | `{ "colorSpace": "oklch", "components": [0.55, 0.12, 173], "alpha": 1, "hex": "#..." }` object | ❌ needs emitter rewrite |
| **Shadow `$value`** | CSS shorthand `"0 0.0625rem 0.1875rem oklch(0 0 0) / 0.15..."` | Object (single) or array (layered) with `color` / `offsetX` / `offsetY` / `blur` / `spread` DTCG sub-values | ❌ needs emitter rewrite |
| **Dimension `$value`** | Rem string `"0.0625rem"` | `{ "value": 0.0625, "unit": "rem" }` | ❌ needs emitter rewrite |
| **CubicBezier `$value`** | CSS function string `"cubic-bezier(0.34, 1.56, 0.64, 1)"` | `[0.34, 1.56, 0.64, 1]` array | ❌ needs emitter rewrite |
| **Duration `$value`** | Ms string `"50ms"` | `{ "value": 50, "unit": "ms" }` | ❌ needs emitter rewrite |
| **Gradient `$value`** | CSS function string `"linear-gradient(…)"` | `gradient` composite — array of `{ color, position }` stops | ❌ needs emitter rewrite |
| **Opacity `$value`** | JSON number | DTCG `number` | ✅ compliant |
| **Z-index `$value`** | JSON number (stored as string in table) | DTCG `number` | ⚠ cosmetic cleanup |
| **`$type` declarations** | Present at group level | Inheritance supported | ✅ compliant |
| **Group hierarchy** | Nested objects without `$value` | Correct shape | ✅ compliant |
| **`$description` usage** | Present on some leaves, missing on others | Preserved verbatim; DevPulse rule requires it on every leaf | ⚠ incomplete coverage |
| **References** | None used in generator output | Curly-brace or `$ref` supported | ➖ not required for Tier 1 |
| **`$extensions`** | None used | Reverse-DNS preserved round-trip | ➖ not required for Tier 1 |
| **File split** | Monolithic `generated-scales.tokens.json` (2472 lines) | File-per-atom with barrels for junior legibility | ❌ needs writer rewrite |
| **Resolver module** | No `.resolver.json` on disk | Required for multi-theme / multi-mode | ❌ not started |
| **Reserved character violations** | None found | Required | ✅ compliant |

### The pre-release rewrite scope (corrected — the generator stays, the emit shape changes)

**No backwards compat. No shims. No hand-patching token-by-token.** The rewrite is a **generator rewrite**, not a token rewrite:

1. **Update `generate-scales.mjs` emitter** to output the DTCG 2025.10 object forms everywhere a primitive value lands — colors, shadows, gradients, dimensions, cubic-beziers, durations.
2. **Compute `hex` fallback at generator time** for every color token using CSS Color 4 gamut-mapped chroma reduction from `oklch` → `srgb`. Emits alongside `components` so legacy tools can round-trip the token.
3. **Split the single writer into a multi-file writer** — walk the `SCALES` tree, emit one file per leaf category (one file per hue under `primitives/color/brand/`, `primitives/color/brand-accent/`, `primitives/color/wheel/`, `primitives/color/achromatic/`; one file per scale-concern under `primitives/dimension/`; etc.) per the layout in [§ 14](#14-devpulse-target-structure--file-per-atom-barrels-push-upward).
4. **Emit generated `index.ts` barrels** from the same pass — each category folder gets an auto-generated barrel that imports every leaf JSON file by name and re-exports a typed union. No hand-written barrels for generated content.
5. **Add a generator header warning** as `$description` at the root of every emitted file: `"GENERATED by generate-scales.mjs — DO NOT HAND-EDIT. Modify the generator and re-run pnpm ds:generate-scales."`
6. **Delete the monolithic output** `generated-scales.tokens.json` once the multi-file output validates.
7. **Author `tokens.resolver.json`** at the tokens root with `theme` / `density` / `motion` / `contrast` modifiers per § 12.
8. **Update `sd.config.mjs`** to consume the new `src/**/*.tokens.json` glob and emit the DTCG-aware CSS format (Style Dictionary v5 `css/variables` format accepts DTCG object forms natively).
9. **Hand-authored Tier 2 and Tier 3 files** (semantic + component) are rewritten separately in Phase C — they're not generator output, they're human decisions referencing Tier 1.
10. **Round-trip validation** via [`design-tokens-format-module`](https://github.com/nclsndr/design-tokens-format-module) or Style Dictionary v5's DTCG preprocessor. Build fails if any emitted token doesn't parse under the DTCG 2025.10 format validator.

---

## 14. DevPulse target structure — file-per-atom, barrels push upward

**Principle**: every `.tokens.json` is the smallest unit a contributor reads in isolation. A junior opening `primitives/color/brand/teal.tokens.json` sees only the teal hue with its 11 stops and nothing else. A senior composing a preset pulls teal-500, bevel-soft, glow-teal-md, and motion-spring as separate atoms without touching unrelated files. Each category folder has an `index.ts` barrel that imports every leaf by name and re-exports a typed shape — adding a new leaf is one file plus one import line. No globs, no magic, no hidden registration. Reference implementations: [Radix Colors](https://github.com/radix-ui/colors) ships one TS file per hue with a top-level barrel; [IBM Carbon](https://carbondesignsystem.com/guidelines/color/overview/) splits per scale; [Panda CSS](https://panda-css.com/docs/concepts/recipes) uses one file per token category under `theme/tokens/`.

### 14.1 Generator responsibilities vs hand-authored content

**Two distinct authoring paths — zero overlap, zero ambiguity about who owns which file.**

| Tier | Folders | Authoring path | Who edits |
|---|---|---|---|
| **Tier 1 — Primitives (generated)** | `src/primitives/color/**`, `src/primitives/dimension/**`, `src/primitives/motion/**`, `src/primitives/gradient/surface/**`, `src/primitives/gradient/glow/**`, `src/primitives/gradient/accent/**`, `src/primitives/shadow/**`, `src/primitives/layer/**`, `src/primitives/opacity/**`, `src/primitives/typography/font-size.tokens.json` | **Generated** by [`generate-scales.mjs`](../../../../scripts/build/styledictionary/generate-scales.mjs). All formula-derivable or table-derivable. Every file carries a header `$description` warning. | **Nobody hand-edits these.** Modify the generator and re-run `pnpm ds:generate-scales`. |
| **Tier 1 — Hand-authored primitives** | `src/primitives/gradient/mesh/**`, `src/primitives/typography/font-family.tokens.json`, `src/primitives/typography/font-weight.tokens.json`, `src/primitives/typography/line-height.tokens.json`, `src/primitives/typography/letter-spacing.tokens.json` | Human design decisions. Mesh gradients (aurora, sunset, frost, void) are hand-tuned multi-stop artistry. Typography stacks require human brand judgement. | **Senior-reviewed hand edits.** |
| **Tier 2 — Semantic** | `src/semantic/**` | **Hand-authored.** Every file is a human decision about what a primitive *means* in context — glass-deep references primitives/color/achromatic/void, depth-z2 references primitives/shadow/depth. | **Any contributor** with senior review. |
| **Tier 3 — Component** | `src/component/**` | **Hand-authored.** Component-scoped variants and states reference semantic tokens. One folder per kind, one file per concern (base, variants, sizes, states). | **Any contributor** with senior review. |
| **Modifiers** | `src/modes/**` | **Hand-authored.** Deltas only — never full duplicates. Each mode file contains only the tokens that differ from the baseline. | **Senior-reviewed hand edits.** |
| **Root resolver** | `tokens.resolver.json` | **Hand-authored + generator-validated.** The resolver structure is a one-time decision; the generator validates that every `sources` glob it references actually exists. | **Senior-reviewed hand edit.** |
| **TS barrels in generated folders** | `src/primitives/**/index.ts` | **Generated by the same pass** as the JSON files they wrap. Auto-regenerated whenever the generator runs. | **Nobody hand-edits these.** |
| **TS barrels in hand-authored folders** | `src/semantic/**/index.ts`, `src/component/**/index.ts`, `src/modes/**/index.ts` | **Hand-authored**, updated by contributors as they add leaf files. | **Any contributor.** |

**The one-sentence rule**: if a script can emit it from parameters, the script emits it; if it requires a human visual decision, a human authors it. There is no third path.

**Failure-mode protection**: every generated file opens with a root-level `$description` saying `"GENERATED by generate-scales.mjs — DO NOT HAND-EDIT. Modify the generator at scripts/build/styledictionary/generate-scales.mjs and re-run pnpm ds:generate-scales."`. A pre-commit hook greps for that banner and fails the commit if any generated file has been modified without a matching commit to the generator source.

### 14.2 Folder layout (authored for juniors, powerful for seniors)

```
interfaces/desktop/scripts/build/styledictionary/tokens/
│
├── tokens.resolver.json                 # ROOT — DTCG Resolver Module, merges every set + modifier
│
├── src/
│   │
│   ├── primitives/                      # TIER 1 — raw values, no references, no semantic meaning
│   │   ├── README.md                    # Junior guide: what lives here + how to add a file
│   │   │
│   │   ├── color/                       # GENERATED by generate-scales.mjs — DO NOT HAND-EDIT
│   │   │   │                            # 28 hues × 11 stops via colorRamp(hue, chroma)
│   │   │   ├── brand/                   # 6 brand primaries
│   │   │   │   ├── teal.tokens.json         # hue 173°, chroma 0.08 — DevPulse
│   │   │   │   ├── purple.tokens.json       # hue 280°, chroma 0.12 — Clyffy
│   │   │   │   ├── magenta.tokens.json      # hue 330°, chroma 0.14 — OverMind
│   │   │   │   ├── ember.tokens.json        # hue 25°,  chroma 0.12 — DevForge
│   │   │   │   ├── frost.tokens.json        # hue 220°, chroma 0.06
│   │   │   │   ├── cyber.tokens.json        # hue 160°, chroma 0.10
│   │   │   │   └── index.ts                 # GENERATED barrel
│   │   │   ├── brand-accent/            # 7 named brand colors
│   │   │   │   ├── brand-cyan.tokens.json   # 195°, 0.14
│   │   │   │   ├── brand-green.tokens.json  # 155°, 0.17
│   │   │   │   ├── brand-hotpink.tokens.json# 355°, 0.22
│   │   │   │   ├── brand-coral.tokens.json  # 10°,  0.16
│   │   │   │   ├── brand-blue.tokens.json   # 240°, 0.14
│   │   │   │   ├── brand-salmon.tokens.json # 15°,  0.18
│   │   │   │   ├── brand-gold.tokens.json   # 100°, 0.16
│   │   │   │   └── index.ts                 # GENERATED barrel
│   │   │   ├── wheel/                   # 30° full-spectrum color wheel (22 hues)
│   │   │   │   ├── red.tokens.json          # 17°
│   │   │   │   ├── red-orange.tokens.json   # 38°
│   │   │   │   ├── orange.tokens.json       # 58°
│   │   │   │   ├── amber.tokens.json        # 87°
│   │   │   │   ├── yellow.tokens.json       # 110°
│   │   │   │   ├── chartreuse.tokens.json   # 124°
│   │   │   │   ├── lime.tokens.json         # 134°
│   │   │   │   ├── green-yellow.tokens.json # 140°
│   │   │   │   ├── green.tokens.json        # 143°
│   │   │   │   ├── green-cyan.tokens.json   # 150°
│   │   │   │   ├── spring.tokens.json       # 155°
│   │   │   │   ├── mint.tokens.json         # 170°
│   │   │   │   ├── cyan.tokens.json         # 195°
│   │   │   │   ├── sky.tokens.json          # 225°
│   │   │   │   ├── azure.tokens.json        # 250°
│   │   │   │   ├── royal.tokens.json        # 265°
│   │   │   │   ├── blue.tokens.json         # 270°
│   │   │   │   ├── indigo.tokens.json       # 285°
│   │   │   │   ├── violet.tokens.json       # 300°
│   │   │   │   ├── rose.tokens.json         # 340°
│   │   │   │   ├── pink.tokens.json         # 350°
│   │   │   │   ├── crimson.tokens.json      # 10°
│   │   │   │   └── index.ts                 # GENERATED barrel
│   │   │   ├── achromatic/              # neutral + void + absolutes
│   │   │   │   ├── neutral.tokens.json      # hue 0, chroma 0 — 11 grey stops
│   │   │   │   ├── void.tokens.json         # hue 220°, ultra-low chroma + base anchor
│   │   │   │   ├── white.tokens.json        # oklch(1 0 0)
│   │   │   │   ├── black.tokens.json        # oklch(0 0 0)
│   │   │   │   └── index.ts                 # GENERATED barrel
│   │   │   └── index.ts                 # GENERATED top-level color barrel
│   │   │
│   │   ├── gradient/                    # MIXED — surface/glow/accent generated, mesh hand-authored
│   │   │   ├── surface/                 # GENERATED — surface-{hue} depth shift per hue (13 hues)
│   │   │   │   ├── teal.tokens.json
│   │   │   │   ├── purple.tokens.json
│   │   │   │   ├── ember.tokens.json
│   │   │   │   ├── frost.tokens.json
│   │   │   │   ├── cyber.tokens.json
│   │   │   │   ├── magenta.tokens.json
│   │   │   │   ├── brand-cyan.tokens.json
│   │   │   │   ├── brand-green.tokens.json
│   │   │   │   ├── brand-hotpink.tokens.json
│   │   │   │   ├── brand-coral.tokens.json
│   │   │   │   ├── brand-blue.tokens.json
│   │   │   │   ├── brand-salmon.tokens.json
│   │   │   │   ├── brand-gold.tokens.json
│   │   │   │   └── index.ts             # GENERATED barrel
│   │   │   ├── glow/                    # GENERATED — glow-{hue} radial emission per hue (same 13)
│   │   │   │   └── ...                  # same 13 hue files + GENERATED barrel
│   │   │   ├── accent/                  # GENERATED — accent-{hue} dramatic diagonal per hue (same 13)
│   │   │   │   └── ...                  # same 13 hue files + GENERATED barrel
│   │   │   ├── mesh/                    # HAND-AUTHORED — 4 multi-stop named gradients
│   │   │   │   ├── aurora.tokens.json   # teal → cyan → purple
│   │   │   │   ├── sunset.tokens.json   # ember → magenta → purple
│   │   │   │   ├── frost.tokens.json    # frost → teal → cyber
│   │   │   │   ├── void.tokens.json     # deep dark descent
│   │   │   │   └── index.ts             # HAND-AUTHORED barrel
│   │   │   └── index.ts                 # TOP-LEVEL (mixed) — imports all 4 subgroups
│   │   │
│   │   ├── dimension/                   # GENERATED — fluid-clamp scales via fluidDim()
│   │   │   ├── space.tokens.json        # 32 fluid steps (0 through 128)
│   │   │   ├── padding.tokens.json      # xs-y/xs-x through 2xl-y/2xl-x — 6 pairs
│   │   │   ├── size.tokens.json         # 3xs..5xl + container-xs..2xl (6 static containers)
│   │   │   ├── radius.tokens.json       # none, xs..2xl (fluid), full (static)
│   │   │   ├── blur.tokens.json         # off, sm..2xl
│   │   │   ├── border-width.tokens.json # hairline, thin, medium, thick
│   │   │   ├── breakpoint.tokens.json   # xs..2xl (static)
│   │   │   └── index.ts                 # GENERATED barrel
│   │   │
│   │   ├── motion/                      # GENERATED — tables from generate-scales.mjs
│   │   │   ├── duration.tokens.json     # snap (50), fast (150), normal (250), smooth (400), glacial (700), moderate (3000)
│   │   │   ├── easing.tokens.json       # linear, ease-in, ease-out, ease-in-out, spring, bounce
│   │   │   ├── keyframes.tokens.json    # breathe, drift, shimmer, pulse, float, scale-in, slide-up, ... (named animations)
│   │   │   └── index.ts                 # GENERATED barrel
│   │   │
│   │   ├── shadow/                      # GENERATED — shadowScale(5, ...) produces z0..z4
│   │   │   ├── depth.tokens.json        # z0 (none) through z4, DTCG shadow composite array
│   │   │   └── index.ts                 # GENERATED barrel
│   │   │
│   │   ├── layer/                       # GENERATED — z-index semantic layers
│   │   │   ├── z-index.tokens.json      # base, raised, dropdown, sticky, overlay, modal, popover, toast, tooltip
│   │   │   └── index.ts                 # GENERATED barrel
│   │   │
│   │   ├── opacity/                     # GENERATED — linearScale 10-step
│   │   │   ├── opacity.tokens.json      # 10, 20, 30 ... 100
│   │   │   └── index.ts                 # GENERATED barrel
│   │   │
│   │   ├── typography/                  # MIXED — font-size generated, rest hand-authored
│   │   │   ├── font-family.tokens.json  # HAND-AUTHORED — sans, display, mono (brand decision)
│   │   │   ├── font-weight.tokens.json  # HAND-AUTHORED — thin..black aliases
│   │   │   ├── font-size.tokens.json    # GENERATED — 11 fluid compounding sizes
│   │   │   ├── line-height.tokens.json  # HAND-AUTHORED — none..loose
│   │   │   ├── letter-spacing.tokens.json # HAND-AUTHORED
│   │   │   └── index.ts                 # mixed barrel (hand-authored wrapper)
│   │   │
│   │   └── index.ts                     # TIER BARREL — GENERATED (re-runs whenever generator runs)
│   │
│   ├── semantic/                        # TIER 2 — purpose-driven aliases; references Tier 1 only
│   │   ├── README.md
│   │   │
│   │   ├── surface/                     # ONE FILE PER SURFACE FAMILY
│   │   │   ├── glass.tokens.json        # glass-void, glass-smoke, glass-deep, glass-frost, glass-teal, glass-purple
│   │   │   ├── matte.tokens.json        # matte-dark, matte-medium, matte-light
│   │   │   ├── solid.tokens.json        # surface-base, surface-raised, surface-overlay, surface-inset
│   │   │   ├── backdrop.tokens.json     # per-hub circuit-grid backdrops
│   │   │   └── index.ts
│   │   │
│   │   ├── text/
│   │   │   ├── color.tokens.json        # text-primary, text-secondary, text-muted, text-accent, text-inverse
│   │   │   ├── style.tokens.json        # body, body-sm, caption, code, heading-sm, heading-lg, display-sm, display-lg (composite typography)
│   │   │   └── index.ts
│   │   │
│   │   ├── border/
│   │   │   ├── color.tokens.json        # border-subtle, border-soft, border-strong, border-focus, border-emphasis, border-divider
│   │   │   ├── style.tokens.json        # border composites per named style
│   │   │   └── index.ts
│   │   │
│   │   ├── shadow/                      # ONE FILE PER SHADOW FAMILY — axes never blended
│   │   │   ├── depth.tokens.json        # z0..z4 — real elevation shadows
│   │   │   ├── bevel.tokens.json        # off, subtle, soft, medium, pronounced, deep, raised, pressed (neumorphic)
│   │   │   ├── glow.tokens.json         # off, teal, purple, magenta, ember, cyber, frost, blue + spread sm/md/lg/xl
│   │   │   └── index.ts
│   │   │
│   │   ├── motion/
│   │   │   ├── transition.tokens.json   # fast, normal, slow (duration + easing composites)
│   │   │   ├── animation.tokens.json    # named animations bound to keyframes + duration + easing
│   │   │   └── index.ts
│   │   │
│   │   ├── signal/                      # SEMANTIC STATE COLORS
│   │   │   ├── success.tokens.json      # references green
│   │   │   ├── warning.tokens.json      # references amber
│   │   │   ├── error.tokens.json        # references red
│   │   │   ├── info.tokens.json         # references blue
│   │   │   └── index.ts
│   │   │
│   │   ├── role/                        # ROLE-TO-COLOR MAPPING — first-class for DevPulse
│   │   │   ├── brain.tokens.json        # brain role → purple
│   │   │   ├── vision.tokens.json       # vision role → cyan/teal
│   │   │   ├── voice.tokens.json        # voice role → amber
│   │   │   ├── memory.tokens.json       # memory role → green
│   │   │   └── index.ts
│   │   │
│   │   ├── interaction/                 # STATE-LAYER TOKENS
│   │   │   ├── hover.tokens.json
│   │   │   ├── active.tokens.json
│   │   │   ├── selected.tokens.json
│   │   │   ├── focus.tokens.json
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                     # TIER BARREL
│   │
│   ├── component/                       # TIER 3 — component-scoped; references Tier 2 only
│   │   ├── README.md
│   │   │
│   │   ├── button/
│   │   │   ├── base.tokens.json         # shared across every button variant
│   │   │   ├── variants.tokens.json     # primary, secondary, ghost, danger, outline
│   │   │   ├── sizes.tokens.json        # sm, md, lg
│   │   │   ├── states.tokens.json       # hover, active, disabled, loading, pressed, focused
│   │   │   └── index.ts
│   │   │
│   │   ├── card/
│   │   │   ├── base.tokens.json
│   │   │   ├── variants.tokens.json     # default, glass-deep, matte, elevated, flat, glow-teal
│   │   │   ├── states.tokens.json
│   │   │   └── index.ts
│   │   │
│   │   ├── dialog/                      # + every other component kind — 92 total
│   │   ├── input/                       # text-field, textarea, search-field, number-field, date-field
│   │   ├── dropdown/                    # select, combobox, menu, popover
│   │   ├── feedback/                    # toast, banner, alert, inline-message
│   │   ├── navigation/                  # tabs, sidebar, nav, breadcrumbs
│   │   ├── overlay/                     # sheet, tooltip, popover
│   │   ├── progress/                    # spinner, progress-bar, meter, skeleton
│   │   │
│   │   └── index.ts                     # TIER BARREL
│   │
│   ├── modes/                           # MODIFIERS — overrides only, never full duplicates
│   │   ├── README.md
│   │   │
│   │   ├── theme/
│   │   │   ├── dark.tokens.json         # default — override surface/text/border darker variants
│   │   │   ├── light.tokens.json        # override surface/text/border lighter variants
│   │   │   ├── high-contrast.tokens.json
│   │   │   └── index.ts
│   │   │
│   │   ├── density/
│   │   │   ├── compact.tokens.json      # override dimension/space → tighter
│   │   │   ├── normal.tokens.json       # default
│   │   │   ├── roomy.tokens.json        # override dimension/space → looser
│   │   │   └── index.ts
│   │   │
│   │   ├── motion/                      # accessibility modifier
│   │   │   ├── full.tokens.json         # default
│   │   │   ├── reduced.tokens.json      # override motion/duration → snap, disable animations
│   │   │   └── index.ts
│   │   │
│   │   ├── contrast/
│   │   │   ├── normal.tokens.json       # default
│   │   │   ├── high.tokens.json         # stronger borders, remove transparency, stronger text
│   │   │   └── index.ts
│   │   │
│   │   └── index.ts                     # MODIFIER BARREL
│   │
│   └── index.ts                         # ROOT BARREL — single entry point for the whole system
```

### Barrel pattern — how files push upward

Each `index.ts` imports ONLY from its immediate children and re-exports a typed, composable shape. Adding a new leaf file is **one file plus one import line** in the category barrel — nothing else changes.

#### Leaf (one atomic concern)

```json
// primitives/color/teal.tokens.json
{
  "teal": {
    "$type": "color",
    "$description": "DevPulse primary brand — perceptually uniform OKLCH scale",
    "50":  { "$value": { "colorSpace": "oklch", "components": [0.97, 0.02, 173], "hex": "#e8f7f3" }, "$description": "Lightest teal — subtle surface tint" },
    "500": { "$value": { "colorSpace": "oklch", "components": [0.55, 0.12, 173], "hex": "#0c7c66" }, "$description": "Core DevPulse brand accent" },
    "950": { "$value": { "colorSpace": "oklch", "components": [0.15, 0.04, 173], "hex": "#0a221c" }, "$description": "Darkest teal — glass-void tint" }
  }
}
```

#### Category barrel (one per tier-subgroup)

```ts
// primitives/color/index.ts
import teal    from './teal.tokens.json'    with { type: 'json' };
import purple  from './purple.tokens.json'  with { type: 'json' };
import magenta from './magenta.tokens.json' with { type: 'json' };
import ember   from './ember.tokens.json'   with { type: 'json' };
import cyber   from './cyber.tokens.json'   with { type: 'json' };
import frost   from './frost.tokens.json'   with { type: 'json' };
import neutral from './neutral.tokens.json' with { type: 'json' };
import red     from './red.tokens.json'     with { type: 'json' };
import green   from './green.tokens.json'   with { type: 'json' };
import amber   from './amber.tokens.json'   with { type: 'json' };
import blue    from './blue.tokens.json'    with { type: 'json' };

export const colorTokens = {
  ...teal, ...purple, ...magenta, ...ember, ...cyber,
  ...frost, ...neutral, ...red, ...green, ...amber, ...blue,
} as const;

export type ColorHue = keyof typeof colorTokens;
```

#### Tier barrel (one per tier)

```ts
// primitives/index.ts
import { colorTokens }      from './color/index.js';
import { dimensionTokens }  from './dimension/index.js';
import { motionTokens }     from './motion/index.js';
import { typographyTokens } from './typography/index.js';

export const primitives = {
  color:      colorTokens,
  dimension:  dimensionTokens,
  motion:     motionTokens,
  typography: typographyTokens,
} as const;
```

#### Root barrel (single app entry point)

```ts
// tokens/src/index.ts
export { primitives } from './primitives/index.js';
export { semantic }   from './semantic/index.js';
export { component }  from './component/index.js';
export { modes }      from './modes/index.js';
```

**Consumption**:
- **Style Dictionary v5** reads the `.tokens.json` files directly via glob — never the TS barrels. SD5 emits the compiled CSS.
- **The TS barrels** are the typed view used by the VPB + the preset composer + compile-time reference validation.
- **The VPB** reads the TS barrels for typed controls (autocomplete, validation) and writes back to `.tokens.json` for persistence.
- **Result**: one authoring surface, two consumer views, zero drift. If the JSON changes, the TS barrel regenerates; if the TS drifts, the build fails.

### Ten rules that keep the system junior-legible and senior-powerful

1. **Every tier can reference only the tier below it.** `semantic/` references `primitives/`. `component/` references `semantic/`. `modes/` references whatever tier it's overriding. Components never skip to primitives. Enforced by a lint rule that parses token `$value` references and checks the path.
2. **Every leaf file is one concern.** A junior opening `semantic/shadow/bevel.tokens.json` sees only bevel definitions — no glow, no depth, no border. If a second unrelated `$type` is being added, split the file.
3. **Every category folder has an `index.ts` barrel that imports each leaf file by name.** Adding a new leaf = add the file + one import line. No globs. A junior reading the barrel sees exactly what's in the category.
4. **Every folder has a `README.md`.** Copy-paste template across folders: what lives here, how to add a file, who to ask. Identical junior experience everywhere.
5. **File names are kebab-case, match the primary key inside the file, and match the TS import identifier.** `teal.tokens.json` contains root key `teal`, imported as `import teal from './teal.tokens.json'`. No indirection.
6. **Modifiers are overrides, never full duplicates.** `dark.tokens.json` contains only the tokens that differ from the baseline. The resolver merges. A junior reading a mode file sees a short delta, not a shadow copy.
7. **Every file has a `$description` at its root and on every leaf token.** Tool rejects PRs missing descriptions. Source of VPB tooltips and AI help text.
8. **Vendor extensions live only under `$extensions.com.devpulse.coldlight`**. VPB writes it; manual edits require senior review.
9. **Token references use the curly-brace form for whole tokens, `$ref` JSON Pointer for sub-properties of composites.** Mechanical, not stylistic.
10. **No file exceeds ~200 lines.** Split and re-barrel if it does. One file, one screen, one concept.

### VPB experience driven by this structure

**Junior path (guided, UI-driven)**:
- VPB opens a component. Shows **component-level presets** from `component/{kind}/variants.tokens.json` as named chips ("Primary", "Secondary", "Ghost"). Pick one → done. Junior never sees a raw token.
- Want to tweak? VPB surfaces the **semantic layer**: "make the shadow softer", "reduce the glow". VPB writes a `$ref` into the semantic tier. Junior still never touches primitive hex/OKLCH values.
- Every control tooltip comes from `$description`. Junior discovers the vocabulary by hovering.
- Invalid references fail the save with plain-English errors sourced from the tier-ancestor `$description`.

**Senior path (advanced mode, UI-driven but powerful)**:
- Senior toggles advanced mode. VPB exposes the **atomic primitive tier** directly — every hue, dimension, duration, easing curve.
- Senior drags teal-500 + bevel-soft + glow-teal-md + motion-spring into a new preset slot. VPB resolves and previews live.
- Senior authors a new semantic token on the fly: "`surface.glass.neural-deep` = glass-deep + backdrop-glow-purple". VPB writes it into `semantic/surface/glass.tokens.json` and the new token is immediately composable.
- Senior can also open any `.tokens.json` by hand — same contract, hot-reloaded, no second authoring surface.

### Root `tokens.resolver.json`

```json
{
  "version": "2025.10",
  "name": "ColdLight Token Resolver",
  "description": "DevPulse design system resolver — merges primitives → semantic → theme → density → motion → contrast → component",
  "sets": {
    "primitives": { "sources": ["src/primitives/**/*.tokens.json"] },
    "semantic":   { "sources": ["src/semantic/**/*.tokens.json"] },
    "component":  { "sources": ["src/component/**/*.tokens.json"] }
  },
  "modifiers": {
    "theme": {
      "default": "dark",
      "contexts": {
        "dark":          { "sources": ["src/modes/theme/dark.tokens.json"] },
        "light":         { "sources": ["src/modes/theme/light.tokens.json"] },
        "high-contrast": { "sources": ["src/modes/theme/high-contrast.tokens.json"] }
      }
    },
    "density": {
      "default": "normal",
      "contexts": {
        "compact": { "sources": ["src/modes/density/compact.tokens.json"] },
        "normal":  { "sources": ["src/modes/density/normal.tokens.json"] },
        "roomy":   { "sources": ["src/modes/density/roomy.tokens.json"] }
      }
    },
    "motion": {
      "default": "full",
      "contexts": {
        "full":    { "sources": ["src/modes/motion/full.tokens.json"] },
        "reduced": { "sources": ["src/modes/motion/reduced.tokens.json"] }
      }
    },
    "contrast": {
      "default": "normal",
      "contexts": {
        "normal": { "sources": ["src/modes/contrast/normal.tokens.json"] },
        "high":   { "sources": ["src/modes/contrast/high.tokens.json"] }
      }
    }
  },
  "resolutionOrder": [
    "primitives",
    "semantic",
    "theme",
    "density",
    "motion",
    "contrast",
    "component"
  ]
}
```

**Resolution order reasoning**: primitives first (raw values), semantic second (purpose-driven aliases built on primitives), then modifiers in order of user frequency (theme is picked most often, density second, accessibility modes third), component last so component-scoped overrides always win. Per the DTCG Resolver Module § 12, "tokens later in the array override any tokens that came before them" — the component tier wins every conflict, which is exactly what a designer expects.

---

## 15. Authoring rules for DevPulse contributors

1. **Every token file ends in `.tokens.json`**. No exceptions.
2. **Every color token uses the Color Module object form**. Raw `oklch(...)` / `#RRGGBB` strings are forbidden.
3. **Every shadow is a DTCG shadow object or array**. CSS shorthand strings are forbidden.
4. **Every dimension is a `{ value, unit }` object**. Bare numbers or CSS strings are forbidden.
5. **Every group declares `$type` once at the highest level it applies**. Leaves inherit; don't repeat.
6. **Every leaf has `$description`**. Required for VPB labelling and AI-populated help text.
7. **Aliases use curly-brace references when referring to complete tokens, `$ref` when referring to sub-properties of composites**.
8. **Vendor metadata lives under `$extensions.com.devpulse.coldlight`** and only there.
9. **Reserved characters (`$`, `{`, `}`, `.`) are forbidden in names**. Kebab-case at every level.
10. **Theme and density switching goes through the resolver**. Never duplicate a token under both `dark` and `light` at the primitive/semantic/component tiers — author once, override in the mode file.
11. **No `!important`. No CSS-only fallbacks. No `-webkit-` prefixes in token values**. Everything is logical.
12. **No drift back into pre-release patches.** If a token can't be expressed in the DTCG schema, flag it, don't work around it.

---

## 16. Sources

**Primary spec**

- [DTCG Format Module 2025.10](https://www.designtokens.org/TR/2025.10/format/) — draft published 2026-04-10
- [DTCG Color Module 2025.10](https://www.designtokens.org/TR/2025.10/color/) — draft published 2026-04-10
- [DTCG Resolver Module 2025.10](https://www.designtokens.org/TR/2025.10/resolver/) — draft published 2026-04-10
- [DTCG Technical Reports index](https://www.designtokens.org/tr/drafts/)
- [First stable milestone announcement (2025-10-28)](https://www.w3.org/community/design-tokens/2025/10/28/design-tokens-specification-reaches-first-stable-version/)

**Community group and repo**

- [Design Tokens Community Group landing](https://www.designtokens.org/)
- [W3C Community page](https://www.w3.org/community/design-tokens/)
- [GitHub: design-tokens/community-group](https://github.com/design-tokens/community-group)

**Reference implementations**

- [Style Dictionary v5 DTCG page](https://styledictionary.com/info/dtcg/)
- [Style Dictionary format docs](https://styledictionary.com/info/tokens/)
- [`design-tokens-format-module` TypeScript implementation](https://github.com/nclsndr/design-tokens-format-module)

**Related standards**

- [RFC 6901 — JavaScript Object Notation (JSON) Pointer](https://datatracker.ietf.org/doc/html/rfc6901) — underpins `$ref` property-level references.
- [CSS Color Module Level 4](https://www.w3.org/TR/css-color-4/) — gamut mapping and color space definitions referenced by the DTCG Color Module.

**Cited by DTCG editors**

Louis Chenais, Kathleen McMahon, Drew Powers, Matthew Ström-Awn, Donna Vitan.

---

**This document is the DevPulse reference. If the upstream spec changes, update this file first, then update the token source files to match. Treat this file as a lossless local copy of the spec — if you can't answer a DTCG question from this document alone, the document is incomplete and should be extended.**
