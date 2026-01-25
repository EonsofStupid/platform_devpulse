# SPRINT 01: Sys Layer Foundation

> **Status**: READY FOR EXECUTION
> **Scope**: `interfaces/desktop/src/lib/sys/`
> **Prerequisites**: Sprint 0 complete (research decisions locked)
> **Estimated Tasks**: 18 tasks across 4 phases
> **Compact Checkpoint**: After Phase 2 (task 11)

---

## Goal

Build the platform backbone per FOUNDATION.md section 2.3. Create the contracts, registries, and directory structure that all other sprints depend on.

---

## Current State (Audit: 2026-01-25)

```
src/lib/sys/
├── app_state.svelte.ts     ✓ EXISTS (UI state singleton)
├── index.ts                ✓ EXISTS (barrel export)
├── cfg/                    ✓ EXISTS
│   ├── flags.ts            ✓ EXISTS (feature flags)
│   └── maestro/general.ts  ✓ EXISTS (AI config)
├── debug/                  ✓ EXISTS (VPB builder)
├── global/
│   └── runes/              ✓ EXISTS (global.svelte.ts)
├── contracts/              ✗ EMPTY
├── registries/             ✗ EMPTY
├── generated/              ✗ EMPTY
├── streams/                ✗ EMPTY
└── adapters/               ✗ EMPTY
```

---

## Phase 1: Contracts Layer

### Task 1.1: Create routes.contract.ts
- [ ] Create file: `src/lib/sys/contracts/routes.contract.ts`
- [ ] Verify TypeScript compiles without errors
- [ ] Verify exports are accessible from `$lib/sys/contracts`

**File Content:**

```typescript
/**
 * @file src/lib/sys/contracts/routes.contract.ts
 * @module @devpulse/sys/contracts/routes
 * @description Route type contracts for typed route generation
 */

/** Route parameter types */
export type RouteParamType = 'string' | 'number' | 'boolean';

/** Single route parameter definition */
export interface RouteParam {
  name: string;
  type: RouteParamType;
  optional: boolean;
  rest: boolean; // [...rest] params
}

/** Search parameter definition with defaults */
export interface SearchParamDef {
  type: RouteParamType;
  default?: string | number | boolean;
  required?: boolean;
}

/** Form action definition */
export interface FormActionDef {
  name: string;
  params?: Record<string, RouteParamType>;
}

/** Complete route metadata */
export interface RouteMetadata {
  /** Route path pattern e.g. '/devpulse/settings' */
  path: string;
  /** Route group e.g. '(app)' */
  group: string | null;
  /** Path parameters e.g. [id], [...rest] */
  params: RouteParam[];
  /** Search parameters with types and defaults */
  searchParams: Record<string, SearchParamDef>;
  /** Form actions from +page.server.ts */
  actions: FormActionDef[];
  /** Has +page.ts load function */
  hasLoad: boolean;
  /** Has +page.server.ts */
  hasServerLoad: boolean;
  /** Has +layout.ts */
  hasLayout: boolean;
}

/** Hub metadata for navigation grouping */
export interface HubMetadata {
  label: string;
  description: string;
  icon?: string;
}

/** Route inventory item for navigation */
export interface RouteInventoryItem {
  path: string;
  label: string;
  isIndex?: boolean;
  icon?: string;
  description?: string;
}

/** Route group in inventory */
export interface RouteGroupInventory {
  label: string;
  hubs?: Record<string, {
    label: string;
    description: string;
    icon?: string;
    routes: RouteInventoryItem[];
  }>;
  routes?: RouteInventoryItem[];
}

/** Complete routes inventory structure */
export interface RoutesInventory {
  groups: Record<string, RouteGroupInventory>;
  meta: {
    generated: string;
    routeCount: number;
    version: string;
  };
}

/** Route function overload types (for codegen) */
export type RouteFunction = {
  // Static routes
  (path: string): string;
  // Routes with path params
  (path: string, params: Record<string, string | number>): string;
  // Form actions
  (action: `${string} ${string}`, params?: Record<string, string | number>): string;
};
```

---

