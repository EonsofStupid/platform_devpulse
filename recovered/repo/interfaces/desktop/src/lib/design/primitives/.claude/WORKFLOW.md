# Claude Directives — Primitives Development

> **Primitives are headless structural shells. ZERO behavior. ZERO ARIA.**
> **Read CHECKLIST.md for golden standard patterns. Read ADR.md for rationale.**
> **Read MASTER_SPRINT_PLAN.md for sprint order and per-kind details.**

---

## BEFORE ANY PRIMITIVE WORK

1. **Read the governance docs:**
   - `CHECKLIST.md` — golden standard, verification rules, sign-off criteria
   - `ADR.md` — architecture decisions, dsAdapter model, context pattern
   - `MASTER_SPRINT_PLAN.md` — sprint order, per-kind slot/context specs

2. **Run the audit:**
   ```bash
   cd interfaces/desktop
   pnpm audit:primitives
   ```

3. **Run the scanner:**
   ```bash
   cd interfaces/desktop
   pnpm coldlight:verify
   ```

4. **Read an existing golden standard primitive:**
   - Simple (no context): `button/`
   - Compound (context + sub-components): `dialog/`
   - Compound with value context: `tabs/`

---

## ARCHITECTURE — KNOW YOUR LAYER

```
LAYER 3: Components ─── ARIA, roles, IDs, focus, keyboard, melt
LAYER 2: Primitives ─── data-kind, data-slot, data-state, class, children (YOU ARE HERE)
LAYER 1: Taxonomy ───── Contracts: slots, states, ARIA spec, keyboard spec
```

Primitives own structure. Components own behavior. Taxonomy owns the DNA.

### What primitives OWN

| Concern | How |
|---------|-----|
| `data-kind` | From taxonomy contract `kind` field |
| `data-slot` | From taxonomy contract `slots` field |
| `data-state` | Derived from context (e.g., `ctx.open ? "open" : "closed"`) |
| `data-id` | Passthrough from `BaseProps` |
| `class` | Via `cn(className)` |
| `{...rest}` | All HTML attributes forwarded |
| `children` | `{@render children?.()}` |
| Style guard | `stripStyleProp()` in DEV |

### What primitives DO NOT OWN

- `role` attributes
- `aria-*` attributes
- `id` generation or linking
- Focus trapping or management
- Keyboard navigation
- Event handlers (`onclick`, `onkeydown`, etc.)
- `use:melt` actions
- `@melt-ui/svelte` imports
- Portal teleportation
- Scroll lock
- Floating positioning

These live at the Component layer via the dsAdapter (currently MeltUI).

---

## PER-KIND WORKFLOW

Every primitive follows this sequence. No skipping. No reordering.

### Step 1: Taxonomy 3-File Stack

```
taxonomy/kinds/primitives/{kind}/
├── types.ts      ← as const arrays, derived type unions, slotStates map
├── contract.ts   ← imports types, exports PrimitiveContract
└── index.ts      ← barrel re-exports
```

Reference: ADR-012 in ADR.md.

### Step 2: Primitive Stack

```
primitives/{kind}/
├── types.ts              ← OmitStyle<T> + BaseProps prop interfaces
├── context.ts            ← Symbol-keyed get/set (compound only)
├── {Kind}.svelte         ← root component
├── {Kind}{Slot}.svelte   ← per sub-component (compound only)
├── {Kind}.test.svelte    ← test harness
├── {Kind}.test.ts        ← vitest-browser tests
└── index.ts              ← barrel exports
```

Reference: ADR-005, ADR-013 in ADR.md.

### Step 3: Wire Up

- Add exports to `primitives/index.ts`
- Add exports to `taxonomy/kinds/primitives/index.ts`

### Step 4: Verify

```bash
cd interfaces/desktop
pnpm svelte-check
pnpm audit:primitives
pnpm coldlight:verify
```

---

## FILE CREATION ORDER

### Simple primitive (e.g., Button, Separator, Badge)

1. `taxonomy/kinds/primitives/{kind}/types.ts`
2. `taxonomy/kinds/primitives/{kind}/contract.ts`
3. `taxonomy/kinds/primitives/{kind}/index.ts`
4. `primitives/{kind}/types.ts`
5. `primitives/{kind}/{Kind}.svelte`
6. `primitives/{kind}/index.ts`
7. `primitives/{kind}/{Kind}.test.svelte`
8. `primitives/{kind}/{Kind}.test.ts`
9. Update `primitives/index.ts` barrel
10. Update `taxonomy/kinds/primitives/index.ts` barrel

### Compound primitive (e.g., Dialog, Tabs, Select)

1. `taxonomy/kinds/primitives/{kind}/types.ts`
2. `taxonomy/kinds/primitives/{kind}/contract.ts`
3. `taxonomy/kinds/primitives/{kind}/index.ts`
4. `primitives/{kind}/types.ts`
5. `primitives/{kind}/context.ts`
6. `primitives/{kind}/{Kind}.svelte` — root (context provider, no DOM)
7. `primitives/{kind}/{Kind}{Slot}.svelte` — each sub-component
8. `primitives/{kind}/index.ts`
9. `primitives/{kind}/{Kind}.test.svelte`
10. `primitives/{kind}/{Kind}.test.ts`
11. Update `primitives/index.ts` barrel
12. Update `taxonomy/kinds/primitives/index.ts` barrel

