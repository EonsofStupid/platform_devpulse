# Dark Mode with Design Tokens in TW4

> How to implement dark mode using SD5 token layers and TW4's variant system.

## ColdLight's Approach: Data Attribute + CSS Variable Override

```
Light: :root { --color-surface-primary: #ffffff; }
Dark:  [data-theme="dark"] { --color-surface-primary: #09090b; }
```

Components reference CSS variables. When the attribute changes, everything updates.

### SD5 Setup

**Light tokens** (`tokens/semantic/color.light.json`):
```json
{
  "color": {
    "$type": "color",
    "surface": {
      "primary": { "$value": "{color.white}" }
    },
    "text": {
      "primary": { "$value": "{color.gray.900}" }
    }
  }
}
```

**Dark tokens** (`tokens/semantic/color.dark.json`):
```json
{
  "color": {
    "$type": "color",
    "surface": {
      "primary": { "$value": "{color.gray.900}" }
    },
    "text": {
      "primary": { "$value": "{color.gray.50}" }
    }
  }
}
```

**SD5 config** generates `tokens.dark.css` with `[data-theme="dark"]` selector, filtering to only semantic color tokens.

### TW4 Dark Variant

Configure TW4 to use the data attribute:

```css
@import "tailwindcss";
@import "../packages/coldlight/dist/tokens.css";
@import "../packages/coldlight/dist/tokens.dark.css";

/* Custom dark variant using data attribute */
@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));

@theme inline {
  --color-surface-primary: var(--color-surface-primary);
  --color-text-primary: var(--color-text-primary);
}
```

**Usage:**
```html
<html data-theme="light">
  <body class="bg-surface-primary text-text-primary">
    <!-- Automatically adapts when data-theme changes -->
  </body>
</html>
```

**No `dark:` prefix needed!** Because the CSS variables themselves change, utilities like `bg-surface-primary` automatically resolve to the correct value.

## When You DO Need dark: Prefix

If you want light-only or dark-only styles beyond what tokens handle:

```html
<div class="border border-border-default dark:border-0">
  <!-- Border visible in light mode, hidden in dark -->
</div>
```

## Alternative: Media Query Dark Mode

TW4 default dark mode uses `prefers-color-scheme`:

```css
@variant dark (@media (prefers-color-scheme: dark));
```

This works with SD5 if you output dark tokens with a media query selector:

```javascript
// SD5 dark config
files: [{
  destination: 'tokens.dark.css',
  format: 'css/variables',
  options: {
    selector: '@media (prefers-color-scheme: dark) { :root',
    // This doesn't work directly — need custom format
  },
}]
```

Better approach — custom format:

```javascript
StyleDictionary.registerFormat({
  name: 'css/dark-media-query',
  format: ({ dictionary, options }) => {
    const vars = dictionary.allTokens
      .map(t => `  --${t.name}: ${t.value};`)
      .join('\n');
    return `@media (prefers-color-scheme: dark) {\n  :root {\n${vars}\n  }\n}\n`;
  },
});
```

## Hybrid: Data Attribute + System Preference

Support both manual toggle and system preference:

```css
/* System preference (auto) */
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    /* dark token overrides */
  }
}

/* Manual override */
[data-theme="dark"] {
  /* dark token overrides — same values */
}
```

SD5 can output both:

```javascript
// In sd.build.mjs — dark config
platforms: {
  css: {
    transformGroup: 'css',
    buildPath: 'dist/',
    files: [
      {
        destination: 'tokens.dark.css',
        format: 'css/variables',
        options: {
          outputReferences: true,
          selector: '[data-theme="dark"]',
        },
        filter: semanticColorFilter,
      },
      {
        destination: 'tokens.dark-auto.css',
        format: 'css/dark-media-query',  // Custom format
        filter: semanticColorFilter,
      },
    ],
  },
}
```

## Multiple Theme Variants

Beyond light/dark, support high-contrast, brand themes, etc.:

```
tokens/semantic/color.light.json          → :root
tokens/semantic/color.dark.json           → [data-theme="dark"]
tokens/semantic/color.high-contrast.json  → [data-theme="high-contrast"]
tokens/semantic/color.brand-a.json        → [data-brand="a"]
```

Build script:

```javascript
const themes = [
  { name: 'light', selector: ':root', exclude: ['*.dark.json', '*.high-contrast.json'] },
  { name: 'dark', selector: '[data-theme="dark"]', file: 'color.dark.json' },
  { name: 'high-contrast', selector: '[data-theme="high-contrast"]', file: 'color.high-contrast.json' },
];

for (const theme of themes) {
  const sd = new StyleDictionary({
    source: [
      'tokens/core/**/*.json',
      theme.file ? `tokens/semantic/${theme.file}` : 'tokens/semantic/!(*.dark|*.high-contrast).json',
      'tokens/semantic/typography.json',
      'tokens/semantic/layout.json',
      'tokens/component/**/*.json',
    ],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: 'dist/',
        files: [{
          destination: `tokens.${theme.name}.css`,
          format: 'css/variables',
          options: {
            outputReferences: true,
            selector: theme.selector,
          },
          filter: theme.name === 'light' ? undefined : semanticColorFilter,
        }],
      },
    },
  });
  await sd.buildAllPlatforms();
}
```

## TW4 Dark Mode + Component Tokens

ColdLight's component tokens (button, input, etc.) reference semantic tokens:

```json
{
  "button": {
    "bg": {
      "primary": { "$value": "{color.action.primary}" }
    }
  }
}
```

In CSS output:
```css
:root {
  --button-bg-primary: var(--color-action-primary);
}
```

When dark mode activates:
```css
[data-theme="dark"] {
  --color-action-primary: #60a5fa;  /* Changes from blue-600 to blue-400 */
}
```

`--button-bg-primary` still points to `--color-action-primary`, which now resolves to the dark value. **No component CSS changes needed.**

This is why the 4-layer architecture (core → semantic → component → recipe) works:
- Only the **semantic layer** changes between themes
- Components automatically inherit via CSS variable resolution
