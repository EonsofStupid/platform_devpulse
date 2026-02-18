# ColdLight Primitives — Development Workflow

> **Last Updated:** 2026-02-17
> **ARIA Provider:** ColdLight (native WAI-ARIA APG)
> **Token Pipeline:** Style Dictionary v5 (DTCG 1.0)
> **Styling:** Tailwind CSS v4 (@theme directive)
> **Reactivity:** Svelte 5 Runes ($state, $derived, $effect, $bindable)
> **dsAdapter:** Available for Melt UI escalation — NOT default

---

## ARCHITECTURE OVERVIEW

### Responsibility Split

```
┌─────────────────────────────────────────────────────────────┐
│  SD5 Token Pipeline (Foundation)                            │
│  ──────────────────────────────                             │
│  • DTCG 1.0 token format ($value, $type)                   │
│  • 3-tier: Global → Semantic → Component                   │
│  • Generates CSS custom properties                          │
│  • Generates @theme block for Tailwind v4                   │
│  • Generates TypeScript types                               │
│  • Zod validates all tiers at build time                    │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  ColdLight (ARIA Provider + Design System)                  │
│  ─────────────────────────────────────────                  │
│  • ARIA attributes (role, aria-*) — WAI-ARIA APG patterns  │
│  • Keyboard navigation — native event handlers             │
│  • Focus management — programmatic focus control            │
│  • data-kind          (primitive catalog)                   │
│  • data-slot          (slot identification)                 │
│  • data-state         (visual state for CSS)                │
│  • data-id            (user-controlled stable ID)           │
│  • class              (recipe-based styling via TW4)        │
│  • Type system        (Svelte 5 $props, Zod validation)    │
│  • Registry           (kind/recipe registration)            │
│  • Audit              (scanner, manifest generation)        │
│  Delivery: Native HTML + Svelte 5 runes + event handlers   │
└─────────────────────────────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────┐
│  dsAdapter (EXCEPTION ONLY — Melt UI)                       │
│  ────────────────────────────────────                       │
│  • Available for complex widgets where native ARIA is       │
│    impractical (e.g., combobox virtualization, date picker) │
│  • Accessed via api/adapters/meltui/_internal/              │
│  • NEVER imported directly by components                    │
│  • Must be justified in contract with WHY comment           │
│  • 3-folder parity: catalog/kinds + api/adapters + prims   │
└─────────────────────────────────────────────────────────────┘
```

### Key Principles

1. **ColdLight = ARIA Provider** — Native WAI-ARIA APG patterns, no library dependency
2. **SD5 = Token Pipeline** — DTCG 1.0 tokens drive all CSS generation
3. **Tailwind v4 = Styling** — @theme directive consumes SD5 tokens
4. **Svelte 5 Runes** — $state, $derived, $effect, $bindable for all reactivity
5. **`data-kind` Attribute** — All primitives emit `data-kind="{name}"`
6. **Robust Tests** — Foundation-level test coverage, not minimal
7. **Context Pattern** — Root creates state, shares via setContext/getContext
8. **AI-Introspectable** — Schemas and contracts readable by AI agents

---

## STRICT WORKFLOW PROCESS

Every primitive MUST follow these phases in order. No skipping.

### Phase 0: Pre-Flight Check (MANDATORY)

Before writing ANY code:

1. **Check WAI-ARIA APG** for the pattern:
   - https://www.w3.org/WAI/ARIA/apg/patterns/
   - What ARIA role does this primitive need?
   - What keyboard interactions are required?
   - What focus management rules apply?

2. **Check SD5 token availability:**
   - Does `tokens/components.ts` have Tier 3 tokens for this kind?
   - If not, add them BEFORE building the primitive.

3. **Determine archetype:**
   - **Archetype A (DEFAULT):** ColdLight-owned. Native HTML + ARIA.
   - **Archetype B (EXCEPTION):** dsAdapter needed. Justify WHY in contract.

**Why this matters:** Knowing the ARIA pattern upfront prevents rework. Knowing the tokens exist prevents broken styling.

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

