# Claude Instructions for ColdLight

> **Read this first when working on ColdLight.**

---

## The One Rule

**Taxonomy is truth. Everything else is execution.**

---

## Contract Chain

`
taxonomy/kinds/primitives/{kind}/contract.ts   <- SSOT
           |
     +-----+-----+
     |           |
     v           v
primitives/     api/adapters/{dsAdapter}/
{kind}/         _internal/{kind}/
`

- Config declares dsAdapter
- Contract declares ariaStateProvider
- Folder name = kind name = binding
- No separate adapter-kind contracts

---

## ARIA Application

**ARIA is NOT baked into primitives.**
**ARIA IS OWNED BY COLD LIGHT, .**

Primitives provide:
- data-kind
- data-slot
- data-state
- Structure
- State coordination

Primitives do NOT provide:
- ARIA attributes
- role attribute
- Keyboard handlers
- Focus management

Blocks apply ARIA via dsAdapter when they render.

---

## When Adding a Primitive

1. Create contract: `taxonomy/kinds/primitives/{kind}/contract.ts`
2. Create primitive: `primitives/{kind}/`
3. If ariaStateProvider = meltui:
   - Verify kind in `taxonomy/api/adapter/meltui/contract.ts`
   - Create `api/adapters/meltui/_internal/{kind}/factory.ts`
4. Run scanner to validate

---

## When Editing Contracts

Contracts live ONLY in `taxonomy/`.

`primitives/{kind}/contract.ts` just re-exports the taxonomy contract.

Never create duplicate contracts.

---

## Files to Read First

1. `docs/DESIGN_BOOK.md` - Canonical spec
2. `taxonomy/README.md` - Contract model
3. `.claude/ARCHITECTURE.md` - Full architecture
4. `.claude/ADAPTER_ARCHITECTURE.md` - dsAdapter model

---

**Follow the contract chain. Taxonomy is truth.**