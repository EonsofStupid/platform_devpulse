# Style Dictionary v5 — Local Reference

> Scraped from styledictionary.com and context7. This is the RELIABLE local reference.
> DO NOT trust memory. Trust THIS file.

---

## Config Structure (ES Module)

```javascript
export default {
  source: ["tokens/**/*.json"],        // DTCG source globs
  include: ["defaults/**/*.json"],      // Default tokens (overridden by source)
  tokens: {},                           // Inline tokens (alternative to source)
  usesDtcg: true,                       // Use $value/$type instead of value/type
  expand: true,                         // Expand composite tokens into separate tokens
  log: { verbosity: "verbose" },

  hooks: {
    formats:          { "name": formatFn },
    transforms:       { "name": transformObj },
    transformGroups:  { "name": ["transform1", "transform2"] },
    filters:          { "name": filterFn },
    parsers:          { "name": parserObj },
    preprocessors:    { "name": preprocessorFn },
    fileHeaders:      { "name": fileHeaderFn },
    actions:          { "name": actionObj },
  },

  platforms: {
    platformName: {
      transformGroup: "css",                // OR transforms: ["t1","t2"]
      buildPath: "output/path/",            // Must end with /
      prefix: "sd",                         // Prefix for token names
      expand: {},                           // Platform-level expand override
      preprocessors: ["name"],
      options: {                            // Global file options
        outputReferences: true,
        showFileHeader: true,
      },
      files: [
        {
          destination: "filename.css",
          format: "css/variables",           // Built-in or custom format name
          filter: "filterName",              // String, function, or object
          options: {                         // Per-file options
            outputReferences: true,
            selector: ":root",
            sort: "name",
          },
        },
      ],
      actions: ["actionName"],
    },
  },
};
```

---

## Custom Format Signature

```javascript
function myFormat({ dictionary, platform, options, file }) {
  // dictionary.allTokens    — flat array of all tokens
  // dictionary.tokens       — nested token object
  // dictionary.tokenMap     — Record<string, token>
  // dictionary.unfilteredAllTokens — includes filtered-out tokens
  // platform                — platform config object
  // options                 — merged config + format options
  // file                    — file config object
  return "string output";  // Must return string for file output
}
```

Register inline:
```javascript
hooks: {
  formats: {
    "my/format": myFormat,
  },
},
```

---

## Custom Transform

```javascript
{
  name: "custom/transform",
  type: "value",              // "name" | "attribute" | "value"
  transitive: false,          // Apply to referenced values too
  filter: (token) => true,    // Optional — which tokens to transform
  transform: (token) => {},   // Return string (name), object (attr), or value
}
```

---

## Custom Filter

```javascript
// Inline in config:
hooks: {
  filters: {
    "my-filter": (token, options) => {
      return token.path[0] === "color";
    },
  },
},

// Usage in file:
{ filter: "my-filter" }

// Or inline function:
{ filter: (token) => token.path[0] === "color" }
```

---

## Built-in Formats (CSS-relevant)

| Format | Output |
|--------|--------|
| `css/variables` | `:root { --name: value; }` |
| `scss/variables` | `$name: value;` |
| `scss/map-deep` | Nested SCSS map |
| `javascript/es6` | `export const Name = value;` |
| `javascript/esm` | `export default { ... }` |
| `json` | Full token structure |
| `json/flat` | `{ "name": "value" }` |
| `json/nested` | Nested hierarchy |
| `typescript/es6-declarations` | `.d.ts` with const declarations |

---

## css/variables Options

| Option | Type | Description |
|--------|------|-------------|
| `selector` | string | CSS selector (default: `:root`) |
| `outputReferences` | boolean/fn | Preserve `var()` references |
| `sort` | string/fn | Sort tokens (`"name"` or comparator) |
| `showFileHeader` | boolean | Include generated comment |
| `formatting` | object | Indentation, comment style |

---

## Built-in Transform Groups

| Group | Transforms |
|-------|-----------|
| `css` | attribute/cti, name/kebab, time/seconds, html/icon, size/rem, color/css, asset/url/encodeUrl, fontFamily/css, cubicBezier/css, strokeStyle/css/shorthand, border/css/shorthand, typography/css/shorthand, transition/css/shorthand, shadow/css/shorthand |
| `scss` | Same as css |
| `less` | Same as css |
| `js` | attribute/cti, name/pascal, size/rem, color/hex |

---

## Token Properties (DTCG mode)

```json
{
  "$value": "oklch(0.5 0.2 180)",
  "$type": "color",
  "$description": "Primary teal"
}
```

When `usesDtcg: true`:
- `$value` instead of `value`
- `$type` instead of `type`
- `$description` instead of `comment`

Token object in format functions:
```javascript
token.path       // ["color", "teal", "500"]
token.name       // "color-teal-500" (after name transform)
token.$type      // "color"
token.$value     // resolved value
token.value      // alias for $value in DTCG mode
token.original   // original token before transforms
token.filePath   // source file path
```

---

## outputReferences

When enabled, tokens that reference other tokens preserve `var()` in CSS output:

```css
/* outputReferences: true */
:root {
  --color-red: #ff0000;
  --color-danger: var(--color-red);
}

/* outputReferences: false */
:root {
  --color-red: #ff0000;
  --color-danger: #ff0000;
}
```

---

## Expand (Composite Tokens)

Splits composite tokens into individual tokens:

```json
{
  "border": {
    "$value": { "width": "2px", "style": "solid", "color": "#000" },
    "$type": "border"
  }
}
```

With `expand: true` becomes:
- `border-width: 2px`
- `border-style: solid`
- `border-color: #000`

Default DTCG type mappings for expand:
```javascript
{
  border:     { style: "strokeStyle", width: "dimension" },
  transition: { delay: "duration", timingFunction: "cubicBezier" },
  shadow:     { offsetX: "dimension", offsetY: "dimension", blur: "dimension", spread: "dimension" },
  typography: { fontSize: "dimension", letterSpacing: "dimension", lineHeight: "number" },
}
```

---

## CLI

```bash
# Default (looks for config.js/config.json in cwd)
style-dictionary build

# Custom config path
style-dictionary build --config ./path/to/sd.config.js
# Short flag
style-dictionary build -c ./path/to/sd.config.js

# Verbose logging
style-dictionary build -c ./sd.config.js --verbose
```

---

## Node API

```javascript
import StyleDictionary from "style-dictionary";

const sd = new StyleDictionary(config);
await sd.buildAllPlatforms();

// Or extend:
const extended = await sd.extend({ /* overrides */ });
await extended.buildAllPlatforms();
```

---

## Multiple Files Per Platform

Each platform can output multiple files with different filters:

```javascript
platforms: {
  css: {
    transformGroup: "css",
    buildPath: "build/",
    files: [
      { destination: "colors.css", format: "css/variables", filter: (t) => t.path[0] === "color" },
      { destination: "spacing.css", format: "css/variables", filter: (t) => t.path[0] === "space" },
      { destination: "all.css", format: "css/variables" },
    ],
  },
},
```

---

## File-Level Filter Examples

```javascript
// By token path
filter: (token) => token.path[0] === "color"

// By type
filter: (token) => token.$type === "color"

// By source file
filter: (token) => token.filePath.includes("tier-1")

// Multiple conditions
filter: (token) => token.path[0] === "color" && token.path[1] !== "base"
```
