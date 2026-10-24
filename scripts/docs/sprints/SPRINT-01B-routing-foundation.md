# SPRINT 1B: URL-Driven Routing + Nested Capability Buckets

> **Status**: READY FOR EXECUTION
> **Scope**: `interfaces/desktop/src/lib/sys/`, `interfaces/desktop/src/routes/`
> **Depends On**: Sprint 1 (complete)
> **Date**: 2026-01-25

---

## Critical Decisions (LOCKED)

1. **URL-Driven Routing** - SvelteKit native, URL IS the state
   - NO separate `current_domain` state variable
   - NO App.svelte `{#if}` domain switcher
   - Thin route wrappers at `src/routes/(app)/<domain>/+page.svelte`

2. **NO `/core/` Folders** - Named capability buckets only
   - Capabilities: registry/, observable/, routing/, state/, streams/, domains/
   - No dumping zones (core/, common/, utils/)

3. **Bucket Pattern** - Each capability bucket contains:
   - `{capability}.{bucket}.manifest.ts` - Machine-readable definition
   - `{capability}.{bucket}.types.ts` - TypeScript types
   - `{capability}.{bucket}.contract.ts` - Interface contracts
   - `index.ts` - Barrel export

4. **Domain Contracts in sys/** - Global platform knowledge
   - Location: `sys/contracts/domains/app/{domain}/`
   - NOT in `domains/app/{domain}/contracts/`

5. **DomainRegistry is Metadata-Only**
   - NO pageModule loading
   - Provides: sidebar items, ordering, icons, labels, status gates

---

## Current State Audit (2026-01-25)

### What Exists (WRONG)

**sys/contracts/**:
```
contracts/
  core/                          # WRONG - /core/ is forbidden
    registry.contract.ts
    observable.contract.ts
  routing/
    domain.contract.ts           # OK but flat
    routes.contract.ts
  state/
    state.contract.ts
  streams/
    streams.contract.ts
  domains/app/                   # OK - correct location
    devpulse/devpulse.contract.ts
    ...
  index.ts
```

**sys/registries/**:
```
registries/
  core/                          # WRONG - /core/ is forbidden
    domain.registry.ts
  routing/
    routes.registry.ts
  state/
    state.registry.ts
  streams/
    streams.registry.ts
  base.registry.ts
  index.ts
```

**App.svelte**:
- Still has `{#if}` domain switcher (WRONG)
- Uses `global.current_domain` (WRONG)

### Target State

**sys/contracts/**:
```
contracts/
  index.ts

  registry/base/
    registry.base.manifest.ts
    registry.base.types.ts
    registry.base.contract.ts
    index.ts

  observable/base/
    observable.base.manifest.ts
    observable.base.types.ts
    observable.base.contract.ts
    index.ts

  routing/domain/
    routing.domain.manifest.ts
    routing.domain.types.ts
    routing.domain.contract.ts
    index.ts

  routing/routes/
    routing.routes.manifest.ts
    routing.routes.types.ts
    routing.routes.contract.ts
    index.ts

  routing/navigation/
    routing.navigation.manifest.ts
    routing.navigation.types.ts
    routing.navigation.contract.ts
    index.ts

  state/module/
    state.module.manifest.ts
    state.module.types.ts
    state.module.contract.ts
    index.ts

  streams/boundary/
    streams.boundary.manifest.ts
    streams.boundary.types.ts
    streams.boundary.contract.ts
    index.ts

  domains/app/
    index.ts
    devpulse/
      devpulse.manifest.ts
      devpulse.types.ts
      devpulse.contract.ts
      index.ts
    devforge/...
    wiredfront/...
    overmind/...
    maestro/...
    ui-demo/...
```

**sys/registries/**:
```
registries/
  index.ts
  base.registry.ts

  registry/base/
    registry.base.registry.ts
    index.ts

  routing/domains/
    routing.domains.registry.ts
    index.ts

  routing/routes/
    routing.routes.registry.ts
    index.ts

  state/modules/
    state.modules.registry.ts
    index.ts

  streams/boundary/
    streams.boundary.registry.ts
    index.ts
```

**src/routes/(app)/**:
```
routes/
  +layout.svelte              # Root layout
  (app)/
    +layout.svelte            # App shell (Frame, Sidebar, etc.)
    devpulse/
      +page.svelte            # Thin wrapper
    ui-demo/
      +page.svelte
    overmind/
      +page.svelte
    wiredfront/
      +page.svelte
    devforge/
      +page.svelte
    maestro/
      +page.svelte
```

---

## Phase 1: Create SvelteKit Routes Structure

### Task 1.1: Create root layout

**File**: `src/routes/+layout.svelte`

```svelte
<script lang="ts">
  import '../app.css';
</script>

<slot />
```

### Task 1.2: Create (app) group layout

**File**: `src/routes/(app)/+layout.svelte`

```svelte
<script lang="ts">
  import Frame from '$lib/layouts/app/Frame.svelte';
  import VPB from '$lib/sys/debug/vpb/VPB.svelte';
</script>

<Frame>
  <slot />
</Frame>

<VPB />
```

### Task 1.3: Create thin route wrappers

**File**: `src/routes/(app)/devpulse/+page.svelte`

```svelte
<script lang="ts">
  import DevPulseDashboard from '$lib/domains/app/devpulse/features/dashboard/pages/DevPulseDashboard.svelte';
</script>

<DevPulseDashboard />
```

**File**: `src/routes/(app)/ui-demo/+page.svelte`

```svelte
<script lang="ts">
  import UIDemoPage from '$lib/domains/app/ui-demo/pages/UIDemoPage.svelte';
</script>

<UIDemoPage />
```

**File**: `src/routes/(app)/overmind/+page.svelte`

```svelte
<script lang="ts">
  // import OvermindDashboard from '$lib/domains/app/overmind/pages/OvermindDashboard.svelte';
</script>

<div class="placeholder">Overmind - Coming Soon</div>

<style>
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 2rem;
    color: rgba(255, 255, 255, 0.2);
  }
</style>
```

**File**: `src/routes/(app)/wiredfront/+page.svelte`

```svelte
<script lang="ts">
  // import WiredDashboard from '$lib/domains/app/wiredfront/pages/WiredDashboard.svelte';
</script>

<div class="placeholder">WiredFront - Coming Soon</div>

<style>
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 2rem;
    color: rgba(255, 255, 255, 0.2);
  }
</style>
```

**File**: `src/routes/(app)/devforge/+page.svelte`

```svelte
<script lang="ts">
  // import DevForgeDashboard from '$lib/domains/app/devforge/pages/DevForgeDashboard.svelte';
</script>

<div class="placeholder">DevForge - Coming Soon</div>

<style>
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 2rem;
    color: rgba(255, 255, 255, 0.2);
  }
</style>
```

**File**: `src/routes/(app)/maestro/+page.svelte`

```svelte
<script lang="ts">
  // import MaestroDashboard from '$lib/domains/app/maestro/pages/MaestroDashboard.svelte';
</script>

<div class="placeholder">Maestro - Coming Soon</div>

<style>
  .placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    font-size: 2rem;
    color: rgba(255, 255, 255, 0.2);
  }
</style>
```

### Task 1.4: Create index redirect

**File**: `src/routes/+page.svelte`

```svelte
<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/devpulse');
  });
</script>

<div class="loading">Loading...</div>

<style>
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100vh;
    color: rgba(255, 255, 255, 0.5);
  }
</style>
```

---

## Phase 2: Update Sidebar for URL-Driven Navigation

### Task 2.1: Update Sidebar to use `<a>` tags and `$page`

The Sidebar must:
- Use `<a href="/devpulse">` for navigation (not click handlers)
- Use `$page.url.pathname` to determine active state
- Get domain metadata from DomainRegistry

```svelte
<script lang="ts">
  import { page } from '$app/stores';
  import { domainRegistry } from '$lib/sys/registries/index.js';

  const domains = domainRegistry.getActive();

  function isActive(basePath: string): boolean {
    return $page.url.pathname.startsWith(basePath);
  }
</script>

{#each domains as domain}
  <a
    href={domain.basePath}
    class:active={isActive(domain.basePath)}
  >
    {domain.icon} {domain.label}
  </a>
{/each}
```

---

## Phase 3: Delete App.svelte Domain Switcher

### Task 3.1: Simplify App.svelte

App.svelte should just render the slot (handled by routes now).

**Before** (WRONG):
```svelte
<script>
  import { global } from "$lib/sys/runes/global.svelte";
  ...
  {#if global.current_domain === 'devpulse'}
    <HomeDashboard />
  {:else if global.current_domain === 'ui-demo'}
    <UIDemoPage />
  ...
</script>
```

**After** (URL-driven):
```svelte
<script>
  import './app.css';
</script>

<slot />
```

Note: App.svelte may not be needed at all if SvelteKit handles everything via routes.

---

## Phase 4: Reorganize sys/contracts/ (Nested Capability Buckets)

### Task 4.1: Create registry/base/ bucket

**File**: `sys/contracts/registry/base/registry.base.manifest.ts`

```typescript
/**
 * @file sys/contracts/registry/base/registry.base.manifest.ts
 * @description Base registry manifest - machine-readable definition
 */

