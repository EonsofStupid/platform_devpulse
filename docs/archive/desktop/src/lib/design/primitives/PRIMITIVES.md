# ColdLight Primitives

> Living specification for ColdLight UI primitives.
>
> **dsAdapter:** MeltUI (declared in `config/coldlight/adapters.cfg.ts`)
> **Architecture:** Contract declares → Primitive structures → Block applies ARIA

## Quick Start

```svelte
<script>
  import { Button, Dialog } from "$lib/design/primitives";
</script>

<!-- Simple primitive (ariaStateProvider: coldlight) -->
<Button>Click me</Button>

<!-- Compound primitive (ariaStateProvider: meltui) -->
<Dialog.Root>
  <Dialog.Trigger>Open</Dialog.Trigger>
  <Dialog.Portal>
    <Dialog.Overlay />
    <Dialog.Content>
      <Dialog.Title>Hello</Dialog.Title>
      <Dialog.Description>Content here</Dialog.Description>
      <Dialog.Close>Close</Dialog.Close>
    </Dialog.Content>
  </Dialog.Portal>
</Dialog.Root>
```

## Current State (2026-01-30)

| Kind | Contract | Adapter | Primitive | ariaStateProvider | Status |
|------|----------|---------|-----------|-------------------|--------|
| button | ✅ | N/A | 🔨 BUILD | `coldlight` | In progress |
| dialog | ✅ | ✅ | 🔨 BUILD | `meltui` | In progress |
| tabs | ✅ | ✅ | 🔨 BUILD | `meltui` | In progress |

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Taxonomy Contract (SSOT)                                    │
│  • kind, slots, states, slotStates                          │
│  • ariaStateProvider ("meltui" or "coldlight")              │
│  • collections.aria (ARIA requirements)                      │
│  • collections.keyboard (keyboard requirements)              │
│  Location: taxonomy/kinds/primitives/{kind}/contract.ts      │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  dsAdapter (MeltUI) — behavior engine                        │
│  • Positioning (Floating UI)                                │
│  • Focus trapping                                            │
│  • Keyboard navigation                                       │
│  • Click outside detection                                   │
│  • Escape key handling                                       │
│  • Portal rendering                                          │
│  Access: import cloak (taxonomy/.generated/imports.gen.ts)    │
│  Delivery: use:melt={$element} on slot components            │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ColdLight Primitive (structure + data attributes)           │
│  • data-kind          (primitive taxonomy)                   │
│  • data-slot          (slot identification)                  │
│  • data-state         (visual state for CSS)                 │
│  • data-id            (user-controlled stable ID)            │
│  • class              (recipe-based styling)                 │
│  • Type system        (props interfaces)                     │
│  • NO ARIA            (declared in contract, applied at blocks) │
└─────────────────────────────────────────────────────────────┘
```

## Data Attribute Contract

All primitives emit these attributes for CSS targeting:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Primitive type | `"dialog"`, `"button"` |
| `data-slot` | Slot within primitive | `"root"`, `"content"` |
| `data-state` | Current state | `"open"`, `"closed"` |
| `data-id` | User-controlled stable ID | `"my-dialog"` |

**DEPRECATED:** `data-primitive`, `data-name`, `data-part`

## Folder Structure

```
primitives/
├── types.ts                    # Foundation: DATA_ATTRS, cn(), stripStyleProp()
├── index.ts                    # Barrel exports
├── PRIMITIVES.md               # This file (living spec)
├── CHECKLIST.md                # Implementation law
├── MASTER_SPRINT_PLAN.md       # Sprint priorities
├── PRIMITIVE_CONTRACT.md       # Contract binding spec
├── button/                     # Simple primitive (ariaStateProvider: coldlight)
│   ├── index.ts
│   ├── contract.ts             # Re-exports taxonomy contract
│   ├── types.ts
│   ├── Button.svelte
│   ├── Button.test.svelte
│   └── Button.test.ts
├── dialog/                     # Compound primitive (ariaStateProvider: meltui)
│   ├── index.ts
│   ├── contract.ts
│   ├── context.ts
│   ├── types.ts
│   ├── Dialog.svelte
│   ├── DialogTrigger.svelte
│   ├── DialogPortal.svelte
│   ├── DialogOverlay.svelte
│   ├── DialogContent.svelte
│   ├── DialogTitle.svelte
│   ├── DialogDescription.svelte
│   ├── DialogClose.svelte
│   ├── Dialog.test.svelte
│   └── Dialog.test.ts
├── tabs/                       # Compound primitive (ariaStateProvider: meltui)
│   ├── index.ts
│   ├── contract.ts
│   ├── context.ts
│   ├── types.ts
│   ├── Tabs.svelte
│   ├── TabsList.svelte
│   ├── TabsTrigger.svelte
│   ├── TabsContent.svelte
│   ├── Tabs.test.svelte
│   └── Tabs.test.ts
└── tanstack/                   # TanStack table integration
```

## Key Patterns

### Pattern A: Simple Primitive (ariaStateProvider: coldlight)

Native HTML handles ARIA. No dsAdapter builder needed.

```svelte
<script lang="ts">
  import type { ButtonProps } from './types.js';
  import { stripStyleProp } from '../types.js';

  let {
    children,
    class: className = '',
    "data-id": dataId,
    ...rest
  }: ButtonProps = $props();

  stripStyleProp(rest, 'Button');
