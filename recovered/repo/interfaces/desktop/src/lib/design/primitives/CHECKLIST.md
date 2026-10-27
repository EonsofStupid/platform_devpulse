# ColdLight Primitives — OFFICIAL Checklist

> **LAW. NO EXCEPTIONS. NO SHORTCUTS. NO HACKS.**
>
> **MeltUI** = dsAdapter. Behavior + ARIA provider (roles, aria-*, IDs, focus, keyboard) via `use:melt`
> **ColdLight** = Design System SSOT (data-kind, data-slot, data-state, types, contracts, registry, audit)

---

## CORE DECISION (LOCKED)

| Decision | Value |
|----------|-------|
| **dsAdapter** | MeltUI is the active behavior + ARIA provider, declared in `config/coldlight/adapters.cfg.ts` |
| **Ownership** | ColdLight owns API boundary + structure + taxonomy |
| **ARIA** | Handled by MeltUI via `use:melt={$element}` on slot components |
| **Imports** | All dsAdapter imports go through the import cloak (`taxonomy/.generated/imports.gen.ts`) |

---

## THREE-TIER MODEL (LOCKED)

| Tier | Description | Example |
|------|-------------|---------|
| **A) Primitive** | Structure + data attributes. dsAdapter behavior via `use:melt`. | `Dialog.svelte` |
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

Primitives use **PascalCase naming**:

```
primitives/{kind}/
├── {Kind}.svelte              # Root component
├── {Kind}Trigger.svelte       # Trigger slot
├── {Kind}Content.svelte       # Content slot
├── {Kind}{Slot}.svelte        # Other slots
├── contract.ts                # Re-exports taxonomy contract
├── context.ts                 # Svelte context for child slots
├── types.ts                   # Type definitions
├── index.ts                   # Barrel export (imports/exports ONLY)
├── a11y.md                    # Accessibility contract
├── {Kind}.test.svelte         # Test wrapper
└── {Kind}.test.ts             # Tests (vitest-browser-svelte)
```

**Rules:**
- Folder name == kind name (lowercase)
- Root component is `{Kind}.svelte` (PascalCase)
- Slot components are `{Kind}{Slot}.svelte` (PascalCase, kind-prefixed)
- `index.ts` is clean import/export only (NO LOGIC)
- `contract.ts` re-exports from `taxonomy/kinds/primitives/{kind}/contract.ts`

---

## STEP 0: TAXONOMY FIRST (MANDATORY)

**BEFORE writing ANY primitive code:**

### 0.1 Create Colocated Contract

```typescript
// taxonomy/kinds/primitives/{kind}/contract.ts

import type { PrimitiveContract, SlotStateMap } from "$lib/design/taxonomy/types";

export const dialogSlots = [
  "root",
  "trigger",
  "portal",
  "overlay",
  "content",
  "title",
  "description",
  "close",
] as const;

export type DialogSlot = (typeof dialogSlots)[number];

export const dialogStateTokens = [
  "hidden", "visible", "open",
  "focused", "focus-visible", "focus-within",
  "hover", "active",
  "entering", "exiting",
] as const;

export type DialogState = (typeof dialogStateTokens)[number];

export const dialogSlotStates: SlotStateMap<DialogSlot, DialogState> = {
  root: ["open"],
  trigger: ["focused", "focus-visible", "hover", "active"],
  portal: ["hidden", "visible"],
  overlay: ["visible", "entering", "exiting", "hover"],
  content: ["open", "focus-within", "entering", "exiting"],
  title: [],
  description: [],
  close: ["focused", "focus-visible", "hover", "active"],
} as const;

export const contract: PrimitiveContract<
  "dialog",
  DialogSlot,
  DialogState,
  "aria" | "keyboard"
> = {
  kind: "dialog",
  ariaStateProvider: "meltui",  // or "coldlight" for native elements

  slots: {
    required: ["root", "content"],
    optional: ["trigger", "portal", "overlay", "title", "description", "close"],
    forbidden: [],
  },

  states: {
    shared: ["focused", "focus-visible", "focus-within", "hover", "active"],
    specific: ["hidden", "visible", "open", "entering", "exiting"],
  },

  slotStates: dialogSlotStates,

  slotActions: {
    root: [], trigger: [], portal: [], overlay: [],
    content: [], title: [], description: [], close: [],
  },

  collections: {
    get(key) {
      return {
        aria: {
          role: "dialog",
          requiredAttrs: ["aria-modal", "aria-labelledby"],
          optionalAttrs: ["aria-describedby"],
        },
        keyboard: ["Escape", "Tab"],
      }[key];
    },
  },
};

export default contract;
```

