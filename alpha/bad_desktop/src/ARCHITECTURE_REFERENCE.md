# DevPulse Desktop Architecture
**Hypermodular SvelteKit 5 + Tauri/Rust for Local-First Applications**

---

## Core Principles

1. **Peer Windows** — Chat and Dashboard are equal standalone windows, not parent-child
2. **Ports & Adapters** — Contracts define behavior, implementations are swappable
3. **Domain Isolation** — Each domain owns its shell, components, stores, types
4. **Shared Tools, Different UI** — Same functionality, domain-specific presentation

---

## Folder Structure

```
alpha/desktop/
├── src/
│   ├── app/                          # APPLICATION INFRASTRUCTURE
│   │   ├── ports/                    # Contracts (interfaces)
│   │   │   ├── ai.ts
│   │   │   ├── storage.ts
│   │   │   ├── capture.ts
│   │   │   └── voice.ts
│   │   │
│   │   ├── adapters/                 # Implementations
│   │   │   ├── ai/
│   │   │   │   ├── maestro/
│   │   │   │   │   ├── maestro.adapter.ts
│   │   │   │   │   ├── config.ts
│   │   │   │   │   └── ui/           # Maestro-specific UI (global)
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── minions/              # Expert sub-agents
│   │   │   │   ├── definitions/      # Trait configurations
│   │   │   │   ├── scope.ts          # global | project | specific
│   │   │   │   └── ui/
│   │   │   │
│   │   │   ├── ephemeral/            # One-off cloned agents
│   │   │   │   ├── templates/
│   │   │   │   └── runtime.ts
│   │   │   │
│   │   │   ├── storage/
│   │   │   │   ├── sqlite.adapter.ts
│   │   │   │   ├── cloud.adapter.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── capture/
│   │   │   │   ├── screenshot.adapter.ts
│   │   │   │   ├── video.adapter.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── voice/
│   │   │       ├── recognition.adapter.ts
│   │   │       ├── synthesis.adapter.ts
│   │   │       └── index.ts
│   │   │
│   │   └── adapters/                # Dependency injection / context
│   │       ├── ai.adapter.ts
│   │       ├── storage.adapter.ts
│   │       └── index.ts
│   │
│   ├── lib/
│   │   ├── domains/                  # BUSINESS DOMAINS
│   │   │   │
│   │   │   ├── chat/                 # Chat domain (peer window)
│   │   │   │   ├── components/
│   │   │   │   │   ├── ChatShell.svelte
│   │   │   │   │   ├── ChatTopbar.svelte
│   │   │   │   │   ├── ChatSidebar.svelte
│   │   │   │   │   ├── ChatViewport.svelte
│   │   │   │   │   ├── ChatInputbar.svelte
│   │   │   │   │   ├── ChatStatusbar.svelte    # capture icon here
│   │   │   │   │   ├── MessageList.svelte
│   │   │   │   │   ├── ChatInput.svelte
│   │   │   │   │   └── index.ts
│   │   │   │   ├── stores/
│   │   │   │   │   ├── chat.svelte.ts
│   │   │   │   │   └── index.ts
│   │   │   │   ├── types/
│   │   │   │   │   ├── message.ts
│   │   │   │   │   ├── conversation.ts
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts          # Public API
│   │   │   │
│   │   │   ├── dashboard/            # Dashboard domain (peer window)
│   │   │   │   ├── components/
│   │   │   │   │   ├── DashboardShell.svelte
│   │   │   │   │   ├── DashboardToolbar.svelte # camera icon here
│   │   │   │   │   ├── DashboardSidebar.svelte
│   │   │   │   │   ├── DashboardViewport.svelte
│   │   │   │   │   └── index.ts
│   │   │   │   ├── stores/
│   │   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── cortex/               # AI reasoning visualization
│   │   │   │   ├── components/
│   │   │   │   ├── stores/
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   └── settings/             # Settings domain
│   │   │       ├── components/
│   │   │       ├── stores/
│   │   │       └── index.ts
│   │   │
│   │   ├── shared/                   # SHARED UTILITIES
│   │   │   ├── api/                  # Tauri invoke wrappers
│   │   │   │   ├── window.ts
│   │   │   │   ├── invoke.ts
│   │   │   │   └── index.ts
│   │   │   ├── utils/
│   │   │   │   ├── format.ts
│   │   │   │   └── index.ts
│   │   │   └── types/
│   │   │       └── common.ts
│   │   │
│   │   └── design-system/            # DESIGN TOKENS & PRIMITIVES
│   │       ├── tokens/
│   │       │   ├── colors.css
│   │       │   ├── spacing.css
│   │       │   ├── typography.css
│   │       │   └── index.css
│   │       ├── primitives/
│   │       │   ├── Button.svelte
│   │       │   ├── Glass.svelte
│   │       │   ├── Icon.svelte
│   │       │   └── index.ts
│   │       └── themes/
│   │           ├── dark.css
│   │           └── light.css
│   │
│   ├── routes/                       # ROUTE ENTRY POINTS
│   │   ├── +layout.svelte            # Root layout (main window)
│   │   │
│   │   ├── (app)/                    # Main window routes
│   │   │   ├── +layout.svelte
│   │   │   ├── +page.svelte          # Dashboard home
│   │   │   └── settings/
│   │   │       └── +page.svelte
│   │   │
│   │   └── domains/                  # Standalone window routes
│   │       └── chat/
│   │           ├── +layout@.svelte   # Breaks layout inheritance
│   │           ├── +page.svelte      # Composes chat domain
│   │           └── tabs/             # Tab-based sub-routes
│   │               ├── +layout.svelte
│   │               ├── projects/
│   │               │   └── +page.svelte
│   │               └── history/
│   │                   └── +page.svelte
│   │
│   ├── app.css                       # Global styles
│   └── app.html                      # HTML template
│
└── src-tauri/                        # RUST BACKEND
    ├── src/
    │   ├── commands/                 # Tauri commands by domain
    │   │   ├── chat.rs
    │   │   ├── window.rs
    │   │   ├── capture.rs
    │   │   └── mod.rs
    │   │
    │   ├── plugins/                  # Custom Tauri plugins
    │   │   ├── licensing/
    │   │   │   ├── src/
    │   │   │   │   ├── lib.rs
    │   │   │   │   └── commands.rs
    │   │   │   └── Cargo.toml
    │   │   └── analytics/
    │   │
    │   ├── lib.rs
    │   └── main.rs
    │
    ├── capabilities/                 # Per-window permissions
    │   ├── main-window.json
    │   ├── chat-window.json
    │   └── default.json
    │
    └── tauri.conf.json
```

