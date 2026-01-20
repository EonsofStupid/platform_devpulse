# ColdLight Primitives

> Bits UI wrapper reference for @devpulse/coldlight

---

## Overview

Primitives are **thin wrappers around Bits UI** components. They handle behavior (focus, keyboard, accessibility) with **no styling**.

Styling comes from recipes applied via `class` and `data-*` attributes.

---

## Principle

```
Primitives = Behavior (Bits UI)
Recipes = Appearance (CSS)
```

Primitives don't import CSS, don't define styles, don't have `<style>` blocks.

---

## Available Primitives

### Button

Wraps Bits UI Button for click interactions.

```svelte
<script>
  import { Button } from '@devpulse/coldlight/primitives';
</script>

<Button class="dp-surface" data-surface="glass" data-role="button">
  Click me
</Button>
```

**Props**: Inherits all Bits UI Button props.

### Dialog

Wraps Bits UI Dialog for modal overlays.

```svelte
<script>
  import { Dialog } from '@devpulse/coldlight/primitives';
</script>

<Dialog.Root>
  <Dialog.Trigger class="dp-surface" data-surface="glass" data-role="button">
    Open
  </Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay class="dp-surface" data-surface="glass" data-role="scrim" />
    <Dialog.Content class="dp-surface" data-surface="glass" data-role="panel">
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Content</Dialog.Description>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

### Toggle

Wraps Bits UI Toggle for boolean switches.

```svelte
<script>
  import { Toggle } from '@devpulse/coldlight/primitives';
  let pressed = $state(false);
</script>

<Toggle bind:pressed class="dp-surface" data-surface="glass" data-role="button">
  {pressed ? 'On' : 'Off'}
</Toggle>
```

### Tabs

Wraps Bits UI Tabs for tab navigation.

```svelte
<script>
  import { Tabs } from '@devpulse/coldlight/primitives';
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

### Accordion

Wraps Bits UI Accordion for collapsible sections.

```svelte
<script>
  import { Accordion } from '@devpulse/coldlight/primitives';
</script>

<Accordion.Root>
  <Accordion.Item value="item1">
    <Accordion.Trigger class="dp-surface" data-surface="glass" data-role="button">
      Section 1
    </Accordion.Trigger>
    <Accordion.Content>Content 1</Accordion.Content>
  </Accordion.Item>
</Accordion.Root>
```

### Popover

Wraps Bits UI Popover for floating content.

```svelte
<script>
  import { Popover } from '@devpulse/coldlight/primitives';
</script>

<Popover.Root>
  <Popover.Trigger class="dp-surface" data-surface="glass" data-role="button">
    Open popover
  </Popover.Trigger>
  <Popover.Content class="dp-surface" data-surface="glass" data-role="panel">
    Popover content
  </Popover.Content>
</Popover.Root>
```

### Select

Wraps Bits UI Select for dropdown selection.

```svelte
<script>
  import { Select } from '@devpulse/coldlight/primitives';
</script>

<Select.Root>
  <Select.Trigger class="dp-surface" data-surface="glass" data-role="button">
    <Select.Value placeholder="Select..." />
  </Select.Trigger>
  <Select.Content class="dp-surface" data-surface="glass" data-role="panel">
    <Select.Item value="a">Option A</Select.Item>
    <Select.Item value="b">Option B</Select.Item>
  </Select.Content>
</Select.Root>
```

---

## Why Primitives?

1. **Accessibility built-in** — Bits UI handles ARIA, focus management, keyboard navigation
2. **Separation of concerns** — Behavior is reusable, styling is swappable
3. **Consistency** — Same interaction patterns everywhere
4. **Maintenance** — Bits UI updates don't break our styles

---

## What Primitives Are NOT

- NOT styled components
- NOT a replacement for recipes
- NOT component library components

To get a "ColdLight button," combine:

```svelte
<!-- Primitive (behavior) + Recipe (appearance) -->
<Button class="dp-surface" data-surface="glass" data-role="button">
  ColdLight Button
</Button>
```

---

## Adding New Primitives

1. Check if Bits UI has the component
2. Create wrapper in `primitives/`
3. Export from `primitives/index.ts`
4. Document here

**Rules**:
- No `<style>` blocks
- No CSS imports
- No direct styling logic
- Only re-export Bits UI with ColdLight API
