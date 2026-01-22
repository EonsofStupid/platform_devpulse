# Technical Due Diligence: Bits UI & Cold Light System
## Implementation-Grade Technical Specification

**Date**: January 21, 2026  
**Status**: Final  
**Document Type**: Technical Architecture & Integration Spec  

---

## EXECUTIVE SUMMARY

This specification covers two key technologies for your platform architecture:

1. **Bits UI 2.4.1** – A Svelte 5-native headless component library providing accessible, unstyled primitives for building custom UI component systems.

2. **Cold Light System (clsls Framework v2.1.1)** – A minimal, classless CSS framework with token-based theming and native dark/light mode detection.

Both are production-ready and integrate cleanly with a thin-wrapper primitives architecture.

---

## PART A: BITS UI TECHNICAL SPECIFICATION

### A1. Official References

| Item | Link |
|------|------|
| **Official Docs** | https://bits-ui.com/docs [1] |
| **GitHub Repo** | https://github.com/huntabyte/bits-ui [2] |
| **NPM Package** | https://www.npmjs.com/package/bits-ui [3] |
| **Community** | Discord (linked in GitHub) |
| **License** | MIT |

### A2. Version & Release Information

| Property | Value |
|----------|-------|
| **Current Stable** | 2.4.1 [4] |
| **Release Date** | June 1, 2025 |
| **Svelte Requirement** | ^5.33.0 [5] |
| **SvelteKit** | Not required; framework-agnostic |
| **Breaking Changes** | v2.1.0+ is Svelte 5 only (complete rewrite from v0.x) [5] |
| **Previous Versions** | 2.4.0, 2.3.1, 2.3.0, 2.2.1, 2.2.0, 2.1.0 [4] |

### A3. Installation & Setup

```bash
# Base installation
npm install bits-ui

# For date/time components (required for Calendar, DatePicker, etc.)
npm install bits-ui @internationalized/date

# Verify peer dependencies
npm ls bits-ui
```

**Peer Dependency Notes**: 
- `@internationalized/date` became required in v2.1.0 [5]
- Must be explicitly installed; not auto-fetched [6]
- Provides immutable date/time objects with international calendar support

### A4. Component Inventory (Complete List)

#### A4.1 Interaction Primitives
| Component | Purpose | Key Props | Data Attributes |
|-----------|---------|-----------|-----------------|
| **Accordion** [7] | Collapsible sections | `type: "single" \| "multiple"`, `value`, `onValueChange` | `data-state`, `data-orientation`, `data-disabled` |
| **Checkbox** | Binary toggle | `checked`, `onCheckedChange`, `disabled`, `required` | `data-state`, `data-disabled` |
| **Collapsible** [8] | Show/hide content | `open`, `onOpenChange` | `data-state`, `data-disabled` |
| **Dialog** [9] | Modal dialog | `open`, `onOpenChange`, `trapFocus` | `data-state`, `data-nested`, `data-nested-open` |
| **RadioGroup** [10] | Mutually exclusive options | `value`, `onValueChange`, `orientation` | `data-state`, `data-orientation`, `data-disabled`, `data-readonly` |
| **Select** [11] | Dropdown list selection | `value`, `onValueChange`, `multiple` | `data-state`, `data-disabled` |
| **Switch** [12] | On/off toggle | `checked`, `onCheckedChange`, `disabled` | `data-state`, `data-disabled`, `data-checked` |
| **Tabs** [13] | Tab interface | `value`, `onValueChange`, `activationMode` | `data-state`, `data-orientation` |
| **Tooltip** [14] | Hover information | `open`, `onOpenChange`, `side`, `align` | `data-state` |

#### A4.2 Menu & Navigation Primitives
| Component | Purpose | Keyboard |
|-----------|---------|----------|
| **Command/Combobox** [15] | Searchable list/menu | ArrowUp/Down: navigate; Enter: select; Escape: close |
| **ContextMenu** [16] | Right-click menu | ArrowUp/Down: navigate; Escape: close |
| **DropdownMenu** | Click-triggered menu | ArrowUp/Down: navigate; Escape: close |
| **Menubar** [17] | Menu bar (e.g., File/Edit) | ArrowLeft/Right: navigate menus; Escape: close |
| **NavigationMenu** [18] | Hierarchical navigation | ArrowUp/Down/Left/Right: navigate; Escape: close |
| **Popover** [19] | Floating content box | Escape: close (configurable) |

#### A4.3 Date/Time Primitives
| Component | Use Case | Peer Dependency |
|-----------|----------|-----------------|
| **Calendar** | Standalone month picker | @internationalized/date [20] |
| **DateField** | Segmented date input | @internationalized/date |
| **DatePicker** [21] | Field + calendar popup | @internationalized/date |
| **DateRangeField** [22] | Start/end date input | @internationalized/date |
| **DateRangePicker** [23] | Field + calendar range | @internationalized/date |
| **TimeField** | Segmented time input | @internationalized/date |
| **TimeRangeField** [24] | Start/end time input | @internationalized/date |

