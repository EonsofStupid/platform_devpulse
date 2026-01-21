# ColdLight Primitives — Development Workflow

> **Last Updated:** 2026-01-21
> **Completed:** Button, Dialog, Sheet, Tabs, AlertDialog, Popover, Tooltip (7 primitives)
> **Next:** Select (Sprint 7)

---

## STRICT WORKFLOW PROCESS

Every primitive MUST follow these phases in order. No skipping.

### Phase 0: Pre-Flight Check (MANDATORY)

Before writing ANY code, verify the Bits UI API:

```bash
# Check if component exposes state in child snippets
cat node_modules/bits-ui/dist/bits/{primitive}/{primitive}.svelte.js | grep -A10 "snippetProps"
```

| If `snippetProps` EXISTS | If `snippetProps` MISSING |
|--------------------------|---------------------------|
| Destructure: `{ props, open }` | Extract from props: `props['data-state']` |
| Follow Dialog pattern | Follow Tabs pattern |

**Why this matters:** Bits UI v2.15.4 has inconsistent APIs. Dialog exposes `open` in child snippets, but Tabs does NOT expose `selected`. Skipping this check causes test failures.

---

### Phase 1: Types First

Create `{name}/types.ts` with:

1. **Slots array** (const for type inference)
```typescript
export const {Name}Slots = ["root", "trigger", "content", ...] as const;
export type {Name}Slot = (typeof {Name}Slots)[number];
```

2. **State type**
```typescript
export type {Name}State = "open" | "closed";
```

3. **Props interfaces** (one per slot)
- Always `Omit<HTML*Attributes, "style" | "children">`
- Always include `"data-id"?: string`
- Snippet types for children

**Verification:**
```bash
pnpm check  # No errors in {name}/types.ts
```

---

### Phase 2: Components

Create each slot component following the established pattern:

**Simple slots** (Trigger, Close, Title, Description):
```svelte
<Bits{Name}.{Slot}
  class={className}
  data-primitive="{name}"
  data-slot="{slot}"
  data-id={dataId}
  {...rest}
>
  {@render children?.()}
</Bits{Name}.{Slot}>
```

**Complex slots** (Content, Overlay) - MUST use child snippet:
```svelte
<Bits{Name}.Content {...rest}>
  {#snippet child({ props, open })}
    <div
      {...props}
      class={cn(props.class, className)}
      data-primitive="{name}"
      data-slot="content"
      data-state={open ? "open" : "closed"}
      data-id={dataId}
    >
      {@render children?.({ open })}
    </div>
  {/snippet}
</Bits{Name}.Content>
```

**CRITICAL:** `{...props}` MUST spread in child snippets — contains ARIA attributes.

**Verification:**
```bash
pnpm check  # No errors in {name}/*.svelte
```

---

### Phase 3: Barrel Export

Create `{name}/index.ts`:

```typescript
// Components
export { default as Root } from "./Root.svelte";
export { default as Trigger } from "./Trigger.svelte";
// ... all slots

// Types
export type { {Name}RootProps, ... } from "./types.js";
export { {Name}Slots } from "./types.js";
```

Update `primitives/index.ts`:
```typescript
export * as {Name} from "./{name}/index.js";
export type { ... } from "./{name}/index.js";
export { {Name}Slots } from "./{name}/index.js";
```

**Verification:**
```bash
pnpm check  # No import errors
```

---

### Phase 4: Tests

Create `{name}/{Name}.test.svelte` (test wrapper) and `{name}/{Name}.test.ts`.

**Test categories (minimum coverage):**

| Category | Min Tests | What to Cover |
|----------|-----------|---------------|
| ARIA roles | 3-5 | `role`, `aria-*` attributes |
| Data attributes | 6-10 | `data-primitive`, `data-slot`, `data-state` |
| Keyboard | 4-8 | All keys per a11y.md |
| State | 3-5 | Transitions, callbacks |
| Edge cases | 2-4 | Disabled, controlled mode |

**Portal content testing pattern:**
```typescript
// Portal renders to document.body, NOT screen.container
const content = document.querySelector('[data-slot="content"]');
await expect.element(content).toHaveAttribute("data-state", "open");
```

**Verification:**
```bash
pnpm test:run lib/design/primitives/{name}/  # All tests pass
```

---

### Phase 5: Documentation

Create `{name}/a11y.md` covering:
- ARIA behavior table
- Keyboard interaction table
- Focus management rules
- Data attributes table

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

# After Phase 2 (Components)
pnpm check

# After Phase 3 (Exports)
pnpm check

# After Phase 4 (Tests)
pnpm test:run lib/design/primitives/{name}/

