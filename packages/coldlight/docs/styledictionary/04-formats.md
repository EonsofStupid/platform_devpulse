# Style Dictionary v5 — Formats

> Formats generate the final output files. Each format function receives the transformed dictionary and returns a string.

## Format Interface

```typescript
interface FormatFnArguments {
  dictionary: Dictionary;     // Transformed tokens
  file: File;                 // File configuration
  options: Config & LocalOptions;  // Merged config + file options
  platform: PlatformConfig;   // Platform configuration
}

type FormatFn = ((args: FormatFnArguments) => unknown | Promise<unknown>) & {
  nested?: boolean;  // Set true if format handles nested token structure
};

interface Format {
  name: string;
  format: FormatFn;
}
```

## Dictionary Object

```typescript
interface Dictionary {
  tokens: TransformedTokens;           // Nested token tree (post-transform)
  allTokens: TransformedToken[];       // Flat array of all tokens
  tokenMap: Map<string, TransformedToken>;  // key → token lookup
  unfilteredTokens?: TransformedTokens;     // Pre-filter tokens (for reference resolution)
  unfilteredAllTokens?: TransformedToken[];
  unfilteredTokenMap?: Map<string, TransformedToken>;
}
```

## TransformedToken Properties

```typescript
interface TransformedToken {
  // Core
  name: string;        // Transformed name (e.g., "color-blue-500")
  value: any;          // Transformed value (e.g., "#3b82f6")
  path: string[];      // ["color", "blue", "500"]
  type: string;        // Token type (e.g., "color")

  // DTCG
  $value?: any;
  $type?: string;
  $description?: string;

  // Metadata
  original: DesignToken;  // Pristine copy of original token
  filePath: string;       // Source file path
  isSource: boolean;      // true if from source[], false if from include[]
  attributes?: Record<string, unknown>;  // Set by attribute transforms
  comment?: string;

  // Arbitrary
  [key: string]: any;
}
```

## Custom Format Registration

```typescript
StyleDictionary.registerFormat({
  name: 'custom/json-flat',
  format: ({ dictionary, file, options, platform }) => {
    const header = options.showFileHeader !== false
      ? '// Do not edit directly\n\n'
      : '';

    const tokens = {};
    for (const token of dictionary.allTokens) {
      tokens[token.name] = token.value;
    }
    return header + JSON.stringify(tokens, null, 2) + '\n';
  },
});
```

---

## Built-in Formats

### CSS

#### `css/variables`
CSS custom properties on `:root` (or custom selector).

```css
:root {
  --color-blue-500: #3b82f6;
  --color-action-primary: var(--color-blue-600);
}
```

**Options:**
- `selector` — Custom selector (default: `:root`). ColdLight uses `'@theme'` for Tailwind and `'[data-theme="dark"]'` for dark mode.
- `outputReferences: true` — Preserve references as `var(--token-name)`
- `outputReferenceFallbacks: true` — Include fallback: `var(--token, #hex)`
- `formatting.commentStyle` — `'short'` (`/* */`) or `'long'` (default)
- `formatting.commentPosition` — `'above'` (default) or `'inline'`
- `formatting.indentation` — Default `'  '` (2 spaces)

#### `css/fonts.css`
`@font-face` declarations from asset tokens.

### SCSS / Less / Stylus

#### `scss/variables`
```scss
$color-blue-500: #3b82f6;
$color-action-primary: $color-blue-600;  // with outputReferences
```

#### `scss/map-flat`
```scss
$tokens: (
  'color-blue-500': #3b82f6,
  'color-action-primary': #2563eb,
);
```

#### `scss/map-deep`
Nested SCSS map preserving token hierarchy.

#### `scss/icons`
SCSS `@font-face` + icon class definitions.

#### `less/variables`
```less
@color-blue-500: #3b82f6;
```

#### `less/icons`

#### `stylus/variables`
```stylus
$color-blue-500 = #3b82f6
```

### JavaScript / TypeScript

#### `javascript/module`
CommonJS module.
```javascript
module.exports = {
  ColorBlue500: '#3b82f6',
};
```

#### `javascript/module-flat`
CommonJS, flat structure.

#### `javascript/object`
Wraps tokens in a JavaScript object literal.

#### `javascript/umd`
UMD module format.

#### `javascript/es6`
ES module with named exports.
```javascript
export const ColorBlue500 = '#3b82f6';
export const ColorActionPrimary = '#2563eb';
```

