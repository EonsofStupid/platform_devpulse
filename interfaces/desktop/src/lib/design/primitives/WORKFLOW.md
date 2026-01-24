# ColdLight Primitives — Development Workflow

> **Last Updated:** 2026-01-23
> **ARIA Provider:** Melt UI
> **Architecture:** See ADR-009, ADR-010, ADR-011

---

## ARCHITECTURE OVERVIEW

### Responsibility Split

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

### Key Principles

1. **Melt UI = ARIA Provider** — All accessibility via `use:melt`
2. **ColdLight = Design System** — Taxonomy, types, styling, audit
3. **`data-kind` Attribute** — All primitives emit `data-kind="{name}"`
4. **Robust Tests** — Foundation-level test coverage, not minimal
5. **Builder Context Pattern** — Root creates builder, shares via context

---

## STRICT WORKFLOW PROCESS

Every primitive MUST follow these phases in order. No skipping.

### Phase 0: Pre-Flight Check (MANDATORY)

Before writing ANY code, check the Melt UI builder API:

```bash
# Reference the tech_refs documentation
cat tech_refs/melt-ui/builders/{primitive}.md
```

Verify:
- [ ] Builder exists: `create{Name}` from `@melt-ui/svelte`
- [ ] Elements available: `elements: { trigger, content, ... }`
- [ ] States available: `states: { open, ... }`
- [ ] Builder options match your props needs

**Why this matters:** Each Melt builder has different options, elements, and states. Knowing the API upfront prevents rework.

---

### Phase 1: Types First

Create `{name}/types.ts` with:

**1. Slots array** (const for type inference)
```typescript
export const {Name}Slots = ['root', 'trigger', 'content', ...] as const;
export type {Name}Slot = (typeof {Name}Slots)[number];
```

**2. State type**
```typescript
export type {Name}State = 'open' | 'closed';
```

**3. Context key**
```typescript
export const {NAME}_CONTEXT_KEY = 'coldlight-{name}';
```

**4. Props interfaces** (one per slot)
- Always `Omit<HTML*Attributes, 'style' | 'children'>`
- Always include `'data-id'?: string`
- Snippet types for children

**Verification:**
```bash
pnpm check  # No errors in {name}/types.ts
```

---

### Phase 2: Root Component

Root creates the Melt builder and shares via Svelte context:

```svelte
<script lang="ts">
  import { create{Name} } from '@melt-ui/svelte';
  import { setContext } from 'svelte';
  import { {NAME}_CONTEXT_KEY } from './types.js';

  // Create builder with controlled props
  const {name} = create{Name}({
    defaultOpen: open,
    onOpenChange: (details) => {
      open = details.open;
      onOpenChange?.(details.open);
    },
  });

  // Share builder via context
  setContext({NAME}_CONTEXT_KEY, {name});
</script>

<div
  data-kind="{name}"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  {@render children?.()}
</div>
```

**Verification:**
```bash
pnpm check  # No errors in Root.svelte
```

---

### Phase 3: Child Components

Children get builder from context and use `use:melt`:

```svelte
<script lang="ts">
  import { melt } from '@melt-ui/svelte';
  import { getContext } from 'svelte';
  import { {NAME}_CONTEXT_KEY } from './types.js';

  const {name} = getContext({NAME}_CONTEXT_KEY);
  const { elements: { content }, states: { open } } = {name};
</script>

<div
  use:melt={$content}
  class={className}
  data-kind="{name}"
  data-slot="content"
  data-state={$open ? 'open' : 'closed'}
  data-id={dataId}
>
  {@render children?.({ open: $open })}
</div>
```

**Pattern for each slot type:**

| Slot Type | use:melt | data-state |
|-----------|----------|------------|
| Root | No (wrapper only) | Yes |
| Trigger | Yes (`$trigger`) | Optional |
| Content | Yes (`$content`) | Yes |
| Overlay | Yes (`$overlay`) | Yes |
| Title | Yes (`$title`) | No |
| Description | Yes (`$description`) | No |
| Close | Yes (`$close`) | No |
| Portal | No (container only) | No |
| Arrow | Yes (`$arrow`) | No |

**Verification:**
```bash
pnpm check  # No errors in *.svelte files
```

---

### Phase 4: Barrel Export

Create `{name}/index.ts`:

```typescript
// Components
export { default as Root } from './Root.svelte';
export { default as Trigger } from './Trigger.svelte';
export { default as Content } from './Content.svelte';
// ... all slots

// Types
export type { {Name}RootProps, ... } from './types.js';
export { {Name}Slots, {NAME}_CONTEXT_KEY } from './types.js';
```

Update `primitives/index.ts`:
```typescript
export * as {Name} from './{name}/index.js';
export type { ... } from './{name}/index.js';
export { {Name}Slots } from './{name}/index.js';
```

**Verification:**
```bash
pnpm check  # No import errors
```

---

### Phase 5: Tests (ROBUST)

Create `{name}/{Name}.test.svelte` (test wrapper) and `{name}/{Name}.test.ts`.

**Test structure:**

```typescript
describe('{Name} Primitive', () => {
  describe('ARIA (Melt UI)', () => {
    // Verify Melt's ARIA attributes are present
  });

  describe('Data Attributes (ColdLight)', () => {
    // Verify data-kind, data-slot, data-state, data-id
  });

  describe('Keyboard Navigation', () => {
    // Full keyboard interaction per WAI-ARIA pattern
  });

  describe('Focus Management', () => {
    // Focus trap, return, initial focus
  });

  describe('State Management', () => {
    // Controlled mode, callbacks, bindable
  });

  describe('Edge Cases', () => {
    // Disabled, nested, dynamic content
  });
});
```

