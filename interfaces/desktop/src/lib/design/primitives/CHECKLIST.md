# ColdLight Primitives — OFFICIAL Checklist

> **LAW. NO EXCEPTIONS. NO SHORTCUTS. NO HACKS.**
>
> **Melt UI** = ARIA Provider (roles, aria-*, IDs, focus, keyboard)
> **ColdLight** = Design System (data-kind, data-slot, data-state, types, registry, audit)

---

## CORE DECISION (LOCKED)

| Decision | Value |
|----------|-------|
| **Provider** | Melt UI is the behavior + ARIA provider |
| **Ownership** | ColdLight owns API boundary + structure + taxonomy |
| **ARIA** | Handled by Melt UI via `use:melt={$element}` |

---

## THREE-TIER MODEL (LOCKED)

| Tier | Description | Example |
|------|-------------|---------|
| **A) Primitive** | Melt UI wrapper. Emits data-kind/slot/state. ARIA via Melt. | `dialog.svelte` |
| **B) Semantic** | Styled component from primitives + recipes. User-facing API. | `MainButton.svelte` |
| **C) Compound** | Structured assembly from semantics. Forms, panels, flows. | `LoginForm.svelte` |

---

## PRIMITIVE CONTRACT (LOCKED)

Every primitive is identified via exactly three attributes:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Primitive identity | `"dialog"`, `"select"`, `"button"` |
| `data-slot` | Part within primitive | `"root"`, `"trigger"`, `"content"` |
| `data-state` | State machine output | `"open"`, `"closed"`, `"active"` |

Nothing else is required at the primitive boundary.

### DEPRECATED — NEVER USE

- `data-primitive` → use `data-kind`
- `data-name` → use `data-kind`
- `data-part` → use `data-slot`

---

## FILE NAMING CONVENTION (LOCKED)

Primitives use **literal naming**:

```
primitives/{name}/
├── {name}.svelte              # Main component
├── {name}.trigger.svelte      # Trigger slot
├── {name}.content.svelte      # Content slot
├── {name}.{slot}.svelte       # Other slots
├── index.ts                   # Barrel export (imports/exports ONLY)
├── types.ts                   # Type definitions
├── a11y.md                    # Accessibility contract
├── {name}.test.svelte         # Test wrapper
└── {name}.test.ts             # Tests (vitest-browser-svelte)
```

**Rules:**
- Folder name == primitive name
- Main file is always `{name}.svelte`
- Sub-slots are `{name}.{slot}.svelte`
- `index.ts` is clean import/export only (NO LOGIC)

---

## STEP 0: TAXONOMY FIRST (MANDATORY)

**BEFORE writing ANY primitive code:**

### 0.1 Verify Kind Exists

```typescript
// taxonomy/primitiveKinds.ts
export const PrimitiveKinds = [
  // ...
  "dialog",  // ← Must exist
  // ...
] as const;
```

- [ ] Kind registered in `taxonomy/primitiveKinds.ts`
- [ ] `isPrimitiveKind()` validates it

### 0.2 Verify Slots Exist

```typescript
// taxonomy/primitiveRegistry.ts
export const PrimitiveSlots = {
  dialog: ["root", "trigger", "portal", "overlay", "content", "header", "title", "description", "footer", "close"] as const,
};
```

- [ ] Slots registered in `taxonomy/primitiveRegistry.ts`
- [ ] All required slots defined

### 0.3 Verify Metadata

```typescript
// taxonomy/primitiveRegistry.ts
export const PrimitiveMetadata: Record<PrimitiveKind, PrimitiveMetadata> = {
  dialog: {
    description: "Modal dialog",
    meltBuilder: "createDialog",  // ← Melt UI builder name
    ariaRole: "dialog",
    managesFocus: true,
    supportsControlled: true,
  },
};
```

- [ ] Metadata entry exists
- [ ] `meltBuilder` references correct Melt UI builder
- [ ] ARIA role documented
- [ ] Focus management documented

### 0.4 Verify State Enum (if stateful)

- [ ] State type exists (e.g., `DialogState = "open" | "closed"`)

**DO NOT proceed to Step 1 until Step 0 is complete.**

---

## STEP 1: PROVIDER LAYER (_internal/melt/)

The `sys/api/_internal/melt/` folder isolates Melt UI integration.

### Required Files

