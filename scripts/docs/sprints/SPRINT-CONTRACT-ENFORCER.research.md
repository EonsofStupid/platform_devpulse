# Research: ColdLight 3-Layer Contract Architecture

**Date**: 2026-03-07
**Sprint**: SPRINT-CONTRACT-ENFORCER
**Status**: COMPLETE

---

## The Core Problem

ColdLight has "contracts" and "schemas" but they only validate SHAPE — never FULFILLMENT.

- **Schema** = "Does this object have the right fields?" (Zod validates this)
- **Contract** = "Do the things this object REFERENCES actually exist and match?" (NOTHING validates this)

Every existing "contract" in ColdLight is actually just a schema. It says "kind must be a string"
but never checks "does components/button/ actually exist on disk with the right files?"

The config infrastructure ALREADY declares the rules:
- `enforcement.cfg.ts`: `failOnParity: true, failOnContractLoad: true`
- `components.cfg.ts`: `requiredFiles: ["{Name}.svelte", "types.ts", "schema.ts", ...]`
- `adapters.cfg.ts`: `enabled: { meltui: true }`

But NOTHING reads these configs and enforces them. They're decorative.

---

## What Exists On Disk (VERIFIED 2026-03-07)

### Config Layer (`config/coldlight/`)
- `enforcement.cfg.ts` — declares strict mode, failOnParity, failOnContractLoad
- `components.cfg.ts` — declares required files per component folder
- `adapters.cfg.ts` — declares MeltUI as available adapter
- `types.ts` — ColdLightConfig type with enforcement, components, adapters, tokens sections
- **NONE OF THESE ARE ENFORCED** — they're just type declarations

### Primitives (`primitives/{kind}/`)
- 88 kinds with contract.ts, types.ts, index.ts
- PrimitiveContractSchema validates: slots, slotSpec, states, ARIA, keyboard, focus
- Validation functions exist but NEVER CALLED

### Components (`components/{kind}/`)
- 83 kinds with contract.ts, types.ts, index.ts, *.svelte, *.test.ts
- ComponentContractSchema validates: slots, slotContracts (ARIA), accessibleName, focus, keyboard, states, interactions
- validateComponentContract() exists but NEVER CALLED
- NO fields for: recipe, preset, dsAdapter, VPB metadata, SEO, AI context

### dsAdapter (`api/dsadapters/`)
- ColdLight: 57 kinds with schema.ts, factory.ts, types.ts
- MeltUI: 21 kinds with adapter.contract.ts, factory.ts, _transport/
- AdapterContract type exists — demands slots, props, keyboard mapping
- NEVER VALIDATED against primitive contracts

### Recipes (`recipes/`)
- 25 component recipes + layouts + blocks
- RecipeDefinitionSchema validates: id, kind, slots (structural + visual)
- Build pipeline SKIPS recipe validation (passes empty array)

### KindDefinition / CDO (`registry/kind-definitions.ts`)
- 28 kinds registered
- Has: kind, engine, defaultPreset, defaultRecipe, blockCategory, requiredAxes
- DISCONNECTED from ComponentContract — no cross-validation

---

## Real-World Patterns

### Zag.js: Anatomy = Contract
```typescript
// Anatomy declares parts. Machine won't work without all parts rendered.
const anatomy = createAnatomy("dialog")
  .parts("trigger", "backdrop", "positioner", "content", "title", "description", "closeTrigger")
  .build();
```
- Parts ARE the contract — missing a part = machine breaks
- No separate "validator" needed — the logic itself enforces

### Panda CSS / Chakra v3: defineSlotRecipe enforces slot matching
```typescript
const recipe = defineSlotRecipe({
  slots: ["root", "trigger", "content"],  // <-- these MUST match anatomy
  base: {
    root: { ... },
    trigger: { ... },
    content: { ... },
  },
  variants: { ... },
});
```
- `SlotRecord<S, SystemStyleObject>` = TypeScript enforces recipe keys match slot names
- Can't add a style for a slot that doesn't exist in anatomy

