# Style Dictionary v5 — Hooks & Processing Lifecycle

> The complete pipeline from token files to output, with every hook point documented.

## Full Lifecycle

```
1. PARSE         Token files → DesignTokens objects
                  ├── Built-in: JSON parser
                  └── Custom parsers (YAML, TOML, etc.)
                       ↓
2. MERGE          All parsed token trees deep-merged
                  (source overrides include)
                       ↓
3. PREPROCESS     Mutate merged token tree
                  ├── Global preprocessors (config.preprocessors)
                  └── Platform preprocessors (platform.preprocessors)
                       ↓
4. EXPAND         Composite tokens → individual tokens
                  (if expand config is set)
                       ↓
5. RESOLVE REFS   {color.blue.500} → actual values
                  (circular refs throw)
                       ↓
6. TRANSFORM      Per-token mutations (per platform)
                  ├── attribute transforms (add metadata)
                  ├── name transforms (rename tokens)
                  ├── value transforms (convert values)
                  └── transitive value transforms (run on resolved values)
                       ↓
7. FILTER         Select tokens for each output file
                  (platform-level or file-level filters)
                       ↓
8. SORT           Order tokens in output
                  (by reference dependency, then name)
                       ↓
9. FORMAT         Generate output string for each file
                  (CSS, JS, JSON, etc.)
                       ↓
10. FILE HEADER   Prepend header comment
                       ↓
11. WRITE         Write files to disk
                       ↓
12. ACTIONS       Post-build side effects
                  (copy assets, generate docs, etc.)
```

---

## 1. Parsers

Parsers convert non-JSON files into token objects. The built-in parser handles `.json` and `.jsonc`.

```typescript
interface Parser {
  name: string;
  pattern: RegExp;             // File extension pattern to match
  parser: (options: {
    contents: string;          // Raw file contents
    filePath?: string;         // File path
  }) => DesignTokens | Promise<DesignTokens>;
}
```

### Register

```typescript
// Via registerParser
StyleDictionary.registerParser({
  name: 'yaml-parser',
  pattern: /\.ya?ml$/,
  parser: ({ contents }) => yaml.parse(contents),
});

// Via config.hooks
const sd = new StyleDictionary({
  hooks: {
    parsers: {
      'yaml-parser': {
        pattern: /\.ya?ml$/,
        parser: ({ contents }) => yaml.parse(contents),
      },
    },
  },
  parsers: ['yaml-parser'],  // Activate it
  source: ['tokens/**/*.{json,yaml}'],
});
```

**Important:** Parsers registered via `hooks` still need to be listed in `parsers` array to be activated.

### Use Cases
- YAML token files
- TOML token files
- CSV/spreadsheet token sources
- Figma API JSON → DTCG conversion

---

## 2. Merge Strategy

- `include` files are parsed and merged first (base layer)
- `source` files are parsed and merged on top (override layer)
- Deep merge: nested objects are recursively merged
- `source` tokens with same path overwrite `include` tokens
- Token's `isSource` property tracks origin

---

## 3. Preprocessors

Preprocessors mutate the entire token tree before transforms run. Useful for:
- Adding computed tokens
- Normalizing inconsistent token structures
- Injecting metadata

```typescript
type Preprocessor = {
  name: string;
  preprocessor: (
    dictionary: PreprocessedTokens,
    options: Config | PlatformConfig
  ) => PreprocessedTokens | Promise<PreprocessedTokens>;
};
```

### Register

```typescript
StyleDictionary.registerPreprocessor({
  name: 'add-color-type',
  preprocessor: (tokens, options) => {
    // Walk the tree and add $type where missing
    function walk(obj, parentType) {
      for (const [key, val] of Object.entries(obj)) {
        if (key.startsWith('$')) continue;
        if (val && typeof val === 'object') {
          if (val.$value !== undefined && !val.$type && parentType) {
            val.$type = parentType;
          }
          walk(val, val.$type || parentType);
        }
      }
    }
    walk(tokens, undefined);
    return tokens;
  },
});
```

### Global vs Platform Preprocessors

```javascript
const sd = new StyleDictionary({
  preprocessors: ['global-preprocessor'],  // Runs for ALL platforms
  platforms: {
    css: {
      preprocessors: ['css-specific-preprocessor'],  // Runs only for CSS
    },
  },
});
```

Execution order: global preprocessors first, then platform preprocessors.

---

## 4. Token Expansion