**Minimum test counts:**

| Primitive Type | Minimum |
|----------------|---------|
| Simple | 15+ |
| Modal | 35+ |
| Selection | 50+ |
| Navigation | 40+ |
| Floating | 30+ |

**Portal content testing:**
```typescript
// Portal renders to document.body, NOT screen.container
const content = document.querySelector('[data-slot="content"]');
await expect.element(content).toHaveAttribute('data-state', 'open');
```

**Verification:**
```bash
pnpm test:run lib/design/primitives/{name}/  # All tests pass
```

---

### Phase 6: Documentation

Create `{name}/a11y.md` covering:
- ARIA attributes (what Melt provides)
- Keyboard interaction table
- Focus management rules
- Data attributes (what ColdLight provides)

**Verification:**
```bash
pnpm audit:primitives  # {Name} shows ✅
pnpm docs:primitives   # Updates PRIMITIVES.md
```

---

## VERIFICATION COMMANDS

Run these at each checkpoint:

```bash
cd interfaces/desktop/src

# After Phase 1 (Types)
pnpm check

# After Phase 2-3 (Components)
pnpm check

# After Phase 4 (Exports)
pnpm check

# After Phase 5 (Tests)
pnpm test:run lib/design/primitives/{name}/

# After Phase 6 (Docs)
pnpm audit:primitives
pnpm docs:primitives
```

---

## COMPLETION CHECKLIST

Before marking ANY primitive complete, verify ALL of these:

### Structure
- [ ] `{name}/index.ts` — Barrel export exists
- [ ] `{name}/types.ts` — Has Slots, State, Context key, all Props
- [ ] `{name}/*.svelte` — All slot components exist
- [ ] `{name}/a11y.md` — Accessibility contract documented
- [ ] `{name}/{Name}.test.svelte` — Test wrapper exists
- [ ] `{name}/{Name}.test.ts` — Tests exist and pass

### Implementation
- [ ] Root creates Melt builder
- [ ] Root shares builder via `setContext()`
- [ ] Children get builder via `getContext()`
- [ ] Interactive elements use `use:melt={$element}`
- [ ] All components have `data-kind="{name}"`
- [ ] All components have `data-slot="{slot}"`
- [ ] `primitives/index.ts` exports the primitive

### Tests
- [ ] Minimum test count met
- [ ] ARIA presence tests
- [ ] Data attribute tests
- [ ] Keyboard tests
- [ ] Focus tests
- [ ] State tests
- [ ] ALL TESTS PASS

### Quality
- [ ] `pnpm audit:primitives` shows ✅
- [ ] `pnpm check` passes

---

## DATA ATTRIBUTE CONTRACT

All primitives MUST emit:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Primitive type | `"dialog"`, `"select"` |
| `data-slot` | Slot within primitive | `"root"`, `"content"` |
| `data-state` | Current state (if stateful) | `"open"`, `"closed"` |
| `data-id` | User-controlled stable ID | `"my-dialog"` |

**DEPRECATED:** `data-primitive`, `data-name`, `data-part`

---

## TROUBLESHOOTING

### "Tests fail with undefined element"
**Cause:** Portal renders content to `document.body`, not `screen.container`
**Fix:** Use `document.querySelector('[data-slot="content"]')` instead of `screen.container.querySelector()`

### "Melt builder not found in context"
**Cause:** Child component not wrapped in Root
**Fix:** Ensure Root creates and sets context, child gets from same context key

### "ARIA attributes missing"
**Cause:** Missing `use:melt` on element
**Fix:** Add `use:melt={$elementName}` to the element

### "Type errors on builder"
**Cause:** Wrong builder options or elements
**Fix:** Check `tech_refs/melt-ui/builders/{primitive}.md` for correct API

---

## MIGRATION NOTES

Existing bits-ui primitives will be migrated to Melt UI. The changes are:

| bits-ui Pattern | Melt UI Pattern |
|-----------------|-----------------|
| `{...props}` spreading | `use:melt={$element}` action |
| `useId()` from bits-ui | Melt generates IDs internally |
| Child snippet `{ props, open }` | Builder `states.open` store |
| Manual ARIA overrides | Melt handles all ARIA |

---

## BUILDER QUICK REFERENCE

| Primitive | Builder | Key Elements | Key States |
|-----------|---------|--------------|------------|
| Dialog | `createDialog` | trigger, content, overlay, title, description, close | open |
| Popover | `createPopover` | trigger, content, arrow | open |
| Tooltip | `createTooltip` | trigger, content, arrow | open |
| Select | `createSelect` | trigger, menu, option | open, selected |
| Tabs | `createTabs` | list, trigger, content | value |
| Accordion | `createAccordion` | item, trigger, content | value |

See `tech_refs/melt-ui/` for complete builder documentation.

---

## DECISION LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-20 | Compound folders for all primitives | Scalable, testable, documentable |
| 2026-01-21 | Portal testing with document.querySelector | Portal renders outside container |
| 2026-01-23 | **Melt UI as ARIA provider (ADR-009)** | Stop fighting library, accept ARIA delegation |
| 2026-01-23 | Builder context pattern (ADR-010) | Share builder between compound components |
| 2026-01-23 | Robust test requirements (ADR-011) | Foundation quality, not minimal coverage |
