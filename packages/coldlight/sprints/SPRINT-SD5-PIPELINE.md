# Sprint: SD5 Pipeline — Hypermodular

**Created**: 2026-02-20
**Research**: [SPRINT-SD5-PIPELINE.research.md](./SPRINT-SD5-PIPELINE.research.md)
**Priority**: HIGH — SD5 runs but ignores its own transform pipeline
**Status**: READY TO EXECUTE

---

## Goal

Delete `scripts/dev/design/ds-tokens-build.ts`.
Build `scripts/dev/design/sd/` — five files, one concern each.
SD5's native `css/variables` format drives the `:root` block.
Custom formats drive `@theme` (Tailwind v4) and TypeScript enums.
Zero shortcuts.

---

## Why the Pipeline Stays in `scripts/`

`packages/coldlight/tokens/` holds sources and generated output — that IS colocation.
The pipeline is a Node.js build tool using `fs`, `jiti`, and `StyleDictionary`.
These are not SvelteKit modules. Putting Node tooling inside `src/lib/` causes
Vite to attempt bundling it. Build tools live in `scripts/`. This is correct.

---

## Real State Right Now

`ds-tokens-build.ts` — 542 lines. The `coldlight/css` custom format does this:

```typescript
format: () => {
  addSection("Colors", prefixes.color, tokens.color);  // reads raw TS import
  addSection("Glass", prefixes.glass, tokens.glass);   // reads raw TS import
  // ... 200 more lines of manual CSS construction
}
```

It completely ignores `dictionary.allTokens`. SD5 applies `name/kebab` transforms
internally — and the format discards all of it. The format is wasted machinery.

---

## New File Structure

```
scripts/dev/design/sd/
  build.ts                          ← Entry point. Orchestrates.
  config.ts                         ← Returns StyleDictionary config object.
  preprocessors/
    ts-to-dtcg.ts                   ← TS token sources → DTCG JSON → tokens.json
  formats/
    tailwind-theme.ts               ← coldlight/tailwind-theme → @theme block
    types.ts                        ← coldlight/types → TypeScript enum arrays
    tailwind-preset.ts              ← coldlight/tailwind-preset → TW v3 compat
```

---

## DTCG Structure — Verbatim from Your Actual Tokens

SD5 `name/kebab` converts token path to CSS var name using every path segment.
The token structure in DTCG must map to the CSS var names you want.

### Tier 1 — tokens.ts (24 groups, exact names)

| TS export | DTCG top-level group | Example token path | CSS var output |
|---|---|---|---|
| `hue` | `hue` | `hue.teal` | `--hue-teal: 180` |
| `color` | `color` | `color.teal.50` | `--color-teal-50: oklch(0.97 0.02 180)` |
| `glass` | `glass` | `glass.void` | `--glass-void: oklch(...)` |
| `matte` | `matte` | `matte.dark` | `--matte-dark: oklch(...)` |
| `text` | `text` | `text.primary` | `--text-primary: oklch(...)` |
| `space` | `space` | `space.4` | `--space-4: 1rem` |
| `radius` | `radius` | `radius.md` | `--radius-md: 0.5rem` |
| `blur` | `blur` | `blur.md` | `--blur-md: 8px` |
| `glow` | `glow` | `glow.teal` | `--glow-teal: 0 0 12px ...` |
| `shadow` | `shadow` | `shadow.z1` | `--shadow-z1: 0 1px 3px ...` |
| `bevel` | `bevel` | `bevel.subtle` | `--bevel-subtle: inset ...` |
| `z` | `z` | `z.modal` | `--z-modal: 400` |
| `duration` | `duration` | `duration.fast` | `--duration-fast: 150ms` |
| `ease` | `ease` | `ease.out` | `--ease-out: cubic-bezier(...)` |
| `textSize` | `textSize` | `textSize.sm` | `--textSize-sm: 0.875rem` |
| `padding` | `padding` | `padding.md` | `--padding-md: 0.5rem 1rem` |
| `signal` | `signal` | `signal.error` | `--signal-error: oklch(...)` |
| `font` | `font` | `font.mono` | `--font-mono: "JetBrains Mono"...` |
| `animation` | `animation` | `animation.pulse-glow` | `--animation-pulse-glow: ...` |

`enums` is NOT added to DTCG — arrays are not valid DTCG `$value`.

