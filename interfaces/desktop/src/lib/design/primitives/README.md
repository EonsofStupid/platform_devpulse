# Primitives

> **Layer 3: Behavior components. Melt UI wrappers. Three data attributes only.**

---

## The Contract

Every primitive emits exactly **three data attributes**:

| Attribute | Required | Purpose | Example |
|-----------|----------|---------|---------|
| `data-kind` | ALWAYS | Primitive identity | `"dialog"` |
| `data-slot` | ALWAYS | Slot within primitive | `"content"` |
| `data-state` | If stateful | State machine output | `"open"` |

**No other data attributes on primitives. Styling uses classes.**

---

## Provider Model

```
Melt UI (ARIA + behavior) → _internal (mapping) → ColdLight Primitive
```

| Provider | Owns |
|----------|------|
| **Melt UI** | ARIA attributes, focus, keyboard, IDs |
| **ColdLight** | `data-kind`, `data-slot`, `data-state`, class |

**Primitives never import Melt UI directly. They import from `_internal`.**

---

## Definition

Primitives are **unstyled, accessible behavior components**.

```
Melt UI (ARIA, focus, keyboard) + ColdLight (data-kind, data-slot, data-state)
```

**Primitives do NOT contain:**
- CSS
- Colors
- Styles
- `<style>` blocks

**Primitives do NOT set:**
- `role` attributes
- `aria-*` attributes
- `tabindex`
- Focus trap logic
- Keyboard handlers

Melt UI handles all of this via `use:melt={$element}`.

---

## File Structure

```
primitives/{name}/
├── Root.svelte             # Main component
├── Trigger.svelte          # Trigger slot (if applicable)
├── Content.svelte          # Content slot (if applicable)
├── {Slot}.svelte           # Other slots as needed
├── index.ts                # Barrel export (SSOT)
├── types.ts                # Type definitions
├── a11y.md                 # Accessibility contract
└── {name}.test.ts          # Tests
```

**File naming:** PascalCase for components (Root.svelte, Trigger.svelte).

---

## Checklist

### Before Adding a Primitive

- [ ] Kind exists in `taxonomy/primitiveKinds.ts`
- [ ] Slots exist in `taxonomy/primitiveRegistry.ts`
- [ ] State enum exists if stateful
- [ ] Melt UI has the builder
- [ ] Contract added to `taxonomy/contracts.ts`

### File Requirements

- [ ] `Root.svelte` exists
- [ ] Slot files exist for each registered slot
- [ ] `index.ts` barrel export (SSOT)
- [ ] `types.ts` with prop interfaces
- [ ] `a11y.md` accessibility contract
- [ ] `{name}.test.ts` with tests
- [ ] NO `<style>` blocks
- [ ] NO CSS imports
- [ ] NO raw colors

### Data Attribute Requirements

- [ ] All elements have `data-kind`
- [ ] All elements have `data-slot`
- [ ] Stateful elements have `data-state`
- [ ] `use:melt={$element}` applies ARIA
- [ ] NO other data-* attributes

### Export Requirements

- [ ] Namespace export from `primitives/index.ts`
- [ ] Types exported from `primitives/index.ts`

---

## Integration Pattern

### Root Component

```svelte
<script lang="ts">
  import { createDialog } from '$lib/design/sys/api/_internal/melt';
  import { setContext } from 'svelte';
  import type { DialogRootProps } from './types.js';
  import { DIALOG_CONTEXT_KEY } from './types.js';

  let { open = $bindable(false), onOpenChange, children }: DialogRootProps = $props();

  const dialog = createDialog({
    defaultOpen: open,
    onOpenChange: (details) => {
      open = details.open;
      onOpenChange?.(details.open);
    },
  });

  setContext(DIALOG_CONTEXT_KEY, dialog);

  const dataState = $derived(open ? 'open' : 'closed');
</script>

<div data-kind="dialog" data-slot="root" data-state={dataState}>
  {@render children?.()}
</div>
```

### Child Component

```svelte
<script lang="ts">
  import { melt } from '$lib/design/sys/api/_internal/melt';
  import { getContext } from 'svelte';
  import type { DialogContentProps } from './types.js';
  import { DIALOG_CONTEXT_KEY } from './types.js';

  let { class: className, children }: DialogContentProps = $props();

  const dialog = getContext(DIALOG_CONTEXT_KEY);
  const { elements: { content }, states: { open } } = dialog;
</script>

<!-- use:melt applies all ARIA -->
<div
  use:melt={$content}
  class={className}
  data-kind="dialog"
  data-slot="content"
  data-state={$open ? 'open' : 'closed'}
>
  {@render children?.({ open: $open })}
</div>
```

---

## Barrel Export Pattern

```typescript
// primitives/dialog/index.ts

export { default as Root } from './Root.svelte';
export { default as Trigger } from './Trigger.svelte';
export { default as Content } from './Content.svelte';
export { default as Overlay } from './Overlay.svelte';
export { default as Title } from './Title.svelte';
export { default as Description } from './Description.svelte';
export { default as Close } from './Close.svelte';

export type {
  DialogRootProps,
  DialogTriggerProps,
  DialogContentProps,
  DialogOverlayProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogCloseProps,
} from './types.js';
```

```typescript
// primitives/index.ts

export * as Dialog from './dialog/index.js';
export * as Popover from './popover/index.js';
export * as Tooltip from './tooltip/index.js';
// ... more primitives
```

---

## Usage

```svelte
<script>
  import { Dialog } from '$lib/design/primitives';
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="btn-main v-s1z2l3t1m2">
    Open
  </Dialog.Trigger>
  <Dialog.Content class="panel-main v-s2z1l2t2m1">
    <Dialog.Title>Title</Dialog.Title>
    <Dialog.Description>Description</Dialog.Description>
    <Dialog.Close>Close</Dialog.Close>
  </Dialog.Content>
</Dialog.Root>
```

**Note:** Styling via `class` attribute. Primitives don't style themselves.

---

## Forbidden Patterns

| Pattern | Why Forbidden |
|---------|---------------|
| `<style>` blocks in primitives | Primitives don't style |
| Direct Melt UI imports | Use `_internal` mapping |
| Setting ARIA attributes | Melt UI handles ARIA |
| Adding data-* beyond the three | Breaks contract |
| Inline styles | Use class + recipe |

---

## Audit

```bash
pnpm audit:primitives

# Checks:
# ✅ All primitives have kinds in taxonomy
# ✅ All slots match registry
# ✅ No style blocks
# ✅ No direct Melt imports
# ✅ Three data attributes only
```

---

**Primitives are boring on purpose. Behavior only. No styling.**
