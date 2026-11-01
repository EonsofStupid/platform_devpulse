# Architecture Decision Records — ColdLight Primitives

> Living decisions for the ColdLight design system primitive layer.
> ColdLight is architecturally similar to Ark UI's relationship with Zag.js —
> except ColdLight uses **dsAdapters** instead of a single state machine library,
> giving us flexibility to swap or layer behavior providers.

---

## ADR-001: Data Attribute Contract

**Date:** 2026-01-20
**Status:** Accepted
**Context:** Need consistent, predictable CSS targeting across all primitives.

### Decision

All primitives emit these data attributes:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-kind` | Primitive type from taxonomy | `"dialog"`, `"button"` |
| `data-slot` | Slot within the primitive | `"root"`, `"content"`, `"trigger"` |
| `data-state` | Visual state for CSS targeting | `"open"`, `"closed"` |
| `data-id` | User-defined stable ID for testing | `"my-dialog"` |

### Rationale

1. **Predictable CSS**: `[data-kind="dialog"][data-slot="content"][data-state="open"]`
2. **Testing stability**: `data-id` survives class/style refactors
3. **Recipe targeting**: Recipes bind to `[data-kind][data-slot]` selectors
4. **Namespace-ready**: `DATA_ATTRS` const in `primitives/types.ts` can add `cl-` prefix if collisions arise

### Consequences

- Every `.svelte` component MUST emit `data-kind` and `data-slot`
- `data-state` only on slots that have state (from taxonomy contract's `slotStates` map)
- **DEPRECATED:** `data-primitive`, `data-name`, `data-part`

---

## ADR-002–003, 007–008: Superseded

**Status:** Superseded — collapsed for brevity.

These covered early melt-ui integration patterns (child snippet ARIA spreading, props-based state extraction, tooltip provider, manual ARIA roles). All superseded by the dsAdapter model (ADR-009). The primitive layer no longer touches ARIA at all.

---

## ADR-004: Portal Content Testing

**Date:** 2026-01-21
**Status:** Accepted
**Context:** Portal-rendered content is outside the test container's DOM scope.

### Decision

Use `document.querySelector` for portal-rendered content:

```typescript
await userEvent.click(trigger);
const content = document.querySelector('[data-slot="content"]');
await expect.element(content).toHaveAttribute("data-state", "open");
```

### Consequences

- Trigger queries: `screen.getByRole("button")` (in container)
- Portal content queries: `document.querySelector('[data-slot="..."]')` (in document)

---

## ADR-005: Primitive Folder Structure

**Date:** 2026-01-20
**Updated:** 2026-01-31
**Status:** Accepted (revised)
**Context:** Every primitive needs a consistent, auditable folder structure.

### Decision

**Simple primitive** (e.g., Button — single slot, no compound children):

```
button/
├── types.ts           # Prop interfaces (OmitStyle<T> + BaseProps)
├── Button.svelte      # Structural shell
├── Button.test.svelte # Test harness
├── Button.test.ts     # vitest-browser tests
└── index.ts           # Barrel
```

**Compound primitive** (e.g., Dialog — multiple slots coordinated by context):

```
dialog/
├── types.ts              # All prop interfaces
├── context.ts            # Symbol-keyed get/set context
├── Dialog.svelte         # Root — context provider, no DOM
├── DialogTrigger.svelte  # Trigger slot
├── DialogPortal.svelte   # Portal slot
├── DialogOverlay.svelte  # Overlay slot
├── DialogContent.svelte  # Content slot
├── DialogTitle.svelte    # Title slot
├── DialogDescription.svelte
├── DialogClose.svelte    # Close slot
├── Dialog.test.svelte    # Test harness
├── Dialog.test.ts        # vitest-browser tests
└── index.ts              # Barrel
```

### Key rules

- **Kind-prefixed names**: `DialogTrigger.svelte`, NOT `Trigger.svelte`
- **Context in `context.ts`**: NOT in `types.ts`
- **No `a11y.md` per-primitive**: ARIA contract lives in the taxonomy contract
- **No behavior files**: No `.ts` logic files beyond types/context. Primitives are structural shells.

### Consequences

- Audit script checks: every folder has `types.ts`, `index.ts`, at least one `.svelte`
- Compound primitives additionally require `context.ts`
- All files kind-prefixed to avoid ambiguity when importing across primitives

---

## ADR-006: No Style Prop

**Date:** 2026-01-20
**Updated:** 2026-01-31
**Status:** Accepted (revised)
**Context:** Enforce recipe-based styling. No inline styles at the primitive level.

### Decision

All primitive prop interfaces use `OmitStyle<T>` + `BaseProps`:

```typescript
import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

