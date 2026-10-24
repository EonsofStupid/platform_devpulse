# DevPULSE Desktop — Enterprise Foundation Spec

> **Status**: LOCKED
> **Scope**: `platform_devpulse/interfaces/desktop`
> **Stack**: SvelteKit 5 + Svelte 5 (runes) + Tauri 2.0

---

## 1. Core Rules

### 1.1 Source of Truth

| Layer | Location | Role |
|-------|----------|------|
| Routes | `src/routes/**` | Filesystem truth |
| Domains | `src/lib/domains/**` | Feature truth |
| Policy | `scripts/docs/policy/**` | Enforcement truth |
| Generated | `src/lib/sys/generated/**` | Build output |

### 1.2 Thin Routes

Routes are **adapters only**:

- `+page.svelte` renders a domain page component
- `+page.ts` / `+layout.ts` are load/action adapters to services
- **No feature logic in `src/routes/**`**

### 1.3 Typed Routes are Mandatory

Typed route helpers are generated and required for all navigation/redirects.
Raw string routing is forbidden outside allowlisted generator/inventory scripts.

### 1.4 Runes-first State

- Shared state lives in `*.svelte.ts` modules under `domains/**/state/**`
- Streams/subscription interop lives only under `sys/streams/**`

### 1.5 Enforcement is Real

Everything must be enforceable by:

1. **Lefthook** — developer gate
2. **Preflight checks** — AST + structure + policy
3. **CI** — deterministic verify

---

## 2. Canonical Folder Layout

### 2.1 Routes (Thin Adapter Layer)

```
src/routes/
  +layout.svelte

  (app)/
    +layout.svelte
    devpulse/
      +page.svelte
      +page.ts
    ui-demo/
      +page.svelte
    overmind/
      +page.svelte

  (marketing)/
    +layout.svelte
    +page.svelte
```

**Rules**:
- Route groups define shell boundaries
- `+page.svelte` must remain wiring-only

### 2.2 Domains (Hypermodular Domain Layer)

```
src/lib/domains/
  app/
    devpulse/
      index.ts                          # Public API surface
      pages/
        DevpulseDashboard.page.svelte
      features/
        dashboard/overview/
        profile/
        settings/
        stats/
      state/
        devpulse.state.svelte.ts
      services/
      contracts/
      utils/

    ui-demo/
    overmind/

  shared/
```

**Domain Contract Rules**:
- Every domain has `index.ts` as the public API surface
- Routes import only from:
  - `$lib/domains/**/index.ts`
  - `$lib/domains/**/pages/**` (if explicitly allowed)

### 2.3 System Layer (Platform Backbone)

```
src/lib/sys/
  contracts/
    routes.contract.ts
    state.contract.ts
    registry.contract.ts
    streams.contract.ts

  registries/
    routes.registry.ts
    state.registry.ts
    streams.registry.ts

  generated/
    ROUTES.ts                    # Typed route helpers
    routes.inventory.json        # Deterministic nav index

  streams/
    *.ts                         # Subscription/interop (rare)

  adapters/
    *.ts                         # External integration boundary
```

**Terminology (Locked)**:

| Folder | Purpose |
|--------|---------|
| `contracts/` | Type shapes, rules, invariants |
| `registries/` | Runtime lookup/index |
| `generated/` | Machine outputs, never hand-edited |
| `streams/` | Subscription boundary (rare) |

---

## 3. Typed Routes Spec

### 3.1 Generator Output Location

```
src/lib/sys/generated/ROUTES.ts
```

### 3.2 Required Usage

```typescript
import { route } from '$lib/sys/generated/ROUTES';

// Links
<a href={route('/devpulse')}>Home</a>

// With params
<a href={route('/ui-demo/[component]', { component: 'button' })}>Button</a>

// Redirects
throw redirect(302, route('/auth/login'));
```

### 3.3 Raw Route Strings Policy

**Forbidden everywhere** except:
- Route generator
- Route scanning / inventory generator
- Allowlisted internal tooling scripts

