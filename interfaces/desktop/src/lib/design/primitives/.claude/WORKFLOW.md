# Claude Directives — Primitives Development

> These directives guide Claude when working in the `primitives/` folder.
> Read `../WORKFLOW.md` for the full workflow process.

---

## MANDATORY ACTIONS

### Before ANY Primitive Work

1. **Run audit first:**
   ```bash
   cd interfaces/desktop/src
   pnpm audit:primitives
   ```
   This shows current completion status.

2. **Check Bits UI API** (Phase 0):
   ```bash
   cat node_modules/bits-ui/dist/bits/{primitive}/{primitive}.svelte.js | grep -A10 "snippetProps"
   ```
   - If `snippetProps` found → child snippet provides state (Dialog pattern)
   - If NOT found → extract state from props (Tabs pattern)

3. **Read the existing completed primitive closest to your target:**
   - Modal? → Read `dialog/`
   - Non-modal floating? → Read `popover/`
   - Hover-triggered hint? → Read `tooltip/`
   - Tab navigation? → Read `tabs/`
   - Dropdown selection? → Read Bits UI docs (Select is next)

---

## CRITICAL PATTERNS

### Child Snippet ARIA Props

**ALWAYS spread `{...props}` first in child snippets:**

```svelte
{#snippet child({ props, open })}
  <div
    {...props}                    <!-- FIRST: Contains role, aria-*, ids -->
    class={cn(props.class, className)}
    data-kind="{name}"
    data-slot="content"
    data-state={open ? "open" : "closed"}
  >
```

**Why:** Bits UI adds `role="dialog"`, `aria-modal`, `aria-labelledby`, etc. to `props`. Missing this breaks accessibility.

---

### The SnippetProps Gap (ADR-003)

**Problem:** Some Bits UI components don't expose state in child snippets.

| Works (Dialog) | Broken (Tabs) |
|----------------|---------------|
| `{ props, open }` | `{ props }` only |

**Solution — Extract from props:**

```svelte
<!-- Tabs Trigger -->
{#snippet child({ props })}
  {@const dataState = props['aria-selected'] === 'true' ? 'active' : 'inactive'}

<!-- Tabs Content -->
{#snippet child({ props })}
  {@const dataState = props['data-state']}
```

---

### Portal Content Testing (ADR-004)

**Problem:** Portal renders content to `document.body`, not the test container.

**WRONG:**
```typescript
const content = screen.container.querySelector('[data-slot="content"]');
// Returns null!
```

**CORRECT:**
```typescript
const content = document.querySelector('[data-slot="content"]');
await expect.element(content).toHaveAttribute("data-state", "open");
```

---

### Tooltip Provider Context (ADR-007)

**Problem:** Bits UI Tooltip requires `Tooltip.Provider` context (unlike Popover).

**Solution:** ColdLight `Tooltip.Root` includes implicit Provider wrapper:

```svelte
<!-- tooltip/Root.svelte -->
<Tooltip.Provider delayDuration={openDelay} {closeDelay}>
  <Tooltip.Root bind:open ...>
    {@render children?.()}
  </Tooltip.Root>
</Tooltip.Provider>
```

---

### Manual ARIA Role Attribution (ADR-008)

**Problem:** Bits UI doesn't add all ARIA roles automatically.

| Primitive | Role Added by Bits UI |
|-----------|----------------------|
| Dialog | `role="dialog"` ✅ |
| AlertDialog | `role="alertdialog"` ✅ |
| Tooltip | `role="tooltip"` ❌ Must add manually |

**Solution:** ColdLight adds missing roles:

```svelte
<!-- tooltip/Content.svelte -->
<div
  {...props}
  role="tooltip"  <!-- MANUAL: Bits UI doesn't add this -->
  ...
>
```

---

## ERROR RECOVERY

### If tests fail twice with same error:

1. **STOP** — Do not hack around it
2. **Enter planning mode**
3. **Research:**
   - Check Bits UI source code
   - Check existing working primitives
   - Read a11y.md for expected behavior
4. **Document finding** in ADR.md before fixing

### If type errors persist twice:

1. **Check imports** — `.js` extension required in imports
2. **Check Snippet types** — does children receive state?
3. **Check Omit** — `Omit<HTMLAttributes, "style" | "children">`

---

## VERIFICATION CHECKLIST

Run after EVERY primitive completion:

```bash
cd interfaces/desktop/src

# Tests pass
pnpm test:run lib/design/primitives/{name}/

# Types pass
pnpm check

# Audit shows complete
pnpm audit:primitives

# Update PRIMITIVES.md
pnpm docs:primitives
```

**DO NOT mark complete until ALL pass.**

---

## FILE CREATION ORDER

1. `{name}/types.ts` — Types first (enables autocomplete)
2. `{name}/Root.svelte` — State container
3. `{name}/Trigger.svelte` — Opens component
4. `{name}/Portal.svelte` — DOM escape (if needed)
5. `{name}/Overlay.svelte` — Backdrop (if needed)
6. `{name}/Content.svelte` — Main content (child snippet!)
7. `{name}/Title.svelte` — Accessible heading
8. `{name}/Description.svelte` — Accessible description
9. `{name}/Close.svelte` — Close button
10. `{name}/index.ts` — Barrel export
11. `{name}/{Name}.test.svelte` — Test wrapper
12. `{name}/{Name}.test.ts` — Tests
13. `{name}/a11y.md` — Accessibility docs
14. Update `primitives/index.ts` — Add exports
15. Delete old monolithic file

---

## NOTES PROTOCOL

After completing each primitive, add to `../WORKFLOW.md`:

```markdown
### {Name} (Sprint N)
- **Tests:** X passing
- **Pattern:** [Simple/Compound/etc]
- **Key Learning:** [What was tricky, what to remember]
```

This builds institutional knowledge for future primitives.

---

## WHEN UNSURE

1. **Read existing primitives** — Dialog is the reference implementation
2. **Check Bits UI docs** — https://bits-ui.com/docs/components/{name}
3. **Check WAI-ARIA APG** — https://www.w3.org/WAI/ARIA/apg/patterns/
4. **Ask user** — Don't guess on architectural decisions