### Tier 2 — semantic.ts (NO wrapper — categories at root)

The `semantic` object in `semantic.ts` has 4 categories:
`surface`, `border`, `depth`, `transition`.

These go directly at DTCG root — NOT nested under a `semantic` key.
This produces clean CSS var names: `--surface-primary`, not `--semantic-surface-primary`.

| semantic.ts path | DTCG path | CSS var |
|---|---|---|
| `semantic.surface.primary` | `surface.primary` | `--surface-primary: var(--glass-void)` |
| `semantic.surface.elevated` | `surface.elevated` | `--surface-elevated: var(--glass-smoke)` |
| `semantic.surface.overlay` | `surface.overlay` | `--surface-overlay: var(--glass-deep)` |
| `semantic.surface.frosted` | `surface.frosted` | `--surface-frosted: var(--glass-frost)` |
| `semantic.surface.muted` | `surface.muted` | `--surface-muted: var(--matte-dark)` |
| `semantic.surface.muted-medium` | `surface.muted-medium` | `--surface-muted-medium: ...` |
| `semantic.surface.muted-light` | `surface.muted-light` | `--surface-muted-light: ...` |
| `semantic.border.subtle` | `border.subtle` | `--border-subtle: oklch(from ...)` |
| `semantic.border.soft` | `border.soft` | `--border-soft: oklch(from ...)` |
| `semantic.border.emphasis` | `border.emphasis` | `--border-emphasis: oklch(from ...)` |
| `semantic.border.focus` | `border.focus` | `--border-focus: var(--color-teal-400)` |
| `semantic.depth.flat` | `depth.flat` | `--depth-flat: var(--shadow-z0)` |
| `semantic.depth.raised` | `depth.raised` | `--depth-raised: var(--shadow-z1)` |
| `semantic.depth.panel` | `depth.panel` | `--depth-panel: var(--shadow-z2)` |
| `semantic.depth.overlay` | `depth.overlay` | `--depth-overlay: var(--shadow-z3)` |
| `semantic.depth.modal` | `depth.modal` | `--depth-modal: var(--shadow-z4)` |
| `semantic.transition.instant` | `transition.instant` | `--transition-instant: var(...) var(...)` |
| `semantic.transition.fast` | `transition.fast` | `--transition-fast: ...` |
| `semantic.transition.normal` | `transition.normal` | `--transition-normal: ...` |
| `semantic.transition.slow` | `transition.slow` | `--transition-slow: ...` |

### Tier 3 — components.ts (NO wrapper — kinds at root)

Component kinds go directly at DTCG root — NOT nested under `component`.

| components.ts path | DTCG path | CSS var |
|---|---|---|
| `components.button.bg` | `button.bg` | `--button-bg: var(--surface-primary)` |
| `components.button.bg-hover` | `button.bg-hover` | `--button-bg-hover: var(--surface-elevated)` |
| `components.button.border` | `button.border` | `--button-border: var(--border-subtle)` |
| `components.button.border-focus` | `button.border-focus` | `--button-border-focus: var(--border-focus)` |
| `components.panel.bg` | `panel.bg` | `--panel-bg: var(--surface-primary)` |
| `components.panel.border` | `panel.border` | `--panel-border: var(--border-soft)` |
| `components.panel.depth` | `panel.depth` | `--panel-depth: var(--depth-panel)` |
| `components.input.bg` | `input.bg` | `--input-bg: var(--surface-overlay)` |
| `components.input.bg-focus` | `input.bg-focus` | `--input-bg-focus: var(--surface-elevated)` |
| `components.input.border` | `input.border` | `--input-border: var(--border-subtle)` |
| `components.input.border-focus` | `input.border-focus` | `--input-border-focus: var(--border-focus)` |
| `components.badge.bg` | `badge.bg` | `--badge-bg: var(--surface-elevated)` |
| `components.badge.border` | `badge.border` | `--badge-border: var(--border-subtle)` |
| `components.dialog.bg` | `dialog.bg` | `--dialog-bg: var(--surface-overlay)` |
| `components.dialog.border` | `dialog.border` | `--dialog-border: var(--border-soft)` |
| `components.dialog.depth` | `dialog.depth` | `--dialog-depth: var(--depth-modal)` |
| `components.tooltip.bg` | `tooltip.bg` | `--tooltip-bg: var(--surface-elevated)` |
| `components.tooltip.border` | `tooltip.border` | `--tooltip-border: var(--border-subtle)` |

