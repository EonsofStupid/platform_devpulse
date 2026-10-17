# Melt UI — Svelte 5 Rune Integration

> Patterns for using Melt UI with Svelte 5's runes (`$state`, `$derived`, `$effect`).

## Current State

Melt UI was originally built for Svelte 4 using Svelte stores (`Writable`, `$store`).
Svelte 5 introduces runes as the primary reactivity system. Melt UI builders return
stores, which still work in Svelte 5 but can be bridged to runes.

## Store ↔ Rune Bridge

### Reading Stores in Svelte 5

Svelte 5 still supports `$store` syntax for reading stores:

```svelte
<script>
  import { createDialog } from "@melt-ui/svelte";

  const {
    elements: { trigger, content, title, close, overlay },
    states: { open },
  } = createDialog();

  // $open works the same as Svelte 4
  // No migration needed for reading
</script>

<button use:melt={$trigger}>Open</button>
{#if $open}
  <div use:melt={$content}>...</div>
{/if}
```

### Controlled State with Runes

To control Melt builders from rune state:

```svelte
<script>
  import { createDialog } from "@melt-ui/svelte";
  import { writable } from "svelte/store";

  // Rune state
  let isOpen = $state(false);

  // Bridge rune → store
  const openStore = writable(isOpen);

  // Sync rune → store
  $effect(() => {
    openStore.set(isOpen);
  });

  // Sync store → rune
  openStore.subscribe((val) => {
    isOpen = val;
  });

  const { elements } = createDialog({
    open: openStore,
  });
</script>
```

### Utility: Rune-to-Store Bridge

Create a reusable bridge:

```typescript
// lib/rune-store-bridge.ts
import { writable, type Writable } from "svelte/store";

/**
 * Creates a Svelte store that stays in sync with a rune getter/setter.
 * Use this to pass rune state to Melt UI builders.
 */
export function runeToStore<T>(
  get: () => T,
  set: (v: T) => void
): Writable<T> {
  const store = writable(get());

  // Sync changes from store → rune
  store.subscribe((val) => {
    if (val !== get()) {
      set(val);
    }
  });

  // We need $effect to sync rune → store, which must be called in component context
  return {
    subscribe: store.subscribe,
    set: (val: T) => {
      store.set(val);
      set(val);
    },
    update: (fn: (val: T) => T) => {
      store.update((current) => {
        const next = fn(current);
        set(next);
        return next;
      });
    },
  };
}
```

Usage:

```svelte
<script>
  import { createSelect } from "@melt-ui/svelte";
  import { runeToStore } from "$lib/rune-store-bridge";

  let selectedCountry = $state("US");
  const selectedStore = runeToStore(
    () => ({ value: selectedCountry, label: selectedCountry }),
    (v) => { selectedCountry = v.value; }
  );

  const { elements } = createSelect({
    selected: selectedStore,
  });
</script>
```

## Svelte 5 Component Pattern

### Props with Runes

```svelte
<!-- Dialog.svelte -->
<script>
  import { createDialog } from "@melt-ui/svelte";

  // Svelte 5 props
  let {
    open = $bindable(false),
    modal = true,
    children,
    ...restProps
  } = $props();

  // Bridge bindable prop to store
  import { writable } from "svelte/store";
  const openStore = writable(open);
  $effect(() => { openStore.set(open); });
  openStore.subscribe((v) => { open = v; });

  const {
    elements: { trigger, overlay, content, title, description, close },
  } = createDialog({
    open: openStore,
    preventScroll: modal,
    closeOnEscape: true,
    closeOnOutsideClick: true,
  });

  // Export element builders for compound component pattern
  // setContext("dialog", { elements, states });
</script>

<slot {trigger} {overlay} {content} {title} {description} {close} />
```

### Compound Components with Context

```svelte
<!-- DialogRoot.svelte -->
<script>
  import { createDialog } from "@melt-ui/svelte";
  import { setContext } from "svelte";

  const dialog = createDialog();
  setContext("dialog", dialog);
</script>

{@render children?.()}

<!-- DialogTrigger.svelte -->
<script>
  import { getContext } from "svelte";
  const { elements: { trigger } } = getContext("dialog");
</script>

<button use:melt={$trigger}>
  {@render children?.()}
</button>

<!-- DialogContent.svelte -->
<script>
  import { getContext } from "svelte";
  const { elements: { content, overlay }, states: { open } } = getContext("dialog");
</script>

{#if $open}
  <div use:melt={$overlay} class="dialog-overlay" />
  <div use:melt={$content} class="dialog-content">
    {@render children?.()}
  </div>
{/if}
```