#### A4.4 Data Input Primitives
| Component | Purpose | Notes |
|-----------|---------|-------|
| **Slider** | Numeric range input | Supports `steps`, `tickItems`, `thumbItems`, `trackPadding` [v2.1.0 features] |
| **RatingGroup** | Star/rating selector | Unstable (unstable_RatingGroup); feedback welcomed |

#### A4.5 Layout Primitives
| Component | Purpose |
|-----------|---------|
| **AspectRatio** [25] | Maintains fixed aspect ratio |
| **Separator** [26] | Visual divider |

### A5. Styling Strategy

#### A5.1 Design Philosophy
- **Unstyled by default** – Only minimal styles required for functionality (e.g., positioning, z-index for dialogs) [1]
- **Zero CSS assumptions** – No design system colors, fonts, or spacing imposed
- **Class & data-attribute driven** – Use Bits UI's props and data attributes to apply your own styles [3]

#### A5.2 Styling Methods

**Method 1: Tailwind CSS / UnoCSS**
```svelte
<Dialog.Trigger class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
  Open Dialog
</Dialog.Trigger>
```

**Method 2: Data Attributes**
```css
/* Global stylesheet */
[data-dialog-trigger] {
  padding: 0.5rem 1rem;
  background-color: #3b82f6;
  color: white;
  border-radius: 0.375rem;
}

[data-dialog-trigger]:hover {
  background-color: #2563eb;
}

[data-dialog-content][data-state="open"] {
  animation: fadeIn 200ms ease-out;
}
```

**Method 3: Scoped Svelte Styles + Snippets**
```svelte
<script>
  import { Dialog } from "bits-ui";
  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger>
    {#snippet child({ props })}
      <button {...props} class="trigger-btn">Open</button>
    {/snippet}
  </Dialog.Trigger>
</Dialog.Root>

<style>
  :global([data-dialog-trigger]) {
    padding: 0.5rem 1rem;
  }
</style>
```

#### A5.3 Available Data Attributes (per component)

All Bits UI components expose `data-*` attributes:

- `data-state` – "open" | "closed" | "checked" | "unchecked" | etc.
- `data-disabled` – Present when disabled
- `data-readonly` – Present when readonly
- `data-<component-name>` – Identifies the component (e.g., `data-dialog-trigger`)
- Component-specific: `data-orientation`, `data-nested`, `data-nested-count`, etc. [9]

#### A5.4 CSS Variables for Advanced Styling

Dialogs expose CSS variables:
- `--bits-dialog-depth` – Nesting level (0 = root, 1 = nested, etc.)
- `--bits-dialog-nested-count` – Number of nested dialogs currently open

Example:
```css
[data-dialog-content] {
  scale: calc(1 - var(--bits-dialog-depth) * 0.05); /* Dimming effect */
  opacity: calc(1 - var(--bits-dialog-depth) * 0.1);
}
```

### A6. Accessibility Model

#### A6.1 Built-In Features
- **WAI-ARIA compliance** – All components follow ARIA design patterns [1]
- **Keyboard navigation by default** – Tab, arrow keys, Enter, Escape all configured per component [1]
- **Focus management** – Automatic focus trapping, restoration, and movement
- **Screen reader support** – Proper ARIA roles, labels, live regions [1]

#### A6.2 Keyboard Navigation Per Component

| Component | Keys | Behavior |
|-----------|------|----------|
| **Dialog** | Tab | Navigate within dialog content; Escape closes (configurable) |
| **Select/Combobox** | ArrowDown/Up | Navigate options; Enter to select; Escape to close |
| **RadioGroup** | Arrow keys (vertical: Up/Down; horizontal: Left/Right) | Navigate items; Space to select |
| **Checkbox** | Space | Toggle checked state |
| **Tabs** | ArrowLeft/Right | Navigate between tabs; Enter/Space to activate |
| **Menu** | ArrowUp/Down | Navigate items; Enter to select; Escape to close |
| **Slider** | ArrowLeft/Right/Up/Down | Adjust value; Home/End for min/max |

#### A6.3 Focus Management (Critical for Primitives)

**Dialog Focus Trap**:
```svelte
<Dialog.Root open={true}>
  <Dialog.Content
    trapFocus={true}
    onOpenAutoFocus={(e) => e.preventDefault()} // Custom initial focus
    onCloseAutoFocus={(e) => e.preventDefault()} // Custom close focus
  >
    <!-- Content here -->
  </Dialog.Content>
</Dialog.Root>
```

**Accessible ref binding**:
```svelte
<script>
  let triggerRef = $state<HTMLButtonElement | null>(null);
  
  function focusTrigger() {
    triggerRef?.focus();
  }
</script>

<Dialog.Trigger bind:ref={triggerRef}>Trigger</Dialog.Trigger>
```

