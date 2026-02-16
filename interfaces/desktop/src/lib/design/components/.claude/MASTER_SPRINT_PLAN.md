# MASTER SPRINT PLAN — ColdLight Components

> **ColdLight OWNS everything. MeltUI is an optional adapter, NOT the default.**
> **Every component is ColdLight-owned unless the contract explicitly justifies adapter delegation.**

---

## CURRENT STATE (2026-02-16)

| Path | Status | Notes |
|------|--------|-------|
| `taxonomy/kinds/primitives/` | 40 contracts | Declare structure, ARIA, slots, states |
| `taxonomy/component/` | Schema + contract + types | ComponentContractSchema, validateComponentContract |
| `components/` | 4 components | dialog, combobox, tabs, panel (adapter-backed) |
| `primitives/` | Types + workflow only | No actual component folders yet |
| `config/coldlight/` | Complete config | 10 fragments, all typed |
| `coldlight.config.ts` | Orchestrator | Single import for all build tools |
| Testing | Vitest + Playwright configured | `vitest.config.ts` exists, zero test files |

---

## OWNERSHIP MODEL

```
ColdLight (OWNER — DEFAULT for all new components)
├── Owns: ARIA attributes, focus, keyboard, state, data-* attributes
├── Owns: Component structure, slots, props, typing
├── Owns: CSS via recipes, tokens, molecules
└── Public API: what users import

MeltUI Adapter (EXCEPTION — justified per-contract only)
├── Used: ONLY for complex ARIA patterns ColdLight can't own directly
├── Examples: dialog focus trap, combobox listbox, floating positioning
├── Internal: never imported by user code
└── Transport: cloaked via api/adapters/meltui/_internal/
```

---

## COMPONENT FOLDER STRUCTURE (MANDATORY)

Every styled component MUST have a named folder under `components/{kind}/`:

```
components/{kind}/
├── {Name}.svelte          # Styled component (primitive + recipe)
├── types.ts               # Component props (extends primitive props + surface)
├── schema.ts              # Zod contract (links to primitive contract)
├── {Name}.test.ts         # Vitest browser tests (MANDATORY)
└── index.ts               # Barrel export
```

Scanner enforces this. Missing files = build failure.

---

## SPRINT SEQUENCE

### Sprint 1: Token Pipeline (SD5)
See `SPRINT-COMPONENT-FOUNDATION.md` Phase 1.

### Sprint 2: Component Tier 3 Tokens
See `SPRINT-COMPONENT-FOUNDATION.md` Phase 2.

### Sprint 3: ColdLight-Owned Primitives (Batch 1)
Build structureless primitives that ColdLight owns directly:
- button, badge, label, separator, spinner, skeleton, progress, avatar, visually-hidden
- Each gets: taxonomy contract, primitive folder, component folder, tests

### Sprint 4: ColdLight-Owned Primitives (Batch 2)
More complex ColdLight-owned:
- input, textarea, checkbox, switch, toggle, radio-group, slider
- Each gets: taxonomy contract, primitive folder, component folder, tests

### Sprint 5: Adapter-Backed Primitives (Justified)
Complex widgets where MeltUI adapter is justified:
- dialog, alert-dialog, sheet, combobox, command, select, popover, tooltip
- Each gets: taxonomy contract, adapter mapping, primitive folder, component folder, tests

### Sprint 6: Testing Enforcement
- Scanner flags missing test files
- CI pipeline enforces zero test failures
- Schema validation tests for all contracts

---

## EXECUTION RULES

1. **ColdLight-owned first.** Default `ariaStateProvider: "coldlight"` unless contract justifies "meltui"
2. **Taxonomy contract first.** No primitive/component exists without a contract
3. **Tests mandatory.** No component is done without passing Vitest browser tests
4. **Config-driven.** Scanner reads `coldlight.config.ts` for all paths and enforcement rules
5. **Schema-validated.** Zod validates all contracts at build time
