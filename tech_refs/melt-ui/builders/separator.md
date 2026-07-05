# Separator Builder

> Visual divider between content.

---

## Import

```typescript
import { createSeparator, melt } from '@melt-ui/svelte';
```

---

## createSeparator(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `decorative` | `boolean` | `false` | Exclude from accessibility tree |

---

## Return Value

```typescript
const {
  elements: {
    root,  // Separator element
  },
} = createSeparator();
```

---

## Element Data Attributes

### root
- `[data-melt-separator]`
- `[data-orientation]` — `'horizontal' | 'vertical'`

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| root | `role="separator"` (unless decorative), `aria-orientation` |

When `decorative: true`, the separator is excluded from the accessibility tree.

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createSeparator, melt } from '@melt-ui/svelte';

  const separator = createSeparator({
    orientation: 'horizontal',
  });

  const { elements: { root } } = separator;
</script>

<div
  use:melt={$root}
  class={separatorClass}
  data-kind="separator"
  data-slot="root"
/>
```

---

## Horizontal

```svelte
<script>
  const separator = createSeparator({ orientation: 'horizontal' });
</script>

<nav>
  <a href="/">Home</a>
  <a href="/about">About</a>
</nav>

<div use:melt={$separator.elements.root} data-kind="separator" data-slot="root" />

<main>
  Content...
</main>
```

---

## Vertical

```svelte
<script>
  const separator = createSeparator({ orientation: 'vertical' });
</script>

<div style="display: flex; align-items: center; gap: 1rem;">
  <span>Item 1</span>
  <div use:melt={$separator.elements.root} data-kind="separator" data-slot="root" />
  <span>Item 2</span>
  <div use:melt={$separator.elements.root} data-kind="separator" data-slot="root" />
  <span>Item 3</span>
</div>
```

---

## Decorative

```svelte
<script>
  // Decorative separator - not announced by screen readers
  const separator = createSeparator({
    decorative: true,
  });
</script>

<!-- Use for purely visual separators that don't convey meaning -->
<div use:melt={$root} data-kind="separator" data-slot="root" />
```

---

## Styling

```css
[data-kind="separator"][data-slot="root"] {
  background: var(--color-neutral-200);
}

[data-kind="separator"][data-slot="root"][data-orientation="horizontal"] {
  height: 1px;
  width: 100%;
}

[data-kind="separator"][data-slot="root"][data-orientation="vertical"] {
  width: 1px;
  height: 100%;
}
```

---

## Notes

- Use `decorative: true` for purely visual dividers
- Use `decorative: false` (default) when separator conveys structure
- Vertical separators need explicit height (or flex container)
- Simplest of all builders - just provides semantic markup
