# SD5 → Tailwind v4 Pipeline

> How Style Dictionary v5 token output feeds into Tailwind v4's @theme system.

## Pipeline Overview

```
DTCG Token JSON
    ↓
  Style Dictionary 5 (sd.build.mjs)
    ├── tokens.css         → CSS custom properties on :root
    ├── tokens.dark.css    → Dark overrides on [data-theme="dark"]
    └── tailwind-theme.css → CSS vars with @theme selector
    ↓
  Tailwind v4 CSS
    ├── @import tailwind-theme.css  → Registers as TW4 theme values
    └── Utilities generated:        bg-*, text-*, p-*, rounded-*, etc.
```

## Strategy 1: Direct @theme Output from SD5

ColdLight's current approach. SD5 outputs CSS variables wrapped in `@theme`:

**SD5 Config (sd.build.mjs):**
```javascript
tailwind: {
  transformGroup: 'css',
  buildPath: 'dist/',
  files: [{
    destination: 'tailwind-theme.css',
    format: 'css/variables',
    options: {
      outputReferences: true,
      selector: '@theme',  // ← Key: outputs inside @theme block
    },
  }],
},
```

**Output (`tailwind-theme.css`):**
```css
@theme {
  --color-white: #ffffff;
  --color-black: #09090b;
  --color-gray-50: #fafafa;
  --color-gray-100: #f4f4f5;
  /* ... all tokens ... */
  --color-action-primary: var(--color-blue-600);
  --spacing-1: 4px;
  --spacing-2: 8px;
  /* etc */
}
```

**Consuming in Tailwind CSS:**
```css
@import "tailwindcss";
@import "../packages/coldlight/dist/tailwind-theme.css";
```

**Pros:** Minimal config, SD5 handles everything
**Cons:** Token names must match TW4 namespace conventions exactly

## Strategy 2: CSS Variables + Manual @theme Mapping

Import raw tokens, then manually map to TW4 namespaces:

**SD5 outputs standard CSS vars:**
```css
:root {
  --cl-color-action-primary: #2563eb;
  --cl-spacing-4: 16px;
  --cl-radius-md: 6px;
}
```

**Tailwind entry CSS:**
```css
@import "tailwindcss";
@import "../packages/coldlight/dist/tokens.css";

@theme inline {
  --color-action-primary: var(--cl-color-action-primary);
  --spacing-4: var(--cl-spacing-4);
  --radius-md: var(--cl-radius-md);
}
```

**Pros:** Full control over what becomes a TW utility
**Cons:** Manual mapping, more maintenance

## Strategy 3: Custom SD5 Format for TW4

Write a custom format that generates TW4-compatible variable names:

```javascript
StyleDictionary.registerFormat({
  name: 'tailwind/theme-css',
  format: ({ dictionary, options }) => {
    const lines = ['@theme inline {'];

    for (const token of dictionary.allTokens) {
      const twName = tokenPathToTwName(token);
      if (twName) {
        const value = options.outputReferences
          ? resolveReference(token, dictionary)
          : token.value;
        lines.push(`  ${twName}: ${value};`);
      }
    }

    lines.push('}');
    return lines.join('\n');
  },
});

function tokenPathToTwName(token) {
  const [category, ...rest] = token.path;
  const name = rest.join('-');

  // Map SD5 token categories → TW4 namespaces
  const mapping = {
    color: `--color-${name}`,
    spacing: `--spacing-${name}`,
    radius: `--radius-${name}`,
    shadow: `--shadow-${name}`,
    font: handleFontToken(token),
    duration: `--duration-${name}`,
    easing: `--ease-${name}`,
  };

  return mapping[category] || null;
}

function handleFontToken(token) {
  const [, subcategory, ...rest] = token.path;
  const name = rest.join('-');
  switch (subcategory) {
    case 'family': return `--font-family-${name}`;
    case 'size': return `--font-size-${name}`;
    case 'weight': return `--font-weight-${name}`;
    case 'lineHeight': return `--line-height-${name}`;
    case 'letterSpacing': return `--letter-spacing-${name}`;
    default: return null;
  }
}
```

## Token Name Mapping: SD5 → TW4

