# Architecture Decision Records — Primitives

> Captured decisions and rationale for ColdLight primitives architecture.
> These inform future primitive development.

---

## ADR-001: Data Attribute Contract

**Date:** 2026-01-20
**Status:** Accepted
**Context:** Need consistent CSS targeting across all primitives.

### Decision

All primitives emit these data attributes:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Identifies primitive type | `"dialog"`, `"popover"` |
| `data-slot` | Identifies slot within primitive | `"root"`, `"content"`, `"trigger"` |
| `data-state` | Current state | `"open"`, `"closed"`, `"active"` |
| `data-id` | User-defined stable ID | `"my-dialog"` |

### Rationale

1. **Predictable CSS selectors**: `[data-kind="dialog"][data-state="open"]`
2. **Testing stability**: `data-id` provides stable selectors that don't change with styling
3. **No style prop**: Forces recipe-based styling via class prop
4. **Namespace-ready**: Can prefix if needed (`data-cl-kind`)

### Consequences

- All components must include these attributes
- Tests should verify data attributes exist
- Recipes target via `[data-kind][data-slot][data-state]`
- **DEPRECATED:** `data-primitive`, `data-name`, `data-part` (old pattern)

---

## ADR-002: Child Snippet Pattern for ARIA Props

**Date:** 2026-01-20
**Status:** ~~Accepted~~ **SUPERSEDED by ADR-009**
**Superseded by:** ADR-009 (Melt UI as ARIA Provider)

### Original Decision (melt-ui)

For components needing custom rendering, use child snippets and spread `{...props}`.

### Why Superseded

ColdLight now uses Melt UI as the ARIA provider. The `use:melt` action replaces `{...props}` spreading.

---

## ADR-003: Props-Based State Extraction (SnippetProps Gap)

**Date:** 2026-01-21
**Status:** ~~Accepted~~ **SUPERSEDED by ADR-009**
**Superseded by:** ADR-009 (Melt UI as ARIA Provider)

### Original Decision (melt-ui)

Extract state from `props` object when not in child snippet.

### Why Superseded

Melt UI builders return state directly via `states` object. No extraction needed.

---

## ADR-004: Portal Content Testing Pattern

**Date:** 2026-01-21
**Status:** Accepted
**Context:** Portal-rendered content not found in test container.

### Decision

Use `document.querySelector` for portal-rendered content:

```typescript
// Open the component first
await userEvent.click(trigger);

// Query document directly for portal content
const content = document.querySelector('[data-slot="content"]');
await expect.element(content).toHaveAttribute("data-state", "open");
```

### Rationale

1. **Portal behavior**: Portal renders children to `document.body` (or specified target)
2. **Test container scope**: `screen.container` only includes directly rendered content
3. **Consistent pattern**: Works for all portal-based primitives

### Consequences

- Tests must use correct query method based on where content renders
- Trigger is in container: `screen.getByRole("button")`
- Content is in document: `document.querySelector('[data-slot="content"]')`

---

## ADR-005: Compound Folder Structure

**Date:** 2026-01-20
**Status:** Accepted
**Context:** Primitives need consistent, scalable organization.

### Decision

Every primitive (except truly simple ones like Button) uses folder structure:

```
{name}/
├── index.ts           # Barrel export
├── types.ts           # All types for this primitive
├── Root.svelte        # State container
├── Trigger.svelte     # Opens/activates
├── Content.svelte     # Main content
├── [Other].svelte     # Other slots as needed
├── a11y.md            # Accessibility contract
├── {Name}.test.svelte # Test wrapper component
└── {Name}.test.ts     # vitest-browser tests
```

### Rationale

1. **Colocated types**: Types right next to components
2. **Isolated tests**: Each primitive has own test file
3. **Documented a11y**: Contract captured per-primitive
4. **Namespace exports**: `import { Dialog } from "$lib/design/primitives"` → `Dialog.Root`, `Dialog.Content`

### Consequences

- All new primitives follow this structure
- Audit script checks for structure completeness
- Index exports must use `export * as {Name} from "./{name}/index.js"`

---

## ADR-006: No Style Prop

**Date:** 2026-01-20
**Status:** Accepted
**Context:** Need to enforce recipe-based styling.

### Decision

All primitive props use `Omit<HTML*Attributes, "style" | "children">`:

