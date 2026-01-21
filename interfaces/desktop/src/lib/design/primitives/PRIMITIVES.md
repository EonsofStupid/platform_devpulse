# ColdLight Primitives

> Living specification for ColdLight UI primitives.
> Auto-updated by `pnpm docs:primitives`.

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
| alert-dialog | ✅ | ✅ | ✅ | 41 | ✅ |
| button | ✅ | ✅ | ✅ | 19 | ✅ |
| dialog | ✅ | ✅ | ✅ | 28 | ✅ |
| popover | ✅ | ✅ | ✅ | 35 | ✅ |
| sheet | ✅ | ✅ | ✅ | 32 | ✅ |
| tabs | ✅ | ✅ | ✅ | 48 | ✅ |
| tanstack | ✅ | ❌ | ❌ | ❌ | 🔄 |
<!-- END:AUDIT_TABLE -->

**Monolithic (pending conversion):** Run `pnpm audit:primitives` for current count.

## Data Attribute Contract

All primitives emit these attributes for CSS targeting:

```
data-primitive="{name}"     # Primitive type (button, dialog, sheet)
data-slot="{slot}"          # Slot within primitive (root, trigger, content)
data-state="{state}"        # Current state (open, closed, pressed, disabled)
data-id="{user-defined}"    # Stable ID for testing/tooling
```

**DEPRECATED:** `data-kind`, `data-name`, `data-part` (old pattern, do not use)

## Architecture

```
primitives/
├── types.ts           # Foundation: DATA_ATTRS, cn(), stripStyleProp()
├── index.ts           # Barrel exports
├── PRIMITIVES.md      # This file (living spec)
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
│   ├── Dialog.test.ts
│   └── a11y.md
└── [monolithic].svelte  # To be converted
```

## Primitive Completion Checklist

Every primitive MUST have ALL of the following before marked complete:

### Required Files
- `{name}/index.ts` — Barrel export
- `{name}/types.ts` — Slots array, State type, all prop interfaces
- `{name}/*.svelte` — Component files (1 for simple, N for compound)
- `{name}/a11y.md` — ARIA contract, keyboard, focus, data attributes
- `{name}/{Name}.test.svelte` — Test wrapper component
- `{name}/{Name}.test.ts` — vitest-browser-svelte tests

### Required Standards
- Data attributes: `data-primitive`, `data-slot`, `data-state`, `data-id`
- No `style` prop (enforced via `Omit<..., "style">` + `stripStyleProp`)
- Bits UI ARIA spreads correctly (`{...props}` in child snippets)
- All tests pass
- Type check passes

## Maintenance

After completing any primitive:

```bash
pnpm docs:primitives    # Updates completion table
pnpm audit:primitives   # Verify completeness
pnpm test:run lib/design/primitives/{name}/
pnpm check              # Type check
```

## Key Patterns

### Pattern A: Simple Primitive (Button)

```svelte
<BitsButton.Root
  {disabled}
  class={className}
  data-primitive="button"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
  {...rest}
>
  {@render children?.()}
</BitsButton.Root>
```

### Pattern B: Compound Primitive with Child Snippet (Dialog)

```svelte
<Dialog.Content {...rest}>
  {#snippet child({ props, open })}
    <div
      {...props}
      class={cn(props.class, className)}
      data-primitive="dialog"
      data-slot="content"
      data-state={open ? "open" : "closed"}
    >
      {@render children?.({ open })}
    </div>
  {/snippet}
</Dialog.Content>
```

**Critical:** `{...props}` MUST spread — contains `role="dialog"`, `aria-modal`, `aria-labelledby`.

## Foundation Imports

All primitives use these from `../types.js`:

```typescript
import { DATA_ATTRS, stripStyleProp, cn } from "../types.js";
import type { OmitStyle, BaseProps } from "../types.js";
```