### Naming rules

- **Kind-prefixed**: `DialogTrigger.svelte`, NOT `Trigger.svelte`
- **PascalCase component, kebab-case folder**: `dialog/DialogTrigger.svelte`
- **Context in `context.ts`**: NOT in `types.ts`
- **No `a11y.md` per-primitive**: ARIA spec lives in the taxonomy contract

---

## GOLDEN STANDARD REFERENCE

Do not memorize these — read CHECKLIST.md. Quick reference:

### Structural shell (sub-component with DOM)

```svelte
<!--
  @component {Kind}{Slot}
  @description Structural {description} for {kind}.
  Contract: kind="{kind}", slot="{slot}"
-->
<script lang="ts">
  import { cn, stripStyleProp } from "../types.js";
  import type { {Kind}{Slot}Props } from "./types.js";

  let {
    children,
    class: className,
    ...rest
  }: {Kind}{Slot}Props = $props();

  if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "{Kind}{Slot}");
</script>

<{element}
  {...rest}
  data-kind="{kind}"
  data-slot="{slot}"
  class={cn(className)}
>
  {@render children?.()}
</{element}>
```

### Compound root (context provider, no DOM)

```svelte
<script lang="ts">
  import type { {Kind}Props } from "./types.js";
  import { set{Kind}Context } from "./context.js";

  let { open = $bindable(false), children }: {Kind}Props = $props();

  set{Kind}Context({
    get open() { return open; },
  });
</script>

{@render children?.()}
```

### Types (prop interfaces)

```typescript
import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

export interface {Kind}{Slot}Props extends OmitStyle<HTML{Element}Element>, BaseProps {
  children?: Snippet;
}
```

### Context (compound only)

```typescript
import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:{kind}");

export type {Kind}Context = {
  readonly open: boolean;
};

export function set{Kind}Context(ctx: {Kind}Context): void {
  setContext(CTX_KEY, ctx);
}

export function get{Kind}Context(): {Kind}Context {
  return getContext<{Kind}Context>(CTX_KEY);
}
```

---

## VERIFICATION — AFTER EVERY KIND

### Automated

```bash
cd interfaces/desktop
pnpm svelte-check          # 0 errors
pnpm audit:primitives      # kind shows complete
pnpm coldlight:verify      # parity check passes
```

### Manual checklist

- [ ] Every `.svelte` has `data-kind` and `data-slot`
- [ ] Every `.svelte` has `class={cn(className)}`
- [ ] Every `.svelte` has `{@render children?.()}`
- [ ] Every `.svelte` has `{...rest}` spread
- [ ] Every `.svelte` has DEV `stripStyleProp` guard
- [ ] Types use `OmitStyle<T>` + `BaseProps`
- [ ] ZERO imports from `@melt-ui/svelte`
- [ ] ZERO `role`, `aria-*`, `id` attributes
- [ ] ZERO event handlers
- [ ] Barrel exports all components + types + context
- [ ] Taxonomy barrel updated
- [ ] Primitives barrel updated

---

## ERROR RECOVERY

### If `pnpm svelte-check` fails

1. Read the error — is it in the primitive layer or elsewhere?
2. Check imports have `.js` extension (TypeScript requires this)
3. Check prop interfaces extend `OmitStyle<T>` correctly
4. Check `Snippet` type import from `"svelte"`

### If tests fail

1. Check data attributes match the taxonomy contract values exactly
2. Check context is being set in root and read in sub-components
3. Portal content: query via `document.querySelector`, not `screen.container` (ADR-004)
4. If the same error persists after two attempts — STOP, enter planning mode, research

### If audit fails

1. Check folder has all required files (types.ts, index.ts, at least one .svelte)
2. Check compound primitives have context.ts
3. Check barrel exports are complete

### If parity check fails

1. Check the taxonomy contract's `ariaStateProvider` value
2. `"meltui"` requires adapter folder at `api/adapters/meltui/_internal/{kind}/`
3. `"coldlight"` does NOT require adapter folder
4. Check folder name matches contract `kind` field exactly

---

## WHAT NOT TO DO

| Mistake | Why it's wrong |
|---------|---------------|
| Adding `role="dialog"` to a primitive | ARIA lives at the Component layer via dsAdapter |
| Adding `onclick` to a primitive | Behavior lives at the Component layer |
| Importing from `@melt-ui/svelte` | Primitives never touch the adapter directly |
| Using `Trigger.svelte` instead of `DialogTrigger.svelte` | Kind-prefixed names required |
| Putting context in `types.ts` | Context lives in `context.ts` |
| Using `Omit<HTMLAttributes, "style">` | Use `OmitStyle<T>` + `BaseProps` |
| Creating `a11y.md` per-primitive | ARIA spec lives in taxonomy contract |
| Creating `Root.svelte` | Root component is `{Kind}.svelte` |
| Adding `id` generation | ID linking is a Component layer concern |
| Skipping `stripStyleProp` | Every DOM-rendering .svelte needs the DEV guard |

---

## WHEN UNSURE

1. **Read the golden standards** — Button (simple) and Dialog (compound)
2. **Read the taxonomy contract** — it defines slots, states, ARIA spec
3. **Check CHECKLIST.md** — the verification rules are definitive
4. **Check ADR.md** — architecture decisions with rationale
5. **Ask user** — do NOT guess on architectural decisions