### Task 1.2: Create state.contract.ts
- [ ] Create file: `src/lib/sys/contracts/state.contract.ts`
- [ ] Verify TypeScript compiles without errors

**File Content:**

```typescript
/**
 * @file src/lib/sys/contracts/state.contract.ts
 * @module @devpulse/sys/contracts/state
 * @description State module contracts for domain state management
 */

/** State module metadata for registry */
export interface StateModuleMetadata {
  /** Module identifier e.g. 'devpulse.dashboard' */
  id: string;
  /** Namespace e.g. 'app' */
  namespace: string;
  /** Domain e.g. 'devpulse' */
  domain: string;
  /** Feature path within domain (optional) */
  feature?: string;
  /** File path relative to src/ */
  path: string;
  /** Exported state class/object name */
  exportName: string;
  /** State properties exposed */
  properties: StatePropertyDef[];
  /** Actions/methods exposed */
  actions: StateActionDef[];
}

/** State property definition */
export interface StatePropertyDef {
  name: string;
  type: string; // TypeScript type as string
  reactive: boolean; // Uses $state()
  derived: boolean; // Uses $derived()
  readonly: boolean;
}

/** State action definition */
export interface StateActionDef {
  name: string;
  params: Array<{ name: string; type: string }>;
  returnType: string;
  async: boolean;
}

/** State module contract - what a *.state.svelte.ts must export */
export interface StateModuleContract<T = unknown> {
  /** The singleton state instance */
  readonly state: T;
  /** Reset state to initial values */
  reset?(): void;
  /** Serialize state for persistence */
  serialize?(): string;
  /** Hydrate state from serialized data */
  hydrate?(data: string): void;
}

/** Domain state namespace pattern */
export type DomainStatePath = `domains/${string}/${string}/state/${string}.state.svelte.ts`;
```

---

### Task 1.3: Create registry.contract.ts
- [ ] Create file: `src/lib/sys/contracts/registry.contract.ts`
- [ ] Verify TypeScript compiles without errors

**File Content:**

```typescript
/**
 * @file src/lib/sys/contracts/registry.contract.ts
 * @module @devpulse/sys/contracts/registry
 * @description Registry contracts for runtime lookup systems
 */

import type { RouteMetadata, RoutesInventory } from './routes.contract.js';
import type { StateModuleMetadata } from './state.contract.js';
import type { StreamMetadata } from './streams.contract.js';

/** Base registry interface */
export interface Registry<T> {
  /** Get item by id */
  get(id: string): T | undefined;
  /** Check if item exists */
  has(id: string): boolean;
  /** Get all items */
  getAll(): Map<string, T>;
  /** Get all item ids */
  getIds(): string[];
  /** Register a new item */
  register(id: string, item: T): void;
  /** Unregister an item */
  unregister(id: string): boolean;
  /** Clear all items */
  clear(): void;
}

/** Routes registry contract */
export interface RoutesRegistry extends Registry<RouteMetadata> {
  /** Get route by path pattern */
  getByPath(path: string): RouteMetadata | undefined;
  /** Get routes by group */
  getByGroup(group: string): RouteMetadata[];
  /** Get routes for a hub */
  getByHub(hub: string): RouteMetadata[];
  /** Get the full inventory */
  getInventory(): RoutesInventory;
  /** Resolve a route with params */
  resolve(path: string, params?: Record<string, string | number>): string;
}

/** State registry contract */
export interface StateRegistry extends Registry<StateModuleMetadata> {
  /** Get state modules by namespace */
  getByNamespace(namespace: string): StateModuleMetadata[];
  /** Get state modules by domain */
  getByDomain(namespace: string, domain: string): StateModuleMetadata[];
  /** Get state module by feature path */
  getByFeature(namespace: string, domain: string, feature: string): StateModuleMetadata | undefined;
}

/** Streams registry contract */
export interface StreamsRegistry extends Registry<StreamMetadata> {
  /** Get streams by type */
  getByType(type: string): StreamMetadata[];
  /** Get active streams */
  getActive(): StreamMetadata[];
}

/** Registry events for reactivity */
export type RegistryEvent<T> =
  | { type: 'register'; id: string; item: T }
  | { type: 'unregister'; id: string }
  | { type: 'clear' };

/** Registry with event subscription */
export interface ObservableRegistry<T> extends Registry<T> {
  subscribe(callback: (event: RegistryEvent<T>) => void): () => void;
}
```

