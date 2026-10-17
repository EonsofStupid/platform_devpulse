# Sprint 01 — Foundation Primitives (Golden Example)

> **Scope**: Button, Dialog, Tabs
> **Goal**: Establish the golden implementation pattern for all 49 primitives.
> **Gate**: `pnpm svelte-check` passes. Scanner validates parity. Every file has JSDoc.
> **Created**: 2026-01-30
> **Status**: PLANNED

---

## Why This Sprint Matters

This sprint builds the **three reference implementations** that every future primitive copies from:

| Kind | ariaStateProvider | Pattern | Why It's Golden |
|------|-------------------|---------|-----------------|
| **Button** | `coldlight` | Simple (1 component, native HTML) | Proves 2-folder parity: taxonomy + primitive. No adapter needed. |
| **Dialog** | `meltui` | Compound (8 slot components) | Proves 3-folder parity: taxonomy + adapter + primitive. Full dsAdapter lifecycle. |
| **Tabs** | `meltui` | Compound (4 slot components) | Proves compound with parameterized builders (`trigger(value)`, `content(value)`). |

After this sprint, every subsequent sprint is **copy-paste-modify** from these three patterns.

---

## Pre-Conditions (What Already Exists)

| Layer | Button | Dialog | Tabs |
|-------|--------|--------|------|
| **Taxonomy types** (`taxonomy/types.ts`) | ✅ PrimitiveContract, SlotStateMap, StateToken | ✅ | ✅ |
| **Taxonomy barrel** (`taxonomy/kinds/primitives/index.ts`) | ✅ Expects `./button/index.js` | ✅ Expects `./dialog/index.js` | ✅ Expects `./tabs/index.js` |
| **Taxonomy contract** (`taxonomy/kinds/primitives/{kind}/`) | ❌ MISSING | ❌ MISSING | ❌ MISSING |
| **dsAdapter factory** (`api/adapters/meltui/_internal/{kind}/`) | N/A (coldlight) | ✅ factory.ts, types.ts, dialog.ts, index.ts | ✅ factory.ts, types.ts, tabs.ts, index.ts |
| **Import cloak** (`taxonomy/.generated/imports.gen.ts`) | N/A | ✅ createDialog, DialogInstance, DialogConfig | ✅ createTabs, TabsInstance, TabsConfig, melt |
| **Foundation** (`primitives/types.ts`) | ✅ DATA_ATTRS, cn, stripStyleProp, OmitStyle, BaseProps | ✅ | ✅ |
| **Primitive folder** (`primitives/{kind}/`) | ❌ DELETED | ❌ DELETED | ❌ DELETED |

---

## Deliverables Per Kind

### Taxonomy Contract (Step 0)

Every kind gets a folder at `taxonomy/kinds/primitives/{kind}/` with two files:

```
taxonomy/kinds/primitives/{kind}/
├── contract.ts    # PrimitiveContract — SSOT for slots, states, collections
└── index.ts       # Barrel re-export
```

The contract declares:
- `kind` — literal string identifier
- `ariaStateProvider` — `"meltui"` or `"coldlight"`
- `slots` — `{ required, optional, forbidden }`
- `states` — `{ shared, specific }`
- `slotStates` — which states each slot can have
- `slotActions` — actions per slot (empty arrays for now)
- `collections` — ARIA requirements and keyboard interactions (declared here, applied at blocks)

### Primitive Implementation (Steps 2-5)

```
primitives/{kind}/
├── contract.ts              # Re-exports taxonomy contract (binding)
├── types.ts                 # Slots array, state type, context key, props interfaces
├── context.ts               # Svelte context helpers (compound only)
├── {Kind}.svelte            # Root component
├── {Kind}{Slot}.svelte      # Per-slot components (compound only)
├── index.ts                 # Barrel export (imports/exports ONLY, zero logic)
├── {Kind}.test.svelte       # Test harness component
└── {Kind}.test.ts           # vitest tests
```

---

## BUTTON — Full Specification

### Button Taxonomy Contract

**File**: `taxonomy/kinds/primitives/button/contract.ts`