**4. Props interfaces** (one per slot, Svelte 5 pattern)
```typescript
import type { Snippet } from 'svelte';
import type { HTMLButtonAttributes } from 'svelte/elements';

export interface {Name}RootProps extends Omit<HTMLButtonAttributes, 'style' | 'children'> {
  children?: Snippet;
  'data-id'?: string;
  class?: string;
}
```

- Always `Omit<HTML*Attributes, 'style' | 'children'>`
- Always include `'data-id'?: string`
- Snippet types for children (Svelte 5)
- Use `$bindable()` for controlled state props

**Verification:**
```bash
pnpm svelte-check  # No errors in {name}/types.ts
```

---

### Phase 2: Root Component

Root creates state and shares via Svelte context. ColdLight owns ARIA directly.

```svelte
<script lang="ts">
  import { setContext } from 'svelte';
  import { {NAME}_CONTEXT_KEY } from './types.js';
  import type { {Name}RootProps } from './types.js';
  import { cn } from '../types.js';

  let {
    children,
    open = $bindable(false),
    onOpenChange,
    class: className,
    'data-id': dataId,
    ...rest
  }: {Name}RootProps = $props();

  // Derived state for data-state attribute
  const dataState = $derived(open ? 'open' : 'closed');

  // Share state via context for child components
  const context = $derived({
    get open() { return open; },
    toggle() {
      open = !open;
      onOpenChange?.(open);
    },
    close() {
      open = false;
      onOpenChange?.(false);
    },
  });

  setContext({NAME}_CONTEXT_KEY, () => context);
</script>

<div
  role="{appropriate-aria-role}"
  data-kind="{name}"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
  class={cn(className)}
  {...rest}
>
  {@render children?.()}
</div>
```

**Key patterns:**
- `$bindable()` for controlled props (Svelte 5)
- `$derived()` for computed state
- `setContext()` wraps a getter function for reactivity
- ARIA role set directly on element (ColdLight-owned)
- `cn()` from shared types for class merging (clsx + tailwind-merge)

**Verification:**
```bash
pnpm svelte-check  # No errors in Root.svelte
```

---

### Phase 3: Child Components

Children get state from context and render with ARIA:

```svelte
<script lang="ts">
  import { getContext } from 'svelte';
  import { {NAME}_CONTEXT_KEY } from './types.js';
  import type { {Name}ContentProps } from './types.js';
  import { cn } from '../types.js';

  let {
    children,
    class: className,
    'data-id': dataId,
    ...rest
  }: {Name}ContentProps = $props();

  const getCtx = getContext<() => { open: boolean; toggle: () => void; close: () => void }>(
    {NAME}_CONTEXT_KEY
  );
  const ctx = $derived(getCtx());
</script>

{#if ctx.open}
  <div
    role="{appropriate-aria-role}"
    aria-labelledby="{linked-id}"
    data-kind="{name}"
    data-slot="content"
    data-state={ctx.open ? 'open' : 'closed'}
    data-id={dataId}
    class={cn(className)}
    {...rest}
  >
    {@render children?.()}
  </div>
{/if}
```

**ARIA patterns per slot type (ColdLight-owned):**

| Slot Type | ARIA Role | Key Attributes | Keyboard |
|-----------|-----------|----------------|----------|
| Root | varies | aria-label/labelledby | -- |
| Trigger | button | aria-expanded, aria-controls | Enter, Space |
| Content | varies | aria-labelledby | Escape to close |
| Overlay | none/presentation | aria-hidden on background | Click to dismiss |
| Title | heading | aria-level, id (for labelledby) | -- |
| Description | paragraph | id (for describedby) | -- |
| Close | button | aria-label="Close" | Enter, Space |
| Item | option/menuitem | aria-selected/checked | Arrow keys |

**Keyboard handling (native, no library):**
```svelte
<script>
  function handleKeydown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Escape':
        ctx.close();
        e.preventDefault();
        break;
      case 'Tab':
        // Focus trap logic if modal
        break;
    }
  }
</script>

<div onkeydown={handleKeydown} ...>
```