- [ ] Contract created at `taxonomy/kinds/primitives/{kind}/contract.ts`
- [ ] Uses `PrimitiveContract` type from `taxonomy/types.ts`
- [ ] `ariaStateProvider` set correctly (`"meltui"` or `"coldlight"`)
- [ ] All slots declared
- [ ] All states declared
- [ ] `SlotStateMap` maps each slot to its valid states
- [ ] Barrel index at `taxonomy/kinds/primitives/{kind}/index.ts`

### 0.2 Verify ariaStateProvider

| Value | Meaning | Example |
|-------|---------|---------|
| `"meltui"` | dsAdapter provides ARIA via `use:melt`. 3-folder parity (taxonomy + adapter + primitive). | dialog, tabs, select |
| `"coldlight"` | Native HTML handles ARIA. 2-folder parity (taxonomy + primitive). No adapter factory needed. | button, badge, kbd |

- [ ] `ariaStateProvider` matches the kind's ARIA strategy

**DO NOT proceed to Step 1 until Step 0 is complete.**

---

## STEP 1: dsADAPTER FACTORY (if ariaStateProvider = "meltui")

The `api/adapters/meltui/_internal/{kind}/` folder isolates MeltUI integration.

**Skip this step if `ariaStateProvider: "coldlight"`.**

### Required Files

```
api/adapters/meltui/_internal/{kind}/
├── factory.ts          # Wraps MeltUI builder
├── types.ts            # Element → slot mapping, state → token mapping
├── {kind}.ts           # Consolidates exports
└── index.ts            # Barrel
```

### 1.1 factory.ts

```typescript
// api/adapters/meltui/_internal/dialog/factory.ts

import { createDialog, type CreateDialogProps } from "@melt-ui/svelte";

export type MeltDialogInstance = ReturnType<typeof createDialog>;
export type MeltDialogConfig = CreateDialogProps;

export function createMeltDialog(config: MeltDialogConfig): MeltDialogInstance {
  return createDialog(config);
}
```

### 1.2 types.ts

```typescript
// api/adapters/meltui/_internal/dialog/types.ts

import type { DialogSlot, DialogState }
  from "$lib/design/taxonomy/kinds/primitives/dialog/contract";

export const MELT_ELEMENTS = [
  "trigger", "overlay", "content", "title",
  "description", "close", "portalled",
] as const;

export type MeltDialogElement = (typeof MELT_ELEMENTS)[number];

export const ELEMENT_TO_SLOT: Record<MeltDialogElement, DialogSlot> = {
  trigger: "trigger",
  overlay: "overlay",
  content: "content",
  title: "title",
  description: "description",
  close: "close",
  portalled: "portal",
} as const;
```

### 1.3 Import Cloak Entry

The factory is exposed via the import cloak at `taxonomy/.generated/imports.gen.ts`:

```typescript
// AUTO-GENERATED — DO NOT EDIT
export { createMeltDialog as createDialog }
  from "$lib/design/api/adapters/meltui/_internal/dialog/factory";
export { melt } from "@melt-ui/svelte";
```

Primitives NEVER import from `@melt-ui/svelte` directly. All imports go through the cloak.

- [ ] Factory wraps MeltUI builder
- [ ] Types map MeltUI elements → ColdLight slots
- [ ] Import cloak updated in `taxonomy/.generated/imports.gen.ts`
- [ ] Barrel exports all

---

## STEP 2: TYPES FILE (types.ts)