See [01-dtcg-tokens.md](./01-dtcg-tokens.md#token-expansion-composite--individual) for details.

Expansion happens AFTER preprocessing but BEFORE reference resolution. This means:
- Preprocessors see composite tokens as objects
- Transforms see expanded individual tokens
- References inside composite values are resolved after expansion

---

## 5. Reference Resolution

```
{color.blue.500}  →  resolved to the actual token value
```

- Uses dot-notation path through the merged token tree
- Circular references: detected and throw by default
- Broken references: controlled by `log.errors.brokenReferences`
  - `'throw'` — Error, build fails (default)
  - `'console'` — Warning, continues with raw reference string
  - `'silent'` — No output, continues silently

---

## 6. Transforms

See [02-transforms.md](./02-transforms.md) for the complete list.

**Execution order within a platform:**
1. `attribute` transforms run first
2. `name` transforms run second
3. `value` transforms run third
4. Within each type, transforms run in array order
5. `transitive: true` transforms run in a second pass after reference resolution

**Important for ColdLight:** The `css` transform group includes transitive transforms for shadow, typography, border, transition, and cubicBezier. These correctly handle referenced composite tokens like:

```json
{
  "button": {
    "shadow": {
      "$type": "shadow",
      "hover": { "$value": "{shadow.sm}" }  // Reference to composite
    }
  }
}
```

The `shadow/css/shorthand` transform is transitive, so it receives the resolved shadow object `{ offsetX, offsetY, blur, spread, color }` and correctly converts it to `"0 1px 2px 0 rgba(0,0,0,0.05)"`.

---

## 7. Filters

Filters select which tokens appear in each output file.

```typescript
interface Filter {
  name: string;
  filter: (token: TransformedToken, options: Config) => boolean | Promise<boolean>;
}
```

### File-Level Filter (most common)

```javascript
files: [{
  destination: 'colors.css',
  format: 'css/variables',
  // String filter (registered name)
  filter: 'custom/color-only',
  // OR inline function
  filter: (token) => token.type === 'color',
  // OR partial match object
  filter: { type: 'color' },
}]
```

### ColdLight Dark Theme Filter

```javascript
filter: (token) => {
  const p = token.path;
  return p[0] === 'color' && [
    'action', 'surface', 'text', 'border', 'status'
  ].includes(p[1]);
},
```

This outputs only semantic color tokens that change between themes.

---

## 8. Sort

Tokens are sorted before formatting. Default sort:
1. Tokens referenced by others come first
2. Then alphabetical by name

Custom sort via `options.sort`:

```javascript
files: [{
  destination: 'tokens.css',
  format: 'css/variables',
  options: {
    sort: (a, b) => a.name.localeCompare(b.name),
  },
}]
```

---

## 9. Format

See [04-formats.md](./04-formats.md) for complete format reference.

---

## 10. File Headers

```typescript
type FileHeader = (
  defaultMessage?: string[],
  options?: Config
) => Promise<string[]> | string[];
```

### Register

```typescript
StyleDictionary.registerFileHeader({
  name: 'coldlight-header',
  fileHeader: (defaultMessage) => [
    ...defaultMessage,
    'Generated by ColdLight Design System',
    `Build: ${new Date().toISOString()}`,
  ],
});
```

### Usage

```javascript
files: [{
  destination: 'tokens.css',
  format: 'css/variables',
  options: {
    fileHeader: 'coldlight-header',
    // OR inline:
    fileHeader: (defaultMessage) => [...defaultMessage, 'Custom line'],
    // OR disable:
    showFileHeader: false,
  },
}]
```

---

## 11. Write

Files are written to `platform.buildPath + file.destination`.

If `file.destination` is omitted, the format output is available in memory only (via `formatPlatform()`/`formatAllPlatforms()`).

---

## 12. Actions

Actions run AFTER all files are written. Use for side effects.

```typescript
interface Action {
  name: string;
  do: (
    dictionary: Dictionary,
    config: PlatformConfig,
    options: Config,
    vol: Volume
  ) => void | Promise<void>;
  undo?: (
    dictionary: Dictionary,
    config: PlatformConfig,
    options: Config,
    vol: Volume
  ) => void | Promise<void>;
}
```

### Register

```typescript
StyleDictionary.registerAction({
  name: 'generate-manifest',
  do: async (dictionary, config, options) => {
    const manifest = dictionary.allTokens.map(t => ({
      name: t.name,
      value: t.value,
      type: t.type,
      path: t.path.join('.'),
    }));
    await fs.writeFile(
      `${config.buildPath}manifest.json`,
      JSON.stringify(manifest, null, 2)
    );
  },
  undo: async (dictionary, config) => {
    await fs.unlink(`${config.buildPath}manifest.json`).catch(() => {});
  },
});
```

### Usage

```javascript
platforms: {
  css: {
    buildPath: 'dist/',
    actions: ['generate-manifest'],
    // OR inline:
    actions: [{
      do: async (dict, config) => { /* ... */ },
      undo: async (dict, config) => { /* ... */ },
    }],
  },
}
```

### Built-in Actions

#### `android/copyImages`
Copies image assets to Android resource directories.

#### `android/buildGradle`
Generates an Android Gradle build script.

---

## Hook Registration: 3 Methods

### 1. Static (class-level, global)
```typescript
StyleDictionary.registerTransform({ name: '...', /* ... */ });
```
Affects ALL StyleDictionary instances.

### 2. Config hooks (instance-level)
```typescript
const sd = new StyleDictionary({
  hooks: {
    transforms: {
      'my-transform': { type: 'value', transform: (t) => t.value },
    },
  },
});
```
Only affects this instance.

### 3. Platform hooks
```typescript
const sd = new StyleDictionary({
  platforms: {
    css: {
      transforms: [
        'name/kebab',
        { name: 'inline', type: 'value', transform: (t) => t.value },  // inline
      ],
    },
  },
});
```
Only affects this platform.

**Precedence:** Platform > Instance > Static (platform overrides instance, instance overrides static).
