# DevPULSE Desktop — Enterprise Foundation Spec

> **Status**: LOCKED
> **Scope**: `platform_devpulse/interfaces/desktop`
> **Stack**: SvelteKit 5 + Svelte 5 (runes) + Tauri 2.0

---

## 1. Core Principle: Parallel Architecture

Domains and routes are **parallel sisters** — identical folder structure, different
responsibilities. Code flows **from domain to route**, never the other way.

```
Domain OWNS logic          Route MIRRORS structure
─────────────────          ───────────────────────
src/lib/domains/app/       src/routes/(app)/
  devpulse/                  devpulse/
    dashboard/                 dashboard/
    chat/                      chat/
    profile/                   profile/
    settings/                  settings/
```

This is the SvelteKit pattern at scale: the filesystem IS the URL, the domain IS
the feature, and the route IS the page — properly structured, not lazily flat.

### 1.1 Source of Truth

| Layer | Location | Role |
|-------|----------|------|
| Domains | `src/lib/domains/**` | Nx library-types (`feature`/`ui`/`data-access`/`util`) — the source |
| Routes | `src/routes/**` | Pages that mirror domains — the surface |
| Design | `src/lib/design/**` | ColdLight — visual system |
| System | `src/lib/sys/**` | Platform backbone — generated types, registries |
| Policy | `scripts/docs/policy/**` | Enforcement truth |

### 1.1.1 Nx Library-Types (LOCKED 2026-04-14)

Every domain is organized by **library type**, not by "what file extension is this." This is the Nx model — battle-tested in Angular and React monorepos, trivially portable to SvelteKit. It maps cleanly to what Svelte 5 already wants: dumb components (`ui`), smart orchestration (`feature`), reactive state + IPC (`data-access`), and pure helpers (`util`).

| Library type | Contains | Imports allowed | Rule of thumb |
|--------------|----------|-----------------|---------------|
| `feature/` | Smart/orchestrating Svelte 5 components. Routed pages compose these. Owns rune-glue, effects, and calls `data-access`. | `ui`, `data-access`, `util`, ColdLight, other domains' `index.ts` | "It knows what's on screen *and* what the data layer is." |
| `ui/` | Dumb/presentational Svelte 5 components. Props in, events out. No `$effect` talking to services, no IPC calls. | `util`, ColdLight | "Could be shown in Storybook with fake data." |
| `data-access/` | Rune state modules (`*.state.svelte.ts`), services (`*.service.ts`), Tauri IPC adapters, subscriptions. The ONLY place reactive domain state lives. | `util`, `sys/adapters`, `sys/streams` | "If you ripped out the UI, this still compiles and runs." |
| `util/` | Pure TypeScript: Zod/ArkType contracts, types, constants, formatters, enums. Zero runtime side effects, zero Svelte. | Nothing domain-specific | "Safe to import from literally anywhere, including tests." |

**Dependency direction (strict, enforced by preflight):**

```
       feature ──────► ui
          │            │
          ▼            ▼
     data-access ───► util
          │            ▲
          └────────────┘
```

- `ui` NEVER imports `data-access` or `feature`.
- `data-access` NEVER imports `feature` or `ui`.
- `util` NEVER imports anything else in the domain.
- `feature` is the only layer allowed to wire `data-access` to `ui`.
- Cross-domain imports go through the target domain's `index.ts` — never reach into `feature/`, `ui/`, `data-access/`, or `util/` directly.

### 1.2 Routes are Parallel Pages, Not "Thin Adapters"

Routes are properly structured pages that:

- **Mirror their domain sister's `feature/` hierarchy**
- Import state, services, and types from their domain counterpart via `index.ts`
- Use runes (`$state`, `$derived`, `$effect`) for reactive rendering
- Compose `feature/` components (and `ui/` where appropriate) into real pages
- Leverage SvelteKit load functions that call domain `data-access` services

What routes do NOT do:

- Own business logic (that lives in `data-access/`)
- Own application state (that lives in `data-access/**/*.state.svelte.ts`)
- Define data contracts (that lives in `util/`)
- Bypass their domain sister's `index.ts` public API

