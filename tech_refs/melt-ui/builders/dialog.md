# Dialog Builder

> Modal dialog or alert dialog pattern.

---

## Import

```typescript
import { createDialog, melt } from '@melt-ui/svelte';
```

---

## createDialog(options?)

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `role` | `'dialog' \| 'alertdialog'` | `'dialog'` | ARIA role |
| `preventScroll` | `boolean` | `true` | Lock body scroll |
| `escapeBehavior` | `EscapeBehavior` | `'close'` | Escape key handling |
| `closeOnOutsideClick` | `boolean` | `true` | Click overlay to close |
| `portal` | `string \| HTMLElement \| null` | `'body'` | Portal target |
| `forceVisible` | `boolean` | `false` | For custom transitions |
| `openFocus` | `FocusProp` | — | Override focus on open |
| `closeFocus` | `FocusProp` | — | Override focus on close |
| `defaultOpen` | `boolean` | `false` | Initial state |
| `open` | `Writable<boolean>` | — | Controlled state |
| `onOpenChange` | `ChangeFn<boolean>` | — | State change callback |
| `ids` | `{ content?, title?, description? }` | — | Custom ID overrides |

### EscapeBehavior

```typescript
type EscapeBehavior =
  | 'close'
  | 'ignore'
  | 'defer-otherwise-close'
  | 'defer-otherwise-ignore';
```

---

## Return Value

```typescript
const {
  elements: {
    trigger,      // Opens dialog
    portalled,    // Portal container
    overlay,      // Background overlay
    content,      // Main dialog container
    title,        // Accessible title (aria-labelledby)
    description,  // Accessible description (aria-describedby)
    close,        // Closes dialog
  },
  states: {
    open,         // Writable<boolean>
  },
} = createDialog();
```

---

## Element Data Attributes

### trigger
- `[data-melt-dialog-trigger]`

### overlay
- `[data-state]` — `'open' | 'closed'`
- `[data-melt-dialog-overlay]`

### content
- `[data-state]` — `'open' | 'closed'`
- `[data-melt-dialog-content]`

### title
- `[data-melt-dialog-title]`

### description
- `[data-melt-dialog-description]`

### close
- `[data-melt-dialog-close]`

---

## ARIA (Melt UI Handles)

| Element | Melt Sets |
|---------|-----------|
| trigger | `aria-haspopup="dialog"`, `aria-expanded` |
| content | `role="dialog"` or `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| title | `id` (linked to aria-labelledby) |
| description | `id` (linked to aria-describedby) |

---

## ColdLight Pattern

```svelte
<script lang="ts">
  import { createDialog, melt } from '@melt-ui/svelte';
  import type { DialogRootProps } from './types.js';

  let { open = $bindable(false), children, "data-id": dataId }: DialogRootProps = $props();

  const openStore = writable(open);
  $effect(() => { openStore.set(open); });
  $effect(() => { open = $openStore; });

  const dialog = createDialog({
    open: openStore,
    role: 'dialog',
  });

  const { elements, states } = dialog;
</script>

<div data-kind="dialog" data-slot="root" data-state={$states.open ? "open" : "closed"} data-id={dataId}>
  <!-- Pass elements via context or props -->
</div>
```

---

## Keyboard

| Key | Action |
|-----|--------|
| `Tab` | Move focus within dialog |
| `Shift+Tab` | Move focus backward |
| `Escape` | Close dialog (unless escapeBehavior='ignore') |

---

## Focus Management

1. On open: Focus moves to first focusable element in content (or override with `openFocus`)
2. While open: Focus trapped within content
3. On close: Focus returns to trigger (or override with `closeFocus`)