---

### Task 1.4: Create streams.contract.ts
- [ ] Create file: `src/lib/sys/contracts/streams.contract.ts`
- [ ] Verify TypeScript compiles without errors

**File Content:**

```typescript
/**
 * @file src/lib/sys/contracts/streams.contract.ts
 * @module @devpulse/sys/contracts/streams
 * @description Stream/subscription contracts for async data flows
 */

/** Stream status */
export type StreamStatus = 'idle' | 'connecting' | 'active' | 'paused' | 'error' | 'closed';

/** Stream metadata for registry */
export interface StreamMetadata {
  /** Stream identifier */
  id: string;
  /** Stream type e.g. 'websocket', 'sse', 'polling' */
  type: string;
  /** Source URL or identifier */
  source: string;
  /** Current status */
  status: StreamStatus;
  /** When stream was created */
  createdAt: Date;
  /** Last message timestamp */
  lastMessageAt?: Date;
  /** Error message if status is 'error' */
  error?: string;
}

/** Stream message envelope */
export interface StreamMessage<T = unknown> {
  id: string;
  type: string;
  payload: T;
  timestamp: Date;
  source: string;
}

/** Stream subscription handle */
export interface StreamSubscription {
  /** Unsubscribe from stream */
  unsubscribe(): void;
  /** Pause receiving messages */
  pause(): void;
  /** Resume receiving messages */
  resume(): void;
  /** Check if subscription is active */
  isActive(): boolean;
}

/** Stream contract - what a stream module must implement */
export interface StreamContract<T = unknown> {
  /** Stream metadata */
  readonly metadata: StreamMetadata;
  /** Subscribe to stream messages */
  subscribe(callback: (message: StreamMessage<T>) => void): StreamSubscription;
  /** Connect/start the stream */
  connect(): Promise<void>;
  /** Disconnect/stop the stream */
  disconnect(): Promise<void>;
  /** Send a message (for bidirectional streams) */
  send?(message: T): Promise<void>;
}

/** Stream factory for creating new streams */
export type StreamFactory<T = unknown> = (config: {
  id: string;
  source: string;
  options?: Record<string, unknown>;
}) => StreamContract<T>;
```

---

### Task 1.5: Create contracts index.ts
- [ ] Create file: `src/lib/sys/contracts/index.ts`
- [ ] Verify all contracts are re-exported

**File Content:**

```typescript
/**
 * @file src/lib/sys/contracts/index.ts
 * @module @devpulse/sys/contracts
 * @description Barrel export for all system contracts
 */

// Route contracts
export type {
  RouteParamType,
  RouteParam,
  SearchParamDef,
  FormActionDef,
  RouteMetadata,
  HubMetadata,
  RouteInventoryItem,
  RouteGroupInventory,
  RoutesInventory,
  RouteFunction,
} from './routes.contract.js';

// State contracts
export type {
  StateModuleMetadata,
  StatePropertyDef,
  StateActionDef,
  StateModuleContract,
  DomainStatePath,
} from './state.contract.js';

// Registry contracts
export type {
  Registry,
  RoutesRegistry,
  StateRegistry,
  StreamsRegistry,
  RegistryEvent,
  ObservableRegistry,
} from './registry.contract.js';

// Stream contracts
export type {
  StreamStatus,
  StreamMetadata,
  StreamMessage,
  StreamSubscription,
  StreamContract,
  StreamFactory,
} from './streams.contract.js';
```

---

## Phase 2: Registries Layer

### Task 2.1: Create base registry implementation
- [ ] Create file: `src/lib/sys/registries/base.registry.ts`
- [ ] Verify class implements Registry<T> contract

**File Content:**

