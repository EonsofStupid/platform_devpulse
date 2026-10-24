# Research Decisions: Typed Routes + AST Analysis

> **Status**: LOCKED
> **Date**: 2026-01-25

---

## 1. Typed Routes Generator

### Options Evaluated

| Option | Pros | Cons |
|--------|------|------|
| **vite-plugin-kit-routes** | Production-ready, auto-watches, zero config, handles params/actions | Will be deprecated when SvelteKit native, generates what IT wants |
| **@dabrowskif/typed-routes** | CLI-based, framework-agnostic | Less popular, manual generation |
| **Custom Generator** | Full control, exact FOUNDATION.md API, can generate inventory.json | More work to build/maintain |
| **Native SvelteKit** | None yet | Generates `$types.d.ts` per route, no central `route()` helper |

### vite-plugin-kit-routes Details

From [KitQL docs](https://kitql.dev/docs/tools/06_vite-plugin-kit-routes/):

```typescript
// Generated API
import { route } from '$lib/ROUTES'

route('/terms-and-conditions')
route('/site/[id]', { id: 123 })
route('send /site/[id]', { id })  // form actions
```

**Features:**
- Auto-generates `./src/lib/ROUTES.ts` on dev start
- Regenerates on `+page.svelte`, `+server.ts`, `+page.server.ts` changes
- TypeScript only (matches our stack)
- Handles search params via explicit config
- CLI validation: `npm exec kit-routes sync`

**Limitation:** Will be deprecated when SvelteKit ships native support.

### FOUNDATION.md Requirements

```typescript
// Required API (from spec)
import { route } from '$lib/sys/generated/ROUTES';

route('/devpulse')
route('/ui-demo/[component]', { component: 'button' })
throw redirect(302, route('/auth/login'));
```

Also need: `routes.inventory.json` for sidebar navigation.

### Recommendation: Custom Generator

**Rationale:**
1. FOUNDATION.md specifies output at `$lib/sys/generated/ROUTES.ts` not `$lib/ROUTES.ts`
2. We need `routes.inventory.json` which vite-plugin-kit-routes doesn't generate
3. Full control over deterministic output for CI verification
4. vite-plugin-kit-routes will be deprecated anyway
5. Custom is not complex - it's a filesystem scan + codegen

**Implementation approach:**
```
scripts/docs/generators/
  routes.generator.ts      # Main generator
  routes.scanner.ts        # Filesystem scanner using fast-glob
  routes.codegen.ts        # ROUTES.ts code generation
  routes.inventory.ts      # routes.inventory.json generation
```

**Generator outputs:**
1. `src/lib/sys/generated/ROUTES.ts` - typed route helper
2. `src/lib/sys/generated/routes.inventory.json` - nav structure

**Integration:**
- Vite plugin for dev watch mode
- npm script for CI/manual runs
- Lefthook pre-commit validation

---

## 2. ts-morph AST Analysis Patterns

### Best Practices (from [ts-morph docs](https://ts-morph.com/))

**1. Analyze First, Manipulate Second**
```typescript
// BAD: interleaved analysis + manipulation
for (const file of files) {
  const classes = file.getClasses();
  classes.forEach(c => c.rename('NewName')); // triggers reparse
}

// GOOD: collect then modify
const toRename: ClassDeclaration[] = [];
for (const file of files) {
  toRename.push(...file.getClasses());
}
toRename.forEach(c => c.rename('NewName'));
```

**2. Use Traversal Control**
```typescript
sourceFile.forEachDescendant((node, traversal) => {
  if (isTargetNode(node)) {
    process(node);
    traversal.skip(); // skip descendants
  }
  if (foundEnough) {
    traversal.stop(); // stop entirely
  }
});
```

**3. Memory Management**
```typescript
// Forget nodes when done
node.forget();

// Or use block-based cleanup
project.forgetNodesCreatedInBlock(remember => {
  const newClass = sourceFile.addClass({ name: 'Temp' });
  remember(newClass); // keep this one
  // others auto-forgotten
});
```

**4. Batch Operations**
```typescript
// BAD: multiple parses
sourceFile.addClass({ name: 'A' });
sourceFile.addClass({ name: 'B' });

// GOOD: single parse
sourceFile.addClasses([
  { name: 'A' },
  { name: 'B' }
]);
```

**5. Use Structures for Generation**
```typescript
// Structures are simplified ASTs - much faster
const structure: ClassDeclarationStructure = {
  name: 'MyClass',
  methods: [{ name: 'myMethod' }]
};
sourceFile.addClass(structure);
```

### Application to Our Checks

| Check | ts-morph Pattern |
|-------|-----------------|
| `check.thin-routes` | forEachDescendant to find forbidden patterns, skip non-script content |
| `check.domain-boundaries` | getImportDeclarations() for efficient import scanning |
| `check.typed-routes` | Regex for template literals, ts-morph for JS/TS imports |
| `check.state-vs-streams` | getDescendantsOfKind() for specific syntax |
| `check.naming` | No AST needed - pure filename patterns |

### Current Check Issues

Looking at existing checks:

1. **check.domain-boundaries.ts** - Creates new Project per file (wasteful)
2. **check.typed-routes.ts** - Uses regex (OK for templates, fragile for JS)
3. **check.state-vs-streams.ts** - Uses regex line-by-line (fragile)
4. **check.thin-routes.ts** - Needs review

**Recommended refactor:**
- Single shared `Project` instance across all checks
- Proper AST analysis for JS/TS patterns
- Regex only for Svelte templates (where ts-morph doesn't help)
- Batch file loading

---

## 3. Decision Summary

### Typed Routes: CUSTOM GENERATOR

Build a custom generator because:
- Exact control over output location (`$lib/sys/generated/`)
- Generate both `ROUTES.ts` AND `routes.inventory.json`
- Deterministic for CI verification
- Not dependent on library deprecation schedule

### AST Analysis: REFACTOR CHECKS

Refactor existing checks to:
- Share single ts-morph Project instance
- Use proper AST patterns (not regex for code)
- Apply traversal control for performance
- Batch operations where possible

---

## 4. Decisions Locked

### URL-Driven Routing (CRITICAL)

**Answer:** SvelteKit native - URL IS the state. NO separate `current_domain` variable.

**Rationale:**
- Most web-aligned pattern
- SvelteKit's `$page.url.pathname` and route params are the source of truth
- No App.svelte domain switcher with `{#if}` chains
- Adding a domain = create `src/routes/(app)/<domain>/+page.svelte`

**What this means:**
```typescript
// NO - state-driven (OLD, KILLED)
import { global } from '$lib/sys/runes/global.svelte';
if (global.current_domain === 'devpulse') { ... }

// YES - URL-driven (LOCKED)
import { page } from '$app/stores';
// or in SvelteKit routes, just use the route params
```

**DomainRegistry role in URL-driven mode:**
- Does NOT load pages
- Only provides: sidebar items, ordering, grouping, icons, labels, status gates
- `pageModule` field removed - not needed

```typescript
export interface DomainMetadata {
  id: string;                          // "devpulse"
  label: string;                       // "DevPulse"
  icon: string;                        // icon id
  status: 'active' | 'coming-soon' | 'hidden';
  basePath: `/${string}`;              // "/devpulse"
  defaultFeature?: string;
  order: number;                       // sidebar ordering
}
```

---

### Nested Capability Buckets (NO /core/)

**Answer:** Every folder is a named capability. No `core/`, `common/`, `utils/` dumping zones.

**sys/ capabilities:**
- `registry/` - base registry pattern
- `observable/` - subscription behavior
- `routing/` - domain, routes, navigation
- `state/` - state module contracts
- `streams/` - stream boundaries
- `domains/` - domain contracts (global platform knowledge)

**Each bucket has the full module pattern:**
```
{capability}/{bucket}/
  {capability}.{bucket}.manifest.ts   # Machine-readable definition
  {capability}.{bucket}.types.ts      # TypeScript types
  {capability}.{bucket}.contract.ts   # Interface contracts
  index.ts                            # Barrel export
```

**Example:**
```
sys/contracts/routing/domain/
  routing.domain.manifest.ts
  routing.domain.types.ts
  routing.domain.contract.ts
  index.ts
```

**Domain contracts (in sys/, not domains/):**
```
sys/contracts/domains/app/devpulse/
  devpulse.manifest.ts
  devpulse.types.ts
  devpulse.contract.ts
  index.ts
```

Domain contracts are in `sys/contracts/domains/` because they're **global platform knowledge**, not feature logic.

---

### Manifest vs Registry (Role Separation)

**Manifest** (static):
- Data-only definition
- Safe to scan at build time
- Feeds generation + enforcement
- Used by scripts + dashboards

**Registry** (runtime):
- Runtime index
- Built at startup
- Queried by UI/system
- Driven by manifest + discovery

**Rule:** Manifest defines truth, registry is a view.

---

### routes.inventory.json Structure

**Answer:** Nested tree + route groups aware for Hub-based navigation.

```typescript
// routes.inventory.json shape
{
  "groups": {
    "(app)": {
      "label": "Application",
      "hubs": {
        "wiredfront": {
          "label": "WiredFront",
          "description": "Media hub - image/video/audio/editing/management",
          "icon": "media",
          "routes": [
            { "path": "/wiredfront", "label": "Dashboard", "isIndex": true },
            { "path": "/wiredfront/gallery", "label": "Gallery" },
            { "path": "/wiredfront/viziwizi", "label": "ViziWizi" }
          ]
        },
        "devpulse": {
          "label": "DevPulse",
          "description": "Developer dashboard",
          "routes": [...]
        }
      }
    },
    "(marketing)": {
      "label": "Marketing",
      "routes": [...]
    }
  },
  "meta": {
    "generated": "2026-01-25T...",
    "routeCount": 15
  }
}
```

**UI Note:** Sidebar is unique overlay modal navigation, not traditional sidebar.

### Search Params

**Answer:** YES - Full typed search params with defaults.

```typescript
// ROUTES.ts will support
route('/devpulse/settings', { tab: 'general', page: 1 })
// Generates: /devpulse/settings?tab=general&page=1

// With explicit param config in generator
const searchParams = {
  '/devpulse/settings': {
    tab: { type: 'string', default: 'general' },
    page: { type: 'number', default: 1 }
  }
}
```

### Form Actions

**Answer:** YES - Typed form action references.

```typescript
// ROUTES.ts will support
route('login /auth', { returnTo: '/dashboard' })
route('delete /site/[id]', { id: 123 })

// Usage in Svelte
<form method="POST" action={route('login /auth')}>
```

---

## Sources

- [vite-plugin-kit-routes](https://kitql.dev/docs/tools/06_vite-plugin-kit-routes/)
- [ts-morph documentation](https://ts-morph.com/)
- [ts-morph performance](https://ts-morph.com/manipulation/performance)
- [ts-morph navigation](https://ts-morph.com/navigation/)
- [SvelteKit typesafe routes discussion](https://github.com/sveltejs/kit/issues/3090)
- [SvelteKit routing docs](https://svelte.dev/docs/kit/routing)
