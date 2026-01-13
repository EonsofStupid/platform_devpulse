# DevPulse Desktop - Svelte Frontend

> **AI Assistant:** Read CLAUDE.md at repo root for architecture rules. Types come from `shared/` via generated bindings.

## Quick Start

```bash
npm run tauri dev   # Development
npm run check       # Type checking
```

## Structure

```
src/lib/
├── layouts/            # DUMB (visual only)
│   ├── app/frame/
│   ├── chat/frame/
│   └── shared/
│       └── interactions/   # AI-callable popup components
│
├── domains/            # SMART (business logic)
│   ├── chat/
│   ├── app/
│   └── shared/
│
├── sys/                # System utilities
│   ├── commands/       # Tauri command wrappers
│   ├── events/         # Signal listeners
│   └── types/          # Generated from shared/
│
└── design-system/
```

## Architecture (from CLAUDE.md)

```
Svelte → invoke() → Tauri command → Engine → emits Signal
                                              ↓
                        Orchestrator subscribes (black box)
                                              ↓
                                    emits result Signal
                                              ↓
Svelte ← listen('signal') ← Wire sink ← Engine routes
```

## Types

Types are generated from `shared/` Rust crate. Never define types manually:

```typescript
// sys/types/index.ts - generated
export type { Signal, SignalKind, Source, Role, Component } from './generated';
```

## Layouts = DUMB

No logic, no API calls, no stores. Just slots:

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  let { header, content }: { header?: Snippet; content?: Snippet } = $props();
</script>

<div class="frame">
  {@render header?.()}
  {@render content?.()}
</div>
```

## Domains = SMART

Business logic, state, API calls:

```svelte
<script lang="ts">
  import { chatSend } from '$lib/sys/commands/chat';
  import { signalStore } from '$lib/sys/events/signals';

  let messages = $derived(signalStore.chat);
</script>
```

## Signal Listening

Subscribe to Wire sink signals:

```typescript
// sys/events/signals.ts
import { listen } from '@tauri-apps/api/event';
import type { Signal } from '$lib/sys/types';

export const signalStore = $state({ chat: [], health: [] });

listen<Signal>('signal', (event) => {
  const signal = event.payload;

  if (signal.kind.type === 'Chat') {
    signalStore.chat.push(signal);
  }
});
```

## Command Wrappers

Typed wrappers for Tauri commands:

```typescript
// sys/commands/chat.ts
import { invoke } from '@tauri-apps/api/core';

export async function chatSend(message: string): Promise<void> {
  return invoke('chat', { message });
}
```

## Interaction Popups

Pre-made glass components for AI to populate:

```
layouts/shared/interactions/
├── InteractionCard.svelte      # Container
├── InteractionChoice.svelte    # Multiple choice
├── InteractionInput.svelte     # Fill-in-blank
├── InteractionButtons.svelte   # True/False, actions
└── InteractionRenderer.svelte  # Dynamic renderer
```

These are real Tauri WebviewWindows (not inline modals). AI spawns them:

```typescript
await invoke('spawn_interaction', {
  interactionId: 'confirm-123',
  component: 'Choice'  // From shared/ Component enum
});
```

## Progressive Disclosure

All UI supports 3 layers (from CLAUDE.md):

| Layer | User Sees | Example |
|-------|-----------|---------|
| 1 | Simple result | "✅ Gus approved" |
| 2 | What was checked | "Patterns, secrets, files OK" |
| 3 | Technical details | "0.6B embedder, Qdrant similarity" |

Render Layer 1 by default, reveal 2/3 on click.

## Routes

```
src/routes/
├── +layout.svelte
├── +page.svelte
├── (app)/          # App window
├── (chat)/         # Chat window
└── (interaction)/  # Popup windows
    └── [id]/+page.svelte
```

## Common Tasks

**Add command wrapper:** `sys/commands/{domain}.ts`

**Add signal handler:** `sys/events/signals.ts`

**Add interaction component:** `layouts/shared/interactions/`

**Add domain logic:** `domains/{domain}/`
