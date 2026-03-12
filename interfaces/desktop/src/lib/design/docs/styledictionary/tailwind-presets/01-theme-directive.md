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
  --color-primary: var(--cl-color-action-primary);
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
  --color-surface-primary: var(--cl-color-surface-primary);
  --color-surface-secondary: var(--cl-color-surface-secondary);
  --color-surface-tertiary: var(--cl-color-surface-tertiary);
  --color-surface-elevated: var(--cl-color-surface-elevated);
  --color-surface-inverse: var(--cl-color-surface-inverse);

  --color-action-primary: var(--cl-color-action-primary);
  --color-action-primary-hover: var(--cl-color-action-primary-hover);
  --color-action-secondary: var(--cl-color-action-secondary);
  --color-action-danger: var(--cl-color-action-danger);

  --color-text-primary: var(--cl-color-text-primary);
  --color-text-secondary: var(--cl-color-text-secondary);
  --color-text-disabled: var(--cl-color-text-disabled);
  --color-text-inverse: var(--cl-color-text-inverse);
  --color-text-link: var(--cl-color-text-link);

  --color-border-default: var(--cl-color-border-default);
  --color-border-strong: var(--cl-color-border-strong);
  --color-border-focus: var(--cl-color-border-focus);
  --color-border-error: var(--cl-color-border-error);

  --color-status-success: var(--cl-color-status-success);
  --color-status-warning: var(--cl-color-status-warning);
  --color-status-error: var(--cl-color-status-error);
  --color-status-info: var(--cl-color-status-info);

  /* ── Spacing ── */
  --spacing-0: var(--cl-spacing-0);
  --spacing-px: var(--cl-spacing-px);
  --spacing-0-5: var(--cl-spacing-0-5);
  --spacing-1: var(--cl-spacing-1);
  --spacing-1-5: var(--cl-spacing-1-5);
  --spacing-2: var(--cl-spacing-2);
  --spacing-2-5: var(--cl-spacing-2-5);
  --spacing-3: var(--cl-spacing-3);
  --spacing-4: var(--cl-spacing-4);
  --spacing-5: var(--cl-spacing-5);
  --spacing-6: var(--cl-spacing-6);
  --spacing-8: var(--cl-spacing-8);
  --spacing-10: var(--cl-spacing-10);
  --spacing-12: var(--cl-spacing-12);
  --spacing-16: var(--cl-spacing-16);
  --spacing-20: var(--cl-spacing-20);
  --spacing-24: var(--cl-spacing-24);

  /* ── Typography ── */
  --font-family-sans: var(--cl-font-family-sans);
  --font-family-mono: var(--cl-font-family-mono);
  --font-size-xs: var(--cl-font-size-xs);
  --font-size-sm: var(--cl-font-size-sm);
  --font-size-md: var(--cl-font-size-md);
  --font-size-lg: var(--cl-font-size-lg);
  --font-size-xl: var(--cl-font-size-xl);
  --font-size-2xl: var(--cl-font-size-2xl);
  --font-size-3xl: var(--cl-font-size-3xl);
  --font-size-4xl: var(--cl-font-size-4xl);

  /* ── Border Radius ── */
  --radius-none: var(--cl-radius-none);
  --radius-sm: var(--cl-radius-sm);
  --radius-md: var(--cl-radius-md);
  --radius-lg: var(--cl-radius-lg);
  --radius-xl: var(--cl-radius-xl);
  --radius-2xl: var(--cl-radius-2xl);
  --radius-full: var(--cl-radius-full);

  /* ── Shadows ── */
  --shadow-none: var(--cl-shadow-none);
  --shadow-sm: var(--cl-shadow-sm);
  --shadow-md: var(--cl-shadow-md);
  --shadow-lg: var(--cl-shadow-lg);
  --shadow-xl: var(--cl-shadow-xl);

  /* ── Motion ── */
  --ease-default: var(--cl-easing-default);
  --ease-in: var(--cl-easing-in);
  --ease-out: var(--cl-easing-out);
  --ease-in-out: var(--cl-easing-in-out);
  --ease-bounce: var(--cl-easing-bounce);
}
```
