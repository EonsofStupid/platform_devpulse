# Style Dictionary v5 — Filters

> Token filtering at the platform and file level.

## Filter Interface

```typescript
interface Filter {
  name: string;
  filter: (token: TransformedToken, options: Config) => boolean | Promise<boolean>;
}
```

## Registration

```typescript
// Global registration
StyleDictionary.registerFilter({
  name: 'is-color',
  filter: (token) => token.type === 'color',
});

// Config hooks
const sd = new StyleDictionary({
  hooks: {
    filters: {
      'is-color': (token) => token.type === 'color',
      'is-semantic': (token) => ['action', 'surface', 'text', 'border', 'status'].includes(token.path[1]),
    },
  },
});
```

## Usage

### File-Level Filter (most common)

```javascript
files: [
  {
    destination: 'colors.css',
    format: 'css/variables',
    filter: 'is-color',             // Named filter
  },
  {
    destination: 'spacing.css',
    format: 'css/variables',
    filter: (token) => token.type === 'dimension',  // Inline function
  },
  {
    destination: 'buttons.css',
    format: 'css/variables',
    filter: { path: ['button'] },   // Partial match — NOT RECOMMENDED
  },
]
```

### Inline Function Filters (Preferred)

```javascript
// Filter by token type
filter: (token) => token.type === 'color'

// Filter by path
filter: (token) => token.path[0] === 'button'

// Filter by source file
filter: (token) => token.filePath.includes('semantic/')

// Filter by isSource (exclude included tokens)
filter: (token) => token.isSource

// Complex filter — ColdLight dark theme
filter: (token) => {
  const p = token.path;
  return p[0] === 'color' && [
    'action', 'surface', 'text', 'border', 'status'
  ].includes(p[1]);
}
```

## Partial Match Objects

SD5 supports partial object matching for simple cases:

```javascript
// Match tokens where path starts with ['color']
filter: { path: ['color'] }          // CAUTION: matches array prefix

// Match by type
filter: { type: 'color' }

// Match by attributes
filter: { attributes: { category: 'color' } }
```

**Prefer inline functions** — partial match behavior is less predictable.

## Filtered vs Unfiltered Tokens

When a format has a filter, the `dictionary` object contains:
- `dictionary.tokens` / `dictionary.allTokens` — **filtered** tokens only
- `dictionary.unfilteredTokens` / `dictionary.unfilteredAllTokens` — **all** tokens

This is important for `outputReferences`: a token might reference another token that was filtered out. SD5 uses `unfilteredTokens` to resolve references even when the referenced token isn't in the current output file.

```javascript
// In a custom format, to handle references correctly:
format: ({ dictionary }) => {
  for (const token of dictionary.allTokens) {
    // token.value might be var(--ref) pointing to unfilteredTokens
    // dictionary.unfilteredTokens has the actual referenced token
  }
}
```

## Common Filter Patterns for ColdLight

```javascript
// Core tokens only (no references to other tokens)
filter: (token) => token.path.length <= 3 && !token.original.$value?.startsWith?.('{')

// Semantic layer only
filter: (token) => ['action', 'surface', 'text', 'border', 'status'].includes(token.path[1])

// Component tokens only
filter: (token) => ['button', 'input', 'card', 'badge', 'toggle', 'tooltip'].includes(token.path[0])

// All tokens for a specific component
filter: (token) => token.path[0] === 'button'

// Only tokens that changed in dark theme (semantic colors)
filter: (token) => {
  const p = token.path;
  return p[0] === 'color' && ['action', 'surface', 'text', 'border', 'status'].includes(p[1]);
}

// Typography tokens
filter: (token) => token.path[0] === 'font' || token.type === 'fontFamily' || token.type === 'fontWeight'

// Motion tokens
filter: (token) => token.type === 'duration' || token.type === 'cubicBezier'

// Dimension tokens (spacing, sizing)
filter: (token) => token.type === 'dimension' && !['font'].includes(token.path[0])
```