```typescript
export interface DialogContentProps
  extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
  children?: Snippet<[{ open: boolean }]>;
  "data-id"?: string;
}
```

Runtime enforcement via `stripStyleProp(rest, "ComponentName")` in development.

### Rationale

1. **Recipe enforcement**: Styling must go through class prop + recipes
2. **Consistency**: All components styled the same way
3. **VPB compatibility**: Visual Page Builder generates class-based styles
4. **Dev warning**: `stripStyleProp` warns but doesn't break

### Consequences

- No inline styles on primitives
- Styling via `class` prop + Tailwind/recipes
- TypeScript error if trying to pass `style`
- Dev console warning if bypassed via `any`

---

## ADR-007: Tooltip Provider Context Requirement

**Date:** 2026-01-21
**Status:** ~~Accepted~~ **SUPERSEDED by ADR-009**
**Superseded by:** ADR-009 (Melt UI as ARIA Provider)

### Original Decision (melt-ui)

ColdLight `Tooltip.Root` includes implicit Provider wrapper.

### Why Superseded

Melt UI Tooltip uses builder pattern. Provider handled differently.

---

## ADR-008: Manual ARIA Role Attribution

**Date:** 2026-01-21
**Status:** ~~Accepted~~ **SUPERSEDED by ADR-009**
**Superseded by:** ADR-009 (Melt UI as ARIA Provider)

### Original Decision (melt-ui)

ColdLight adds missing ARIA roles manually.

### Why Superseded

Melt UI handles all ARIA via `use:melt` action. ColdLight does not manage ARIA.

---

## ADR-009: Melt UI as ARIA Provider

**Date:** 2026-01-23
**Status:** Accepted
**Context:** ColdLight needs accessible primitives without fighting library ARIA ownership.

### Decision

**Melt UI is the ARIA provider. ColdLight owns everything else.**

```
┌─────────────────────────────────────────────────────────────┐
│  Melt UI (ARIA Provider)                                    │
│  ───────────────────────                                    │
│  • ARIA attributes (role, aria-*)                           │
│  • ID generation and linking                                │
│  • Focus management                                         │
│  • Keyboard navigation                                      │
│  • Event handlers                                           │
│  • Floating positioning                                     │
│  • Portal rendering                                         │
│  Delivery: use:melt={$element} action                       │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ColdLight (Design System)                                  │
│  ─────────────────────────                                  │
│  • data-kind          (primitive taxonomy)                  │
│  • data-slot          (slot identification)                 │
│  • data-state         (visual state for CSS)                │
│  • data-id            (user-controlled stable ID)           │
│  • class              (recipe-based styling)                │
│  • Type system        (props interfaces, validation)        │
│  • Registry           (kind/material/recipe registration)   │
│  • Audit              (diagram generation, JSDOC)           │
└─────────────────────────────────────────────────────────────┘
```

### Pattern

```svelte
<script lang="ts">
  import { createDialog, melt } from '@melt-ui/svelte';

  const dialog = createDialog();
  const { elements: { trigger, content }, states: { open } } = dialog;
</script>

<!-- Melt: ARIA, focus, keyboard -->
<!-- ColdLight: data-kind, data-slot, class -->
<button
  use:melt={$trigger}
  class={triggerClass}
  data-kind="dialog"
  data-slot="trigger"
>
  Open
</button>

{#if $open}
  <div
    use:melt={$content}
    class={contentClass}
    data-kind="dialog"
    data-slot="content"
    data-state={$open ? "open" : "closed"}
  >
    Content
  </div>
{/if}
```

### Rationale

1. **No fighting**: Accept Melt's ARIA instead of overriding
2. **Correctness**: Melt handles complex ARIA linking (aria-labelledby, aria-describedby, aria-controls)
3. **Maintainability**: Melt updates ARIA patterns, ColdLight benefits automatically
4. **Separation**: Clear boundary between behavior (Melt) and design (ColdLight)
5. **Senior dev pattern**: This is how design systems use headless libraries

### Consequences

- `use:melt={$element}` on all interactive elements
- ColdLight does NOT set: `role`, `aria-*`, `id` (for ARIA linking)
- ColdLight DOES set: `data-kind`, `data-slot`, `data-state`, `data-id`, `class`
- Tests verify Melt's ARIA is present AND ColdLight's data attributes are present
- Existing melt-ui primitives will be migrated

