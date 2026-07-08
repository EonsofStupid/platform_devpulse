# Combobox Builder

> Autocomplete input with dropdown.

---

## Import

```typescript
import { createCombobox, melt } from '@melt-ui/svelte';
```

---

## createCombobox(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultSelected` | `ComboboxOption` | — | Initial selection |
| `selected` | `Writable<ComboboxOption>` | — | Controlled selection |
| `onSelectedChange` | `ChangeFn` | — | Selection callback |
| `multiple` | `boolean` | `false` | Multi-select mode |
| `defaultOpen` | `boolean` | `false` | Initial open state |
| `open` | `Writable<boolean>` | — | Controlled open state |
| `onOpenChange` | `ChangeFn<boolean>` | — | Open state callback |
| `loop` | `boolean` | `false` | Loop keyboard navigation |
| `scrollAlignment` | `'nearest' \| 'center'` | `'nearest'` | Scroll behavior |
| `highlightOnHover` | `boolean` | `true` | Hover updates highlight |
| `escapeBehavior` | `EscapeBehavior` | `'close'` | Escape key handling |
| `closeOnOutsideClick` | `boolean` | `true` | Click outside to close |
| `preventScroll` | `boolean` | `true` | Lock body scroll |
| `positioning` | `FloatingConfig` | — | Floating position |
| `portal` | `string \| HTMLElement \| null` | `'body'` | Portal target |
| `forceVisible` | `boolean` | `false` | For custom transitions |
| `name` | `string` | — | Form field name |
| `ids` | `{ ... }` | — | Custom ID overrides |

---

## Return Value

```typescript
const {
  elements: {
    menu,         // Dropdown container
    input,        // Filter input
    option,       // Individual option (function)
    label,        // Associated label
    group,        // Option group
    groupLabel,   // Group heading
    hiddenInput,  // Form submission
    arrow,        // Optional arrow
  },
  states: {
    open,         // Writable<boolean>
    inputValue,   // Writable<string> - current filter text
    touchedInput, // Readable<boolean> - user has typed
    selected,     // Writable<ComboboxOption | ComboboxOption[]>
    highlighted,  // Readable<ComboboxOption | null>
  },
  helpers: {
    isSelected,   // (value) => boolean
    isHighlighted,// (value) => boolean
  },
} = createCombobox();
```

---

## Element Data Attributes

### input
- `[data-state]` — `'open' | 'closed'`
- `[data-disabled]` — present when disabled
- `[data-melt-combobox-input]`

### menu
- `[data-side]` — `'top' | 'bottom' | 'left' | 'right'`
- `[data-align]` — `'start' | 'center' | 'end'`
- `[data-melt-combobox-menu]`

### option
- `[data-value]` — the option value
- `[data-label]` — the option label
- `[data-disabled]` — present when disabled
- `[data-selected]` — present when selected
- `[data-highlighted]` — present when highlighted
- `[data-melt-combobox-option]`

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| input | `role="combobox"`, `aria-expanded`, `aria-controls`, `aria-activedescendant`, `aria-autocomplete` |
| menu | `role="listbox"`, `aria-multiselectable` (when multiple) |
| option | `role="option"`, `aria-selected`, `aria-disabled` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createCombobox, melt } from '@melt-ui/svelte';

  const combobox = createCombobox({
    positioning: { placement: 'bottom', sameWidth: true },
  });

  const { elements: { input, menu, option }, states } = combobox;

  let items = ['Apple', 'Banana', 'Cherry'];

  // Filter items based on input
  const filtered = $derived(
    items.filter(item =>
      item.toLowerCase().includes($states.inputValue.toLowerCase())
    )
  );
</script>

<input
  use:melt={$input}
  class={inputClass}
  data-kind="combobox"
  data-slot="input"
  placeholder="Search..."
/>

{#if $states.open}
  <div
    use:melt={$menu}
    class={menuClass}
    data-kind="combobox"
    data-slot="content"
  >
    {#each filtered as item}
      <div
        use:melt={$option({ value: item, label: item })}
        class={itemClass}
        data-kind="combobox"
        data-slot="item"
      >
        {item}
      </div>
    {:else}
      <div data-kind="combobox" data-slot="empty">
        No results
      </div>
    {/each}
  </div>
{/if}
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `ArrowDown` | Open menu / Highlight next |
| `ArrowUp` | Highlight previous |
| `Enter` | Select highlighted |
| `Escape` | Close menu |
| `Home` | Highlight first |
| `End` | Highlight last |
| `Type` | Filter items |

---

## Combobox vs Select

| Feature | Select | Combobox |
|---------|--------|----------|
| Filter/search | Typeahead only | Full text input |
| Input element | Button | Text input |
| Use case | Known options | Search/autocomplete |

---

## Notes

- `inputValue` updates as user types
- `touchedInput` indicates user interaction
- Filter logic is YOUR responsibility (not Melt's)
- Use `highlightOnHover` to control mouse behavior
