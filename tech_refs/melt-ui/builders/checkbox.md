# Checkbox Builder

> Single checkbox with tri-state support.

---

## Import

```typescript
import { createCheckbox, melt } from '@melt-ui/svelte';
```

---

## createCheckbox(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Disable checkbox |
| `required` | `boolean` | `false` | Required for form |
| `name` | `string` | — | Form field name |
| `value` | `string` | — | Form field value |
| `defaultChecked` | `boolean \| 'indeterminate'` | `false` | Initial state |
| `checked` | `Writable` | — | Controlled state |
| `onCheckedChange` | `ChangeFn` | — | State change callback |

---

## Return Value

```typescript
const {
  elements: {
    root,   // Checkbox element
    input,  // Hidden input for forms
  },
  states: {
    checked,  // Writable<boolean | 'indeterminate'>
  },
  helpers: {
    isChecked,       // Derived<boolean>
    isIndeterminate, // Derived<boolean>
  },
} = createCheckbox();
```

---

## Element Data Attributes

### root
- `[data-melt-checkbox]`
- `[data-state]` — `'checked' | 'unchecked' | 'indeterminate'`
- `[data-disabled]` — present when disabled

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| root | `role="checkbox"`, `aria-checked`, `aria-required`, `aria-disabled` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createCheckbox, melt } from '@melt-ui/svelte';

  const checkbox = createCheckbox({
    defaultChecked: false,
  });

  const { elements: { root }, states, helpers } = checkbox;
</script>

<button
  use:melt={$root}
  class={checkboxClass}
  data-kind="checkbox"
  data-slot="root"
>
  {#if $helpers.isChecked}
    <CheckIcon />
  {:else if $helpers.isIndeterminate}
    <MinusIcon />
  {/if}
</button>

<label>Accept terms</label>
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `Space` | Toggle checked state |

---

## Tri-State (Indeterminate)

```svelte
<script>
  const checkbox = createCheckbox({
    defaultChecked: 'indeterminate',
  });

  // Programmatically set indeterminate
  function setIndeterminate() {
    checkbox.states.checked.set('indeterminate');
  }
</script>
```

Use cases:
- "Select all" checkbox when some items selected
- Partial permission states
- Tree selection hierarchies

---

## Form Integration

```svelte
<form>
  <button use:melt={$root} data-kind="checkbox" data-slot="root">
    {#if $helpers.isChecked}✓{/if}
  </button>
  <input use:melt={$input} />
  <label>I agree</label>
</form>
```

---

## Notes

- Use `<button>` or `<div>` as root (Melt adds role)
- Hidden input handles form submission
- Tri-state useful for hierarchical selection
- Style with `[data-state]` attribute selectors
