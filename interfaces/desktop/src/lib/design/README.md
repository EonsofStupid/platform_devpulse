# ColdLight Design System

> **The design system for DevPulse.**

---

## Documentation

| Document | Purpose |
|----------|---------|
| [COLDLIGHT.md](./COLDLIGHT.md) | **START HERE** - Canonical specification |
| [TOKEN_PIPELINE.md](./TOKEN_PIPELINE.md) | Token generation pipeline |
| [docs/tokens.md](./docs/tokens.md) | Token reference (all values) |

---

## Architecture

```
TOKENS (tokens/)
    tokens.ts (SSOT) --> ds-tokens-build.ts --> tokens.css, types.ts, tailwind.preset.ts
    |
    v
TAXONOMY (taxonomy/) <-- ALL CONTRACTS LIVE HERE
    |
    +--- primitiveKinds.ts, primitiveRegistry.ts
    +--- contracts.ts, slots.ts
    |
    v
PRIMITIVES (primitives/) <-- Two archetypes:
    |                         A: ColdLight-owned (structural, native ARIA)
    |                         B: Adapter-backed (MeltUI via transport chain)
    v
RECIPES (recipes/) <-- Appearance via data attributes
    |
    v
SEMANTICS (semantics/) <-- Primitives + Recipes
    |
    v
BLOCKS (blocks/) <-- Page sections
```

---

## Key Principles

1. **Taxonomy is truth** - All contracts in taxonomy/
2. **One contract per kind** - No duplicates, no scattered declarations
3. **Two archetypes** - ColdLight-owned (native ARIA) or adapter-backed (MeltUI)
4. **Token prefix: NONE** - All CSS custom properties are unprefixed

---

## Folders

| Folder | Purpose |
|--------|---------|
| tokens/ | Design tokens (SSOT + generated outputs) |
| taxonomy/ | SSOT contracts, scanner, registry |
| primitives/ | Structural + behavioral components |
| recipes/ | Appearance system (data-attribute driven) |
| semantics/ | Primitives + recipes composed |
| blocks/ | Page-level compositions |
| docs/ | Reference documentation |

---

## Quick Start

1. Read [COLDLIGHT.md](./COLDLIGHT.md)
2. Check [Token Reference](./docs/tokens.md)
3. See existing [Primitives](./primitives/)
4. Understand the [Token Pipeline](./TOKEN_PIPELINE.md)

---

**ColdLight is the public API. Users never see adapters.**
