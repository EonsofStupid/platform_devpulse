# ColdLight Design Book

> **The canonical specification for ColdLight design system.**
>
> If it is not in this book, it does not exist.

---

## Book Structure

| Hub | Location | Purpose |
|-----|----------|---------|
| [Laws](./LAWS.md) | `docs/LAWS.md` | Frozen non-negotiable rules |
| [Terminology](./TERMINOLOGY.md) | `docs/TERMINOLOGY.md` | Canonical vocabulary |
| [Taxonomy](../taxonomy/README.md) | `taxonomy/` | SSOT backbone + contracts |
| [Tokens](../tokens/README.md) | `tokens/` | Design token SSOT |
| [Primitives](../primitives/README.md) | `primitives/` | Structure + state components |
| [Recipes](../recipes/README.md) | `recipes/` | Appearance system |
| [Semantics](../semantics/README.md) | `semantics/` | Primitives + recipes |
| [Blocks](../blocks/README.md) | `blocks/` | Accessible units for VPB |
| [Blueprints](./BLUEPRINTS.md) | `docs/BLUEPRINTS.md` | Prebuilt assemblies |
| [Patterns](../patterns/README.md) | `patterns/` | Documentation guidance |
| [Generator](./GENERATOR.md) | `docs/GENERATOR.md` | Auto-doc pipeline |
| [Git Discipline](./GIT_DISCIPLINE.md) | `docs/GIT_DISCIPLINE.md` | Commit/tag/label rules |

---

## The One Rule

> **Taxonomy is truth. Everything else is execution.**

---

## Core Architecture

`
CONFIGURATION (config/coldlight/*.cfg.ts)
    Declares: dsAdapter, roots, enforcement, attributes
                    |
                    v
TAXONOMY (taxonomy/kinds/primitives/{kind}/contract.ts)
    SSOT contracts. Declares existence + requirements.
                    |
        +-----------+-----------+
        |                       |
        v                       v
PRIMITIVES                  dsADAPTER
primitives/{kind}/          api/adapters/meltui/_internal/{kind}/
Structure + state           Behavior + ARIA provider
Bound to contract           Fulfills contract
                    |
                    v
BLOCKS (blocks/{category}/{Name}.svelte)
    ARIA applied here at render via dsAdapter
    This is the accessible component for VPB
`

---

## Contract Binding Model

One contract per kind. Lives in taxonomy. Everything chains to it.

`
taxonomy/kinds/primitives/tabs/contract.ts
    THE SINGLE SOURCE OF TRUTH
    - kind: tabs
    - slots: [root, list, trigger, content]
    - states: [selected, focused, disabled]
    - aria: { role: tablist, attrs: [...] }
    - keyboard: [ArrowLeft, ArrowRight, Home, End]
    - ariaStateProvider: meltui
            |
      +-----+-----+
      |           |
      v           v
primitives/     api/adapters/meltui/
tabs/           _internal/tabs/
      |               |
      v               v
IMPLEMENTS       FULFILLS
structure        behavior + aria
`

### The Binding Mechanism

1. **Config** declares `dsAdapter: meltui` in `config/coldlight/adapters.cfg.ts`
2. **Contract** declares `ariaStateProvider: meltui` in `taxonomy/kinds/primitives/{kind}/contract.ts`
3. **Scanner** validates: does `api/adapters/{dsAdapter}/_internal/{kind}/` exist?
4. **Folder name** IS the binding - no redundant adapter-kind contracts

---

## The dsAdapter Model

**ColdLight = public API.** Always.
**dsAdapter = internal behavior provider.** Hidden.

`
COLDLIGHT (The System)
    User sees: <Tabs>, <Dialog>, <Button>
    User imports: /design/primitives
    User never sees: MeltUI, React ARIA, or any adapter
                    |
                    v
dsAdapter (MeltUI)
    Declared in: config/coldlight/adapters.cfg.ts
    Inventory: taxonomy/api/adapter/meltui/contract.ts
    Implementation: api/adapters/meltui/_internal/{kind}/
    
    Provides:
      - State management (open, selected, expanded)
      - ARIA attributes (role, aria-*, tabindex)
      - Keyboard handlers (ArrowLeft, Home, End)
      - Focus management (trap, restore, roving)
    
    Applied at: BLOCK RENDER TIME (not primitive level)
`

---

## ARIA Application Model

**ARIA is NOT baked into primitives.**
**ARIA is applied at block render time via dsAdapter.**

### Why Late-Binding ARIA?

Primitives do not know their context:

| Same Primitive | Context A     | Context B      | ARIA Needed                 |
|----------------|---------------|----------------|-----------------------------|
| dialog         | Modal         | Alert          | role=dialog vs alertdialog  |
| button         | Form submit   | Toolbar toggle | button vs aria-pressed      |
| panel          | Sidebar       | Disclosure     | complementary vs expanded   |

**The block knows the context. The primitive does not.**

### The Flow

`
CONTRACT declares ARIA requirements
       |
       v
PRIMITIVE renders structure + state (NO ARIA)
       |
       v
BLOCK instantiates primitives
       |
       v
dsAdapter auto-applies at render:
  - ARIA attributes from contract
  - Keyboard handlers from contract
  - Focus management from contract
       |
       v
ACCESSIBLE COMPONENT rendered
`

---

## Primitive Layer

Primitives are **structure + state only**. No ARIA.

Primitives provide:
- HTML structure
- data-kind, data-slot, data-state attributes
- State coordination via dsAdapter
- Context sharing for child slots

Primitives do NOT provide:
- ARIA attributes
- role attributes
- Keyboard handlers
- Focus management

---

## Block Layer

Blocks are **the accessible unit**. ARIA applied here.

dsAdapter reads the contract and auto-applies:
- ARIA attributes based on context
- Keyboard handlers from contract
- Focus management

---

## Markup Contract

`html
<button class="btn-main v-s1z2l3t1m2" data-kind="button" data-slot="root" data-state="idle">
  Save
</button>
`

### Two Class Types

| Class | Purpose | Example |
|-------|---------|---------|
| Semantic preset | Structure + intent | .btn-main, .panel-main |
| Variant payload | Compressed appearance | .v-s1z2l3t1m2 |

### Three Data Attributes

| Attribute | Purpose | Example |
|-----------|---------|---------|
| data-kind | Primitive identity | button, dialog |
| data-slot | Slot within primitive | root, trigger |
| data-state | State machine output | idle, open |

---

## Variant Key Encoding (Frozen)

`
v-s{#}z{#}l{#}t{#}m{#}
`

| Key | Variable | Meaning |
|-----|----------|---------|
| s | --surface | Surface type |
| z | --material | Material (z-material) |
| l | --layers | Layer count |
| t | --transition | Transition speed |
| m | --motion | Motion type |

---

## Compliance

| Standard | Status |
|----------|--------|
| DTCG (W3C Dec 2024) | Compliant |
| Style Dictionary v4 | Compliant |
| WCAG 2.1 AA | Target |
| ARIA 1.2 | Per-contract via dsAdapter |

---

**This is the root of the ColdLight Design Book.**