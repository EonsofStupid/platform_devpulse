# Style Dictionary v5 — Advanced Patterns

## Multi-File Output

Split tokens into multiple output files per platform:

```javascript
platforms: {
  css: {
    transformGroup: 'css',
    prefix: 'cl',
    buildPath: 'dist/',
    files: [
      {
        destination: 'colors.css',
        format: 'css/variables',
        filter: (token) => token.type === 'color',
        options: { outputReferences: true },
      },
      {
        destination: 'spacing.css',
        format: 'css/variables',
        filter: (token) => token.type === 'dimension' && token.path[0] === 'spacing',
      },
      {
        destination: 'typography.css',
        format: 'css/variables',
        filter: (token) => token.path[0] === 'font',
        options: { outputReferences: true },
      },
      {
        destination: 'motion.css',
        format: 'css/variables',
        filter: (token) => token.type === 'duration' || token.type === 'cubicBezier',
      },
      {
        destination: 'components/button.css',
        format: 'css/variables',
        filter: (token) => token.path[0] === 'button',
        options: { outputReferences: true },
      },
    ],
  },
}
```

## extend() — Derived Configurations

Create new SD instances by extending an existing one:

```javascript
const base = new StyleDictionary({
  source: ['tokens/core/**/*.json'],
  hooks: { /* shared hooks */ },
});

// Light theme
const light = await base.extend({
  source: ['tokens/core/**/*.json', 'tokens/semantic/!(*.dark).json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [{ destination: 'tokens.css', format: 'css/variables' }],
    },
  },
});

// Dark theme
const dark = await base.extend({
  source: ['tokens/core/**/*.json', 'tokens/semantic/color.dark.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [{
        destination: 'tokens.dark.css',
        format: 'css/variables',
        options: { selector: '[data-theme="dark"]' },
        filter: (token) => token.path[0] === 'color',
      }],
    },
  },
});

await light.buildAllPlatforms();
await dark.buildAllPlatforms();
```

### extend() Options

```typescript
const extended = await sd.extend(config, {
  mutateOriginal: false,   // false = creates copy (default). true = mutates parent
  verbosity: 'verbose',    // Override log verbosity
  warnings: 'error',       // Override warning level
  volume: customVolume,    // Custom filesystem volume (for testing)
});
```

## Theming Strategy (ColdLight Pattern)

ColdLight uses two SD instances for light/dark theme:

```javascript
// Light: core + semantic light + component + recipe
const sdLight = new StyleDictionary({
  source: [
    'tokens/core/**/*.json',
    'tokens/semantic/!(*.dark).json',    // Excludes *.dark.json
    'tokens/component/**/*.json',
    'tokens/recipe/**/*.json',
  ],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables',
        options: { outputReferences: true },  // :root selector (default)
      }],
    },
    tailwind: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [{
        destination: 'tailwind-theme.css',
        format: 'css/variables',
        options: { outputReferences: true, selector: '@theme' },
      }],
    },
    js: {
      transformGroup: 'js',
      buildPath: 'dist/',
      files: [
        { destination: 'tokens.js', format: 'typescript/nested-object' },
        { destination: 'tokens.d.ts', format: 'typescript/nested-declarations' },
      ],
    },
  },
});

// Dark: replaces semantic light colors with dark colors
const sdDark = new StyleDictionary({
  source: [
    'tokens/core/**/*.json',
    'tokens/semantic/color.dark.json',     // Dark overrides
    'tokens/semantic/typography.json',      // Same typography
    'tokens/semantic/layout.json',          // Same layout
    'tokens/component/**/*.json',
    'tokens/recipe/**/*.json',
  ],
  platforms: {
    css: {
      transformGroup: 'css',
      buildPath: 'dist/',
      files: [{
        destination: 'tokens.dark.css',
        format: 'css/variables',
        options: {
          outputReferences: true,
          selector: '[data-theme="dark"]',  // Dark theme selector
        },
        filter: (token) => {
          const p = token.path;
          return p[0] === 'color' && [
            'action', 'surface', 'text', 'border', 'status'
          ].includes(p[1]);
        },
      }],
    },
  },
});
```

**Why this works:**
- Light CSS goes on `:root` — all tokens
- Dark CSS goes on `[data-theme="dark"]` — only semantic color overrides
- Component tokens reference semantic tokens via CSS variables
- When `[data-theme="dark"]` is active, semantic variables change → components automatically adapt

