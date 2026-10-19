# Claude Directives — ColdLight Development

> These directives guide Claude when working in `primitives/` and `components/`.
> Read `CHECKLIST.md` for the foundational architecture.

---

## MANDATORY ACTIONS

### Before ANY Primitive/Component Work

1. **Read the taxonomy contract first:**
   ```
   taxonomy/kinds/primitives/{kind}/contract.ts
   ```
   This is the SSOT. If it doesn't exist, CREATE IT FIRST.

2. **Read WAI-ARIA APG for this pattern:**
   ```
   https://www.w3.org/WAI/ARIA/apg/patterns/{kind}/
   ```

3. **Read the existing completed kind closest to your target:**
   - Simple (native element): Read `button/`
   - Compound modal: Read `dialog/` (when built)
   - Compound navigation: Read `tabs/` (when built)
   - Compound selection: Read `select/` (when built)
   - Floating overlay: Read `popover/` (when built)

---

## THREE-LAYER BUILD ORDER

### Layer 1: Taxonomy Contract (SSOT)

```
taxonomy/kinds/primitives/{kind}/
  types.ts      ← Slots array, State array, SlotStateMap
  contract.ts   ← PrimitiveContract with satisfies
  index.ts      ← Barrel re-exports
```

### Layer 2: Structureless Primitive

```
primitives/{kind}/
  types.ts      ← Props per slot (OmitStyle + BaseProps)
  Button.svelte ← Zero ARIA, zero behavior
  context.ts    ← Compound only (Symbol-keyed context)
  index.ts      ← Barrel
```

### Layer 3: Styled Component

```
components/{kind}/
  contract.ts   ← ComponentContract with satisfies
  types.ts      ← Extends primitive props + intent/size/state
  recipe.ts     ← SD5 token-driven TW4 classes
  Button.svelte ← Wraps primitive, sets ALL ARIA + data-state
  index.ts      ← Barrel
```

---

## STRUCTURELESS PRIMITIVE PATTERN

Every primitive Svelte file follows this exact template:

```svelte
<!--
  @component {Kind}{Slot}
  @description Structureless {kind} — semantic HTML, data attributes.
  Contract: kind="{kind}", slot="{slot}"

  Zero ARIA. Zero behavior. Zero styling.
  Component layer adds ARIA, state, and recipes.
-->
<script lang="ts">
  import type { {Kind}{Slot}Props } from "./types.js";
  import { cn, stripStyleProp } from "../types.js";

  let { children, class: className, ...rest }: {Kind}{Slot}Props = $props();

  if (import.meta.env.DEV) stripStyleProp(rest as Record<string, unknown>, '{Kind}.{Slot}');
</script>

<{element}
  data-kind="{kind}"
  data-slot="{slot}"
  class={cn(className)}
  {...rest}
>
  {@render children?.()}
</{element}>
```

---

## ERROR RECOVERY

### If type errors persist twice:

1. **Check imports** — `.js` extension required in ALL imports
2. **Check Omit** — `Omit<HTMLAttributes, "style" | "children">`
3. **Check Snippet** — `import type { Snippet } from "svelte"`

### If build errors persist twice:

1. **STOP** — Do not hack around it
2. **Enter planning mode**
3. **Research:** Check taxonomy contract, check existing working kinds
4. **Document finding** before fixing

---

## VERIFICATION CHECKLIST

Run after EVERY kind completion:

```bash
cd interfaces/desktop

# Types pass
pnpm svelte-check

# Tests pass (when test framework ready)
# pnpm test:run packages/coldlight/primitives/{name}/
# pnpm test:run packages/coldlight/components/{name}/
```

**DO NOT mark complete until ALL pass.**

---

## FILE CREATION ORDER

1. `taxonomy/kinds/primitives/{kind}/types.ts` — Slots + states
2. `taxonomy/kinds/primitives/{kind}/contract.ts` — PrimitiveContract
3. `taxonomy/kinds/primitives/{kind}/index.ts` — Barrel
4. `primitives/{kind}/types.ts` — Props per slot
5. `primitives/{kind}/{Kind}{Slot}.svelte` — Structureless components
6. `primitives/{kind}/context.ts` — Compound only
7. `primitives/{kind}/index.ts` — Barrel
8. `components/{kind}/contract.ts` — ComponentContract
9. `components/{kind}/types.ts` — Extended props
10. `components/{kind}/recipe.ts` — SD5 recipe
11. `components/{kind}/{Kind}.svelte` — Styled wrapper
12. `components/{kind}/index.ts` — Barrel
13. Update `primitives/index.ts` — Add exports
14. Update `components/index.ts` — Add exports

---

## NOTES PROTOCOL

After completing each kind, add to sprint notes:

```markdown
### {Name} (Sprint N)
- **Taxonomy:** types.ts + contract.ts + index.ts
- **Primitive:** {X} slot components, structureless
- **Component:** ARIA + recipe + data-state
- **Pattern:** [Simple/Compound]
- **Key Learning:** [What was tricky, what to remember]
```

---

## WHEN UNSURE

1. **Read taxonomy contract** — It's the SSOT
2. **Read CHECKLIST.md** — Three-layer architecture
3. **Check WAI-ARIA APG** — https://www.w3.org/WAI/ARIA/apg/patterns/
4. **Ask user** — Don't guess on architectural decisions
