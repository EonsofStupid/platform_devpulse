# ColdLight _internal API Layer

> **The adapter between behavioral providers (Bits UI) and ColdLight SSOT.**

---

## Purpose

The `_internal` layer is the ONLY place where external provider APIs are consumed. This provides:

1. **Single integration point** — Provider changes only affect this layer
2. **Type enforcement** — Zod validation at the boundary
3. **ARIA ownership** — ColdLight adds ALL accessibility attributes
4. **Clean separation** — Bits UI = behavior, ColdLight = everything else

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         ColdLight                                │
│  (Taxonomy, Tokens, Recipes, ARIA, Styling, Data Attributes)    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ consumes
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    sys/api/_internal                             │
│  (Typed adapters, Zod validation, State extraction)             │
└─────────────────────────────────────────────────────────────────┘
                              │
                              │ wraps
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         Bits UI                                  │
│  (Behavioral state ONLY: open/closed, focus, keyboard nav)      │
└─────────────────────────────────────────────────────────────────┘
```

---

## What Bits UI Provides (Behavior Only)

| Capability | Example |
|------------|---------|
| Open/closed state | Dialog, Popover, Tooltip |
| Focus management | Trap focus in modal |
| Keyboard navigation | Arrow keys in menus |
| Roving tabindex | Tab panels |
| Click outside detection | Close on outside click |
| Escape key handling | Close on Escape |
| Portal rendering | Render to body |

**Bits UI does NOT provide:**
- ARIA attributes (we add them)
- Styling (we own CSS)
- Data attributes (we add `data-kind`, `data-slot`, `data-state`)
- Visual output (we own all rendering)

---

## Adapter Pattern

Each primitive has an adapter in `_internal`:

```typescript
// sys/api/_internal/dialog.ts
import { Dialog as BitsDialog } from "bits-ui";
import { z } from "zod";
import type { DialogState } from "$lib/design/taxonomy/kinds/dialog.js";

/**
 * Dialog adapter - extracts behavioral state from Bits UI
 *
 * Bits UI provides: open state, focus trap, portal
 * ColdLight adds: ARIA, data-kind, data-slot, data-state, styling
 */

// Re-export component parts for internal use only
export const BitsDialogRoot = BitsDialog.Root;
export const BitsDialogTrigger = BitsDialog.Trigger;
export const BitsDialogPortal = BitsDialog.Portal;
export const BitsDialogOverlay = BitsDialog.Overlay;
export const BitsDialogContent = BitsDialog.Content;
export const BitsDialogTitle = BitsDialog.Title;
export const BitsDialogDescription = BitsDialog.Description;
export const BitsDialogClose = BitsDialog.Close;

// State extraction helper
export function extractDialogState(open: boolean): DialogState {
  return open ? "open" : "closed";
}

