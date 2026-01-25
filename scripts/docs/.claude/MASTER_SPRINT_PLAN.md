# scripts/docs/ Enforcement System - Master Sprint Plan

> **Status**: ACTIVE
> **Scope**: `platform_devpulse/scripts/docs/`
> **Depends On**: FOUNDATION.md architecture being implemented

---

## Reality Check: Current State vs FOUNDATION.md

### What FOUNDATION.md Requires

| Component | Location | Status |
|-----------|----------|--------|
| Routes layer | `src/routes/**` | **MISSING** |
| Domain index.ts | `$lib/domains/**/index.ts` | **MISSING** |
| sys/contracts | `$lib/sys/contracts/` | **MISSING** |
| sys/registries | `$lib/sys/registries/` | **MISSING** |
| sys/generated | `$lib/sys/generated/` | **MISSING** |
| sys/streams | `$lib/sys/streams/` | **MISSING** |
| Typed routes generator | `ROUTES.ts` | **MISSING** |
| Enforcement system | `scripts/docs/` | **PARTIAL** |

### What Actually Exists (Audit: 2026-01-25)

**Domains** (4 namespaces):
- `app/` - devforge, devpulse, maestro, overmind, ui-demo, wiredfront
- `chat/` - interactions structure only
- `maestro/` - skeleton structure
- `notify/` - empty

**Domain Stats**:
- ~15 Svelte page/component files with actual content
- Most directories are empty scaffolding
- **ZERO index.ts public API files**
- Uses non-standard naming (`runes/` not `state/`, no `*.state.svelte.ts`)

