# Style Dictionary v5 — Built-in Transforms

> Complete list of every built-in transform extracted from SD5 source (`lib/common/transforms.d.ts`).
> Transforms mutate individual tokens during the build pipeline.

## Transform Types

Every transform has a `type` that determines what it modifies:

| Type | What it modifies | Return type |
|---|---|---|
| `name` | `token.name` — the output name | `string` |
| `value` | `token.value` — the output value | `unknown` |
| `attribute` | `token.attributes` — metadata object | `Record<string, unknown>` |

## Transform Interface

```typescript
interface Transform {
  name: string;
  type: 'name' | 'value' | 'attribute';
  filter?: (token: TransformedToken, options: Config) => boolean;
  transitive?: boolean;  // Run after reference resolution (default: false)
  transform: (
    token: TransformedToken,
    config: PlatformConfig,
    options: Config,
    vol?: Volume
  ) => Promise<Value> | Value;
}
```

## Custom Transform Registration

```typescript
StyleDictionary.registerTransform({
  name: 'custom/my-transform',
  type: 'value',
  filter: (token) => token.type === 'dimension',
  transitive: false,
  transform: (token, platform, options) => {
    return `${parseFloat(token.value) / 16}rem`;
  },
});
```

---

## Attribute Transforms

### `attribute/cti`
Adds `category`, `type`, `item`, `subitem`, `state` based on token path.
- **Matches:** All tokens
- **Returns:** `{ category: "color", type: "background", item: "button", subitem: "primary", state: "active" }`

### `attribute/color`
Adds `hex`, `hsl`, `hsv`, `rgb` color breakdowns.
- **Matches:** `token.type === 'color'`
- **Returns:** `{ hex: "009688", rgb: {r,g,b,a}, hsl: {h,s,l,a}, hsv: {h,s,v,a} }`

---

## Name Transforms

All name transforms respect the `prefix` option on the platform config.

### `name/human`
Human-friendly space-separated name.
- **Matches:** All
- **Returns:** `"button primary"`

### `name/camel`
camelCase name.
- **Matches:** All
- **Returns:** `"colorBackgroundButtonPrimaryActive"` / `"prefixColorBackgroundButtonPrimaryActive"`

### `name/kebab`
kebab-case name (used by CSS transform group).
- **Matches:** All
- **Returns:** `"color-background-button-primary-active"` / `"prefix-color-background-button-primary-active"`

### `name/snake`
snake_case name.
- **Matches:** All
- **Returns:** `"color_background_button_primary_active"`

### `name/constant`
CONSTANT_CASE name.
- **Matches:** All
- **Returns:** `"COLOR_BACKGROUND_BUTTON_PRIMARY_ACTIVE"`

### `name/pascal`
PascalCase name (used by JS transform group).
- **Matches:** All
- **Returns:** `"ColorBackgroundButtonPrimaryActive"`

---

## Color Transforms

All color transforms filter on `token.type === 'color'`. SD5 supports both legacy string values and DTCG color objects.

### `color/rgb`
- **Returns:** `"rgb(0, 150, 136)"`

### `color/hsl`
HSL string, HSLA if alpha present. Legacy comma syntax.
- **Returns:** `"hsl(174, 100%, 29%)"` or `"hsl(174, 100%, 29%, .5)"`

### `color/hsl-4`
Modern HSL syntax (space-separated, slash for alpha).
- **Returns:** `"hsl(174 100% 29%)"` or `"hsl(174 100% 29% / .5)"`

### `color/hex`
6-digit hex (or 8-digit if alpha).
- **Returns:** `"#009688"` or `"#009688DE"`

### `color/hex8` *(deprecated — use color/hex)*
Always 8-digit hex.
- **Returns:** `"#009688ff"`

### `color/hex8android`
8-digit hex with alpha first (Android format).
- **Returns:** `"#ff009688"`

### `color/css`
Hex for fully opaque, rgba for transparent. **This is the one used in the `css` transform group.**
- **Returns:** `"#000000"` or `"rgba(0,0,0,0.5)"`

### `color/UIColor`
Objective-C UIColor.
- **Returns:** `"[UIColor colorWithRed:0.114f green:0.114f blue:0.114f alpha:1.000f]"`

### `color/UIColorSwift`
Swift UIColor.
- **Returns:** `"UIColor(red: 0.667, green: 0.667, blue: 0.667, alpha: 0.6)"`

### `color/ColorSwiftUI`
SwiftUI Color.
- **Returns:** `"Color(red: 0.667, green: 0.667, blue: 0.667, opacity: 0.6)"`

### `color/composeColor`
Jetpack Compose Color.
- **Returns:** `"Color(0xFF009688)"`

### `color/hex8flutter`
Flutter Color.
- **Returns:** `"Color(0xFF00FF5F)"`

### `color/sketch`
Sketch color object.
- **Returns:** `{ red: 0.5, green: 0.5, blue: 0.5, alpha: 1 }`

### `color/oklch`
OKLCH CSS function. **Wide-gamut, no lossy gamut mapping.**
- **Returns:** `"oklch(0.7 0.15 180)"` or `"oklch(0.7 0.15 180 / 0.5)"`

### `color/oklab`
OKLAB CSS function. **Wide-gamut, no lossy gamut mapping.**
- **Returns:** `"oklab(0.7 -0.1 0.1)"` or `"oklab(0.7 -0.1 0.1 / 0.5)"`

### `color/p3`
Display P3 CSS function. **Wide-gamut.**
- **Returns:** `"color(display-p3 0.5 0.5 0.5)"` or `"color(display-p3 0.5 0.5 0.5 / 0.5)"`

### `color/lch`
LCH CSS function. **Wide-gamut.**
- **Returns:** `"lch(50% 30 180)"` or `"lch(50% 30 180 / 0.5)"`

