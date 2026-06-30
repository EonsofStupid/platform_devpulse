# Dropdown Menu Builder

> Action menu with trigger button.

---

## Import

```typescript
import { createDropdownMenu, melt } from '@melt-ui/svelte';
```

---

## createDropdownMenu(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `positioning` | `FloatingConfig` | `{ placement: 'bottom' }` | Floating position |
| `arrowSize` | `number` | `8` | Arrow size in pixels |
| `dir` | `'ltr' \| 'rtl'` | `'ltr'` | Text direction |
| `preventScroll` | `boolean` | `true` | Lock body scroll |
| `escapeBehavior` | `EscapeBehavior` | `'close'` | Escape key handling |
| `closeOnOutsideClick` | `boolean` | `true` | Click outside to close |
| `loop` | `boolean` | `false` | Loop keyboard navigation |
| `portal` | `PortalConfig` | `'body'` | Portal target |
| `forceVisible` | `boolean` | `false` | For custom transitions |
| `defaultOpen` | `boolean` | `false` | Initial state |
| `open` | `Writable<boolean>` | — | Controlled state |
| `onOpenChange` | `ChangeFn` | — | State change callback |

---

## Return Value

```typescript
const {
  elements: {
    trigger,    // Opens menu
    menu,       // Menu container
    item,       // Menu item (function)
    separator,  // Visual divider
    arrow,      // Optional arrow
    group,      // Item group
    groupLabel, // Group heading
    overlay,    // Optional backdrop
  },
  states: {
    open,  // Writable<boolean>
  },
  builders: {
    createSubmenu,      // Nested menus
    createCheckboxItem, // Toggle items
    createRadioGroup,   // Single-select items
  },
} = createDropdownMenu();
```

---

## Element Data Attributes

### trigger
- `[data-melt-dropdown-menu-trigger]`
- `[data-state]` — `'open' | 'closed'`

### menu
- `[data-melt-dropdown-menu]`
- `[data-side]` — `'top' | 'bottom' | 'left' | 'right'`
- `[data-align]` — `'start' | 'center' | 'end'`

### item
- `[data-melt-dropdown-menu-item]`
- `[data-highlighted]` — present when highlighted
- `[data-disabled]` — present when disabled

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| trigger | `aria-haspopup="menu"`, `aria-expanded`, `aria-controls` |
| menu | `role="menu"`, `aria-labelledby` |
| item | `role="menuitem"`, `tabindex` |
| separator | `role="separator"` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createDropdownMenu, melt } from '@melt-ui/svelte';

  const menu = createDropdownMenu({
    positioning: { placement: 'bottom-start' },
  });

  const { elements: { trigger, menu: menuEl, item, separator }, states } = menu;
</script>

<button
  use:melt={$trigger}
  class={triggerClass}
  data-kind="dropdown-menu"
  data-slot="trigger"
>
  Actions
</button>

{#if $states.open}
  <div
    use:melt={$menuEl}
    class={menuClass}
    data-kind="dropdown-menu"
    data-slot="content"
  >
    <button
      use:melt={$item()}
      class={itemClass}
      data-kind="dropdown-menu"
      data-slot="item"
    >
      Edit
    </button>

    <button
      use:melt={$item()}
      class={itemClass}
      data-kind="dropdown-menu"
      data-slot="item"
    >
      Duplicate
    </button>

    <div
      use:melt={$separator}
      class={separatorClass}
      data-kind="dropdown-menu"
      data-slot="separator"
    />

    <button
      use:melt={$item()}
      class={itemClass}
      data-kind="dropdown-menu"
      data-slot="item"
    >
      Delete
    </button>
  </div>
{/if}
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open menu / Select item |
| `ArrowDown` | Open menu / Highlight next |
| `ArrowUp` | Highlight previous |
| `ArrowRight` | Open submenu |
| `ArrowLeft` | Close submenu |
| `Escape` | Close menu |
| `Home` | Highlight first item |
| `End` | Highlight last item |
| `Type` | Jump to matching item |

---

## Submenus

```svelte
<script>
  const { builders: { createSubmenu } } = menu;
  const submenu = createSubmenu();
</script>

<div use:melt={$submenu.trigger}>
  More options →
</div>

{#if $submenu.states.open}
  <div use:melt={$submenu.menu}>
    <button use:melt={$submenu.item()}>Sub item 1</button>
    <button use:melt={$submenu.item()}>Sub item 2</button>
  </div>
{/if}
```

---

## Checkbox Items

```svelte
<script>
  const { builders: { createCheckboxItem } } = menu;
  const checkboxItem = createCheckboxItem({
    defaultChecked: true,
  });
</script>

<button use:melt={$checkboxItem}>
  {#if $checkboxItem.states.checked}✓{/if}
  Show sidebar
</button>
```

---

## Notes

- Use for action menus (edit, delete, etc.)
- Use Context Menu for right-click menus
- Separators are decorative (excluded from navigation)
- Items can be links (`<a>`) or buttons
