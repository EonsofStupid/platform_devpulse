# SPRINT: Primitive 4-Folder Parity Policy + Dialog Implementation

> **Status**: PLANNING
> **Goal**: Enforce 4-folder parity via lefthook + complete Dialog primitive with ARIA/behavior/tests

---

## ARCHITECTURE: 4-Folder Parity Requirement

Every primitive MUST have these 4 folders in parity:

| # | Location | Purpose | Required Files |
|---|----------|---------|----------------|
| 1 | `taxonomy/primitives/<kind>/` | Contract (SSOT) | `contract.ts`, `index.ts` |
| 2 | `api/adapters/coldlight/_internal/<kind>/` | ColdLight public API | `types.ts`, `contract.ts`, `<kind>.ts`, `index.ts` |
| 3 | `api/adapters/meltui/_internal/<kind>/` | MeltUI mapping | `types.ts`, `contract.ts`, `<kind>.ts`, `index.ts` |
| 4 | `primitives/<kind>/` | Svelte component | `<Kind>.svelte`, `context.ts`, `types.ts`, `contract.ts`, `<kind>.ts`, `index.ts` |

### File Responsibilities

**taxonomy/primitives/<kind>/contract.ts**
- Defines slots, states, ARIA requirements, keyboard shortcuts
- This is the SSOT for the primitive's specification

**api/adapters/coldlight/_internal/<kind>/**
- `types.ts` - Public prop interface (DialogProps, DialogSlotProps)
- `contract.ts` - Re-exports taxonomy contract + ColdLight-specific DATA_ATTRS
- `<kind>.ts` - Consolidates exports
- `index.ts` - Barrel

**api/adapters/meltui/_internal/<kind>/**
- `types.ts` - MeltUI element → ColdLight slot mapping
- `contract.ts` - What MeltUI handles vs what ColdLight adds
- `<kind>.ts` - Consolidates exports
- `index.ts` - Barrel

**primitives/<kind>/**
- `<Kind>.svelte` - Actual Svelte component with MeltUI integration
- `context.ts` - Svelte context for compound components
- `types.ts` - Re-exports from ColdLight types
- `contract.ts` - Re-exports from taxonomy contract
- `<kind>.ts` - Consolidates exports
- `index.ts` - Barrel (exports component + all types)

---

## PHASE 1: Create Parity Scanner Script

### Task 1.1: Create scanner script

**File**: `scripts/check-primitive-parity.ts`

```typescript
/**
 * Primitive 4-Folder Parity Scanner
 *
 * Scans for all primitives in taxonomy/primitives/
 * and verifies the 4-folder requirement is met.
 */

const DESIGN_ROOT = "packages/coldlight";

const REQUIRED_FOLDERS = [
  "taxonomy/primitives",
  "api/adapters/coldlight/_internal",
  "api/adapters/meltui/_internal",
  "primitives",
] as const;

// Scan taxonomy/primitives/ for primitive kinds (folders)
// For each kind, check all 4 folders exist
// Report any missing folders
```

**Verification**: Script runs and reports parity status

- [ ] Task 1.1 complete

### Task 1.2: Add lefthook pre-commit hook

**File**: `lefthook.yml`

Add to pre-commit:
```yaml
primitive-parity:
  glob: "packages/coldlight/{taxonomy/primitives,api/adapters,primitives}/**/*.{ts,svelte}"
  run: npx tsx scripts/check-primitive-parity.ts
```

**Verification**: `lefthook run pre-commit` passes

- [ ] Task 1.2 complete

---

## PHASE 2: Complete Dialog Taxonomy Contract

### Task 2.1: Verify/update taxonomy/primitives/dialog/contract.ts

**File**: `packages/coldlight/taxonomy/primitives/dialog/contract.ts`

Must export:
- `contract` - Full primitive contract object
- `dialogSlots` - ["root", "trigger", "portal", "overlay", "content", "title", "description", "close"]
- `dialogStates` - ["open", "closed"]
- `dialogSlotStates` - Per-slot state mappings
- `DialogSlot` type
- `DialogState` type
- ARIA requirements:
  - `role: "dialog"` or `"alertdialog"`
  - `aria-modal: "true"` when open
  - `aria-labelledby` → title element
  - `aria-describedby` → description element
- Keyboard requirements:
  - `Escape` → close dialog
  - Focus trap within content

**Verification**: `pnpm svelte-check` passes

- [ ] Task 2.1 complete

### Task 2.2: Verify taxonomy/primitives/dialog/index.ts barrel

**Verification**: All exports accessible

- [ ] Task 2.2 complete

---

## PHASE 3: Complete api/adapters/coldlight/_internal/dialog/

### Task 3.1: Implement types.ts

**File**: `api/adapters/coldlight/_internal/dialog/types.ts`

```typescript
export interface DialogProps {
  /** Controlled open state */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Close when clicking outside content */
  closeOnOutsideClick?: boolean;
  /** Close on Escape key */
  escapeBehavior?: "close" | "ignore" | "defer-otherwise-close";
  /** Trap focus within dialog */
  trapFocus?: boolean;
  /** Prevent body scroll when open */
  preventScroll?: boolean;
  /** Dialog role */
  role?: "dialog" | "alertdialog";
}

