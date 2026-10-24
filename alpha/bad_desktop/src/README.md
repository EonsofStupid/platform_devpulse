# DevPulse Desktop - Source Architecture

## SSOT: Single Source of Truth

**ALL domain logic, components, stores, services, and types MUST live in:**

```
src/lib/domains/
```

**Routes (`src/routes/`) are THIN WRAPPERS ONLY.**

---

## Directory Structure

```
src/
├── lib/
│   ├── domains/           # SSOT - All domain modules
│   │   ├── chat/          # Chat/Maestro domain
│   │   │   ├── components/
│   │   │   │   ├── ChatInput.svelte
│   │   │   │   ├── ChatOverlay.svelte
│   │   │   │   ├── ChatView.svelte
│   │   │   │   ├── DebugPanel.svelte
│   │   │   │   ├── MaestroFab.svelte
│   │   │   │   ├── MessageList.svelte
│   │   │   │   ├── TaskPanel.svelte
│   │   │   │   └── index.ts
│   │   │   ├── stores/
│   │   │   │   ├── chat.svelte.ts
│   │   │   │   └── index.ts
│   │   │   ├── services/
│   │   │   │   ├── api.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── dashboard/     # Dashboard domain
│   │   ├── devspace/      # DevSpace domain
│   │   ├── projects/      # Projects management
│   │   ├── thinkspace/    # AI thinking visualization
│   │   ├── general/       # General quick actions
│   │   ├── pulse/         # Real-time activity feed
│   │   ├── howto/         # Guides and documentation
│   │   ├── media/         # Audio/video playback
│   │   ├── news/          # Updates and announcements
│   │   ├── gallery/       # Screen captures with AI vision
│   │   ├── wiredfront/    # Screen capture tool
│   │   └── cortex/        # Cortex/ThoughtGraph
│   │
│   ├── api/               # Tauri command wrappers
│   ├── stores/            # Global stores (ruminationState, voiceStore, taskStore)
│   ├── layout/            # Layout components (Sidebar, etc.)
│   ├── styles/            # Global styles and tokens
│   └── utils/             # Shared utilities
│
├── routes/                # SvelteKit routes - THIN WRAPPERS ONLY
│   └── domains/
│       ├── chat/
│       │   └── +page.svelte       # <ChatView />
│       ├── devspace/
│       │   └── +page.svelte       # <DevSpaceView />
│       ├── workspace/
│       │   ├── projects/
│       │   │   └── +page.svelte   # <ProjectsView />
│       │   └── thinkspace/
│       │       └── +page.svelte   # <ThinkspaceView />
│       └── global/
│           ├── general/
│           │   └── +page.svelte   # <GeneralView />
│           ├── pulse/
│           │   ├── +page.svelte   # <PulseView />
│           │   ├── howto/
│           │   │   └── +page.svelte
│           │   ├── media/
│           │   │   └── +page.svelte
│           │   └── news/
│           │       └── +page.svelte
│           └── tools/
│               ├── gallery/
│               │   └── +page.svelte
│               └── wiredfront/
│                   └── +page.svelte
│
└── README.md              # THIS FILE
```

---

## Domain Module Pattern

Each domain in `lib/domains/` follows this structure:

```
domain-name/
├── components/            # Svelte components
│   ├── ComponentName.svelte
│   └── index.ts           # Barrel export
├── stores/                # Svelte 5 runes stores
│   ├── storeName.svelte.ts
│   └── index.ts
├── services/              # API calls, business logic
│   ├── api.ts
│   └── index.ts
├── types/                 # TypeScript types/interfaces
│   └── index.ts
└── index.ts               # Domain barrel export
```

### Domain index.ts Example:

```typescript
/**
 * Domain Name - Self-contained module
 *
 * Usage:
 *   import { DomainView, domainStore } from '$lib/domains/domain-name';
 *   import type { DomainType } from '$lib/domains/domain-name';
 */

// Components
export * from './components';

// Stores
export { domainStore } from './stores';

// Services
export { serviceFunction } from './services';

// Types
export type { DomainType } from './types';
```

