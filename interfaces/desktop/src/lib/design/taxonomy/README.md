# Taxonomy

> **The SSOT backbone. All contracts live here.**

---

## The One Rule

> **If taxonomy does not have a contract for it, it does not exist in ColdLight.**

---

## Purpose

Taxonomy is the **single source of truth** for:

1. **Contracts** - Declarations for all kinds (primitives, semantics, composites, blocks)
2. **Adapter Declarations** - What dsAdapters exist and their capabilities
3. **Scanner** - Build-time validation of contract chain
4. **Registry** - Runtime lookup from generated manifest
5. **VPB Types** - Block definitions for Visual Page Builder

---

## Folder Structure

`
taxonomy/
+-- api/
|   +-- adapter/
|       +-- meltui/
|           +-- contract.ts      <- Adapter-wide inventory
|           +-- types.ts
|           +-- index.ts
|
+-- kinds/
|   +-- primitives/
|   |   +-- button/
|   |   |   +-- contract.ts      <- ColdLight button contract
|   |   +-- tabs/
|   |   |   +-- contract.ts      <- ColdLight tabs contract
|   |   +-- dialog/
|   |       +-- contract.ts      <- ColdLight dialog contract
|   +-- semantics/               <- TO BE BUILT
|   +-- composites/              <- TO BE BUILT
|   +-- blocks/                  <- TO BE BUILT
|
+-- vpb/
|   +-- kinds.ts                 <- VPB block kinds
|   +-- contracts.ts             <- VPB block schemas
|   +-- slots.ts                 <- VPB slot constraints
|   +-- index.ts
|
+-- .generated/
|   +-- coldlight.manifest.json  <- Scanner output
|   +-- imports.gen.ts           <- Import cloak
|
+-- scanner.ts                   <- Build-time validation
+-- registry.ts                  <- Runtime lookup
+-- types.ts                     <- Shared types
+-- index.ts                     <- Barrel export
`

---

## Contract Model

### One Contract Per Kind

Every kind has exactly one contract in taxonomy. This is the SSOT.

`	ypescript
// taxonomy/kinds/primitives/tabs/contract.ts

export const contract: PrimitiveContract<"tabs", TabsSlot, TabsState> = {
  kind: "tabs",
  ariaStateProvider: "meltui",
  
  slots: {
    required: ["root", "list", "trigger", "content"],
    optional: [],
    forbidden: [],
  },
  
  states: {
    shared: ["focused", "hover", "active", "disabled"],
    specific: ["hidden", "visible", "selected"],
  },
  
  slotStates: {
    root: ["focus-within"],
    list: [],
    trigger: ["selected", "focused", "hover", "active", "disabled"],
    content: ["hidden", "visible", "selected"],
  },
  
  slotActions: {
    root: [],
    list: [],
    trigger: [],
    content: [],
  },
  
  collections: {
    get(key) {
      return {
        aria: {
          role: "tablist",
          requiredAttrs: ["aria-orientation"],
          optionalAttrs: ["aria-label"],
        },
        keyboard: ["ArrowLeft", "ArrowRight", "Home", "End"],
      }[key];
    },
  },
};
`

### Contract Binding

The contract binds to:

1. **primitives/{kind}/** - The ColdLight component (structure + state)
2. **api/adapters/{dsAdapter}/_internal/{kind}/** - The behavior provider (ARIA + keyboard)

Binding is through:
- Config declares dsAdapter
- Contract declares ariaStateProvider
- Folder naming convention matches kind

---

## Adapter Declaration

Adapter-wide contract declares capabilities:

`	ypescript
// taxonomy/api/adapter/meltui/contract.ts

export const ADAPTER_ID = "meltui" as const;
export const ADAPTER_SOURCE = "@melt-ui/svelte" as const;

export const MANAGED_ATTRS = [
  "role", "aria-modal", "aria-labelledby", "aria-describedby",
  "aria-selected", "aria-expanded", "aria-disabled", "tabindex", "id"
];

export const BUILDER_INVENTORY = [
  { kind: "dialog", builder: "createDialog" },
  { kind: "tabs", builder: "createTabs" },
  { kind: "accordion", builder: "createAccordion" },
  // ...
];

export const SUPPORTED_PRIMITIVES = BUILDER_INVENTORY.map(e => e.kind);
`

---

## Scanner

`taxonomy/scanner.ts` validates the contract chain at build time:

1. Reads config roots and dsAdapter
2. Scans `taxonomy/kinds/primitives/` for contracts
3. For each contract with `ariaStateProvider: {dsAdapter}`:
   - Validates `api/adapters/{dsAdapter}/_internal/{kind}/` exists
   - Validates factory.ts exists
4. Validates adapter inventory matches supported primitives
5. Emits manifest + import cloak

### Parity Modes

| ariaStateProvider | Parity | Folders Required |
|-------------------|--------|------------------|
| meltui            | 3-folder | taxonomy/kinds + primitives + api/adapters |
| coldlight         | 2-folder | taxonomy/kinds + primitives |

---

## Registry

`taxonomy/registry.ts` reads the generated manifest at runtime:

`	ypescript
getManifest()           // Full manifest
getDsAdapter()          // Active adapter name
getPrimitiveKinds()     // All registered kinds
getPrimitive(kind)      // Single kind data
hasPrimitiveKind(kind)  // Existence check
`

**No filesystem access. No scanning. Pure data lookup.**

---

## Generated Files

Scanner outputs to `.generated/`:

| File | Purpose |
|------|---------|
| `coldlight.manifest.json` | Registry reads this |
| `imports.gen.ts` | Import cloak - maps adapter factories to ColdLight names |

**Never hand-edit generated files.**

---

## Checklist

### Before Adding a Primitive Kind

- [ ] Create `taxonomy/kinds/primitives/{kind}/contract.ts`
- [ ] Define all required slots
- [ ] Define all states (shared + specific)
- [ ] Define slotStates mapping
- [ ] Define ARIA requirements in collections
- [ ] Define keyboard requirements in collections
- [ ] Set ariaStateProvider (meltui or coldlight)

### If ariaStateProvider is meltui

- [ ] Verify kind in adapter inventory
- [ ] Create `api/adapters/meltui/_internal/{kind}/factory.ts`
- [ ] Factory must satisfy contract slots/states

### Validation

- [ ] Run scanner: `pnpm coldlight:scan`
- [ ] Scanner passes with no errors
- [ ] Manifest generated

---

**Taxonomy is the spine of ColdLight. Contracts are the bones.**