Every primitive MUST have a `types.ts` with:

### 2.1 Slots Array (REQUIRED)

```typescript
export const DialogSlots = [
  'root', 'trigger', 'portal', 'overlay',
  'content', 'title', 'description', 'close',
] as const;

export type DialogSlot = (typeof DialogSlots)[number];
```

- [ ] `{Kind}Slots` array exported
- [ ] `{Kind}Slot` type exported
- [ ] Matches taxonomy contract

### 2.2 State Type (if stateful)

```typescript
export type DialogState = 'open' | 'closed';
```

- [ ] `{Kind}State` type exported

### 2.3 Context Key (REQUIRED)

```typescript
export const DIALOG_CONTEXT_KEY = 'coldlight-dialog';
```

- [ ] `{KIND}_CONTEXT_KEY` exported
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

## STEP 3: COMPONENT FILES

### 3.1 Root Component ({Kind}.svelte)

```svelte
<!--
  @file primitives/dialog/Dialog.svelte
  @layer primitives

  Dialog root - creates dsAdapter builder via import cloak, shares via context.

  dsAdapter (MeltUI) provides:
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
  import { createDialog } from '$lib/design/taxonomy/.generated/imports.gen';
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
  // dsADAPTER BUILDER (via import cloak)
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

- [ ] File header documents dsAdapter/ColdLight responsibilities
- [ ] Imports from import cloak (NOT from `@melt-ui/svelte`)
- [ ] Creates dsAdapter builder
- [ ] Shares builder via `setContext()`
- [ ] Has `data-kind`, `data-slot`, `data-state`

### 3.2 Slot Components ({Kind}{Slot}.svelte)

```svelte
<!--
  @file primitives/dialog/DialogContent.svelte
  @layer primitives

  Dialog content - main container.

  dsAdapter (MeltUI) provides via use:melt:
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
  import { melt } from '$lib/design/taxonomy/.generated/imports.gen';
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

  stripStyleProp(rest, 'DialogContent');

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
- [ ] Imports `melt` from import cloak (NOT from `@melt-ui/svelte`)
- [ ] Uses `use:melt={$element}` for dsAdapter behavior
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
export { default as Root } from './Dialog.svelte';
export { default as Trigger } from './DialogTrigger.svelte';
export { default as Portal } from './DialogPortal.svelte';
export { default as Overlay } from './DialogOverlay.svelte';
export { default as Content } from './DialogContent.svelte';
export { default as Title } from './DialogTitle.svelte';
export { default as Description } from './DialogDescription.svelte';
export { default as Close } from './DialogClose.svelte';

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
- [ ] All slot components exported (PascalCase filenames)
- [ ] All types exported
- [ ] Slots array and context key exported

---

## STEP 5: UPDATE PRIMITIVES INDEX

```typescript
// primitives/index.ts

// Dialog - ColdLight primitive
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

## ARIA Behavior (provided by dsAdapter via use:melt)

| Attribute | Element | Value | Source |
|-----------|---------|-------|--------|
| `role` | Content | `"dialog"` | MeltUI |
| `aria-modal` | Content | `"true"` | MeltUI |
| `aria-labelledby` | Content | Title ID | MeltUI |
| `aria-describedby` | Content | Description ID | MeltUI |
| `aria-haspopup` | Trigger | `"dialog"` | MeltUI |
| `aria-expanded` | Trigger | `"true"/"false"` | MeltUI |

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
- [ ] Sources correctly attributed (dsAdapter vs ColdLight)

---

## STEP 7: TESTS ({Kind}.test.ts)

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
  // ARIA (dsAdapter provides via use:melt)
  // ============================================
  describe('ARIA (dsAdapter)', () => {
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
- [ ] ARIA presence tests (verify dsAdapter)
- [ ] Data attribute tests (verify ColdLight)
- [ ] Keyboard navigation tests
- [ ] Focus management tests
- [ ] State management tests
- [ ] ALL TESTS PASS

---

## STEP 8: VERIFICATION

```bash
cd interfaces/desktop

# Type check
pnpm svelte-check