export interface DialogContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
```

Where `OmitStyle<T>` = `Omit<HTMLAttributes<T>, "style" | "children">` and `BaseProps` = `{ "data-id"?: string }`.

Runtime enforcement in DEV:

```typescript
if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogContent");
```

### Consequences

- TypeScript blocks `style` at compile time
- `stripStyleProp()` catches `any`-typed bypasses at runtime in DEV
- All visual styling goes through `class` prop + `cn()` utility
- `cn()` uses `clsx` + `tailwind-merge` for Tailwind-aware deduplication

---

## ADR-009: dsAdapter Model (Ark/Zag Pattern)

**Date:** 2026-01-23
**Updated:** 2026-01-31
**Status:** Accepted (revised)
**Context:** ColdLight needs accessible, behavioral components without coupling primitives to any specific behavior library.

### Decision

ColdLight follows the same architectural pattern as **Ark UI + Zag.js**, but with a pluggable adapter layer instead of a single state machine library.

```
┌──────────────────────────────────────────────────────┐
│  LAYER 3: Components                                 │
│  Compose primitives + dsAdapter behavior.            │
│  This is where ARIA, focus, keyboard, melt live.     │
└───────────────────────┬──────────────────────────────┘
                        │ imports
┌───────────────────────┴──────────────────────────────┐
│  LAYER 2: Primitives (this layer)                    │
│  Pure structural shells. ZERO behavior.              │
│  data-kind, data-slot, data-state, class, children.  │
│  No ARIA. No roles. No IDs. No melt. No keyboard.   │
└───────────────────────┬──────────────────────────────┘
                        │ defined by
┌───────────────────────┴──────────────────────────────┐
│  LAYER 1: Taxonomy                                   │
│  Contracts define WHAT a primitive IS.                │
│  Slots, states, ARIA requirements, keyboard spec.    │
│  The DNA that could generate any framework target.   │
└──────────────────────────────────────────────────────┘

         ┌─────────────────────────────────┐
         │  dsAdapter (currently MeltUI)    │
         │  Behavior engine. Runs UNDER    │
         │  ColdLight, not alongside it.   │
         │  Declared in adapters.cfg.ts.   │
         │  Accessed via import cloak at   │
         │  taxonomy/.generated/imports.gen│
         └─────────────────────────────────┘
