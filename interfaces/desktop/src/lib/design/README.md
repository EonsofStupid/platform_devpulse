# ColdLight Design System

> Named after Nikola Tesla's Cold Light demonstration — heatless luminescence, pure efficiency.
>
> Enterprise design system for DevPulse with explicit ARIA/behavior ownership via Melt UI.

**Stack**: SvelteKit 5 + Svelte 5 Runes + Melt UI (ARIA provider) + Tailwind CSS 4 + DaisyUI

---

## Core Decision (Locked)

### Provider

- **Melt UI** is the behavior + ARIA provider
- **ColdLight** owns the API boundary + structure + taxonomy
- ARIA ownership is handled by Melt UI

### Primitive Contract

Every primitive is identified and styled via exactly three attributes:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Primitive identity | `"dialog"`, `"select"`, `"button"` |
| `data-slot` | Primitive part | `"root"`, `"trigger"`, `"content"` |
| `data-state` | State machine output | `"open"`, `"closed"`, `"active"` |

Nothing else is required at the primitive boundary.

---

## Three-Tier Model (Locked)

| Tier | Description | Example |
|------|-------------|---------|
| **A) Primitive** | Lowest level boundary. Uses Melt UI provider. Emits data-kind/slot/state. ARIA handled by Melt UI. | `dialog.svelte` |
| **B) Semantic** | Official styled components built from primitives. Uses recipes + DaisyUI integration. User-facing API layer. | `MainButton.svelte`, `PrimaryInput.svelte` |
| **C) Compound** | Structured assemblies made from semantics (and primitives when needed). Panels, complex forms, multi-step flows. | `LoginForm.svelte`, `DashboardPanel.svelte` |

---

## Layer Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  RENDERERS    Dynamic VPB block rendering                       │
├─────────────────────────────────────────────────────────────────┤
│  COMPOUNDS    Structured assemblies (forms, panels, flows)      │
├─────────────────────────────────────────────────────────────────┤
│  SEMANTICS    Styled components (MainButton, PrimaryInput)      │
├─────────────────────────────────────────────────────────────────┤
│  RECIPES      Styling patterns applied via class/data-*         │
├─────────────────────────────────────────────────────────────────┤
│  PRIMITIVES   Unstyled, accessible components                   │
│               └── Melt UI PROVIDES: ARIA, focus, keyboard       │
│               └── ColdLight OWNS: data-kind, data-slot, types   │
├─────────────────────────────────────────────────────────────────┤
│  TAXONOMY     SSOT registries (kinds, slots, contracts)         │
├─────────────────────────────────────────────────────────────────┤
│  TOKENS       DTCG v4 compliant design tokens                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## Taxonomy — The Spine

Taxonomy is the **single source of truth** that ensures everything is:
- Typed
- Aligned
- Organized
- Auto-indexed
- Scalable without chaos

**Location:** `src/lib/design/taxonomy/`

```
taxonomy/
├── index.ts              # SSOT export funnel
├── primitiveKinds.ts     # All data-kind values
├── primitiveRegistry.ts  # Slots + metadata per primitive
├── kinds.ts              # Block kinds (shell, surface, widget)
├── contracts.ts          # Prop schemas (Zod)
└── slots.ts              # Slot definitions
```

**Enforcement Principle:** Taxonomy is the first thing the UI forces you into. If you want to add/edit a primitive, you start in taxonomy first.

---

## Provider Mapping Layer

**Location:** `src/lib/design/sys/api/_internal/melt/`

```
sys/api/_internal/
├── melt/
│   ├── index.ts        # Barrel export
│   ├── types.ts        # Melt builder types
│   ├── state.ts        # State extraction helpers
│   └── schemas.ts      # Zod validation schemas
└── README.md           # Integration documentation
```

**Purpose:**
- ColdLight primitives do not depend on random provider imports
- Primitives import only through the _internals mapping layer
- Allows ColdLight to support additional providers later

---

## Ownership Contract

