# DTCG Token Format — Style Dictionary v5

> Design Tokens Community Group (DTCG) specification as implemented in SD5.
> Spec: https://tr.designtokens.org/format/

## DTCG vs Legacy Format

SD5 auto-detects DTCG mode when any token uses `$value` instead of `value`.
You can force it with `usesDtcg: true` in config.

```jsonc
// DTCG format (SD5 preferred)
{
  "color": {
    "$type": "color",           // Type applies to all children
    "blue": {
      "500": {
        "$value": "#3b82f6",
        "$description": "Primary blue"
      }
    }
  }
}

// Legacy format (still supported)
{
  "color": {
    "blue": {
      "500": {
        "value": "#3b82f6",
        "type": "color",
        "comment": "Primary blue"
      }
    }
  }
}
```

## Token Properties

| DTCG Property | Legacy Equivalent | Purpose |
|---|---|---|
| `$value` | `value` | The token's resolved value |
| `$type` | `type` | Token type (can be inherited from ancestors) |
| `$description` | `comment` | Human-readable description |
| `$extensions` | (none) | Vendor/tool-specific metadata |

## Type Inheritance

`$type` set on a group applies to all descendant tokens:

```json
{
  "spacing": {
    "$type": "dimension",
    "1": { "$value": "4px" },
    "2": { "$value": "8px" },
    "3": { "$value": "12px" }
  }
}
```

All three tokens inherit `$type: "dimension"` without repeating it.

## DTCG Token Types

### Primitive Types

| Type | $value Format | Example |
|---|---|---|
| `color` | String (hex, rgb, hsl, named) or DTCG color object | `"#3b82f6"` |
| `dimension` | Number + unit string | `"16px"`, `"1.5rem"` |
| `fontFamily` | String or string[] | `["Inter", "sans-serif"]` |
| `fontWeight` | Number or keyword | `400`, `"bold"` |
| `duration` | Number + unit string | `"200ms"`, `"0.3s"` |
| `cubicBezier` | [number, number, number, number] | `[0.4, 0, 0.2, 1]` |
| `number` | Number | `1.5` |
| `strokeStyle` | String or object | `"solid"`, `"dashed"` |
| `boolean` | Boolean | `true` |

### DTCG Color Object (v2025.10)

SD5 supports the new DTCG color value format for wide-gamut colors:

```typescript
interface DTCGColorValue {
  colorSpace: DTCGColorSpace;  // 'srgb' | 'display-p3' | 'oklch' | 'oklab' | ...
  components: (number | 'none')[];
  alpha?: number | 'none';
  hex?: string;                // Optional sRGB fallback
}

type DTCGColorSpace =
  | 'srgb' | 'srgb-linear'
  | 'display-p3'
  | 'a98-rgb' | 'prophoto-rgb' | 'rec2020'
  | 'xyz-d50' | 'xyz-d65'
  | 'lab' | 'lch'
  | 'oklab' | 'oklch'
  | 'hsl' | 'hwb';
```

```json
{
  "brand": {
    "$type": "color",
    "vivid-blue": {
      "$value": {
        "colorSpace": "oklch",
        "components": [0.7, 0.15, 250],
        "alpha": 1
      }
    }
  }
}
```

### Composite Types

These types have object `$value` with named sub-properties:

#### Shadow
```json
{
  "shadow": {
    "$type": "shadow",
    "md": {
      "$value": {
        "offsetX": "0px",
        "offsetY": "4px",
        "blur": "6px",
        "spread": "-1px",
        "color": "rgba(0, 0, 0, 0.1)"
      }
    }
  }
}
```

#### Typography
```json
{
  "heading": {
    "$type": "typography",
    "h1": {
      "$value": {
        "fontFamily": "{font.family.sans}",
        "fontSize": "{font.size.4xl}",
        "fontWeight": "{font.weight.bold}",
        "lineHeight": "{font.lineHeight.tight}",
        "letterSpacing": "{font.letterSpacing.tight}"
      }
    }
  }
}
```

#### Border
```json
{
  "border": {
    "$type": "border",
    "default": {
      "$value": {
        "width": "1px",
        "style": "solid",
        "color": "{color.border.default}"
      }
    }
  }
}
```

#### Transition
```json
{
  "transition": {
    "$type": "transition",
    "fast": {
      "$value": {
        "duration": "{duration.fast}",
        "timingFunction": "{easing.default}",
        "delay": "0ms"
      }
    }
  }
}
```