export const REGISTRY_BASE_MANIFEST = {
  id: 'registry.base',
  version: '1.0.0',
  description: 'Base registry pattern for observable collections',
  capabilities: ['get', 'getAll', 'register', 'unregister', 'subscribe'],
} as const;
```

**File**: `sys/contracts/registry/base/registry.base.types.ts`

```typescript
/**
 * @file sys/contracts/registry/base/registry.base.types.ts
 * @description Base registry types
 */

/** Registry change event */
export type RegistryEvent<T> =
  | { type: 'registered'; item: T }
  | { type: 'unregistered'; id: string }
  | { type: 'updated'; item: T };

/** Registry listener function */
export type RegistryListener<T> = (event: RegistryEvent<T>) => void;

/** Unsubscribe function */
export type Unsubscribe = () => void;
```

**File**: `sys/contracts/registry/base/registry.base.contract.ts`

```typescript
/**
 * @file sys/contracts/registry/base/registry.base.contract.ts
 * @description Base registry contract
 */

import type { RegistryEvent, RegistryListener, Unsubscribe } from './registry.base.types.js';

/** Base registry interface */
export interface Registry<T extends { id: string }> {
  get(id: string): T | undefined;
  getAll(): T[];
  register(item: T): void;
  unregister(id: string): void;
  subscribe(listener: RegistryListener<T>): Unsubscribe;
}
```

**File**: `sys/contracts/registry/base/index.ts`

```typescript
/**
 * @file sys/contracts/registry/base/index.ts
 * @description Barrel export for registry base bucket
 */