```
sys/api/_internal/
├── README.md           # Integration documentation
├── index.ts            # Barrel export
└── melt/
    ├── index.ts        # Melt-specific barrel
    ├── types.ts        # Builder return types
    ├── state.ts        # State extraction helpers
    └── schemas.ts      # Zod validation schemas
```

### 1.1 types.ts

```typescript
import type { CreateDialogReturn, CreateSelectReturn } from '@melt-ui/svelte';

/** Dialog builder return type for context */
export type DialogBuilder = CreateDialogReturn;

/** Extract elements from builder */
export type BuilderElements<T> = T extends { elements: infer E } ? E : never;

/** Extract states from builder */
export type BuilderStates<T> = T extends { states: infer S } ? S : never;
```

### 1.2 state.ts

```typescript
/** Extract open/closed state string */
export function extractOpenState(open: boolean): 'open' | 'closed' {
  return open ? 'open' : 'closed';
}

/** Extract active/inactive state string */
export function extractActiveState(active: boolean): 'active' | 'inactive' {
  return active ? 'active' : 'inactive';
}
```

### 1.3 schemas.ts

```typescript
import { z } from 'zod';

export const OpenStatePropsSchema = z.object({
  open: z.boolean().optional(),
  onOpenChange: z.function().args(z.boolean()).returns(z.void()).optional(),
});

export const PositioningPropsSchema = z.object({
  side: z.enum(['top', 'right', 'bottom', 'left']).optional(),
  sideOffset: z.number().optional(),
  align: z.enum(['start', 'center', 'end']).optional(),
  alignOffset: z.number().optional(),
});
```

- [ ] `_internal/melt/` folder exists
- [ ] `types.ts` exports builder types
- [ ] `state.ts` exports state helpers
- [ ] `schemas.ts` exports validation schemas
- [ ] `index.ts` barrel exports all

---

## STEP 2: TYPES FILE (types.ts)

Every primitive MUST have a `types.ts` with:

### 2.1 Slots Array (REQUIRED)

```typescript
export const DialogSlots = [
  'root',
  'trigger',
  'portal',
  'overlay',
  'content',
  'header',
  'title',
  'description',
  'footer',
  'close',
] as const;

export type DialogSlot = (typeof DialogSlots)[number];
```

- [ ] `{Name}Slots` array exported
- [ ] `{Name}Slot` type exported
- [ ] Matches `taxonomy/primitiveRegistry.ts`

### 2.2 State Type (if stateful)

```typescript
export type DialogState = 'open' | 'closed';
```

- [ ] `{Name}State` type exported

### 2.3 Context Key (REQUIRED)

```typescript
export const DIALOG_CONTEXT_KEY = 'coldlight-dialog';
```

- [ ] `{NAME}_CONTEXT_KEY` exported
- [ ] Prefixed with `coldlight-`

### 2.4 Props Interfaces (ONE PER SLOT)

```typescript
export interface DialogRootProps {
  /** Controlled open state (bindable) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Children */
  children?: Snippet;
  /** User-defined stable ID */
  'data-id'?: string;
}

export interface DialogContentProps
  extends Omit<HTMLAttributes<HTMLDivElement>, 'style' | 'children'> {
  /** Snippet receives { open } for animations */
  children?: Snippet<[{ open: boolean }]> | Snippet;
  /** User-defined stable ID */
  'data-id'?: string;
}
```

- [ ] Props interface for EVERY slot
- [ ] Every Props has `'data-id'?: string`
- [ ] JSDoc on all interfaces and props
- [ ] `style` and `children` omitted from HTML attributes

---

## STEP 3: COMPONENT FILES ({name}.svelte)

### 3.1 Main Component ({name}.svelte)

```svelte
<!--
  @file primitives/dialog/dialog.svelte
  @layer primitives

  Dialog root - creates Melt builder and shares via context.

  Melt UI provides:
  - State management (open/closed)
  - Builder for child elements

  ColdLight provides:
  - data-kind, data-slot, data-state
  - Type-safe props
  - Context sharing

  Data Attributes:
  - data-kind="dialog"
  - data-slot="root"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { createDialog } from '@melt-ui/svelte';
  import { setContext } from 'svelte';
  import type { DialogRootProps, DialogState } from './types.js';
  import { DIALOG_CONTEXT_KEY } from './types.js';

  let {
    open = $bindable(false),
    onOpenChange,
    children,
    "data-id": dataId,
  }: DialogRootProps = $props();

  // ============================================
  // MELT UI BUILDER
  // ============================================
  const dialog = createDialog({
    defaultOpen: open,
    onOpenChange: (details) => {
      open = details.open;
      onOpenChange?.(details.open);
    },
  });

  // ============================================
  // SHARE BUILDER VIA CONTEXT
  // ============================================
  setContext(DIALOG_CONTEXT_KEY, dialog);

  // ============================================
  // COLDLIGHT STATE
  // ============================================
  const dataState: DialogState = $derived(open ? 'open' : 'closed');
</script>

<div
  data-kind="dialog"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  {#if children}
    {@render children()}
  {/if}
</div>
```

