# Tooltip Builder

> Non-modal informational popup on hover/focus.

---

## Import

```typescript
import { createTooltip, melt } from '@melt-ui/svelte';
```

---

## createTooltip(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `positioning` | `FloatingConfig` | `{ placement: 'top' }` | Floating position |
| `arrowSize` | `number` | `8` | Arrow size in pixels |
| `openDelay` | `number` | `1000` | Delay before open (ms) |
| `closeDelay` | `number` | `500` | Delay before close (ms) |
| `closeOnPointerDown` | `boolean` | `true` | Close on click |
| `disableHoverableContent` | `boolean` | `false` | Disable hovering content |
| `group` | `string \| boolean` | — | Tooltip grouping |
| `escapeBehavior` | `EscapeBehavior` | `'close'` | Escape key handling |
| `portal` | `string \| HTMLElement \| null` | `'body'` | Portal target |
| `forceVisible` | `boolean` | `false` | For custom transitions |
| `defaultOpen` | `boolean` | `false` | Initial state |
| `open` | `Writable<boolean>` | — | Controlled state |
| `onOpenChange` | `ChangeFn<boolean>` | — | State change callback |
| `ids` | `{ content? }` | — | Custom ID overrides |

---

## Return Value

```typescript
const {
  elements: {
    trigger,  // Element that shows tooltip
    content,  // Tooltip container
    arrow,    // Optional arrow
  },
  states: {
    open,     // Writable<boolean>
  },
} = createTooltip();
```

---

## Element Data Attributes

### trigger
- `[data-melt-tooltip-trigger]`

### content
- `[data-state]` — `'open' | 'closed'`
- `[data-side]` — `'top' | 'bottom' | 'left' | 'right'`
- `[data-align]` — `'start' | 'center' | 'end'`
- `[data-melt-tooltip-content]`

### arrow
- `[data-side]` — `'top' | 'bottom' | 'left' | 'right'`
- `[data-melt-tooltip-arrow]`

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| trigger | `aria-describedby` (points to content) |
| content | `role="tooltip"`, `id` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createTooltip, melt } from '@melt-ui/svelte';

  const tooltip = createTooltip({
    positioning: { placement: 'top' },
    openDelay: 500,
  });

  const { elements: { trigger, content, arrow }, states } = tooltip;
</script>

<button
  use:melt={$trigger}
  class={triggerClass}
  data-kind="tooltip"
  data-slot="trigger"
>
  Hover me
</button>

{#if $states.open}
  <div
    use:melt={$content}
    class={contentClass}
    data-kind="tooltip"
    data-slot="content"
  >
    Tooltip text

    <div
      use:melt={$arrow}
      class={arrowClass}
      data-kind="tooltip"
      data-slot="arrow"
    />
  </div>
{/if}
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `Escape` | Close tooltip |
| `Tab` | Focus trigger opens, blur closes |

---

## Grouping

When multiple tooltips share a `group`, opening one instantly opens (no delay) if another in the group was recently open:

```typescript
createTooltip({ group: 'nav-tooltips' });
```

---

## Notes

- Tooltips are NON-MODAL (no focus trap)
- Should contain only text, not interactive elements
- For interactive content, use Popover instead