---

## 4. State + Streams Policy

### 4.1 Default: Rune State

All normal state goes under:

```
domains/**/state/**/*.svelte.ts
```

### 4.2 Route Adapters Never Own State

`+page.ts` / `+layout.ts` may:
- Call services
- Validate
- Return data

They may **not** store app state.

### 4.3 Streams Boundary

Subscription contracts, observers, and long-lived async pipelines go here:

```
src/lib/sys/streams/**
```

This boundary is explicit so enforcement is simple and permanent.

---

## 5. Sidebar / Navigation Spec

**No hardcoded nav lists.**

Navigation must derive from routing truth. Two valid patterns:

1. **Direct**: From generated typed routes (if tool exposes enough structure)
2. **Inventory**: Generate deterministic file:
   ```
   src/lib/sys/generated/routes.inventory.json
   ```
   Sidebar reads only that.

---

## 6. Naming Conventions

| Type | Pattern |
|------|---------|
| Domain pages | `*.page.svelte` |
| Rune state modules | `*.state.svelte.ts` |
| Services | `*.svc.ts` |
| Contracts | `*.contract.ts` |
| Registries | `*.registry.ts` |

---

## 7. Enforcement System

### 7.1 Structure

```
scripts/docs/
  README.md

  policy/
    cowlevel.policy.json           # Requirements matrix
    enforcement.tiers.json         # Tier behaviors
    doc-coverage.gates.json        # Drift gates
    schemas/
      cowlevel.schema.json
      manifest.schema.json
    checklists/
      ai.checklist.yaml            # AI checklist pipeline

  preflight/
    engine/
      preflight.ts
      report.ts
      registry.ts
    checks/
      check.thin-routes.ts
      check.domain-boundaries.ts
      check.typed-routes.ts
      check.state-vs-streams.ts
      check.naming.ts
    fixers/
      fix.inject-jsdoc.ts
      fix.seed-architecture.ts
      fix.seed-adr.ts
      fix.seed-diagrams.ts
      fix.domain-index.ts

  pipeline/
    scan.ts
    validate.ts
    extract/
      typedoc.ts
      api-extractor.ts
      diagrams.ts
    stage.ts
    lock.ts
    verify.ts

  templates/
    docs/
      architecture.md
      runbook.md
    adr/
      0001-initial.md
    diagrams/
      c4-context.mmd
      core-flow.mmd
```

**Key Directories**:
- `policy/` — the one truth
- `preflight/` — enforcement + fixing
- `pipeline/` — deterministic generation
- `templates/` — seed material

---

## 8. Lefthook Gates

On commit/push:

```bash
pnpm lint
pnpm docs:preflight:check
# optional: pnpm docs:verify
```

**Preflight hard-fails if**:
- Routes are not thin
- Route layer imports forbidden modules
- Domain API boundary is bypassed
- Raw string paths exist outside allowlist
- State/streams boundary is violated
- Naming contracts are violated

---

## 9. Commands

| Command | Purpose |
|---------|---------|
| `docs:scan` | Scan codebase |
| `docs:validate` | Validate against policy |
| `docs:preflight:check` | Run enforcement checks |
| `docs:preflight:fix` | Apply automated fixes |
| `docs:extract` | Extract API docs |
| `docs:stage` | Stage documentation |
| `docs:lock` | Lock current state |
| `docs:verify` | Verify determinism |
| `docs:check` | Full pipeline |

---

## Summary

| Principle | Implementation |
|-----------|----------------|
| Thin SvelteKit routes | `+page.svelte` = adapter only |
| Domain-driven hypermodular | `$lib/domains/**/index.ts` boundary |
| Typed routes mandatory | `$lib/sys/generated/ROUTES.ts` |
| Runes-first state | `*.state.svelte.ts` modules |
| Dedicated streams boundary | `sys/streams/**` |
| Clean global layer | `contracts/registries/generated` |
| Policy-driven enforcement | `scripts/docs/policy/**` |
| Real enforcement | Preflight + Lefthook |
