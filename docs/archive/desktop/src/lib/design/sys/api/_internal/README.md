# ColdLight _internal API Layer

> **The integration point between Melt UI (ARIA provider) and ColdLight (design system).**
>
> **Architecture:** See ADR-009 (Melt UI as ARIA Provider)

---

## Purpose

The `_internal` layer is the integration point for external behavioral providers. With Melt UI:

1. **Builder types** — TypeScript types for Melt builders
2. **Helper functions** — State extraction, prop transformation
3. **Validation** — Zod schemas at the boundary
4. **Documentation** — What Melt provides vs what ColdLight provides

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ColdLight                                │
│  (Taxonomy, Tokens, Recipes, Data Attributes, Type System)      │
│                                                                  │
│  Primitives use: data-kind, data-slot, data-state, data-id      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ primitives import
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Melt UI                                  │
│  (ARIA Provider: roles, aria-*, IDs, focus, keyboard)           │
│                                                                  │
│  Primitives use: use:melt={$element} action                     │
└─────────────────────────────────────────────────────────────────┘
```

**Key Change from bits-ui:**

With Melt UI, primitives import directly from `@melt-ui/svelte`. The `_internal` layer provides:
- Helper types for builder return values
- State extraction utilities
- Prop validation schemas

---

## What Melt UI Provides (ARIA Provider)

| Capability | How | ColdLight's Role |
|------------|-----|------------------|
| ARIA attributes | `use:melt={$element}` | Accept, don't override |
| ID generation | Internal to builder | Accept Melt's IDs |
| ID linking | aria-labelledby, aria-controls | Automatic via builder |
| Focus management | Trap focus in modals | Pass config to builder |
| Keyboard navigation | Arrow keys, Home, End, Escape | Automatic |
| Click outside | Close popover/dialog | Pass config to builder |
| Floating positioning | Floating UI integration | Pass positioning props |
| Portal rendering | Melt portals | Configure if needed |

**ColdLight does NOT provide:**
- ARIA attributes (Melt handles via `use:melt`)
- ID generation (Melt handles internally)
- Focus trapping logic (Melt handles)
- Keyboard handling logic (Melt handles)

**ColdLight DOES provide:**
- `data-kind` (primitive taxonomy)
- `data-slot` (slot identification)
- `data-state` (visual state for CSS)
- `data-id` (user-controlled stable ID)
- `class` (recipe-based styling)
- Type system (props interfaces)

---

## Integration Pattern

### Primitives Import Melt Directly

```svelte
<script lang="ts">
  // Primitives import Melt UI directly
  import { createDialog, melt } from '@melt-ui/svelte';
  import { setContext } from 'svelte';
  import { DIALOG_CONTEXT_KEY } from './types.js';

  // Create builder
  const dialog = createDialog({
    defaultOpen: open,
    onOpenChange: (details) => {
      open = details.open;
      onOpenChange?.(details.open);
    },
  });

  // Share via context
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

### Child Components Use Builder

```svelte
<script lang="ts">
  import { melt } from '@melt-ui/svelte';
  import { getContext } from 'svelte';
  import { DIALOG_CONTEXT_KEY } from './types.js';

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
  data-id={dataId}
>
  {@render children?.({ open: $open })}
</div>
```

---

## Helper Types

```typescript
// sys/api/_internal/melt-types.ts

import type { CreateDialogReturn } from '@melt-ui/svelte';

/**
 * Type for Dialog builder return value.
 * Used for context typing.
 */
export type DialogBuilder = CreateDialogReturn;

/**
 * Type for builder elements store.
 */
export type BuilderElements<T> = T extends { elements: infer E } ? E : never;

/**
 * Type for builder states store.
 */
export type BuilderStates<T> = T extends { states: infer S } ? S : never;
```

---

## State Extraction

```typescript
// sys/api/_internal/state.ts

/**
 * Extract open/closed state string for data-state attribute
 */
export function extractOpenState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed';
}

/**
 * Extract active/inactive state for tabs
 */
export function extractActiveState(active: boolean): 'active' | 'inactive' {
  return active ? 'active' : 'inactive';
}

/**
 * Extract selected state for items
 */
export function extractSelectedState(selected: boolean): boolean {
  return selected;
}
```

---

## Prop Validation

```typescript
// sys/api/_internal/schemas.ts
import { z } from 'zod';

/**
 * Common open/close props schema
 */
export const OpenStatePropsSchema = z.object({
  open: z.boolean().optional(),
  onOpenChange: z.function().args(z.boolean()).returns(z.void()).optional(),
});

/**
 * Positioning props schema (for floating primitives)
 */
export const PositioningPropsSchema = z.object({
  side: z.enum(['top', 'right', 'bottom', 'left']).optional(),
  sideOffset: z.number().optional(),
  align: z.enum(['start', 'center', 'end']).optional(),
  alignOffset: z.number().optional(),
});

/**
 * Validate props at boundary
 */
export function validateProps<T>(schema: z.ZodSchema<T>, props: unknown): T {
  return schema.parse(props);
}
```

---

## File Structure

```
sys/api/_internal/
├── README.md           # This file
├── index.ts            # Barrel export
├── melt-types.ts       # Melt builder types
├── state.ts            # State extraction helpers
├── schemas.ts          # Zod validation schemas
└── deprecated/         # Old bits-ui adapters (to be removed)
```

---

## Migration from bits-ui

The previous pattern used an adapter layer to wrap bits-ui. With Melt UI:

| bits-ui Pattern | Melt UI Pattern |
|-----------------|-----------------|
| Import from `_internal` | Import from `@melt-ui/svelte` |
| Re-export components | Use builders directly |
| `{...props}` spreading | `use:melt={$element}` action |
| Manual ARIA | Melt handles ARIA |
| `useId()` from bits-ui | Melt generates IDs |
| Child snippet `{ props, open }` | Builder `states.open` store |

### Old Pattern (bits-ui - DEPRECATED)

```svelte
<!-- DON'T DO THIS -->
<script>
  import { BitsDialogContent } from '$lib/design/sys/api/_internal';
</script>

<BitsDialogContent>
  {#snippet child({ props, open })}
    <div {...props} role="dialog">  <!-- Fighting the library -->
```

### New Pattern (Melt UI)

```svelte
<!-- DO THIS -->
<script>
  import { melt } from '@melt-ui/svelte';
  const { elements: { content }, states: { open } } = getContext(DIALOG_CONTEXT_KEY);
</script>

<div
  use:melt={$content}
  data-kind="dialog"
  data-slot="content"
  data-state={$open ? 'open' : 'closed'}
>
```

---

## Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| ARIA correctness | Melt UI via `use:melt` |
| ID linking | Melt handles internally |
| Type safety | TypeScript + Zod schemas |
| Clean separation | Melt = ARIA, ColdLight = design |
| Swappable provider | Builder pattern allows future changes |

---

## Core Truth

**Melt UI is the ARIA provider. ColdLight is the design system.**

The integration is via:
- `use:melt={$element}` — applies all ARIA and behavior
- Svelte context — shares builder between components
- ColdLight data attributes — `data-kind`, `data-slot`, `data-state`, `data-id`

---

**This is the canonical Melt UI integration pattern.**
