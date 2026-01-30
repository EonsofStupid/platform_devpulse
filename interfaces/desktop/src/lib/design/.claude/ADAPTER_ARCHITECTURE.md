# Adapter Architecture

> **How dsAdapters work in ColdLight.**

---

## Core Principle

**ColdLight = public API. Always.**
**dsAdapter = internal behavior provider. Hidden.**

---

## What is a dsAdapter?

A dsAdapter provides:
- State management (open, selected, expanded)
- ARIA attributes (role, aria-*, tabindex)
- Keyboard handlers (ArrowLeft, Home, End)
- Focus management (trap, restore, roving)

Currently: MeltUI
Next: React ARIA

---

## Adapter Declaration

### Adapter-Wide Contract

Location: `taxonomy/api/adapter/{adapter}/contract.ts`

`	ypescript
export const ADAPTER_ID = "meltui" as const;
export const ADAPTER_SOURCE = "@melt-ui/svelte" as const;

export const MANAGED_ATTRS = [
  "role", "aria-modal", "aria-labelledby", 
  "aria-selected", "aria-expanded", "tabindex", "id"
];

export const BUILDER_INVENTORY = [
  { kind: "dialog", builder: "createDialog" },
  { kind: "tabs", builder: "createTabs" },
];

export const SUPPORTED_PRIMITIVES = BUILDER_INVENTORY.map(e => e.kind);
`

### Adapter Implementation

Location: `api/adapters/{adapter}/_internal/{kind}/`

`
api/adapters/meltui/_internal/tabs/
+-- factory.ts    <- Creates builder instance
+-- types.ts      <- Type definitions
+-- index.ts      <- Barrel export
`

---

## Binding Mechanism

1. Config declares: `dsAdapter: "meltui"`
2. Primitive contract declares: `ariaStateProvider: "meltui"`
3. Scanner validates: `api/adapters/meltui/_internal/{kind}/` exists
4. Folder name = kind name = binding

**No separate adapter-kind contracts needed.**

---

## Import Cloak

Scanner generates `taxonomy/.generated/imports.gen.ts`:

`	ypescript
// Primitives import from here, NOT from adapter directly
export { createMeltTabs as createTabs } from "api/adapters/meltui/_internal/tabs/factory";
export { createMeltDialog as createDialog } from "api/adapters/meltui/_internal/dialog/factory";
`

Primitives see ColdLight names. Adapter is invisible.

---

## ARIA Application

ARIA is NOT baked into primitives.
ARIA is applied at BLOCK RENDER TIME.

`
PRIMITIVE (structure + state)
       |
       v
BLOCK instantiates primitive
       |
       v
dsAdapter auto-applies:
  - ARIA from contract
  - Keyboard from contract
  - Focus management
       |
       v
ACCESSIBLE COMPONENT
`

---

## Adding a New Adapter

1. Create `taxonomy/api/adapter/{adapter}/contract.ts`
   - ADAPTER_ID
   - MANAGED_ATTRS
   - BUILDER_INVENTORY
   - SUPPORTED_PRIMITIVES

2. Create `api/adapters/{adapter}/_internal/{kind}/` for each supported kind
   - factory.ts
   - types.ts
   - index.ts

3. Update config if switching adapters:
   `	ypescript
   // config/coldlight/adapters.cfg.ts
   export const ADAPTERS = {
     active: "reactaria",  // changed
   };
   `

4. Run scanner - it regenerates import cloak

5. Primitives and blocks unchanged

---

## Adapter Swappability

The whole point of this architecture:

| Change Adapter | Impact |
|----------------|--------|
| Taxonomy contracts | Unchanged |
| Primitives | Unchanged |
| Blocks | Unchanged |
| Import cloak | Regenerated |
| Adapter folder | New implementation |

---

**Adapters are plumbing. Users never see them.**