## Conditional Transforms

Apply different transforms per platform:

```javascript
StyleDictionary.registerTransform({
  name: 'size/rem-or-px',
  type: 'value',
  filter: (token) => token.type === 'dimension',
  transform: (token, platform) => {
    const val = parseFloat(token.value);
    if (platform.prefix === 'mobile') {
      return `${val}px`;
    }
    return `${val / 16}rem`;
  },
});
```

## Platform-Specific Overrides

Each platform can have completely different:
- Transforms
- Preprocessors
- Build paths
- Prefix
- Expand config

```javascript
platforms: {
  web: {
    transformGroup: 'css',
    prefix: 'cl',
    buildPath: 'dist/web/',
    expand: { include: ['shadow', 'typography'] },
  },
  ios: {
    transformGroup: 'ios-swift',
    buildPath: 'dist/ios/',
    expand: true,  // Expand ALL composites for iOS
  },
  android: {
    transformGroup: 'android',
    buildPath: 'dist/android/',
    expand: true,
  },
}
```

## In-Memory Output (No File Write)

Use `formatPlatform()` to get output without writing files:

```javascript
const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      files: [{
        format: 'css/variables',
        // No destination = in-memory only
      }],
    },
  },
});

const results = await sd.formatPlatform('css');
// results: [{ output: ":root {\n  --color-blue-500: ...", destination: undefined }]

const cssString = results[0].output;
```

## Custom Volume (Virtual Filesystem)

For testing or non-disk outputs:

```typescript
import { Volume } from 'memfs';

const vol = Volume.fromJSON({
  '/tokens/color.json': JSON.stringify({
    color: { $type: 'color', red: { $value: '#ff0000' } }
  }),
});

const sd = new StyleDictionary(config, { volume: vol });
await sd.buildAllPlatforms();

const output = vol.readFileSync('/dist/tokens.css', 'utf-8');
```

## Source/Include Strategy

```javascript
{
  // Include: base tokens that can be referenced but aren't the "source of truth"
  include: [
    'node_modules/@company/base-tokens/**/*.json',
  ],

  // Source: your tokens that override/extend included ones
  source: [
    'tokens/**/*.json',
  ],
}
```

- Tokens from `include` have `isSource: false`
- Tokens from `source` have `isSource: true`
- Same-path tokens in `source` override `include`
- Use `filter: (token) => token.isSource` to output only your tokens

## Programmatic Usage Patterns

### Build Script with Error Handling

```javascript
// sd.build.mjs
import StyleDictionary from 'style-dictionary';

async function build() {
  const sd = new StyleDictionary({
    source: ['tokens/**/*.json'],
    log: {
      verbosity: 'verbose',
      warnings: 'error',
      errors: { brokenReferences: 'throw' },
    },
    platforms: { /* ... */ },
  });

  try {
    await sd.buildAllPlatforms();
    console.log('Build complete');
  } catch (err) {
    console.error('Token build failed:', err.message);
    process.exit(1);
  }
}

build();
```

### Watch Mode Integration

```javascript
import { watch } from 'chokidar';

const watcher = watch('tokens/**/*.json');
watcher.on('change', async (path) => {
  console.log(`Token changed: ${path}`);
  // Must create new instance — SD5 caches resolved tokens
  const sd = new StyleDictionary(config);
  await sd.buildAllPlatforms();
});
```

**Important:** Create a new `StyleDictionary` instance on each rebuild. The instance caches resolved tokens and platform configs.

### Multiple Theme Variants

```javascript
const themes = ['light', 'dark', 'high-contrast'];

for (const theme of themes) {
  const sd = new StyleDictionary({
    source: [
      'tokens/core/**/*.json',
      `tokens/themes/${theme}/**/*.json`,
      'tokens/component/**/*.json',
    ],
    platforms: {
      css: {
        transformGroup: 'css',
        buildPath: `dist/themes/${theme}/`,
        files: [{
          destination: 'tokens.css',
          format: 'css/variables',
          options: {
            selector: theme === 'light' ? ':root' : `[data-theme="${theme}"]`,
            outputReferences: true,
          },
        }],
      },
    },
  });
  await sd.buildAllPlatforms();
}
```
