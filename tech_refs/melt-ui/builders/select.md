# Select Builder

> Dropdown selection (listbox pattern).

---

## Import

```typescript
import { createSelect, melt } from '@melt-ui/svelte';
```

---

## createSelect(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultSelected` | `SelectOption` | — | Initial selection |
| `selected` | `Writable<SelectOption>` | — | Controlled selection |
| `onSelectedChange` | `ChangeFn` | — | Selection callback |
| `multiple` | `boolean` | `false` | Multi-select mode |
| `required` | `boolean` | `false` | Form validation |
| `disabled` | `boolean` | `false` | Disable entire select |
| `defaultOpen` | `boolean` | `false` | Initial open state |
| `open` | `Writable<boolean>` | — | Controlled open state |
| `onOpenChange` | `ChangeFn<boolean>` | — | Open state callback |
| `loop` | `boolean` | `false` | Loop keyboard navigation |
| `escapeBehavior` | `EscapeBehavior` | `'close'` | Escape key handling |
| `closeOnOutsideClick` | `boolean` | `true` | Click outside to close |
| `positioning` | `FloatingConfig` | — | Floating UI config |
| `portal` | `string \| HTMLElement \| null` | `'body'` | Portal target |
| `highlightOnHover` | `boolean` | `true` | Hover updates highlight |
| `forceVisible` | `boolean` | `false` | For custom transitions |
| `name` | `string` | — | Form field name |

### SelectOption

```typescript
interface SelectOption<T = unknown> {
  value: T;
  label?: string;
  disabled?: boolean;
}
```

---

## Return Value

```typescript
const {
  elements: {
    trigger,      // Opens menu
    menu,         // Listbox container
    option,       // Individual option (function)
    label,        // Associated label
    group,        // Option group container
    groupLabel,   // Group heading
    arrow,        // Positioning arrow
    separator,    // Visual separator
    hiddenInput,  // Form submission
  },
  states: {
    open,          // Writable<boolean>
    selected,      // Writable<SelectOption | SelectOption[]>
    selectedLabel, // Readable<string>
  },
  helpers: {
    isSelected,    // (value) => boolean
  },
} = createSelect();
```

---

## Element Data Attributes

### trigger
- `[data-state]` — `'open' | 'closed'`
- `[data-disabled]` — present when disabled
- `[data-melt-select-trigger]`

### menu
- `[data-side]` — `'top' | 'bottom' | 'left' | 'right'`
- `[data-align]` — `'start' | 'center' | 'end'`
- `[data-melt-select-menu]`

### option
- `[data-value]` — the option value
- `[data-label]` — the option label
- `[data-disabled]` — present when disabled
- `[data-selected]` — present when selected
- `[data-highlighted]` — present when highlighted
- `[data-melt-select-option]`

### group
- `[data-melt-select-group]`

### groupLabel
- `[data-melt-select-group-label]`

### arrow
- `[data-side]` — `'top' | 'bottom' | 'left' | 'right'`
- `[data-melt-select-arrow]`

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| trigger | `role="combobox"`, `aria-haspopup="listbox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant` |
| menu | `role="listbox"`, `aria-multiselectable` (when multiple) |
| option | `role="option"`, `aria-selected`, `aria-disabled` |
| group | `role="group"`, `aria-labelledby` |
| groupLabel | `id` (linked to group's aria-labelledby) |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createSelect, melt } from '@melt-ui/svelte';

  const select = createSelect({
    positioning: { placement: 'bottom', sameWidth: true },
  });

  const { elements: { trigger, menu, option }, states } = select;
</script>

<button
  use:melt={$trigger}
  class={triggerClass}
  data-kind="select"
  data-slot="trigger"
>
  {$states.selectedLabel || 'Select...'}
</button>

{#if $states.open}
  <div
    use:melt={$menu}
    class={menuClass}
    data-kind="select"
    data-slot="content"
    data-state="open"
  >
    {#each items as item}
      <div
        use:melt={$option({ value: item.value, label: item.label })}
        class={itemClass}
        data-kind="select"
        data-slot="item"
      >
        {item.label}
      </div>
    {/each}
  </div>
{/if}
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open menu / Select highlighted |
| `ArrowDown` | Open menu / Highlight next |
| `ArrowUp` | Open menu / Highlight previous |
| `Home` | Highlight first |
| `End` | Highlight last |
| `Escape` | Close menu |
| `Type character` | Typeahead to matching item |

---

## Single vs Multiple

**Single (default):**
- Selecting closes menu
- `selected` is single `SelectOption`

**Multiple (`multiple: true`):**
- Menu stays open after selection
- `selected` is array of `SelectOption[]`
- Menu has `aria-multiselectable="true"`