```

### What lives WHERE

| Concern | Layer | NOT in |
|---------|-------|--------|
| `data-kind`, `data-slot`, `data-state` | Primitive | — |
| `class`, `cn()`, `{...rest}` | Primitive | — |
| `children` snippet, typed props | Primitive | — |
| `stripStyleProp()` DEV guard | Primitive | — |
| `role`, `aria-*`, `id` linking | Component (via dsAdapter) | NOT Primitive |
| Focus trapping, keyboard nav | Component (via dsAdapter) | NOT Primitive |
| `use:melt`, builder factories | Component (via import cloak) | NOT Primitive |
| Portal teleportation, scroll lock | Component (via dsAdapter) | NOT Primitive |

### The Ark analogy

| Ark UI | ColdLight |
|--------|-----------|
| Zag.js (state machines) | dsAdapter (currently MeltUI) |
| `anatomy` (part definitions) | Taxonomy contracts |
| Component parts (`Dialog.Content`) | Primitives (`DialogContent.svelte`) |
| Composed components | Components layer |

### ariaStateProvider per-contract

Each taxonomy contract declares its `ariaStateProvider`:

- `"meltui"` — dsAdapter provides ARIA + state. **3-folder parity**: taxonomy + adapter + primitive.
- `"coldlight"` — kind handles ARIA natively (e.g., `<button>` is inherently accessible). **2-folder parity**: taxonomy + primitive.

This is a **contract property**, not a primitive category. There is no concept of "ARIA primitives" vs "non-ARIA primitives."

### Consequences

- Primitives NEVER import from `@melt-ui/svelte` or any adapter directly
- Components import adapter factories via the import cloak: `taxonomy/.generated/imports.gen.ts`
- Swapping MeltUI for another library means changing `adapters.cfg.ts` and the adapter layer — primitives are untouched
- Tests at the primitive level verify structure (data attributes, props, rendering)
- Tests at the component level verify behavior (ARIA, keyboard, focus)

---

## ADR-010: Compound Primitive Context

**Date:** 2026-01-23
**Updated:** 2026-01-31
**Status:** Accepted (revised)
**Context:** Compound primitives need to share state between root and sub-components.

### Decision

Dedicated `context.ts` file with Symbol-keyed, typed get/set functions:

```typescript
// context.ts
import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:dialog");

export type DialogContext = {
	readonly open: boolean;
};

export function setDialogContext(ctx: DialogContext): void {
	setContext(CTX_KEY, ctx);
}

export function getDialogContext(): DialogContext {
	return getContext<DialogContext>(CTX_KEY);
}
```

Root component sets context with reactive getter:

```svelte
<!-- Dialog.svelte -->
<script lang="ts">
	import type { DialogProps } from "./types.js";
	import { setDialogContext } from "./context.js";

	let { open = $bindable(false), children }: DialogProps = $props();

	setDialogContext({
		get open() {
			return open;
		},
	});
</script>

{@render children?.()}
```

Sub-components read context:

```svelte
<!-- DialogContent.svelte -->
<script lang="ts">
	import { cn, stripStyleProp } from "../types.js";
	import type { DialogContentProps } from "./types.js";
	import { getDialogContext } from "./context.js";

	let { children, class: className, ...rest }: DialogContentProps = $props();

	const ctx = getDialogContext();

	if (import.meta.env?.DEV) stripStyleProp(rest as Record<string, unknown>, "DialogContent");
</script>

<div
	{...rest}
	data-kind="dialog"
	data-slot="content"
	data-state={ctx.open ? "open" : "closed"}
	class={cn(className)}
>
	{@render children?.()}