#### `typescript/es6-declarations`
TypeScript declarations for the `javascript/es6` format.
```typescript
export const ColorBlue500: string;
export const ColorActionPrimary: string;
```

#### `typescript/module-declarations`
TypeScript declarations for `javascript/module`.
```typescript
export default tokens;
declare interface DesignToken { value: any; /* ... */ }
declare const tokens: { [key: string]: DesignToken };
```

### JSON

#### `json`
Nested JSON object preserving token hierarchy.
```json
{
  "color": {
    "blue": {
      "500": { "value": "#3b82f6", "name": "color-blue-500" }
    }
  }
}
```

#### `json/flat`
Flat key-value JSON.
```json
{
  "color-blue-500": "#3b82f6"
}
```

#### `json/nested`
Nested JSON with only values (no metadata).
```json
{
  "color": {
    "blue": {
      "500": "#3b82f6"
    }
  }
}
```

### Platform-Specific

#### `android/resources`
Android XML resources.
```xml
<resources>
  <color name="color_blue_500">#3b82f6</color>
</resources>
```

#### `android/colors`
Android color resources XML.

#### `android/dimens`
Android dimension resources XML.

#### `android/fontDimens`
Android font dimension resources XML.

#### `android/integers`
Android integer resources XML.

#### `android/strings`
Android string resources XML.

#### `compose/object`
Kotlin Compose object.
```kotlin
object StyleDictionaryColor {
    val colorBlue500 = Color(0xFF3B82F6)
}
```

#### `ios/macros`
Objective-C `#define` macros.

#### `ios/plist`
iOS property list (plist) XML.

#### `ios/singleton.m` / `ios/singleton.h`
Objective-C singleton class.

#### `ios-swift/class.swift`
Swift class with static properties.

#### `ios-swift/enum.swift`
Swift enum with static properties.

#### `ios-swift/any.swift`
Swift with custom access control.

#### `flutter/class.dart`
Dart class with static properties.

### Documentation

#### `sketch/palette`
Sketch color palette.

#### `sketch/palette/v2`
Sketch v2 palette format.

---

## Format Helpers

SD5 exports helper utilities for building custom formats:

```typescript
import {
  fileHeader,        // Generate standard file header comment
  formattedVariables,  // Generate formatted variable declarations
  getTypeScriptType,   // Get TS type from token value
  iconsWithPrefix,     // Generate icon class names
  minifyDictionary,    // Strip metadata, keep only values
  sortByReference,     // Sort tokens with references after their dependencies
  sortByName,          // Alphabetical sort
  createPropertyFormatter,  // Create a line formatter for variables
  setSwiftFileProperties,   // iOS Swift setup
} from 'style-dictionary/lib/common/formatHelpers';
```

### `fileHeader({ file, commentStyle, formatting })`
Generates the "Do not edit directly" header comment.

### `formattedVariables({ format, dictionary, outputReferences, formatting })`
Generates formatted variable lines for CSS/SCSS/Less.

### `createPropertyFormatter({ outputReferences, dictionary, format, formatting })`
Returns a function that formats a single token as a variable declaration.

---

## ColdLight Custom Formats

ColdLight registers two custom formats in `sd.build.mjs`:

### `typescript/nested-object`
Generates nested ES module with typed `const`:
```typescript
export const tokens = {
  color: {
    blue: {
      "500": "#3b82f6"
    }
  }
} as const;

export type ColdLightTokens = typeof tokens;
```

### `typescript/nested-declarations`
Generates matching `.d.ts`:
```typescript
export declare const tokens: {
  readonly color: {
    readonly blue: {
      readonly '500': string;
    };
  };
};

export type ColdLightTokens = typeof tokens;
```

## outputReferences

The `outputReferences` option is critical for maintainable CSS output:

```javascript
// Boolean — all references preserved
options: { outputReferences: true }

// Function — selective reference preservation
options: {
  outputReferences: (token, { dictionary, usesDtcg }) => {
    // Only preserve references for semantic tokens
    return token.path[0] === 'color' && ['action', 'surface', 'text'].includes(token.path[1]);
  },
}
```

**With `outputReferences: true`:**
```css
:root {
  --color-blue-600: #2563eb;
  --color-action-primary: var(--color-blue-600);  /* reference preserved */
}
```

**Without:**
```css
:root {
  --color-blue-600: #2563eb;
  --color-action-primary: #2563eb;  /* value inlined */
}
```

ColdLight uses `outputReferences: true` for all CSS output to enable theming via CSS variable overrides.
