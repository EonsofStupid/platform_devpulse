# Research: SD5 Hypermodular Pipeline

**Date**: 2026-02-20
**Sprint**: SPRINT-SD5-PIPELINE
**Status**: COMPLETE

---

## Problem Statement

`ds-tokens-build.ts` is a 542-line flat file with three custom SD5 formats that completely
bypass SD5's transform pipeline. The `coldlight/css` format reads raw TypeScript token
imports directly — SD5 never applies name transforms to it. The result: SD5 runs, processes
the DTCG, and the transforms are wasted. The custom format ignores `dictionary.allTokens`
entirely and manually constructs CSS.

This violates the "work WITH the system, not against it" principle and produces a
maintenance nightmare as tokens grow.

---

## Root Cause Analysis

### Current `coldlight/css` format (wrong):

```typescript
StyleDictionary.registerFormat({
  name: "coldlight/css",
  format: () => {
    // PROBLEM: reads raw TS imports, not dictionary.allTokens
    addSection("Colors", prefixes.color, tokens.color);  // ← bypasses SD5
    // ... 200 more lines of manual CSS construction
  }
});
```

SD5 processes the DTCG internally but the output format ignores `dictionary.allTokens`.

### What SD5 native does (correct):

- `transformGroup: 'css'` applies `name/kebab` transform: `color.teal.50` → `color-teal-50`
- `format: 'css/variables'` uses `dictionary.allTokens` to emit `:root { --color-teal-50: ... }`
- Full token path is the name — zero collision risk

---

## Context7 Research Findings

### SD5 Native CSS Variables (confirmed works)

```javascript
const sd = new StyleDictionary({
  source: ['tokens.json'],
  platforms: {
    css: {
      transformGroup: 'css',  // ← includes name/kebab, color/css transforms
      files: [{
        destination: 'tokens.css',
        format: 'css/variables',  // ← uses dictionary.allTokens properly
        options: { outputReferences: true }
      }]
    }
  }
});
```

Token path `color.teal.50` → transform `name/kebab` → `color-teal-50` → CSS `--color-teal-50`.
Token path `glass.void` → `glass-void` → CSS `--glass-void`.
Zero collision. Full path used as name.

### outputReferences

For tokens whose `$value` is a DTCG reference (`{color.teal.50}`), SD5 resolves to `var(--color-teal-50)`.

**BUT** our Tier 2/3 tokens use raw CSS var strings (`var(--glass-void)`), not DTCG references.
These are NOT DTCG references — they are literal values. `outputReferences` does not apply.
SD5 will output them as literal values, which is correct: `--semantic-surface-primary: var(--glass-void);`

### Custom Formats: When Required

SD5 native handles: `:root { --token-name: value; }` via `css/variables`.

Custom formats still required for:
1. **Tailwind v4 `@theme` block** — SD5 has no Tailwind v4 format. `@theme` needs
   different variable name prefixes than the `:root` block (e.g., `--color-glass-*` not `--glass-*`).
2. **TypeScript enum arrays** — DTCG `$value` is a scalar; arrays (`readonly string[]`) can't
   be represented. Must use raw jiti import for `tokens.enums`.

Custom formats SHOULD use `dictionary.allTokens` (not raw imports) wherever possible.

---

## Token Structure Analysis

### Tier 1 — Global tokens (tokens.ts)

```typescript
export const hue   = { teal: "180", ... }        // flat object
export const color = { teal: { 50: "oklch(...)" } } // 2-level nested
export const glass = { void: "oklch(...)" }        // flat
export const space = { sm: "4px", ... }            // flat
// enums: { stateTokens: [...], ... }              // arrays — NOT DTCG-representable
```

DTCG structure produced by `ts-to-dtcg.ts`:
```json
{
  "color": { "teal": { "50": { "$type": "color", "$value": "oklch(0.97 0.02 180)" } } },
  "glass": { "void": { "$type": "color", "$value": "oklch(0.08 0.01 180)" } },
  "space": { "sm": { "$type": "dimension", "$value": "4px" } }
}
```

SD5 name transforms:
- `color.teal.50` → `--color-teal-50`
- `glass.void` → `--glass-void`
- `space.sm` → `--space-sm`

### Tier 2 — Semantic tokens (semantic.ts)

```typescript
export const semantic = {
  surface: { primary: "var(--glass-void)" },    // literal CSS var reference
  border: { subtle: "oklch(from var(...))" },   // complex expression
}
```

DTCG: `$value` = literal string (not a DTCG `{path.to.token}` reference).
SD5 outputs: `--semantic-surface-primary: var(--glass-void);` ← correct.

### Tier 3 — Component tokens (components.ts)

Same pattern as Tier 2. Literal values.

---

## Tailwind v4 `@theme` Mapping

