# Collapsible Builder

> Expandable/collapsible section.

---

## Import

```typescript
import { createCollapsible, melt } from '@melt-ui/svelte';
```

---

## createCollapsible(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Disable collapsible |
| `forceVisible` | `boolean` | `false` | For custom transitions |
| `defaultOpen` | `boolean` | `false` | Initially open |
| `open` | `Writable<boolean>` | — | Controlled state |
| `onOpenChange` | `ChangeFn` | — | State change callback |

---

## Return Value

```typescript
const {
  elements: {
    root,     // Container
    trigger,  // Toggle button
    content,  // Collapsible content
  },
  states: {
    open,  // Writable<boolean>
  },
} = createCollapsible();
```

---

## Element Data Attributes

### root
- `[data-melt-collapsible]`
- `[data-state]` — `'open' | 'closed'`
- `[data-disabled]` — present when disabled

### trigger
- `[data-melt-collapsible-trigger]`
- `[data-state]` — `'open' | 'closed'`
- `[data-disabled]` — present when disabled

### content
- `[data-melt-collapsible-content]`
- `[data-state]` — `'open' | 'closed'`
- `[data-disabled]` — present when disabled

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| trigger | `aria-expanded`, `aria-controls`, `id` |
| content | `aria-hidden`, `id` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createCollapsible, melt } from '@melt-ui/svelte';

  const collapsible = createCollapsible({
    defaultOpen: false,
  });

  const { elements: { root, trigger, content }, states } = collapsible;
</script>

<div
  use:melt={$root}
  class={rootClass}
  data-kind="collapsible"
  data-slot="root"
>
  <button
    use:melt={$trigger}
    class={triggerClass}
    data-kind="collapsible"
    data-slot="trigger"
  >
    {$states.open ? 'Hide' : 'Show'} details
  </button>

  {#if $states.open}
    <div
      use:melt={$content}
      class={contentClass}
      data-kind="collapsible"
      data-slot="content"
    >
      <p>Collapsible content here...</p>
    </div>
  {/if}
</div>
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `Space` | Toggle open/closed |
| `Enter` | Toggle open/closed |

---

## With Transitions

```svelte
<script>
  import { slide } from 'svelte/transition';

  const collapsible = createCollapsible({
    forceVisible: true,  // Required for transitions
  });
</script>

{#if $states.open}
  <div
    use:melt={$content}
    transition:slide={{ duration: 200 }}
    data-kind="collapsible"
    data-slot="content"
  >
    Content with slide animation
  </div>
{/if}
```

---

## Collapsible vs Accordion

| Feature | Collapsible | Accordion |
|---------|-------------|-----------|
| Items | Single | Multiple |
| Exclusive | N/A | Optional (`multiple: false`) |
| Use case | Show/hide section | Multiple related sections |

---

## Notes

- Simpler than Accordion for single expandable section
- Use `forceVisible: true` for Svelte transitions
- Trigger can be any focusable element
- Content is hidden via conditional render or CSS
