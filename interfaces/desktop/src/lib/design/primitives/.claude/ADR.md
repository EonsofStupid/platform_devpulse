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
4. **Namespace-ready**: Can prefix if needed (`data-cl-primitive`)

### Consequences

- All components must include these attributes
- Tests should verify data attributes exist
- Recipes target via `[data-kind][data-slot][data-state]`
- **DEPRECATED:** `data-kind`, `data-name`, `data-part` (old pattern)

---

## ADR-002: Child Snippet Pattern for ARIA Props

**Date:** 2026-01-20
**Status:** Accepted
**Context:** Bits UI components include ARIA attributes in child snippet props.

### Decision

For components needing custom rendering (Content, Overlay), use child snippets and spread `{...props}`:

```svelte
<BitsDialog.Content {...rest}>
  {#snippet child({ props, open })}
    <div
      {...props}
      class={cn(props.class, className)}
      data-kind="dialog"
      data-slot="content"
      data-state={open ? "open" : "closed"}
    >
      {@render children?.({ open })}
    </div>
  {/snippet}
</BitsDialog.Content>
```

### Rationale

1. **ARIA compliance**: `props` contains `role="dialog"`, `aria-modal`, `aria-labelledby`, `aria-describedby`
2. **ID linkage**: Bits UI generates IDs linking Title/Description to Content
3. **Focus management**: Props include focus-related attributes

### Consequences

- Must ALWAYS spread `{...props}` first
- Class must use `cn(props.class, className)` to preserve Bits UI classes
- State available directly: `{ props, open }` provides `open` boolean
- Some components don't provide state — see ADR-003

---

## ADR-003: Props-Based State Extraction (SnippetProps Gap)

**Date:** 2026-01-21
**Status:** Accepted
**Context:** Bits UI v2.15.4 has inconsistent child snippet APIs.

### Discovery

| Component | Child Snippet Provides | State Available |
|-----------|----------------------|-----------------|
| `Dialog.Content` | `{ props, open }` | ✅ Yes |
| `Dialog.Overlay` | `{ props, open }` | ✅ Yes |
| `Tabs.Trigger` | `{ props }` | ❌ No `selected` |
| `Tabs.Content` | `{ props }` | ❌ No `present` |

**Root Cause** (from `bits-ui/dist/bits/tabs/tabs.svelte.js`):
- `DialogContentState` defines `snippetProps = $derived.by(() => ({ open: ... }))`
- `TabsTriggerState` has NO `snippetProps` definition

### Decision

When state is NOT in child snippet, extract from `props` object:

```svelte
<!-- Tabs Trigger -->
{#snippet child({ props })}
  {@const dataState = props['aria-selected'] === 'true' ? 'active' : 'inactive'}
  <button {...props} data-state={dataState}>

<!-- Tabs Content -->
{#snippet child({ props })}
  {@const dataState = props['data-state']}
  <div {...props} data-state={dataState}>
```

### Rationale

Bits UI DOES include state in `props`:
- `TabsTriggerState.props` has `aria-selected: "true"|"false"`, `data-state: "active"|"inactive"`
- `TabsContentState.props` has `data-state: "active"|"inactive"`, `hidden: true|undefined`

### Consequences

- **Pre-flight check MANDATORY**: Always verify API before coding
- Pattern depends on component — check source
- Document which pattern each primitive uses

---

## ADR-004: Portal Content Testing Pattern

**Date:** 2026-01-21
**Status:** Accepted
**Context:** Portal-rendered content not found in test container.

### Problem

```typescript
const screen = render(DialogTest);
const content = screen.container.querySelector('[data-slot="content"]');
// Returns null! Content is in document.body, not container
```

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
- Must ensure cleanup between tests (vitest-browser handles this)

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
- Old monolithic `.svelte` files must be migrated
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
**Status:** Accepted
**Context:** Bits UI Tooltip requires Provider context that differs from other floating primitives.

### Discovery

When implementing Tooltip, tests failed with:

```
Error: Context "Tooltip.Provider" not found
```

**Root Cause** (from `bits-ui/dist/bits/tooltip/tooltip.svelte.js`):
- `TooltipRootState` expects `TooltipProviderState` context from parent
- Unlike Popover, Tooltip REQUIRES explicit Provider wrapping

| Primitive | Provider Required | Behavior |
|-----------|------------------|----------|
| Popover | No | Works standalone |
| Tooltip | **Yes** | Requires `Tooltip.Provider` ancestor |

### Decision

ColdLight `Tooltip.Root` includes implicit Provider wrapper:

```svelte
<!-- tooltip/Root.svelte -->
<div data-kind="tooltip" data-slot="root" data-state={dataState}>
  <Tooltip.Provider delayDuration={openDelay} {closeDelay}>
    <Tooltip.Root bind:open {onOpenChange} {openDelay} {closeDelay}>
      {@render children?.()}
    </Tooltip.Root>
  </Tooltip.Provider>
</div>
```

### Rationale

1. **User convenience**: Users shouldn't need to remember Provider
2. **Consistent with Bits UI examples**: Their docs show Provider + Root together
3. **Delay propagation**: Provider sets default delays for grouped tooltips

### Consequences

- ColdLight `Tooltip.Root` is self-contained (includes Provider)
- Users CAN use `Tooltip.Provider` separately for grouped tooltips with shared delays
- Pre-flight check MUST verify Provider requirements for future primitives

---

## ADR-008: Manual ARIA Role Attribution

**Date:** 2026-01-21
**Status:** Accepted
**Context:** Not all Bits UI components add their ARIA roles automatically.

### Discovery

Tooltip tests failed:

```typescript
await expect.element(content).toHaveAttribute("role", "tooltip");
// Failed: element has no 'role' attribute
```

**Root Cause**: Bits UI Tooltip does NOT add `role="tooltip"` to Content.

| Primitive | Role Added by Bits UI | Manual Addition |
|-----------|----------------------|-----------------|
| Dialog | `role="dialog"` | ✅ Automatic |
| AlertDialog | `role="alertdialog"` | ✅ Automatic |
| Popover | No role (non-modal) | N/A - correct |
| Tooltip | **No** `role="tooltip"` | ❌ Must add manually |

### Decision

ColdLight adds `role="tooltip"` explicitly in Content.svelte:

```svelte
<!-- tooltip/Content.svelte -->
{#snippet child({ props, open })}
  <div
    {...props}
    role="tooltip"           <!-- MANUAL: Bits UI doesn't add this -->
    class={cn(props.class, className)}
    data-kind="tooltip"
    data-slot="content"
    data-state={dataState}
  >
```

### Rationale

1. **WAI-ARIA compliance**: Tooltip Pattern requires `role="tooltip"`
2. **Screen reader support**: Announces tooltip content correctly
3. **`aria-describedby` linkage**: Bits UI links trigger to content via ID

### Consequences

- Pre-flight check MUST verify which roles Bits UI adds automatically
- ColdLight adds missing roles where WAI-ARIA requires them
- Document in a11y.md which roles are ColdLight-provided vs Bits UI-provided

---

## FUTURE ADRs

Space for future decisions:

### ADR-009: [Reserved]
### ADR-010: [Reserved]

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