| What | Melt UI Provides | ColdLight Owns |
|------|------------------|----------------|
| ARIA attributes | `role`, `aria-*`, `id` | — |
| Focus management | Focus trap, return focus | — |
| Keyboard navigation | Arrow keys, Escape, Tab | — |
| Taxonomy | — | `data-kind`, `data-slot`, `data-state` |
| User ID | — | `data-id` |
| Styling | — | `class`, recipes |
| Type system | — | Props interfaces |
| Registry | — | Kind/material/recipe registration |

---

## File Naming Convention (Locked)

Primitives use literal naming:

```
primitives/dialog/
├── dialog.svelte           # Main component (was Root)
├── dialog.trigger.svelte   # Trigger slot
├── dialog.content.svelte   # Content slot
├── dialog.overlay.svelte   # Overlay slot
├── dialog.title.svelte     # Title slot
├── dialog.description.svelte
├── dialog.close.svelte
├── index.ts                # Barrel export (imports/exports ONLY)
├── types.ts                # Type definitions
├── a11y.md                 # Accessibility contract
└── dialog.test.ts          # Tests
```

**Rules:**
- Folder name == primitive name
- Main file is always `{name}.svelte`
- Sub-slots are `{name}.{slot}.svelte`
- `index.ts` is clean import/export only (no logic)

---

## Data Attribute Contract (Locked)

### Required on EVERY primitive element:

| Attribute | When | Example |
|-----------|------|---------|
| `data-kind` | ALWAYS | `"dialog"`, `"select"` |
| `data-slot` | ALWAYS | `"root"`, `"trigger"`, `"content"` |
| `data-state` | When stateful | `"open"`, `"closed"` |
| `data-id` | When user provides | `"my-dialog"` |

### DEPRECATED — NEVER USE:

- `data-primitive` → use `data-kind`
- `data-name` → use `data-kind`
- `data-part` → use `data-slot`

---

## Melt UI Integration Pattern

### Root Component

```svelte
<script lang="ts">
  import { createDialog, melt } from '@melt-ui/svelte';
  import { setContext } from 'svelte';
  import { DIALOG_CONTEXT_KEY } from './types.js';

  const dialog = createDialog({ ... });
  setContext(DIALOG_CONTEXT_KEY, dialog);
</script>

<div data-kind="dialog" data-slot="root" data-state={open ? 'open' : 'closed'}>
  {@render children?.()}
</div>
```

### Child Components

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
  data-kind="dialog"
  data-slot="content"
  data-state={$open ? 'open' : 'closed'}
>
  {@render children?.({ open: $open })}
</div>
```

---

## Token Pipeline

```
tokens.ts (SSOT)
    ↓ pnpm ds:tokens:build
    ↓
├── tokens.css (CSS custom properties)
├── types.ts (TypeScript types)
├── tailwind.preset.ts (Tailwind theme mapping)
└── surfaces.gen.css (Recipe CSS)
```

---

## Commands

```bash
cd interfaces/desktop/src

# Development
pnpm dev                    # Start dev server

# Token pipeline
pnpm ds:tokens:build        # Generate token outputs
pnpm ds:tokens:watch        # Watch mode

# Type check
pnpm check                  # TypeScript check

# Tests
pnpm test:run primitives/   # Run primitive tests
```

---

## The Rules

1. **Melt UI is the ARIA provider** — ColdLight does NOT set role, aria-*, tabindex
2. **Taxonomy first** — register kind/slots BEFORE writing any primitive
3. **`{name}.svelte` naming** — literal file names, not PascalCase
4. **`index.ts` is clean** — imports/exports only, no logic
5. **Three-tier model** — Primitive → Semantic → Compound
6. **`_internals` isolation** — primitives import Melt via _internals layer
7. **Tests are robust** — minimum counts enforced (35+ for modals, 50+ for selection)
8. **No arbitrary Tailwind** — no `[...]` brackets

---

## Quick Start

**Before writing ANY code:**

1. Read [primitives/CHECKLIST.md](./primitives/CHECKLIST.md) — LAW for all primitives
2. Read [taxonomy/](./taxonomy/) — understand the registry system
3. Read [sys/api/_internal/README.md](./sys/api/_internal/README.md) — Melt UI integration

---

**This is the canonical ColdLight design system.**