```typescript
kind: "button"
ariaStateProvider: "coldlight"    // Native <button> handles ARIA. No adapter.

slots:
  required: ["root"]
  optional: ["icon", "label"]
  forbidden: []

states:
  shared: ["focused", "focus-visible", "hover", "active", "disabled"]
  specific: ["pressed", "loading", "busy"]

slotStates:
  root:  ["focused", "focus-visible", "hover", "active", "disabled", "pressed", "loading", "busy"]
  icon:  []
  label: []

slotActions:
  root: [], icon: [], label: []

collections:
  aria:     { role: "button", requiredAttrs: [], optionalAttrs: ["aria-pressed", "aria-disabled", "aria-busy"] }
  keyboard: ["Enter", "Space"]
```

### Button Primitive Types

**File**: `primitives/button/types.ts`

| Export | Type | Value |
|--------|------|-------|
| `ButtonSlots` | `const` | `["root", "icon", "label"] as const` |
| `ButtonSlot` | `type` | `"root" \| "icon" \| "label"` |
| `ButtonState` | `type` | `"default" \| "pressed" \| "loading" \| "disabled"` |
| `BUTTON_CONTEXT_KEY` | `const` | `"coldlight-button"` |
| `ButtonSize` | `type` | `"sm" \| "md" \| "lg"` |
| `ButtonVariant` | `type` | `"default" \| "ghost" \| "outline" \| "destructive"` |

**Props**:

| Interface | Extends | Fields |
|-----------|---------|--------|
| `ButtonProps` | `OmitStyle<HTMLButtonElement>` | `children?: Snippet`, `variant?: ButtonVariant`, `size?: ButtonSize`, `disabled?: boolean`, `loading?: boolean`, `"data-id"?: string` |

### Button Components

**1 file**: `Button.svelte`

- Native `<button>` element
- `data-kind="button"`, `data-slot="root"`, `data-state={computed}`
- NO `use:melt` (coldlight provider — native HTML)
- NO ARIA attributes (native `<button>` + contract declares, blocks apply)
- `stripStyleProp(rest, 'Button')`
- `{...rest}` passthrough for HTML attributes
- `{@render children()}` for content

### Button Barrel

**File**: `primitives/button/index.ts`

```
Exports:
  - default as Button (from Button.svelte)
  - type ButtonProps, ButtonState, ButtonSlot, ButtonSize, ButtonVariant
  - ButtonSlots, BUTTON_CONTEXT_KEY
  - contract (from ./contract.ts)
```

### Button Test Requirements (15+ tests)

| Category | Tests |
|----------|-------|
| Data attributes | `data-kind="button"`, `data-slot="root"`, `data-state` reflects disabled/loading/pressed |
| Props | variant applies correctly, size applies correctly, disabled prop works, loading prop works |
| Passthrough | `data-id` passes through, `class` merges, native button attrs pass through |
| Children | renders snippet children, renders without children |
| Style enforcement | `stripStyleProp` warns on style prop in DEV |

---

## DIALOG — Full Specification

### Dialog Taxonomy Contract

**File**: `taxonomy/kinds/primitives/dialog/contract.ts`

```typescript
kind: "dialog"
ariaStateProvider: "meltui"    // dsAdapter provides state + ARIA machinery

slots:
  required: ["root", "content"]
  optional: ["trigger", "portal", "overlay", "title", "description", "close"]
  forbidden: []

states:
  shared: ["focused", "focus-visible", "focus-within", "hover", "active"]
  specific: ["hidden", "visible", "inert", "open", "entering", "exiting"]

slotStates:
  root:        ["open"]
  trigger:     ["focused", "focus-visible", "hover", "active"]
  portal:      ["hidden", "visible"]
  overlay:     ["visible", "entering", "exiting", "hover"]
  content:     ["open", "focus-within", "entering", "exiting"]
  title:       []
  description: []
  close:       ["focused", "focus-visible", "hover", "active"]

slotActions:
  root: [], trigger: [], portal: [], overlay: [],
  content: [], title: [], description: [], close: []

collections:
  aria:     { role: "dialog", requiredAttrs: ["aria-modal", "aria-labelledby"], optionalAttrs: ["aria-describedby"] }
  keyboard: ["Escape", "Tab"]
```

### Dialog dsAdapter (Already Exists)

| File | Purpose | Status |
|------|---------|--------|
| `api/adapters/meltui/_internal/dialog/factory.ts` | `createMeltDialog()` wraps `@melt-ui/svelte` `createDialog` | ✅ |
| `api/adapters/meltui/_internal/dialog/types.ts` | Element→slot mapping: portalled→portal. State→token: open→open | ✅ |
| `api/adapters/meltui/_internal/dialog/dialog.ts` | Consolidates exports | ✅ |
| `api/adapters/meltui/_internal/dialog/index.ts` | Barrel | ✅ |
| `taxonomy/.generated/imports.gen.ts` | `createDialog`, `DialogInstance`, `DialogConfig` | ✅ |

