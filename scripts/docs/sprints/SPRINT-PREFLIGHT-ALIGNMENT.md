# SPRINT: Preflight Check Alignment

**Date**: 2026-03-28
**Status**: DRAFT — Owner approval required
**Depends on**: SPRINT-SYSTEM-ALIGNMENT (Phase 1 primitives)

---

## Context

6 preflight checks run on every commit via `docs-preflight` lefthook hook.
3 are correct. 3 enforce stale architecture. 2 more exist on disk but aren't registered.
This sprint aligns all checks to current Macro Law architecture.

## Current State (verified on disk)

### Running checks (imported in preflight.ts)

| Check | Status | What it enforces |
|-------|--------|-----------------|
| `domain-boundaries` | **CORRECT** | Routes import from domain index.ts, not internals |
| `no-style-primitives` | **CORRECT** | No `<style>` in primitive .svelte files |
| `aria-primitives` | **CORRECT** | Semantic HTML or ARIA in primitive .svelte |
| `primitive-structure` | **STALE** | Requires `.svelte` in ALL primitives — wrong for contracts |
| `naming-conventions` | **STALE** | References `domains/*/pages/` (banned pattern) |
| `typed-routes` | **DEFERRED** | Route helper `$lib/sys/generated/ROUTES.ts` doesn't exist |

### Not running (files exist, not imported)

| Check | Status | What it enforces |
|-------|--------|-----------------|
| `component-structure` | **STALE** | Requires `schema.ts`, `context.ts` (deleted) |
| `taxonomy-alignment` | **PHANTOM** | References `taxonomy/kinds/primitives/` (deleted) |

### Policy file

`scripts/docs/policy/cowlevel.policy.json` — defines tiers, scope, enforcement level.
Also stale: references naming patterns for deleted architecture.

---

## Fix 1: `primitive-structure` → Update for contract model

**File**: `scripts/docs/preflight/checks/check.primitive-structure.ts`

**Current** (line 6): `const REQUIRED_FILES = ['types.ts', 'index.ts'];`
**Current** (line 53): requires `.svelte` file in every primitive folder

**Problem**: Contract primitives (container, field, feedback, indicator, avatar)
won't have `.svelte` files. They have `anatomy.ts` + `types.ts` + `index.ts`.
Layout primitives (stack, row, separator) DO have `.svelte`.

**Fix**:
```typescript
const REQUIRED_FILES = ['types.ts', 'index.ts'];
const LAYOUT_PRIMITIVES = ['stack', 'row', 'separator', 'dot', 'icon-slot',
  'surface', 'text', 'heading', 'label'];

// .svelte required ONLY for layout primitives
// anatomy.ts required for contract primitives (when they exist)
```

**Updated check logic**:
1. Every primitive folder: must have `types.ts` + `index.ts` (unchanged)
2. Layout primitive folders: must also have `.svelte` file
3. All other primitive folders: `.svelte` is optional
4. If folder has neither `.svelte` nor `anatomy.ts` → warning (incomplete primitive)

### DECIDED: anatomy.ts REQUIRED for ALL primitives. No exceptions.

---

## Fix 2: `naming-conventions` → Remove deleted patterns

**File**: `scripts/docs/preflight/checks/check.naming.ts`

**Problem**: References `domains/*/pages/` (line 27) — this pattern is banned.
Domains are pure logic, no .svelte rendering files.

**Fix**: Remove the `pages` naming rule entirely. Update remaining rules:

```typescript
const NAMING_RULES: NamingRule[] = [
  {
    // Rune state files in domains
    location: /\/domains\/.*\/runes\//,
    patterns: [{
      expected: /\.svelte\.ts$/,
      actual: /\.ts$/,
      description: 'Rune state module',
      suggestion: 'Rune files must end with .svelte.ts for Svelte 5 runes',
    }],
  },
  {
    // Service files
    location: /\/domains\/.*\/services\//,
    patterns: [{
      expected: /\.service\.ts$/,
      actual: /\.ts$/,
      description: 'Service module',
      suggestion: 'Rename to *.service.ts',
    }],
  },
  {
    // Type files in domains
    location: /\/domains\/.*\/types\//,
    patterns: [{
      expected: /\.types\.ts$/,
      actual: /\.ts$/,
      description: 'Type definition',
      suggestion: 'Rename to *.types.ts',
    }],
  },
];
```

**Also update policy** (`cowlevel.policy.json`):
- Remove `"services": "*.svc.ts"` → replace with `"services": "*.service.ts"`
- Remove `"contracts": "*.contract.ts"` — contracts are not a current pattern
- Remove `"registries": "*.registry.ts"` — registries are not a current pattern

### DECIDED: Standardize on `.state.svelte.ts`, `.service.ts`, `.types.ts`

Rename existing `devpulse.runes.svelte.ts` → `devpulse.state.svelte.ts`.
"State" is universal. "Runes" leaks framework internals.