---

## Ports & Adapters Pattern

### Port (Contract)

```typescript
// src/app/ports/ai.ts
export interface AIPort {
  chat(messages: Message[]): AsyncIterable<string>;
  complete(prompt: string): Promise<string>;
  abort(): void;
}

export interface MinionPort {
  id: string;
  traits: MinionTraits;
  scope: 'global' | 'project' | 'specific';
  execute(task: Task): Promise<Result>;
  spawn(): EphemeralAgent;
}

export interface EphemeralPort {
  parentId: string;
  task: Task;
  execute(): Promise<Result>;
  save(): Promise<MinionPort>;  // Persist as reusable minion
}
```

### Adapter (Implementation)

```typescript
// src/app/adapters/ai/maestro/maestro.adapter.ts
import type { AIPort } from '$app/ports/ai';
import { invoke } from '@tauri-apps/api/core';

export class MaestroAdapter implements AIPort {
  private abortController: AbortController | null = null;

  async *chat(messages: Message[]): AsyncIterable<string> {
    this.abortController = new AbortController();

    const stream = await invoke<ReadableStream>('maestro_chat', {
      messages,
      signal: this.abortController.signal
    });

    for await (const chunk of stream) {
      yield chunk;
    }
  }

  async complete(prompt: string): Promise<string> {
    return invoke('maestro_complete', { prompt });
  }

  abort(): void {
    this.abortController?.abort();
  }
}
```

### Adapter (Dependency Injection)

```typescript
// src/app/adapters/ai.adapter.ts
import { getContext, setContext } from 'svelte';
import type { AIPort } from '$app/ports/ai';
import { MaestroAdapter } from '$app/adapters/ai/maestro/maestro.adapter';

const AI_KEY = Symbol('ai');

export function provideAI(adapter: AIPort = new MaestroAdapter()) {
  setContext(AI_KEY, adapter);
}

export function useAI(): AIPort {
  return getContext<AIPort>(AI_KEY);
}
```

---

## AI Architecture

### Hierarchy

