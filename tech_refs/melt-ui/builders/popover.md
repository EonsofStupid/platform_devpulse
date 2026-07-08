# Popover Builder

> Floating container with focus management.

---

## Import

```typescript
import { createPopover, melt } from '@melt-ui/svelte';
```

---

## createPopover(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `positioning` | `FloatingConfig` | `{ placement: 'bottom' }` | Floating position |
| `arrowSize` | `number` | `8` | Arrow size in pixels |
| `preventScroll` | `boolean` | `true` | Lock body scroll |
| `escapeBehavior` | `EscapeBehavior` | `'close'` | Escape key handling |
| `closeOnOutsideClick` | `boolean` | `true` | Click outside to close |
| `disableFocusTrap` | `boolean` | `false` | Disable focus trap |
| `portal` | `string \| HTMLElement \| null` | `'body'` | Portal target |
| `forceVisible` | `boolean` | `false` | For custom transitions |
| `openFocus` | `FocusProp` | — | Override focus on open |
| `closeFocus` | `FocusProp` | — | Override focus on close |
| `defaultOpen` | `boolean` | `false` | Initial state |
| `open` | `Writable<boolean>` | — | Controlled state |
| `onOpenChange` | `ChangeFn<boolean>` | — | State change callback |
| `ids` | `{ content? }` | — | Custom ID overrides |

---

## Return Value

```typescript
const {
  elements: {
    trigger,  // Opens popover
    content,  // Main container
    overlay,  // Optional backdrop
    close,    // Close button
    arrow,    // Optional arrow
  },
  states: {
    open,     // Writable<boolean>
  },
} = createPopover();
```

---

## Element Data Attributes

### trigger
- `[data-state]` — `'open' | 'closed'`
- `[data-melt-popover-trigger]`

### content
- `[data-state]` — `'open' | 'closed'`
- `[data-side]` — `'top' | 'bottom' | 'left' | 'right'`
- `[data-align]` — `'start' | 'center' | 'end'`
- `[data-melt-popover-content]`

### overlay
- `[data-state]` — `'open' | 'closed'`
- `[data-melt-popover-overlay]`

### close
- `[data-melt-popover-close]`

### arrow
- `[data-side]` — `'top' | 'bottom' | 'left' | 'right'`
- `[data-melt-popover-arrow]`

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| trigger | `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` |
| content | `role="dialog"`, `aria-modal` (when focus trapped), `id` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createPopover, melt } from '@melt-ui/svelte';

  const popover = createPopover({
    positioning: { placement: 'bottom-start' },
  });

  const { elements: { trigger, content, arrow, close }, states } = popover;
</script>

<button
  use:melt={$trigger}
  class={triggerClass}
  data-kind="popover"
  data-slot="trigger"
>
  Open
</button>

{#if $states.open}
  <div
    use:melt={$content}
    class={contentClass}
    data-kind="popover"
    data-slot="content"
    data-state="open"
  >
    <p>Popover content</p>

    <button
      use:melt={$close}
      data-kind="popover"
      data-slot="close"
    >
      Close
    </button>

    <div
      use:melt={$arrow}
      class={arrowClass}
      data-kind="popover"
      data-slot="arrow"
    />
  </div>
{/if}
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `Tab` | Move focus within popover |
| `Shift+Tab` | Move focus backward |
| `Escape` | Close popover |

---

## Focus Management

1. On open: Focus moves to first focusable element (or override with `openFocus`)
2. While open: Focus trapped within content (unless `disableFocusTrap: true`)
3. On close: Focus returns to trigger (or override with `closeFocus`)

---

## Popover vs Tooltip vs Dialog

| Feature | Tooltip | Popover | Dialog |
|---------|---------|---------|--------|
| Interactive content | No | Yes | Yes |
| Focus trap | No | Optional | Yes |
| Modal | No | No | Yes |
| Backdrop | No | Optional | Yes |
| Positioning | Floating | Floating | Centered |