```typescript
/**
 * @file src/lib/sys/registries/base.registry.ts
 * @module @devpulse/sys/registries/base
 * @description Base registry implementation with observable pattern
 */

import type { Registry, RegistryEvent, ObservableRegistry } from '../contracts/index.js';

/**
 * Base registry implementation
 * Uses Map for O(1) lookup, supports event subscription
 */
export class BaseRegistry<T> implements ObservableRegistry<T> {
  protected items = new Map<string, T>();
  protected listeners = new Set<(event: RegistryEvent<T>) => void>();

  get(id: string): T | undefined {
    return this.items.get(id);
  }

  has(id: string): boolean {
    return this.items.has(id);
  }

  getAll(): Map<string, T> {
    return new Map(this.items);
  }

  getIds(): string[] {
    return Array.from(this.items.keys());
  }

  register(id: string, item: T): void {
    this.items.set(id, item);
    this.emit({ type: 'register', id, item });
  }

  unregister(id: string): boolean {
    const existed = this.items.delete(id);
    if (existed) {
      this.emit({ type: 'unregister', id });
    }
    return existed;
  }

  clear(): void {
    this.items.clear();
    this.emit({ type: 'clear' });
  }

  subscribe(callback: (event: RegistryEvent<T>) => void): () => void {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  protected emit(event: RegistryEvent<T>): void {
    for (const listener of this.listeners) {
      listener(event);
    }
  }
}
```

---

### Task 2.2: Create routes.registry.ts
- [ ] Create file: `src/lib/sys/registries/routes.registry.ts`
- [ ] Verify implements RoutesRegistry contract

**File Content:**

```typescript
/**
 * @file src/lib/sys/registries/routes.registry.ts
 * @module @devpulse/sys/registries/routes
 * @description Routes registry for typed route lookup
 */

import type { RouteMetadata, RoutesInventory, RoutesRegistry as IRoutesRegistry } from '../contracts/index.js';
import { BaseRegistry } from './base.registry.js';

/**
 * Routes registry implementation
 * Populated by route generator, used by route() helper
 */
class RoutesRegistryImpl extends BaseRegistry<RouteMetadata> implements IRoutesRegistry {
  private inventory: RoutesInventory | null = null;
  private pathIndex = new Map<string, string>(); // path -> id

  getByPath(path: string): RouteMetadata | undefined {
    const id = this.pathIndex.get(path);
    return id ? this.get(id) : undefined;
  }

  getByGroup(group: string): RouteMetadata[] {
    return Array.from(this.items.values()).filter(r => r.group === group);
  }

  getByHub(hub: string): RouteMetadata[] {
    // Hub is derived from first path segment after group
    return Array.from(this.items.values()).filter(r => {
      const pathParts = r.path.split('/').filter(Boolean);
      return pathParts[0] === hub;
    });
  }

  getInventory(): RoutesInventory {
    if (!this.inventory) {
      throw new Error('Routes inventory not loaded. Run route generator first.');
    }
    return this.inventory;
  }

  setInventory(inventory: RoutesInventory): void {
    this.inventory = inventory;
  }

  resolve(path: string, params?: Record<string, string | number>): string {
    if (!params) return path;

    let resolved = path;
    for (const [key, value] of Object.entries(params)) {
      // Handle [param] syntax
      resolved = resolved.replace(`[${key}]`, String(value));
      // Handle [...rest] syntax
      resolved = resolved.replace(`[...${key}]`, String(value));
      // Handle [[optional]] syntax
      resolved = resolved.replace(`[[${key}]]`, String(value));
    }
    return resolved;
  }

  override register(id: string, item: RouteMetadata): void {
    super.register(id, item);
    this.pathIndex.set(item.path, id);
  }

  override unregister(id: string): boolean {
    const item = this.get(id);
    if (item) {
      this.pathIndex.delete(item.path);
    }
    return super.unregister(id);
  }

  override clear(): void {
    super.clear();
    this.pathIndex.clear();
    this.inventory = null;
  }
}

/** Singleton routes registry */
export const routesRegistry = new RoutesRegistryImpl();
```

---

### Task 2.3: Create state.registry.ts
- [ ] Create file: `src/lib/sys/registries/state.registry.ts`
- [ ] Verify implements StateRegistry contract