---

## Phase A: `preprocessors/ts-to-dtcg.ts`

One job: load TS sources via jiti, convert to DTCG JSON, write `tokens.json`.
Export `{ dtcgPath, tokensConfig, jitiEnums }` for use by other modules.

```typescript
/**
 * @file scripts/dev/design/sd/preprocessors/ts-to-dtcg.ts
 *
 * Loads ColdLight TS token sources via jiti.
 * Converts to DTCG 1.0 JSON.
 * Writes to tokensConfig.dtcg.output.
 * Exports dtcgPath, tokensConfig, jitiEnums for build.ts.
 */

import { writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createJiti } from "jiti";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DESKTOP_ROOT = resolve(__dirname, "../../../..");

const jiti = createJiti(import.meta.url, { moduleCache: false });

// Load tokens pipeline config directly — no need for the full coldlightConfig assembly.
// tokens.cfg.ts exports TOKENS — that's all this pipeline needs.
const tokensMod = await jiti.import(
  resolve(DESKTOP_ROOT, "packages/coldlight/config/coldlight/tokens.cfg.ts")
);
const tokensConfig = tokensMod.TOKENS;

// Load SSOT sources via paths declared in TOKENS
const tokens  = await jiti.import(resolve(DESKTOP_ROOT, tokensConfig.sources.globals));
const semMod  = await jiti.import(resolve(DESKTOP_ROOT, tokensConfig.sources.semantic));
const compMod = await jiti.import(resolve(DESKTOP_ROOT, tokensConfig.sources.components));

function toGroup(obj, type) { ... }     // flat: { key: { $type, $value } }
function toNestedGroup(obj, type) { ... } // 2-level: { group: { key: { $type, $value } } }

const dtcg = {
  $schema: "https://design-tokens.github.io/community-group/format/",

  // Tier 1 — flat groups
  hue:       toGroup(tokens.hue,       "number"),
  color:     toNestedGroup(tokens.color, "color"),  // 2-level
  glass:     toGroup(tokens.glass,     "color"),
  matte:     toGroup(tokens.matte,     "color"),
  text:      toGroup(tokens.text,      "color"),
  space:     toGroup(tokens.space,     "dimension"),
  radius:    toGroup(tokens.radius,    "dimension"),
  blur:      toGroup(tokens.blur,      "dimension"),
  glow:      toGroup(tokens.glow,      "shadow"),
  shadow:    toGroup(tokens.shadow,    "shadow"),
  bevel:     toGroup(tokens.bevel,     "shadow"),
  z:         toGroup(tokens.z,         "number"),
  duration:  toGroup(tokens.duration,  "duration"),
  ease:      toGroup(tokens.ease,      "cubicBezier"),
  textSize:  toGroup(tokens.textSize,  "dimension"),
  padding:   toGroup(tokens.padding,   "other"),
  signal:    toGroup(tokens.signal,    "color"),
  font:      toGroup(tokens.font,      "fontFamily"),
  animation: toGroup(tokens.animation, "other"),

  // Tier 2 — semantic categories spread to root (no "semantic" wrapper)
  // surface.primary → --surface-primary
  ...Object.fromEntries(
    Object.entries(semMod.semantic).map(([cat, entries]) => [
      cat,
      toGroup(entries, "other"),
    ])
  ),

  // Tier 3 — component kinds spread to root (no "component" wrapper)
  // button.bg → --button-bg
  ...Object.fromEntries(
    Object.entries(compMod.components).map(([kind, entries]) => [
      kind,
      toGroup(entries, "other"),
    ])
  ),
};

const dtcgPath = resolve(DESKTOP_ROOT, tokensConfig.dtcg.output);
writeFileSync(dtcgPath, JSON.stringify(dtcg, null, "\t") + "\n", "utf-8");

export { dtcgPath, tokensConfig, jitiEnums: tokens.enums };
```

---

## Phase B: `formats/tailwind-theme.ts`

One job: register `coldlight/tailwind-theme`. Uses `dictionary.allTokens`.
Reads `tokensConfig.platforms.css.tailwindTheme.mappings` — config is SSOT.

The `tailwindTheme.mappings` in `tokens.cfg.ts` must be updated: flatten the
nested `semantic` key so Tier 2 groups (`surface`, `border`, `depth`) are at root.

