# Progress Builder

> Progress bar indicator.

---

## Import

```typescript
import { createProgress, melt } from '@melt-ui/svelte';
```

---

## createProgress(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `max` | `number` | `100` | Maximum value |
| `defaultValue` | `number \| null` | `0` | Initial value (null = indeterminate) |
| `value` | `Writable<number \| null>` | — | Controlled value |
| `onValueChange` | `ChangeFn` | — | Value change callback |

---

## Return Value

```typescript
const {
  elements: {
    root,  // Progress container
  },
  states: {
    value,  // Writable<number | null>
  },
} = createProgress();
```

---

## Element Data Attributes

### root
- `[data-melt-progress]`
- `[data-value]` — current value (or empty if indeterminate)
- `[data-max]` — maximum value
- `[data-state]` — `'indeterminate' | 'loading' | 'complete'`

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| root | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-valuetext` |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createProgress, melt } from '@melt-ui/svelte';

  const progress = createProgress({
    defaultValue: 60,
    max: 100,
  });

  const { elements: { root }, states } = progress;

  const percentage = $derived(($states.value ?? 0) / 100 * 100);
</script>

<div
  use:melt={$root}
  class={rootClass}
  data-kind="progress"
  data-slot="root"
>
  <div
    class={indicatorClass}
    data-kind="progress"
    data-slot="indicator"
    style="width: {percentage}%"
  />
</div>

<p>{$states.value}%</p>
```

---

## States

### Loading (0-99)
```svelte
<script>
  states.value.set(45);
</script>
<!-- [data-state="loading"] -->
```

### Complete (100)
```svelte
<script>
  states.value.set(100);
</script>
<!-- [data-state="complete"] -->
```

### Indeterminate (null)
```svelte
<script>
  states.value.set(null);
</script>
<!-- [data-state="indeterminate"] -->
```

---

## Styling

```css
[data-kind="progress"][data-slot="root"] {
  width: 100%;
  height: 8px;
  background: var(--color-neutral-200);
  border-radius: 4px;
  overflow: hidden;
}

[data-kind="progress"][data-slot="indicator"] {
  height: 100%;
  background: var(--color-primary-500);
  transition: width 200ms ease;
}

/* Indeterminate animation */
[data-kind="progress"][data-slot="root"][data-state="indeterminate"]
[data-kind="progress"][data-slot="indicator"] {
  width: 50%;
  animation: indeterminate 1.5s infinite ease-in-out;
}

@keyframes indeterminate {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(200%); }
}
```

---

## Notes

- Indicator is styled child element (not Melt-controlled)
- Use `null` value for indeterminate/spinner states
- State attribute changes: `loading` → `complete`
- Accessible to screen readers via ARIA
