# SPRINT: Contract Enforcer — Config-Driven Contract Architecture

**Research**: `SPRINT-CONTRACT-ENFORCER.research.md`
**Status**: READY
**Priority**: P0 — Nothing renders until contracts are real
**Config root**: `coldlight.config.ts` drives everything

---

## Problem Statement

ColdLight has schemas that validate SHAPE but no contracts that demand FULFILLMENT.
Config declares rules (enforcement.cfg.ts: failOnParity=true) but nothing runs them.
Every subsystem (tokens, recipes, primitives, components, blocks) needs its OWN
contract and schema — config-driven, enforced at build time.

Result: black screens. Components that compile but render nothing. Recipes that
accept props but ignore them. dsAdapter folders that exist but never get validated.

---

## Architecture: Config-Driven Contract System

Every subsystem has its OWN base contract and schema.
Each contract DEMANDS specific fulfillment criteria.
All contracts are config-driven — `coldlight.config.ts` is the master.
Miss any criterion = that thing does not exist in the system.

```
coldlight.config.ts (master config — drives everything)
  │
  ├── TOKEN LIBRARY CONTRACT + SCHEMA
  │     "Are SD5 tokens built, CSS props generated, Tailwind @theme synced?"
  │     Demands: DTCG source → CSS output → @theme output → variants.css
  │
  ├── RECIPE CONTRACT + SCHEMA
  │     "Does this recipe have real slots, real defaults, real structural classes?"
  │     Demands: id, kind, slots match component anatomy, defaults satisfy requiredAxes,
  │              structural classes are valid Tailwind, visual mode per slot
  │
  ├── PRIMITIVE CONTRACT + SCHEMA (inventory/manifest)
  │     "What does ColdLight wrap? Are all adapters mapped?"
  │     Demands: named folder per kind in dsAdapter, _transport for MeltUI,
  │              API passthrough so MeltUI fires but ColdLight shows
  │
  ├── COMPONENT CONTRACT + SCHEMA (the product)
  │     "Does this component actually exist as a real, renderable thing?"
  │     Demands: style ID, recipe, SEO/AI/a11y for VPB tabs, props from own schema,
  │              dsAdapter alignment, primitive fulfilled
  │
  └── BLOCK CONTRACT + SCHEMA (compositions)
        "Does this block's components all satisfy their contracts?"
        Demands: component deps satisfied, slot structure, block recipe
```

---

## TOKEN LIBRARY: Contract + Schema

**Purpose**: The visual foundation. SD5 tokens → CSS → Tailwind → variants.
**Location**: `tokens/` + `registry/token-categories.ts` + `generated/`

### What its contract demands

The token library is valid ONLY when:

- [ ] DTCG source files exist and parse (`tokens/` TS sources)
- [ ] SD5 build produces `tokens.css` (CSS custom properties in :root)
- [ ] SD5 build produces `tailwind.css` (@theme block for Tailwind v4)
- [ ] SD5 build produces `types.ts` (TypeScript enums/unions)
- [ ] Every Tier 1 token in DTCG exists in BOTH :root and @theme
- [ ] `variants.css` is generated from `token-categories.ts` (8-axis @utility rules)
- [ ] Every `var(--xxx)` reference in `token-categories.ts` resolves to a real CSS property
- [ ] Token category registry (8 axes) is complete: s, z, d, b, g, f, m, t

### What exists now
- `token-contract.ts` validator — checks Tier 1 sync (PARTIALLY WORKS)
- `registry-refs.ts` validator — checks var() references (WORKS)
- Both run in build.ts — these are the ONLY contracts that actually run

### Tasks

- [ ] T.1: Create `TokenLibraryContractSchema` (Zod) — declares what outputs must exist
- [ ] T.2: Create `validateTokenLibraryFulfillment()` — checks all outputs exist and are in sync
- [ ] T.3: Ensure existing validators (token-contract, registry-refs) are part of the contract
- [ ] T.4: Contract demands: config-driven paths from `tokens.cfg.ts`

---

## RECIPE SYSTEM: Contract + Schema

**Purpose**: Styling patterns. Each recipe declares slots + structural classes + visual modes.
**Location**: `recipes/` + `recipes/types.ts`

### What its contract demands

A recipe is valid ONLY when:

- [ ] Has valid ID format: `{kind}.{variant}.{style}` (e.g., "button.glass.void")
- [ ] `kind` matches a registered component kind
- [ ] Every slot in the recipe matches a slot in the component contract
- [ ] No orphan slots (recipe slot not in component contract)
- [ ] Each slot declares `structural` (Tailwind classes) and `visual` mode ("all" | "none")
- [ ] `defaults` is a partial Preset — satisfies the CDO's `requiredAxes`
- [ ] Structural classes are valid (not empty strings, not random text)
- [ ] `resolveRecipe()` can process this recipe and produce per-slot class strings

### What exists now
- `RecipeDefinitionSchema` in `recipes/types.ts` — validates shape only
- `registerRecipe()` in `recipes/index.ts` — validates on registration
- Build pipeline SKIPS recipe validation (passes `[]`)