</div>
```

### Key rules

- Symbol key: `Symbol("coldlight:{kind}")` — collision-proof
- Context type is readonly — sub-components read, never write
- Reactive via getter pattern — `get open() { return open; }` keeps Svelte 5 reactivity alive through context
- Context lives in `context.ts`, NOT `types.ts`

### Consequences

- Every compound primitive has a `context.ts`
- Simple primitives (Button, Separator) do NOT need context
- Context shape is minimal — only what sub-components need for `data-state` derivation
- Shape varies per-kind: `{ open: boolean }` for dialog/sheet, `{ value: string }` for tabs, `{ checked: boolean | "indeterminate" }` for checkbox, `{ value: number; max: number }` for progress
- The principle: include ONLY what sub-components need to render the correct `data-state`
- Behavior-level context (melt builders, ARIA linking) is a COMPONENT concern, not primitive

---

## ADR-011: Test Requirements

**Date:** 2026-01-23
**Status:** Accepted
**Context:** Primitives are the foundation. Tests must be comprehensive.

### Decision

**Primitive-level tests** verify structure:

| Category | What to verify |
|----------|----------------|
| **Data attributes** | `data-kind`, `data-slot`, `data-state` present and correct |
| **Props** | `class` forwarding via `cn()`, `{...rest}` spread, `data-id` passthrough |
| **Rendering** | Children snippet renders, conditional rendering works |
| **Style guard** | `stripStyleProp` warns in DEV when style prop passed |
| **Context** | Compound sub-components read context correctly |

**Component-level tests** (separate layer) verify behavior:

| Category | What to verify |
|----------|----------------|
| **ARIA** | Roles, aria attributes, ID linking |
| **Keyboard** | Full WAI-ARIA keyboard pattern |
| **Focus** | Trapping, return, initial focus |
| **Interaction** | Open/close, select, dismiss |

### Test count minimums

| Primitive Type | Minimum |
|----------------|---------|
| Simple (Button, Separator) | 15+ |
| Modal (Dialog, AlertDialog, Sheet) | 35+ |
| Selection (Select, Combobox) | 50+ |
| Navigation (Tabs, Accordion) | 40+ |
| Floating (Popover, Tooltip, DropdownMenu) | 30+ |

### Test infrastructure

- **Runner**: vitest-browser-svelte (real Chromium, not jsdom)
- **Harness**: `{Name}.test.svelte` — minimal wrapper component
- **Tests**: `{Name}.test.ts` — actual test cases

---

## ADR-012: Taxonomy 3-File Stack

**Date:** 2026-01-31
**Status:** Accepted
**Context:** Every primitive kind needs a consistent, auditable taxonomy definition.

### Decision

Every kind at `taxonomy/kinds/primitives/{kind}/` has exactly 3 files:

**`types.ts`** — Type vocabulary. `as const` arrays, derived type unions, slot-state map:

```typescript
import type { StateToken, SlotStateMap } from "../../../types.js";

export const buttonSlots = ["root", "icon", "label"] as const;
export type ButtonSlot = (typeof buttonSlots)[number];

export const buttonStateTokens = [
	"focused", "focus-visible", "hover", "active",
	"disabled", "pressed", "loading", "busy",
] as const satisfies readonly StateToken[];
export type ButtonState = (typeof buttonStateTokens)[number];

export const buttonSlotStates = {
	root: ["focused", "focus-visible", "hover", "active", "disabled", "pressed", "loading", "busy"],
	icon: [],
	label: [],
} as const satisfies SlotStateMap<ButtonSlot, ButtonState>;
```

**`contract.ts`** — Imports from `types.ts`, exports the `PrimitiveContract`:

```typescript
import type { PrimitiveContract } from "../../../types.js";
import { buttonSlotStates, type ButtonSlot, type ButtonState } from "./types.js";

export const contract: PrimitiveContract<"button", ButtonSlot, ButtonState> = {
	kind: "button",
	ariaStateProvider: "coldlight",
	slots: { required: ["root"], optional: ["icon", "label"], forbidden: [] },
	states: { shared: [...], specific: [...] },
	slotStates: buttonSlotStates,
	slotActions: { root: [], icon: [], label: [] },
	aria: { role: "button", requiredAttrs: [], optionalAttrs: ["aria-pressed", "aria-disabled"] },
	keyboard: ["Enter", "Space"],
};
```

**`index.ts`** — Barrel. Re-exports from both:

```typescript
export {
	buttonSlots, buttonStateTokens, buttonSlotStates,
	type ButtonSlot, type ButtonState,
} from "./types.js";
export { contract } from "./contract.js";
```

### Key rules

- Types ALWAYS in `types.ts`, contract ALWAYS imports from `types.ts`
- Contract declares `ariaStateProvider`, `aria`, `keyboard` — these are SPECIFICATIONS, not implementations
- The contract is the DNA. It says WHAT a primitive needs. It does NOT provide behavior.
- Scanner reads contracts at build time, validates parity, emits manifest

### Consequences

- Audit script verifies every kind folder has all 3 files
- Adding a new primitive kind starts here — taxonomy first, always
- Adapter and primitive layers reference the contract as their source of truth

---

## ADR-013: Primitive Structural Shell Pattern

**Date:** 2026-01-31
**Status:** Accepted
**Context:** Need a strict, repeatable pattern for every primitive component.

### Decision

Every primitive `.svelte` file follows this exact golden standard:

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

### Strict rules — ZERO exceptions

1. **Imports**: Only `cn`, `stripStyleProp` from `../types.js` and own `./types.js`
2. **No behavior imports**: No `@melt-ui/svelte`, no adapter, no external library
3. **No ARIA**: No `role`, no `aria-*`, no `id` generation
4. **No event handlers**: No `onclick`, `onkeydown`, etc.
5. **`$props()` destructure**: Always destructure `children`, `class: className`, `...rest`
6. **`{...rest}` spread first** on the element
7. **`data-kind` and `data-slot`**: Always present, values from taxonomy contract
8. **`class={cn(className)}`**: Always through `cn()` utility
9. **`{@render children?.()}`**: Always optional chaining
10. **`stripStyleProp` in DEV**: Always present

### Compound root exception

Root components (e.g., `Dialog.svelte`) that provide context but render no DOM:

```svelte
<script lang="ts">
	import type { DialogProps } from "./types.js";
	import { setDialogContext } from "./context.js";

	let { open = $bindable(false), children }: DialogProps = $props();

	setDialogContext({
		get open() { return open; },
	});