### Dialog Primitive Types

**File**: `primitives/dialog/types.ts`

| Export | Type | Value |
|--------|------|-------|
| `DialogSlots` | `const` | `["root", "trigger", "portal", "overlay", "content", "title", "description", "close"] as const` |
| `DialogSlot` | `type` | Union of above |
| `DialogState` | `type` | `"open" \| "closed"` |
| `DIALOG_CONTEXT_KEY` | `const` | `"coldlight-dialog"` |

**Props** (one per slot):

| Interface | Key Fields |
|-----------|------------|
| `DialogProps` | `open?: boolean` (bindable), `onOpenChange?: (open: boolean) => void`, `children?: Snippet`, `"data-id"?: string` |
| `DialogTriggerProps` | `children?: Snippet`, `class?: string`, `"data-id"?: string` |
| `DialogPortalProps` | `children?: Snippet`, `"data-id"?: string` |
| `DialogOverlayProps` | `class?: string`, `"data-id"?: string` |
| `DialogContentProps` | `children?: Snippet<[DialogSlotProps]>`, `class?: string`, `"data-id"?: string` |
| `DialogTitleProps` | `children?: Snippet`, `class?: string`, `"data-id"?: string` |
| `DialogDescriptionProps` | `children?: Snippet`, `class?: string`, `"data-id"?: string` |
| `DialogCloseProps` | `children?: Snippet`, `class?: string`, `"data-id"?: string` |
| `DialogSlotProps` | `{ open: boolean }` — snippet prop shape for content |

### Dialog Context

**File**: `primitives/dialog/context.ts`

```typescript
// setDialogContext(instance) — called by Dialog.svelte (root)
// getDialogContext() — called by all slot components
// Uses DIALOG_CONTEXT_KEY from types.ts
// Returns MeltUI dialog instance (typed via import cloak as DialogInstance)
```

### Dialog Components (8 files)

| File | Slot | Element | dsAdapter | data-state |
|------|------|---------|-----------|------------|
| `Dialog.svelte` | root | `<div>` | `createDialog()` via import cloak → `setContext()` | `open \| closed` |
| `DialogTrigger.svelte` | trigger | `<button>` | `use:melt={$trigger}` | — |
| `DialogPortal.svelte` | portal | `<div>` | `use:melt={$portalled}` | — |
| `DialogOverlay.svelte` | overlay | `<div>` | `use:melt={$overlay}` | `open \| closed` |
| `DialogContent.svelte` | content | `<div>` | `use:melt={$content}` | `open \| closed` |
| `DialogTitle.svelte` | title | `<h2>` | `use:melt={$title}` | — |
| `DialogDescription.svelte` | description | `<p>` | `use:melt={$description}` | — |
| `DialogClose.svelte` | close | `<button>` | `use:melt={$close}` | — |

**Every component has**:
- `data-kind="dialog"`
- `data-slot="{slot}"`
- `data-state` where applicable
- `data-id={dataId}` passthrough
- `class={className}` (slot components)
- `{...rest}` passthrough (slot components)
- `stripStyleProp(rest, '{Kind}{Slot}')` (slot components)
- File header JSDoc with `@file`, `@layer`, dsAdapter/ColdLight responsibilities, data attributes

**Root component (`Dialog.svelte`) pattern**:
1. Import `createDialog` from import cloak
2. Create builder: `const dialog = createDialog({ ... })`
3. Share via context: `setDialogContext(dialog)`
4. Render `<div data-kind="dialog" data-slot="root" data-state={...}>`

**Slot component pattern**:
1. Import `melt` from import cloak
2. Get builder from context: `const dialog = getDialogContext()`
3. Destructure: `const { elements: { content }, states: { open } } = dialog`
4. Render `<div use:melt={$content} data-kind="dialog" data-slot="content" data-state={...}>`

### Dialog Barrel

**File**: `primitives/dialog/index.ts`