export { REGISTRY_BASE_MANIFEST } from './registry.base.manifest.js';
export type { RegistryEvent, RegistryListener, Unsubscribe } from './registry.base.types.js';
export type { Registry } from './registry.base.contract.js';
```

### Task 4.2: Create routing/domain/ bucket

**File**: `sys/contracts/routing/domain/routing.domain.manifest.ts`

```typescript
/**
 * @file sys/contracts/routing/domain/routing.domain.manifest.ts
 * @description Domain routing manifest
 */

export const ROUTING_DOMAIN_MANIFEST = {
  id: 'routing.domain',
  version: '1.0.0',
  description: 'Domain metadata for URL-driven routing and sidebar navigation',
  statuses: ['active', 'coming-soon', 'hidden'],
} as const;
```

**File**: `sys/contracts/routing/domain/routing.domain.types.ts`

```typescript
/**
 * @file sys/contracts/routing/domain/routing.domain.types.ts
 * @description Domain routing types
 */

/** Domain status */
export type DomainStatus = 'active' | 'coming-soon' | 'hidden';

/** Domain identifier */
export type DomainId =
  | 'devpulse'
  | 'devforge'
  | 'overmind'
  | 'wiredfront'
  | 'maestro'
  | 'ui-demo';
```

**File**: `sys/contracts/routing/domain/routing.domain.contract.ts`

```typescript
/**
 * @file sys/contracts/routing/domain/routing.domain.contract.ts
 * @description Domain routing contract
 */

import type { DomainStatus, DomainId } from './routing.domain.types.js';
import type { Registry } from '../../registry/base/registry.base.contract.js';

/** Domain metadata for sidebar navigation (URL-driven, no page loading) */
export interface DomainMetadata {
  id: DomainId;
  label: string;
  icon: string;
  status: DomainStatus;
  basePath: `/${string}`;
  defaultFeature?: string;
  order: number;
}

