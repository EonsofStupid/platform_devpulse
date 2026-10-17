# SPRINT: Contracts Foundation

> **Status**: IN PROGRESS
> **Started**: 2026-01-26
> **Goal**: Establish the artifact/contract system as platform SSOT

## Prerequisites
- [ ] Verify `pnpm svelte-check` passes before starting
- [ ] Verify current git status is clean or changes are stashed

---

## Phase 1: Common Contracts Layer

### Task 1.1: Create artifact.ts
- [ ] Create `sys/contracts/common/artifact.ts`
- [ ] Define `artifactKinds` as const array
- [ ] Define `ArtifactKind` union from array
- [ ] Define `hubIds` as const array
- [ ] Define `HubId` union from array
- [ ] Define `ArtifactId` template literal type
- [ ] Define `ArtifactEntry` readonly type
- [ ] Add helper functions (isArtifactKind, isHubId, parseArtifactId, createArtifactId)
- [ ] Run `pnpm svelte-check` - MUST PASS
- [ ] Commit: "feat(contracts): add artifact.ts foundation"

### Task 1.2: Create kinds.ts
- [ ] Create `sys/contracts/common/kinds.ts`
- [ ] Import PrimitiveKinds from taxonomy (re-export, don't duplicate)
- [ ] Define `blockKinds` as const array
- [ ] Define `recipeKinds` as const array
- [ ] Define `compositeKinds` as const array
- [ ] Define `patternKinds` as const array
- [ ] Run `pnpm svelte-check` - MUST PASS

### Task 1.3: Create slots.ts
- [ ] Create `sys/contracts/common/slots.ts`
- [ ] Import PrimitiveKind from kinds
- [ ] Define `primitiveSlots` with satisfies Record<PrimitiveKind, readonly string[]>
- [ ] Run `pnpm svelte-check` - MUST PASS

### Task 1.4: Create states.ts
- [ ] Create `sys/contracts/common/states.ts`
- [ ] Import PrimitiveKind from kinds
- [ ] Define `primitiveStates` with satisfies Record<PrimitiveKind, readonly string[]>
- [ ] Run `pnpm svelte-check` - MUST PASS

### Task 1.5: Create registry.ts
- [ ] Create `sys/contracts/common/registry.ts`
- [ ] Define `ArtifactRegistry` type
- [ ] Run `pnpm svelte-check` - MUST PASS

### Task 1.6: Create validate.ts
- [ ] Create `sys/contracts/common/validate.ts`
- [ ] Add dev-time validation helpers (unique IDs, correct hub format)
- [ ] Run `pnpm svelte-check` - MUST PASS

### Task 1.7: Create common/index.ts barrel
- [ ] Create `sys/contracts/common/index.ts`
- [ ] Export all from artifact, kinds, slots, states, registry, validate
- [ ] Run `pnpm svelte-check` - MUST PASS
- [ ] Commit: "feat(contracts): add common contracts layer"

---

## Phase 2: Hub Overlays

### Task 2.1: Create wiredfront overlay
- [ ] Create `sys/contracts/wiredfront/registry.ts`
- [ ] Create `sys/contracts/wiredfront/index.ts`
- [ ] Run `pnpm svelte-check` - MUST PASS

### Task 2.2: Create devpulse overlay
- [ ] Create `sys/contracts/devpulse/registry.ts`
- [ ] Create `sys/contracts/devpulse/index.ts`
- [ ] Run `pnpm svelte-check` - MUST PASS

### Task 2.3: Update contracts/index.ts
- [ ] Add resolveBlocks(hub) helper
- [ ] Add resolveArtifacts(hub, kind) helper
- [ ] Export common, wiredfront, devpulse
- [ ] Run `pnpm svelte-check` - MUST PASS
- [ ] Commit: "feat(contracts): add hub overlay system"

---

## Phase 3: Provider Folder Structure

### Task 3.1: Create provider/types.ts (shared)
- [ ] Create `taxonomy/provider/types.ts` with shared ProviderContract types
- [ ] Run `pnpm svelte-check` - MUST PASS

### Task 3.2: Create provider/index.ts barrel
- [ ] Create clean barrel that exports from types and provider folders
- [ ] Run `pnpm svelte-check` - MUST PASS

### Task 3.3: Fix meltui/ imports
- [ ] Update meltui/melt.ts to import from ../types.js
- [ ] Verify meltui/types.ts has BUILDER_MAP with strict typing
- [ ] Run `pnpm svelte-check` - MUST PASS

### Task 3.4: Create placeholder folders
- [ ] Create `taxonomy/provider/reactaria/index.ts`
- [ ] Create `taxonomy/provider/arkui/index.ts`
- [ ] Create `taxonomy/provider/skeleton/index.ts`
- [ ] Run `pnpm svelte-check` - MUST PASS
- [ ] Commit: "feat(taxonomy): restructure provider folder"

---

## Phase 4: Folder Checklists

### Task 4.1: Create .claude/CHECKLIST.md for each major folder
- [ ] sys/contracts/.claude/CHECKLIST.md
- [ ] sys/contracts/common/.claude/CHECKLIST.md
- [ ] design/tokens/.claude/CHECKLIST.md
- [ ] design/primitives/.claude/CHECKLIST.md
- [ ] design/recipes/.claude/CHECKLIST.md
- [ ] design/blocks/.claude/CHECKLIST.md
- [ ] design/patterns/.claude/CHECKLIST.md
- [ ] design/taxonomy/.claude/CHECKLIST.md
- [ ] design/taxonomy/provider/.claude/CHECKLIST.md
- [ ] Commit: "docs: add .claude checklists to all design folders"

---

## Final Verification

- [ ] Run `pnpm svelte-check` - MUST PASS
- [ ] Run `pnpm build` - MUST PASS
- [ ] All commits pushed
- [ ] Mark sprint COMPLETE

---

## Completion Log

| Task | Status | Date | Notes |
|------|--------|------|-------|
| 1.1 artifact.ts | IN PROGRESS | 2026-01-26 | File created, needs verification |