</script>

{@render children?.()}
```

No DOM element, no `data-kind`, no `stripStyleProp`. Just context setup and children rendering.

### Consequences

- Every primitive is auditable against this template
- Lefthook/CI can grep for violations (melt imports, role attributes, style props)
- Swapping dsAdapter or framework target NEVER touches primitives
- The structural shell IS the primitive. Behavior is composed on top.

---

## ADR-014: Contract-Driven Generation

**Date:** 2026-01-31
**Status:** Proposed
**Context:** Taxonomy contracts define the complete specification of a primitive. This specification could drive automated generation of framework-specific output.

### Decision

The taxonomy contract is the **DNA** of a primitive. Today it drives:
- Scanner validation (parity checks)
- Manifest generation (registry data)
- Type derivation (slot unions, state tokens)

Future: the contract drives **code generation**:

```
taxonomy/kinds/primitives/dialog/contract.ts
    │
    ├──► generate ──► primitives/dialog/*.svelte  (Svelte 5)
    ├──► generate ──► primitives/dialog/*.tsx      (React)
    ├──► generate ──► primitives/dialog/*.vue      (Vue)
    └──► generate ──► primitives/dialog/*.ts       (Lit)
```

The contract declares slots, states, element types, ARIA requirements. A generator reads the contract and emits structural shells in any target framework. The primitive Svelte files we write today ARE the Svelte generation target — written by hand now, generated later.

### Consequences

- Contracts must be complete and accurate — they're the generation source
- Primitive Svelte files must be mechanically derivable from the contract (no magic, no special cases)
- Generation script lives in `scripts/coldlight/` when built
- This is why the pattern is so strict — it MUST be automatable

---

## ADR-015: Config-Driven System

**Date:** 2026-01-31
**Status:** Accepted
**Context:** ColdLight's behavior is configured, not hardcoded.

### Decision

Configuration files drive the system:

| File | Purpose |
|------|---------|
| `coldlight.config.ts` | Root config — scanner entry, output paths |
| `config/coldlight/adapters.cfg.ts` | Declares active dsAdapter (currently MeltUI) |
| `config/coldlight/enforcement.cfg.ts` | Scanner strictness, parity rules |
| `config/coldlight/generation.cfg.ts` | Generation targets, output paths |
| `config/coldlight/roots.cfg.ts` | Filesystem roots for scanning |
| `config/coldlight/types.ts` | Config type definitions |

### Consequences

- Changing the dsAdapter means editing `adapters.cfg.ts`, not refactoring primitives
- Scanner behavior is configurable (strict/warn/skip parity checks)
- Generation targets are declarative
- All config is typed — no magic strings

---

## TEMPLATE

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
