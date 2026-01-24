# Accordion Builder

> Expandable sections with single/multiple open states.

---

## Import

```typescript
import { createAccordion, melt } from '@melt-ui/svelte';
```

---

## createAccordion(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `multiple` | `boolean` | `false` | Allow multiple open items |
| `disabled` | `boolean` | `false` | Disable entire accordion |
| `forceVisible` | `boolean` | `false` | For custom transitions |
| `defaultValue` | `string \| string[]` | — | Initially open item(s) |
| `value` | `Writable` | — | Controlled state |
| `onValueChange` | `ChangeFn` | — | State change callback |

---

## Return Value

```typescript
const {
  elements: {
    root,     // Main container
    item,     // Section wrapper (function)
    trigger,  // Toggle button (function)
    content,  // Expandable content (function)
    heading,  // Semantic heading wrapper (function)
  },
  states: {
    value,    // Writable<string | string[]>
  },
} = createAccordion();
```

---

## Element Data Attributes

### root
- `[data-melt-accordion]`
- `[data-orientation]` — `'horizontal' | 'vertical'`

### item
- `[data-melt-accordion-item]`
- `[data-state]` — `'open' | 'closed'`
- `[data-disabled]` — present when disabled

### trigger
- `[data-melt-accordion-trigger]`
- `[data-state]` — `'open' | 'closed'`
- `[data-disabled]` — present when disabled

### content
- `[data-melt-accordion-content]`
- `[data-state]` — `'open' | 'closed'`
- `[data-disabled]` — present when disabled

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| trigger | `aria-expanded`, `aria-controls`, `id` |
| content | `aria-labelledby`, `role="region"`, `id` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createAccordion, melt } from '@melt-ui/svelte';

  const accordion = createAccordion({
    multiple: false,
    defaultValue: 'item-1',
  });

  const { elements: { root, item, trigger, content, heading }, states } = accordion;

  const items = [
    { id: 'item-1', title: 'Section 1', body: 'Content 1' },
    { id: 'item-2', title: 'Section 2', body: 'Content 2' },
    { id: 'item-3', title: 'Section 3', body: 'Content 3' },
  ];
</script>

<div
  use:melt={$root}
  class={rootClass}
  data-kind="accordion"
  data-slot="root"
>
  {#each items as accordionItem}
    <div
      use:melt={$item(accordionItem.id)}
      class={itemClass}
      data-kind="accordion"
      data-slot="item"
    >
      <h3 use:melt={$heading(accordionItem.id)}>
        <button
          use:melt={$trigger(accordionItem.id)}
          class={triggerClass}
          data-kind="accordion"
          data-slot="trigger"
        >
          {accordionItem.title}
        </button>
      </h3>

      <div
        use:melt={$content(accordionItem.id)}
        class={contentClass}
        data-kind="accordion"
        data-slot="content"
      >
        {accordionItem.body}
      </div>
    </div>
  {/each}
</div>
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `Space` / `Enter` | Toggle focused item |
| `ArrowDown` | Focus next trigger |
| `ArrowUp` | Focus previous trigger |
| `Home` | Focus first trigger |
| `End` | Focus last trigger |

---

## Animations

Use `forceVisible: true` with Svelte transitions:

```svelte
<div
  use:melt={$content(id)}
  transition:slide
>
  {body}
</div>
```

---

## Notes

- Wrap triggers in semantic headings (`<h2>`, `<h3>`, etc.)
- Use `multiple: true` for FAQ-style accordions
- Use `multiple: false` for single-open panels
- Item IDs must be unique strings