```
Maestro (Orchestrator)
    │
    ├── Minion A (Expert: Code Review)     ← Persistent, defined traits
    │       │
    │       └── Ephemeral Agent            ← One-off clone for specific task
    │
    ├── Minion B (Expert: Documentation)
    │
    └── Minion C (Expert: Testing)
```

### Scope System

```typescript
// src/app/adapters/minions/scope.ts
export type MinionScope =
  | { type: 'global' }                           // Available everywhere
  | { type: 'project'; projectId: string }       // Single project
  | { type: 'projects'; projectIds: string[] }   // Multiple projects
  | { type: 'specific'; contextId: string };     // Specific context only

export interface MinionDefinition {
  id: string;
  name: string;
  traits: {
    expertise: string[];
    personality: string;
    constraints: string[];
  };
  scope: MinionScope;
  persistent: boolean;
}
```

### Ephemeral Agent Lifecycle

```typescript
// src/app/adapters/ephemeral/runtime.ts
export class EphemeralAgent {
  constructor(
    private parent: MinionDefinition,
    private task: Task
  ) {}

  // Clones parent traits, executes task, then dies
  async execute(): Promise<Result> {
    const context = this.inheritTraits();
    const result = await this.runTask(context);
    return result;
  }

  // Option to save as new persistent minion
  async persist(name: string): Promise<MinionDefinition> {
    return {
      id: generateId(),
      name,
      traits: this.parent.traits,
      scope: { type: 'global' },
      persistent: true
    };
  }
}
```

---

## Domain Module Pattern

### Public API (Barrel Export)

```typescript
// src/lib/domains/chat/index.ts

// Components - only export what's needed externally
export { default as ChatShell } from './components/ChatShell.svelte';
export { default as ChatInput } from './components/ChatInput.svelte';
export { default as MessageList } from './components/MessageList.svelte';

// Stores
export { chatStore } from './stores/chat.svelte';

// Types
export type { Message, Conversation, ChatMode } from './types';
```

### Store Pattern (Svelte 5 Runes)

```typescript
// src/lib/domains/chat/stores/chat.svelte.ts
import type { Message, ChatMode, ConnectionStatus } from '../types';

function createChatStore() {
  let messages = $state<Message[]>([]);
  let mode = $state<ChatMode>('chat');
  let connectionStatus = $state<ConnectionStatus>('disconnected');
  let isThinking = $state(false);

  // Derived
  const unreadCount = $derived(messages.filter(m => !m.read).length);
  const isConnected = $derived(connectionStatus === 'connected');

  return {
    // Getters
    get messages() { return messages; },
    get mode() { return mode; },
    get connectionStatus() { return connectionStatus; },
    get isThinking() { return isThinking; },
    get unreadCount() { return unreadCount; },
    get isConnected() { return isConnected; },

    // Actions
    addMessage(message: Message) {
      messages = [...messages, message];
    },
    setMode(newMode: ChatMode) {
      mode = newMode;
    },
    setConnectionStatus(status: ConnectionStatus) {
      connectionStatus = status;
    },
    setThinking(value: boolean) {
      isThinking = value;
    },
    clear() {
      messages = [];
    }
  };
}

export const chatStore = createChatStore();
```

---

## Shared Tools, Different UI

### Tool Logic (Adapter)

```typescript
// src/app/adapters/capture/screenshot.adapter.ts
import { invoke } from '@tauri-apps/api/core';

export const captureAdapter = {
  async screenshot(): Promise<string> {
    return invoke('capture_screenshot');
  },

  async video(duration: number): Promise<string> {
    return invoke('capture_video', { duration });
  }
};
```

### Dashboard Presentation

```svelte
<!-- src/lib/domains/dashboard/components/DashboardToolbar.svelte -->
<script lang="ts">
  import { captureAdapter } from '$app/adapters/capture';
  import { CameraIcon } from '$lib/design-system/primitives';
</script>

<div class="toolbar">
  <button class="tool-btn" onclick={() => captureAdapter.screenshot()}>
    <CameraIcon size={16} />
  </button>
</div>

<style>
  .tool-btn {
    padding: var(--dp-space-2);
    background: var(--dp-surface-2);
    border-radius: var(--dp-radius-md);
  }
</style>
```

### Chat Presentation

