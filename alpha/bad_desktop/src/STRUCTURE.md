# DevPulse Desktop Structure

## Core Concept

```
LAYOUT (dumb)     →  Visual shell, borders, glass, slots
DOMAIN (smart)    →  Actual content, logic, features
ROUTE (wiring)    →  Connects layout + domain together
```

---

## Windows

| Window | Purpose | Route |
|--------|---------|-------|
| **App** | Main dashboard, ThinkSpace, DevSpace | `/` |
| **Chat** | Maestro chat, standalone peer window | `/domains/chat` |

---

## Interactions (Universal - NOT a window)

**Interactions = AI-callable interactive component system**

Interactions are universal building blocks that maximize UI touchpoints during chat/planning. Goal: reduce user typing by providing clickable choices, buttons, and selections. Collect COSTAR-style structured input and track selections as baseline configurations for different modes.

### Interactive Components (Dumb - in layouts/shared/interactions/)
| Component | Purpose |
|-----------|---------|
| `InteractionCard.svelte` | Container with various size variants |
| `InteractionImage.svelte` | Image with interactivity, animations, zoom |
| `InteractionButtons.svelte` | Yes/No, True/False button pairs |
| `InteractionChoice.svelte` | Multiple choice (radio/checkbox) |
| `InteractionInput.svelte` | Text input with "Other" option |
| `InteractionActions.svelte` | Action buttons (submit, cancel, etc.) |

### Variants (via data attributes)
```svelte
<InteractionCard data-size="sm|md|lg|full" data-variant="default|highlight|warning">
<InteractionButtons data-type="yes-no|true-false|confirm-cancel">
<InteractionChoice data-mode="single|multi" data-layout="vertical|horizontal">
```

### AI Usage Pattern
```typescript
// AI can call to render dynamic content - user clicks instead of typing
{
  type: 'interaction-card',
  size: 'md',
  content: [
    { type: 'image', src: '...', interactive: true },
    { type: 'choice', options: ['Option A', 'Option B', 'Other'], allowOther: true },
    { type: 'buttons', variant: 'yes-no' }
  ],
  // User selections tracked for COSTAR baseline configs
  onResponse: (selections) => recordForMode(selections)
}
```

---

## Chat Window Complexity

### Visual Hierarchy (top to bottom)
```
┌─────────────────────────────────────────────┐
│  TABS (2+ tabs ABOVE topbar)                │
├─────────────────────────────────────────────┤
│  TOPBAR                                     │
│  ┌─────┬─────────────────────┬─────────┐    │
│  │ L   │      CENTER         │    R    │    │
│  │     │                     │         │    │
│  │ ico │  buttons/indicators │  mode   │    │
│  │ ns  │  (stacked, tooltip) │  user   │    │
│  └─────┴─────────────────────┴─────────┘    │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────┐                         ┌─────┐    │
│  │     │                         │     │    │
│  │  L  │      MESSAGE LIST       │  R  │    │
│  │  S  │                         │  S  │    │
│  │  I  │                         │  L  │    │
│  │  D  │                         │  O  │    │
│  │  E  │                         │  T  │    │
│  │     │                         │  S  │    │
│  └─────┘                         └─────┘    │
│         (3-4 CIRCLE MENUS wrap around)      │
│                                             │
├─────────────────────────────────────────────┤
│  MESSAGE INPUT                              │
├─────────────────────────────────────────────┤
│  BOTTOMBAR / STATUSBAR                      │
└─────────────────────────────────────────────┘
```

### Chat-Specific Requirements

**Tabs (above topbar)**
- Minimum 2 tabs
- Tab bar sits ABOVE the topbar
- Tabs control which "mode" or "view" chat is in

**Topbar**
- Left: Icons, status indicators
- Center: Buttons, stacked indicators with tooltips
- Right: Mode selector, user badge
- **Separate CSS** for chat-specific color tints

**Circle Menus (3-4)**
- Wrap around message area as available slots
- Quick access actions
- Contextual based on selection/state

**Indicators**
- Can stack (multiple indicators in one spot)
- Mouseover reveals tooltip
- Tooltips: variety, beautiful, color-coded