### Angular: NgModule declares components
```typescript
@NgModule({
  declarations: [DialogComponent, DialogTrigger, DialogContent],
  // Missing DialogContent = template error
})
```
- Registration IS enforcement — undeclared = doesn't exist

### Web Components: customElements.define
```typescript
customElements.define("cl-dialog", DialogElement);
// Not defined = <cl-dialog> renders nothing
```
- Registration IS existence

### Best Practice Synthesis
Senior devs make registration = enforcement. The act of declaring a component
INTO the system validates that everything it needs exists. There's no separate
"enforcer" that runs later — the contract itself demands fulfillment at
registration time.

---

## The Fix: 3-Layer Contract System

### Layer 1: Primitive Contract (Inventory/Manifest)

**What it is**: The list of what ColdLight wraps. Each entry declares a kind,
its engine, its slots, its ARIA. For MeltUI kinds, it DEMANDS that the named
folder, adapter.contract.ts, _transport/ all exist.

**Schema demands**:
- kind, engine (coldlight | meltui)
- slots (required, optional)
- slotSpec per slot (element, children mode, ARIA)
- states, keyboard, focus
- IF meltui: adapter folder path, _transport path, adapter contract slot coverage

### Layer 2: Component Contract (The Product)

**What it is**: The declaration that makes a component REAL. Without this
contract being fully satisfied, the component does not exist in the system.

**Schema demands**:
- Style identity: defaultStyleId (recipe ID), preset
- CDO alignment: KindDefinition must exist and match
- Props: ColdLightProps (8-axis) + component-specific props, all from own schema
- VPB metadata: SEO (description, keywords), AI context (waiAdapt), accessibility data, style options, props manifest
- dsAdapter: named folder exists, types colocated, adapter produces AdapterResult
- Recipe: exists, slots match contract, visual modes declared, defaults satisfy requiredAxes

### Layer 3: Block Contract (Compositions)

**What it is**: A page-level composition made of ColdLight components.
Each block declares which components it uses and what slots it has.

**Schema demands**:
- Component dependencies (list of kinds, each must satisfy Layer 2)
- Slot structure (header, content, footer, etc.)
- Block recipe with matching slots
- Props composed from component props

---

## Files Referenced

### Config (rules declared but not enforced)
- `config/coldlight/enforcement.cfg.ts`: strict mode, failOnParity
- `config/coldlight/components.cfg.ts`: required files per component
- `config/coldlight/adapters.cfg.ts`: MeltUI enabled
- `config/coldlight/types.ts`: ColdLightConfig master type

### Schemas (validate shape only)
- `primitives/_schema/contract.ts`: PrimitiveContractSchema
- `primitives/_schema/schema.ts`: Zod enums for ARIA/keyboard/state
- `primitives/_schema/types.ts`: TypeScript types from config
- `components/_schema/contract.ts`: ComponentContractSchema + validateComponentContract()
- `components/_schema/schema.ts`: ARIA value types, ComponentSlotContractSchema
- `components/_base/types.ts`: PreparedComponentProps (ColdLightProps + class + children)

### dsAdapter (folders exist, never validated)
- `api/dsadapters/_schema/types.ts`: AdapterContract type
- `api/dsadapters/_schema/engine.ts`: ComponentSchema, AdapterResult
- `api/dsadapters/meltui/_internal/dialog/adapter.contract.ts`: example MeltUI contract
- `api/dsadapters/meltui/_internal/dialog/_transport/types.ts`: example transport types
- `api/dsadapters/coldlight/_internal/button/schema.ts`: example ColdLight schema

### Registry (disconnected from contracts)
- `registry/kind-definitions.ts`: 28 CDOs with engine, preset, recipe
- `registry/presets.ts`: 60+ presets
- `registry/resolve-visual.ts`: ColdLightProps resolution pipeline

### Build (validators exist, recipe check disabled)
- `scripts/dev/design/sd/build.ts`: runs validators, skips recipes
- `scripts/dev/design/sd/validators/kind-coverage.ts`: preset + file existence check