**Update `tokens.cfg.ts` mappings** — remove `semantic` nesting:

```typescript
// BEFORE (nested under semantic):
semantic: {
  surface: { namespace: "color", prefix: "surface" },
  border:  { namespace: "color", prefix: "border" },
  depth:   { namespace: "shadow", prefix: "depth" },
}

// AFTER (flat — matches DTCG root structure):
surface: { namespace: "color",  prefix: "surface" },
border:  { namespace: "color",  prefix: "border"  },
depth:   { namespace: "shadow", prefix: "depth"   },
```

Format logic uses `token.path[0]` to look up the mapping:

```typescript
StyleDictionary.registerFormat({
  name: "coldlight/tailwind-theme",
  format: ({ dictionary }) => {
    const lines = ["@theme {"];
    dictionary.allTokens.forEach((token) => {
      const mapping = mappings[token.path[0]];
      if (!mapping) return;
      const suffix = token.path.slice(1).join("-");
      const key = mapping.prefix
        ? `--${mapping.namespace}-${mapping.prefix}-${suffix}`
        : `--${mapping.namespace}-${suffix}`;
      lines.push(`  ${key}: ${token.value};`);
    });
    lines.push("}");
    return lines.join("\n") + "\n";
  },
});
```

Writes to: `packages/coldlight/tokens/tailwind.css` (new file — add to `tokens.cfg.ts`).

---

## Phase C: `formats/types.ts`

One job: register `coldlight/types`. TypeScript enum arrays.
Uses `jitiEnums` from preprocessor — EXCEPTION justified: arrays not DTCG-compatible.

```typescript
StyleDictionary.registerFormat({
  name: "coldlight/types",
  format: () => {
    // Uses jitiEnums (tokens.enums) — not dictionary.allTokens
    // enums: { accent, glow, surface, glassVariant, size, radius, blur,
    //          depth, bevel, tone, imprint, shellDepth, space, textSize, padding }
    ...
  }
});
```

Writes to: `packages/coldlight/tokens/types.ts` (unchanged path).

---

## Phase D: `formats/tailwind-preset.ts`

One job: register `coldlight/tailwind-preset`. TW v3 compat. Uses `dictionary.allTokens`.

Replaces the current format that reads raw `tokens.color`, `tokens.space` etc.
Filter by `token.path[0]` to build `colors`, `spacing`, `borderRadius` etc.

Writes to: `packages/coldlight/tokens/tailwind.preset.ts` (unchanged path).

---

## Phase E: `config.ts`

One job: import and register all formats. Return the SD5 config object.

```typescript
import StyleDictionary from "style-dictionary";
import { registerTailwindTheme } from "./formats/tailwind-theme.js";
import { registerTypes }         from "./formats/types.js";
import { registerTailwindPreset } from "./formats/tailwind-preset.js";

export function buildConfig(dtcgPath, tokensConfig, jitiEnums) {
  registerTailwindTheme(tokensConfig);
  registerTypes(jitiEnums);
  registerTailwindPreset();

  return {
    source: [dtcgPath],
    platforms: {
      // SD5 native — name/kebab + css/variables → :root { }
      css: {
        transformGroup: "css",
        buildPath: "",
        files: [{
          destination: resolve(DESKTOP_ROOT, tokensConfig.platforms.css.output),
          format: "css/variables",
          options: { selector: ":root", outputReferences: false },
        }],
      },
      // Custom — @theme { } for Tailwind v4
      tailwindCss: {
        transformGroup: "css",
        buildPath: "",
        files: [{
          destination: resolve(DESKTOP_ROOT, tokensConfig.platforms.tailwindCss.output),
          format: "coldlight/tailwind-theme",
        }],
      },
      // Custom — TypeScript enum arrays
      ts: {
        buildPath: "",
        files: [{
          destination: resolve(DESKTOP_ROOT, tokensConfig.platforms.ts.output),
          format: "coldlight/types",
        }],
      },
      // Custom — Tailwind v3 preset
      tailwind: {
        transformGroup: "css",
        buildPath: "",
        files: [{
          destination: resolve(DESKTOP_ROOT, tokensConfig.platforms.tailwind.output),
          format: "coldlight/tailwind-preset",
        }],
      },
    },
  };
}
```

---