**Verification:**
```bash
pnpm svelte-check  # No errors in *.svelte files
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
```

**Verification:**
```bash
pnpm svelte-check  # No import errors
```

---

### Phase 5: Tests (ROBUST)

Create `{name}/{Name}.test.svelte` (test wrapper) and `{name}/{Name}.test.ts`.

**Test structure:**

```typescript
import { describe, it, expect } from 'vitest';
import { render } from 'vitest-browser-svelte';
import TestWrapper from './{Name}.test.svelte';

describe('{Name} Primitive', () => {
  describe('ARIA (ColdLight-owned)', () => {
    it('renders correct role', async () => {
      const screen = render(TestWrapper);
      await expect.element(
        screen.getByRole('{role}')
      ).toBeInTheDocument();
    });

    it('has aria-expanded on trigger', async () => {
      // ...
    });

    it('links aria-labelledby to title', async () => {
      // ...
    });
  });

  describe('Data Attributes (ColdLight)', () => {
    it('emits data-kind="{name}"', async () => {
      const screen = render(TestWrapper);
      const root = screen.container.querySelector('[data-kind="{name}"]');
      await expect.element(root).toBeInTheDocument();
    });

    it('emits data-slot on all slots', async () => {
      // ...
    });

    it('emits data-state reflecting current state', async () => {
      // ...
    });

    it('forwards data-id prop', async () => {
      // ...
    });
  });

  describe('Keyboard Navigation', () => {
    it('Enter/Space activates trigger', async () => { /* ... */ });
    it('Escape closes content', async () => { /* ... */ });
    it('Tab moves focus correctly', async () => { /* ... */ });
  });

  describe('Focus Management', () => {
    it('traps focus inside modal content', async () => { /* ... */ });
    it('returns focus to trigger on close', async () => { /* ... */ });
  });

  describe('State Management', () => {
    it('supports controlled open state via $bindable', async () => { /* ... */ });
    it('calls onOpenChange callback', async () => { /* ... */ });
  });

  describe('Edge Cases', () => {
    it('handles disabled state', async () => { /* ... */ });
    it('handles dynamic children', async () => { /* ... */ });
  });
});
```

**Minimum test counts:**

| Primitive Type | Minimum |
|----------------|---------|
| Simple (button, badge, label) | 15+ |
| Modal (dialog, alert-dialog, sheet) | 35+ |
| Selection (select, combobox, radio) | 50+ |
| Navigation (tabs, menubar, toolbar) | 40+ |
| Floating (popover, tooltip, dropdown) | 30+ |

**Verification:**
```bash
pnpm test:run lib/design/primitives/{name}/  # All tests pass
```

---

### Phase 6: Documentation

Create `{name}/a11y.md` covering:
- ARIA attributes (what ColdLight renders)
- Keyboard interaction table (per WAI-ARIA APG)
- Focus management rules
- Data attributes (data-kind, data-slot, data-state, data-id)
- WAI-ARIA APG reference link

---

## VERIFICATION COMMANDS

Run these at each checkpoint:

```bash
cd interfaces/desktop

# After Phase 1 (Types)
pnpm svelte-check

# After Phase 2-3 (Components)
pnpm svelte-check

# After Phase 4 (Exports)
pnpm svelte-check

# After Phase 5 (Tests)
pnpm test:run lib/design/primitives/{name}/
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
- [ ] ColdLight owns all ARIA (role, aria-*, keyboard, focus)
- [ ] Root shares state via `setContext()` (Svelte 5)
- [ ] Children get state via `getContext()` (Svelte 5)
- [ ] Props use `$props()` with `$bindable()` for controlled state
- [ ] Derived state uses `$derived()`
- [ ] All components have `data-kind="{name}"`
- [ ] All components have `data-slot="{slot}"`
- [ ] `primitives/index.ts` exports the primitive

### Tests
- [ ] Minimum test count met
- [ ] ARIA presence tests (ColdLight-owned)
- [ ] Data attribute tests
- [ ] Keyboard tests (per WAI-ARIA APG)
- [ ] Focus tests
- [ ] State tests ($bindable controlled mode)
- [ ] ALL TESTS PASS

### Quality
- [ ] `pnpm svelte-check` passes
- [ ] WAI-ARIA APG pattern followed

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

### "ARIA attributes missing"
**Cause:** ColdLight component not rendering role/aria-* attributes
**Fix:** Add correct ARIA attributes per WAI-ARIA APG pattern directly to element

### "Context not found"
**Cause:** Child component not wrapped in Root
**Fix:** Ensure Root calls `setContext()`, child calls `getContext()` with same key

### "Keyboard not working"
**Cause:** Missing `onkeydown` handler on interactive element
**Fix:** Add keyboard event handler per WAI-ARIA APG pattern

### "Focus trap not working"
**Cause:** Modal content not trapping focus
**Fix:** Implement focus trap in Root component (track focusable elements, wrap Tab key)

### "$bindable not updating parent"
**Cause:** Svelte 5 runes reactivity issue
**Fix:** Ensure prop is declared with `$bindable()` and parent uses `bind:prop`

---

## dsADAPTER ESCALATION (EXCEPTION ONLY)

If a primitive's ARIA/focus/keyboard pattern is too complex for native implementation:

1. **Document WHY** in the contract (comment explaining complexity)
2. **Use Archetype B** — `ariaStateProvider: "meltui"`
3. **Import from `api/adapters/meltui/_internal/`** — NEVER from `@melt-ui/svelte` directly
4. **3-folder parity enforced** — catalog/kinds + api/adapters/meltui + primitives

Examples that MAY justify escalation:
- Combobox with virtualized listbox
- Date picker with calendar grid navigation
- Complex nested menu systems

**The bar is HIGH.** Most primitives should be ColdLight-owned.

---

## PRIMITIVE QUICK REFERENCE

| Primitive | Archetype | ARIA Role | Key Elements | Key States |
|-----------|-----------|-----------|--------------|------------|
| Button | A (ColdLight) | button | root | pressed, disabled, loading |
| Dialog | A (ColdLight) | dialog | trigger, overlay, content, title, description, close | open |
| Popover | A (ColdLight) | -- | trigger, content, arrow | open |
| Tooltip | A (ColdLight) | tooltip | trigger, content | open |
| Select | A (ColdLight) | listbox | trigger, content, option | open, selected |
| Tabs | A (ColdLight) | tablist/tab/tabpanel | list, trigger, content | value |
| Accordion | A (ColdLight) | -- | item, trigger, content | value |
| Checkbox | A (ColdLight) | checkbox | root, indicator | checked |
| Switch | A (ColdLight) | switch | root, thumb | checked |
| Slider | A (ColdLight) | slider | root, track, thumb | value |
| Radio Group | A (ColdLight) | radiogroup/radio | root, item | value |

See WAI-ARIA APG for complete pattern documentation:
https://www.w3.org/WAI/ARIA/apg/patterns/

---

## DECISION LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-20 | Compound folders for all primitives | Scalable, testable, documentable |
| 2026-01-21 | Portal testing with document.querySelector | Portal renders outside container |
| 2026-01-23 | Builder context pattern | Share state between compound components |
| 2026-01-23 | Robust test requirements | Foundation quality, not minimal coverage |
| 2026-02-17 | **ColdLight owns ARIA (not Melt UI)** | SD5-driven, no library dependency, WAI-ARIA APG native |
| 2026-02-17 | **SD5 DTCG token pipeline drives everything** | Single source of truth for all CSS generation |
| 2026-02-17 | **dsAdapter available but NOT default** | Melt UI only when justified by ARIA complexity |
| 2026-02-17 | **Svelte 5 runes exclusively** | $state, $derived, $effect, $bindable — no legacy |
| 2026-02-17 | **Tailwind v4 @theme** | CSS-first config, tokens as CSS custom properties |