- [ ] File header documents Melt/ColdLight responsibilities
- [ ] Creates Melt builder
- [ ] Shares builder via `setContext()`
- [ ] Has `data-kind`, `data-slot`, `data-state`

### 3.2 Interactive Slot Components ({name}.{slot}.svelte)

```svelte
<!--
  @file primitives/dialog/dialog.content.svelte
  @layer primitives

  Dialog content - main container with Melt ARIA.

  Melt UI provides:
  - role="dialog", aria-modal, aria-labelledby, aria-describedby
  - Focus trapping
  - Escape key handling

  ColdLight provides:
  - data-kind, data-slot, data-state
  - class (recipe styling)

  Data Attributes:
  - data-kind="dialog"
  - data-slot="content"
  - data-state="open" | "closed"
-->
<script lang="ts">
  import { melt } from '@melt-ui/svelte';
  import { getContext } from 'svelte';
  import type { DialogContentProps, DialogState } from './types.js';
  import { DIALOG_CONTEXT_KEY } from './types.js';
  import { stripStyleProp } from '../types.js';

  let {
    children,
    class: className = '',
    "data-id": dataId,
    ...rest
  }: DialogContentProps = $props();

  stripStyleProp(rest, 'Dialog.Content');

  // ============================================
  // GET BUILDER FROM CONTEXT
  // ============================================
  const dialog = getContext(DIALOG_CONTEXT_KEY);
  const { elements: { content }, states: { open } } = dialog;

  // ============================================
  // COLDLIGHT STATE
  // ============================================
  const dataState: DialogState = $derived($open ? 'open' : 'closed');
</script>

<!--
  use:melt applies:
  - role="dialog"
  - aria-modal="true"
  - aria-labelledby (linked to title)
  - aria-describedby (linked to description)
  - Focus trap
  - Event handlers
-->
<div
  use:melt={$content}
  class={className}
  data-kind="dialog"
  data-slot="content"
  data-state={dataState}
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children({ open: $open })}
  {/if}
</div>
```

- [ ] Gets builder via `getContext()`
- [ ] Uses `use:melt={$element}` for ARIA
- [ ] Has `data-kind`, `data-slot`, `data-state`
- [ ] `{...rest}` for passthrough props

---

## STEP 4: BARREL EXPORT (index.ts)

```typescript
/**
 * @file primitives/dialog/index.ts
 * @layer primitives
 *
 * Dialog primitive namespace export.
 */

// Components
export { default as Root } from './dialog.svelte';
export { default as Trigger } from './dialog.trigger.svelte';
export { default as Portal } from './dialog.portal.svelte';
export { default as Overlay } from './dialog.overlay.svelte';
export { default as Content } from './dialog.content.svelte';
export { default as Title } from './dialog.title.svelte';
export { default as Description } from './dialog.description.svelte';
export { default as Close } from './dialog.close.svelte';

// Types
export type {
  DialogRootProps,
  DialogTriggerProps,
  DialogPortalProps,
  DialogOverlayProps,
  DialogContentProps,
  DialogTitleProps,
  DialogDescriptionProps,
  DialogCloseProps,
  DialogState,
  DialogSlot,
} from './types.js';

export { DialogSlots, DIALOG_CONTEXT_KEY } from './types.js';
```

- [ ] `index.ts` is imports/exports ONLY
- [ ] NO logic in index.ts
- [ ] All slot components exported
- [ ] All types exported
- [ ] Slots array and context key exported

---

## STEP 5: UPDATE PRIMITIVES INDEX