---

## ADR-010: Builder Context Pattern

**Date:** 2026-01-23
**Status:** Accepted
**Context:** Need to share Melt UI builder between compound primitive components.

### Decision

Root component creates builder, shares via Svelte context:

```svelte
<!-- Root.svelte -->
<script lang="ts">
  import { createDialog } from '@melt-ui/svelte';
  import { setContext } from 'svelte';
  import { DIALOG_CONTEXT_KEY } from './types.js';

  const dialog = createDialog({
    // Pass through controlled props
  });

  // Share entire builder with children
  setContext(DIALOG_CONTEXT_KEY, dialog);
</script>
```

```svelte
<!-- Content.svelte -->
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
  data-state={$open ? "open" : "closed"}
>
```

### Rationale

1. **Single builder**: One builder instance per primitive tree
2. **Linked elements**: All elements from same builder share ARIA linking
3. **Svelte pattern**: Context is idiomatic for compound components
4. **Type safety**: Context key is typed constant

### Consequences

- Each primitive defines `{NAME}_CONTEXT_KEY` in types.ts
- Root creates builder and sets context
- Children get context and destructure needed elements/states
- No ID management needed — Melt handles internally

---

## ADR-011: Robust Test Requirements

**Date:** 2026-01-23
**Status:** Accepted
**Context:** Primitives are foundation — tests must be comprehensive, not minimal.

### Decision

Every primitive must have robust tests covering:

| Category | Description | Minimum |
|----------|-------------|---------|
| **ARIA presence** | Verify Melt's ARIA attributes exist | 5+ tests |
| **Data attributes** | Verify ColdLight's data-kind, data-slot, data-state | 6+ tests |
| **Keyboard navigation** | Full keyboard interaction per WAI-ARIA pattern | 8+ tests |
| **Focus management** | Focus trap, focus return, initial focus | 4+ tests |
| **State management** | Controlled mode, callbacks, bindable | 5+ tests |
| **Edge cases** | Disabled, nested, dynamic content | 3+ tests |

### Test Count Requirements

| Primitive Type | Minimum Tests |
|----------------|---------------|
| Simple (Button, Separator) | 15+ |
| Modal (Dialog, AlertDialog, Sheet) | 35+ |
| Selection (Select, Combobox) | 50+ |
| Navigation (Tabs, Accordion) | 40+ |
| Floating (Popover, Tooltip, DropdownMenu) | 30+ |

### Test File Structure

```typescript
/**
 * @file primitives/{name}/{Name}.test.ts
 * @layer primitives
 *
 * Tests for {Name} primitive.
 * Runs in real Chromium browser via vitest-browser-svelte.
 */

describe("{Name} Primitive", () => {
  describe("ARIA (Melt UI)", () => {
    // Verify Melt's ARIA attributes are applied
  });

  describe("Data Attributes (ColdLight)", () => {
    // Verify ColdLight's taxonomy attributes
  });

  describe("Keyboard Navigation", () => {
    // Full keyboard interaction
  });

  describe("Focus Management", () => {
    // Focus trap, return, initial
  });

  describe("State Management", () => {
    // Controlled, callbacks, bindable
  });

  describe("Edge Cases", () => {
    // Disabled, nested, dynamic
  });
});
```

### Rationale

1. **Foundation quality**: Primitives are base of entire design system
2. **Regression prevention**: Comprehensive tests catch breaking changes
3. **Documentation**: Tests serve as usage documentation
4. **Confidence**: Robust tests enable fearless refactoring

### Consequences

- No primitive is complete without meeting test minimums
- Audit script verifies test counts
- PRs must maintain or increase test coverage
- Tests are real browser tests (vitest-browser-svelte), not jsdom

---

## FUTURE ADRs

Space for future decisions:

### ADR-012: [Reserved]
### ADR-013: [Reserved]

---

## TEMPLATE

When adding new ADR:

```markdown
## ADR-XXX: [Title]

**Date:** YYYY-MM-DD
**Status:** Proposed | Accepted | Deprecated | Superseded by ADR-XXX
**Context:** [What prompted this decision?]

### Decision

[What was decided]

### Rationale

[Why this decision was made]

### Consequences

[What are the implications?]
```
