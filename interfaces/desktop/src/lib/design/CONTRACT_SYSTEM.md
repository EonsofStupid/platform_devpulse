# Contract System

> **One contract per kind. Contracts live in `primitives/{kind}/contract.ts`.**

---

## Core Principle

Every kind has exactly ONE contract. It lives with its primitive.

```
primitives/{kind}/contract.ts   ← THE contract
```

---

## Contract Structure

```typescript
// primitives/tabs/contract.ts
import type { ComponentContract } from "../_schema/contract.js";

export const contract: ComponentContract = {
  kind: "tabs",
  engine: "meltui",  // "coldlight" (default) or "meltui" (exception)

  slots: {
    required: ["root", "list", "trigger", "content"],
    optional: [],
  },

  aria: {
    root: { role: "tablist", requiredAttrs: ["aria-orientation"] },
    trigger: { role: "tab", requiredAttrs: ["aria-selected", "aria-controls"] },
    content: { role: "tabpanel", requiredAttrs: ["aria-labelledby"] },
  },

  keyboard: ["ArrowLeft", "ArrowRight", "Home", "End", "Enter", "Space"],

  states: {
    shared: ["focused", "hover", "active", "disabled"],
    specific: ["selected", "hidden", "visible"],
  },
};
```

---

## Contract Fields

| Field | Purpose |
|-------|---------|
| kind | Component identity |
| engine | Who provides ARIA — `"coldlight"` (default) or `"meltui"` (exception) |
| slots.required | Slots that MUST exist |
| slots.optional | Slots that MAY exist |
| aria | Per-slot ARIA role and required attributes |
| keyboard | Keyboard interactions |
| states.shared | States common across components |
| states.specific | States unique to this kind |

---

## Engine Field

| Value | Meaning | Usage |
|-------|---------|-------|
| `"coldlight"` | ColdLight handles ARIA natively (DEFAULT) | 60+ kinds |
| `"meltui"` | MeltUI adapter handles complex ARIA (EXCEPTION) | ~20 kinds |

ColdLight-owned is the default. Only use `"meltui"` when ARIA complexity justifies it (dialog focus trap, combobox listbox virtualization).

---

## Kind Definition (Registry)

Contracts pair with kind definitions in `registry/kind-definitions.ts`:

```typescript
{
  kind: "tabs",
  label: "Tabs",
  engine: "meltui",
  defaultPreset: "tabs-default",
  defaultRecipe: "tabs.default",
  blockCategory: "navigation",
  requiredAxes: ["surface", "frame", "transition"],
  compound: true,
  container: true
}
```

Build validator enforces: preset exists, recipe exists, contract exists, requiredAxes satisfied.

---

**One contract per kind. In primitives/. Everything chains to it.**
