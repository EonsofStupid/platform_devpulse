# ColdLight Primitives — Foundational Checklist

> **ColdLight is the SINGLE SOURCE OF TRUTH.**
> **NO CODE is written until this checklist is understood and followed.**
> See ADR.md for rationale. This is the enforcement document.

---

## CORE PRINCIPLE

**ColdLight OWNS the system. Primitives are pure structural shells.**

The dsAdapter (currently MeltUI) is a behavior engine that runs UNDER ColdLight.
It is declared in `config/coldlight/adapters.cfg.ts`. It is accessed via the
import cloak at `taxonomy/.generated/imports.gen.ts`. It is NEVER imported
directly by primitives.

Think Ark UI + Zag.js — except ColdLight uses pluggable dsAdapters.

---

## THE THREE LAYERS

```
LAYER 3: Components ─── Compose primitives + dsAdapter behavior
                        ARIA, roles, IDs, focus, keyboard, melt live HERE
                        ↓
LAYER 2: Primitives ─── Pure structural shells (THIS LAYER)
                        data-kind, data-slot, data-state, class, children
                        ZERO behavior. ZERO ARIA. ZERO melt.
                        ↓
LAYER 1: Taxonomy ───── Contracts define WHAT a primitive IS
                        Slots, states, ARIA spec, keyboard spec
                        The DNA for generation
```

---

## WHAT PRIMITIVES OWN (Layer 2)

| Concern | How |
|---------|-----|
| `data-kind` | From taxonomy contract `kind` field |
| `data-slot` | From taxonomy contract `slots` field |
| `data-state` | Derived from context (e.g., `ctx.open ? "open" : "closed"`) |
| `data-id` | Passthrough from `BaseProps` |
| `class` | Via `cn(className)` — Tailwind-aware merge |
| `{...rest}` | All HTML attributes forwarded |
| `children` snippet | `{@render children?.()}` |
| Style guard | `stripStyleProp()` in DEV |

---

## WHAT PRIMITIVES DO NOT OWN

| Concern | Where it lives | NOT in primitives |
|---------|---------------|-------------------|
| `role` attributes | Component layer (via dsAdapter) | NEVER |
| `aria-*` attributes | Component layer (via dsAdapter) | NEVER |
| `id` generation/linking | Component layer (via dsAdapter) | NEVER |
| Focus trapping | Component layer (via dsAdapter) | NEVER |
| Keyboard navigation | Component layer (via dsAdapter) | NEVER |
| Event handlers | Component layer (via dsAdapter) | NEVER |
| `use:melt` actions | Component layer (via import cloak) | NEVER |
| `@melt-ui/svelte` imports | Component layer (via import cloak) | NEVER |
| Portal teleportation | Component layer (via dsAdapter) | NEVER |
| Scroll lock | Component layer (via dsAdapter) | NEVER |
| Floating positioning | Component layer (via dsAdapter) | NEVER |

---

## ARIA SPECIFICATION (lives in taxonomy contracts)

The taxonomy contract DECLARES what ARIA a primitive needs. The dsAdapter PROVIDES it.
The primitive layer does NOT implement it. These tables are specifications — they are
enforced at the component layer, verified by component-level tests.

### Dialog — `taxonomy/kinds/primitives/dialog/contract.ts`

| Attribute | Value | Implemented By |
|-----------|-------|----------------|
| `role` | `"dialog"` | Component (dsAdapter) |
| `aria-modal` | `"true"` | Component (dsAdapter) |
| `aria-labelledby` | Title ID | Component (dsAdapter) |
| `aria-describedby` | Description ID | Component (dsAdapter) |

### AlertDialog — `taxonomy/kinds/primitives/alert-dialog/contract.ts`

| Attribute | Value | Implemented By |
|-----------|-------|----------------|
| `role` | `"alertdialog"` | Component (dsAdapter) |
| `aria-modal` | `"true"` | Component (dsAdapter) |
| `aria-labelledby` | Title ID | Component (dsAdapter) |
| `aria-describedby` | Description ID | Component (dsAdapter) |

### Tooltip — `taxonomy/kinds/primitives/tooltip/contract.ts`

| Attribute | Value | Implemented By |
|-----------|-------|----------------|
| `role` | `"tooltip"` | Component (dsAdapter) |
| Trigger `aria-describedby` | Content ID | Component (dsAdapter) |

### Popover — `taxonomy/kinds/primitives/popover/contract.ts`

| Attribute | Value | Implemented By |
|-----------|-------|----------------|
| Trigger `aria-haspopup` | `"dialog"` | Component (dsAdapter) |
| Trigger `aria-expanded` | `"true"/"false"` | Component (dsAdapter) |
| Trigger `aria-controls` | Content ID | Component (dsAdapter) |

### Select — `taxonomy/kinds/primitives/select/contract.ts`

| Attribute | Value | Implemented By |
|-----------|-------|----------------|
| Trigger `role` | `"combobox"` | Component (dsAdapter) |
| Trigger `aria-haspopup` | `"listbox"` | Component (dsAdapter) |
| Content `role` | `"listbox"` | Component (dsAdapter) |
| Item `role` | `"option"` | Component (dsAdapter) |
| Item `aria-selected` | `"true"/"false"` | Component (dsAdapter) |

### Tabs — `taxonomy/kinds/primitives/tabs/contract.ts`

| Attribute | Value | Implemented By |
|-----------|-------|----------------|
| List `role` | `"tablist"` | Component (dsAdapter) |
| Trigger `role` | `"tab"` | Component (dsAdapter) |
| Trigger `aria-selected` | `"true"/"false"` | Component (dsAdapter) |
| Content `role` | `"tabpanel"` | Component (dsAdapter) |

