# ColdLight — Foundational Checklist

> **ColdLight is the SINGLE SOURCE OF TRUTH.**
> **NO CODE is written until this checklist is understood and approved.**

---

## CORE PRINCIPLE

# ColdLight OWNS EVERYTHING.

Behavior engines are adapter-agnostic options. ColdLight is the default ariaStateProvider.

---

## THREE-LAYER ARCHITECTURE

```
taxonomy/kinds/primitives/{kind}/     ← CONTRACT (SSOT)
  types.ts                            ← Slots, states, slot-state map
  contract.ts                         ← Full PrimitiveContract satisfies
  index.ts                            ← Barrel

primitives/{kind}/                    ← STRUCTURELESS SHELL
  types.ts                            ← Props (OmitStyle + BaseProps)
  {Kind}{Slot}.svelte                 ← Zero ARIA, zero behavior
  context.ts                          ← Compound only (Symbol-keyed)
  index.ts                            ← Barrel

components/{kind}/                    ← STYLED COMPONENT (ARIA + RECIPE)
  contract.ts                         ← ComponentContract satisfies
  types.ts                            ← Extends primitive + intent/size/state
  recipe.ts                           ← SD5 token-driven TW4 classes
  {Kind}.svelte                       ← Wraps primitive, sets ALL ARIA
  index.ts                            ← Barrel
```

---

## WHAT THE PRIMITIVE LAYER PROVIDES

| Responsibility | Implementation |
|---------------|----------------|
| `data-kind` | Hardcoded per primitive |
| `data-slot` | Hardcoded per slot |
| `class` merging | `cn(className)` via tailwind-merge |
| `{...rest}` spread | Pass-through for component layer props |
| `children` rendering | `{@render children?.()}` |
| `stripStyleProp` | DEV-only inline style guard |

**That's it. Nothing else.**

---

## WHAT THE COMPONENT LAYER PROVIDES (EVERYTHING ELSE)

| Ownership | Description |
|-----------|-------------|
| **ALL `role` attributes** | `role="dialog"`, `role="tooltip"`, etc. |
| **ALL `aria-*` attributes** | `aria-modal`, `aria-pressed`, `aria-busy`, etc. |
| **ALL `data-state`** | Derived from component state props |
| **ALL `data-id`** | Stable test/tooling IDs |
| **ALL ID generation** | Generated IDs for ID linking |
| **ALL ID linking** | Title ID → Content `aria-labelledby` |
| **ALL state derivation** | Computing disabled/loading/pressed/open/closed |
| **ALL recipes** | SD5 token-driven TW4 class composition |
| **Behavior** (if needed) | Focus trap, keyboard nav, portal, scroll lock |

---

## THE PATTERN

### Structureless Primitive — `primitives/button/Button.svelte`

```svelte
<!--
  @component ButtonRoot
  @description Structureless button — semantic HTML, data attributes.
  Contract: kind="button", slot="root"

  Zero ARIA. Zero behavior. Zero styling.
-->
<script lang="ts">
  import type { ButtonRootProps } from "./types.js";
  import { cn, stripStyleProp } from "../types.js";

  let { children, class: className, ...rest }: ButtonRootProps = $props();

  if (import.meta.env.DEV) stripStyleProp(rest, 'Button.Root');
</script>

<button
  data-kind="button"
  data-slot="root"
  class={cn(className)}
  {...rest}
>
  {@render children?.()}
</button>
```

### Styled Component — `components/button/Button.svelte`

```svelte
<!--
  @component Button
  @kind button
  @layer components

  ColdLight OWNS all ARIA. Primitive is structural only.
-->
<script lang="ts">
  import type { ButtonComponentProps } from "./types.js";
  import ButtonRoot from "#coldlight/primitives/button/Button.svelte";
  import { cn } from "#coldlight/primitives/types.js";
  import { buttonRecipe } from "./recipe.js";

  let {
    intent = "primary",
    size = "md",
    pressed,
    loading = false,
    disabled = false,
    children,
    class: className,
    ...rest
  }: ButtonComponentProps = $props();

  const classes = $derived(cn(buttonRecipe({ intent, size }), className));
  const dataState = $derived(
    disabled ? "disabled"
    : loading ? "loading"
    : pressed !== undefined ? (pressed ? "pressed" : "idle")
    : undefined
  );
</script>

<ButtonRoot
  {...rest}
  class={classes}
  {disabled}
  aria-pressed={pressed}
  aria-disabled={disabled || undefined}
  aria-busy={loading || undefined}
  data-state={dataState}
>
  {@render children?.()}
</ButtonRoot>
```

---

## WHAT PRIMITIVES NEVER DO