**Tooltips (global system)**
- Multiple variants (info, warning, success, error)
- Glass styling
- Color-coded per context
- Position-aware (doesn't clip viewport)

---

## Global Toast/Notification System

**Every action = visual confirmation**

### Toast Variants
| Variant | Color | Use Case |
|---------|-------|----------|
| `success` | Green | Action completed |
| `error` | Red | Action failed |
| `warning` | Orange | Needs attention |
| `info` | Blue | Informational |
| `loading` | Accent | In progress |

### Toast Features
- Color-coded by variant
- Stacks in corner (configurable position)
- Auto-dismiss with progress bar
- Click to dismiss
- Action buttons (undo, retry, etc.)
- Glass styling consistent with app

### Usage Pattern
```typescript
// Every action shows confirmation
async function saveNote() {
  toast.loading('Saving note...');
  try {
    await devspaceStore.saveNote(note);
    toast.success('Note saved');
  } catch (e) {
    toast.error('Failed to save note');
  }
}
```

---

## Tauri Adapters (Rust Side)

**Note:** "Adapters" live in Tauri/Rust, NOT SvelteKit. The boundary between Tauri and Svelte IS the abstraction layer.

```
src-tauri/
├── src/
│   ├── adapters/                    # Business logic implementations
│   │   ├── ai/
│   │   │   ├── maestro.rs
│   │   │   └── mod.rs
│   │   ├── storage/
│   │   │   ├── sqlite.rs
│   │   │   └── mod.rs
│   │   ├── capture/
│   │   │   └── mod.rs
│   │   └── mod.rs
│   │
│   ├── commands/                    # Tauri command handlers
│   │   ├── chat.rs
│   │   ├── window.rs
│   │   ├── storage.rs
│   │   └── mod.rs
│   │
│   └── lib.rs
```

### SvelteKit consumes via invoke
```typescript
// SvelteKit just calls Tauri commands
// No "adapters" folder in SvelteKit
import { invoke } from '@tauri-apps/api/core';

export async function saveNote(note: Note) {
  return invoke('save_note', { note });
}
```

---

## Folder Structure

```
src/
├── lib/
│   ├── sys/                                    # APPLICATION LAYER
│   │   ├── settings/
│   │   │   ├── settings.svelte.ts
│   │   │   └── index.ts
│   │   ├── theme/
│   │   │   ├── theme.svelte.ts
│   │   │   └── index.ts
│   │   ├── commands/                           # Intent routing (chat→app)
│   │   │   ├── router.ts
│   │   │   └── intents.ts
│   │   └── index.ts
│   │
│   ├── layouts/                                # VISUAL SHELLS (dumb)
│   │   ├── app/
│   │   │   ├── frame/
│   │   │   │   ├── AppFrame.svelte             # Root container
│   │   │   │   ├── topbar/
│   │   │   │   │   ├── Topbar.svelte
│   │   │   │   │   └── topbar.css              # App-specific tints
│   │   │   │   ├── leftsidebar/
│   │   │   │   │   └── LeftSidebar.svelte
│   │   │   │   ├── main/
│   │   │   │   │   └── Main.svelte
│   │   │   │   ├── statusbar/
│   │   │   │   │   └── Statusbar.svelte
│   │   │   │   └── index.ts
│   │   │   ├── components/
│   │   │   │   ├── GlassPanel.svelte
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── chat/
│   │   │   ├── frame/
│   │   │   │   ├── ChatFrame.svelte            # Root container
│   │   │   │   ├── tabbar/                     # ABOVE topbar
│   │   │   │   │   ├── TabBar.svelte           # 2+ tabs
│   │   │   │   │   └── tabbar.css
│   │   │   │   ├── topbar/
│   │   │   │   │   ├── Topbar.svelte
│   │   │   │   │   ├── topbar.css              # Chat-specific tints
│   │   │   │   │   ├── left/
│   │   │   │   │   │   └── TopbarLeft.svelte   # Icons slot
│   │   │   │   │   ├── center/
│   │   │   │   │   │   └── TopbarCenter.svelte # Buttons/indicators slot
│   │   │   │   │   └── right/
│   │   │   │   │       └── TopbarRight.svelte  # Mode/user slot
│   │   │   │   ├── leftsidebar/
│   │   │   │   │   └── LeftSidebar.svelte
│   │   │   │   ├── rightsidebar/               # Invisible slots
│   │   │   │   │   └── RightSidebar.svelte
│   │   │   │   ├── messagelist/
│   │   │   │   │   └── MessageList.svelte      # Scroll container
│   │   │   │   ├── messageinput/
│   │   │   │   │   └── MessageInput.svelte     # Input frame
│   │   │   │   ├── bottombar/
│   │   │   │   │   └── Bottombar.svelte
│   │   │   │   ├── circlemenus/                # 3-4 radial menus
│   │   │   │   │   ├── CircleMenu.svelte       # Reusable radial
│   │   │   │   │   ├── CircleMenuSlot.svelte   # Position wrapper
│   │   │   │   │   └── circlemenus.css
│   │   │   │   └── index.ts
│   │   │   ├── components/
│   │   │   │   ├── GlassPanel.svelte
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── shared/                             # Shared layout pieces
│   │       ├── tooltips/                       # Global tooltip system
│   │       │   ├── Tooltip.svelte
│   │       │   ├── TooltipAdapter.svelte
│   │       │   ├── tooltips.css                # Variants, colors
│   │       │   └── index.ts
│   │       ├── indicators/                     # Stackable indicators
│   │       │   ├── Indicator.svelte
│   │       │   ├── IndicatorStack.svelte
│   │       │   └── index.ts
│   │       ├── toasts/                         # Global toast/notification system
│   │       │   ├── Toast.svelte                # Single toast
│   │       │   ├── ToastContainer.svelte       # Positions toasts
│   │       │   ├── ToastAdapter.svelte        # Global context
│   │       │   ├── toasts.css                  # Variants, colors, animations
│   │       │   ├── types.ts                    # Toast types
│   │       │   └── index.ts
│   │       ├── interactions/                   # AI-callable interactive components
│   │       │   ├── InteractionCard.svelte      # Container (sm/md/lg/full)
│   │       │   ├── InteractionImage.svelte     # Interactive image w/ animations
│   │       │   ├── InteractionButtons.svelte   # Yes/No, True/False pairs
│   │       │   ├── InteractionChoice.svelte    # Multiple choice (single/multi)
│   │       │   ├── InteractionInput.svelte     # Text input w/ "Other" option
│   │       │   ├── InteractionActions.svelte   # Action buttons
│   │       │   ├── InteractionRenderer.svelte  # Renders interaction schema dynamically
│   │       │   ├── interactions.css            # Interaction component styles
│   │       │   ├── types.ts                    # Interaction schema types
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   ├── domains/                                # BUSINESS LOGIC (smart)
│   │   ├── app/                                # APP-EXCLUSIVE
│   │   │   ├── thinkspace/
│   │   │   │   ├── components/
│   │   │   │   │   └── ThinkSpace.svelte
│   │   │   │   ├── stores/
│   │   │   │   │   └── thinkspace.svelte.ts
│   │   │   │   └── index.ts
│   │   │   ├── devspace/
│   │   │   │   ├── components/
│   │   │   │   │   └── DevSpace.svelte
│   │   │   │   ├── stores/
│   │   │   │   │   └── devspace.svelte.ts
│   │   │   │   └── index.ts
│   │   │   ├── topbar/                         # Topbar CONTENT for app
│   │   │   │   ├── AppTopbarContent.svelte
│   │   │   │   └── index.ts
│   │   │   ├── leftsidebar/                    # Sidebar CONTENT for app
│   │   │   │   ├── AppSidebarContent.svelte
│   │   │   │   └── index.ts
│   │   │   ├── statusbar/
│   │   │   │   ├── AppStatusbarContent.svelte
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   ├── chat/                               # CHAT-EXCLUSIVE
│   │   │   ├── features/                       # Tab content
│   │   │   │   ├── status/
│   │   │   │   │   ├── StatusPanel.svelte
│   │   │   │   │   └── index.ts
│   │   │   │   ├── history/
│   │   │   │   │   ├── HistoryList.svelte
│   │   │   │   │   └── index.ts
│   │   │   │   ├── projects/
│   │   │   │   │   ├── ProjectsList.svelte
│   │   │   │   │   └── index.ts
│   │   │   │   └── index.ts
│   │   │   ├── topbar/                         # Topbar CONTENT for chat
│   │   │   │   ├── ChatTopbarContent.svelte
│   │   │   │   ├── HeadsupIndicator.svelte
│   │   │   │   ├── ModeSelector.svelte
│   │   │   │   └── index.ts
│   │   │   ├── messages/                       # Message CONTENT
│   │   │   │   ├── MessageBubble.svelte
│   │   │   │   ├── MessageGroup.svelte
│   │   │   │   └── index.ts
│   │   │   ├── input/                          # Input LOGIC
│   │   │   │   ├── ChatInputLogic.svelte
│   │   │   │   ├── input.svelte.ts
│   │   │   │   └── index.ts
│   │   │   ├── stores/
│   │   │   │   ├── chat.svelte.ts
│   │   │   │   ├── messages.svelte.ts
│   │   │   │   └── index.ts
│   │   │   ├── types/
│   │   │   │   └── index.ts
│   │   │   └── index.ts
│   │   │
│   │   └── shared/                             # SHARED (all windows)
│   │       ├── user/
│   │       │   ├── components/
│   │       │   │   ├── UserBadge.svelte
│   │       │   │   └── UserMenu.svelte
│   │       │   ├── stores/
│   │       │   │   └── user.svelte.ts
│   │       │   └── index.ts
│   │       ├── auth/
│   │       │   ├── components/
│   │       │   │   └── AuthModal.svelte
│   │       │   ├── stores/
│   │       │   │   └── auth.svelte.ts
│   │       │   └── index.ts
│   │       └── index.ts
│   │
│   └── design-system/                          # TOKENS & PRIMITIVES
│       ├── tokens/
│       │   ├── colors.css
│       │   ├── spacing.css
│       │   └── index.css
│       ├── primitives/
│       │   ├── Button.svelte
│       │   ├── Icon.svelte
│       │   └── index.ts
│       └── index.ts
│
├── routes/                                     # WIRING (connects layout + domain)
│   ├── +layout.svelte                          # Root
│   │
│   ├── (app)/                                  # Main window
│   │   ├── +layout.svelte
│   │   ├── +page.svelte                        # Dashboard
│   │   ├── thinkspace/
│   │   │   └── +page.svelte
│   │   ├── devspace/
│   │   │   └── +page.svelte
│   │   └── settings/
│   │       └── +page.svelte
│   │
│   └── domains/
│       └── chat/                               # Chat window (standalone)
│           ├── +layout@.svelte                 # Breaks inheritance
│           └── +page.svelte
│
├── app.css
└── app.html
```

---

## How It Connects

### Example: Chat Window

```svelte
<!-- routes/domains/chat/+page.svelte (WIRING) -->
<script lang="ts">
  // LAYOUTS (dumb visual shells)
  import { ChatFrame, Topbar, Tabs, MessageList, MessageInput, Bottombar } from '$lib/layouts/chat';

  // DOMAINS (smart content)
  import { ChatTopbarContent, HeadsupIndicator, ModeSelector } from '$lib/domains/chat/topbar';
  import { StatusPanel } from '$lib/domains/chat/features/status';
  import { HistoryList } from '$lib/domains/chat/features/history';
  import { MessageBubble } from '$lib/domains/chat/messages';
  import { ChatInputLogic } from '$lib/domains/chat/input';
  import { chatStore } from '$lib/domains/chat/stores';

  let activeTab = $state('status');
</script>

<ChatFrame>
  {#snippet topbar()}
    <Topbar>
      {#snippet left()}
        <HeadsupIndicator />
      {/snippet}
      {#snippet center()}
        <Tabs
          tabs={['status', 'history', 'projects']}
          active={activeTab}
          onchange={(t) => activeTab = t}
        />
      {/snippet}
      {#snippet right()}
        <ModeSelector />
      {/snippet}
    </Topbar>
  {/snippet}

  {#snippet sidebar()}
    {#if activeTab === 'status'}
      <StatusPanel />
    {:else if activeTab === 'history'}
      <HistoryList />
    {/if}
  {/snippet}

  {#snippet main()}
    <MessageList>
      {#each chatStore.messages as message}
        <MessageBubble {message} />
      {/each}
    </MessageList>
  {/snippet}

  {#snippet input()}
    <MessageInput>
      <ChatInputLogic />
    </MessageInput>
  {/snippet}

  {#snippet bottombar()}
    <Bottombar>
      <!-- status, shortcuts, etc -->
    </Bottombar>
  {/snippet}
</ChatFrame>
```

### Example: App Window

```svelte
<!-- routes/(app)/+page.svelte (WIRING) -->
<script lang="ts">
  // LAYOUTS
  import { AppFrame, Topbar, LeftSidebar, Main, Statusbar } from '$lib/layouts/app';

  // DOMAINS
  import { AppTopbarContent } from '$lib/domains/app/topbar';
  import { AppSidebarContent } from '$lib/domains/app/leftsidebar';
  import { AppStatusbarContent } from '$lib/domains/app/statusbar';
  import { UserBadge } from '$lib/domains/shared/user';
</script>

<AppFrame>
  {#snippet topbar()}
    <Topbar>
      {#snippet left()}
        <AppTopbarContent />
      {/snippet}
      {#snippet right()}
        <UserBadge variant="full" />
      {/snippet}
    </Topbar>
  {/snippet}

  {#snippet sidebar()}
    <LeftSidebar>
      <AppSidebarContent />
    </LeftSidebar>
  {/snippet}

  {#snippet main()}
    <Main>
      <!-- Dashboard content -->
    </Main>
  {/snippet}

  {#snippet statusbar()}
    <Statusbar>
      <AppStatusbarContent />
    </Statusbar>
  {/snippet}
</AppFrame>
```

---

## Layout Component Pattern (Dumb)

```svelte
<!-- layouts/chat/frame/ChatFrame.svelte -->
<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    topbar?: Snippet;
    sidebar?: Snippet;
    main?: Snippet;
    input?: Snippet;
    bottombar?: Snippet;
  }

  let { topbar, sidebar, main, input, bottombar }: Props = $props();
</script>

<div class="frame">
  {#if topbar}
    <header class="topbar">
      {@render topbar()}
    </header>
  {/if}

  <div class="body">
    {#if sidebar}
      <aside class="sidebar">
        {@render sidebar()}
      </aside>
    {/if}

    <main class="main">
      {#if main}
        {@render main()}
      {/if}

      {#if input}
        <div class="input-area">
          {@render input()}
        </div>
      {/if}
    </main>
  </div>

  {#if bottombar}
    <footer class="bottombar">
      {@render bottombar()}
    </footer>
  {/if}
</div>

<style>
  .frame {
    height: 100vh;
    display: flex;
    flex-direction: column;
    background: var(--dp-surface-1);
  }

  .topbar {
    flex-shrink: 0;
    border-bottom: 1px solid var(--dp-border);
  }

  .body {
    flex: 1;
    display: flex;
    overflow: hidden;
  }

  .sidebar {
    width: 240px;
    flex-shrink: 0;
    border-right: 1px solid var(--dp-border);
    overflow-y: auto;
  }

  .main {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .input-area {
    flex-shrink: 0;
    border-top: 1px solid var(--dp-border);
  }

  .bottombar {
    flex-shrink: 0;
    border-top: 1px solid var(--dp-border);
  }
</style>
```

---

## Domain Component Pattern (Smart)

```svelte
<!-- domains/chat/messages/MessageBubble.svelte -->
<script lang="ts">
  import type { Message } from '../types';
  import { chatStore } from '../stores';

  interface Props {
    message: Message;
  }

  let { message }: Props = $props();

  const isUser = $derived(message.role === 'user');
</script>

<div class="bubble" data-role={message.role}>
  <div class="content">
    {message.content}
  </div>
  <time class="timestamp">
    {new Date(message.timestamp).toLocaleTimeString()}
  </time>
</div>

<style>
  .bubble {
    padding: var(--dp-space-3);
    border-radius: var(--dp-radius-lg);
    max-width: 80%;
  }

  .bubble[data-role="user"] {
    align-self: flex-end;
    background: var(--dp-accent-primary);
  }

  .bubble[data-role="assistant"] {
    align-self: flex-start;
    background: var(--dp-surface-2);
  }
</style>
```

---

## Summary

| Layer | Location | Responsibility | Knows About |
|-------|----------|----------------|-------------|
| **sys** | `lib/sys/` | Settings, theme, commands | Nothing UI |
| **layouts** | `lib/layouts/` | Visual shells, slots | Nothing about content |
| **domains** | `lib/domains/` | Business logic, content | Its own stores/types |
| **routes** | `routes/` | Wiring layout + domain | Both |

---

*Generated: 2026-01-12*
