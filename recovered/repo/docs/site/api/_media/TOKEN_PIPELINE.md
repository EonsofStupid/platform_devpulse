# ColdLight Token Pipeline

> How tokens flow from SSOT to generated outputs.

---

## Overview

The token pipeline converts a single TypeScript SSOT (`tokens.ts`) into three output formats via a build script.

```
tokens.ts (SSOT) --> ds-tokens-build.ts --> tokens.css, types.ts, tailwind.preset.ts
```

**Command**: `pnpm ds:tokens:build`

---

## File Structure

```
src/lib/design/tokens/
├── tokens.ts              # SSOT (hand-authored)
├── tokens.css             # GENERATED — CSS custom properties
├── types.ts               # GENERATED — TS types + enum arrays
└── tailwind.preset.ts     # GENERATED — Tailwind theme extension

scripts/dev/design/
└── ds-tokens-build.ts     # Build script (reads tokens.ts, writes 3 files)
```

---

## tokens.ts Structure (SSOT)

Each token category is a named `const` export with `as const`:

```typescript
export const hue = {
  teal: "180",
  purple: "280",
  // ...
} as const;

export const color = {
  teal: {
    50: "oklch(0.97 0.02 180)",
    100: "oklch(0.92 0.04 180)",
    // ... 50 through 900
  },
  // ... per accent
} as const;

export const glass = { ... } as const;
export const matte = { ... } as const;
export const text = { ... } as const;
export const space = { ... } as const;
export const radius = { ... } as const;
export const blur = { ... } as const;
export const glow = { ... } as const;
export const shadow = { ... } as const;
export const bevel = { ... } as const;
export const z = { ... } as const;
export const duration = { ... } as const;
export const ease = { ... } as const;
export const textSize = { ... } as const;
export const padding = { ... } as const;

// Enum arrays for types.ts generator
export const enums = {
  accent: ["teal", "purple", "magenta", "ember", "frost"] as const,
  // ...
} as const;
```

---

## Build Script (`ds-tokens-build.ts`)

The script dynamically imports `tokens.ts` and generates three files:

### 1. `tokens.css` — CSS Custom Properties

```css
:root {
  /* Hues */
  --hue-teal: 180;

  /* Colors */
  --color-teal-50: oklch(0.97 0.02 180);
  --color-teal-100: oklch(0.92 0.04 180);
  /* ... */

  /* Glass */
  --glass-void: oklch(0.08 0.005 250 / 0.85);
  /* ... */
}
```

Naming: `--{category}-{name}`. Nested objects (color scales) produce `--{category}-{group}-{key}`.

### 2. `types.ts` — TypeScript Types + Runtime Arrays

```typescript
export const AccentTokens = ["teal","purple","magenta","ember","frost"] as const;
export type AccentToken = (typeof AccentTokens)[number];

// ... one pair per enums entry

export const TokenArrays = {
  accent: AccentTokens,
  // ...
} as const;
```

### 3. `tailwind.preset.ts` — Tailwind Theme Extension

```typescript
export const coldlightPreset = {
  theme: {
    extend: {
      colors: {
        "teal": {
          50: "var(--color-teal-50)",
          // ...
        },
      },
      spacing: { "1": "var(--space-1)", /* ... */ },
      borderRadius: { "sm": "var(--radius-sm)", /* ... */ },
      boxShadow: { "glow-teal": "var(--glow-teal)", /* ... */ },
      zIndex: { "base": "var(--z-base)", /* ... */ },
    },
  },
};
```

Values reference CSS vars so Tailwind classes resolve through the token layer.

---

## npm Scripts

```json
{
  "ds:tokens:build": "pnpm tsx scripts/dev/design/ds-tokens-build.ts"
}
```

---

## Adding a New Token Category

1. Add the `export const` to `tokens.ts`
2. Add an `addSection()` call in `generateCss()` in `ds-tokens-build.ts`
3. If the category needs Tailwind mapping, add it to `generateTailwindPreset()`
4. If the category needs a TypeScript enum, add it to `enums` in `tokens.ts`
5. Run `pnpm ds:tokens:build`
6. Verify all three output files updated

---

## Core Truths

| Truth | Enforcement |
|-------|-------------|
| `tokens.ts` is SSOT | Never edit generated files |
| OKLCH is primary color format | All color values in oklch() |
| No prefix on CSS custom properties | Build script enforces naming |
| Three outputs only | CSS, types, Tailwind preset |

---

**This is the canonical token pipeline.**
