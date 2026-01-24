# ColdLight Primitives

> Living specification for ColdLight UI primitives.
> Auto-updated by `pnpm docs:primitives`.
>
> **ARIA Provider:** Melt UI
> **Architecture:** See ADR-009, ADR-010, ADR-011

## Quick Start

```svelte
<script>
  import { Button, Dialog } from "$lib/design/primitives";
</script>

<!-- Simple primitive -->
<Button>Click me</Button>

<!-- Compound primitive -->
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

## Completion Status

<!-- BEGIN:AUDIT_TABLE -->
| Primitive | index | types | a11y | tests | Status |
|-----------|-------|-------|------|-------|--------|
| alert-dialog | ✅ | ✅ | ✅ | 41 | 🔄 MIGRATE |
| button | ✅ | ✅ | ✅ | 19 | 🔄 MIGRATE |
| dialog | ✅ | ✅ | ✅ | 28 | 🔄 MIGRATE |
| popover | ✅ | ✅ | ✅ | 35 | 🔄 MIGRATE |
| sheet | ✅ | ✅ | ✅ | 32 | 🔄 MIGRATE |
| tabs | ✅ | ✅ | ✅ | 48 | 🔄 MIGRATE |
| tanstack | ✅ | ❌ | ❌ | ❌ | 🔄 |
| tooltip | ✅ | ✅ | ✅ | 28 | 🔄 MIGRATE |
<!-- END:AUDIT_TABLE -->

**Migration Status:** Existing primitives use melt-ui and will be migrated to Melt UI.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  Melt UI (ARIA Provider)                                    │
│  • ARIA attributes (role, aria-*)                           │
│  • ID generation and linking                                │
│  • Focus management                                         │
│  • Keyboard navigation                                      │
│  • Event handlers                                           │
│  Delivery: use:melt={$element} action                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ColdLight (Design System)                                  │
│  • data-kind          (primitive taxonomy)                  │
│  • data-slot          (slot identification)                 │
│  • data-state         (visual state for CSS)                │
│  • data-id            (user-controlled stable ID)           │
│  • class              (recipe-based styling)                │
│  • Type system        (props interfaces)                    │
│  • Registry           (kind/material/recipe)                │
│  • Audit              (diagram, JSDOC)                      │
└─────────────────────────────────────────────────────────────┘
```

## Data Attribute Contract

All primitives emit these attributes for CSS targeting:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Primitive type | `"dialog"`, `"select"` |
| `data-slot` | Slot within primitive | `"root"`, `"content"` |
| `data-state` | Current state | `"open"`, `"closed"` |
| `data-id` | User-controlled stable ID | `"my-dialog"` |

**DEPRECATED:** `data-primitive`, `data-name`, `data-part`

## Folder Structure

```
primitives/
├── types.ts           # Foundation: DATA_ATTRS, cn(), stripStyleProp()
├── index.ts           # Barrel exports
├── PRIMITIVES.md      # This file (living spec)
├── CHECKLIST.md       # Implementation checklist
├── WORKFLOW.md        # Development workflow
├── button/            # Simple primitive
│   ├── index.ts
│   ├── types.ts
│   ├── Button.svelte
│   ├── Button.test.ts
│   └── a11y.md
├── dialog/            # Compound primitive
│   ├── index.ts
│   ├── types.ts
│   ├── Root.svelte
│   ├── Trigger.svelte
│   ├── Portal.svelte
│   ├── Overlay.svelte
│   ├── Content.svelte
│   ├── Title.svelte
│   ├── Description.svelte
│   ├── Close.svelte
│   ├── Dialog.test.svelte
│   ├── Dialog.test.ts
│   └── a11y.md
└── ...
```

## Primitive Completion Checklist

Every primitive MUST have ALL of the following:

### Required Files
- `{name}/index.ts` — Barrel export
- `{name}/types.ts` — Slots array, State type, Context key, Props interfaces
- `{name}/*.svelte` — Component files (1 for simple, N for compound)
- `{name}/a11y.md` — ARIA contract, keyboard, focus, data attributes
- `{name}/{Name}.test.svelte` — Test wrapper component
- `{name}/{Name}.test.ts` — vitest-browser-svelte tests

### Required Standards
- Data attributes: `data-kind`, `data-slot`, `data-state`, `data-id`
- No `style` prop (enforced via `Omit<..., "style">` + `stripStyleProp`)
- Interactive elements use `use:melt={$element}` for ARIA
- Robust tests (see minimum counts in CHECKLIST.md)
- All tests pass
- Type check passes

## Key Patterns

### Pattern A: Root Component (Creates Builder)

```svelte
<script lang="ts">
  import { createDialog } from '@melt-ui/svelte';
  import { setContext } from 'svelte';
  import { DIALOG_CONTEXT_KEY } from './types.js';

  const dialog = createDialog({
    defaultOpen: open,
    onOpenChange: (details) => {
      open = details.open;
      onOpenChange?.(details.open);
    },
  });

  setContext(DIALOG_CONTEXT_KEY, dialog);
</script>

<div
  data-kind="dialog"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  {@render children?.()}
</div>
```

### Pattern B: Child Component (Uses Builder)

```svelte
<script lang="ts">
  import { melt } from '@melt-ui/svelte';
  import { getContext } from 'svelte';
  import { DIALOG_CONTEXT_KEY } from './types.js';

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
>
  {@render children?.({ open: $open })}
</div>
```

**Key points:**
- `use:melt={$content}` applies all ARIA (role, aria-modal, aria-labelledby, etc.)
- ColdLight adds `data-kind`, `data-slot`, `data-state`, `data-id`, `class`

## Foundation Imports

All primitives use these from `../types.js`:

```typescript
import { DATA_ATTRS, stripStyleProp, cn } from "../types.js";
import type { OmitStyle, BaseProps } from "../types.js";
```

## Maintenance

After completing any primitive:

```bash
pnpm docs:primitives    # Updates completion table
pnpm audit:primitives   # Verify completeness
pnpm test:run lib/design/primitives/{name}/
pnpm check              # Type check
```

## Migration Plan

Existing melt-ui primitives will be migrated to Melt UI:

| Primitive | melt-ui Status | Melt UI Status |
|-----------|----------------|----------------|
| Button | ✅ Complete | 🔄 Migrate |
| Dialog | ✅ Complete | 🔄 Migrate |
| Sheet | ✅ Complete | 🔄 Migrate |
| Tabs | ✅ Complete | 🔄 Migrate |
| AlertDialog | ✅ Complete | 🔄 Migrate |
| Popover | ✅ Complete | 🔄 Migrate |
| Tooltip | ✅ Complete | 🔄 Migrate |
| Select | 🔄 In Progress | Pending |
| Combobox | Pending | Pending |

Migration involves:
1. Replace `{...props}` spreading with `use:melt={$element}`
2. Replace melt-ui imports with Melt UI builders
3. Update context to share builder instead of IDs
4. Update tests to verify Melt ARIA presence