### 1.3 Runes-First State

- All reactive state: `$state`, `$derived`, `$effect` — runes everywhere
- Shared state modules: `domains/**/data-access/*.state.svelte.ts`
- Component-local state: runes directly in component script blocks
- Streams/subscriptions: only in `sys/streams/**` (rare, explicit boundary)

### 1.4 Typed Routes are Mandatory

Generated route helpers for all navigation. Raw string paths forbidden.

### 1.5 Enforcement is Real

1. **DevPulse CLI** (`devpulse` Node CLI) — structure validation, catalog generation
2. **Preflight checks** — AST + structure + policy (ts-morph)
3. **Lefthook** — pre-commit/pre-push gates
4. **CI** — deterministic verify

---

## 2. The Parallel Sister Pattern

### 2.1 Domain Structure (Nx Library-Types)

Every domain follows the same template. No exceptions.

```
src/lib/domains/app/{domain}/
  index.ts                            # Public API — the ONLY import routes use
  util/
    {domain}.contract.ts              # Zod/ArkType schemas + inferred types
    {domain}.types.ts                 # Pure type aliases, enums, constants
    {domain}.format.ts                # Pure formatters (optional)
  data-access/
    {domain}.state.svelte.ts          # Rune state ($state, $derived)
    {domain}.service.ts               # Services: Tauri invoke(), business ops
    {domain}.events.ts                # IPC event subscriptions (optional)
  ui/
    {Something}Card.svelte            # Dumb component — props in, events out
    {Something}List.svelte
  feature/
    dashboard/                        # Every domain has a dashboard
      DashboardOverview.svelte        # Smart — wires data-access → ui
      DashboardStats.svelte
    {feature-a}/                      # Domain-specific smart features
    {feature-b}/
```

**Mandatory per domain:**
- `index.ts` — public API surface (re-exports from `data-access` + `util` + selected `feature` entries)
- `util/` — at minimum one `*.contract.ts` with Zod/ArkType domain metadata
- `data-access/` — at minimum one `*.state.svelte.ts` and one `*.service.ts`
- `feature/dashboard/` — every domain gets a dashboard

**Optional per domain:**
- `ui/` — only created when the domain has reusable dumb components. Domains whose feature components are one-offs may skip this.

### 2.2 Route Structure (Page Mirror)

Routes mirror their domain sister folder-for-folder. The filesystem IS the URL.

```
src/routes/(app)/{domain}/
  +layout.svelte              # Domain shell — imports domain layout state
  +layout.ts                  # Load function — calls domain services
  +page.svelte                # Domain dashboard (default landing)
  +page.ts                    # Load — calls domain dashboard service
  dashboard/
    +page.svelte              # Dashboard detail view
    +page.ts
  {feature-a}/
    +page.svelte              # Feature page — composes domain features
    +page.ts
  {feature-b}/
    +page.svelte
    +page.ts
    [id]/                     # Dynamic params for detail views
      +page.svelte
      +page.ts
```

### 2.3 The Flow: Domain to Route

```
Domain                                      Route
──────                                      ─────
util/{domain}.contract.ts               →   +page.ts imports types
data-access/{domain}.state.svelte.ts    →   +page.svelte binds rune state
data-access/{domain}.service.ts         →   +page.ts load() calls service
feature/dashboard/                      →   dashboard/+page.svelte composes feature
index.ts                                →   ALL route files import through here
```

**Example — Chat domain:**

```typescript
// src/lib/domains/app/chat/index.ts
export { chatState } from './data-access/chat.state.svelte.js';
export { ChatService } from './data-access/chat.svc.js';
export type { ChatMessage, ChatSession } from './util/chat.contract.js';
export { default as ChatPanel } from './feature/chat/ChatPanel.svelte';

// src/routes/(app)/chat/+page.ts
import { ChatService } from '$lib/domains/app/chat/index.js';
export async function load() {
  return { sessions: await ChatService.getSessions() };
}

// src/routes/(app)/chat/+page.svelte
<script lang="ts">
  import { chatState, ChatPanel } from '$lib/domains/app/chat/index.js';
  let { data } = $props();
</script>
<ChatPanel sessions={data.sessions} state={chatState} />
```