Bits UI uses **element IDs internally** for ref tracking, ensuring `child` snippet render delegation doesn't break refs [27].

#### A6.4 Your Wrapper Responsibility
- **Label association** – Add `<label for="...">` for form inputs
- **Error messaging** – Use `aria-describedby` to link error text to inputs
- **Semantic HTML** – Use proper heading levels, lists, etc. within Bits UI primitives
- **Color contrast** – Ensure your token system meets WCAG AA/AAA standards
- **Focus styling** – Provide visible `:focus` and `:focus-visible` CSS

### A7. State Management

#### A7.1 Controlled vs. Uncontrolled

**Uncontrolled (Recommended for simple cases)**:
```svelte
<script>
  import { Dialog } from "bits-ui";
  let open = $state(false);
</script>

<Dialog.Root bind:open>
  <!-- Component manages state; you read it -->
</Dialog.Root>
```

**Controlled (Full external control)**:
```svelte
<script>
  let open = $state(false);
</script>

<Dialog.Root
  open={open}
  onOpenChange={(newOpen) => { open = newOpen; }}
>
  <!-- You control the state entirely -->
</Dialog.Root>
```

**Function binding** (Advanced):
```svelte
<Dialog.Root open={() => open} onOpenChange={(fn) => { open = fn(open); }}>
  <!-- Provides full read/write control -->
</Dialog.Root>
```

#### A7.2 Event Callbacks

Common patterns:

| Event | Signature | Usage |
|-------|-----------|-------|
| `onOpenChange` | `(open: boolean) => void` | Triggered when state changes |
| `onOpenChangeComplete` | `(open: boolean) => void` | Triggered after animation completes |
| `onValueChange` | `(value: T) => void` | Triggered when value changes |
| `onEscapeKeydown` | `(event: KeyboardEvent) => void` | Override Escape key behavior |
| `onInteractOutside` | `(event: PointerEvent) => void` | Detect clicks outside |

#### A7.3 Escape Key Behavior (Dialogs/Popovers)

```svelte
<Dialog.Content
  escapeKeydownBehavior="close"        <!-- Default: close -->
  escapeKeydownBehavior="defer-otherwise-close"  <!-- Nested: let parent decide -->
  escapeKeydownBehavior="defer-otherwise-ignore"  <!-- Nested: ignore if parent doesn't handle -->
  escapeKeydownBehavior="ignore"       <!-- Never close on Escape -->
  onEscapeKeydown={(e) => {
    e.preventDefault(); // Override default behavior
    customCloseLogic();
  }}
>
  <!-- Content -->
</Dialog.Content>
```

### A8. Composition & Render Delegation

#### A8.1 Compound Component Pattern

```svelte
<script>
  import { Dialog } from "bits-ui";
</script>

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

Each sub-component (`Trigger`, `Content`, `Overlay`, etc.) is independently styleable and composable.

#### A8.2 Child Snippet (Render Delegation)

Override the default HTML element:

```svelte
<script>
  import { Dialog } from "bits-ui";
  import CustomButton from "./CustomButton.svelte";
</script>

