# Switch Builder

> On/off toggle control.

---

## Import

```typescript
import { createSwitch, melt } from '@melt-ui/svelte';
```

---

## createSwitch(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Disable switch |
| `required` | `boolean` | `false` | Required for form |
| `name` | `string` | — | Form field name |
| `value` | `string` | — | Form field value |
| `defaultChecked` | `boolean` | `false` | Initial state |
| `checked` | `Writable<boolean>` | — | Controlled state |
| `onCheckedChange` | `ChangeFn` | — | State change callback |

---

## Return Value

```typescript
const {
  elements: {
    root,   // Switch element
    input,  // Hidden input for forms
  },
  states: {
    checked,  // Writable<boolean>
  },
} = createSwitch();
```

---

## Element Data Attributes

### root
- `[data-melt-switch]`
- `[data-state]` — `'checked' | 'unchecked'`
- `[data-disabled]` — present when disabled

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| root | `role="switch"`, `aria-checked`, `aria-required`, `aria-disabled` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createSwitch, melt } from '@melt-ui/svelte';

  const switchControl = createSwitch({
    defaultChecked: false,
  });

  const { elements: { root }, states } = switchControl;
</script>

<button
  use:melt={$root}
  class={switchClass}
  data-kind="switch"
  data-slot="root"
>
  <span
    class={thumbClass}
    data-kind="switch"
    data-slot="thumb"
  />
</button>

<label>Dark mode</label>
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `Space` | Toggle checked state |
| `Enter` | Toggle checked state |

---

## Styling

```css
/* Track */
[data-kind="switch"][data-slot="root"] {
  width: 44px;
  height: 24px;
  border-radius: 12px;
  background: var(--color-neutral-300);
}

[data-kind="switch"][data-slot="root"][data-state="checked"] {
  background: var(--color-primary-500);
}

/* Thumb */
[data-kind="switch"][data-slot="thumb"] {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: white;
  transform: translateX(2px);
  transition: transform 150ms;
}

[data-kind="switch"][data-slot="root"][data-state="checked"]
[data-kind="switch"][data-slot="thumb"] {
  transform: translateX(22px);
}
```

---

## Switch vs Checkbox

| Aspect | Switch | Checkbox |
|--------|--------|----------|
| Semantics | Immediate action | Selection for later |
| States | 2 (on/off) | 3 (checked/unchecked/indeterminate) |
| Use case | Settings, preferences | Forms, agreements |

---

## Notes

- Use for immediate effect toggles (dark mode, notifications)
- Use checkbox for forms with submit action
- Style thumb as child element (not via Melt)
- Animate thumb position with CSS transitions