> Inside the domain, `feature/` files may import peers via relative paths (`../data-access/chat.state.svelte.js`). `ui/` files may only reach into `../util/`. Routes and other domains always go through `index.ts`.

### 2.4 Route Groups Define App Shells

```
src/routes/
  (app)/          # Authenticated app shell — sidebar, nav, toolbar
    devpulse/     # Main platform domain
    chat/         # Voice/text chat domain
    overmind/     # AI orchestration domain
    models/       # Model management domain
    settings/     # Platform settings domain
  (marketing)/    # Public landing — no sidebar, different layout
    +page.svelte
  (auth)/         # Login/register shell
    login/
    register/
```

---

## 3. Every Domain Has a Dashboard

This is a hard rule. When a domain is created, it gets a dashboard. The dashboard
is the landing page for that domain — it summarizes the domain's state.

```
domains/app/devpulse/feature/dashboard/
  DashboardOverview.svelte      # Smart — reads devpulseState, composes ui/
  DashboardStats.svelte         # Charts, activity feed
  DashboardActions.svelte       # Quick actions for this domain

routes/(app)/devpulse/
  +page.svelte                  # Renders the dashboard by default
```

The DevPulse CLI enforces this: `devpulse domain:create {name}` scaffolds the
full domain + route parallel structure including the dashboard.

---

## 4. Central API Catalog

### 4.1 Build-Time Catalog Generation

At build, every domain's `index.ts` and `util/*.contract.ts` are scanned
to produce a central catalog:

```
src/lib/sys/generated/
  api.catalog.json              # All domain APIs, typed, deduplicated
  routes.inventory.json         # All routes with metadata
  ROUTES.ts                     # Typed route helpers
```

### 4.2 Catalog Schema

```typescript
// api.catalog.json
{
  "version": "1.0.0",
  "generated": "2026-03-05T...",
  "domains": {
    "devpulse": {
      "category": "platform",
      "routes": ["/devpulse", "/devpulse/dashboard", "/devpulse/settings"],
      "exports": ["devpulseState", "DevpulseService"],
      "contracts": ["DevpulseConfig", "DevpulseMetrics"],
      "hasDashboard": true
    },
    "chat": {
      "category": "communication",
      "routes": ["/chat", "/chat/[sessionId]"],
      "exports": ["chatState", "ChatService"],
      "contracts": ["ChatMessage", "ChatSession"],
      "hasDashboard": true
    }
  },
  "duplicates": [],
  "warnings": []
}
```

### 4.3 Duplicate Detection

The catalog generator fails the build if:

- Two domains export the same contract name
- Two routes resolve to the same URL
- A domain exists without a dashboard
- A route exists without a domain sister
- A domain feature folder has no corresponding route

### 4.4 Category Organization

Every domain declares its category in its contract:

```typescript
// domains/app/chat/util/chat.contract.ts
import { z } from 'zod';

export const ChatDomainMeta = z.object({
  kind: z.literal('chat'),
  category: z.literal('communication'),  // Category for catalog
  label: z.literal('Chat'),
  icon: z.literal('message-circle'),
});
```

Categories drive sidebar grouping, search, and the domain overview page.

---

## 5. DevPulse CLI (`devpulse`)

Node CLI that enforces the parallel sister pattern and generates the catalog.

### 5.1 Commands

| Command | Purpose |
|---------|---------|
| `devpulse domain:create {name}` | Scaffold domain + route pair with dashboard |
| `devpulse domain:add-feature {domain} {feature}` | Add feature to domain + corresponding route |
| `devpulse catalog:generate` | Scan all domains, build api.catalog.json |
| `devpulse catalog:verify` | Verify no duplicates, all dashboards exist |
| `devpulse routes:generate` | Generate ROUTES.ts typed helpers |
| `devpulse routes:inventory` | Generate routes.inventory.json for nav |
| `devpulse preflight:check` | Run all structural checks |
| `devpulse preflight:fix` | Auto-fix what can be fixed |
| `devpulse verify` | Full pipeline: catalog + routes + preflight |

