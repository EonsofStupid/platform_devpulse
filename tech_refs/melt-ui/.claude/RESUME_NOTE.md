# RESUME NOTE — Claude Session State

> **Paused:** 2026-01-23
> **Resume from:** Sprint 0.1 — taxonomy/provider/types.ts

---

## COMPLETED

1. `.claude/CLAUDE.md` — Full 31 builder mapping to ColdLight
2. `.claude/_INTERNAL_SPRINT_PLAN.md` — Complete sprint plan for _internal/melt/
3. `taxonomy/provider/` folder created (empty)

---

## IN PROGRESS

**Sprint 0.1: taxonomy/provider/types.ts**
- File creation was interrupted mid-write
- Need to recreate this file with ProviderContract types

---

## REMAINING SPRINTS

### Sprint 0: Provider Port Contract
- [ ] `taxonomy/provider/types.ts` — ProviderContract, BuilderCapabilities, etc.
- [ ] `taxonomy/provider/melt.ts` — Melt UI implementation
- [ ] `taxonomy/provider/index.ts` — Barrel export

### Sprint 1: _internal/melt/ Binding Layer
- [ ] `design/api/adapters/meltui/types.ts` — All 31 builder type aliases
- [ ] `design/api/adapters/meltui/state.ts` — State extraction helpers
- [ ] `design/api/adapters/meltui/schemas.ts` — Zod validation schemas
- [ ] `design/api/adapters/meltui/index.ts` — Barrel export
- [ ] `sys/api/_internal/index.ts` — Top-level barrel

### Sprint 2: Update README
- [ ] Update `sys/api/_internal/README.md`

---

## KEY CONTEXT

- **31 Melt UI builders** mapped 1:1 to ColdLight primitives
- **Provider port contract** allows swapping Melt for Ark UI, etc.
- **Binding layer** at `design/api/adapters/meltui/` provides:
  - Type aliases for all builder returns
  - State extraction helpers (data-state values)
  - Zod schemas for prop validation
- **tech_refs/melt-ui/** has all builder documentation in `builders/` folder

---

## REFERENCE FILES

- Sprint plan: `tech_refs/melt-ui/.claude/_INTERNAL_SPRINT_PLAN.md`
- Builder mapping: `tech_refs/melt-ui/.claude/CLAUDE.md`
- Builder index: `tech_refs/melt-ui/BUILDER_INDEX.md`
- Checklist: `primitives/CHECKLIST.md`

---

## NEXT ACTION

1. Create `taxonomy/provider/types.ts` (full content in sprint plan)
2. Create `taxonomy/provider/melt.ts`
3. Create `taxonomy/provider/index.ts`
4. Proceed to Sprint 1

---

**User was emphatic: Map ALL 31 builders 1:1. No shortcuts. No drift.**
