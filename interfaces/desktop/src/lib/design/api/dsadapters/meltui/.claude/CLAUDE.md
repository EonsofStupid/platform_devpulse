# Melt Provider Adapter — Claude Context

> **This is the Provider Adapter Layer for Melt UI.**
> **Architecture: Ports & Adapters (Hexagonal)**

---

## TERMINOLOGY (Industry Correct)

| Term | What It Is | Location |
|------|------------|----------|
| **Headless UI Provider** | Melt UI — behavior engine (ARIA, focus, keyboard) | `@melt-ui/svelte` |
| **Provider Port** | Contract interface ColdLight expects | `taxonomy/provider/types.ts` |
| **Provider Registry** | SSOT declaring active provider | `taxonomy/provider/` |
| **Provider Adapter Layer** | Binding that maps Melt → ColdLight | `design/api/dsadapters/meltui/` |

---
YOU DO NOT EXECUTE A SINGLE LING OF CODE WITHOUT A TRUE FUCKING PLAN WRITTEN FIRST.
METHODICALLY AND ACTUALLY OFF THE CODEBASE.  ZERO ASSUMPTIONS.
THAT PLAN ALLOWS YOU TO HAVE RESEARCH YOU DO NOT FUCKING GUESS 
THIS IS GOD DAMN FOUNDATIONAL WORK
---

## ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────┐
│  COLDLIGHT PRIMITIVES (Public API)                          │
│  Consumer sees: ColdLight types, ColdLight imports          │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ imports from
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  PROVIDER ADAPTER LAYER (sys/api/_internal/)                │
│  ─────────────────────────────────────────────              │
│  Maps Melt → ColdLight without leaking Melt                 │
│  Satisfies the Provider Port contract                       │
│                                                             │
│  This folder: design/api/dsadapters/meltui/                       │
│  Contains: types.ts, state.ts, schemas.ts, assertions.ts    │
└─────────────────────────────────────────────────────────────┘
                          │
                          │ wraps
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  HEADLESS UI PROVIDER (Melt UI)                             │
│  ─────────────────────────────                              │
│  31 builders: createDialog, createPopover, etc.             │
│  Provides: ARIA, IDs, focus, keyboard, floating, portal     │
│  We PASSTHROUGH — we do NOT fight this                      │
└─────────────────────────────────────────────────────────────┘
```

---

## THE PASSTHROUGH PRINCIPLE

**We do NOT fight Melt UI.**

| Melt Provides | We Passthrough | ColdLight Adds |
|---------------|----------------|----------------|
| `role="dialog"` | ✅ Accept | — |
| `aria-modal="true"` | ✅ Accept | — |
| `aria-labelledby` | ✅ Accept | — |
| ID generation | ✅ Accept | — |
| Focus trapping | ✅ Accept | — |
| Keyboard handling | ✅ Accept | — |
| — | — | `data-kind` |
| — | — | `data-slot` |
| — | — | `data-state` |
| — | — | `data-id` |
| — | — | `class` |

**ColdLight appears as SSOT to consumers. Internally, we're mapping Melt.**

---

## FILE RESPONSIBILITIES

### `types.ts` — 31 Builder Type Aliases

```typescript
export type DialogBuilder = ReturnType<typeof createDialog>;
export type PopoverBuilder = ReturnType<typeof createPopover>;
// ... 31 total
```

Maps Melt's builder return types to ColdLight naming.

### `state.ts` — State Extractors

```typescript
export function extractOpenState(open: boolean): 'open' | 'closed';
export function extractCheckedState(checked: boolean | 'indeterminate'): CheckedState;
```

Transforms Melt state → ColdLight `data-state` values.

### `schemas.ts` — Zod Validation

```typescript
export const OpenStatePropsSchema = z.object({ ... });
export const FloatingPropsSchema = z.object({ ... });
```

Validates props at the adapter boundary.

### `assertions.ts` — Runtime Enforcement

```typescript
export function assertKindRegistered(kind: string): asserts kind is PrimitiveKind;
export function assertSlotValid(kind: PrimitiveKind, slot: string): void;
```

Enforces taxonomy registration before use.

### `index.ts` — Barrel Export

Re-exports everything + Melt creators for convenience.

---

## BUILDER MAPPING

| Count | Description |
|-------|-------------|
| **31** | Total Melt UI builders we type-alias |
| **17** | Explicit mappings in `BUILDER_MAP` (taxonomy/provider/types.ts) |

The 17 explicit mappings are primitives where:
- PrimitiveKind → Melt builder name
- E.g., `dialog` → `createDialog`, `tooltip` → `createTooltip`

The remaining 14 are either:
- Custom ColdLight primitives (no Melt backing)
- Or mapped implicitly

---

## HOW PRIMITIVES USE THIS

```svelte
<!-- primitives/dialog/Content.svelte -->
<script lang="ts">
  // Import from _internal — NOT from @melt-ui/svelte
  import { melt, extractOpenState } from '$lib/design/sys/api/_internal';
  import type { DialogBuilder } from '$lib/design/sys/api/_internal';

  // Get builder from context
  const dialog = getContext<DialogBuilder>(DIALOG_CONTEXT_KEY);
  const { elements: { content }, states: { open } } = dialog;
</script>

<!-- Melt handles ARIA via use:melt -->
<!-- ColdLight adds data-* attributes -->
<div
  use:melt={$content}
  class={className}
  data-kind="dialog"
  data-slot="content"
  data-state={extractOpenState($open)}
  data-id={dataId}
>
  {@render children?.()}
</div>
```

---

## PROVIDER SWAPPING

If we add Ark UI later:

1. Create `sys/api/_internal/ark/` with same interface
2. Update `taxonomy/provider/registry.ts` to point to Ark
3. Primitives don't change — they import from `_internal`

This is the power of Ports & Adapters.

---

## WHAT THIS FOLDER IS NOT

- ❌ NOT the public API (that's `primitives/`)
- ❌ NOT the design system (that's ColdLight)
- ❌ NOT recipes or styling
- ❌ NOT documentation for end users

**This IS:**
- ✅ The compatibility binding
- ✅ The adapter that makes Melt usable under ColdLight's rules
- ✅ Internal plumbing that consumers never see

---

## CANONICAL STATEMENT

> "ColdLight uses a Provider Adapter Layer to bind Melt UI (Headless UI Provider) into the ColdLight Primitive API."

---

**This is the Melt Provider Adapter. It maps. It doesn't fight.**
