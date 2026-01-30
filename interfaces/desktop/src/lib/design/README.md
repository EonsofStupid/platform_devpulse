# ColdLight Design System

> **The design system for DevPulse.**

---

## Documentation

| Document | Purpose |
|----------|---------|
| [Design Book](./docs/DESIGN_BOOK.md) | **START HERE** - Canonical specification |
| [Laws](./docs/LAWS.md) | Frozen non-negotiable rules |
| [Terminology](./docs/TERMINOLOGY.md) | Canonical vocabulary |

---

## Architecture

`
CONFIG (config/coldlight/)
    |
    v
TAXONOMY (taxonomy/) <- ALL CONTRACTS LIVE HERE
    |
    +--- kinds/primitives/{kind}/contract.ts
    +--- api/adapter/{adapter}/contract.ts
    |
    v
PRIMITIVES (primitives/) <- Structure + State
    |
    v
BLOCKS (blocks/) <- ARIA APPLIED HERE
`

---

## Key Principles

1. **Taxonomy is truth** - All contracts in taxonomy/
2. **One contract per kind** - No duplicates, no scattered declarations
3. **ARIA at block level** - Primitives have no ARIA baked in
4. **dsAdapter abstraction** - MeltUI hidden behind import cloak

---

## Folders

| Folder | Purpose |
|--------|---------|
| config/ | Configuration (adapters, roots, enforcement) |
| taxonomy/ | SSOT contracts, scanner, registry |
| primitives/ | ColdLight components (structure + state) |
| api/adapters/ | dsAdapter implementations |
| blocks/ | Accessible units (ARIA applied here) |
| semantics/ | Primitives + recipes |
| tokens/ | Design tokens |
| recipes/ | Appearance system |
| patterns/ | Documentation guidance |
| docs/ | Design Book and reference docs |

---

## Quick Start

1. Read the [Design Book](./docs/DESIGN_BOOK.md)
2. Understand the [Contract System](./CONTRACT_SYSTEM.md)
3. Check existing [Primitives](./primitives/README.md)
4. See how [Blocks](./blocks/README.md) apply ARIA

---

**ColdLight is the public API. Users never see adapters.**