### 5.2 Domain Scaffold Template

`devpulse domain:create models` generates:

```
src/lib/domains/app/models/
  index.ts
  util/
    models.contract.ts
    models.types.ts
  data-access/
    models.state.svelte.ts
    models.service.ts
  ui/                           # (created on demand)
  feature/
    dashboard/
      DashboardOverview.svelte

src/routes/(app)/models/
  +layout.svelte
  +layout.ts
  +page.svelte                  # Dashboard landing
  +page.ts
  dashboard/
    +page.svelte
    +page.ts
```

All files are real — not empty stubs. The scaffold includes:
- Contract with domain metadata (kind, category, label, icon)
- Rune state with initial reactive declarations
- Service skeleton with typed return values
- Dashboard component with placeholder structure
- Route load functions wired to services
- Route pages wired to domain state and features

---

## 6. Typed Routes Spec

### 6.1 Generator Output

```
src/lib/sys/generated/ROUTES.ts
```

### 6.2 Usage

```typescript
import { route } from '$lib/sys/generated/ROUTES.js';

// Links
<a href={route('/devpulse')}>Home</a>

// With params
<a href={route('/chat/[sessionId]', { sessionId: 'abc123' })}>Session</a>

// Redirects
throw redirect(302, route('/auth/login'));
```

### 6.3 Raw Route Strings

**Forbidden everywhere** except:
- Route generator source
- Route scanning / inventory generator
- Allowlisted internal tooling scripts

---

## 7. State Architecture

### 7.1 Runes Everywhere

```typescript
// domains/app/chat/state/chat.state.svelte.ts
let sessions = $state<ChatSession[]>([]);
let activeSession = $state<string | null>(null);
let isConnected = $derived(activeSession !== null);

export const chatState = {
  get sessions() { return sessions; },
  get activeSession() { return activeSession; },
  get isConnected() { return isConnected; },
  setActive(id: string) { activeSession = id; },
};
```

### 7.2 State Boundaries

| Where | What | Pattern |
|-------|------|---------|
| `domains/**/data-access/*.state.svelte.ts` | Shared domain state | Exported rune modules |
| Component `<script>` blocks (in `feature/` or `ui/`) | Local UI state | `let x = $state(...)` |
| `+page.ts` / `+layout.ts` | Load data | Return from `load()`, never store |
| `sys/streams/**` | Long-lived subscriptions | Explicit, rare |

### 7.3 No Stores, No Writables, No Legacy

- No `writable()`, `readable()`, `derived()` from `svelte/store`
- No `$:` reactive statements
- No `onMount` for state init (use `$effect` if needed)
- Runes only. This is Svelte 5.

---

## 8. Navigation — Derived From Structure

**No hardcoded nav lists. Ever.**

Navigation derives from the route inventory, which derives from the parallel
folder structure:

```
1. Filesystem scan → routes.inventory.json
2. Domain contracts → category metadata
3. Sidebar component reads inventory + categories
4. New domain folder = new nav entry automatically
```

### 8.1 Inventory Schema

```typescript
// routes.inventory.json
{
  "groups": [
    {
      "id": "app",
      "label": "Platform",
      "routes": [
        {
          "path": "/devpulse",
          "domain": "devpulse",
          "category": "platform",
          "label": "DevPulse",
          "icon": "pulse",
          "hasDashboard": true,
          "children": [
            { "path": "/devpulse/dashboard", "label": "Dashboard" },
            { "path": "/devpulse/settings", "label": "Settings" }
          ]
        }
      ]
    }
  ]
}
```

---

## 9. Naming Conventions