| SD5 Token Path | TW4 Variable | TW4 Utility |
|---|---|---|
| `color.action.primary` | `--color-action-primary` | `bg-action-primary` |
| `color.surface.primary` | `--color-surface-primary` | `bg-surface-primary` |
| `color.text.primary` | `--color-text-primary` | `text-text-primary` |
| `color.border.default` | `--color-border-default` | `border-border-default` |
| `spacing.4` | `--spacing-4` | `p-4`, `m-4`, `gap-4` |
| `radius.md` | `--radius-md` | `rounded-md` |
| `shadow.md` | `--shadow-md` | `shadow-md` |
| `font.family.sans` | `--font-family-sans` | `font-sans` |
| `font.size.lg` | `--font-size-lg` | `text-lg` |
| `font.weight.bold` | `--font-weight-bold` | `font-bold` |
| `font.lineHeight.tight` | `--line-height-tight` | `leading-tight` |
| `duration.fast` | `--duration-fast` | (no built-in utility) |
| `easing.default` | `--ease-default` | `ease-default` |

## Handling Composite Tokens

SD5 composite tokens (shadow, typography) need special handling for TW4:

### Shadow Tokens

SD5 shadow is an object:
```json
{ "offsetX": "0px", "offsetY": "4px", "blur": "6px", "spread": "-1px", "color": "rgba(0,0,0,0.1)" }
```

The `css` transform group includes `shadow/css/shorthand` which converts to:
```
0px 4px 6px -1px rgba(0,0,0,0.1)
```

This CSS shorthand string is what TW4 expects for `--shadow-*`.

### Typography Tokens

TW4 expects individual properties, not CSS font shorthand:
```css
@theme {
  --font-size-lg: 1.125rem;
  --font-weight-bold: 700;
  --line-height-tight: 1.25;
  --letter-spacing-tight: -0.025em;
}
```

**Don't** use expanded composite typography in `@theme`. Instead, keep typography tokens as individual tokens per property (which ColdLight already does).

### Motion Tokens

ColdLight's `easing` tokens use `cubicBezier` type (`[0.4, 0, 0.2, 1]`).
The `cubicBezier/css` transform converts to `cubic-bezier(0.4, 0, 0.2, 1)`.
Map to TW4's `--ease-*` namespace:

```css
@theme {
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
}
```

## Build Integration

### package.json scripts

```json
{
  "scripts": {
    "build:tokens": "node scripts/dev/build/design/coldlight/styledictionary/build.mjs",
    "build:css": "tailwindcss -i ./src/input.css -o ./dist/output.css",
    "build:design": "npm run build:tokens && npm run build:css",
    "dev": "npm run build:tokens && tailwindcss -i ./src/input.css -o ./dist/output.css --watch"
  }
}
```

### Token build MUST run before Tailwind

The pipeline is sequential:
1. SD5 builds token CSS files
2. Tailwind reads those CSS files via `@import`
3. Tailwind generates utility classes

In dev mode, run SD5 in watch mode alongside Tailwind's watch:
```bash
# Terminal 1: Token watch
node scripts/dev/build/design/coldlight/styledictionary/build.mjs --watch

# Terminal 2: Tailwind watch
tailwindcss -i ./src/input.css -o ./dist/output.css --watch
```

## Prefix Strategy

ColdLight uses `cl-` prefix for CSS variables to avoid collisions:

```
SD5 output:  --cl-color-action-primary: #2563eb;
TW4 theme:   --color-action-primary: var(--cl-color-action-primary);
TW4 utility: bg-action-primary
```

When using Strategy 1 (direct `@theme` output), SD5 should NOT use a prefix — the variables go directly into `@theme` and must match TW4 namespaces:

```javascript
// For tailwind platform: NO prefix
tailwind: {
  transformGroup: 'css',
  // prefix: 'cl',  ← DON'T do this for the tailwind platform
  buildPath: 'dist/',
  files: [{
    destination: 'tailwind-theme.css',
    format: 'css/variables',
    options: { selector: '@theme' },
  }],
},

// For standard CSS platform: USE prefix
css: {
  transformGroup: 'css',
  prefix: 'cl',  // ← DO use prefix for standalone CSS
  buildPath: 'dist/',
  files: [{
    destination: 'tokens.css',
    format: 'css/variables',
  }],
},
```
