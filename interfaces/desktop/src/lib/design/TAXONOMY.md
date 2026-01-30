# Taxonomy

> **Taxonomy is truth. Everything else is execution.**

See `taxonomy/README.md` for full documentation.

---

## Quick Reference

### Contract Location

All contracts live in taxonomy:

`
taxonomy/kinds/primitives/{kind}/contract.ts   <- Primitive contracts
taxonomy/api/adapter/{adapter}/contract.ts     <- Adapter-wide inventory
`

### Contract Binding

Contracts bind to implementation via folder naming:

`
taxonomy/kinds/primitives/tabs/   ->   primitives/tabs/
taxonomy/kinds/primitives/tabs/   ->   api/adapters/meltui/_internal/tabs/
                                       (if ariaStateProvider: meltui)
`

### Scanner

`taxonomy/scanner.ts` validates the contract chain at build time.

### Registry

`taxonomy/registry.ts` provides runtime lookup from generated manifest.

---

**For full documentation, see taxonomy/README.md**