- NEVER set `role=` attributes
- NEVER set `aria-*` attributes
- NEVER set `id=` attributes
- NEVER import behavior engines
- NEVER handle events (`onclick`, `on:keydown`)
- NEVER derive state (`$derived` for UI state)
- NEVER use inline styles

---

## WHAT COMPONENTS ALWAYS DO

- ALWAYS set `role` explicitly per contract
- ALWAYS set `aria-*` explicitly per contract
- ALWAYS set `data-state` from derived state
- ALWAYS apply recipe classes via `cn()`
- ALWAYS use SD5 token-based styling
- ALWAYS link IDs via Svelte context (compound components)

---

## ID LINKING PATTERN (compound components)

```
components/dialog/Root.svelte
  └── setContext(CTX_KEY, { titleId, descriptionId, contentId })

components/dialog/Title.svelte
  └── const { titleId } = getContext(CTX_KEY)
  └── <h2 id={titleId}>

components/dialog/Content.svelte
  └── const { titleId, descriptionId, contentId } = getContext(CTX_KEY)
  └── <div
        id={contentId}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
```

---

## ARIA REQUIREMENTS BY KIND

### Button

| Attribute | Value | Set By |
|-----------|-------|--------|
| `aria-pressed` | `true/false/undefined` | Component |
| `aria-disabled` | `true/undefined` | Component |
| `aria-busy` | `true/undefined` | Component |
| `data-state` | disabled/loading/pressed/idle | Component |

### Dialog

| Attribute | Value | Set By |
|-----------|-------|--------|
| `role` | `"dialog"` | Component |
| `aria-modal` | `"true"` | Component |
| `aria-labelledby` | Title ID | Component |
| `aria-describedby` | Description ID | Component |
| `tabindex` | `-1` | Component |

### Tooltip

| Attribute | Value | Set By |
|-----------|-------|--------|
| `role` | `"tooltip"` | Component |
| `id` | Generated | Component |
| Trigger `aria-describedby` | Content ID | Component |

### Popover

| Attribute | Value | Set By |
|-----------|-------|--------|
| Trigger `aria-haspopup` | `"dialog"` | Component |
| Trigger `aria-expanded` | `"true"/"false"` | Component |
| Trigger `aria-controls` | Content ID | Component |

### Select

| Attribute | Value | Set By |
|-----------|-------|--------|
| Trigger `role` | `"combobox"` | Component |
| Trigger `aria-haspopup` | `"listbox"` | Component |
| Trigger `aria-expanded` | `"true"/"false"` | Component |
| Content `role` | `"listbox"` | Component |
| Item `role` | `"option"` | Component |
| Item `aria-selected` | `"true"/"false"` | Component |

### Tabs

| Attribute | Value | Set By |
|-----------|-------|--------|
| List `role` | `"tablist"` | Component |
| Trigger `role` | `"tab"` | Component |
| Trigger `aria-selected` | `"true"/"false"` | Component |
| Trigger `aria-controls` | Panel ID | Component |
| Content `role` | `"tabpanel"` | Component |
| Content `aria-labelledby` | Tab ID | Component |

---

## TEST REQUIREMENTS

Every COMPONENT test file MUST include:

```typescript
describe("ARIA ownership", () => {
  it("Component sets role attribute", async () => {
    // Verify role exists and has correct value
  });

  it("Component sets aria-* attributes", async () => {
    // Verify all contract-required ARIA attributes
  });

  it("Component derives data-state", async () => {
    // Verify data-state changes with state props
  });

  it("IDs are generated and linked", async () => {
    // Verify IDs exist and aria-labelledby/controls match
  });
});

describe("Primitive structure", () => {
  it("Renders data-kind and data-slot", async () => {
    // Verify structural attributes from primitive
  });

  it("Primitive has zero ARIA on DOM", async () => {
    // Verify primitive adds no ARIA itself
  });
});
```

---

## PRE-FLIGHT CHECKLIST

Before writing ANY code for a kind:

- [ ] Read WAI-ARIA APG for this pattern
- [ ] Create taxonomy/kinds/primitives/{kind}/ directory
- [ ] Write types.ts with slots, states, slot-state map
- [ ] Write contract.ts with full PrimitiveContract
- [ ] Document ALL required ARIA attributes
- [ ] Plan context structure for ID sharing (compound only)

---

## SIGN-OFF

Before marking complete:

1. Does the taxonomy contract exist and compile? **YES/NO**
2. Is the primitive ZERO ARIA? **YES/NO**
3. Does the component set ALL ARIA per contract? **YES/NO**
4. Does the component use SD5 token-driven recipes? **YES/NO**
5. Are IDs linked via context? (compound only) **YES/NO**
6. Does `pnpm svelte-check` pass? **YES/NO**
7. Do ALL tests pass? **YES/NO**

**All must be YES.**

---

**ColdLight is the SINGLE SOURCE OF TRUTH. No exceptions.**
