# Radio Group Builder

> Single selection from multiple options.

---

## Import

```typescript
import { createRadioGroup, melt } from '@melt-ui/svelte';
```

---

## createRadioGroup(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Disable entire group |
| `required` | `boolean` | `false` | Required for form |
| `loop` | `boolean` | `false` | Loop keyboard navigation |
| `orientation` | `'horizontal' \| 'vertical'` | `'vertical'` | Layout direction |
| `name` | `string` | — | Form field name |
| `defaultValue` | `string` | — | Initially selected value |
| `value` | `Writable<string>` | — | Controlled value |
| `onValueChange` | `ChangeFn` | — | Value change callback |

---

## Return Value

```typescript
const {
  elements: {
    root,        // Group container
    item,        // Individual radio (function)
    hiddenInput, // Form submission
  },
  states: {
    value,  // Writable<string>
  },
} = createRadioGroup();
```

---

## Element Data Attributes

### root
- `[data-melt-radio-group]`
- `[data-orientation]` — `'horizontal' | 'vertical'`

### item
- `[data-melt-radio-group-item]`
- `[data-state]` — `'checked' | 'unchecked'`
- `[data-disabled]` — present when disabled
- `[data-value]` — item value

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| root | `role="radiogroup"`, `aria-required`, `aria-orientation` |
| item | `role="radio"`, `aria-checked`, `tabindex` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createRadioGroup, melt } from '@melt-ui/svelte';

  const radioGroup = createRadioGroup({
    defaultValue: 'option-1',
    orientation: 'vertical',
  });

  const { elements: { root, item }, states } = radioGroup;

  const options = [
    { value: 'option-1', label: 'Option 1' },
    { value: 'option-2', label: 'Option 2' },
    { value: 'option-3', label: 'Option 3' },
  ];
</script>

<div
  use:melt={$root}
  class={rootClass}
  data-kind="radio-group"
  data-slot="root"
>
  {#each options as option}
    <label class={labelClass}>
      <button
        use:melt={$item(option.value)}
        class={itemClass}
        data-kind="radio-group"
        data-slot="item"
      >
        <span class={indicatorClass} data-kind="radio-group" data-slot="indicator" />
      </button>
      {option.label}
    </label>
  {/each}
</div>

<p>Selected: {$states.value}</p>
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `Tab` | Focus checked item (or first) |
| `Space` | Check focused item |
| `ArrowDown` / `ArrowRight` | Focus & check next |
| `ArrowUp` / `ArrowLeft` | Focus & check previous |

---

## Styling

```css
[data-kind="radio-group"][data-slot="item"] {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  border: 2px solid var(--color-neutral-400);
}

[data-kind="radio-group"][data-slot="item"][data-state="checked"] {
  border-color: var(--color-primary-500);
}

[data-kind="radio-group"][data-slot="indicator"] {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: transparent;
}

[data-kind="radio-group"][data-slot="item"][data-state="checked"]
[data-kind="radio-group"][data-slot="indicator"] {
  background: var(--color-primary-500);
}
```

---

## Notes

- Only one item can be selected at a time
- Arrow keys both move focus AND select
- Use roving tabindex pattern (Melt handles this)
- Indicator is styled child element (not Melt-controlled)
