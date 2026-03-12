# Melt UI — Headless Components for Svelte

> Headless, accessible component builders for Svelte.
> Each builder returns element objects (with actions, props, state) that you spread onto your markup.
> https://melt-ui.com

## Table of Contents

- [00-overview.md](./00-overview.md) — Architecture, builder pattern, installation
- [01-builder-api.md](./01-builder-api.md) — Core builder pattern and common APIs
- [02-component-catalog.md](./02-component-catalog.md) — All builders with full API
- [03-svelte5-runes.md](./03-svelte5-runes.md) — Svelte 5 rune integration patterns

---

## What Is Melt UI?

Melt UI provides **builder functions** that return:
1. **Element objects** — Spread onto DOM elements (like `use:melt={trigger}`)
2. **State stores** — Reactive values (`$open`, `$value`, `$selected`)
3. **Helper functions** — Utilities for the component

**You provide:** The markup, styling, animations
**Melt provides:** Behavior, accessibility, state management, keyboard navigation

## Installation

```bash
npm install @melt-ui/svelte
# or
pnpm add @melt-ui/svelte
```

Optional preprocessor (quality of life):
```bash
npm install -D @melt-ui/pp
```

## Builder Pattern

Every Melt UI component follows the same pattern:

```svelte
<script>
  import { createDialog } from "@melt-ui/svelte";

  // 1. Create the builder
  const {
    elements: { trigger, overlay, content, title, description, close },
    states: { open },
  } = createDialog();
</script>

<!-- 2. Spread element objects onto DOM -->
<button use:melt={$trigger}>Open Dialog</button>

{#if $open}
  <div use:melt={$overlay} />
  <div use:melt={$content}>
    <h2 use:melt={$title}>Dialog Title</h2>
    <p use:melt={$description}>Description</p>
    <button use:melt={$close}>Close</button>
  </div>
{/if}
```

### Builder Return Shape

Every `create*` function returns:

```typescript
{
  elements: {
    // Svelte stores containing element attributes/actions
    trigger: Writable<MeltElement>,
    content: Writable<MeltElement>,
    // ... component-specific parts
  },
  states: {
    // Svelte stores containing reactive state
    open: Writable<boolean>,
    value: Writable<string>,
    // ... component-specific state
  },
  helpers: {
    // Utility functions
    isSelected: (value: string) => boolean,
    // ... component-specific helpers
  },
  options: {
    // The original options, reactive
  },
}
```

### Element Spreading

Use the `melt` action or spread directly:

```svelte
<!-- Option 1: melt action (recommended) -->
<button use:melt={$trigger}>Click</button>

<!-- Option 2: Spread attributes (works without preprocessor) -->
<button {...$trigger}>Click</button>
```

The `melt` action applies:
- HTML attributes (`role`, `aria-*`, `id`, `tabindex`)
- Event listeners (`click`, `keydown`, `focus`, `blur`)
- Svelte actions (focus trap, click outside, etc.)
- Data attributes (`data-state`, `data-melt-*`)

### Preprocessor

The `@melt-ui/pp` preprocessor adds syntactic sugar:

```svelte
<!-- Without preprocessor -->
<button use:melt={$trigger}>Click</button>

<!-- With preprocessor -->
<button melt={trigger}>Click</button>
```

Setup in `svelte.config.js`:
```javascript
import { preprocessMeltUI } from "@melt-ui/pp";
import sequence from "svelte-sequential-preprocessor";

export default {
  preprocess: sequence([/* other preprocessors */, preprocessMeltUI()]),
};
```

## Common Options

Most builders accept these common options:

```typescript
createDialog({
  // Controlled state
  open?: Writable<boolean>,         // External store for open state
  defaultOpen?: boolean,            // Initial open state
  onOpenChange?: (open: boolean) => void,

  // Behavior
  preventScroll?: boolean,          // Lock body scroll when open
  closeOnOutsideClick?: boolean,    // Close on click outside
  closeOnEscape?: boolean,          // Close on Escape key
  portal?: string | HTMLElement,    // Portal destination

  // Accessibility
  forceVisible?: boolean,           // Keep in DOM when closed (for animations)
  role?: "dialog" | "alertdialog",
});
```

## Controlled vs Uncontrolled

### Uncontrolled (default)
Melt manages state internally:
```svelte
<script>
  const { elements, states: { open } } = createDialog();
  // $open is managed by Melt
</script>
```

### Controlled
You provide an external store:
```svelte
<script>
  import { writable } from "svelte/store";

  const myOpen = writable(false);

  const { elements } = createDialog({
    open: myOpen,  // Melt syncs with your store
  });

  // Now you can control it externally
  function openDialog() {
    $myOpen = true;
  }
</script>
```

## Transitions & Animations

Melt works with Svelte's built-in transitions:

```svelte
{#if $open}
  <div use:melt={$overlay} transition:fade={{ duration: 150 }} />
  <div use:melt={$content} transition:fly={{ y: 10, duration: 200 }}>
    {/* content */}
  </div>
{/if}
```

For exit animations, use `forceVisible`:
```svelte
<script>
  const { elements, states: { open } } = createDialog({
    forceVisible: true,  // Keeps in DOM for exit animations
  });
</script>

<!-- Always in DOM, use data-state for CSS animations -->
<div use:melt={$content} class="dialog-content">
  <!-- data-state="open" or data-state="closed" -->
</div>

<style>
  .dialog-content[data-state="open"] {
    animation: fade-in 200ms ease;
  }
  .dialog-content[data-state="closed"] {
    animation: fade-out 150ms ease;
  }
</style>
```

## Data Attributes

Melt sets data attributes for styling:

```css
/* States */
[data-state="open"] { }
[data-state="closed"] { }
[data-state="checked"] { }
[data-state="unchecked"] { }
[data-state="indeterminate"] { }
[data-state="active"] { }
[data-state="inactive"] { }

/* Conditions */
[data-disabled] { }
[data-highlighted] { }
[data-selected] { }
[data-orientation="horizontal"] { }
[data-orientation="vertical"] { }

/* Component identification */
[data-melt-dialog-trigger] { }
[data-melt-dialog-content] { }
```