## Phase F: `build.ts`

One job: orchestrate. Import preprocessor, import config, run SD5.

```typescript
/**
 * @file scripts/dev/design/sd/build.ts
 * Entry point: node scripts/dev/design/sd/build.ts
 */

import StyleDictionary from "style-dictionary";
import { buildDtcg }   from "./preprocessors/ts-to-dtcg.js";
import { buildConfig } from "./config.js";

const { dtcgPath, tokensConfig, jitiEnums } = await buildDtcg();
const config = buildConfig(dtcgPath, tokensConfig, jitiEnums);

const sd = new StyleDictionary(config);
await sd.buildAllPlatforms();

console.log(`[SD5] CSS:    ${tokensConfig.platforms.css.output}`);
console.log(`[SD5] Theme:  ${tokensConfig.platforms.tailwindCss.output}`);
console.log(`[SD5] TS:     ${tokensConfig.platforms.ts.output}`);
console.log(`[SD5] TW:     ${tokensConfig.platforms.tailwind.output}`);
console.log(`[SD5] DTCG:   ${tokensConfig.dtcg.output}`);
```

---

## Phase G: Update `tokens.cfg.ts`

Two changes:

**1. Add `tailwindCss` platform:**
```typescript
tailwindCss: {
  enabled: true,
  output: "packages/coldlight/tokens/tailwind.css",
},
```

**2. Flatten `tailwindTheme.mappings` — remove `semantic` nesting:**
```typescript
// Remove the nested semantic object. Add these at root:
surface: { namespace: "color",  prefix: "surface" },
border:  { namespace: "color",  prefix: "border"  },
depth:   { namespace: "shadow", prefix: "depth"   },
// Delete: semantic: { surface: ..., border: ..., depth: ... }
```

---

## Phase H: Update `package.json`

```json
"ds:tokens:build": "node scripts/dev/design/sd/build.ts",
"ds:tokens:watch": "node --watch scripts/dev/design/sd/build.ts",
```

---

## Phase I: Update `index.css`

Add the missing token imports (currently commented with no actual `@import`):

```css
/* 1. Tokens */
@import "./tokens/tokens.css";
@import "./tokens/tailwind.css";
```

---

## Phase J: Delete `ds-tokens-build.ts`

Delete: `scripts/dev/design/ds-tokens-build.ts`

---

## Phase K: Run and Verify

```bash
pnpm ds:tokens:build
```

Expected:
```
[SD5] CSS:    packages/coldlight/tokens/tokens.css
[SD5] Theme:  packages/coldlight/tokens/tailwind.css
[SD5] TS:     packages/coldlight/tokens/types.ts
[SD5] TW:     packages/coldlight/tokens/tailwind.preset.ts
[SD5] DTCG:   packages/coldlight/tokens/tokens.json
```

Verify `tokens.css` contains:
```css
:root {
  --hue-teal: 180;
  --color-teal-50: oklch(0.97 0.02 180);
  --glass-void: oklch(0.08 0.005 250 / 0.85);
  --surface-primary: var(--glass-void);
  --button-bg: var(--surface-primary);
  ...
}
```

Verify `tailwind.css` contains:
```css
@theme {
  --color-glass-void: oklch(0.08 0.005 250 / 0.85);
  --color-teal-50: oklch(0.97 0.02 180);
  --spacing-4: 1rem;
  --radius-md: 0.5rem;
  ...
}
```

---

## Acceptance Criteria

| Criteria | Verified By |
|---|---|
| `ds-tokens-build.ts` deleted | File does not exist |
| `sd/build.ts` is entry point | `package.json` `ds:tokens:build` points to it |
| SD5 native `css/variables` used | `config.ts` uses `transformGroup: "css"` |
| `dictionary.allTokens` used in all custom formats | No raw TS imports in format files (except `types.ts` enums) |
| `:root` block in `tokens.css` with correct var names | `--surface-primary`, `--button-bg`, `--color-teal-50` |
| `@theme` block in `tailwind.css` | File exists, contains `@theme { }` |
| `index.css` imports both files | Both `@import` lines present |
| `pnpm check` — zero errors | TypeScript clean |
| Zero SD5 warnings | Clean build output |

---

## Out of Scope

- Changing token names or adding new tokens
- Vite HMR plugin for token watch
- Removing `tailwind.preset.ts` output
