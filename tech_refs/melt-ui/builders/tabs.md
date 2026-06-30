# Tabs Builder

> Tabbed interface with panels.

---

## Import

```typescript
import { createTabs, melt } from '@melt-ui/svelte';
```

---

## createTabs(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `defaultValue` | `string` | — | Initial active tab |
| `value` | `Writable<string>` | — | Controlled value |
| `onValueChange` | `ChangeFn<string>` | — | Value change callback |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Layout direction |
| `activateOnFocus` | `boolean` | `true` | Activate tab on focus |
| `loop` | `boolean` | `false` | Loop keyboard navigation |
| `autoSet` | `boolean` | `true` | Auto-set first tab if no default |

---

## Return Value

```typescript
const {
  elements: {
    root,     // Main container
    list,     // Tab list container
    trigger,  // Tab button (function)
    content,  // Tab panel (function)
  },
  states: {
    value,    // Writable<string>
  },
} = createTabs();
```

---

## Element Data Attributes

### root
- `[data-orientation]` — `'horizontal' | 'vertical'`
- `[data-melt-tabs]`

### list
- `[data-orientation]` — `'horizontal' | 'vertical'`
- `[data-melt-tabs-list]`

### trigger(value)
- `[data-state]` — `'active' | 'inactive'`
- `[data-value]` — tab identifier
- `[data-orientation]` — `'horizontal' | 'vertical'`
- `[data-disabled]` — present when disabled
- `[data-melt-tabs-trigger]`

### content(value)
- `[data-melt-tabs-content]`
- Hidden when inactive (via CSS or conditional render)

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| list | `role="tablist"`, `aria-orientation` |
| trigger | `role="tab"`, `aria-selected`, `aria-controls`, `tabindex` |
| content | `role="tabpanel"`, `aria-labelledby`, `tabindex` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createTabs, melt } from '@melt-ui/svelte';

  const tabs = createTabs({ defaultValue: 'tab1' });
  const { elements: { root, list, trigger, content }, states } = tabs;

  const tabItems = [
    { value: 'tab1', label: 'Tab 1' },
    { value: 'tab2', label: 'Tab 2' },
    { value: 'tab3', label: 'Tab 3' },
  ];
</script>

<div
  use:melt={$root}
  class={rootClass}
  data-kind="tabs"
  data-slot="root"
>
  <div
    use:melt={$list}
    class={listClass}
    data-kind="tabs"
    data-slot="list"
  >
    {#each tabItems as tab}
      <button
        use:melt={$trigger(tab.value)}
        class={triggerClass}
        data-kind="tabs"
        data-slot="trigger"
      >
        {tab.label}
      </button>
    {/each}
  </div>

  {#each tabItems as tab}
    <div
      use:melt={$content(tab.value)}
      class={contentClass}
      data-kind="tabs"
      data-slot="content"
    >
      Content for {tab.label}
    </div>
  {/each}
</div>
```

---

## Keyboard

### Horizontal Orientation

| Key | Action |
|-----|--------|
| `ArrowRight` | Focus next tab |
| `ArrowLeft` | Focus previous tab |
| `Home` | Focus first tab |
| `End` | Focus last tab |

### Vertical Orientation

| Key | Action |
|-----|--------|
| `ArrowDown` | Focus next tab |
| `ArrowUp` | Focus previous tab |
| `Home` | Focus first tab |
| `End` | Focus last tab |

---

## Notes

- `activateOnFocus: true` (default) means focusing a tab activates it
- `activateOnFocus: false` requires Enter/Space to activate after focus
- Content panels can be conditionally rendered or hidden via CSS
