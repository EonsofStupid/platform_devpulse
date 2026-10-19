# ColdLight Primitives

> Melt UI wrappers with ColdLight taxonomy for @devpulse/coldlight

---

## Overview

Primitives are **thin wrappers around Melt UI** builders. They handle:

| Melt UI Provides | ColdLight Provides |
|-----------------|-------------------|
| ARIA attributes (`role`, `aria-*`) | `data-kind` (primitive identity) |
| Focus management | `data-slot` (slot identification) |
| Keyboard navigation | `data-state` (visual state) |
| ID generation | `data-id` (user-controlled) |
| Event handlers | Type system (Props interfaces) |

**Styling comes from recipes**, not primitives.

---

## Principle

```
Primitives = Behavior (Melt UI) + Taxonomy (ColdLight)
Recipes = Appearance (CSS)
```

Primitives don't import CSS, don't define styles, don't have `<style>` blocks.

---

## File Structure

Every primitive follows this structure:

```
primitives/{name}/
├── {name}.svelte           # Main component
├── {name}.trigger.svelte   # Trigger slot (if applicable)
├── {name}.content.svelte   # Content slot (if applicable)
├── {name}.{slot}.svelte    # Other slots
├── index.ts                # Barrel export (imports/exports ONLY)
├── types.ts                # Type definitions
├── a11y.md                 # Accessibility contract
└── {name}.test.ts          # Tests
```

---

## Integration Pattern

### Root Component

```svelte
<script lang="ts">
  import { createDialog, melt } from '@melt-ui/svelte';
  import { setContext } from 'svelte';
  import { DIALOG_CONTEXT_KEY, type DialogRootProps, type DialogState } from './types.js';

  let {
    open = $bindable(false),
    onOpenChange,
    children,
    "data-id": dataId,
  }: DialogRootProps = $props();

  // Create Melt builder
  const dialog = createDialog({
    defaultOpen: open,
    onOpenChange: (details) => {
      open = details.open;
      onOpenChange?.(details.open);
    },
  });

  // Share via context
  setContext(DIALOG_CONTEXT_KEY, dialog);

  // ColdLight state
  const dataState: DialogState = $derived(open ? 'open' : 'closed');
</script>

<div
  data-kind="dialog"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  {#if children}
    {@render children()}
  {/if}
</div>
```

### Content Component (with use:melt)

```svelte
<script lang="ts">
  import { melt } from '@melt-ui/svelte';
  import { getContext } from 'svelte';
  import { DIALOG_CONTEXT_KEY, type DialogContentProps, type DialogState } from './types.js';

  let {
    children,
    class: className = '',
    "data-id": dataId,
    ...rest
  }: DialogContentProps = $props();

  // Get builder from context
  const dialog = getContext(DIALOG_CONTEXT_KEY);
  const { elements: { content }, states: { open } } = dialog;

  // ColdLight state
  const dataState: DialogState = $derived($open ? 'open' : 'closed');
</script>

<!-- use:melt applies all ARIA -->
<div
  use:melt={$content}
  class={className}
  data-kind="dialog"
  data-slot="content"
  data-state={dataState}
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children({ open: $open })}
  {/if}
</div>
```

---

## Available Primitives

### Dialog

Modal dialog with focus trap and overlay.

```svelte
<script>
  import { Dialog } from '#coldlight/primitives';
</script>

<Dialog.Root bind:open>
  <Dialog.Trigger class="dp-surface" data-surface="glass">
    Open
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="dp-surface" data-surface="glass" />
    <Dialog.Content class="dp-surface" data-surface="glass">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Content</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Select

Dropdown selection with typeahead.

```svelte
<script>
  import { Select } from '#coldlight/primitives';
</script>

<Select.Root bind:value>
  <Select.Trigger class="dp-surface" data-surface="glass">
    <Select.Value placeholder="Select..." />
  </Select.Trigger>
  <Select.Content class="dp-surface" data-surface="glass">
    <Select.Item value="a">Option A</Select.Item>
    <Select.Item value="b">Option B</Select.Item>
  </Select.Content>
</Select.Root>
```

### Tabs

Tabbed interface navigation.

```svelte
<script>
  import { Tabs } from '#coldlight/primitives';
</script>

<Tabs.Root value="tab1">
  <Tabs.List class="dp-surface" data-surface="glass">
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs.Root>
```

### Popover

Floating content anchored to trigger.

```svelte
<script>
  import { Popover } from '#coldlight/primitives';
</script>

<Popover.Root>
  <Popover.Trigger class="dp-surface" data-surface="glass">
    Open popover
  </Popover.Trigger>
  <Popover.Content class="dp-surface" data-surface="glass">
    Popover content
    <Popover.Arrow />
  </Popover.Content>
</Popover.Root>
```

### Tooltip

Non-modal informational popup.

```svelte
<script>
  import { Tooltip } from '#coldlight/primitives';
</script>

<Tooltip.Root>
  <Tooltip.Trigger>Hover me</Tooltip.Trigger>
  <Tooltip.Content class="dp-surface" data-surface="glass">
    Tooltip text
    <Tooltip.Arrow />
  </Tooltip.Content>
</Tooltip.Root>
```

---

## Why This Pattern?

1. **ARIA correctness** — Melt UI handles all accessibility
2. **Separation of concerns** — Behavior is reusable, styling is swappable
3. **Taxonomy enforcement** — Every element has data-kind/slot/state
4. **Type safety** — Full TypeScript coverage
5. **Testability** — data-id for stable test selectors

---

## What Primitives Are NOT

- NOT styled components
- NOT a replacement for recipes
- NOT component library components

To get a "ColdLight button," combine:

```svelte
<!-- Primitive (behavior) + Recipe (appearance) -->
<button
  use:melt={$trigger}
  class="dp-surface"
  data-kind="dialog"
  data-slot="trigger"
  data-surface="glass"
>
  ColdLight Button
</button>
```

---

## Adding New Primitives

**TAXONOMY FIRST:**

1. Verify kind exists in `taxonomy/primitiveKinds.ts`
2. Verify slots exist in `taxonomy/primitiveRegistry.ts`
3. Check Melt UI has the builder
4. Create folder `primitives/{name}/`
5. Implement all slot components
6. Write tests (minimum counts enforced)
7. Document accessibility in `a11y.md`
8. Export from `primitives/index.ts`

**Rules:**

- File naming: `{name}.svelte`, `{name}.{slot}.svelte`
- No `<style>` blocks
- No CSS imports
- `index.ts` is imports/exports only
- Every element has `data-kind`, `data-slot`
- Stateful elements have `data-state`

---

**This is the canonical primitives reference.**
