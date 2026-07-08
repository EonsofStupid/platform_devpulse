# Melt UI Reference for ColdLight

> **Version:** @melt-ui/svelte
> **Role:** ARIA Provider for ColdLight Design System
> **Philosophy:** Builders provide behavior + ARIA, ColdLight owns everything else

---

## Architecture

```
ColdLight Primitives
      │
      │ YOUR elements, YOUR data-*, YOUR classes, YOUR types
      ▼
┌─────────────────────────────────────────────────────────────┐
│                    use:melt={$element}                      │
│                                                             │
│  Melt UI handles:                                           │
│  - ARIA attributes (role, aria-*, etc.)                     │
│  - Event handlers (click, keydown, focus)                   │
│  - Focus management                                         │
│  - Keyboard navigation                                      │
│  - Data attributes (data-state, data-side, data-align)      │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Concepts

### Builders

Builders are functions that return:

```typescript
const {
  elements,  // Builder stores for DOM elements
  states,    // Reactive state stores
  helpers,   // Utility functions
} = createDialog();
```

### The `use:melt` Action

Applies builder properties to elements:

```svelte
<div use:melt={$content}>
```

Expands to:

```svelte
<div {...$content} use:$content.action>
```

**Preprocessor is OPTIONAL** - you can write expanded form directly.

---

## ColdLight Integration Pattern

```svelte
<script lang="ts">
  import { createDialog, melt } from '@melt-ui/svelte';

  const {
    elements: { trigger, content, overlay, title, description, close },
    states: { open }
  } = createDialog();
</script>

<!-- ColdLight adds: data-kind, data-slot, classes -->
<!-- Melt UI adds: ARIA, events, focus management -->

<button
  use:melt={$trigger}
  class={triggerClass}
  data-kind="dialog"
  data-slot="trigger"
>
  Open
</button>

{#if $open}
  <div
    use:melt={$overlay}
    class={overlayClass}
    data-kind="dialog"
    data-slot="overlay"
  />

  <div
    use:melt={$content}
    class={contentClass}
    data-kind="dialog"
    data-slot="content"
    data-state={$open ? "open" : "closed"}
  >
    <h2
      use:melt={$title}
      data-kind="dialog"
      data-slot="title"
    >
      Title
    </h2>

    <p
      use:melt={$description}
      data-kind="dialog"
      data-slot="description"
    >
      Description
    </p>

    <button
      use:melt={$close}
      data-kind="dialog"
      data-slot="close"
    >
      Close
    </button>
  </div>
{/if}
```

---

## What Melt UI Provides

| Capability | Builders |
|------------|----------|
| Focus trapping | Dialog, Popover |
| Keyboard navigation | All |
| Click outside | Dialog, Popover, Select |
| Escape handling | All |
| Portal rendering | Dialog, Popover, Tooltip, Select |
| Floating positioning | Popover, Tooltip, Select, Combobox |
| ARIA attributes | All |
| Scroll lock | Dialog, Popover |
| Typeahead | Select, Combobox |

---

## What ColdLight Owns

| Aspect | ColdLight Responsibility |
|--------|--------------------------|
| `data-kind` | Primitive identifier |
| `data-slot` | Slot identifier |
| `data-id` | User-defined stable ID |
| `class` | All styling |
| Type system | Fully typed props |
| Tokens | DTCG v4 design tokens |
| Recipes | Styling patterns |

---

## File Index

### Reference
- [BUILDER_INDEX.md](./BUILDER_INDEX.md) - Complete builder index with priorities
- [COMMON_TYPES.md](./COMMON_TYPES.md) - Shared types (FloatingConfig, etc.)

### Overlay / Floating
- [builders/dialog.md](./builders/dialog.md) - Modal dialog
- [builders/popover.md](./builders/popover.md) - Floating interactive content
- [builders/tooltip.md](./builders/tooltip.md) - Non-modal informational popup
- [builders/dropdown-menu.md](./builders/dropdown-menu.md) - Action menu

### Selection
- [builders/select.md](./builders/select.md) - Dropdown listbox
- [builders/combobox.md](./builders/combobox.md) - Autocomplete input
- [builders/checkbox.md](./builders/checkbox.md) - Single checkbox (tri-state)
- [builders/switch.md](./builders/switch.md) - On/off toggle
- [builders/radio-group.md](./builders/radio-group.md) - Single selection group

### Navigation
- [builders/tabs.md](./builders/tabs.md) - Tabbed interface
- [builders/accordion.md](./builders/accordion.md) - Expandable sections

### Form Inputs
- [builders/pin-input.md](./builders/pin-input.md) - OTP/PIN entry

### Layout / Display
- [builders/collapsible.md](./builders/collapsible.md) - Expandable section
- [builders/separator.md](./builders/separator.md) - Visual divider
- [builders/progress.md](./builders/progress.md) - Progress indicator