/** Domain registry interface */
export interface DomainRegistry extends Registry<DomainMetadata> {
  getActive(): DomainMetadata[];
  getByStatus(status: DomainStatus): DomainMetadata[];
  getOrdered(): DomainMetadata[];
}
```

**File**: `sys/contracts/routing/domain/index.ts`

```typescript
/**
 * @file sys/contracts/routing/domain/index.ts
 * @description Barrel export for domain routing bucket
 */

export { ROUTING_DOMAIN_MANIFEST } from './routing.domain.manifest.js';
export type { DomainStatus, DomainId } from './routing.domain.types.js';
export type { DomainMetadata, DomainRegistry } from './routing.domain.contract.js';
```

### Task 4.3: Create remaining capability buckets

Apply same pattern for:
- `observable/base/` - observable.base.{manifest,types,contract}.ts + index.ts
- `routing/routes/` - routing.routes.{manifest,types,contract}.ts + index.ts
- `routing/navigation/` - routing.navigation.{manifest,types,contract}.ts + index.ts
- `state/module/` - state.module.{manifest,types,contract}.ts + index.ts
- `streams/boundary/` - streams.boundary.{manifest,types,contract}.ts + index.ts

### Task 4.4: Delete /core/ folder

```bash
rm -rf sys/contracts/core/
```

### Task 4.5: Update sys/contracts/index.ts

```typescript
/**
 * @file sys/contracts/index.ts
 * @description Barrel export for all contracts
 */

// Registry
export * from './registry/base/index.js';

// Observable
export * from './observable/base/index.js';

// Routing
export * from './routing/domain/index.js';
export * from './routing/routes/index.js';
export * from './routing/navigation/index.js';

// State
export * from './state/module/index.js';

// Streams
export * from './streams/boundary/index.js';

// Domain contracts
export * from './domains/app/index.js';
```

---

## Phase 5: Update Domain Contracts (Manifest Pattern)

### Task 5.1: Update devpulse domain contract

**File**: `sys/contracts/domains/app/devpulse/devpulse.manifest.ts`

```typescript
/**
 * @file sys/contracts/domains/app/devpulse/devpulse.manifest.ts
 * @description DevPulse domain manifest
 */

import type { DomainMetadata } from '../../../routing/domain/routing.domain.contract.js';

export const DEVPULSE_MANIFEST: DomainMetadata = {
  id: 'devpulse',
  label: 'DevPulse',
  icon: 'home',
  status: 'active',
  basePath: '/devpulse',
  defaultFeature: 'dashboard',
  order: 0,
};
```

**File**: `sys/contracts/domains/app/devpulse/devpulse.types.ts`

```typescript
/**
 * @file sys/contracts/domains/app/devpulse/devpulse.types.ts
 * @description DevPulse domain types
 */

export type DevPulseFeature =
  | 'dashboard'
  | 'community'
  | 'profile'
  | 'settings';

export interface DevPulseRoutes {
  dashboard: '/devpulse';
  community: '/devpulse/community';
  profile: '/devpulse/profile';
  settings: '/devpulse/settings';
}
```

**File**: `sys/contracts/domains/app/devpulse/devpulse.contract.ts`

```typescript
/**
 * @file sys/contracts/domains/app/devpulse/devpulse.contract.ts
 * @description DevPulse domain contract (re-exports)
 */

export { DEVPULSE_MANIFEST } from './devpulse.manifest.js';
export type { DevPulseFeature, DevPulseRoutes } from './devpulse.types.js';
```

**File**: `sys/contracts/domains/app/devpulse/index.ts`

```typescript
/**
 * @file sys/contracts/domains/app/devpulse/index.ts
 * @description Barrel export for DevPulse domain contracts
 */

export * from './devpulse.contract.js';
```

### Task 5.2: Apply same pattern to other domains

- devforge
- wiredfront
- overmind
- maestro
- ui-demo

### Task 5.3: Create domains/app/index.ts barrel

```typescript
/**
 * @file sys/contracts/domains/app/index.ts
 * @description Barrel export for all app domain contracts
 */

