# SPRINT: Contract Enforcer — Config-Driven Contract Architecture

**Research**: `SPRINT-CONTRACT-ENFORCER.research.md`
**Status**: DRY RUN — STOP points require owner decisions before execution
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

## PHASE 1: Token Library Contract + Schema

**Purpose**: The visual foundation. SD5 tokens → CSS → Tailwind → variants.
**Location**: `tokens/` + `registry/token-categories.ts` + `generated/`

### What exists now (VERIFIED)
- `token-contract.ts` validator — checks Tier 1 sync (PARTIALLY WORKS)
- `registry-refs.ts` validator — checks var() references (WORKS)
- Both run in build.ts — these are the ONLY contracts that actually run
- `tokens.css` — 437 lines of :root CSS custom properties (REAL)
- `tailwind.css` — 190 lines @theme block (REAL)
- `variants.css` — 265 lines @utility rules (REAL)

### 🛑 STOP 1.1 — Owner Decision Required
**Question**: Where should the Token Library contract + schema file live?
**Options**:
- A) `tokens/_schema/contract.ts` (new file, colocated with token sources)
- B) `scripts/dev/design/sd/validators/token-library-contract.ts` (next to existing validators)
- C) Other location
**Impact**: Sets pattern for where ALL subsystem contracts live

### 🛑 STOP 1.2 — Owner Decision Required
**Question**: What should the TokenLibraryContractSchema demand?
**Current understanding** (from research — needs owner confirmation):
- DTCG source files exist and parse
- SD5 build produces `tokens.css` (CSS custom properties in :root)
- SD5 build produces `tailwind.css` (@theme block for Tailwind v4)
- SD5 build produces `types.ts` (TypeScript enums/unions)
- Every Tier 1 token in DTCG exists in BOTH :root and @theme
- `variants.css` is generated from `token-categories.ts`
- Every `var(--xxx)` reference in `token-categories.ts` resolves to a real CSS property
- Token category registry (8 axes) is complete: s, z, d, b, g, f, m, t

**Is this correct? Anything missing? Anything wrong?**

### 🛑 STOP 1.3 — Owner Decision Required
**Question**: Should the existing validators (`token-contract.ts`, `registry-refs.ts`) be:
- A) Absorbed into the new TokenLibraryContract (single file, single source)
- B) Kept as-is and imported by the new contract (composition)
- C) Rewritten from scratch as part of the new contract
**Impact**: Determines how much existing code survives vs gets replaced

### Tasks (pending STOP answers)
- [ ] T.1: Create `TokenLibraryContractSchema` (Zod)
- [ ] T.2: Create `validateTokenLibraryFulfillment()` — checks all outputs exist and are in sync
- [ ] T.3: Integrate existing validators into the contract
- [ ] T.4: Contract paths config-driven from `tokens.cfg.ts` / `coldlight.config.ts`

---

## PHASE 2: Recipe System Contract + Schema

**Purpose**: Styling patterns. Each recipe declares slots + structural classes + visual modes.
**Location**: `recipes/` + `recipes/types.ts`

### What exists now (VERIFIED)
- `RecipeDefinitionSchema` in `recipes/types.ts` — validates shape only
- `registerRecipe()` in `recipes/index.ts` — validates on registration
- Build pipeline SKIPS recipe validation (passes `[]` to kind-coverage)
- 95 recipe .ts files exist on disk
- `resolveRecipe()` engine written (new, from recipe engine sprint)

### 🛑 STOP 2.1 — Owner Decision Required
**Question**: Where should the Recipe contract + schema file live?
**Options**:
- A) `recipes/_schema/contract.ts`
- B) Same location pattern as Token Library (from STOP 1.1 answer)
- C) Other
**Impact**: Consistency of contract file locations across subsystems

### 🛑 STOP 2.2 — Owner Decision Required
**Question**: What should the RecipeContractSchema demand?

**Current understanding** (needs owner confirmation):
- Valid ID format: `{kind}.{variant}.{style}`
- `kind` matches a registered component kind
- Every slot in recipe matches a slot in the component contract
- No orphan slots
- Each slot declares `structural` (Tailwind classes) and `visual` mode
- `defaults` satisfies CDO's `requiredAxes`
- Structural classes are valid (not empty strings)
- `resolveRecipe()` can process this recipe

**Additional features the owner mentioned but I need clarification on:**

### 🛑 STOP 2.3 — Owner Decision Required
**Question**: Recipe dedup detection — the owner mentioned that if you save a preset and the same values already exist under a different name, the system should catch it.
- How should this work exactly?
- Is this a build-time warning? A hard error?
- Does it compare exact values or fuzzy match?
- Is this part of the Recipe contract or the Preset registry?

### 🛑 STOP 2.4 — Owner Decision Required
**Question**: Recipe scoping — the owner mentioned recipes can be scoped to page, component, or block level.
- How does scoping work?
- Is scope a field on the recipe definition?
- What does "page-scoped" vs "component-scoped" vs "block-scoped" mean concretely?
- Does this affect how `resolveRecipe()` resolves?