```svelte
<!-- src/lib/domains/chat/components/ChatStatusbar.svelte -->
<script lang="ts">
  import { captureAdapter } from '$app/adapters/capture';
  import { CameraIcon } from '$lib/design-system/primitives';
</script>

<div class="statusbar">
  <span class="metrics">512 tokens</span>

  <div class="actions">
    <button class="mini-action" onclick={() => captureAdapter.screenshot()}>
      <CameraIcon size={12} />
    </button>
  </div>
</div>

<style>
  .statusbar {
    display: flex;
    justify-content: space-between;
    padding: var(--dp-space-1) var(--dp-space-2);
    font-size: 0.625rem;
  }

  .mini-action {
    padding: var(--dp-space-1);
    opacity: 0.6;
  }
  .mini-action:hover {
    opacity: 1;
  }
</style>
```

---

## Route Assembly

### Standalone Chat Window

```svelte
<!-- src/routes/domains/chat/+page.svelte -->
<script lang="ts">
  import { ChatShell, ChatTopbar, ChatSidebar, ChatViewport, ChatInputbar, ChatStatusbar } from '$lib/domains/chat';
  import { provideAI } from '$app/adapters/ai.adapter';

  provideAI();
</script>

<ChatShell>
  {#snippet topbar()}
    <ChatTopbar />
  {/snippet}

  {#snippet sidebar()}
    <ChatSidebar />
  {/snippet}

  {#snippet viewport()}
    <ChatViewport />
  {/snippet}

  {#snippet inputbar()}
    <ChatInputbar />
  {/snippet}

  {#snippet statusbar()}
    <ChatStatusbar />
  {/snippet}
</ChatShell>
```

### Layout Break for Standalone Window

```svelte
<!-- src/routes/domains/chat/+layout@.svelte -->
<script lang="ts">
  import '../../../app.css';
  let { children } = $props();
</script>

<div class="window-root">
  {@render children()}
</div>

<style>
  .window-root {
    height: 100vh;
    overflow: hidden;
  }
</style>
```

---

## Naming Conventions

### Files

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `ChatShell.svelte` |
| Stores | kebab-case + .svelte.ts | `chat.svelte.ts` |
| Types | kebab-case | `message.ts` |
| Adapters | kebab-case + .adapter.ts | `maestro.adapter.ts` |
| Ports | kebab-case | `ai.ts` |
| Barrel exports | index.ts | `index.ts` |

### CSS Classes (Scoped)

```svelte
<div class="shell">
  <header class="topbar">
  <aside class="sidebar" data-position="left" data-state="open">
  <main class="viewport">
  <footer class="statusbar">
</div>

<style>
  .shell { }
  .topbar { }
  .sidebar { }
  .sidebar[data-position="left"] { }
  .sidebar[data-state="open"] { }
  .viewport { }
  .statusbar { }
</style>
```

### Data Attributes for State

```svelte
<button
  class="btn"
  data-variant="primary"
  data-size="md"
  data-state={loading ? 'loading' : 'idle'}
>
```

### CSS Custom Properties

```css
/* Global tokens */
:root {
  --dp-space-1: 0.25rem;
  --dp-radius-md: 0.5rem;
  --dp-accent-primary: oklch(65% 0.2 250);
}

/* Component-scoped theming */
.glass {
  --glass-hue: var(--dp-accent-primary);
  --glass-intensity: 0.1;
  background: oklch(from var(--glass-hue) l c h / var(--glass-intensity));
}
```

---

## Tauri Configuration

### Multi-Window Setup

```json
{
  "windows": [
    {
      "label": "main",
      "title": "DevPulse",
      "width": 1200,
      "height": 800,
      "url": "/"
    },
    {
      "label": "chat",
      "title": "Maestro",
      "width": 420,
      "height": 680,
      "url": "/domains/chat",
      "decorations": false,
      "alwaysOnTop": true,
      "visible": false,
      "resizable": true,
      "minWidth": 320,
      "minHeight": 400
    }
  ]
}
```

### Per-Window Capabilities

```json
// capabilities/chat-window.json
{
  "identifier": "chat-window",
  "windows": ["chat"],
  "permissions": [
    "core:window:allow-close",
    "core:window:allow-set-always-on-top",
    "core:window:allow-start-dragging",
    "chat:allow-send-message",
    "chat:allow-get-history",
    "capture:allow-screenshot"
  ]
}
```

---

*Generated: 2026-01-12*