---

## Route Pattern

Routes are THIN WRAPPERS that import from SSOT:

```svelte
<script lang="ts">
  /**
   * DomainName Page
   */
  import { DomainView } from '$lib/domains/domain-name';
</script>

<DomainView />
```

**DO NOT put logic in routes. Routes only:**
1. Import the view component from `lib/domains/`
2. Render it
3. Optionally set `<svelte:head>` for page title

---

## Import Rules

### DO:
```typescript
import { ChatView, chatStore } from '$lib/domains/chat';
import { ruminationState, voiceStore } from '$lib/stores';
import { someApiCall } from '$lib/api/window';
```

### DO NOT:
```typescript
// WRONG - importing from routes
import ChatView from '../../../routes/domains/chat/ChatView.svelte';

// WRONG - importing from features (deprecated)
import { SomeView } from '$lib/features/something';
```

---

## Migration Checklist

When moving code from routes to SSOT:

- [ ] Create domain folder in `lib/domains/`
- [ ] Create `components/`, `stores/`, `services/`, `types/` subfolders as needed
- [ ] Move all component logic to `components/`
- [ ] Move all state management to `stores/`
- [ ] Move all API calls to `services/`
- [ ] Move all types to `types/`
- [ ] Create barrel exports (`index.ts` in each folder)
- [ ] Update route to be thin wrapper importing from SSOT
- [ ] Remove any inline logic from route files

---

## Current Domain Status

| Domain | SSOT Status | Route Status |
|--------|-------------|--------------|
| chat | Complete | Needs cleanup |
| dashboard | Partial | N/A |
| devspace | MISSING | Has inline code |
| projects | MISSING | Has inline code |
| thinkspace | In features/ | Needs move |
| general | MISSING | Has inline code |
| pulse | In features/ | Needs move |
| howto | In features/ | Needs move |
| media | In features/ | Needs move |
| news | In features/ | Needs move |
| gallery | In features/ | Needs move |
| wiredfront | MISSING | Has inline code |
| cortex | Partial | N/A |

---

## Naming Conventions

- Domain folders: `kebab-case` (e.g., `think-space` -> `thinkspace`)
- Components: `PascalCase.svelte` (e.g., `ChatView.svelte`)
- Stores: `camelCase.svelte.ts` (e.g., `chat.svelte.ts`)
- Services: `camelCase.ts` (e.g., `api.ts`)
- Types: `PascalCase` (e.g., `Message`, `ChatMode`)

**NO "Window" suffix in component names.** Keep names simple:
- `ChatView.svelte` (NOT `ChatWindowView.svelte`)
- `DevSpaceView.svelte` (NOT `DevSpacePageView.svelte`)

---

## Store Pattern (Svelte 5 Runes)

```typescript
// stores/storeName.svelte.ts
class StoreName {
  // State with runes
  items = $state<Item[]>([]);
  loading = $state(false);
  error = $state<string | null>(null);

  // Derived values
  get filteredItems() {
    return this.items.filter(/* ... */);
  }

  // Actions
  async loadItems(): Promise<void> {
    this.loading = true;
    try {
      this.items = await fetchItems();
    } catch (e) {
      this.error = e instanceof Error ? e.message : String(e);
    } finally {
      this.loading = false;
    }
  }
}

export const storeName = new StoreName();
```

---

## Pre-Release Checklist

Before any release:

1. [ ] All domain logic in `lib/domains/`
2. [ ] No inline code in routes (thin wrappers only)
3. [ ] All imports use `$lib/domains/` paths
4. [ ] No imports from `$lib/features/` (deprecated)
5. [ ] All barrel exports working
6. [ ] Build passes: `npm run build`
7. [ ] Type check passes: `npm run check`
