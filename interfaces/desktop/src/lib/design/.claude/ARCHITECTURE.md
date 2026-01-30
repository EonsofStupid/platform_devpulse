# ColdLight Architecture

> **For AI agents working on ColdLight.**

---

## Core Principle

**Taxonomy is truth. Everything else is execution.**

---

## The Contract Chain

`
CONFIG (config/coldlight/adapters.cfg.ts)
    dsAdapter: "meltui"
           |
           v
TAXONOMY CONTRACT (taxonomy/kinds/primitives/{kind}/contract.ts)
    SSOT - declares existence + requirements
    ariaStateProvider: "meltui"
           |
     +-----+-----+
     |           |
     v           v
PRIMITIVE       dsADAPTER IMPLEMENTATION
primitives/     api/adapters/meltui/_internal/{kind}/
{kind}/         factory.ts
     |                |
     v                v
Structure       Behavior + ARIA
+ State         (applied at block level)
     |
     v
BLOCK (blocks/{category}/{Name}.svelte)
    ARIA APPLIED HERE
    This is the accessible component
`

---

## Key Architectural Decisions

### 1. One Contract Per Kind

Location: `taxonomy/kinds/primitives/{kind}/contract.ts`

This is the SSOT. It declares:
- slots (required, optional, forbidden)
- states (shared, specific)
- slotStates mapping
- ARIA requirements (role, attrs)
- keyboard requirements
- ariaStateProvider

### 2. Contract Binding via Naming

The taxonomy contract binds to:
- `primitives/{kind}/` via folder name
- `api/adapters/{dsAdapter}/_internal/{kind}/` via folder name + ariaStateProvider

No separate adapter-kind contracts needed. Folder naming IS the binding.

### 3. ARIA at Block Level

Primitives do NOT have ARIA baked in.
ARIA is applied at block render time.
This enables context-aware accessibility.

### 4. dsAdapter Abstraction

MeltUI is the first dsAdapter.
React ARIA will be next.
Primitives never see the adapter directly.
Import cloak provides abstraction.

---

## Folder Ownership

| Folder | Contains | Editable? |
|--------|----------|-----------|
| taxonomy/ | ALL contracts | SSOT |
| primitives/ | ColdLight components | Implementation |
| api/adapters/ | Adapter code ONLY | Implementation |
| blocks/ | Accessible units | Implementation |
| .generated/ | Scanner output | NEVER EDIT |

---

## Scanner Validation

Scanner checks:
1. Every primitive has a taxonomy contract
2. If ariaStateProvider = meltui, adapter folder exists
3. Adapter factory.ts exists
4. Adapter inventory includes the kind

---

## When Adding a New Primitive

1. Create `taxonomy/kinds/primitives/{kind}/contract.ts`
2. Create `primitives/{kind}/` folder with components
3. If ariaStateProvider = meltui:
   - Verify kind in adapter inventory
   - Create `api/adapters/meltui/_internal/{kind}/factory.ts`
4. Run scanner to validate

---

## When Swapping Adapters

1. Create `taxonomy/api/adapter/{newAdapter}/contract.ts`
2. Create `api/adapters/{newAdapter}/_internal/` implementations
3. Update `config/coldlight/adapters.cfg.ts`
4. Primitives unchanged - they use import cloak
5. Blocks unchanged - they compose primitives

---

**Follow the contract chain. Taxonomy is truth.**