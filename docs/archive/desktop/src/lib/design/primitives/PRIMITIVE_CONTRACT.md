# Primitive Contract

> **How primitives bind to taxonomy contracts.**

---

## The Binding

Every primitive folder contains a `contract.ts` that re-exports the taxonomy contract:

```typescript
// primitives/tabs/contract.ts
export { contract } from '$lib/design/taxonomy/kinds/primitives/tabs/contract';
```

This creates a binding between:
- The SSOT contract in taxonomy (`taxonomy/kinds/primitives/{kind}/contract.ts`)
- The implementation in primitives (`primitives/{kind}/`)

---

## What the Contract Declares

| Field | Purpose | Used By |
|-------|---------|---------|
| `kind` | Primitive identity | Scanner, registry |
| `ariaStateProvider` | Which dsAdapter fulfills behavior | Scanner, blocks |
| `slots` | Required/optional/forbidden slots | Scanner, components |
| `states` | Shared and kind-specific states | Components |
| `slotStates` | Which states apply to which slots | Components |
| `slotActions` | Actions per slot | Components |
| `collections.aria` | ARIA requirements | Blocks (at render) |
| `collections.keyboard` | Keyboard requirements | Blocks (at render) |

---

## Primitives Do NOT Apply ARIA

The contract DECLARES ARIA requirements.
The contract does NOT apply ARIA.

ARIA is applied at BLOCK RENDER TIME where context is known.

Primitives only provide:
- `data-kind`
- `data-slot`
- `data-state`

---

## ariaStateProvider

| Value | Meaning | Parity |
|-------|---------|--------|
| `"meltui"` | dsAdapter provides state + ARIA machinery. Applied at blocks. | 3-folder: taxonomy + adapter + primitive |
| `"coldlight"` | Kind handles ARIA natively (e.g., native `<button>`). No adapter needed. | 2-folder: taxonomy + primitive |

---

## Example

```typescript
// taxonomy/kinds/primitives/tabs/contract.ts (SSOT)
export const contract = {
  kind: "tabs",
  ariaStateProvider: "meltui",
  slots: { required: ["root", "list", "trigger", "content"] },
  // ...
};
```

```typescript
// primitives/tabs/contract.ts (binding)
export { contract } from '$lib/design/taxonomy/kinds/primitives/tabs/contract';
```

```svelte
<!-- primitives/tabs/Tabs.svelte (implementation) -->
<div data-kind="tabs" data-slot="root">
  <!-- NO ARIA here -->
  {@render children?.()}
</div>
```

```svelte
<!-- blocks/settings/SettingsTabs.svelte (ARIA applied) -->
<Tabs {...aria.root}>
  <!-- ARIA applied here at block level -->
</Tabs>
```

---

**Contract declares. Primitive implements structure. Block applies ARIA.**
