# Style Dictionary v5 — Complete API Reference

> Source of truth extracted from `style-dictionary@5.x` TypeScript declarations and source code.
> Node >= 22 required (uses `Set.prototype.union`). ESM-only — no CommonJS.

## Table of Contents

- [00-overview.md](./00-overview.md) — This file. Architecture, installation, config schema
- [01-dtcg-tokens.md](./01-dtcg-tokens.md) — DTCG format, $value/$type, composites, references
- [02-transforms.md](./02-transforms.md) — All 50+ built-in transforms, custom registration
- [03-transform-groups.md](./03-transform-groups.md) — Built-in groups (css, js, scss, ios, android, etc.)
- [04-formats.md](./04-formats.md) — Built-in formats, custom format API, format helpers
- [05-hooks-lifecycle.md](./05-hooks-lifecycle.md) — Full hook lifecycle: parsers → preprocessors → transforms → formats → actions
- [06-filters.md](./06-filters.md) — Token filtering, matchers, platform-level vs file-level
- [07-advanced-patterns.md](./07-advanced-patterns.md) — Multi-file output, extend(), theming, conditional transforms
- [08-migration-v3-to-v5.md](./08-migration-v3-to-v5.md) — Breaking changes, async API, removed APIs
- [09-sd5-complete-reference.md](./09-sd5-complete-reference.md) — **Master reference**: full API surface, config schema, cheat sheet, pipeline, troubleshooting, migration
- [tailwind-presets/](./tailwind-presets/) — SD5 → Tailwind v4 integration

---

## Installation

```bash
npm install style-dictionary@latest    # v5.x
# or
pnpm add style-dictionary@latest
```

**Requirements:**
- Node.js >= 22 (uses `Set.prototype.union`)
- ESM only — config file must be `.mjs` or in a `"type": "module"` package
- All APIs are async (return Promises)

## Architecture

```
Token Files (DTCG JSON)
    ↓
  Parsers          — Parse non-JSON files (YAML, TOML, etc.)
    ↓
  Preprocessors    — Mutate token tree before transforms
    ↓
  Transforms       — Per-token mutations (name, value, attribute)
    ↓
  Formats          — Generate output files (CSS, JS, TS, etc.)
    ↓
  Actions          — Side effects after build (copy assets, etc.)
```

## Config Schema (`Config` interface)

```typescript
interface Config {
  // Token sources
  source?: string[];            // Glob patterns for token files (these ARE the source of truth)
  include?: string[];           // Glob patterns for included tokens (overridden by source)
  tokens?: DesignTokens;        // Inline token objects (alternative to files)

  // DTCG mode
  usesDtcg?: boolean;           // Auto-detected. Forces $value/$type instead of value/type

  // Processing pipeline
  parsers?: string[];           // Named parsers to run (registered via registerParser)
  preprocessors?: string[];     // Named preprocessors to run

  // Token expansion (DTCG composite types → individual tokens)
  expand?: ExpandConfig;        // boolean | Expand | ExpandFilter

  // Hook registrations (inline, no need for separate register calls)
  hooks?: Hooks;

  // Platform outputs
  platforms?: Record<string, PlatformConfig>;

  // Logging
  log?: LogConfig;
}
```

### Hooks (inline registration)

```typescript
interface Hooks {
  parsers?: Record<string, Omit<Parser, 'name'>>;
  preprocessors?: Record<string, Preprocessor['preprocessor']>;
  transformGroups?: Record<string, string[]>;
  transforms?: Record<string, Omit<Transform, 'name'>>;
  formats?: Record<string, Format['format']>;
  fileHeaders?: Record<string, FileHeader>;
  filters?: Record<string, Filter['filter']>;
  actions?: Record<string, Omit<Action, 'name'>>;
}
```

### Platform Config

```typescript
interface PlatformConfig {
  // Transform pipeline
  transformGroup?: string;           // Named group (e.g., 'css', 'js', 'ios')
  transforms?: string[] | Transform[]; // Override individual transforms

  // Preprocessing
  preprocessors?: string[];          // Platform-specific preprocessors

  // Output
  buildPath?: string;                // Directory prefix for all file destinations
  prefix?: string;                   // Prefix for token names (e.g., 'cl' → '--cl-color-blue-500')
  files?: File[];                    // Output file configurations

  // Post-build
  actions?: string[] | Omit<Action, 'name'>[];

  // Token expansion (platform-level override)
  expand?: ExpandConfig;

  // Logging (platform-level override)
  log?: LogConfig;

  // Options (passed to formats)
  options?: LocalOptions;

  // Arbitrary platform-level data
  [key: string]: any;
}
```

### File Config

```typescript
interface File {
  destination?: string;                              // Output filename (relative to buildPath)
  format?: string | FormatFn;                        // Named format or inline function
  filter?: string | Partial<TransformedToken> | Filter['filter'];  // Token filter
  options?: LocalOptions;                            // Per-file options
}
```

### Local Options (per-file)

```typescript
interface LocalOptions {
  showFileHeader?: boolean;              // Include "Do not edit" header (default: true)
  fileHeader?: string | FileHeader;      // Custom file header
  outputReferences?: OutputReferences;   // Preserve token references in output (default: false)
  outputReferenceFallbacks?: boolean;    // Include fallback values with references
  formatting?: FormattingOverrides;      // Override comment style, indentation, etc.
  sort?: SortOption;                     // Token sort order
  [key: string]: any;                    // Arbitrary options passed to format function
}
```

### Log Config