// Zod validation for props
export const DialogPropsSchema = z.object({
  open: z.boolean().optional(),
  onOpenChange: z.function().args(z.boolean()).returns(z.void()).optional(),
  closeOnOutsideClick: z.boolean().optional().default(true),
  closeOnEscape: z.boolean().optional().default(true),
});
```

---

## ARIA Ownership

ColdLight owns ALL ARIA attributes. We do NOT spread `{...props}` from Bits UI:

```svelte
<!-- WRONG - letting Bits UI control ARIA -->
<BitsDialog.Content {...rest}>
  {#snippet child({ props })}
    <div {...props}>  <!-- NO! Bits props may include ARIA -->
      {children}
    </div>
  {/snippet}
</BitsDialog.Content>

<!-- CORRECT - ColdLight owns ARIA -->
<BitsDialog.Content {...behaviorProps}>
  {#snippet child({ open })}
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      data-kind="dialog"
      data-slot="content"
      data-state={open ? "open" : "closed"}
      class={className}
    >
      {children}
    </div>
  {/snippet}
</BitsDialog.Content>
```

---

## What We Extract from Bits UI Child Snippets

Bits UI child snippets provide behavioral state. We extract ONLY what we need:

| Component | Extract | Ignore |
|-----------|---------|--------|
| Dialog.Content | `open` | `props` |
| Popover.Content | `open` | `props` |
| Tooltip.Content | `open` | `props` |
| Select.Content | `open` | `props` |
| Select.Item | `selected`, `highlighted` | `props` |
| Tabs.Trigger | — | `props['data-state']` |
| Tabs.Content | — | `props['data-state']` |

**Note:** For Tabs, Bits UI doesn't expose state in snippets. We extract from `props['data-state']` or `props['aria-selected']`.

---

## State Extraction Helpers

```typescript
// sys/api/_internal/state.ts

/**
 * Extract open/closed state
 */
export function extractOpenState(open: boolean): "open" | "closed" {
  return open ? "open" : "closed";
}

/**
 * Extract selected state from Tabs (snippetProps gap workaround)
 */
export function extractTabState(props: Record<string, unknown>): "active" | "inactive" {
  // Bits UI Tabs doesn't expose selected in child snippets
  // Must extract from data-state attribute
  return props["data-state"] === "active" ? "active" : "inactive";
}

/**
 * Extract selected state from aria-selected
 */
export function extractAriaSelected(props: Record<string, unknown>): boolean {
  return props["aria-selected"] === "true" || props["aria-selected"] === true;
}
```

---

## Adapter Index

```typescript
// sys/api/_internal/index.ts

// Dialog
export * from "./dialog.js";

// Popover
export * from "./popover.js";

// Tooltip
export * from "./tooltip.js";

// Select
export * from "./select.js";

// Tabs
export * from "./tabs.js";

// Alert Dialog
export * from "./alert-dialog.js";

// Sheet (uses Dialog)
export * from "./sheet.js";

// State helpers
export * from "./state.js";
```

---

## Usage in Primitives

Primitives import from `_internal`, never directly from `bits-ui`:

```svelte
<!-- primitives/dialog/Content.svelte -->
<script lang="ts">
  // CORRECT - import from _internal
  import { BitsDialogContent, extractOpenState } from "$lib/design/sys/api/_internal/index.js";

  // WRONG - never import bits-ui directly in primitives
  // import { Dialog } from "bits-ui";
</script>

<BitsDialogContent>
  {#snippet child({ open })}
    <div
      role="dialog"
      aria-modal="true"
      data-kind="dialog"
      data-slot="content"
      data-state={extractOpenState(open)}
    >
      {@render children?.({ open })}
    </div>
  {/snippet}
</BitsDialogContent>
```

---

## Zod Validation at Boundary

Props are validated when entering ColdLight:

```typescript
// sys/api/_internal/dialog.ts
import { z } from "zod";

export const DialogRootPropsSchema = z.object({
  open: z.boolean().optional(),
  onOpenChange: z.function().args(z.boolean()).returns(z.void()).optional(),
  closeOnOutsideClick: z.boolean().default(true),
  closeOnEscape: z.boolean().default(true),
}).strict();

// In component
const validatedProps = DialogRootPropsSchema.parse(incomingProps);
```

---

## File Structure

```
sys/api/_internal/
├── README.md           # This file
├── index.ts            # Barrel export
├── state.ts            # State extraction helpers
├── dialog.ts           # Dialog adapter
├── popover.ts          # Popover adapter
├── tooltip.ts          # Tooltip adapter
├── select.ts           # Select adapter
├── tabs.ts             # Tabs adapter
├── alert-dialog.ts     # AlertDialog adapter
└── sheet.ts            # Sheet adapter (extends Dialog)
```

---

## Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| Single integration point | All Bits UI imports in `_internal` |
| Zod validation | Props validated at boundary |
| ARIA ownership | ColdLight adds all a11y |
| Behavioral isolation | Only state extracted from snippets |
| Type safety | TypeScript + Zod schemas |

---

## Core Truth

**Bits UI is a behavioral state machine. ColdLight is everything else.**

The `_internal` layer is the firewall that ensures this separation.

---

**This is the canonical _internal adapter pattern.**