```typescript
// primitives/index.ts

// Dialog - ColdLight wrapped primitive
export * as Dialog from "./dialog/index.js";
export type {
  DialogRootProps,
  DialogContentProps,
  // ... all props
  DialogState,
  DialogSlot,
} from "./dialog/index.js";
export { DialogSlots, DIALOG_CONTEXT_KEY } from "./dialog/index.js";
```

- [ ] Namespace export added
- [ ] All types re-exported
- [ ] Slots and context key re-exported

---

## STEP 6: ACCESSIBILITY DOCUMENTATION (a11y.md)

```markdown
# Dialog Primitive — Accessibility Contract

> Modal dialog for focused user interaction.
> Based on [WAI-ARIA Dialog Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/).

## ARIA Behavior

| Attribute | Element | Value | Source |
|-----------|---------|-------|--------|
| `role` | Content | `"dialog"` | Melt UI |
| `aria-modal` | Content | `"true"` | Melt UI |
| `aria-labelledby` | Content | Title ID | Melt UI |
| `aria-describedby` | Content | Description ID | Melt UI |
| `aria-haspopup` | Trigger | `"dialog"` | Melt UI |
| `aria-expanded` | Trigger | `"true"/"false"` | Melt UI |

## Keyboard Interaction

| Key | Action |
|-----|--------|
| `Tab` | Move focus within dialog |
| `Shift+Tab` | Move focus backward |
| `Escape` | Close dialog |

## Focus Management

1. On open: Focus moves to first focusable element in content
2. While open: Focus trapped within content
3. On close: Focus returns to trigger
```

- [ ] `a11y.md` exists
- [ ] ARIA behavior documented
- [ ] Keyboard interaction documented
- [ ] Focus management documented
- [ ] Sources correctly attributed (Melt UI vs ColdLight)

---

## STEP 7: TESTS ({name}.test.ts)

### Minimum Test Counts (ENFORCED)

| Primitive Type | Minimum Tests |
|----------------|---------------|
| Simple (Button, Separator) | 15+ |
| Modal (Dialog, AlertDialog, Sheet) | 35+ |
| Selection (Select, Combobox) | 50+ |
| Navigation (Tabs, Accordion) | 40+ |
| Floating (Popover, Tooltip, DropdownMenu) | 30+ |

### Test Categories

```typescript
describe('Dialog Primitive', () => {
  // ============================================
  // ARIA (Melt UI provides)
  // ============================================
  describe('ARIA (Melt UI)', () => {
    it('content has role="dialog"', async () => {});
    it('content has aria-modal="true"', async () => {});
    it('content has aria-labelledby linked to title', async () => {});
    it('content has aria-describedby linked to description', async () => {});
    it('trigger has aria-haspopup="dialog"', async () => {});
    it('trigger has aria-expanded reflecting open state', async () => {});
  });

  // ============================================
  // DATA ATTRIBUTES (ColdLight owns)
  // ============================================
  describe('Data Attributes (ColdLight)', () => {
    it('root has data-kind="dialog"', async () => {});
    it('root has data-slot="root"', async () => {});
    it('root has data-state reflecting open', async () => {});
    it('content has data-kind="dialog"', async () => {});
    it('content has data-slot="content"', async () => {});
    it('passes through data-id', async () => {});
  });

  // ============================================
  // KEYBOARD NAVIGATION
  // ============================================
  describe('Keyboard Navigation', () => {
    it('Escape closes dialog', async () => {});
    it('Tab moves focus within dialog', async () => {});
    it('Shift+Tab moves focus backward', async () => {});
    it('focus is trapped within dialog', async () => {});
  });

  // ============================================
  // FOCUS MANAGEMENT
  // ============================================
  describe('Focus Management', () => {
    it('moves focus to content on open', async () => {});
    it('returns focus to trigger on close', async () => {});
    it('traps focus within content', async () => {});
  });

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  describe('State Management', () => {
    it('supports controlled mode', async () => {});
    it('supports uncontrolled mode', async () => {});
    it('fires onOpenChange callback', async () => {});
    it('binds open state correctly', async () => {});
  });

  // ============================================
  // INTEGRATION
  // ============================================
  describe('Integration', () => {
    it('renders all slots correctly', async () => {});
    it('portal renders outside DOM hierarchy', async () => {});
    it('overlay covers viewport', async () => {});
  });
});
```

- [ ] Test file exists
- [ ] Minimum test count met
- [ ] ARIA presence tests (verify Melt)
- [ ] Data attribute tests (verify ColdLight)
- [ ] Keyboard navigation tests
- [ ] Focus management tests
- [ ] State management tests
- [ ] ALL TESTS PASS

