# Tailwind CSS v4 — CSS-First Configuration

> Tailwind v4 replaces `tailwind.config.js` with CSS-first configuration using new directives.
> This is the reference for integrating Style Dictionary v5 token output with TW4.

## Table of Contents

- [00-tw4-overview.md](./00-tw4-overview.md) — This file. Architecture, directives
- [01-theme-directive.md](./01-theme-directive.md) — @theme deep dive
- [02-sd5-to-tw4-pipeline.md](./02-sd5-to-tw4-pipeline.md) — Token pipeline integration
- [03-dark-mode-tokens.md](./03-dark-mode-tokens.md) — Dark mode strategies with design tokens

---

## Architecture Change: v3 → v4

```
v3: tailwind.config.js (JavaScript)  →  PostCSS plugin reads config
v4: CSS directives (@theme, @source)  →  Oxide engine reads CSS directly
```

**Key shift:** Configuration is now CSS, not JavaScript. Themes are defined inline using CSS custom properties and the `@theme` directive.

## Core Directives

### `@import "tailwindcss"`

The single import that loads Tailwind's base, components, and utilities:

```css
@import "tailwindcss";
```

This replaces `@tailwind base; @tailwind components; @tailwind utilities;` from v3.

### `@theme`

Defines design tokens (theme values) directly in CSS:

```css
@theme {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
  --spacing-lg: 2rem;
  --font-family-sans: "Inter", system-ui, sans-serif;
}
```

Variables defined in `@theme` become available as Tailwind utilities: `bg-primary`, `text-secondary`, `p-lg`, `font-sans`.

### `@source`

Tells Tailwind where to scan for class usage:

```css
@source "../src/**/*.{tsx,jsx,svelte,html}";
@source "../packages/coldlight/src/**/*.tsx";
```

### `@plugin`

Loads JavaScript plugins:

```css
@plugin "@tailwindcss/typography";
@plugin "@tailwindcss/forms";
@plugin "./plugins/coldlight.js";
```

### `@utility`

Defines custom utilities:

```css
@utility scrollbar-hidden {
  scrollbar-width: none;
  &::-webkit-scrollbar {
    display: none;
  }
}
```

Usage: `class="scrollbar-hidden"`

### `@variant`

Defines custom variants:

```css
@variant dark (&:where([data-theme="dark"], [data-theme="dark"] *));
@variant pointer-coarse (@media (pointer: coarse));
```

Usage: `class="dark:bg-gray-900 pointer-coarse:p-4"`

---

## @theme Deep Dive

### Namespace Mapping

Tailwind v4 maps CSS variable names to utility namespaces:

| CSS Variable Pattern | Utility Class | Example |
|---|---|---|
| `--color-*` | `bg-*`, `text-*`, `border-*`, etc. | `--color-brand` → `bg-brand` |
| `--spacing-*` | `p-*`, `m-*`, `gap-*`, `w-*`, `h-*` | `--spacing-4` → `p-4` |
| `--font-family-*` | `font-*` | `--font-family-mono` → `font-mono` |
| `--font-size-*` | `text-*` | `--font-size-lg` → `text-lg` |
| `--font-weight-*` | `font-*` | `--font-weight-bold` → `font-bold` |
| `--line-height-*` | `leading-*` | `--line-height-tight` → `leading-tight` |
| `--letter-spacing-*` | `tracking-*` | `--letter-spacing-wide` → `tracking-wide` |
| `--radius-*` | `rounded-*` | `--radius-lg` → `rounded-lg` |
| `--shadow-*` | `shadow-*` | `--shadow-md` → `shadow-md` |
| `--width-*` | `w-*` | `--width-screen` → `w-screen` |
| `--breakpoint-*` | Responsive prefixes | `--breakpoint-md` → `md:` |
| `--animate-*` | `animate-*` | `--animate-spin` → `animate-spin` |
| `--inset-shadow-*` | `inset-shadow-*` | Inset shadow utilities |
| `--drop-shadow-*` | `drop-shadow-*` | Drop shadow utilities |
| `--ease-*` | `ease-*` | Easing utilities |

### @theme inline vs reference

```css
/* inline: Defines new values, replaces defaults for this namespace */
@theme inline {
  --color-primary: #3b82f6;
  --color-secondary: #64748b;
}

/* reference: Uses values from an imported stylesheet without generating utilities */
@theme reference {
  --color-primary: var(--color-action-primary);
}

/* default: Extends (doesn't replace) the default theme */
@theme {
  --color-brand: #3b82f6;  /* Added alongside default colors */
}
```

**Critical distinction:**
- `@theme` — extends defaults (your values + Tailwind defaults)
- `@theme inline` — replaces the entire namespace (ONLY your values)
- `@theme reference` — declares values exist but doesn't create utilities

### Importing External CSS as Theme

```css
/* Import SD5 output as theme values */
@import "./tokens.css" theme(reference);
/* or */
@import "./tailwind-theme.css";
```

---

## Variable Naming Convention

Tailwind v4 variable names follow a strict pattern:

```
--{namespace}-{name}
```

Where `namespace` determines which utilities are generated:

```css
@theme {
  /* Colors → bg-*, text-*, border-*, ring-*, etc. */
  --color-surface-primary: #ffffff;
  --color-action-primary: #2563eb;

  /* Spacing → p-*, m-*, gap-*, w-*, h-*, etc. */
  --spacing-0-5: 0.125rem;
  --spacing-1: 0.25rem;

  /* Font families → font-* */
  --font-family-sans: "Inter", system-ui, sans-serif;
  --font-family-mono: "JetBrains Mono", monospace;

  /* Font sizes → text-* */
  --font-size-xs: 0.75rem;
  --font-size-sm: 0.875rem;

  /* Border radius → rounded-* */
  --radius-sm: 0.125rem;
  --radius-md: 0.375rem;

  /* Shadows → shadow-* */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
}
```

---

## CSS Custom Properties Integration

TW4 can consume CSS custom properties from any source:

```css
/* 1. Import SD5 tokens */
@import "../packages/coldlight/dist/tokens.css";

/* 2. Reference them in @theme */
@theme {
  --color-primary: var(--color-action-primary);
  --color-surface: var(--color-surface-primary);
  --spacing-sm: var(--spacing-2);
  --radius-md: var(--radius-md);
}
```

Or, if SD5 outputs directly to the TW4 namespace (using `@theme` selector in SD5):

```css
/* SD5 outputs tailwind-theme.css with @theme selector */
@import "../packages/coldlight/dist/tailwind-theme.css";
/* All --color-*, --spacing-*, etc. are now available as utilities */
```