**sys/**:
- `cfg/` - config files
- `debug/` - VPB builder
- `global/runes/` - global state (non-standard location)

---

## Problem Statement

The previous implementation built enforcement for an architecture that doesn't exist:
- Checking for thin routes when no routes exist
- Validating domain boundaries when no index.ts files exist
- Enforcing state location when state patterns don't match FOUNDATION.md

**This is backwards.** You cannot enforce architecture before it exists.

---

## Sprint Sequence

### SPRINT 0: Architecture Templates + Research
**Goal**: Create templates and research modern patterns before building
**Status**: COMPLETE

Tasks:
- [x] Research SvelteKit 5 route patterns (groups, layouts, load functions)
- [x] Research Svelte 5 runes state management patterns
- [x] Research typed route generation - **Decision: CUSTOM GENERATOR**
- [x] Lock decisions on routes.inventory.json structure (nested tree + hub-aware)
- [x] Lock decisions on search params (YES - full typing)
- [x] Lock decisions on form actions (YES - typed)
- [ ] Create route file templates (`+page.svelte`, `+page.ts`, `+layout.svelte`)
- [ ] Create domain index.ts template
- [ ] Create state module template (`*.state.svelte.ts`)

**Deliverables**:
- `scripts/docs/.claude/RESEARCH_DECISIONS.md` - DONE
- `scripts/docs/templates/` - PENDING

---

### SPRINT 1: Sys Layer Foundation
**Goal**: Build the platform backbone per FOUNDATION.md
**Status**: COMPLETE (2026-01-25)

Tasks:
- [x] Create `src/lib/sys/contracts/routes.contract.ts`
- [x] Create `src/lib/sys/contracts/state.contract.ts`
- [x] Create `src/lib/sys/contracts/registry.contract.ts`
- [x] Create `src/lib/sys/contracts/streams.contract.ts`
- [x] Create `src/lib/sys/registries/base.registry.ts`
- [x] Create `src/lib/sys/registries/routes.registry.ts`
- [x] Create `src/lib/sys/registries/state.registry.ts`
- [x] Create `src/lib/sys/registries/streams.registry.ts`
- [x] Create `src/lib/sys/generated/` directory structure
- [x] Create `src/lib/sys/streams/` directory structure
- [x] Create `src/lib/sys/adapters/` directory structure
- [x] Create `src/lib/sys/runes/global.svelte.ts` re-export

**Deliverables**:
- sys/ layer foundation exists (flat structure)
- Contracts define types for the entire system
- Registries provide runtime lookup
- All code compiles (verified with svelte-check)

---

### SPRINT 1B: URL-Driven Routing + Nested Capability Buckets
**Goal**: Reorganize sys/ with named capability buckets (NO /core/) + URL-driven routing
**Status**: READY FOR EXECUTION
**Sprint File**: `scripts/docs/sprints/SPRINT-01B-routing-foundation.md`
**Depends On**: Sprint 1 (complete)

**Critical Decisions (LOCKED):**
- URL-driven routing (SvelteKit native) - NO separate `current_domain` state
- NO `/core/` folders - named capability buckets only
- Domain contracts in `sys/contracts/domains/` (global platform knowledge)
- Each bucket has: manifest.ts, types.ts, contract.ts, index.ts

Tasks:
- [ ] Phase 1: Delete App.svelte domain switcher `{#if}` chain
- [ ] Phase 2: Create thin route wrappers `src/routes/(app)/<domain>/+page.svelte`
- [ ] Phase 3: Reorganize contracts into capability buckets (registry/, observable/, routing/, state/, streams/, domains/)
- [ ] Phase 4: Reorganize registries into capability buckets (registry/, routing/, state/, streams/)
- [ ] Phase 5: Create domain contracts with manifest pattern (devpulse, ui-demo, overmind, wiredfront, devforge, maestro)
- [ ] Phase 6: Update DomainRegistry for metadata-only (no pageModule loading)
- [ ] Phase 7: Verification (svelte-check, dev server, domain navigation)

**Deliverables**:
- URL-driven routing via SvelteKit filesystem routes
- Thin route wrappers (zero business logic)
- Nested capability bucket structure (NO /core/)
- Domain contracts with manifest + types + contract + index pattern
- DomainRegistry provides sidebar metadata only

---

### SPRINT 2: Typed Routes Generator
**Goal**: Implement typed route generation before creating routes
**Decision**: Custom generator (see RESEARCH_DECISIONS.md)

**Generator Structure:**
```
scripts/docs/generators/
  routes/
    index.ts              # Main entry, orchestrates generation
    scanner.ts            # Filesystem scanner using fast-glob
    parser.ts             # Parse route files for params/actions
    codegen.ts            # Generate ROUTES.ts
    inventory.ts          # Generate routes.inventory.json
    types.ts              # Shared types
    config.ts             # Search param definitions
```

**Tasks:**

Phase 1: Scanner
- [ ] Create `scanner.ts` - scan `src/routes/**` using fast-glob
- [ ] Extract route paths from filesystem structure
- [ ] Handle route groups `(app)`, `(marketing)`
- [ ] Handle dynamic params `[id]`, `[...rest]`
- [ ] Handle optional params `[[optional]]`

Phase 2: Parser
- [ ] Create `parser.ts` - parse `+page.server.ts` for form actions
- [ ] Extract action names (login, delete, send, etc.)
- [ ] Parse `+page.ts` for load function params
- [ ] Build route metadata structure

Phase 3: Config
- [ ] Create `config.ts` - define search params per route
- [ ] Support typed search params with defaults
- [ ] Example: `/devpulse/settings` → `{ tab: string, page: number }`

Phase 4: Codegen
- [ ] Create `codegen.ts` - generate `ROUTES.ts`
- [ ] Generate `route()` function with overloads
- [ ] Generate path params types
- [ ] Generate search params types
- [ ] Generate form action types
- [ ] Output: `src/lib/sys/generated/ROUTES.ts`

Phase 5: Inventory
- [ ] Create `inventory.ts` - generate `routes.inventory.json`
- [ ] Structure: nested tree + route groups + hub metadata
- [ ] Include labels, descriptions, icons for navigation
- [ ] Output: `src/lib/sys/generated/routes.inventory.json`

Phase 6: Integration
- [ ] Create `index.ts` - orchestrate all generators
- [ ] Create Vite plugin for dev watch mode
- [ ] Create npm script: `pnpm routes:generate`
- [ ] Add to lefthook pre-commit

**Output API:**
```typescript
// ROUTES.ts generated API
import { route } from '$lib/sys/generated/ROUTES';

// Path params
route('/devpulse')
route('/site/[id]', { id: 123 })
route('/ui-demo/[component]', { component: 'button' })

// Search params
route('/devpulse/settings', { tab: 'general', page: 1 })

// Form actions
route('login /auth', { returnTo: '/dashboard' })
route('delete /site/[id]', { id: 123 })
```

**Deliverables**:
- `scripts/docs/generators/routes/` - complete generator
- `src/lib/sys/generated/ROUTES.ts` - typed route helpers
- `src/lib/sys/generated/routes.inventory.json` - hub-aware nav structure
- Vite plugin for watch mode
- npm script for manual generation

---

### SPRINT 3: Routes Layer
**Goal**: Create thin route files per FOUNDATION.md section 2.1

Tasks:
- [ ] Create `src/routes/+layout.svelte` (root layout)
- [ ] Create `src/routes/(app)/+layout.svelte` (app shell)
- [ ] Create route files for devpulse: `(app)/devpulse/+page.svelte`, `+page.ts`
- [ ] Create route files for ui-demo: `(app)/ui-demo/+page.svelte`
- [ ] Create route files for overmind: `(app)/overmind/+page.svelte`
- [ ] Create route files for wiredfront: `(app)/wiredfront/+page.svelte`
- [ ] Create route files for devforge: `(app)/devforge/+page.svelte`
- [ ] Create `src/routes/(marketing)/+layout.svelte` if needed
- [ ] Verify all routes use typed route helpers (no raw strings)

**Deliverables**:
- Routes layer matches FOUNDATION.md section 2.1
- All `+page.svelte` files are adapter-only
- All navigation uses `route()` helper

---

### SPRINT 4: Domain Public APIs
**Goal**: Create index.ts public API surface for each domain

Tasks:
- [ ] Create `app/devpulse/index.ts` - export pages, state, services
- [ ] Create `app/devforge/index.ts`
- [ ] Create `app/overmind/index.ts`
- [ ] Create `app/ui-demo/index.ts`
- [ ] Create `app/wiredfront/index.ts`
- [ ] Create `app/maestro/index.ts`
- [ ] Create `chat/index.ts`
- [ ] Create `maestro/index.ts`
- [ ] Refactor existing imports to use index.ts boundary
- [ ] Rename `runes/` to `state/` where needed
- [ ] Rename state files to `*.state.svelte.ts` pattern

**Deliverables**:
- Every domain has `index.ts` as public API
- Domain internals hidden behind index.ts
- Naming follows FOUNDATION.md conventions

---

### SPRINT 5: Enforcement System - Checks
**Goal**: Build preflight checks that validate the architecture
**Prerequisites**: Sprints 1-4 complete (architecture exists to enforce)

**ts-morph Best Practices (from research):**
1. Share single Project instance across all checks
2. Analyze first, manipulate second
3. Use forEachDescendant with traversal control (.skip(), .stop())
4. Forget nodes when done to manage memory
5. Batch file loading

**Shared Infrastructure:**
```typescript
// preflight/engine/ast-context.ts
export class ASTContext {
  private project: Project;

  constructor(platformRoot: string) {
    this.project = new Project({
      tsConfigFilePath: path.join(platformRoot, 'interfaces/desktop/src/tsconfig.json'),
      skipAddingFilesFromTsConfig: true
    });
  }

  addFiles(patterns: string[]): void { /* batch add */ }
  getSourceFile(path: string): SourceFile | undefined { /* cached lookup */ }
  dispose(): void { /* cleanup */ }
}
```

**Tasks:**

Phase 1: Shared Infrastructure
- [ ] Create `ast-context.ts` - shared ts-morph Project
- [ ] Create `svelte-parser.ts` - extract script from .svelte files
- [ ] Update registry to pass ASTContext to checks

Phase 2: Refactor Checks
- [ ] `check.thin-routes.ts`
  - Use AST to detect forbidden patterns (useState, createStore, writable)
  - Check only script content in Svelte files
  - Skip template/style sections

- [ ] `check.domain-boundaries.ts`
  - Use getImportDeclarations() (efficient)
  - Validate against allowed import patterns
  - Proper error messages with import path

- [ ] `check.typed-routes.ts`
  - Regex OK for Svelte templates (href="...")
  - AST for JS/TS: detect goto(), redirect() calls
  - Verify they use route() helper

- [ ] `check.state-vs-streams.ts`
  - AST to find $state, $derived, $effect usage
  - Verify location matches domains/**/state/*.state.svelte.ts
  - Detect Observable/Subject outside sys/streams/

- [ ] `check.naming.ts`
  - Pure filesystem check (no AST needed)
  - Validate *.page.svelte, *.state.svelte.ts, *.svc.ts, etc.

Phase 3: Testing
- [ ] Create test fixtures (valid/invalid files)
- [ ] Test each check against fixtures
- [ ] Verify error messages are actionable

**Deliverables**:
- Shared ASTContext for performance
- All 5 checks using proper AST patterns
- Test coverage for each check

---

### SPRINT 6: Enforcement System - Engine + Fixers
**Goal**: Build preflight engine and automated fixers

Tasks:
- [ ] Audit preflight.ts for senior patterns
- [ ] Refactor registry.ts for proper dependency injection
- [ ] Refactor report.ts for clean output formatting
- [ ] Implement `fix.domain-index.ts` - generate missing index.ts
- [ ] Implement `fix.inject-jsdoc.ts` - inject missing JSDoc
- [ ] Implement fixer preview/diff system
- [ ] Implement dry-run → apply workflow
- [ ] Test fixers against actual violations

**Deliverables**:
- Clean preflight engine
- Working fixers with preview capability
- Dry-run state management

---

### SPRINT 7: Pipeline
**Goal**: Build documentation pipeline

Tasks:
- [ ] Implement `pipeline/scan.ts` - codebase scanner
- [ ] Implement `pipeline/validate.ts` - policy validation
- [ ] Implement `pipeline/extract/typedoc.ts` - API extraction
- [ ] Implement `pipeline/extract/diagrams.ts` - mermaid generation
- [ ] Implement `pipeline/stage.ts` - documentation staging
- [ ] Implement `pipeline/lock.ts` - state locking
- [ ] Implement `pipeline/verify.ts` - determinism verification

**Deliverables**:
- Full pipeline from scan to verify
- Deterministic documentation generation

---

### SPRINT 8: Integration
**Goal**: Wire everything into dev workflow

Tasks:
- [ ] Add all `docs:*` scripts to root package.json
- [ ] Configure lefthook pre-commit hooks
- [ ] Configure CI pipeline
- [ ] Update FOUNDATION.md if needed
- [ ] Create `scripts/docs/README.md` with usage docs

**Deliverables**:
- Enforcement runs on every commit
- CI validates on every PR
- Documentation stays in sync

---

## Execution Rules

1. **No sprint starts without prerequisite sprints complete**
2. **Each task must be cross-checked against FOUNDATION.md**
3. **Research first, implement second** (Sprint 0 is mandatory)
4. **No regex hacks** - use proper AST analysis
5. **Test against real files** - not hypotheticals
6. **Update this document** as tasks complete

---

## Locked Decisions (from RESEARCH_DECISIONS.md)

### URL-Driven Routing (CRITICAL)
- **Approach**: SvelteKit native - URL IS the state
- **NO**: Separate `current_domain` variable, App.svelte `{#if}` chains
- **YES**: `src/routes/(app)/<domain>/+page.svelte` thin wrappers
- **DomainRegistry**: Metadata only (sidebar, ordering, icons) - NO page loading

### Nested Capability Buckets (NO /core/)
- **Pattern**: Named capability folders, no dumping zones
- **Capabilities**: registry/, observable/, routing/, state/, streams/, domains/
- **Each bucket**: manifest.ts + types.ts + contract.ts + index.ts
- **Domain contracts**: In `sys/contracts/domains/` (global platform knowledge)

### Manifest vs Registry
- **Manifest**: Static, machine-readable, feeds generation/enforcement
- **Registry**: Runtime view, built at startup, queried by UI
- **Rule**: Manifest defines truth, registry is a view

### Typed Routes
- **Approach**: Custom generator (not vite-plugin-kit-routes)
- **Rationale**: Full control, exact output location, generates inventory.json

### routes.inventory.json
- **Structure**: Nested tree + route groups + hub metadata
- **Purpose**: Overlay modal navigation UI
- **Hubs**: Category groupings (e.g., wiredfront = media hub)

### Search Params
- **Support**: YES - full typed search params with defaults
- **Example**: `route('/settings', { tab: 'general', page: 1 })`

### Form Actions
- **Support**: YES - typed form action references
- **Example**: `route('login /auth', { returnTo: '/dashboard' })`

### AST Analysis
- **Library**: ts-morph
- **Pattern**: Shared Project instance, traversal control, memory management

---

## Completion Criteria

System is complete when:

1. `pnpm docs:preflight:check` passes on clean codebase
2. Intentional violation is detected and reported
3. `pnpm docs:preflight:fix` can fix the violation
4. `pnpm docs:verify` confirms determinism
5. Lefthook blocks commits with violations
6. CI blocks PRs with violations