---

## Size/Dimension Transforms

### `size/px`
Appends `px`. Does not scale.
- **Matches:** `token.type === 'dimension'`
- **Returns:** `"10px"`

### `size/rem`
Appends `rem`. Does not scale.
- **Matches:** `token.type === 'dimension'`
- **Returns:** `"10rem"`

### `size/pxToRem`
Scales px to rem (divides by `basePxFontSize`, default 16). Zero stays `"0"`.
- **Matches:** `token.type === 'dimension'`
- **Returns:** `"0"` or `"1rem"`

### `size/remToPx`
Scales rem to px (multiplies by `basePxFontSize`, default 16).
- **Matches:** `token.type === 'dimension'`
- **Returns:** `"16px"`

### `size/remToPt`
Scales rem to pt.
- **Matches:** `token.type === 'dimension'`
- **Returns:** `"16pt"`

### `size/sp`
Android font-size unit. Does NOT scale.
- **Matches:** `token.type === 'fontSize'`
- **Returns:** `"10.0sp"`

### `size/dp`
Android density-independent pixel. Does NOT scale.
- **Matches:** `token.type === 'dimension'`
- **Returns:** `"10.0dp"`

### `size/remToSp`
Scales rem to sp (multiplies by 16).
- **Matches:** `token.type === 'fontSize'`
- **Returns:** `"16.0sp"`

### `size/remToDp`
Scales rem to dp (multiplies by 16).
- **Matches:** `token.type === 'dimension'`
- **Returns:** `"16.0dp"`

### `size/object`
React Native size object.
- **Matches:** `token.type === 'dimension'`
- **Returns:** `{ original: "10px", number: 10, decimal: 0.1, scale: 160 }`

### `size/swift/remToCGFloat`
Swift CGFloat.
- **Returns:** `"CGFloat(16.00)"`

### Compose Size Transforms
- `size/compose/remToSp` → `"16.0.sp"`
- `size/compose/remToDp` → `"16.0.dp"`
- `size/compose/em` → `"16.0em"` (no scale)
- `size/compose/sp` → `"16.0.sp"` (no scale)
- `size/compose/dp` → `"16.0.dp"` (no scale)

### `size/flutter/remToDouble`
Flutter double. Scales rem × 16.
- **Returns:** `"16.00"`

---

## CSS Shorthand Transforms (Transitive)

These transforms convert DTCG composite token objects into CSS shorthand strings.
All are **transitive** (run after reference resolution).

### `shadow/css/shorthand`
- **Matches:** `token.type === 'shadow'`
- **Input:** `{ offsetX, offsetY, blur, spread, color, inset? }`
- **Returns:** `"inset 2px 4px 10px 5px #000000"` or `"2px 4px 10px 5px #000000"`

### `typography/css/shorthand`
- **Matches:** `token.type === 'typography'`
- **Input:** `{ fontWeight, fontSize, lineHeight, fontFamily, fontStyle?, fontVariant?, fontStretch? }`
- **Returns:** `"500 20px/1.5 Arial"`

### `border/css/shorthand`
- **Matches:** `token.type === 'border'`
- **Input:** `{ width, style, color }`
- **Returns:** `"2px solid #000000"`

### `transition/css/shorthand`
- **Matches:** `token.type === 'transition'`
- **Input:** `{ duration, timingFunction, delay }`
- **Returns:** `"200ms linear 50ms"`

### `strokeStyle/css/shorthand`
- **Matches:** `token.type === 'strokeStyle'` (object values)
- **Returns:** `"dashed"` (CSS fallback for complex stroke styles)

### `fontFamily/css`
Turns array fontFamily into CSS string. **Transitive.**
- **Matches:** `token.type === 'fontFamily'`
- **Returns:** `"'Arial Narrow', Arial, sans-serif"`

### `cubicBezier/css`
Turns `[n,n,n,n]` array into CSS function. **Transitive.**
- **Matches:** `token.type === 'cubicBezier'`
- **Returns:** `"cubic-bezier(0.4, 0, 0.2, 1)"`

---

## Content Transforms

### `content/quote`
- **Matches:** `token.type === 'content'`
- **Returns:** `"'string'"`

### `content/objC/literal`
- **Returns:** `@"string"`

### `content/swift/literal`
- **Returns:** `"string"` (double-quoted)

### `content/flutter/literal`
- **Returns:** `"string"` (double-quoted)

---

## Time Transforms

### `time/seconds`
Converts milliseconds to seconds.
- **Matches:** `token.type === 'time'`
- **Returns:** `"0.5s"`

---

## HTML Transforms

### `html/icon`
Unicode point to CSS content.
- **Matches:** `token.type === 'html'`
- **Returns:** `"'\\E001'"`

---

## Asset Transforms

### `asset/url`
- **Matches:** `token.type === 'asset'`
- **Returns:** `url("https://example.com/style.css")`

### `asset/base64`
Reads file and base64 encodes. **Async.**
- **Returns:** Base64 string

### `asset/path`
- **Returns:** `"path/to/file/asset.png"`

### `asset/objC/literal`
- **Returns:** `@"string"`

### `asset/swift/literal`
- **Returns:** `"string"`

### `asset/flutter/literal`
- **Returns:** `"string"`

---

## Helper Functions (Exported)

```typescript
import {
  isDTCGColorObject,   // Check if value is DTCG color object
  getColorStringFromTokenObjectValue,  // Get CSS color from token value
  getColor,            // Get tinycolor2 instance (legacy compat)
  getColorJS,          // Get ColorJS instance (wide-gamut)
  isColor,             // Type-check: is this a color token?
} from 'style-dictionary/lib/common/transforms';
```
