# Style Dictionary — Migration from v3 to v5

> v4 was a transitional release. v5 is the current stable. This covers all breaking changes.

## Major Breaking Changes

### 1. ESM Only

**v3:** CommonJS (`require('style-dictionary')`)
**v5:** ESM only (`import StyleDictionary from 'style-dictionary'`)

```javascript
// v3 ❌
const StyleDictionary = require('style-dictionary');
module.exports = { /* config */ };

// v5 ✅
import StyleDictionary from 'style-dictionary';
export default { /* config */ };
```

Config file must be `.mjs` or in a `"type": "module"` package.

### 2. Async API

**v3:** All methods were synchronous
**v5:** All methods return Promises

```javascript
// v3 ❌
const sd = StyleDictionary.extend('config.json');
sd.buildAllPlatforms();

// v5 ✅
const sd = new StyleDictionary('config.json');
await sd.hasInitialized;       // Wait for async init
await sd.buildAllPlatforms();

// Or use extend (also async now)
const sd = new StyleDictionary();
const extended = await sd.extend('config.json');
await extended.buildAllPlatforms();
```

### 3. Constructor Change

**v3:** `StyleDictionary.extend(config)` was the primary entry point
**v5:** `new StyleDictionary(config)` is primary. `extend()` creates derived instances.

```javascript
// v3 ❌
const sd = StyleDictionary.extend({ source: [...], platforms: {...} });

// v5 ✅
const sd = new StyleDictionary({ source: [...], platforms: {...} });
```

### 4. DTCG Format Support

v5 auto-detects and prefers DTCG format:

```jsonc
// v3 format (still works)
{ "value": "#fff", "type": "color", "comment": "White" }

// v5 DTCG format (preferred)
{ "$value": "#fff", "$type": "color", "$description": "White" }
```

When `$value` is detected on ANY token, v5 sets `usesDtcg: true` globally.

### 5. Hooks System Replaces Direct Properties

**v3:** Transforms, formats, etc. were flat config properties
**v5:** Organized under `hooks` namespace

```javascript
// v3 ❌
{
  transform: { /* ... */ },
  format: { /* ... */ },
}

// v5 ✅
{
  hooks: {
    transforms: { /* ... */ },
    formats: { /* ... */ },
    parsers: { /* ... */ },
    preprocessors: { /* ... */ },
    filters: { /* ... */ },
    actions: { /* ... */ },
    fileHeaders: { /* ... */ },
    transformGroups: { /* ... */ },
  },
}
```

### 6. Registration Method Changes

Registration methods still exist but signatures changed:

```javascript
// v3 ❌
StyleDictionary.registerTransform({
  name: 'custom',
  type: 'value',
  matcher: (token) => token.attributes.category === 'color',
  transformer: (token) => token.value,
});

// v5 ✅
StyleDictionary.registerTransform({
  name: 'custom',
  type: 'value',
  filter: (token) => token.type === 'color',     // 'matcher' → 'filter'
  transform: (token) => token.value,              // 'transformer' → 'transform'
});
```

### 7. `matcher` → `filter`

All `matcher` properties renamed to `filter`:
- Transform `matcher` → `filter`
- Format helper `matcher` → `filter`

### 8. `transformer` → `transform`

Transform's `transformer` property renamed to `transform`.

### 9. `property` → `token`

Throughout the API:
- `token.properties` → `token.tokens`
- `dictionary.properties` → `dictionary.tokens`
- `dictionary.allProperties` → `dictionary.allTokens`

### 10. `exportPlatform()` Deprecated

```javascript
// v3 ❌
const tokens = sd.exportPlatform('css');

// v5 ✅
const dictionary = await sd.getPlatformTokens('css');
// dictionary.tokens, dictionary.allTokens, dictionary.tokenMap
```

### 11. Token `value` is Post-Transform

In v5, `token.value` is always the **transformed** value. The original is in `token.original`.

```javascript
// In a format function:
token.value;          // "#3b82f6" (transformed)
token.original.$value; // "{color.blue.600}" (original reference)
```

### 12. Transitive Transforms

v5 properly supports transitive transforms — transforms that run on resolved reference values:

```javascript
{
  name: 'color/css',
  type: 'value',
  transitive: true,   // NEW in v4/v5
  filter: isColor,
  transform: (token) => /* ... */,
}
```

In v3, all transforms ran before reference resolution, making it impossible to transform referenced values.

### 13. Token Expansion (New)

v5 adds `expand` config to decompose composite tokens:

```javascript
// v3: No way to expand composite tokens automatically
// v5 ✅
{
  expand: true,  // or { include: ['shadow', 'typography'] }
}
```

### 14. Platform-Level Preprocessors (New)

```javascript
// v5 ✅
platforms: {
  css: {
    preprocessors: ['css-specific-preprocessor'],
  },
}
```

### 15. LogConfig Changes

```javascript
// v3 ❌
{ log: 'error' }  // or 'warn'

// v5 ✅
{
  log: {
    verbosity: 'verbose',        // 'default' | 'silent' | 'verbose'
    warnings: 'error',           // 'error' | 'warn' | 'disabled'
    errors: {
      brokenReferences: 'throw', // 'throw' | 'console' | 'silent'
    },
  },
}
```

### 16. Node.js Version

**v3:** Node 12+
**v5:** Node 22+ (uses `Set.prototype.union`)

### 17. CSS Transform Group Changes

The `css` transform group gained new transitive shorthand transforms:
- `fontFamily/css` (transitive)
- `cubicBezier/css` (transitive)
- `strokeStyle/css/shorthand` (transitive)
- `border/css/shorthand` (transitive)
- `typography/css/shorthand` (transitive)
- `transition/css/shorthand` (transitive)
- `shadow/css/shorthand` (transitive)

These auto-convert DTCG composite token objects to CSS shorthand strings.

### 18. Wide-Gamut Color Transforms (New)

New color transforms for modern CSS:
- `color/oklch` → `oklch(0.7 0.15 180)`
- `color/oklab` → `oklab(0.7 -0.1 0.1)`
- `color/p3` → `color(display-p3 0.5 0.5 0.5)`
- `color/lch` → `lch(50% 30 180)`

Uses ColorJS.io internally for accurate gamut conversion.

---

## Migration Checklist

1. [ ] Convert config file to ESM (`.mjs` or `"type": "module"`)
2. [ ] Change `require()` to `import`
3. [ ] Change `StyleDictionary.extend()` to `new StyleDictionary()`
4. [ ] Add `await` to all SD method calls
5. [ ] Rename `matcher` → `filter` in custom transforms
6. [ ] Rename `transformer` → `transform` in custom transforms
7. [ ] Update `dictionary.properties` → `dictionary.tokens`
8. [ ] Update `dictionary.allProperties` → `dictionary.allTokens`
9. [ ] Consider converting tokens to DTCG format (`$value`/`$type`)
10. [ ] Update `log` config to new object format
11. [ ] Test with Node 22+
12. [ ] Consider using `expand` for composite tokens
13. [ ] Review custom formats — `dictionary` shape changed