The `@theme` block maps ColdLight token names to Tailwind v4 theme slot names:

| Token path (SD5 name) | Tailwind `@theme` key |
|---|---|
| `glass.*` | `--color-glass-*` |
| `matte.*` | `--color-matte-*` |
| `text.*` | `--color-text-*` |
| `color.teal.*` | `--color-teal-*` |
| `signal.*` | `--color-signal-*` |
| `space.*` | `--spacing-*` |
| `radius.*` | `--radius-*` |
| `shadow.*` | `--shadow-*` |
| `glow.*` | `--shadow-glow-*` |
| `bevel.*` | `--shadow-bevel-*` |
| `blur.*` | `--blur-*` |
| `duration.*` | `--transition-duration-*` |
| `ease.*` | `--transition-timing-function-*` |
| `textSize.*` | `--font-size-*` |
| `font.*` | `--font-*` |
| `animation.*` | `--animate-*` |
| `semantic.surface.*` | `--color-surface-*` |
| `semantic.border.*` | `--color-border-*` |
| `semantic.depth.*` | `--shadow-depth-*` |

The custom `coldlight/tailwind-theme` format filters `dictionary.allTokens` by `token.path[0]`
and applies the mapping above.

---

## Hypermodular File Structure (Locked)

```
scripts/dev/design/
  sd/
    build.ts                   ← Entry point. Runs preprocessor, registers formats, runs SD5.
    config.ts                  ← Config factory. Returns StyleDictionary Config object.
    preprocessors/
      ts-to-dtcg.ts            ← Loads TS tokens via jiti → DTCG JSON → writes tokens.json
    formats/
      tailwind-theme.ts        ← Registers coldlight/tailwind-theme (@theme block)
      types.ts                 ← Registers coldlight/types (TypeScript enum arrays)
```

`ds-tokens-build.ts` is DELETED. `package.json` updated to `node scripts/dev/design/sd/build.ts`.

---

## What Each File Does (Locked)

### `preprocessors/ts-to-dtcg.ts`
- Uses jiti to import `coldlightConfig`, `tokens`, `semantic`, `components`
- Converts all TS token exports to DTCG JSON structure
- Writes `tokens.json` to `dtcg.output` path from config
- Exports: `{ dtcgPath, tokensConfig, jitiEnums }` for use by `formats/types.ts`

### `formats/tailwind-theme.ts`
- Registers `coldlight/tailwind-theme`
- Receives `dictionary.allTokens` from SD5 (properly transformed)
- Filters tokens by `token.path[0]`, maps to Tailwind v4 `@theme` key names
- Returns: `@theme { --color-glass-void: oklch(...); ... }`

### `formats/types.ts`
- Registers `coldlight/types`
- Uses raw jiti import of `tokens.enums` (EXCEPTION: arrays not DTCG-compatible)
- Returns: `export const StateTokens = [...] as const;` etc.

### `config.ts`
- Imports and registers all custom formats
- Returns SD5 config object:
  - Platform `css`: `transformGroup: 'css'`, `format: 'css/variables'` → `:root { ... }`
  - Platform `tailwind`: custom `coldlight/tailwind-theme` format → `@theme { ... }`
  - Platform `ts`: custom `coldlight/types` format → TypeScript enums
  - All destination paths read from `tokensConfig`

### `build.ts`
- Imports `ts-to-dtcg.ts` → runs preprocessor → tokens.json written
- Imports `config.ts` → gets SD5 config
- `const sd = new StyleDictionary(config)`
- `await sd.buildAllPlatforms()`
- Prints success summary

---

## Output File Changes

Current: one `tokens.css` with `:root {}` + `@theme {}` in same file.
New: split for clarity:
- `tokens.css` — `:root { }` (SD5 native `css/variables`)
- `tailwind.css` — `@theme { }` (custom format)
- `types.ts` — TypeScript enums (unchanged output, new source)

> **Or**: keep `tokens.css` as combined file if app.css imports it that way.
> Check app.css import before deciding.

---

## Files Referenced

- `scripts/dev/design/ds-tokens-build.ts` — flat script to DELETE
- `interfaces/desktop/package.json` — update `ds:tokens:build` and `ds:tokens:watch` scripts
- `src/lib/design/coldlight.config.ts` — SSOT for all paths/prefixes
- `src/lib/design/tokens/tokens.ts` — Tier 1 source
- `src/lib/design/tokens/semantic.ts` — Tier 2 source
- `src/lib/design/tokens/components.ts` — Tier 3 source
- `src/lib/design/tokens/tokens.css` — generated CSS output (check import in app.css)
- `src/lib/design/tokens/types.ts` — generated TS output
- `src/lib/design/tokens/tailwind.preset.ts` — generated TW output (may change to tailwind.css)
