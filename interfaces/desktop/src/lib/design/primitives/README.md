# Primitives

> **Layer 3: Structure + State components. Bound to taxonomy contracts.**

---

## The Contract

Every primitive is bound to a contract in `taxonomy/kinds/primitives/{kind}/contract.ts`.

The contract declares:
- **Slots** - Required, optional, forbidden
- **States** - Shared and kind-specific
- **ARIA requirements** - Applied at block level, NOT here
- **Keyboard requirements** - Applied at block level, NOT here
- **ariaStateProvider** - Which dsAdapter fulfills behavior

---

## What Primitives Provide

| Responsibility | Primitive Provides |
|----------------|--------------------|
| HTML structure | Yes |
| data-kind attribute | Yes |
| data-slot attribute | Yes |
| data-state attribute | Yes (if stateful) |
| State coordination | Yes (via dsAdapter) |
| Context for child slots | Yes |

---

## What Primitives Do NOT Provide

| Responsibility | Primitive Provides |
|----------------|--------------------|
| ARIA attributes | NO - applied at block level |
| role attribute | NO - applied at block level |
| Keyboard handlers | NO - applied at block level |
| Focus management | NO - applied at block level |
| CSS styling | NO - use recipes |

**ARIA is applied at BLOCK RENDER TIME, not at primitive level.**

---

## File Structure

`
primitives/{kind}/
+-- {Kind}.svelte          # Root component
+-- {Kind}Trigger.svelte   # Trigger slot (if applicable)
+-- {Kind}Content.svelte   # Content slot (if applicable)
+-- {Kind}{Slot}.svelte    # Other slots as needed
+-- contract.ts            # Generated platform binding
+-- context.ts             # Svelte context for child slots
+-- types.ts               # Type definitions
+-- index.ts               # Barrel export (SSOT)
+-- {kind}.ts              # Component logic
+-- {Kind}.test.ts         # Tests
+-- {Kind}.test.svelte     # Test harness
`

---

## Contract Binding

Each primitive folder has a `contract.ts` that binds to the taxonomy contract:

`	ypescript
// primitives/tabs/contract.ts
export { contract } from '/design/taxonomy/kinds/primitives/tabs/contract';
`

This ensures the primitive is contractually bound to the SSOT in taxonomy.

---

## Data Attributes

Every primitive element emits exactly **three data attributes**:

| Attribute | Required | Purpose | Example |
|-----------|----------|---------|---------|
| data-kind | ALWAYS | Primitive identity | tabs |
| data-slot | ALWAYS | Slot within primitive | trigger |
| data-state | If stateful | State machine output | selected |

**No other data attributes on primitives. Styling uses classes.**

---

## dsAdapter Model

Primitives receive state coordination from dsAdapter but do NOT receive ARIA.

`
TAXONOMY CONTRACT
    Declares requirements
           |
           v
PRIMITIVE (primitives/{kind}/)
    Structure + state
    data-kind, data-slot, data-state
    NO ARIA
           |
           v
dsADAPTER (api/adapters/{adapter}/_internal/{kind}/)
    Provides state management
    createTabs, createDialog, etc.
           |
           v
BLOCK (blocks/{category}/{Name}.svelte)
    ARIA APPLIED HERE
    Keyboard APPLIED HERE
    Focus management APPLIED HERE
`

---

## Component Pattern

### Root Component (Structure + State Only)

`svelte
<!-- primitives/tabs/Tabs.svelte -->
<script lang="ts">
  import { createTabs } from "/design/taxonomy/.generated/imports.gen";
  import { setTabsContext } from "./context.js";
  import type { TabsProps } from "./types.js";

  let { defaultValue, value, children, class: className }: TabsProps = ();

  // State coordination via dsAdapter
  const tabs = createTabs({ defaultValue: value ?? defaultValue });
  setTabsContext(tabs);
</script>

<!-- Structure only - NO ARIA attributes here -->
<div class={className} data-kind="tabs" data-slot="root">
  {@render children?.()}
</div>
`

### Child Component (Structure + State Only)

`svelte
<!-- primitives/tabs/TabsTrigger.svelte -->
<script lang="ts">
  import { getTabsContext } from "./context.js";
  import type { TabsTriggerProps } from "./types.js";

  let { value, children, class: className }: TabsTriggerProps = ();

  const tabs = getTabsContext();
  const { states: { value: tabValue } } = tabs;
  
  const isSelected = ( === value);
</script>

<!-- Structure only - NO ARIA attributes here -->
<button
  class={className}
  data-kind="tabs"
  data-slot="trigger"
  data-state={isSelected ? "selected" : ""}
>
  {@render children?.()}
</button>
`

---

## Barrel Export Pattern

`	ypescript
// primitives/tabs/index.ts

export { default as Tabs } from './Tabs.svelte';
export { default as TabsList } from './TabsList.svelte';
export { default as TabsTrigger } from './TabsTrigger.svelte';
export { default as TabsContent } from './TabsContent.svelte';

export type {
  TabsProps,
  TabsListProps,
  TabsTriggerProps,
  TabsContentProps,
} from './types.js';

export { contract } from './contract.js';
`

`	ypescript
// primitives/index.ts

export * from './button/index.js';
export * from './tabs/index.js';
export * from './dialog/index.js';
// ... more primitives
`

---

## Checklist

### Before Adding a Primitive

- [ ] Contract exists in `taxonomy/kinds/primitives/{kind}/contract.ts`
- [ ] All required slots defined in contract
- [ ] States defined in contract
- [ ] ariaStateProvider declared in contract

### If ariaStateProvider is meltui

- [ ] Kind in adapter inventory (`taxonomy/api/adapter/meltui/contract.ts`)
- [ ] Factory exists at `api/adapters/meltui/_internal/{kind}/factory.ts`

### File Requirements

- [ ] Root component exists: `{Kind}.svelte`
- [ ] Slot components exist for each required slot
- [ ] `contract.ts` re-exports taxonomy contract
- [ ] `context.ts` provides Svelte context
- [ ] `types.ts` with prop interfaces
- [ ] `index.ts` barrel export
- [ ] Tests exist

### Data Attribute Requirements

- [ ] All elements have data-kind
- [ ] All elements have data-slot
- [ ] Stateful elements have data-state
- [ ] NO ARIA attributes on primitives
- [ ] NO role attributes on primitives
- [ ] NO keyboard handlers on primitives

---

## Forbidden Patterns

| Pattern | Why Forbidden |
|---------|---------------|
| ARIA attributes on primitives | Applied at block level |
| role attribute on primitives | Applied at block level |
| Keyboard handlers on primitives | Applied at block level |
| use:melt on primitives | Old approach, ARIA now at block level |
| `<style>` blocks | Use recipes |
| Direct adapter imports | Use import cloak |

---

## Why No ARIA at Primitive Level?

Primitives do not know their context. The same primitive can be used differently:

| Primitive | Context A | Context B | ARIA Needed |
|-----------|-----------|-----------|-------------|
| dialog | Modal | Alert | role=dialog vs alertdialog |
| button | Form submit | Toolbar toggle | button vs aria-pressed |
| panel | Sidebar | Disclosure | complementary vs expanded |

**The block knows the context. The primitive does not.**

ARIA is applied at block render time where context is known.

---

**Primitives are structure + state. Nothing more.**