---

## STEP 8: VERIFICATION

```bash
cd interfaces/desktop/src

# Type check
pnpm check

# Run tests for primitive
pnpm test:run lib/design/primitives/{name}/

# Run all primitive tests
pnpm test:run lib/design/primitives/

# Audit primitives
pnpm audit:primitives
```

- [ ] `pnpm check` passes (no type errors)
- [ ] All tests pass
- [ ] Audit shows primitive complete

---

## SIGN-OFF CHECKLIST

### Taxonomy (Step 0)
- [ ] Kind registered in `primitiveKinds.ts`
- [ ] Slots registered in `primitiveRegistry.ts`
- [ ] Metadata entry exists with `meltBuilder`
- [ ] State type exists (if stateful)

### Provider Layer (Step 1)
- [ ] `_internal/melt/` folder structured
- [ ] Builder types exported
- [ ] State helpers exported

### Types (Step 2)
- [ ] `{Name}Slots` array exported
- [ ] `{Name}Slot` type exported
- [ ] `{Name}State` type exported (if stateful)
- [ ] `{NAME}_CONTEXT_KEY` exported
- [ ] Props interface for EVERY slot
- [ ] Every Props has `"data-id"?: string`
- [ ] JSDoc on all interfaces

### Components (Step 3)
- [ ] `{name}.svelte` file for every slot
- [ ] File naming: `{name}.{slot}.svelte`
- [ ] Every `.svelte` has file header
- [ ] Root creates Melt builder
- [ ] Root shares builder via `setContext()`
- [ ] Children get builder via `getContext()`
- [ ] Interactive elements use `use:melt={$element}`

### Data Attributes (Steps 3-4)
- [ ] Every component has `data-kind="{name}"`
- [ ] Every component has `data-slot="{slot}"`
- [ ] Stateful components have `data-state`
- [ ] `data-id` passed through when provided

### Barrel Export (Steps 4-5)
- [ ] `index.ts` is imports/exports ONLY
- [ ] `primitives/index.ts` exports namespace
- [ ] All Props types re-exported
- [ ] Slots and State re-exported

### Documentation (Step 6)
- [ ] `a11y.md` exists
- [ ] ARIA behavior documented
- [ ] Keyboard interaction documented
- [ ] Focus management documented

### Tests (Step 7)
- [ ] Minimum test count met
- [ ] ARIA presence tests
- [ ] Data attribute tests
- [ ] Keyboard tests
- [ ] Focus tests
- [ ] State tests
- [ ] ALL TESTS PASS

### Verification (Step 8)
- [ ] `pnpm check` passes
- [ ] All tests pass
- [ ] Audit shows complete

---

## WHAT MELT UI PROVIDES

ColdLight does NOT set these — Melt handles them via `use:melt`:

| Attribute | Melt Sets | ColdLight Sets |
|-----------|-----------|----------------|
| `role` | ✅ | ❌ |
| `aria-*` | ✅ | ❌ |
| `id` (ARIA linking) | ✅ | ❌ |
| `tabindex` | ✅ | ❌ |
| `data-melt-*` | ✅ | ❌ (ignore) |
| `data-kind` | ❌ | ✅ |
| `data-slot` | ❌ | ✅ |
| `data-state` | ❌ | ✅ |
| `data-id` | ❌ | ✅ |
| `class` | ❌ | ✅ |

---

## SUMMARY

```
┌─────────────────────────────────────────────────────────────┐
│  Melt UI OWNS:                                              │
│  • ARIA attributes (role, aria-*)                           │
│  • ID generation and linking                                │
│  • Focus management                                         │
│  • Keyboard navigation                                      │
│  • Event handlers                                           │
│  • Floating positioning                                     │
│  • Portal rendering                                         │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ColdLight OWNS:                                            │
│  • data-kind (taxonomy)                                     │
│  • data-slot (slot identification)                          │
│  • data-state (visual state)                                │
│  • data-id (user-controlled)                                │
│  • class (recipe styling)                                   │
│  • Type system (props interfaces)                           │
│  • Registry (taxonomy alignment)                            │
│  • Tests (robust, minimum counts)                           │
│  • Documentation (a11y.md)                                  │
└─────────────────────────────────────────────────────────────┘
```

---

**This checklist is LAW. No exceptions.**