```
Component exports (as namespace):
  - default as Root        (Dialog.svelte)
  - default as Trigger     (DialogTrigger.svelte)
  - default as Portal      (DialogPortal.svelte)
  - default as Overlay     (DialogOverlay.svelte)
  - default as Content     (DialogContent.svelte)
  - default as Title       (DialogTitle.svelte)
  - default as Description (DialogDescription.svelte)
  - default as Close       (DialogClose.svelte)

Type exports:
  - DialogProps, DialogTriggerProps, DialogPortalProps, DialogOverlayProps
  - DialogContentProps, DialogTitleProps, DialogDescriptionProps, DialogCloseProps
  - DialogSlotProps, DialogState, DialogSlot

Value exports:
  - DialogSlots, DIALOG_CONTEXT_KEY
  - contract
```

### Dialog Test Requirements (35+ tests)

| Category | Tests |
|----------|-------|
| Data attributes (8) | Every slot has correct `data-kind="dialog"` and `data-slot`, stateful slots have `data-state` |
| State management (4) | Controlled mode, uncontrolled mode, `onOpenChange` fires, `$bindable` open works |
| Context (3) | Root provides context, children consume context, error without root |
| Passthrough (3) | `data-id` passes through, `class` merges, `{...rest}` forwards |
| Style enforcement (1) | `stripStyleProp` warns in DEV |
| dsAdapter integration (8) | `use:melt` applied to all slot elements, builder elements are reactive |
| Rendering (4) | All slots render, portal renders, overlay renders, content renders children with `{ open }` |
| Lifecycle (4) | Opens on trigger click, closes on close click, closes on escape, overlay click closes |

---

## TABS — Full Specification

### Tabs Taxonomy Contract

**File**: `taxonomy/kinds/primitives/tabs/contract.ts`

```typescript
kind: "tabs"
ariaStateProvider: "meltui"    // dsAdapter provides state + ARIA machinery

slots:
  required: ["root", "list", "trigger", "content"]
  optional: []
  forbidden: []

states:
  shared: ["focused", "focus-visible", "focus-within", "hover", "active", "disabled"]
  specific: ["hidden", "visible", "selected"]

slotStates:
  root:    []
  list:    ["focus-within"]
  trigger: ["selected", "focused", "focus-visible", "hover", "active", "disabled"]
  content: ["hidden", "visible"]

slotActions:
  root: [], list: [], trigger: [], content: []

collections:
  aria:     { role: "tablist", requiredAttrs: ["aria-orientation"], optionalAttrs: [] }
  keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Enter", "Space"]
```

### Tabs dsAdapter (Already Exists)

| File | Purpose | Status |
|------|---------|--------|
| `api/adapters/meltui/_internal/tabs/factory.ts` | `createMeltTabs()` wraps `@melt-ui/svelte` `createTabs` | ✅ |
| `api/adapters/meltui/_internal/tabs/types.ts` | 1:1 slot mapping. State: value→selected | ✅ |
| `api/adapters/meltui/_internal/tabs/tabs.ts` | Consolidates exports | ✅ |
| `api/adapters/meltui/_internal/tabs/index.ts` | Barrel | ✅ |
| `taxonomy/.generated/imports.gen.ts` | `createTabs`, `TabsInstance`, `TabsConfig` | ✅ |

### CRITICAL: MeltUI Tabs Builder Difference

MeltUI tabs `trigger` and `content` are **FUNCTIONS**, not direct stores:

```typescript
// Dialog (direct stores):
const { elements: { trigger, content } } = dialog;
// Usage: use:melt={$trigger}

// Tabs (parameterized functions):
const { elements: { root, list, trigger, content } } = tabs;
// Usage: use:melt={$trigger('tab-1')}    ← FUNCTION CALL
// Usage: use:melt={$content('tab-1')}    ← FUNCTION CALL
// Usage: use:melt={$root}                ← direct store (root and list only)
// Usage: use:melt={$list}                ← direct store
```

This means `TabsTrigger.svelte` and `TabsContent.svelte` MUST accept a `value` prop to parameterize the builder.

### Tabs Primitive Types

**File**: `primitives/tabs/types.ts`

| Export | Type | Value |
|--------|------|-------|
| `TabsSlots` | `const` | `["root", "list", "trigger", "content"] as const` |
| `TabsSlot` | `type` | Union of above |
| `TabsState` | `type` | `"active" \| "inactive"` (for trigger/content visibility) |
| `TABS_CONTEXT_KEY` | `const` | `"coldlight-tabs"` |

**Props**:

