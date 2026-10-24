# Style Dictionary v5 — Transform Groups

> Built-in transform groups extracted from `lib/common/transformGroups.d.ts`.
> A transform group is a named set of transforms applied in order.

## Usage

```javascript
platforms: {
  css: {
    transformGroup: 'css',  // Use built-in group
    // OR override with custom transforms:
    transforms: ['attribute/cti', 'name/kebab', 'custom/my-transform', 'color/css'],
  },
}
```

**Note:** `transformGroup` and `transforms` are mutually exclusive. If you need to extend a group, list all transforms explicitly in `transforms`.

## Custom Transform Group

```typescript
StyleDictionary.registerTransformGroup({
  name: 'custom/web',
  transforms: [
    'attribute/cti',
    'name/kebab',
    'size/pxToRem',
    'color/css',
    'fontFamily/css',
    'cubicBezier/css',
    'shadow/css/shorthand',
    'typography/css/shorthand',
    'border/css/shorthand',
    'transition/css/shorthand',
  ],
});
```

---

## Built-in Groups

### `css`
The primary web group. Used by ColdLight.

| Transform | Type | Purpose |
|---|---|---|
| `attribute/cti` | attribute | Adds category/type/item/subitem/state |
| `name/kebab` | name | `color-background-button-primary-active` |
| `time/seconds` | value | `200ms` → `0.2s` |
| `html/icon` | value | Unicode → CSS content |
| `size/rem` | value | Appends `rem` |
| `color/css` | value | Hex or rgba |
| `asset/url` | value | Wraps in `url()` |
| `fontFamily/css` | value | Array → CSS string (transitive) |
| `cubicBezier/css` | value | Array → `cubic-bezier()` (transitive) |
| `strokeStyle/css/shorthand` | value | Object → CSS (transitive) |
| `border/css/shorthand` | value | Object → `2px solid #000` (transitive) |
| `typography/css/shorthand` | value | Object → `500 20px/1.5 Arial` (transitive) |
| `transition/css/shorthand` | value | Object → `200ms linear 50ms` (transitive) |
| `shadow/css/shorthand` | value | Object → `0 4px 6px -1px rgba(...)` (transitive) |

### `scss`
Identical to `css`. Same transform list.

### `less`
Same as `css` but uses `color/hex` instead of `color/css`.

### `js`
For JavaScript/TypeScript output.

| Transform | Type | Purpose |
|---|---|---|
| `attribute/cti` | attribute | CTI metadata |
| `name/pascal` | name | `ColorBackgroundButtonPrimaryActive` |
| `size/rem` | value | Appends `rem` |
| `color/hex` | value | 6 or 8-digit hex |

### `web`
Minimal web group.

| Transform | Type | Purpose |
|---|---|---|
| `attribute/cti` | attribute | CTI metadata |
| `name/kebab` | name | kebab-case |
| `size/px` | value | Appends `px` |
| `color/css` | value | Hex or rgba |

### `html`
For HTML documentation.

| Transform | Type | Purpose |
|---|---|---|
| `attribute/cti` | attribute | CTI metadata |
| `attribute/color` | attribute | Adds hex/rgb/hsl breakdowns |
| `name/human` | name | `"button primary"` |

### `android`

| Transform | Type | Purpose |
|---|---|---|
| `attribute/cti` | attribute | CTI metadata |
| `name/snake` | name | `color_background_button` |
| `color/hex8android` | value | `#ff009688` (alpha first) |
| `size/remToSp` | value | Font sizes → sp |
| `size/remToDp` | value | Other sizes → dp |

### `compose`
Jetpack Compose (Kotlin).

| Transform | Type | Purpose |
|---|---|---|
| `attribute/cti` | attribute | CTI metadata |
| `name/camel` | name | camelCase |
| `color/composeColor` | value | `Color(0xFF009688)` |
| `size/compose/em` | value | `16.0em` |
| `size/compose/remToSp` | value | Font sizes → `.sp` |
| `size/compose/remToDp` | value | Other sizes → `.dp` |

### `ios`
Objective-C.

| Transform | Type | Purpose |
|---|---|---|
| `attribute/cti` | attribute | CTI metadata |
| `name/pascal` | name | PascalCase |
| `color/UIColor` | value | `[UIColor colorWithRed:...]` |
| `content/objC/literal` | value | `@"string"` |
| `asset/objC/literal` | value | `@"string"` |
| `size/remToPt` | value | rem → pt |

### `ios-swift` / `ios-swift-separate`
Swift. `-separate` variant intended for per-category files.

| Transform | Type | Purpose |
|---|---|---|
| `attribute/cti` | attribute | CTI metadata |
| `name/camel` | name | camelCase |
| `color/UIColorSwift` | value | `UIColor(red:green:blue:alpha:)` |
| `content/swift/literal` | value | `"string"` |
| `asset/swift/literal` | value | `"string"` |
| `size/swift/remToCGFloat` | value | `CGFloat(16.00)` |

### `flutter` / `flutter-separate`

| Transform | Type | Purpose |
|---|---|---|
| `attribute/cti` | attribute | CTI metadata |
| `name/camel` | name | camelCase |
| `color/hex8flutter` | value | `Color(0xFF00FF5F)` |
| `size/flutter/remToDouble` | value | `16.00` |
| `content/flutter/literal` | value | `"string"` |
| `asset/flutter/literal` | value | `"string"` |

### `react-native`

| Transform | Type | Purpose |
|---|---|---|
| `name/camel` | name | camelCase |
| `color/css` | value | Hex or rgba |
| `size/object` | value | `{ original, number, decimal, scale }` |

### `assets`
Minimal — only CTI attribute.

| Transform | Type |
|---|---|
| `attribute/cti` | attribute |

---

## ColdLight Usage

ColdLight's `sd.build.mjs` uses:
- **CSS platform:** `transformGroup: 'css'` (kebab names, rem sizes, CSS colors, shorthand composites)
- **Tailwind platform:** `transformGroup: 'css'` (same as CSS, output to `@theme` selector)
- **JS platform:** `transformGroup: 'js'` (PascalCase names, hex colors, rem sizes)

All three include the transitive shorthand transforms for shadow, typography, border, transition.