---

## GOLDEN STANDARD — STRUCTURAL SHELL

Every primitive `.svelte` file follows this exact pattern:

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

### Compound root (no DOM, context only)

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

---

## TAXONOMY STACK — Per Kind

Every kind at `taxonomy/kinds/primitives/{kind}/` has exactly 3 files:

### `types.ts`
```typescript
import type { StateToken, SlotStateMap } from "../../../types.js";

export const {kind}Slots = [...] as const;
export type {Kind}Slot = (typeof {kind}Slots)[number];

export const {kind}StateTokens = [...] as const satisfies readonly StateToken[];
export type {Kind}State = (typeof {kind}StateTokens)[number];

export const {kind}SlotStates = {
	// per-slot allowed states
} as const satisfies SlotStateMap<{Kind}Slot, {Kind}State>;
```

### `contract.ts`
```typescript
import type { PrimitiveContract } from "../../../types.js";
import { {kind}SlotStates, type {Kind}Slot, type {Kind}State } from "./types.js";

export const contract: PrimitiveContract<"{kind}", {Kind}Slot, {Kind}State> = {
	kind: "{kind}",
	ariaStateProvider: "meltui" | "coldlight",
	slots: { required: [...], optional: [...], forbidden: [] },
	states: { shared: [...], specific: [...] },
	slotStates: {kind}SlotStates,
	slotActions: { ... },
	aria: { role: "...", requiredAttrs: [...], optionalAttrs: [...] },
	keyboard: [...],
};
```

### `index.ts`
```typescript
export {
	{kind}Slots, {kind}StateTokens, {kind}SlotStates,
	type {Kind}Slot, type {Kind}State,
} from "./types.js";
export { contract } from "./contract.js";
```

---

## PRIMITIVE STACK — Per Kind

### `types.ts`
```typescript
import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

export interface {Kind}Props extends BaseProps {
	open?: boolean;
	children?: Snippet;
}

export interface {Kind}{Slot}Props extends OmitStyle<HTML{Element}Element>, BaseProps {
	children?: Snippet;
}
```

### `context.ts` (compound only)
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

### `{Kind}.svelte` — root (compound)
Context provider, no DOM. See golden standard above.

### `{Kind}{Slot}.svelte` — sub-components
Structural shells. See golden standard above.

### `index.ts`
```typescript
export { default as {Kind} } from "./{Kind}.svelte";
export { default as {Kind}{Slot} } from "./{Kind}{Slot}.svelte";
// ... all slots

export type {
	{Kind}Props,
	{Kind}{Slot}Props,
	// ... all prop types
} from "./types.js";

export { set{Kind}Context, get{Kind}Context, type {Kind}Context } from "./context.js";
```

---

## PRE-FLIGHT — Before writing ANY primitive

- [ ] Taxonomy contract exists and is reviewed
- [ ] Read WAI-ARIA APG for this pattern (for contract accuracy — NOT for primitive implementation)
- [ ] Slots identified from contract
- [ ] Element types determined per slot (`<button>`, `<div>`, `<h2>`, `<p>`, etc.)
- [ ] `ariaStateProvider` confirmed (`"meltui"` or `"coldlight"`)
- [ ] Context shape determined (compound only — what state do sub-components need for `data-state`?)

---

## SPRINT TEMPLATE

### Sprint N: {Kind}

**Taxonomy stack:**
- [ ] `taxonomy/kinds/primitives/{kind}/types.ts`
- [ ] `taxonomy/kinds/primitives/{kind}/contract.ts`
- [ ] `taxonomy/kinds/primitives/{kind}/index.ts`

**Primitive stack:**
- [ ] `primitives/{kind}/types.ts`
- [ ] `primitives/{kind}/context.ts` (compound only)
- [ ] `primitives/{kind}/{Kind}.svelte` (root)
- [ ] `primitives/{kind}/{Kind}{Slot}.svelte` (per slot)
- [ ] `primitives/{kind}/index.ts`
- [ ] `primitives/{kind}/{Kind}.test.svelte` (test harness)
- [ ] `primitives/{kind}/{Kind}.test.ts` (tests)

**Verification:**
- [ ] `pnpm svelte-check` — 0 errors
- [ ] Every `.svelte` has `data-kind` and `data-slot`
- [ ] Every `.svelte` has `class={cn(className)}`
- [ ] Every `.svelte` has `{@render children?.()}`
- [ ] Every `.svelte` has DEV `stripStyleProp` guard
- [ ] Every `.svelte` has `{...rest}` spread
- [ ] ZERO imports from `@melt-ui/svelte` in primitive layer
- [ ] ZERO `role`, `aria-*`, `id` attributes in primitive layer
- [ ] ZERO event handlers in primitive layer
- [ ] Types use `OmitStyle<T>` + `BaseProps`, not raw `Omit<>`
- [ ] Barrel exports all components + types + context

---

## SIGN-OFF

Before marking ANY primitive complete:

1. Is it a pure structural shell? **YES/NO**
2. Does it have ZERO behavior imports? **YES/NO**
3. Does it have ZERO ARIA attributes? **YES/NO**
4. Does it have ZERO event handlers? **YES/NO**
5. Does every `.svelte` follow the golden standard pattern? **YES/NO**
6. Does the taxonomy 3-file stack exist? **YES/NO**
7. Does `pnpm svelte-check` pass with 0 errors? **YES/NO**

**All must be YES.**

---

**ColdLight is the SINGLE SOURCE OF TRUTH. Primitives are structural shells. Behavior is composed at the component layer. No exceptions.**