export interface DialogSlotProps {
  root: Record<string, unknown>;
  trigger: Record<string, unknown>;
  portal: Record<string, unknown>;
  overlay: Record<string, unknown>;
  content: Record<string, unknown>;
  title: Record<string, unknown>;
  description: Record<string, unknown>;
  close: Record<string, unknown>;
}
```

- [ ] Task 3.1 complete

### Task 3.2-3.4: Complete remaining files

- [ ] Task 3.2: contract.ts
- [ ] Task 3.3: dialog.ts
- [ ] Task 3.4: index.ts

---

## PHASE 4: Complete api/adapters/meltui/_internal/dialog/

### Task 4.1: Implement types.ts

**File**: `api/adapters/meltui/_internal/dialog/types.ts`

```typescript
/** MeltUI element names */
export const MELT_ELEMENTS = [
  "trigger",
  "overlay",
  "content",
  "title",
  "description",
  "close",
  "portalled",
] as const;

/** Map MeltUI element → ColdLight slot */
export const ELEMENT_TO_SLOT: Record<string, string> = {
  trigger: "trigger",
  overlay: "overlay",
  content: "content",
  title: "title",
  description: "description",
  close: "close",
  portalled: "portal",
};
```

- [ ] Task 4.1 complete

### Task 4.2-4.4: Complete remaining files

- [ ] Task 4.2: contract.ts
- [ ] Task 4.3: dialog.ts
- [ ] Task 4.4: index.ts

---

## PHASE 5: Complete primitives/dialog/ Svelte Component

### Task 5.1: Implement Dialog.svelte

**File**: `primitives/dialog/Dialog.svelte`

Requirements:
- Use MeltUI `createDialog` with correct props
- Set context for compound components
- Apply data attributes: `data-kind="dialog"`, `data-slot="root"`, `data-state`
- Support all DialogProps

```svelte
<script lang="ts">
  import { createDialog } from "@melt-ui/svelte";
  import { setDialogContext } from "./context.js";
  import type { DialogProps } from "./types.js";

  // Props
  let {
    open = $bindable(false),
    onOpenChange,
    closeOnOutsideClick = true,
    escapeBehavior = "close",
    preventScroll = true,
    role = "dialog",
    children,
  }: DialogProps & { children?: Snippet } = $props();

  // MeltUI dialog
  const dialog = createDialog({
    defaultOpen: open,
    closeOnOutsideClick,
    escapeBehavior,
    preventScroll,
    role,
    forceVisible: true,
  });

  // Context
  setDialogContext(dialog);

  // Sync state
  $effect(() => {
    const isOpen = $dialog.states.open;
    if (isOpen !== open) {
      open = isOpen;
      onOpenChange?.(isOpen);
    }
  });
</script>

<div data-kind="dialog" data-slot="root" data-state={open ? "open" : "closed"}>
  {@render children?.()}
</div>
```

- [ ] Task 5.1 complete

### Task 5.2: Implement compound components

Create additional components:
- `DialogTrigger.svelte`
- `DialogPortal.svelte`
- `DialogOverlay.svelte`
- `DialogContent.svelte`
- `DialogTitle.svelte`
- `DialogDescription.svelte`
- `DialogClose.svelte`

Each applies MeltUI element action + ColdLight data attributes.

- [ ] Task 5.2 complete

### Task 5.3-5.6: Complete supporting files

- [ ] Task 5.3: context.ts
- [ ] Task 5.4: types.ts (re-export from coldlight)
- [ ] Task 5.5: contract.ts (re-export from taxonomy)
- [ ] Task 5.6: dialog.ts + index.ts

---

## PHASE 6: Tests

### Task 6.1: Vitest unit tests

**File**: `primitives/dialog/dialog.test.ts`

Test cases:
- [ ] Opens when trigger clicked
- [ ] Closes on Escape when escapeBehavior="close"
- [ ] Closes on outside click when closeOnOutsideClick=true
- [ ] Focus trapped within content
- [ ] ARIA attributes correct (role, aria-modal, aria-labelledby, aria-describedby)
- [ ] data-state reflects open/closed
- [ ] onOpenChange callback fires

### Task 6.2: Playwright E2E tests

**File**: `e2e/primitives/dialog.spec.ts`

Test cases:
- [ ] Keyboard navigation (Tab, Escape)
- [ ] Screen reader announces dialog
- [ ] Focus returns to trigger on close
- [ ] Scroll locked when open

---

## PHASE 7: Verification

### Task 7.1: Run parity scanner

```bash
npx tsx scripts/check-primitive-parity.ts
```

Expected: dialog shows 4/4 folders

- [ ] Task 7.1 complete

### Task 7.2: Run svelte-check

```bash
cd interfaces/desktop && pnpm svelte-check
```

- [ ] Task 7.2 complete

### Task 7.3: Run tests

```bash
cd interfaces/desktop && pnpm test
```

- [ ] Task 7.3 complete

---

## COMPLETION CHECKLIST

### Phase 1: Parity Scanner
- [ ] 1.1 Scanner script created
- [ ] 1.2 Lefthook hook added

### Phase 2: Taxonomy Contract
- [ ] 2.1 contract.ts complete
- [ ] 2.2 index.ts barrel complete

### Phase 3: ColdLight Adapter
- [ ] 3.1-3.4 All files complete

### Phase 4: MeltUI Adapter
- [ ] 4.1-4.4 All files complete

### Phase 5: Svelte Component
- [ ] 5.1 Dialog.svelte complete
- [ ] 5.2 Compound components complete
- [ ] 5.3-5.6 Supporting files complete

### Phase 6: Tests
- [ ] 6.1 Vitest tests pass
- [ ] 6.2 Playwright tests pass

### Phase 7: Verification
- [ ] 7.1 Parity scanner passes
- [ ] 7.2 svelte-check passes
- [ ] 7.3 All tests pass

---

## SIGN-OFF

- [ ] All tasks complete
- [ ] Lefthook policy enforces 4-folder parity
- [ ] Dialog primitive fully implemented with ARIA/behavior
- [ ] All tests pass
- [ ] Sprint marked COMPLETE