```typescript
interface LogConfig {
  warnings?: 'error' | 'warn' | 'disabled';     // How to handle warnings
  verbosity?: 'default' | 'silent' | 'verbose';  // Output verbosity
  errors?: {
    brokenReferences?: 'throw' | 'console' | 'silent'; // How to handle unresolved references
  };
}
```

### Expand Config (DTCG composite expansion)

```typescript
// Expand composite tokens (typography, shadow, border, transition, gradient)
// into individual tokens for each sub-property

type ExpandConfig = boolean | Expand | ExpandFilter;

interface Expand {
  typesMap?: Record<string, Record<string, string> | string>;
  include?: string[] | ExpandFilter;
  exclude?: string[] | ExpandFilter;
}

type ExpandFilter = (
  token: DesignToken,
  options: Config,
  platform?: PlatformConfig
) => boolean;
```

## StyleDictionary Class API

```typescript
import StyleDictionary from 'style-dictionary';

// ─── Construction ───────────────────────────────────────────
const sd = new StyleDictionary(config);     // Config object or path to config file
await sd.hasInitialized;                     // Wait for async init

// ─── Extend (create derived instance) ───────────────────────
const extended = await sd.extend(overrides); // Returns new StyleDictionary

// ─── Build ──────────────────────────────────────────────────
await sd.buildAllPlatforms();                // Build all platforms
await sd.buildPlatform('css');               // Build single platform

// ─── Clean (remove generated files) ─────────────────────────
await sd.cleanAllPlatforms();
await sd.cleanPlatform('css');

// ─── Format only (get output without writing files) ─────────
const results = await sd.formatAllPlatforms();
const cssResult = await sd.formatPlatform('css');
// Returns: [{ output: string, destination: string }]

// ─── Platform inspection ────────────────────────────────────
const platformConfig = sd.getPlatformConfig('css');
const dictionary = await sd.getPlatformTokens('css');
// Dictionary: { tokens, allTokens, tokenMap, unfilteredTokens, unfilteredAllTokens }

// ─── Instance properties ────────────────────────────────────
sd.tokens;        // PreprocessedTokens (nested object)
sd.allTokens;     // Token[] (flat array)
sd.tokenMap;      // Map<string, Token>
sd.usesDtcg;      // boolean — auto-detected from $value presence
sd.source;        // string[] — resolved source globs
sd.platforms;     // Record<string, PlatformConfig>
```

## Static Registration API

Register hooks globally (affects all instances):

```typescript
// ─── Transforms ─────────────────────────────────────────────
StyleDictionary.registerTransform({
  name: 'custom/px-to-rem',
  type: 'value',                    // 'name' | 'value' | 'attribute'
  filter: (token) => token.type === 'dimension',
  transitive: false,                // Set true if output can contain references
  transform: (token, platform, options) => {
    const val = parseFloat(token.value);
    return `${val / 16}rem`;
  },
});

// ─── Transform Groups ───────────────────────────────────────
StyleDictionary.registerTransformGroup({
  name: 'custom/web',
  transforms: ['attribute/cti', 'name/kebab', 'custom/px-to-rem', 'color/css'],
});

// ─── Formats ────────────────────────────────────────────────
StyleDictionary.registerFormat({
  name: 'custom/json-flat',
  format: ({ dictionary, file, options, platform }) => {
    // Must return a string (or Promise<string>)
    const tokens = {};
    dictionary.allTokens.forEach(t => { tokens[t.name] = t.value; });
    return JSON.stringify(tokens, null, 2);
  },
});

// ─── Filters ────────────────────────────────────────────────
StyleDictionary.registerFilter({
  name: 'custom/color-only',
  filter: (token, options) => token.type === 'color',
});

// ─── Parsers ────────────────────────────────────────────────
StyleDictionary.registerParser({
  name: 'custom/yaml-parser',
  pattern: /\.ya?ml$/,
  parser: ({ contents, filePath }) => {
    // Return DesignTokens object
    return yaml.parse(contents);
  },
});

// ─── Preprocessors ──────────────────────────────────────────
StyleDictionary.registerPreprocessor({
  name: 'custom/add-prefix',
  preprocessor: (tokens, options) => {
    // Mutate and return token tree
    return tokens;
  },
});

// ─── Actions ────────────────────────────────────────────────
StyleDictionary.registerAction({
  name: 'custom/copy-assets',
  do: async (dictionary, config, options, vol) => {
    // Side effect after build
  },
  undo: async (dictionary, config, options, vol) => {
    // Cleanup on clean
  },
});

// ─── File Headers ───────────────────────────────────────────
StyleDictionary.registerFileHeader({
  name: 'custom/header',
  fileHeader: (defaultMessage, options) => {
    return [...defaultMessage, 'Generated by ColdLight'];
  },
});
```

## Minimal Working Example

```javascript
// sd.build.mjs
import StyleDictionary from 'style-dictionary';

const sd = new StyleDictionary({
  source: ['tokens/**/*.json'],
  platforms: {
    css: {
      transformGroup: 'css',
      prefix: 'cl',
      buildPath: 'dist/',
      files: [{
        destination: 'tokens.css',
        format: 'css/variables',
        options: { outputReferences: true },
      }],
    },
  },
});

await sd.buildAllPlatforms();
```

Output:
```css
/**
 * Do not edit directly, this file was auto-generated.
 */

:root {
  --cl-color-blue-500: #3b82f6;
  --cl-color-action-primary: var(--cl-color-blue-600);
  /* ... */
}
```