<Dialog.Trigger>
  {#snippet child({ props })}
    <CustomButton {...props} variant="primary" />
  {/snippet}
</Dialog.Trigger>
```

**Critical Notes**:
- The `child` snippet receives `props` (ARIA, data attributes, event handlers)
- **Spread all props** to ensure accessibility is preserved [28]
- You can render any element or component
- Multiple render delegations on the same element **cause prop conflicts** – only the last applied snippet's props win [29]

#### A8.3 Slot Patterns

**Default slot (children)**:
```svelte
<Dialog.Trigger>Click me</Dialog.Trigger>
```

**Snippet slot** (for advanced control):
```svelte
<Dialog.Trigger>
  {#snippet child({ props })}
    <a href="/" {...props}>Link Button</a>
  {/snippet}
</Dialog.Trigger>
```

Both can coexist; use snippets when you need full element control, slots for simple text/components.

### A9. Testing Guidance

#### A9.1 Test Stack
```bash
npm install --save-dev vitest @testing-library/svelte @testing-library/user-event @testing-library/jest-dom jsdom
```

#### A9.2 vitest Configuration

```javascript
// vitest.config.js
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';

export default defineConfig({
  plugins: [svelte()],
  test: {
    globals: true,
    environment: 'jsdom', // or 'node' for non-DOM tests
  },
});
```

#### A9.3 Basic Test Pattern

```typescript
// Dialog.test.ts
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import userEvent from '@testing-library/user-event';
import DialogComponent from './DialogComponent.svelte';

describe('Dialog', () => {
  it('opens and closes on trigger click', async () => {
    const user = userEvent.setup();
    render(DialogComponent);
    
    // Dialog closed initially
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    
    // Click trigger
    const trigger = screen.getByRole('button', { name: /open/i });
    await user.click(trigger);
    
    // Dialog now visible
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    
    // Press Escape to close
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('traps focus within dialog', async () => {
    const user = userEvent.setup();
    render(DialogComponent);
    
    // Open dialog
    await user.click(screen.getByRole('button', { name: /open/i }));
    
    // Tab through focusable elements
    const closeButton = screen.getByRole('button', { name: /close/i });
    expect(closeButton).toHaveFocus(); // Or first focusable element
  });

  it('restores focus to trigger on close', async () => {
    const user = userEvent.setup();
    render(DialogComponent);
    
    const trigger = screen.getByRole('button', { name: /open/i });
    await user.click(trigger);
    await user.keyboard('{Escape}');
    
    expect(trigger).toHaveFocus();
  });
});
```

#### A9.4 Keyboard & Focus Testing
- **Use `userEvent`, not `fireEvent`** – userEvent simulates real user interactions [30]
- **Test keyboard navigation** – Arrow keys, Tab, Escape, Enter
- **Test focus management** – Use `expect(element).toHaveFocus()`
- **Test data attributes** – Verify `data-state`, `data-disabled`, etc. change correctly

```typescript
it('updates data-state attribute', async () => {
  const user = userEvent.setup();
  render(DialogComponent);
  
  const content = screen.getByRole('dialog');
  expect(content).toHaveAttribute('data-state', 'closed');
  
  await user.click(screen.getByRole('button', { name: /open/i }));
  
  expect(content).toHaveAttribute('data-state', 'open');
});
```

#### A9.5 For Real Browser Testing
Consider Vitest browser mode for state-dependent tests:
```bash
npm install --save-dev @vitest/browser
```

### A10. Known Issues & Sharp Edges

#### A10.1 Child Snippet Prop Conflicts [29]
**Issue**: Multiple render delegations (e.g., Tooltip + Dialog on same element) cause prop overwrites.

**Workaround**:
```svelte
<!-- ❌ Props conflict -->
<Dialog.Trigger {tooltipProps} {popoverProps}>

<!-- ✅ Wrap in container -->
<div use:tooltipActions>
  <Dialog.Trigger {popoverProps}>
    <!-- Content -->
  </Dialog.Trigger>
</div>
```

#### A10.2 Focus Ref Behavior
Bits UI tracks refs by **element ID**, not direct references. This ensures render delegation works correctly but means:
- Refs are stable across snippet changes
- Don't manually manipulate the element ID

#### A10.3 Date/Time Localization
Components support international calendars (Buddhist, Islamic, Persian, etc.). Use `locale` prop:
```svelte
<DatePicker locale="fa-IR" />
```

#### A10.4 Breaking Change: v0.x → v2.1.0
- Complete rewrite for Svelte 5
- API is more consistent but different
- Use migration guide: https://bits-ui.com/docs/migration-guide [31]

#### A10.5 @internationalized/date as Hard Peer Dependency
Date/time components won't work without explicit installation [6].

### A11. Integration with Your Architecture

```
src/
├── primitives/               # Thin wrappers around Bits UI
│   ├── button.svelte
│   ├── dialog.svelte
│   ├── select.svelte
│   └── index.ts             # Export all primitives
├── components/              # Semantic styled components
│   ├── modal.svelte         # Uses primitives/dialog
│   ├── form-field.svelte    # Uses primitives/input + label
│   └── index.ts
├── tokens/                  # Cold Light System tokens
│   ├── colors.ts
│   ├── spacing.ts
│   └── index.ts
└── styles/
    ├── global.css           # clsls + token overrides
    └── data-attributes.css  # Bits UI data-state styling
```

---

## PART B: COLD LIGHT SYSTEM TECHNICAL SPEC

### B1. Identification & Ranking

After comprehensive search, three candidates identified:

| Rank | Name | Evidence | Rating |
|------|------|----------|--------|
| **#1** | **clsls Framework** (https://github.com/clsls/framework) [32] | Explicit "cold" color naming; framework with token-based CSS vars; dark/light mode auto-detect | ⭐⭐⭐⭐⭐ **MOST LIKELY** |
| **#2** | Generic 3-Tier Token System | Standard design token pattern (primitive → semantic → component) [33] | ⭐⭐⭐ Plausible if custom |
| **#3** | holiday.css [34] | Minimalist classless CSS; dark/light mode | ⭐⭐ Less specific |

**Recommendation**: Treat **clsls Framework** as the primary reference unless your project has a custom internal naming.

### B2. clsls Framework Overview

| Property | Value |
|----------|-------|
| **Official Repo** | https://github.com/clsls/framework [32] |
| **Website** | https://clsls.github.io/framework/ |
| **Latest Version** | 2.1.1 (Dec 29, 2023) |
| **License** | (Check repo for details) |
| **Installation** | CDN only (not on NPM) |
| **CDN URL** | https://clsls.github.io/framework/src/index.css |
| **Philosophy** | Classless CSS; 0 classes, 0 JS dependencies |

### B3. Token System Structure

#### B3.1 CSS Variables (Customizable)

```css
:root {
  /* Colors */
  --clsls-color-main: #333;           /* Primary brand */
  --clsls-color-opposite: #f5f5f5;    /* Inverse/bg */
  --clsls-color-background: #ffffff;
  --clsls-color-text: #000000;
  --clsls-color-link-hover: #0066cc;
  --clsls-color-button: #007acc;
  --clsls-color-border: #cccccc;
  --clsls-color-code: #f0f0f0;
  
  /* Typography */
  --clsls-font-heading: Georgia, serif;
  --clsls-font-text: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  
  /* Layout */
  --clsls-line-thickness: 1px;
  --clsls-radius: 4px;
  --clsls-zoom-main: 1;
}
```

#### B3.2 Dark/Light Mode Auto-Detection

clsls automatically respects system preferences via `prefers-color-scheme`:

```css
@media (prefers-color-scheme: dark) {
  :root {
    --clsls-color-background: #1a1a1a;
    --clsls-color-text: #ffffff;
    --clsls-color-opposite: #333333;
    /* ... */
  }
}
```

#### B3.3 Roadmap Changes (v3.0)

Expected variable name updates:
- `--clsls-color-link-hover` → `--clsls-color-a-hover`
- `--clsls-radius` → `--clsls-border-radius`
- `--clsls-line-thickness` → `--clsls-border-width`
- `--clsls-color-code` → `--clsls-color-code-background`

### B4. Styling Layer Approach

#### B4.1 Installation
```html
<!-- In your HTML head -->
<link href="https://clsls.github.io/framework/src/index.css" rel="stylesheet" />
```

Or copy to local file for SvelteKit:

```svelte
<!-- +layout.svelte -->
<svelte:head>
  <link href="/css/clsls.css" rel="stylesheet" />
</svelte:head>
```

#### B4.2 Customization Pattern
```css
/* In your app's global.css, AFTER clsls import */

:root {
  /* Override clsls tokens */
  --clsls-color-main: #0f766e;        /* Your brand teal */
  --clsls-color-button: #14b8a6;
  --clsls-font-heading: "Inter", sans-serif;
}

@media (prefers-color-scheme: dark) {
  :root {
    --clsls-color-background: #0f172a;
    --clsls-color-text: #f1f5f9;
    /* ... */
  }
}
```

#### B4.3 Semantic Tokens (Your Layer)
```css
/* Extend clsls with semantic/component tokens */

:root {
  /* Input fields */
  --input-bg: var(--clsls-color-background);
  --input-text: var(--clsls-color-text);
  --input-border: var(--clsls-color-border);
  --input-focus: var(--clsls-color-main);
  
  /* Buttons */
  --btn-primary-bg: var(--clsls-color-button);
  --btn-primary-text: white;
  --btn-primary-hover: color-mix(in srgb, var(--clsls-color-button) 80%, black);
  
  /* States */
  --state-success: #22c55e;
  --state-error: #ef4444;
  --state-warning: #eab308;
}
```

### B5. Integration with Bits UI

#### B5.1 Wrapper Pattern
```svelte
<!-- src/primitives/button.svelte -->
<script lang="ts">
  import { Button as BitsButton } from "bits-ui";
  
  interface Props {
    variant?: "primary" | "secondary" | "ghost";
    size?: "sm" | "md" | "lg";
    disabled?: boolean;
    [key: string]: any;
  }
  
  let { variant = "primary", size = "md", disabled = false, ...props } = $props() as Props;
</script>

<BitsButton.Root
  class={`btn btn--${variant} btn--${size}`}
  {disabled}
  {...props}
>
  {#snippet child({ props: btnProps })}
    <button {...btnProps}>
      <slot />
    </button>
  {/snippet}
</BitsButton.Root>

<style>
  :global(.btn) {
    padding: var(--btn-padding-y) var(--btn-padding-x);
    font-family: var(--clsls-font-text);
    border-radius: var(--clsls-radius);
    cursor: pointer;
    transition: all 200ms ease;
  }

  :global(.btn--primary) {
    background-color: var(--btn-primary-bg);
    color: var(--btn-primary-text);
  }

  :global(.btn--primary:hover) {
    background-color: var(--btn-primary-hover);
  }

  :global(.btn--primary[data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

#### B5.2 Data-Attribute Styling

Use clsls tokens with Bits UI's data attributes:

```css
/* global.css */

[data-dialog-trigger] {
  background: var(--btn-primary-bg);
  color: var(--btn-primary-text);
  padding: 0.5rem 1rem;
  border-radius: var(--clsls-radius);
}

[data-dialog-content] {
  background: var(--clsls-color-background);
  color: var(--clsls-color-text);
  border: var(--clsls-line-thickness) solid var(--clsls-color-border);
  border-radius: var(--clsls-radius);
}

[data-state="disabled"] {
  opacity: 0.5;
  cursor: not-allowed;
}
```

### B6. Dark/Light Mode Toggle

If you need manual toggle (beyond OS preference):

```svelte
<!-- src/lib/theme-store.ts -->
import { writable } from "svelte/store";

export const theme = writable<"light" | "dark" | "system">("system");

theme.subscribe((value) => {
  if (typeof window !== "undefined") {
    if (value === "system") {
      document.documentElement.removeAttribute("data-theme");
    } else {
      document.documentElement.setAttribute("data-theme", value);
    }
  }
});
```

```svelte
<!-- +layout.svelte -->
<script>
  import { theme } from "$lib/theme-store";
  import { onMount } from "svelte";

  onMount(() => {
    // Initialize from localStorage
    const saved = localStorage.getItem("theme");
    if (saved) theme.set(saved as any);
  });
</script>

<svelte:head>
  <style>
    @media (prefers-color-scheme: dark) {
      :root:not([data-theme="light"]) {
        /* Dark mode tokens */
      }
    }
  </style>
</svelte:head>

<slot />
```

---

## PART C: INTEGRATION BLUEPRINT

### C1. Architecture Overview

```
src/
├── primitives/
│   ├── button.svelte           # Bits UI Button wrapper
│   ├── dialog.svelte           # Bits UI Dialog wrapper
│   ├── select.svelte           # Bits UI Select wrapper
│   ├── form-field.svelte       # Labeled input wrapper
│   └── index.ts                # Barrel export
├── components/
│   ├── modal.svelte            # Semantic (uses primitives/dialog)
│   ├── form.svelte             # Semantic (uses primitives/form-field)
│   └── index.ts
├── tokens/
│   ├── colors.ts               # clsls token overrides
│   ├── spacing.ts
│   ├── typography.ts
│   └── index.ts
├── styles/
│   ├── global.css              # clsls CDN + token overrides
│   ├── primitives.css          # Bits UI data-* styling
│   └── components.css          # Semantic component styles
└── lib/
    ├── stores/
    │   └── theme.ts            # Theme toggle store
    └── utils/
        └── primitives.ts       # Registry, types, utilities
```

### C2. Minimal Wrapper Template (Button)

```svelte
<!-- src/primitives/button.svelte -->
<script lang="ts">
  import { Button as BitsButton } from "bits-ui";
  
  type Variant = "primary" | "secondary" | "ghost" | "outline";
  type Size = "sm" | "md" | "lg";
  
  interface Props {
    variant?: Variant;
    size?: Size;
    disabled?: boolean;
    type?: "button" | "submit" | "reset";
  }
  
  let {
    variant = "primary",
    size = "md",
    disabled = false,
    type = "button",
    ...rest
  } = $props() as Props;
</script>

<BitsButton.Root
  {disabled}
  {type}
  class={`primitive primitive--button variant--${variant} size--${size}`}
  data-kind="button"
  data-variant={variant}
  data-size={size}
  {...rest}
>
  <slot />
</BitsButton.Root>

<style>
  :global(.primitive--button) {
    font-family: var(--clsls-font-text);
    border-radius: var(--clsls-radius);
    transition: all 150ms ease;
    cursor: pointer;
  }

  :global(.primitive--button.variant--primary) {
    background: var(--btn-primary-bg);
    color: var(--btn-primary-text);
  }

  :global(.primitive--button.variant--primary:hover:not([data-disabled])) {
    background: var(--btn-primary-hover);
  }

  :global(.primitive--button[data-disabled]) {
    opacity: 0.5;
    cursor: not-allowed;
  }
</style>
```

### C3. Minimal Wrapper Template (Dialog)

```svelte
<!-- src/primitives/dialog.svelte -->
<script lang="ts">
  import { Dialog as BitsDialog } from "bits-ui";
  
  interface Props {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
  }
  
  let { open = $bindable(false), onOpenChange, ...rest } = $props() as Props;
</script>

<BitsDialog.Root
  bind:open
  onOpenChange={(newOpen) => {
    open = newOpen;
    onOpenChange?.(newOpen);
  }}
  {...rest}
>
  {#snippet child({ props })}
    <div {...props} class="primitive primitive--dialog" data-kind="dialog" role="dialog">
      <slot />
    </div>
  {/snippet}
</BitsDialog.Root>

<style>
  :global(.primitive--dialog) {
    background: var(--clsls-color-background);
    color: var(--clsls-color-text);
    border: var(--clsls-line-thickness) solid var(--clsls-color-border);
    border-radius: var(--clsls-radius);
    padding: 2rem;
    box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);
  }
</style>
```

### C4. Registry & Types

```typescript
// src/lib/utils/primitives.ts

export enum PrimitiveKind {
  BUTTON = "button",
  DIALOG = "dialog",
  SELECT = "select",
  CHECKBOX = "checkbox",
  RADIO_GROUP = "radio-group",
  TABS = "tabs",
  ACCORDION = "accordion",
  TOOLTIP = "tooltip",
}

export type PrimitiveSlot =
  | "trigger"
  | "content"
  | "overlay"
  | "title"
  | "description"
  | "close"
  | "root";

export interface PrimitiveRegistry {
  [PrimitiveKind.BUTTON]: {
    slots: ["trigger"]; // Button is singular; no subparts
    states: ["disabled", "readonly", "loading"];
  };
  [PrimitiveKind.DIALOG]: {
    slots: ["trigger", "content", "overlay", "title", "description", "close"];
    states: ["open", "closed", "nested"];
  };
  [PrimitiveKind.SELECT]: {
    slots: ["trigger", "content", "item", "scroll-up", "scroll-down"];
    states: ["open", "closed", "disabled"];
  };
}

export const primitiveRegistry: PrimitiveRegistry = {
  [PrimitiveKind.BUTTON]: {
    slots: ["trigger"],
    states: ["disabled", "readonly"],
  },
  [PrimitiveKind.DIALOG]: {
    slots: ["trigger", "content", "overlay", "title", "description", "close"],
    states: ["open", "closed", "nested"],
  },
  // ... others
};

// Derived types
export type SlotsByPrimitive = {
  [K in keyof PrimitiveRegistry]: PrimitiveRegistry[K]["slots"][number];
};
```

### C5. Required Exports

```typescript
// src/primitives/index.ts

export { default as Button } from "./button.svelte";
export { default as Dialog } from "./dialog.svelte";
export { default as Select } from "./select.svelte";
export { default as Checkbox } from "./checkbox.svelte";
export { default as RadioGroup } from "./radio-group.svelte";
export { default as Tabs } from "./tabs.svelte";
export { default as Accordion } from "./accordion.svelte";
export { default as Tooltip } from "./tooltip.svelte";

// Types
export type { ButtonProps, DialogProps, SelectProps } from "./types";
export { PrimitiveKind, primitiveRegistry } from "$lib/utils/primitives";
```

### C6. Testing Checklist Per Primitive

#### Button
- [ ] Renders with correct variant/size classes
- [ ] `data-kind="button"` attribute present
- [ ] Disabled state prevents click events
- [ ] Focus management works (Tab navigation)
- [ ] Click event fires correctly
- [ ] Accessible via keyboard (Space/Enter)

#### Dialog
- [ ] Opens on trigger click
- [ ] Closes on Escape key
- [ ] Focus trap active while open
- [ ] Focus returns to trigger on close
- [ ] `data-state="open|closed"` updates
- [ ] Overlay prevents background interaction
- [ ] Accessible via keyboard (Tab navigation)
- [ ] Nested dialogs work correctly
- [ ] Portal rendering doesn't break z-index

#### Select
- [ ] Opens dropdown on click
- [ ] ArrowDown navigates items
- [ ] Enter selects item
- [ ] Escape closes dropdown
- [ ] Typeahead filtering works
- [ ] Disabled state prevents interaction
- [ ] Multiple selection (if enabled)

#### RadioGroup
- [ ] Correct orientation affects keyboard nav
- [ ] ArrowUp/Down navigate (vertical)
- [ ] ArrowLeft/Right navigate (horizontal)
- [ ] Space toggles selection
- [ ] Only one item selected at a time
- [ ] `data-state` reflects checked state

#### Form Components
- [ ] Label associates with input (aria-labelledby)
- [ ] Error message associates with input (aria-describedby)
- [ ] Required indicator visible
- [ ] Disabled state is accessible
- [ ] Form submission works (if using hidden inputs)

### C7. A11y Checklist Per Primitive

| Item | Implementation |
|------|-----------------|
| **ARIA Roles** | Set by Bits UI; verify with browser DevTools |
| **Keyboard Navigation** | Tab, Arrow keys, Enter, Escape – test per component |
| **Focus Visible** | Provide `:focus-visible` CSS styling |
| **Color Contrast** | Verify WCAG AA/AAA with DevTools or axe |
| **Screen Reader** | Test with NVDA/JAWS/VoiceOver; verify announcements |
| **Labels** | Use `<label>` for form inputs; `aria-label` for icons |
| **Error Messaging** | Use `aria-describedby` to link errors to inputs |
| **Disabled State** | Visual indicator + `aria-disabled` / `disabled` attribute |
| **Live Regions** | Use `aria-live="polite"` for status updates (if needed) |

### C8. Anti-Patterns to Avoid

| Anti-Pattern | Why | Solution |
|--------------|-----|----------|
| Removing `data-*` attributes | Breaks styling hooks | Always preserve them |
| Disabling focus trap on Dialog | Breaks keyboard UX | Use `onOpenAutoFocus` instead |
| Using `fireEvent` in tests | Doesn't simulate real UX | Use `@testing-library/user-event` |
| Multiple render delegations | Props conflict | Wrap in container or use event handlers |
| Hardcoding colors/spacing | Breaks theme switching | Use CSS tokens (--clsls-color-*) |
| Forgetting `@internationalized/date` | Date components crash | Install explicitly in package.json |
| Nesting Portal elements | Z-index issues | Keep Portal at top level of Dialog |
| Modifying refs directly | Breaks Bits UI ID tracking | Use `bind:ref` or event handlers only |

### C9. Version Pinning Recommendation

```json
{
  "dependencies": {
    "svelte": "^5.33.0",
    "bits-ui": "2.4.1",
    "@internationalized/date": "^3.5.0"
  },
  "devDependencies": {
    "vitest": "^2.1.0",
    "@testing-library/svelte": "^4.2.0",
    "@testing-library/user-event": "^14.5.0",
    "@testing-library/jest-dom": "^6.4.0"
  }
}
```

**Rationale**:
- **Bits UI**: Pin to 2.4.1 (latest stable, Svelte 5 only)
- **@internationalized/date**: Allow minor updates (^3.5.0) for bug fixes
- **Svelte**: Minimum ^5.33.0 (required by Bits UI v2.1.0+)
- **Testing**: Use recent stable versions; update when Bits UI updates

### C10. Implementation Workflow

1. **Setup**
   - Install dependencies
   - Create `src/primitives/` directory
   - Import clsls CDN in `+layout.svelte`
   - Create `src/tokens/` for color/spacing overrides

2. **Wrap Primitives** (priority order)
   - Button, Input, Label
   - Dialog, Popover, Tooltip
   - Select, RadioGroup, Checkbox
   - Tabs, Accordion
   - Advanced: DatePicker, Slider, etc.

3. **Token System**
   - Copy clsls default variables
   - Override with your brand colors
   - Add semantic tokens (--btn-primary-*, --input-*, etc.)
   - Test dark mode toggle

4. **Styling**
   - Create `primitives.css` for data-* selectors
   - Create `components.css` for semantic components
   - Use CSS variables throughout
   - Ensure WCAG AA/AAA contrast

5. **Testing**
   - Write unit tests for each primitive
   - Test keyboard navigation per component
   - Test focus management
   - Verify dark/light mode

6. **Documentation**
   - List all primitives and their props
   - Document variant/size options
   - Provide a11y requirements
   - Include testing checklist

---

## APPENDICES

### Reference Links
[1] https://bits-ui.com/docs
[2] https://github.com/huntabyte/bits-ui
[3] https://www.npmjs.com/package/bits-ui
[4] https://github.com/huntabyte/bits-ui/releases
[5] https://bits-ui.com/docs/migration-guide
[6] https://github.com/huntabyte/shadcn-svelte/issues/1208
[7] https://bits-ui.com/docs/components/accordion
[8] https://bits-ui.com/docs/components/collapsible
[9] https://bits-ui.com/docs/components/dialog
[10] https://bits-ui.com/docs/components/radio-group
[11] https://bits-ui.com/docs/components/select
[12] https://bits-ui.com/docs/components/switch
[13] https://bits-ui.com/docs/components/tabs
[14] https://bits-ui.com/docs/components/tooltip
[15] https://bits-ui.com/docs/components/command
[16] https://bits-ui.com/docs/components/context-menu
[17] https://bits-ui.com/docs/components/menubar
[18] https://bits-ui.com/docs/components/navigation-menu
[19] https://bits-ui.com/docs/components/popover
[20] https://bits-ui.com/docs/components/calendar
[21] https://bits-ui.com/docs/components/date-picker
[22] https://bits-ui.com/docs/components/date-range-field
[23] https://bits-ui.com/docs/components/date-range-picker
[24] https://bits-ui.com/docs/components/time-range-field
[25] https://bits-ui.com/docs/components/aspect-ratio
[26] https://bits-ui.com/docs/components/separator
[27] https://bits-ui.com/docs/ref
[28] https://next.bits-ui.com/docs/child-snippet
[29] https://www.reddit.com/r/sveltejs/comments/1hzcg1x/shadcn_bits_ui_child_snippet_conflict_cant_have/
[30] https://davipon.hashnode.dev/svelte-component-test-recipes
[31] https://next.bits-ui.com/docs/migration-guide
[32] https://github.com/clsls/framework
[33] https://www.reddit.com/r/DesignSystems/comments/1it1erb/3tier_design_token_system/
[34] https://github.com/EvgenyOrekhov/holiday.css/

---

**Document Completed**: January 21, 2026  
**Status**: Ready for Implementation  
**Questions**: Refer to Bits UI Discord or open GitHub issues