## Svelte 5 Snippet Pattern

Use Svelte 5 snippets instead of slots:

```svelte
<script>
  import { createSelect } from "@melt-ui/svelte";
  import type { Snippet } from "svelte";

  let {
    items,
    placeholder = "Select...",
    renderItem,
  }: {
    items: Array<{ value: string; label: string }>;
    placeholder?: string;
    renderItem?: Snippet<[{ item: typeof items[0]; isSelected: boolean }]>;
  } = $props();

  const {
    elements: { trigger, menu, option },
    states: { open, selectedLabel },
    helpers: { isSelected },
  } = createSelect();
</script>

<button use:melt={$trigger}>
  {$selectedLabel || placeholder}
</button>

{#if $open}
  <div use:melt={$menu}>
    {#each items as item}
      <div use:melt={$option({ value: item.value, label: item.label })}>
        {#if renderItem}
          {@render renderItem({ item, isSelected: $isSelected(item.value) })}
        {:else}
          {item.label}
        {/if}
      </div>
    {/each}
  </div>
{/if}
```

## Key Differences: Svelte 4 vs 5

| Feature | Svelte 4 | Svelte 5 |
|---|---|---|
| **Reactive state** | `let x = 0; $: y = x * 2` | `let x = $state(0); let y = $derived(x * 2)` |
| **Props** | `export let prop` | `let { prop } = $props()` |
| **Bindable** | `export let prop` (auto) | `let { prop = $bindable() } = $props()` |
| **Side effects** | `$: { doSomething(x) }` | `$effect(() => { doSomething(x) })` |
| **Slots** | `<slot>` | `{@render children?.()}` |
| **Named slots** | `<slot name="header">` | `{@render header?.()}` (snippets) |
| **Events** | `dispatch("change")` | Callback props |
| **Stores** | `$store` (auto-subscribe) | `$store` (still works) or `.get()` |

## Melt UI + Runes: Practical Examples

### Reactive Filtering (Combobox)

```svelte
<script>
  import { createCombobox } from "@melt-ui/svelte";

  const allItems = [
    { value: "react", label: "React" },
    { value: "svelte", label: "Svelte" },
    { value: "vue", label: "Vue" },
  ];

  const {
    elements: { input, menu, option },
    states: { inputValue, open },
  } = createCombobox();

  // Svelte 5: $derived for filtered items
  let filteredItems = $derived(
    allItems.filter((item) =>
      item.label.toLowerCase().includes(($inputValue ?? "").toLowerCase())
    )
  );
</script>

<input use:melt={$input} placeholder="Search frameworks..." />

{#if $open}
  <ul use:melt={$menu}>
    {#each filteredItems as item}
      <li use:melt={$option({ value: item.value, label: item.label })}>
        {item.label}
      </li>
    {:else}
      <li>No results</li>
    {/each}
  </ul>
{/if}
```

### Form Integration

```svelte
<script>
  import { createSelect, createCheckbox } from "@melt-ui/svelte";

  let formData = $state({
    country: "",
    terms: false,
  });

  const select = createSelect({
    onSelectedChange: ({ next }) => {
      formData.country = next?.value ?? "";
      return next;
    },
  });

  const checkbox = createCheckbox({
    onCheckedChange: ({ next }) => {
      formData.terms = next === true;
      return next;
    },
  });

  function handleSubmit() {
    console.log("Form data:", formData);
  }
</script>
```

## Looking Ahead: bits-ui

[bits-ui](https://bits-ui.com) is the styled component layer built on top of Melt UI.
It provides pre-built Svelte components with the Melt builders already wired up:

```svelte
<script>
  import { Dialog, Select } from "bits-ui";
</script>

<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

bits-ui is to Melt UI what Radix UI is to Radix Primitives — a higher-level abstraction.
Consider using bits-ui if you want pre-composed components rather than raw builders.