### Tasks

- [ ] R.1: Expand `RecipeDefinitionSchema` to demand slot alignment with component contract
- [ ] R.2: Create `validateRecipeFulfillment()` — checks slots match, defaults satisfy axes
- [ ] R.3: Wire recipe validation into build pipeline (stop passing `[]`)
- [ ] R.4: Every recipe registration validates against its component contract at build time

---

## PRIMITIVE: Contract + Schema (Inventory/Manifest)

**Purpose**: Inventory manifest. Declares what ColdLight wraps.
**Location**: `primitives/_schema/`

### What its contract demands

A primitive is just an entry in the inventory. It declares:
- What KIND it is (dialog, combobox, tabs, etc.)
- Whether it's ColdLight-owned or MeltUI-delegated (engine field)
- Its anatomy: required slots, optional slots
- Its ARIA requirements per slot
- Its keyboard behavior, focus strategy

### MeltUI fulfillment

For every primitive where `ariaStateProvider = "meltui"`:

- [ ] Named folder MUST exist: `dsadapters/meltui/_internal/{kind}/`
- [ ] `adapter.contract.ts` MUST exist — declares slot mapping MeltUI → ColdLight
- [ ] `factory.ts` MUST exist — wraps MeltUI builder
- [ ] `_transport/` dir MUST exist — maps MeltUI API → ColdLight interface
- [ ] `_transport/factory.ts` MUST exist — creates transport object
- [ ] `_transport/types.ts` MUST exist — typed transport interface
- [ ] `_transport/index.ts` MUST exist — barrel export
- [ ] Adapter contract slots MUST cover every required slot in primitive contract
- [ ] Adapter contract ARIA MUST cover every required ARIA attr in primitive contract
- [ ] MeltUI fires underneath but ColdLight is what the system sees — logs, API, everything

### ColdLight fulfillment

For every primitive where `ariaStateProvider = "coldlight"`:

- [ ] Named folder MUST exist: `dsadapters/coldlight/_internal/{kind}/`
- [ ] `schema.ts` MUST exist — ComponentSchema declaration
- [ ] `factory.ts` MUST exist — builder with ARIA, state, handlers
- [ ] `types.ts` MUST exist — typed props/result

### Tasks

- [ ] P.1: Add adapter fulfillment fields to PrimitiveContractSchema
- [ ] P.2: Create `validatePrimitiveAdapterFulfillment()` — filesystem checks
- [ ] P.3: Create `validateAdapterContractAlignment()` — cross-checks slots/ARIA
- [ ] P.4: Wire into build pipeline — unfulfilled primitive = not in manifest

---

## COMPONENT: Contract + Schema (The Product)

**Purpose**: THE product. A component exists ONLY when all criteria are met.
**Location**: `components/_schema/`

### What its contract demands

A component CANNOT EXIST unless:

#### Style Identity
- [ ] `defaultStyleId` — recipe ID assigned (e.g., "button.glass.void")
- [ ] Recipe MUST be registered and its own contract satisfied (see RECIPE section)
- [ ] Recipe slots MUST match component contract slots
- [ ] Preset MUST exist (defaultPreset in KindDefinition)

#### CDO Alignment
- [ ] KindDefinition MUST be registered in `kind-definitions.ts`
- [ ] CDO.kind MUST match component contract kind
- [ ] CDO.engine MUST match primitive contract ariaStateProvider
- [ ] CDO.defaultRecipe MUST match component defaultStyleId
- [ ] CDO.defaultPreset MUST exist in presets registry

#### Props (the 3 primary data props)
- [ ] ColdLightProps (8-axis surface props) — imported from own schema
- [ ] Component-specific props — declared in component's own `types.ts`
- [ ] Children/slot props — typed per slot from contract
- [ ] All props drive ColdLight resolution pipeline (resolveVisual → emitSegments → v-* classes)
- [ ] Props schema lives in component's own contract, imported at render time

#### VPB Tab Population
- [ ] SEO metadata — description, keywords for search/discovery
- [ ] AI context — what AI agents see (waiAdapt action/purpose/simplification)
- [ ] Accessibility tab — ARIA role, required attrs, keyboard, focus strategy
- [ ] Style tab — available presets, available recipes, requiredAxes
- [ ] Props tab — all configurable props with types and defaults
- [ ] VPB knows what's available based on page, component, block context

#### dsAdapter Alignment
- [ ] Named folder exists for this kind in dsAdapter (coldlight or meltui)
- [ ] Types exist and are colocated
- [ ] If meltui: _transport maps MeltUI → ColdLight correctly
- [ ] Adapter produces AdapterResult (states, attrs, handlers)
- [ ] Component consumes AdapterResult to render ARIA

#### Recipe Alignment
- [ ] Default recipe exists and satisfies recipe contract (see RECIPE section)
- [ ] Recipe slots match component contract slots
- [ ] Recipe visual mode per slot is declared
- [ ] Recipe defaults satisfy CDO.requiredAxes
- [ ] resolveRecipe() produces per-slot class strings from props