# After Phase 5 (Docs)
pnpm audit:primitives
pnpm docs:primitives
```

---

## COMPLETION CHECKLIST

Before marking ANY primitive complete, verify ALL of these:

- [ ] `{name}/index.ts` — Barrel export exists
- [ ] `{name}/types.ts` — Has `{Name}Slots`, `{Name}State`, all props interfaces
- [ ] `{name}/*.svelte` — All slot components exist
- [ ] `{name}/a11y.md` — Accessibility contract documented
- [ ] `{name}/{Name}.test.svelte` — Test wrapper exists
- [ ] `{name}/{Name}.test.ts` — Tests exist and pass
- [ ] All `.svelte` files have `data-primitive="{name}"`
- [ ] Child snippets spread `{...props}` for ARIA
- [ ] `primitives/index.ts` exports the primitive
- [ ] Old monolithic file deleted (if applicable)
- [ ] `pnpm audit:primitives` shows ✅
- [ ] `pnpm check` passes (for this primitive)

---

## DATA ATTRIBUTE CONTRACT

All primitives MUST emit:

```
data-primitive="{name}"     # Identifies primitive type
data-slot="{slot}"          # Identifies slot within primitive
data-state="{state}"        # Current state
data-id="{user-defined}"    # Stable ID for testing/tooling
```

**DEPRECATED:** `data-kind`, `data-name`, `data-part` (old pattern)

---

## COMPLETED PRIMITIVES

### Button (Sprint 0)
- **Tests:** 19 passing
- **Pattern:** Simple primitive (single component)
- **Key Learning:** Direct Bits UI wrapper, `stripStyleProp()` for style prop enforcement

### Dialog (Sprint 1)
- **Tests:** 28 passing
- **Pattern:** Compound primitive with child snippets
- **Key Learning:** Child snippet `{ props, open }` — MUST spread `{...props}` for ARIA

### Sheet (Sprint 2)
- **Tests:** 32 passing
- **Pattern:** Dialog + `side` prop
- **Key Learning:** Added `data-side` attribute, otherwise identical to Dialog

### Tabs (Sprint 3)
- **Tests:** 48 passing
- **Pattern:** Tab navigation with roving tabindex
- **Key Learning:** **CRITICAL** — Bits UI Tabs does NOT expose `selected` in child snippets. Must extract from `props['aria-selected']` or `props['data-state']`. This is the "snippetProps gap."

### AlertDialog (Sprint 4)
- **Tests:** 41 passing
- **Pattern:** Dialog variant with `role="alertdialog"`
- **Key Learning:** Action button does NOT auto-close (unlike Dialog.Close). Cancel auto-closes. `interactOutsideBehavior="ignore"` by default.

### Popover (Sprint 5)
- **Tests:** 35 passing
- **Pattern:** Non-modal floating content
- **Key Learning:**
  - No `aria-modal` (non-modal)
  - Positioning props: `side`, `sideOffset`, `align`, `alignOffset`
  - Hover support: `openOnHover`, `openDelay`, `closeDelay`
  - Portal testing: Use `document.querySelector` not `screen.container`
  - Arrow component for visual indicator

### Tooltip (Sprint 6)
- **Tests:** 28 passing
- **Pattern:** Hover-triggered floating content with Provider
- **Key Learning:**
  - **ADR-007**: Bits UI Tooltip REQUIRES `Tooltip.Provider` context — Root includes implicit Provider
  - **ADR-008**: Bits UI does NOT add `role="tooltip"` — must add manually in Content.svelte
  - Default `side="top"` (unlike Popover's `side="bottom"`)
  - No Close button needed — auto-closes on mouse leave/blur
  - `aria-describedby` links trigger to content (Bits UI handles this)
  - Slots: `root`, `provider`, `trigger`, `portal`, `content`, `arrow`

---

## NEXT PRIMITIVE: Select

**Sprint 7** — Dropdown selection

**Pre-flight:**
- Based on Popover positioning + Listbox ARIA
- `role="listbox"` for content, `role="option"` for items
- Click-to-open by default
- Single or multiple selection modes

**Slots expected:** `root`, `trigger`, `value`, `portal`, `content`, `group`, `label`, `item`, `separator`

**Key differences from Popover:**
- Listbox semantics (not disclosure)
- Selection state management
- Typeahead search support
- `aria-selected` on options
- Keyboard: Arrow keys navigate, Enter selects

**VPB Use Case:** Enum property dropdowns, font selectors, component type pickers

---

## TROUBLESHOOTING

### "Tests fail with undefined element"
**Cause:** Portal renders content to `document.body`, not `screen.container`
**Fix:** Use `document.querySelector('[data-slot="content"]')` instead of `screen.container.querySelector()`

### "data-state always shows wrong value"
**Cause:** Bits UI component doesn't expose state in child snippet
**Fix:** Extract from props: `props['data-state']` or `props['aria-selected']`
See: Tabs pattern (ADR-003)

### "ARIA attributes missing"
**Cause:** Forgot to spread `{...props}` in child snippet
**Fix:** Always `{...props}` first, then your attributes:
```svelte
{#snippet child({ props })}
  <div {...props} class={cn(props.class, className)} data-primitive="...">
```

### "Type errors on Snippet"
**Cause:** Wrong snippet type for children
**Fix:** Check if children receive state:
- No state: `children?: Snippet`
- With state: `children?: Snippet<[{ open: boolean }]>`

---

## DECISION LOG

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-01-20 | Audit script before Sheet | Automate tracking first |
| 2026-01-20 | Compound folders for all | Scalable, testable, documentable |
| 2026-01-20 | Custom audit over Storybook | Svelte 5 ecosystem fragmented |
| 2026-01-21 | Props-based state extraction | Bits UI snippetProps gap workaround |
| 2026-01-21 | Portal testing with document.querySelector | Portal renders outside container |
| 2026-01-21 | WORKFLOW.md + .claude directives | Self-documenting workflow for autonomy |
| 2026-01-21 | Tooltip requires implicit Provider (ADR-007) | Bits UI Tooltip needs Provider context |
| 2026-01-21 | Manual role attribution (ADR-008) | Bits UI doesn't add all ARIA roles |