</script>

<button
  class={className}
  data-kind="button"
  data-slot="root"
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children()}
  {/if}
</button>
```

### Pattern B: Compound Root (ariaStateProvider: meltui)

Creates dsAdapter builder via import cloak, shares via context.

```svelte
<script lang="ts">
  import { createDialog } from '$lib/design/taxonomy/.generated/imports.gen';
  import { setContext } from 'svelte';
  import type { DialogRootProps } from './types.js';
  import { DIALOG_CONTEXT_KEY } from './types.js';

  let { open = $bindable(false), children, "data-id": dataId }: DialogRootProps = $props();

  const dialog = createDialog({ defaultOpen: open });
  setContext(DIALOG_CONTEXT_KEY, dialog);
</script>

<div data-kind="dialog" data-slot="root" data-state={open ? 'open' : 'closed'} data-id={dataId}>
  {#if children}{@render children()}{/if}
</div>
```

### Pattern C: Compound Slot (uses dsAdapter builder from context)

```svelte
<script lang="ts">
  import { melt } from '$lib/design/taxonomy/.generated/imports.gen';
  import { getContext } from 'svelte';
  import type { DialogContentProps } from './types.js';
  import { DIALOG_CONTEXT_KEY } from './types.js';
  import { stripStyleProp } from '../types.js';

  let { children, class: className = '', "data-id": dataId, ...rest }: DialogContentProps = $props();
  stripStyleProp(rest, 'DialogContent');

  const dialog = getContext(DIALOG_CONTEXT_KEY);
  const { elements: { content }, states: { open } } = dialog;
</script>

<div
  use:melt={$content}
  class={className}
  data-kind="dialog"
  data-slot="content"
  data-state={$open ? 'open' : 'closed'}
  data-id={dataId}
  {...rest}
>
  {#if children}{@render children({ open: $open })}{/if}
</div>
```

**Key points:**
- `use:melt={$content}` applies dsAdapter behavior (ARIA, focus, keyboard)
- Imports from import cloak ONLY — never from `@melt-ui/svelte`
- Primitives emit `data-kind`, `data-slot`, `data-state` — NO manual ARIA
- ARIA requirements are declared in the contract, applied at block level

## Foundation Imports

All primitives use these from `../types.js`:

```typescript
import { DATA_ATTRS, stripStyleProp, cn } from "../types.js";
import type { OmitStyle, BaseProps } from "../types.js";
```

## Verification

After completing any primitive:

```bash
cd interfaces/desktop
pnpm svelte-check                                    # Types pass
pnpm test:run src/lib/design/primitives/{kind}/      # Tests pass
```

---

**See CHECKLIST.md for the full implementation law.**
**See MASTER_SPRINT_PLAN.md for sprint priorities.**
**See PRIMITIVE_CONTRACT.md for contract binding specification.**