export * from './devpulse/index.js';
export * from './devforge/index.js';
export * from './wiredfront/index.js';
export * from './overmind/index.js';
export * from './maestro/index.js';
export * from './ui-demo/index.js';

// Convenience array for bulk registration
import { DEVPULSE_MANIFEST } from './devpulse/index.js';
import { DEVFORGE_MANIFEST } from './devforge/index.js';
import { WIREDFRONT_MANIFEST } from './wiredfront/index.js';
import { OVERMIND_MANIFEST } from './overmind/index.js';
import { MAESTRO_MANIFEST } from './maestro/index.js';
import { UIDEMO_MANIFEST } from './ui-demo/index.js';

export const APP_DOMAIN_MANIFESTS = [
  DEVPULSE_MANIFEST,
  DEVFORGE_MANIFEST,
  WIREDFRONT_MANIFEST,
  OVERMIND_MANIFEST,
  MAESTRO_MANIFEST,
  UIDEMO_MANIFEST,
];
```

---

## Phase 6: Reorganize sys/registries/ (Nested Capability Buckets)

### Task 6.1: Create routing/domains/ bucket

**File**: `sys/registries/routing/domains/routing.domains.registry.ts`

```typescript
/**
 * @file sys/registries/routing/domains/routing.domains.registry.ts
 * @description Domain registry implementation (metadata-only, URL-driven)
 */

import { BaseRegistry } from '../../base.registry.js';
import type { DomainMetadata, DomainRegistry, DomainStatus } from '../../../contracts/routing/domain/index.js';

class DomainRegistryImpl extends BaseRegistry<DomainMetadata> implements DomainRegistry {
  getActive(): DomainMetadata[] {
    return this.getAll().filter(d => d.status === 'active');
  }

  getByStatus(status: DomainStatus): DomainMetadata[] {
    return this.getAll().filter(d => d.status === status);
  }

  getOrdered(): DomainMetadata[] {
    return this.getAll().sort((a, b) => a.order - b.order);
  }
}

export const domainRegistry = new DomainRegistryImpl();
```

**File**: `sys/registries/routing/domains/index.ts`

```typescript
/**
 * @file sys/registries/routing/domains/index.ts
 * @description Barrel export for domain registry bucket
 */

export { domainRegistry } from './routing.domains.registry.js';
```

### Task 6.2: Apply pattern to other registries

- `routing/routes/` - routing.routes.registry.ts + index.ts
- `state/modules/` - state.modules.registry.ts + index.ts
- `streams/boundary/` - streams.boundary.registry.ts + index.ts

### Task 6.3: Delete /core/ folder

```bash
rm -rf sys/registries/core/
```

### Task 6.4: Update sys/registries/index.ts

```typescript
/**
 * @file sys/registries/index.ts
 * @description Barrel export for all registries
 */

export { BaseRegistry } from './base.registry.js';
export { domainRegistry } from './routing/domains/index.js';
export { routesRegistry } from './routing/routes/index.js';
export { stateRegistry } from './state/modules/index.js';
export { streamsRegistry } from './streams/boundary/index.js';
```

---

## Phase 7: Update sys/init.ts for Manifest Registration

### Task 7.1: Update initialization

```typescript
/**
 * @file sys/init.ts
 * @description System initialization
 */

import { domainRegistry } from './registries/index.js';
import { APP_DOMAIN_MANIFESTS } from './contracts/domains/app/index.js';

let initialized = false;

export function initSys(): void {
  if (initialized) return;

  // Register domain manifests
  APP_DOMAIN_MANIFESTS.forEach(manifest => {
    domainRegistry.register(manifest);
  });

  initialized = true;
}

export function isSysInitialized(): boolean {
  return initialized;
}
```

---

## Phase 8: Verification

### Task 8.1: Run svelte-check

```bash
cd interfaces/desktop
pnpm svelte-check
```

Expected: 0 new errors

### Task 8.2: Start dev server

```bash
pnpm dev
```

Expected: App loads without errors

### Task 8.3: Test URL navigation

- Navigate to `http://localhost:5173/devpulse` - should show DevPulse dashboard
- Navigate to `http://localhost:5173/ui-demo` - should show UI Demo page
- Click sidebar icons - should navigate via URL
- Browser back/forward should work