**File Content:**

```typescript
/**
 * @file src/lib/sys/registries/state.registry.ts
 * @module @devpulse/sys/registries/state
 * @description State modules registry for domain state lookup
 */

import type { StateModuleMetadata, StateRegistry as IStateRegistry } from '../contracts/index.js';
import { BaseRegistry } from './base.registry.js';

/**
 * State registry implementation
 * Tracks all *.state.svelte.ts modules across domains
 */
class StateRegistryImpl extends BaseRegistry<StateModuleMetadata> implements IStateRegistry {
  private namespaceIndex = new Map<string, Set<string>>(); // namespace -> ids
  private domainIndex = new Map<string, Set<string>>(); // namespace/domain -> ids

  getByNamespace(namespace: string): StateModuleMetadata[] {
    const ids = this.namespaceIndex.get(namespace);
    if (!ids) return [];
    return Array.from(ids).map(id => this.get(id)!).filter(Boolean);
  }

  getByDomain(namespace: string, domain: string): StateModuleMetadata[] {
    const key = `${namespace}/${domain}`;
    const ids = this.domainIndex.get(key);
    if (!ids) return [];
    return Array.from(ids).map(id => this.get(id)!).filter(Boolean);
  }

  getByFeature(namespace: string, domain: string, feature: string): StateModuleMetadata | undefined {
    const domainModules = this.getByDomain(namespace, domain);
    return domainModules.find(m => m.feature === feature);
  }

  override register(id: string, item: StateModuleMetadata): void {
    super.register(id, item);

    // Update namespace index
    if (!this.namespaceIndex.has(item.namespace)) {
      this.namespaceIndex.set(item.namespace, new Set());
    }
    this.namespaceIndex.get(item.namespace)!.add(id);

    // Update domain index
    const domainKey = `${item.namespace}/${item.domain}`;
    if (!this.domainIndex.has(domainKey)) {
      this.domainIndex.set(domainKey, new Set());
    }
    this.domainIndex.get(domainKey)!.add(id);
  }

  override unregister(id: string): boolean {
    const item = this.get(id);
    if (item) {
      this.namespaceIndex.get(item.namespace)?.delete(id);
      this.domainIndex.get(`${item.namespace}/${item.domain}`)?.delete(id);
    }
    return super.unregister(id);
  }

  override clear(): void {
    super.clear();
    this.namespaceIndex.clear();
    this.domainIndex.clear();
  }
}

/** Singleton state registry */
export const stateRegistry = new StateRegistryImpl();
```

---

### Task 2.4: Create streams.registry.ts
- [ ] Create file: `src/lib/sys/registries/streams.registry.ts`
- [ ] Verify implements StreamsRegistry contract

**File Content:**

```typescript
/**
 * @file src/lib/sys/registries/streams.registry.ts
 * @module @devpulse/sys/registries/streams
 * @description Streams registry for subscription management
 */

import type { StreamMetadata, StreamsRegistry as IStreamsRegistry } from '../contracts/index.js';
import { BaseRegistry } from './base.registry.js';

/**
 * Streams registry implementation
 * Manages active subscriptions and stream metadata
 */
class StreamsRegistryImpl extends BaseRegistry<StreamMetadata> implements IStreamsRegistry {
  private typeIndex = new Map<string, Set<string>>(); // type -> ids

  getByType(type: string): StreamMetadata[] {
    const ids = this.typeIndex.get(type);
    if (!ids) return [];
    return Array.from(ids).map(id => this.get(id)!).filter(Boolean);
  }

  getActive(): StreamMetadata[] {
    return Array.from(this.items.values()).filter(
      s => s.status === 'active' || s.status === 'connecting'
    );
  }

  override register(id: string, item: StreamMetadata): void {
    super.register(id, item);

    if (!this.typeIndex.has(item.type)) {
      this.typeIndex.set(item.type, new Set());
    }
    this.typeIndex.get(item.type)!.add(id);
  }

  override unregister(id: string): boolean {
    const item = this.get(id);
    if (item) {
      this.typeIndex.get(item.type)?.delete(id);
    }
    return super.unregister(id);
  }

  override clear(): void {
    super.clear();
    this.typeIndex.clear();
  }

  /** Update stream status */
  updateStatus(id: string, status: StreamMetadata['status'], error?: string): void {
    const item = this.get(id);
    if (item) {
      const updated: StreamMetadata = {
        ...item,
        status,
        error: status === 'error' ? error : undefined,
        lastMessageAt: status === 'active' ? new Date() : item.lastMessageAt,
      };
      this.items.set(id, updated);
    }
  }
}

/** Singleton streams registry */
export const streamsRegistry = new StreamsRegistryImpl();
```