### 🛑 STOP 2.5 — Owner Decision Required
**Question**: Recipe → Token mapping — the owner said recipes need to map to real SD5 tokens.
- The current recipe structural classes are Tailwind utility classes (e.g., "rounded-lg", "px-4")
- Visual styling comes from v-* encoding (token-categories.ts)
- How should the recipe contract validate that its visual references map to real tokens?
- Is this about ensuring the `defaults` preset values reference real token indices?

### Tasks (pending STOP answers)
- [ ] R.1: Create `RecipeContractSchema` (Zod) with slot alignment demands
- [ ] R.2: Create `validateRecipeFulfillment()` — checks slots match, defaults satisfy axes
- [ ] R.3: Wire recipe validation into build pipeline (stop passing `[]`)
- [ ] R.4: Implement dedup detection (pending STOP 2.3 answer)
- [ ] R.5: Implement scoping (pending STOP 2.4 answer)

---

## PHASE 3: Primitive Contract + Schema (Inventory/Manifest)

**Purpose**: Inventory manifest. Declares what ColdLight wraps.
**Location**: `primitives/_schema/`

### What exists now (VERIFIED)
- `PrimitiveContractSchema` in `primitives/_schema/contract.ts` — validates slots, slotSpec, states, ARIA, keyboard, focus
- Validation functions exist (parseContract, validateContract) — NEVER CALLED
- 88 primitive kinds on disk
- 21 MeltUI adapter kinds in `api/dsadapters/meltui/_internal/`
- 57 ColdLight adapter kinds in `api/dsadapters/coldlight/_internal/`

### 🛑 STOP 3.1 — Owner Decision Required
**Question**: The existing PrimitiveContractSchema already validates shape (slots, ARIA, keyboard, focus). What FULFILLMENT demands should be ADDED?

**Current understanding** (needs confirmation):

For MeltUI kinds:
- Named folder MUST exist: `dsadapters/meltui/_internal/{kind}/`
- `adapter.contract.ts` MUST exist
- `factory.ts` MUST exist
- `_transport/` dir MUST exist with factory.ts, types.ts, index.ts
- Adapter contract slots MUST cover every required slot in primitive contract
- Adapter contract ARIA MUST cover every required ARIA attr

For ColdLight kinds:
- Named folder MUST exist: `dsadapters/coldlight/_internal/{kind}/`
- `schema.ts` MUST exist
- `factory.ts` MUST exist
- `types.ts` MUST exist

**Is this right? Too much? Too little? Wrong files?**

### 🛑 STOP 3.2 — Owner Decision Required
**Question**: Should the existing PrimitiveContractSchema be:
- A) Extended with adapter fulfillment fields (add to existing)
- B) Rewritten (replace existing)
- C) Left as-is for shape validation, with a SEPARATE fulfillment validator
**Impact**: The existing schema has 274 lines and is comprehensive for shape. Rewriting risks breaking things.

### Tasks (pending STOP answers)
- [ ] P.1: Add adapter fulfillment demands to primitive contract
- [ ] P.2: Create `validatePrimitiveAdapterFulfillment()` — filesystem checks
- [ ] P.3: Create `validateAdapterContractAlignment()` — cross-checks slots/ARIA
- [ ] P.4: Wire into build pipeline — unfulfilled primitive = not in manifest

---

## PHASE 4: Component Contract + Schema (The Product)

**Purpose**: THE product. A component exists ONLY when all criteria are met.
**Location**: `components/_schema/`

### What exists now (VERIFIED)
- `ComponentContractSchema` — currently ONLY validates ARIA (kind, slots, slotContracts, accessibleName, focus, keyboard, states, interactions, primitiveKind)
- `validateComponentContract()` exists but NEVER CALLED
- 83 component kinds on disk
- KindDefinition (CDO) has 28 registered kinds — DISCONNECTED from ComponentContract
- NO fields for: recipe, preset, dsAdapter, VPB metadata, SEO, AI context

### 🛑 STOP 4.1 — Owner Decision Required
**Question**: This is THE enforcement point. The ComponentContract must demand ALL of the following (confirm each):

#### Style Identity
- [ ] `defaultStyleId` — recipe ID assigned (e.g., "button.glass.void")
- [ ] Recipe MUST be registered and its own contract satisfied
- [ ] Recipe slots MUST match component contract slots
- [ ] Preset MUST exist (defaultPreset in KindDefinition)

#### CDO Alignment
- [ ] KindDefinition MUST be registered in `kind-definitions.ts`
- [ ] CDO.kind MUST match component contract kind
- [ ] CDO.engine MUST match primitive contract ariaStateProvider
- [ ] CDO.defaultRecipe MUST match component defaultStyleId
- [ ] CDO.defaultPreset MUST exist in presets registry