| Interface | Key Fields |
|-----------|------------|
| `TabsProps` | `value?: string` (bindable), `defaultValue?: string`, `onValueChange?: (value: string) => void`, `orientation?: "horizontal" \| "vertical"`, `children?: Snippet`, `"data-id"?: string` |
| `TabsListProps` | `children?: Snippet`, `class?: string`, `"data-id"?: string` |
| `TabsTriggerProps` | `value: string` (**required**), `disabled?: boolean`, `children?: Snippet`, `class?: string`, `"data-id"?: string` |
| `TabsContentProps` | `value: string` (**required**), `children?: Snippet`, `class?: string`, `"data-id"?: string` |

### Tabs Context

**File**: `primitives/tabs/context.ts`

```typescript
// setTabsContext(instance) — called by Tabs.svelte (root)
// getTabsContext() — called by all slot components
// Uses TABS_CONTEXT_KEY from types.ts
// Returns MeltUI tabs instance (typed via import cloak as TabsInstance)
```

### Tabs Components (4 files)

| File | Slot | Element | dsAdapter | data-state |
|------|------|---------|-----------|------------|
| `Tabs.svelte` | root | `<div>` | `createTabs()` via import cloak → `setContext()` | — |
| `TabsList.svelte` | list | `<div>` | `use:melt={$list}` | — |
| `TabsTrigger.svelte` | trigger | `<button>` | `use:melt={$trigger(value)}` — **parameterized** | `active \| inactive` |
| `TabsContent.svelte` | content | `<div>` | `use:melt={$content(value)}` — **parameterized** | `active \| inactive` |

**Root component (`Tabs.svelte`) pattern**:
1. Import `createTabs` from import cloak
2. Create builder: `const tabs = createTabs({ defaultValue, ... })`
3. Share via context: `setTabsContext(tabs)`
4. Render `<div use:melt={$root} data-kind="tabs" data-slot="root">`

**Parameterized slot pattern (`TabsTrigger.svelte`)**:
1. Import `melt` from import cloak
2. Get builder: `const tabs = getTabsContext()`
3. Destructure: `const { elements: { trigger }, states: { value } } = tabs`
4. Render `<button use:melt={$trigger(value)} data-kind="tabs" data-slot="trigger" data-state={...}>`

### Tabs Barrel

**File**: `primitives/tabs/index.ts`

```
Component exports (as namespace):
  - default as Root    (Tabs.svelte)
  - default as List    (TabsList.svelte)
  - default as Trigger (TabsTrigger.svelte)
  - default as Content (TabsContent.svelte)

Type exports:
  - TabsProps, TabsListProps, TabsTriggerProps, TabsContentProps
  - TabsState, TabsSlot

Value exports:
  - TabsSlots, TABS_CONTEXT_KEY
  - contract
```

### Tabs Test Requirements (40+ tests)

| Category | Tests |
|----------|-------|
| Data attributes (4) | Every slot has correct `data-kind="tabs"` and `data-slot` |
| State management (5) | Controlled value, uncontrolled defaultValue, `onValueChange` fires, `$bindable` works, orientation |
| Context (3) | Root provides context, children consume, error without root |
| Parameterized builders (4) | Trigger receives value, content receives value, correct trigger selected, correct content visible |
| Passthrough (3) | `data-id`, `class`, `{...rest}` |
| Style enforcement (1) | `stripStyleProp` warns in DEV |
| dsAdapter integration (4) | `use:melt` on all slots, parameterized builders reactive |
| Tab switching (6) | Click switches tab, only one content visible, trigger reflects selected state, disabled trigger |
| Keyboard (6) | ArrowLeft, ArrowRight, Home, End, Enter activates, Space activates |
| Rendering (4) | All slots render, multiple triggers, multiple content panels, empty tabs |

---

## Execution Order

### Phase 1: Taxonomy Contracts (Step 0)

Create the 3 contract folders that the barrel already expects:

```
1. taxonomy/kinds/primitives/button/contract.ts
2. taxonomy/kinds/primitives/button/index.ts
3. taxonomy/kinds/primitives/dialog/contract.ts
4. taxonomy/kinds/primitives/dialog/index.ts
5. taxonomy/kinds/primitives/tabs/contract.ts
6. taxonomy/kinds/primitives/tabs/index.ts
```

**Gate**: `pnpm svelte-check` — taxonomy barrel imports resolve.

### Phase 2: Primitive Types + Context (Step 2)

```
7.  primitives/button/contract.ts     (re-exports taxonomy contract)
8.  primitives/button/types.ts
9.  primitives/dialog/contract.ts     (re-exports taxonomy contract)
10. primitives/dialog/types.ts
11. primitives/dialog/context.ts
12. primitives/tabs/contract.ts       (re-exports taxonomy contract)
13. primitives/tabs/types.ts
14. primitives/tabs/context.ts
```