| Type | Location | Pattern | Example |
|------|----------|---------|---------|
| Domain state | `data-access/` | `*.state.svelte.ts` | `chat.state.svelte.ts` |
| Domain service | `data-access/` | `*.service.ts` | `chat.service.ts` |
| Domain events | `data-access/` | `*.events.ts` | `chat.events.ts` |
| Domain contract | `util/` | `*.contract.ts` | `chat.contract.ts` |
| Domain types | `util/` | `*.types.ts` | `chat.types.ts` |
| Dumb component | `ui/` | `{Pascal}.svelte` | `ChatBubble.svelte` |
| Smart component | `feature/{name}/` | `{Pascal}.svelte` | `ChatPanel.svelte` |
| Route pages | `routes/` | `+page.svelte` | SvelteKit convention |
| Route loads | `routes/` | `+page.ts` | SvelteKit convention |
| Route layouts | `routes/` | `+layout.svelte` / `+layout.ts` | SvelteKit convention |
| Registries | `sys/registries/` | `*.registry.ts` | `routes.registry.ts` |

---

## 10. Enforcement System

### 10.1 Preflight Checks (ts-morph AST)

```
scripts/docs/preflight/
  engine/
    preflight.ts              # Main runner
    report.ts                 # Reporting
    registry.ts               # Check registry
  checks/
    check.domain-boundaries.ts       # Routes / other domains only import from index.ts
    check.library-type-deps.ts       # Nx dep direction: ui↛data-access, util↛*, etc.
    check.typed-routes.ts            # No raw route strings
    check.naming.ts                  # File naming conventions
    check.parallel-structure.ts      # Route mirrors domain feature/ tree
    check.dashboard-exists.ts        # Every domain has feature/dashboard/
    check.contract-exists.ts         # Every domain has util/*.contract.ts
    check.state-boundary.ts          # State only in data-access/*.state.svelte.ts
    check.no-legacy-stores.ts        # No writable/readable/derived imports
  fixers/
    fix.domain-index.ts           # Generate missing index.ts
    fix.inject-jsdoc.ts           # JSDoc injection
    fix.seed-architecture.ts      # Seed arch docs
    fix.seed-adr.ts               # Seed ADR
```

### 10.2 Policy

```
scripts/docs/policy/
  cowlevel.policy.json            # Requirements matrix
  enforcement.tiers.json          # Tier behaviors (warn/error/fail)
  doc-coverage.gates.json         # Documentation drift gates
```

### 10.3 Lefthook Gates

```bash
pnpm lint
devpulse preflight:check
devpulse catalog:verify
```

**Hard-fails if:**
- Route exists without domain sister
- Domain exists without `feature/dashboard/`
- Route imports bypass domain `index.ts`
- Raw route strings outside allowlist
- Legacy store imports detected
- State declared outside `data-access/*.state.svelte.ts`
- Contract name collision across domains
- Naming convention violation
- Nx library-type dependency violation (e.g. `ui/` imports `data-access/`, `util/` imports anything in-domain, `data-access/` imports `feature/`)

---

## 11. System Layer

```
src/lib/sys/
  contracts/                      # Type shapes for platform-wide concerns
    routes.contract.ts
    state.contract.ts
    catalog.contract.ts
  registries/                     # Runtime lookups
    routes.registry.ts
    state.registry.ts
  generated/                      # Machine outputs — NEVER hand-edit
    ROUTES.ts                     # Typed route helpers
    routes.inventory.json         # Nav index
    api.catalog.json              # Domain API catalog
  streams/                        # Subscription boundary (rare)
  adapters/                       # External integration boundary (Tauri IPC)
```

---

## Summary

| Principle | Implementation |
|-----------|----------------|
| Parallel sisters | Routes mirror domain `feature/` structure exactly |
| Nx library-types | `feature` / `ui` / `data-access` / `util` — strict dep direction |
| Code flows domain → route | Domain owns logic, route composes and renders |
| Every domain has a dashboard | `feature/dashboard/` mandatory per domain |
| Runes-first, runes-only | `$state`, `$derived`, `$effect` — no legacy stores |
| Typed routes mandatory | `ROUTES.ts` generated, raw strings forbidden |
| Central API catalog | `api.catalog.json` — deduplicated, categorized at build |
| DevPulse CLI enforces | `devpulse` Node CLI validates + scaffolds |
| Structure-derived nav | Folder structure → inventory → sidebar (no hardcoded lists) |
| Schema-driven contracts | Zod at every boundary, domain metadata in contracts |
| Real enforcement | Preflight (AST) + Lefthook + CI — not optional |