---

## Fix 3: `typed-routes` → Defer or implement route helper

**File**: `scripts/docs/preflight/checks/check.typed-routes.ts`

**Problem**: Checks for `route()` helper from `$lib/sys/generated/ROUTES.ts` — file doesn't exist.
Currently passes because allowlist exempts most files and no violations are found.

**Options**:
A) **Defer** — Remove from running checks until route helper is authored. Add to sprint backlog.
B) **Implement route helper** — Author `$lib/sys/generated/ROUTES.ts` with typed route map.
   Then enable the check. This is a separate sprint.
C) **Simplify** — Change check to just verify routes use `$lib/sys/routing/` imports
   instead of raw strings. Less strict but immediately useful.

### DECIDED: Merge into component-structure. Typed route codegen is a separate 50-line script, not a dependency. No Prisma.

---

## Fix 4: `component-structure` → Rewrite for Macro Law (MERGED: includes typed-routes + taxonomy checks)

**File**: `scripts/docs/preflight/checks/check.component-structure.ts`

**Not currently running** — not imported in `preflight.ts`.

**Current** (line 6): `const REQUIRED_FILES = ['schema.ts', 'context.ts', 'types.ts', 'index.ts'];`

`schema.ts` and `context.ts` are deleted architecture. Current component pattern:

```
components/{kind}/
  {Kind}.svelte       # The component — imports behaviors + style-macro
  types.ts            # Props interface
  index.ts            # Public exports
```

**Fix**: Rewrite required files and add Macro Law checks:

```typescript
const REQUIRED_FILES = ['types.ts', 'index.ts'];

// Additional Macro Law checks per .svelte file:
// 1. Imports resolveMacro from style-macro
// 2. Has data-kind attribute (via m.dataAttrs or direct)
// 3. Uses preset prop, NOT intent prop
// 4. No wrapper div around semantic root
```

**Then import in preflight.ts** to enable it.

### DECIDED: Enable now as ERROR. Error messages must be positive and instructive —
tell AI/vibers exactly what to do. ColdLight teaches, not just blocks.

Example error message format:
```
[ColdLight] components/card/Card.svelte
  Missing: resolveMacro import from style-macro
  Fix: Add `import { resolveMacro, cssVarString } from "$lib/design/style-macro";`
  Then: `const m = $derived(resolveMacro({ kind: "card", preset }));`
  Docs: MACRO-LAW.md Law 1 — One public styling path
```

---

## Fix 5: `taxonomy-alignment` → Rewrite or delete

**File**: `scripts/docs/preflight/checks/check.taxonomy-alignment.ts`

**Not currently running** — not imported in `preflight.ts`.

**Current**: Checks that every primitive imports from `taxonomy/kinds/primitives/{name}/contract`.
`taxonomy/` was DELETED. This entire check is phantom.

**Options**:
A) **Rewrite** — Check that components import from `behaviors/{kind}/` and/or
   `primitives/{kind}/` anatomy contracts. Enforces the actual architecture.
B) **Delete** — The `coldlight-verify` script already checks for style-macro imports.
   Avoid duplicate enforcement.
C) **Merge into component-structure** — Add anatomy/behavior import checks to Fix 4
   instead of having a separate check.

### DECIDED: Merge into component-structure (Fix 4). Delete this file.

---

## Fix 6: Update policy file

**File**: `scripts/docs/policy/cowlevel.policy.json`

Update to match current architecture:

```json
{
  "rules": {
    "primitive-structure": {
      "description": "Every primitive folder must have types.ts, index.ts. Layout primitives must have .svelte.",
      "requiredFiles": ["types.ts", "index.ts"],
      "layoutPrimitives": ["stack", "row", "separator", "dot", "icon-slot",
        "surface", "text", "heading", "label"]
    },
    "naming-conventions": {
      "patterns": {
        "runes": "*.svelte.ts",
        "services": "*.service.ts",
        "types": "*.types.ts"
      }
    }
  }
}
```

Remove references to `schema.ts`, `context.ts`, `contracts`, `registries`, `*.svc.ts`.

---

## Execution Order

```
1. Fix primitive-structure check (after owner answers STOP 1)
2. Fix naming-conventions check (after owner answers STOP 2)
3. Fix typed-routes — defer or simplify (after owner answers STOP 3)
4. Fix component-structure check (after owner answers STOP 4)
5. Fix taxonomy-alignment — rewrite or delete (after owner answers STOP 5)
6. Update cowlevel.policy.json
7. Run preflight → verify all pass
8. svelte-check → verify compile clean
```

---

## Rules

- No shortcuts — each check must enforce REAL architecture, not silence errors
- Every check must have clear error messages with actionable suggestions
- Checks reference MACRO-LAW.md as authority
- No phantom architecture references
- test after each fix