---

### Task 2.5: Create registries index.ts
- [ ] Create file: `src/lib/sys/registries/index.ts`
- [ ] Verify all registries are exported

**File Content:**

```typescript
/**
 * @file src/lib/sys/registries/index.ts
 * @module @devpulse/sys/registries
 * @description Barrel export for all system registries
 */

export { BaseRegistry } from './base.registry.js';
export { routesRegistry } from './routes.registry.js';
export { stateRegistry } from './state.registry.js';
export { streamsRegistry } from './streams.registry.js';
```

---

## Phase 3: Directory Structure

### Task 3.1: Create generated/ directory structure
- [ ] Create directory: `src/lib/sys/generated/`
- [ ] Create placeholder: `src/lib/sys/generated/.gitkeep`
- [ ] Create README: `src/lib/sys/generated/README.md`

**README Content:**

```markdown
# sys/generated/

Machine-generated outputs. **Never hand-edit.**

## Files

| File | Generator | Purpose |
|------|-----------|---------|
| `ROUTES.ts` | `scripts/docs/generators/routes/` | Typed route helpers |
| `routes.inventory.json` | `scripts/docs/generators/routes/` | Hub-aware nav structure |

## Regeneration

```bash
pnpm routes:generate
```

## Rules

1. Do not edit files in this directory manually
2. Files are regenerated on:
   - Dev server start (via Vite plugin)
   - Pre-commit (via lefthook)
   - CI pipeline
3. Changes to route structure require regeneration
```

---

### Task 3.2: Create streams/ directory structure
- [ ] Create directory: `src/lib/sys/streams/`
- [ ] Create placeholder: `src/lib/sys/streams/.gitkeep`
- [ ] Create README: `src/lib/sys/streams/README.md`

**README Content:**

```markdown
# sys/streams/

Subscription boundary for async data flows.

## Purpose

Per FOUNDATION.md section 4.3:
- Subscription contracts
- Observers
- Long-lived async pipelines
- WebSocket/SSE stream implementations

## Usage

```typescript
import { createWebSocketStream } from '$lib/sys/streams/websocket.stream.js';

const stream = createWebSocketStream({
  id: 'maestro-events',
  source: 'ws://localhost:8080/events',
});

const sub = stream.subscribe((msg) => {
  console.log('Received:', msg);
});

// Later
sub.unsubscribe();
```

## Rules

1. All subscription logic MUST live here
2. Domains may NOT create their own streams
3. Register all streams in streamsRegistry
```

---

### Task 3.3: Create adapters/ directory structure
- [ ] Create directory: `src/lib/sys/adapters/`
- [ ] Create placeholder: `src/lib/sys/adapters/.gitkeep`
- [ ] Create README: `src/lib/sys/adapters/README.md`

**README Content:**

```markdown
# sys/adapters/

External integration boundary.

## Purpose

- API client wrappers
- Third-party SDK adapters
- Plugin interfaces
- External service boundaries

## Conventions

| File Pattern | Purpose |
|--------------|---------|
| `*.adapter.ts` | External service adapter |
| `*.client.ts` | API client implementation |
| `*.plugin.ts` | Plugin interface |

## Rules

1. All external API calls MUST go through adapters
2. Adapters handle error normalization
3. Adapters provide TypeScript types for external data
```

---

## Phase 4: Integration & Verification

### Task 4.1: Update sys/index.ts barrel export
- [ ] Update file: `src/lib/sys/index.ts`
- [ ] Export contracts, registries
- [ ] Verify imports work from `$lib/sys`