### Tasks

- [ ] C.1: Rewrite ComponentContractSchema — add style identity, CDO, props, VPB, adapter, recipe fields
- [ ] C.2: Create `validateComponentFulfillment()` — checks ALL subsections
- [ ] C.3: Wire into build pipeline — unfulfilled component = not in manifest
- [ ] C.4: Update button contract.ts as gold standard example
- [ ] C.5: Migrate remaining component contracts to new schema

---

## BLOCK: Contract + Schema (Compositions)

**Purpose**: Compositions of ColdLight components. Pages, widgets, overlays.
**Location**: new `blocks/_schema/`

### What its contract demands

A block CANNOT EXIST unless:

- [ ] Every ColdLight component it uses satisfies its own component contract
- [ ] Block declares its component dependencies (kind references)
- [ ] Block declares its own slot structure (header, content, footer, etc.)
- [ ] Block recipe exists with matching slots
- [ ] Block props are composed from its component props
- [ ] VPB can render the block with its components in the right slots

### Tasks

- [ ] B.1: Create BlockContractSchema (Zod)
- [ ] B.2: Create `validateBlockFulfillment()` — checks component deps satisfy their contracts
- [ ] B.3: Wire into build pipeline
- [ ] B.4: Update widget block as gold standard example

---

## BUILD-TIME ENFORCEMENT

### The enforcer script

**File**: `scripts/dev/design/sd/validators/contract-enforcer.ts`

Runs ALL five subsystem contracts in dependency order. Reports per-item. Fails build on violations.

### Execution order (dependency chain)

```
1. Token Library  — foundation, no deps
2. Recipe System  — depends on tokens (variant values)
3. Primitives     — depends on tokens (CSS props for ARIA data-attributes)
4. Components     — depends on primitives + recipes + tokens
5. Blocks         — depends on components
```

### Tasks

- [ ] E.1: Create enforcer that runs all 5 subsystem validations in order
- [ ] E.2: Wire into `build.ts` (replaces broken kind-coverage check)
- [ ] E.3: Add `pnpm ds:enforce` script for standalone runs
- [ ] E.4: Wire into `pnpm dev` startup (warnings)
- [ ] E.5: Wire into lefthook pre-commit

### Output format

```
CONTRACT ENFORCER
=================

TOKENS:
  SD5 build ................... OK (tokens.css, tailwind.css, types.ts)
  Tier 1 sync ................. OK (180 props in both :root and @theme)
  Registry refs ............... OK (240 var() refs validated)
  Variants CSS ................ OK (63 @utility rules from 8 axes)

RECIPES:
  button.glass.void ........... PASS (slots: root, icon, label)
  card.glass.void ............. PASS (slots: root, header, content, footer)
  dialog.glass.void ........... MISSING
  tabs.glass.void ............. MISSING

PRIMITIVES:
  button [coldlight] .......... PASS (dsadapters/coldlight/_internal/button/)
  dialog [meltui] ............. PASS (adapter.contract + _transport/)
  tabs [meltui] ............... FAIL (adapter slots missing: panel)

COMPONENTS:
  button ...................... PASS
    style ID .................. OK (button.glass.void)
    CDO ....................... OK
    props ..................... OK (ColdLightProps + ButtonProps)
    VPB metadata .............. OK
    dsAdapter ................. OK
    recipe .................... OK
  dialog ...................... FAIL
    style ID .................. MISSING
    recipe .................... MISSING

BLOCKS:
  widget ...................... PASS (deps: card, badge, text — all satisfied)

SUMMARY:
  Tokens: PASS
  Recipes: 25/27 pass
  Primitives: 86/88 pass
  Components: 20/28 pass
  Blocks: 2/3 pass
```

---

## Files to Create/Modify

| File | Action | Purpose |
|------|--------|---------|
| `tokens/_schema/contract.ts` | CREATE | Token library contract + schema |
| `recipes/_schema/contract.ts` | CREATE | Recipe system contract + schema |
| `primitives/_schema/contract.ts` | MODIFY | Add adapter fulfillment fields |
| `components/_schema/contract.ts` | REWRITE | Full product contract |
| `components/_schema/schema.ts` | MODIFY | Add VPB metadata schemas |
| `blocks/_schema/contract.ts` | CREATE | Block contract + schema |
| `validators/contract-enforcer.ts` | CREATE | Master enforcer |
| `build.ts` | MODIFY | Wire enforcer in |
| `components/button/contract.ts` | REWRITE | Gold standard |
| `recipes/components/button/button.default.ts` | MODIFY | Gold standard recipe |

---

## Anti-Patterns

- DO NOT create fake contracts to pass the enforcer
- DO NOT add fields that aren't enforced — if it's in the schema, it MUST be checked
- DO NOT separate enforcement from the contract — the contract IS the enforcement
- DO NOT make any check optional or configurable
- DO NOT add runtime overhead — BUILD-TIME ONLY
- DO NOT hand-wave — if a field says "recipe slots match contract slots", CODE THE CHECK
- DO NOT hardcode paths — read from `coldlight.config.ts`
