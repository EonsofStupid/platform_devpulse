# Tailwind v4 — @theme Directive Deep Dive

## @theme Modes

### Default Mode (Extend)

Adds values alongside Tailwind's built-in defaults:

```css
@theme {
  --color-brand: #3b82f6;
  /* Tailwind's default colors (slate, gray, zinc, red, etc.) STILL exist */
  /* Your 'brand' color is ADDED to them */
}
```

### Inline Mode (Replace)

Replaces ALL default values for matched namespaces:

```css
@theme inline {
  --color-surface-primary: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-action-primary: #2563eb;
  --color-text-primary: #0f172a;
  /* Tailwind's default colors are REMOVED */
  /* Only YOUR colors exist now */
}
```

**Use `inline` when:**
- You want full control over the design system (ColdLight's approach)
- You don't want Tailwind's default 22 color palettes
- Your tokens are the complete set

### Reference Mode

Declares that variables exist (for type-checking) without creating utilities:

```css
@theme reference {
  --color-*: initial;
  /* Tells Tailwind that --color-* vars exist */
  /* But doesn't create bg-*, text-*, etc. utilities for them */
}
```

## Namespace Wildcards

You can reset or reference entire namespaces:

```css
@theme {
  /* Remove ALL default colors, then add yours */
  --color-*: initial;
  --color-brand: #3b82f6;
  --color-surface: #ffffff;

  /* Remove ALL default spacing, then add yours */
  --spacing-*: initial;
  --spacing-1: 0.25rem;
  --spacing-2: 0.5rem;
}
```

`initial` removes the default values for that namespace.

## Multi-Value Properties

Some utilities need complex values:

```css
@theme {
  /* Shadows are full CSS shadow values */
  --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
  --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);

  /* Font families can be comma-separated */
  --font-family-sans: "Inter", ui-sans-serif, system-ui, sans-serif;

  /* Animations reference @keyframes */
  --animate-spin: spin 1s linear infinite;
}
```

## Nested Naming

TW4 uses flat `--namespace-name` format, but you can use hyphens for hierarchy:

```css
@theme {
  /* These create bg-surface-primary, text-action-primary, etc. */
  --color-surface-primary: #ffffff;
  --color-surface-secondary: #f8fafc;
  --color-action-primary: #2563eb;
  --color-action-primary-hover: #1d4ed8;
  --color-text-primary: #0f172a;
  --color-text-secondary: #475569;
  --color-border-default: #e2e8f0;
}
```

Usage:
```html
<div class="bg-surface-primary text-text-primary border-border-default">
  <button class="bg-action-primary hover:bg-action-primary-hover">
    Click
  </button>
</div>
```

## @theme with @import

You can import a CSS file and declare it as theme:

```css
/* Approach 1: Import with theme() function */
@import "./tokens.css" theme(reference);

/* Approach 2: Import then override in @theme */
@import "./tokens.css";
@theme {
  --color-primary: var(--color-action-primary);
}

/* Approach 3: SD5 outputs directly to @theme (ColdLight approach) */
@import "./tailwind-theme.css";
```

## Breakpoint Configuration

```css
@theme {
  --breakpoint-sm: 40rem;    /* 640px */
  --breakpoint-md: 48rem;    /* 768px */
  --breakpoint-lg: 64rem;    /* 1024px */
  --breakpoint-xl: 80rem;    /* 1280px */
  --breakpoint-2xl: 96rem;   /* 1536px */
}
```

Usage: `md:flex lg:grid xl:gap-8`

## Container Query Breakpoints

```css
@theme {
  --container-3xs: 16rem;
  --container-2xs: 18rem;
  --container-xs: 20rem;
  --container-sm: 24rem;
  --container-md: 28rem;
  --container-lg: 32rem;
}
```

## Animation & Keyframes

```css
@theme {
  --animate-fade-in: fade-in 0.3s ease-out;
  --animate-slide-up: slide-up 0.2s ease-out;
}

@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes slide-up {
  from { transform: translateY(0.5rem); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

Usage: `class="animate-fade-in"` or `class="animate-slide-up"`

## Easing

```css
@theme {
  --ease-default: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-in: cubic-bezier(0.4, 0, 1, 1);
  --ease-out: cubic-bezier(0, 0, 0.2, 1);
  --ease-in-out: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-bounce: cubic-bezier(0.34, 1.56, 0.64, 1);
}
```

Usage: `class="transition ease-bounce duration-300"`

## Z-Index

```css
@theme {
  --z-dropdown: 1000;
  --z-sticky: 1020;
  --z-fixed: 1030;
  --z-modal-backdrop: 1040;
  --z-modal: 1050;
  --z-popover: 1060;
  --z-tooltip: 1070;
}
```

## Complete ColdLight @theme Example

```css
@import "tailwindcss";
@import "../packages/coldlight/dist/tokens.css";

@theme inline {
  /* ── Colors (from SD5 tokens) ── */
  --color-surface-primary: var(--color-surface-primary);
  --color-surface-secondary: var(--color-surface-secondary);
  --color-surface-tertiary: var(--color-surface-tertiary);
  --color-surface-elevated: var(--color-surface-elevated);
  --color-surface-inverse: var(--color-surface-inverse);

  --color-action-primary: var(--color-action-primary);
  --color-action-primary-hover: var(--color-action-primary-hover);
  --color-action-secondary: var(--color-action-secondary);
  --color-action-danger: var(--color-action-danger);

  --color-text-primary: var(--color-text-primary);
  --color-text-secondary: var(--color-text-secondary);
  --color-text-disabled: var(--color-text-disabled);
  --color-text-inverse: var(--color-text-inverse);
  --color-text-link: var(--color-text-link);

  --color-border-default: var(--color-border-default);
  --color-border-strong: var(--color-border-strong);
  --color-border-focus: var(--color-border-focus);
  --color-border-error: var(--color-border-error);

  --color-status-success: var(--color-status-success);
  --color-status-warning: var(--color-status-warning);
  --color-status-error: var(--color-status-error);
  --color-status-info: var(--color-status-info);

  /* ── Spacing ── */
  --spacing-0: var(--spacing-0);
  --spacing-px: var(--spacing-px);
  --spacing-0-5: var(--spacing-0-5);
  --spacing-1: var(--spacing-1);
  --spacing-1-5: var(--spacing-1-5);
  --spacing-2: var(--spacing-2);
  --spacing-2-5: var(--spacing-2-5);
  --spacing-3: var(--spacing-3);
  --spacing-4: var(--spacing-4);
  --spacing-5: var(--spacing-5);
  --spacing-6: var(--spacing-6);
  --spacing-8: var(--spacing-8);
  --spacing-10: var(--spacing-10);
  --spacing-12: var(--spacing-12);
  --spacing-16: var(--spacing-16);
  --spacing-20: var(--spacing-20);
  --spacing-24: var(--spacing-24);

  /* ── Typography ── */
  --font-family-sans: var(--font-family-sans);
  --font-family-mono: var(--font-family-mono);
  --font-size-xs: var(--font-size-xs);
  --font-size-sm: var(--font-size-sm);
  --font-size-md: var(--font-size-md);
  --font-size-lg: var(--font-size-lg);
  --font-size-xl: var(--font-size-xl);
  --font-size-2xl: var(--font-size-2xl);
  --font-size-3xl: var(--font-size-3xl);
  --font-size-4xl: var(--font-size-4xl);

  /* ── Border Radius ── */
  --radius-none: var(--radius-none);
  --radius-sm: var(--radius-sm);
  --radius-md: var(--radius-md);
  --radius-lg: var(--radius-lg);
  --radius-xl: var(--radius-xl);
  --radius-2xl: var(--radius-2xl);
  --radius-full: var(--radius-full);

  /* ── Shadows ── */
  --shadow-none: var(--shadow-none);
  --shadow-sm: var(--shadow-sm);
  --shadow-md: var(--shadow-md);
  --shadow-lg: var(--shadow-lg);
  --shadow-xl: var(--shadow-xl);

  /* ── Motion ── */
  --ease-default: var(--easing-default);
  --ease-in: var(--easing-in);
  --ease-out: var(--easing-out);
  --ease-in-out: var(--easing-in-out);
  --ease-bounce: var(--easing-bounce);
}
```