#### Gradient
```json
{
  "gradient": {
    "$type": "gradient",
    "brand": {
      "$value": [
        { "color": "{color.blue.500}", "position": "0%" },
        { "color": "{color.purple.500}", "position": "100%" }
      ]
    }
  }
}
```

## Token References

References use curly brace `{path.to.token}` syntax:

```json
{
  "color": {
    "$type": "color",
    "blue": {
      "500": { "$value": "#3b82f6" }
    },
    "action": {
      "primary": { "$value": "{color.blue.500}" }
    }
  }
}
```

### Reference Resolution

- References are resolved **after** preprocessors but **before** transforms
- Circular references throw an error
- Unresolved references behavior controlled by `log.errors.brokenReferences`
- `outputReferences: true` preserves references in output (e.g., `var(--color-blue-500)` in CSS)

### Cross-File References

References work across files. If `core/color.json` defines `color.blue.500`,
then `semantic/color.json` can reference it as `{color.blue.500}`.

The token tree is merged from all source/include files before reference resolution.

### Transitive Transforms

By default, transforms run on the raw `$value`, not the resolved reference.
Set `transitive: true` on a transform to run it on the **resolved** value:

```typescript
StyleDictionary.registerTransform({
  name: 'color/css',
  type: 'value',
  transitive: true,  // ← Runs AFTER references are resolved
  filter: (token) => token.type === 'color',
  transform: (token) => tinycolor(token.value).toRgbString(),
});
```

Without `transitive: true`, a token like `{ "$value": "{color.blue.500}" }`
would receive the **string** `"{color.blue.500}"` as input, not the resolved hex.

## Token Expansion (Composite → Individual)

SD5 can expand composite tokens into individual tokens:

```javascript
const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  expand: true,  // Expand ALL composite types
  // OR selective:
  expand: {
    include: ['shadow', 'typography'],  // Only expand these types
    exclude: ['border'],                 // Don't expand these
  },
  // OR function:
  expand: (token, options, platform) => {
    return token.type === 'typography';
  },
});
```

When expanded, `shadow.md.$value.blur` becomes a separate token `shadow.md.blur`.

### typesMap — Custom Expansion Mapping

```javascript
expand: {
  typesMap: {
    shadow: {
      offsetX: 'dimension',
      offsetY: 'dimension',
      blur: 'dimension',
      spread: 'dimension',
      color: 'color',
    },
    typography: {
      fontFamily: 'fontFamily',
      fontSize: 'dimension',
      fontWeight: 'fontWeight',
      lineHeight: 'number',
      letterSpacing: 'dimension',
    },
  },
}
```

## $extensions

Vendor-specific metadata goes in `$extensions`:

```json
{
  "color": {
    "brand": {
      "$value": "#3b82f6",
      "$type": "color",
      "$extensions": {
        "com.figma": {
          "variableId": "VariableID:123:456",
          "collection": "Brand Colors"
        },
        "com.coldlight": {
          "tier": "core",
          "category": "color"
        }
      }
    }
  }
}
```

`$extensions` is preserved through the pipeline and accessible in transforms/formats.

## ColdLight Token Layer Architecture

ColdLight uses a 4-layer DTCG token architecture:

```
tokens/
├── core/           Primitive values (no references)
│   ├── color.json       6 palettes × 10 shades
│   ├── spacing.json     24 steps (0–24)
│   ├── typography.json  family, weight, size, lineHeight, letterSpacing
│   ├── radius.json      7 steps (none–full)
│   ├── shadow.json      5 levels (none–xl), composite $type: shadow
│   └── motion.json      duration (5 steps) + easing (5 curves, cubicBezier)
│
├── semantic/       Meaning-based aliases (references core)
│   ├── color.light.json  action/surface/text/border/status → core colors
│   ├── color.dark.json   Same structure, dark palette mappings
│   ├── typography.json   Semantic type scales
│   └── layout.json       Semantic spacing/layout
│
├── component/      Per-component tokens (references semantic)
│   ├── button.json      bg/text/border/radius/padding/gap/shadow per variant×size
│   ├── input.json
│   ├── card.json
│   ├── badge.json
│   ├── toggle.json
│   └── tooltip.json
│
└── recipe/         Compositions (references component + semantic)
    ├── form-field.json
    └── data-table.json
```

**Rule:** Each layer only references the layer above it. Never skip layers.
- Core tokens have raw values (`"#3b82f6"`)
- Semantic tokens reference core (`"{color.blue.600}"`)
- Component tokens reference semantic (`"{color.action.primary}"`)
- Recipe tokens reference component + semantic