### Task 8.4: Verify no current_domain usage

```bash
grep -r "current_domain" src/
```

Expected: No results (except possibly global.svelte.ts if not yet deleted)

---

## Compact Checkpoint

After Phase 8, pause and verify with user:

- [ ] Routes working via URL (`/devpulse`, `/ui-demo`, etc.)
- [ ] Sidebar navigates via `<a href>` tags
- [ ] No App.svelte `{#if}` domain switcher
- [ ] No `/core/` folders in contracts or registries
- [ ] All capability buckets have manifest + types + contract + index
- [ ] svelte-check passes
- [ ] Dev server runs

---

## Files Changed Summary

### New Files
```
src/routes/+layout.svelte
src/routes/+page.svelte
src/routes/(app)/+layout.svelte
src/routes/(app)/devpulse/+page.svelte
src/routes/(app)/ui-demo/+page.svelte
src/routes/(app)/overmind/+page.svelte
src/routes/(app)/wiredfront/+page.svelte
src/routes/(app)/devforge/+page.svelte
src/routes/(app)/maestro/+page.svelte

sys/contracts/registry/base/registry.base.manifest.ts
sys/contracts/registry/base/registry.base.types.ts
sys/contracts/registry/base/registry.base.contract.ts
sys/contracts/registry/base/index.ts

sys/contracts/observable/base/observable.base.manifest.ts
sys/contracts/observable/base/observable.base.types.ts
sys/contracts/observable/base/observable.base.contract.ts
sys/contracts/observable/base/index.ts

sys/contracts/routing/domain/routing.domain.manifest.ts
sys/contracts/routing/domain/routing.domain.types.ts
sys/contracts/routing/domain/routing.domain.contract.ts
sys/contracts/routing/domain/index.ts

sys/contracts/routing/routes/routing.routes.manifest.ts
sys/contracts/routing/routes/routing.routes.types.ts
sys/contracts/routing/routes/routing.routes.contract.ts
sys/contracts/routing/routes/index.ts

sys/contracts/routing/navigation/routing.navigation.manifest.ts
sys/contracts/routing/navigation/routing.navigation.types.ts
sys/contracts/routing/navigation/routing.navigation.contract.ts
sys/contracts/routing/navigation/index.ts

sys/contracts/state/module/state.module.manifest.ts
sys/contracts/state/module/state.module.types.ts
sys/contracts/state/module/state.module.contract.ts
sys/contracts/state/module/index.ts

sys/contracts/streams/boundary/streams.boundary.manifest.ts
sys/contracts/streams/boundary/streams.boundary.types.ts
sys/contracts/streams/boundary/streams.boundary.contract.ts
sys/contracts/streams/boundary/index.ts

sys/contracts/domains/app/devpulse/devpulse.manifest.ts
sys/contracts/domains/app/devpulse/devpulse.types.ts
sys/contracts/domains/app/devpulse/devpulse.contract.ts
sys/contracts/domains/app/devpulse/index.ts
(same pattern for devforge, wiredfront, overmind, maestro, ui-demo)

sys/registries/routing/domains/routing.domains.registry.ts
sys/registries/routing/domains/index.ts
sys/registries/routing/routes/routing.routes.registry.ts
sys/registries/routing/routes/index.ts
sys/registries/state/modules/state.modules.registry.ts
sys/registries/state/modules/index.ts
sys/registries/streams/boundary/streams.boundary.registry.ts
sys/registries/streams/boundary/index.ts
```

### Modified Files
```
sys/contracts/index.ts
sys/registries/index.ts
sys/init.ts
sys/index.ts
src/lib/layouts/app/Sidebar.svelte
```

### Deleted Files
```
sys/contracts/core/
sys/registries/core/
sys/global/runes/global.svelte.ts (current_domain removed)
App.svelte domain switcher code
```

---

## Code Patterns (VERIFIED)

### forEach for Sets
```typescript
this.listeners.forEach(listener => listener(event));
```

### Import with .js extension
```typescript
import type { DomainMetadata } from './routing.domain.contract.js';
```

### Singleton export
```typescript
export const domainRegistry = new DomainRegistryImpl();
```

### Type-only export
```typescript
export type { DomainMetadata } from './routing.domain.contract.js';
```
