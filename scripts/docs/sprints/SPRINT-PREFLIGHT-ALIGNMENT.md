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

### STOP — Owner Decision Required

**Question**: Should `anatomy.ts` be REQUIRED for all primitives, or only for contract
primitives that don't have `.svelte`?

**Options**:
A) Required for ALL primitives — consistent structure, every primitive declares its parts
B) Required only for primitives WITHOUT `.svelte` — layout primitives skip anatomy since they are the structure
C) Optional everywhere — anatomy is good practice but not enforced

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

### STOP — Owner Decision Required

**Question**: What naming conventions do you want enforced?

Current domain structure (from devpulse — the working example):
```
domains/app/devpulse/
  index.ts
  runes/devpulse.runes.svelte.ts    ← .runes.svelte.ts or .state.svelte.ts?
  services/devpulse.service.ts      ← .service.ts or .svc.ts?
  types/devpulse.types.ts           ← .types.ts
```

**Options**:
A) Match what exists: `.runes.svelte.ts`, `.service.ts`, `.types.ts`
B) Standardize: `.state.svelte.ts`, `.service.ts`, `.types.ts`
C) Owner defines naming convention

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

### STOP — Owner Decision Required

**Question**: Implement typed route helper now, defer, or simplify?

---

## Fix 4: `component-structure` → Rewrite for Macro Law

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

### STOP — Owner Decision Required

**Question**: Enable this check NOW (will report failures for 109 unaligned components)
or enable AFTER Phase 4 component alignment?

**Options**:
A) Enable now as WARNING — reports but doesn't block commits
B) Enable now as ERROR — blocks commits until all 109 are fixed (Phase 4 first)
C) Enable after Phase 4 — add to sprint backlog

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

### STOP — Owner Decision Required

**Question**: Rewrite as behavior/anatomy import check, delete, or merge?

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