# Run tests for primitive
pnpm test:run lib/design/primitives/{kind}/

# Run all primitive tests
pnpm test:run lib/design/primitives/

# Scanner validation
pnpm coldlight:verify
```

- [ ] `pnpm svelte-check` passes (no type errors)
- [ ] All tests pass
- [ ] Scanner validates parity

---

## SIGN-OFF CHECKLIST

### Taxonomy (Step 0)
- [ ] Contract at `taxonomy/kinds/primitives/{kind}/contract.ts`
- [ ] `ariaStateProvider` set correctly
- [ ] All slots and states declared
- [ ] Barrel index at `taxonomy/kinds/primitives/{kind}/index.ts`

### dsAdapter Factory (Step 1 — meltui kinds only)
- [ ] Factory at `api/adapters/meltui/_internal/{kind}/factory.ts`
- [ ] Types map MeltUI elements → ColdLight slots
- [ ] Import cloak updated
- [ ] Barrel exports all

### Types (Step 2)
- [ ] `{Kind}Slots` array exported
- [ ] `{Kind}Slot` type exported
- [ ] `{Kind}State` type exported (if stateful)
- [ ] `{KIND}_CONTEXT_KEY` exported
- [ ] Props interface for EVERY slot
- [ ] Every Props has `"data-id"?: string`
- [ ] JSDoc on all interfaces

### Components (Step 3)
- [ ] `{Kind}.svelte` root component
- [ ] `{Kind}{Slot}.svelte` for every slot (PascalCase)
- [ ] Every `.svelte` has file header
- [ ] Root creates dsAdapter builder via import cloak
- [ ] Root shares builder via `setContext()`
- [ ] Children get builder via `getContext()`
- [ ] Slot components use `use:melt={$element}` for dsAdapter behavior
- [ ] NO direct imports from `@melt-ui/svelte` — import cloak only

### Data Attributes (Steps 3-4)
- [ ] Every component has `data-kind="{kind}"`
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
- [ ] ARIA behavior documented with source attribution
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
- [ ] `pnpm svelte-check` passes
- [ ] All tests pass
- [ ] Scanner validates parity

---

## WHAT MeltUI (dsAdapter) PROVIDES

ColdLight does NOT set these — the dsAdapter handles them via `use:melt`:

| Attribute | dsAdapter Sets | ColdLight Sets |
|-----------|----------------|----------------|
| `role` | Yes | No |
| `aria-*` | Yes | No |
| `id` (ARIA linking) | Yes | No |
| `tabindex` | Yes | No |
| `data-melt-*` | Yes | No (ignore) |
| `data-kind` | No | Yes |
| `data-slot` | No | Yes |
| `data-state` | No | Yes |
| `data-id` | No | Yes |
| `class` | No | Yes |

---

## SUMMARY

```
+-----------------------------------------------------------------+
|  dsAdapter (MeltUI) OWNS:                                       |
|  - ARIA attributes (role, aria-*)                               |
|  - ID generation and linking                                    |
|  - Focus management                                             |
|  - Keyboard navigation                                          |
|  - Event handlers                                               |
|  - Floating positioning                                         |
|  - Portal rendering                                             |
|  - Applied via use:melt on slot components                      |
|  - Hidden behind import cloak (taxonomy/.generated/imports.gen) |
+-----------------------------------------------------------------+

+-----------------------------------------------------------------+
|  ColdLight OWNS:                                                |
|  - data-kind (taxonomy)                                         |
|  - data-slot (slot identification)                              |
|  - data-state (visual state)                                    |
|  - data-id (user-controlled)                                    |
|  - class (recipe styling)                                       |
|  - Type system (props interfaces)                               |
|  - Contracts (colocated at taxonomy/kinds/primitives/{kind}/)   |
|  - Registry (runtime manifest lookup)                           |
|  - Scanner (build-time validation)                              |
|  - Tests (robust, minimum counts)                               |
|  - Documentation (a11y.md)                                      |
+-----------------------------------------------------------------+
```

---

**This checklist is LAW. No exceptions.**
