# ColdLight Primitives — Workflow

> ColdLight is the complete design suite: primitives, components, blocks, style catalog — all driven by Style Dictionary 5 design tokens.

---

## What Primitives ARE

Primitives are **raw, reusable Svelte elements**. They render semantic HTML, accept props, and forward attributes. That's it.

- No ARIA logic
- No behavior
- No styling
- No state management
- No contracts, no schemas, no Zod

A primitive is a `.svelte` file and a `types.ts` file.

---

## What Components ARE

Components consume primitives and add everything else:

- ARIA attributes and roles
- Keyboard interaction
- State management
- Default style ID (recipe/preset binding)
- Props and complex types
- Accessibility (a11y)

**Components own the props and types. Primitives do not.**

---

## Layer Model

```
Primitive (.svelte + types.ts)
  → raw HTML element, data attributes, prop forwarding
  → consumed by Component

Component (props, types, ARIA, a11y, default style ID)
  → the product users import
  → applies recipe styling via useColdLight()
  → consumed by Block

Block (page-level composition)
  → assembles components into layouts
  → VPB system
```

---

## Primitive File Structure

Each primitive kind lives in `primitives/{kind}/`:

```
primitives/button/
├── Button.svelte    # Raw element — <button> with data-kind, data-slot, prop spread
├── types.ts         # Slot names, state tokens, slot-state map
└── index.ts         # Barrel export
```

### types.ts

Declares the vocabulary for this kind:

```typescript
import type { Snippet } from "svelte";
import type { HTMLButtonAttributes } from "svelte/elements";
import type { BaseProps } from "../types.js";

export const buttonSlots = ["root", "icon", "label"] as const;
export type ButtonSlot = (typeof buttonSlots)[number];

export interface ButtonRootProps extends Omit<HTMLButtonAttributes, "style" | "children">, BaseProps {
  children?: Snippet;
}
```

### .svelte file

Minimal. Renders the element, spreads props, sets data attributes:

```svelte
<script lang="ts">
  import type { ButtonRootProps } from "./types.js";
  import { cn } from "../types.js";

  let { children, class: className, ...rest }: ButtonRootProps = $props();
</script>

<button data-kind="button" data-slot="root" class={cn(className)} {...rest}>
  {@render children?.()}
</button>
```

---

## Visuals: Token-Driven

All visual properties come from SD5 design tokens, not from primitives or components directly.

```
DTCG JSON tokens → SD5 pipeline → CSS custom properties → recipes → components
```

Components bind to the visual system through:
- `data-kind` / `data-slot` / `data-state` — selectors for token-driven CSS
- Recipe classes — resolved by `useColdLight()`
- `v-*` encoding utilities — 8-axis composable visual encoding

Primitives carry `data-kind` and `data-slot` so the token pipeline can target them. They do NOT apply any styles.

---

## Adding a New Primitive

1. Create `primitives/{kind}/types.ts` — slot names, props interface extending `BaseProps`
2. Create `primitives/{kind}/{Kind}.svelte` — raw element with data attributes
3. Create `primitives/{kind}/index.ts` — barrel export
4. Verify: `pnpm svelte-check` passes

That's the whole workflow. No contracts, no schemas, no validation objects.

---

## Rules

- Primitives are raw. Zero logic beyond prop forwarding.
- Components own ARIA, keyboard, state, props, types.
- Visuals are token-driven. Never hand-write CSS values.
- Every primitive must set `data-kind` and `data-slot`.
- Props extend `BaseProps` and omit `style` and `children` from the HTML attribute interface.
- Use `.js` extensions in TypeScript imports.
- Use `cn()` for class merging.