**File Content:**

```typescript
/**
 * @file src/lib/sys/index.ts
 * @module @devpulse/sys
 * @description System layer barrel export
 */

// Contracts (types only)
export type * from './contracts/index.js';

// Registries (singleton instances)
export { routesRegistry, stateRegistry, streamsRegistry, BaseRegistry } from './registries/index.js';

// Existing exports
export { appState } from './app_state.svelte.js';
export { flags } from './cfg/flags.js';
export type { FeatureFlags } from './cfg/flags.js';
```

---

### Task 4.2: Verify TypeScript compilation
- [ ] Run `pnpm check` in interfaces/desktop/src
- [ ] Ensure zero type errors in sys/ layer
- [ ] Ensure all contracts are properly typed

**Verification Command:**
```bash
cd interfaces/desktop/src && pnpm check
```

---

### Task 4.3: Verify imports work
- [ ] Create test file: `src/lib/sys/__tests__/contracts.test.ts`
- [ ] Verify contracts can be imported
- [ ] Verify registries can be instantiated

**Test File Content:**

```typescript
/**
 * @file src/lib/sys/__tests__/contracts.test.ts
 * @description Verification that sys contracts and registries work
 */

import type {
  RouteMetadata,
  StateModuleMetadata,
  StreamMetadata,
} from '../contracts/index.js';

import {
  routesRegistry,
  stateRegistry,
  streamsRegistry,
} from '../registries/index.js';

// Type-level verification
const _routeMeta: RouteMetadata = {
  path: '/devpulse',
  group: '(app)',
  params: [],
  searchParams: {},
  actions: [],
  hasLoad: true,
  hasServerLoad: false,
  hasLayout: false,
};

const _stateMeta: StateModuleMetadata = {
  id: 'devpulse.dashboard',
  namespace: 'app',
  domain: 'devpulse',
  path: 'domains/app/devpulse/state/dashboard.state.svelte.ts',
  exportName: 'dashboardState',
  properties: [],
  actions: [],
};

const _streamMeta: StreamMetadata = {
  id: 'maestro-events',
  type: 'websocket',
  source: 'ws://localhost:8080/events',
  status: 'idle',
  createdAt: new Date(),
};

// Runtime verification
console.log('Routes registry initialized:', routesRegistry.getIds().length);
console.log('State registry initialized:', stateRegistry.getIds().length);
console.log('Streams registry initialized:', streamsRegistry.getIds().length);

export { _routeMeta, _stateMeta, _streamMeta };
```

---

### Task 4.4: Update MASTER_SPRINT_PLAN.md
- [ ] Mark Sprint 1 tasks as complete in master plan
- [ ] Update status to COMPLETE

---

## Verification Checklist

After completing all tasks, verify:

- [ ] `src/lib/sys/contracts/` has 5 files (4 contracts + index)
- [ ] `src/lib/sys/registries/` has 5 files (4 registries + index)
- [ ] `src/lib/sys/generated/` exists with README
- [ ] `src/lib/sys/streams/` exists with README
- [ ] `src/lib/sys/adapters/` exists with README
- [ ] `src/lib/sys/index.ts` exports all contracts and registries
- [ ] `pnpm check` passes with zero errors
- [ ] All TypeScript types compile correctly

---

## Compact Checkpoint

**After completing Phase 2 (Task 2.5)**, this is a good point to:
1. Save all files
2. Run `pnpm check` to verify compilation
3. Compact if context is getting large
4. Resume with Phase 3

---

## Dependencies for Next Sprint

Sprint 2 (Routes Generator) requires:
- `RouteMetadata` type from `routes.contract.ts`
- `RoutesInventory` type from `routes.contract.ts`
- `routesRegistry` from `routes.registry.ts`

Sprint 3 (Routes Layer) requires:
- Sprint 2 complete (ROUTES.ts generated)
- `route()` helper function available

Sprint 4 (Domain APIs) requires:
- Sprint 1 complete (contracts available)
- `StateModuleMetadata` for index.ts exports