#### Props (the 3 primary data props)
- [ ] ColdLightProps (8-axis surface props)
- [ ] Component-specific props (from component's own types.ts)
- [ ] Children/slot props (typed per slot)
- [ ] All props drive resolution pipeline (resolveVisual → emitSegments → v-* classes)

#### VPB Tab Population
- [ ] SEO metadata (description, keywords)
- [ ] AI context (waiAdapt action/purpose/simplification)
- [ ] Accessibility tab (ARIA role, required attrs, keyboard, focus)
- [ ] Style tab (available presets, available recipes, requiredAxes)
- [ ] Props tab (all configurable props with types and defaults)

#### dsAdapter Alignment
- [ ] Named folder exists for this kind
- [ ] Types colocated
- [ ] If meltui: _transport maps correctly
- [ ] Adapter produces AdapterResult
- [ ] Component consumes AdapterResult for ARIA

#### Recipe Alignment
- [ ] Default recipe exists and satisfies recipe contract
- [ ] Recipe slots match component contract slots
- [ ] Recipe visual mode per slot declared
- [ ] Recipe defaults satisfy CDO.requiredAxes
- [ ] resolveRecipe() produces per-slot class strings

**Is this correct? Anything missing? Anything wrong? Anything that should NOT be here?**

### 🛑 STOP 4.2 — Owner Decision Required
**Question**: The existing ComponentContractSchema (318 lines) validates ARIA only. It needs to be REWRITTEN to include all the above. Should the ARIA validation:
- A) Stay where it is and the new fields get added around it
- B) Be restructured as one section of the new comprehensive contract
- C) Be moved to the primitive contract (since primitives declare ARIA)
**Impact**: Determines whether ARIA is owned by primitive contract or component contract or both

### 🛑 STOP 4.3 — Owner Decision Required
**Question**: The button contract (`components/button/contract.ts`) will be the gold standard. Once the new schema is defined, should:
- A) Button be rewritten first as the example, then all others follow the pattern
- B) The schema be finalized first, then ALL components migrated in bulk
- C) Button + one MeltUI component (dialog?) done together to prove both paths
**Impact**: How the rollout works

### Tasks (pending STOP answers)
- [ ] C.1: Rewrite `ComponentContractSchema` — add all demanded fields
- [ ] C.2: Create `validateComponentFulfillment()` — checks ALL subsections
- [ ] C.3: Wire into build pipeline — unfulfilled component = not in manifest
- [ ] C.4: Rewrite button contract.ts as gold standard
- [ ] C.5: Migrate remaining component contracts

---

## PHASE 5: Block Contract + Schema (Compositions)

**Purpose**: Compositions of ColdLight components. Pages, widgets, overlays.
**Location**: new `blocks/_schema/`

### What exists now
- Widget block recipe exists (`recipes/blocks/widget/`)
- No formal block contract or schema

### 🛑 STOP 5.1 — Owner Decision Required
**Question**: What does a block contract demand?
**Current understanding**:
- Every ColdLight component it uses satisfies its own component contract
- Block declares its component dependencies (kind references)
- Block declares its own slot structure (header, content, footer, etc.)
- Block recipe exists with matching slots
- Block props are composed from its component props
- VPB can render the block with its components in the right slots

**Is this right? Is there more?**

### 🛑 STOP 5.2 — Owner Decision Required
**Question**: Should blocks be addressed in THIS sprint or deferred?
- Blocks depend on Components being done (Phase 4)
- Components depend on Recipes + Primitives (Phases 2-3)
- This sprint might be too large if it includes all 5 subsystems
**Options**:
- A) Include blocks in this sprint
- B) Defer blocks to a follow-up sprint after Phases 1-4 are solid
**Impact**: Sprint scope and completion timeline

### Tasks (pending STOP answers)
- [ ] B.1: Create `BlockContractSchema` (Zod)
- [ ] B.2: Create `validateBlockFulfillment()`
- [ ] B.3: Wire into build pipeline
- [ ] B.4: Update widget block as gold standard

---

## PHASE 6: Build-Time Enforcement

### 🛑 STOP 6.1 — Owner Decision Required
**Question**: The enforcer script runs ALL subsystem contracts in dependency order. Where should it live?
**Options**:
- A) `scripts/dev/design/sd/validators/contract-enforcer.ts` (next to existing validators)
- B) New top-level script location
- C) Other

### 🛑 STOP 6.2 — Owner Decision Required
**Question**: How should the enforcer integrate?
**Options**:
- A) Replace existing `kind-coverage.ts` in build.ts
- B) Run alongside existing validators (additive)
- C) Replace ALL existing validators (token-contract, registry-refs, kind-coverage)
**Impact**: Whether existing working validators survive or get absorbed

### Execution order (dependency chain)
```
1. Token Library  — foundation, no deps
2. Recipe System  — depends on tokens (variant values)
3. Primitives     — depends on tokens (CSS props for ARIA data-attributes)
4. Components     — depends on primitives + recipes + tokens
5. Blocks         — depends on components
```

### Tasks (pending STOP answers)
- [ ] E.1: Create enforcer that runs all subsystem validations in order
- [ ] E.2: Wire into `build.ts`
- [ ] E.3: Add `pnpm ds:enforce` script for standalone runs
- [ ] E.4: Wire into `pnpm dev` startup (warnings)
- [ ] E.5: Wire into lefthook pre-commit

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
- DO NOT assume answers to STOP points — WAIT for the owner
- DO NOT continue past a STOP without owner sign-off