### Phase 3: Svelte Components (Step 3)

```
Button (1 component):
15. primitives/button/Button.svelte

Dialog (8 components):
16. primitives/dialog/Dialog.svelte
17. primitives/dialog/DialogTrigger.svelte
18. primitives/dialog/DialogPortal.svelte
19. primitives/dialog/DialogOverlay.svelte
20. primitives/dialog/DialogContent.svelte
21. primitives/dialog/DialogTitle.svelte
22. primitives/dialog/DialogDescription.svelte
23. primitives/dialog/DialogClose.svelte

Tabs (4 components):
24. primitives/tabs/Tabs.svelte
25. primitives/tabs/TabsList.svelte
26. primitives/tabs/TabsTrigger.svelte
27. primitives/tabs/TabsContent.svelte
```

### Phase 4: Barrels + Index (Steps 4-5)

```
28. primitives/button/index.ts
29. primitives/dialog/index.ts
30. primitives/tabs/index.ts
31. primitives/index.ts              (fix broken imports)
```

**Gate**: `pnpm svelte-check` — full compilation passes.

### Phase 5: Tests (Step 7)

```
32. primitives/button/Button.test.svelte
33. primitives/button/Button.test.ts
34. primitives/dialog/Dialog.test.svelte
35. primitives/dialog/Dialog.test.ts
36. primitives/tabs/Tabs.test.svelte
37. primitives/tabs/Tabs.test.ts
```

**Gate**: All tests pass. Minimum counts met (button 15+, dialog 35+, tabs 40+).

### Phase 6: Verification (Step 8)

```bash
pnpm svelte-check           # Types pass
pnpm test:run               # All tests pass
pnpm coldlight:verify       # Scanner validates parity
```

---

## File Count Summary

| Kind | Taxonomy | Primitive | Total |
|------|----------|-----------|-------|
| Button | 2 (contract.ts, index.ts) | 5 (contract.ts, types.ts, Button.svelte, index.ts, Button.test.ts + .test.svelte) | 7 |
| Dialog | 2 | 13 (contract.ts, types.ts, context.ts, 8 .svelte, index.ts, test.ts + .test.svelte) | 15 |
| Tabs | 2 | 9 (contract.ts, types.ts, context.ts, 4 .svelte, index.ts, test.ts + .test.svelte) | 11 |
| **Total** | **6** | **27** | **33 files** |

---

## Invariants (Enforced Across ALL Files)

1. **NO ARIA in primitives**. Contract declares. Block applies.
2. **NO direct `@melt-ui/svelte` imports** in primitives. Import cloak only.
3. **NO `style` prop**. `stripStyleProp()` enforces at runtime.
4. **NO logic in `index.ts`**. Pure import/export.
5. **Every `.svelte` has JSDoc file header** with `@file`, `@layer`, dsAdapter vs ColdLight responsibilities.
6. **Every `.ts` has JSDoc file header** with `@file`, `@description`.
7. **Every props interface has JSDoc** on the interface and every field.
8. **`data-kind`, `data-slot`** on every rendered element. `data-state` where stateful.
9. **PascalCase** file naming. `{Kind}.svelte`, `{Kind}{Slot}.svelte`.
10. **Contract re-export** in every primitive: `primitives/{kind}/contract.ts` → `taxonomy/kinds/primitives/{kind}/contract`.

---

## Consumer API (What Blocks See After Sprint 1)

```svelte
<script>
  import { Button, Dialog, Tabs } from "$lib/design/primitives";
</script>

<!-- Simple primitive (coldlight) -->
<Button variant="default" size="md">Click me</Button>

<!-- Compound primitive (meltui) — namespace API -->
<Dialog.Root bind:open>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Title</Dialog.Title>
      <Dialog.Description>Description</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>

<!-- Compound with parameterized slots -->
<Tabs.Root defaultValue="tab1">
  <Tabs.List>
    <Tabs.Trigger value="tab1">Tab 1</Tabs.Trigger>
    <Tabs.Trigger value="tab2">Tab 2</Tabs.Trigger>
  </Tabs.List>
  <Tabs.Content value="tab1">Content 1</Tabs.Content>
  <Tabs.Content value="tab2">Content 2</Tabs.Content>
</Tabs.Root>
```

---

**This sprint is the golden example. Every future sprint copies from here.**
