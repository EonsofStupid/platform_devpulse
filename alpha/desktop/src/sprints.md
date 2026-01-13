# DevPulse Desktop - Sprint Plan

## Windows Overview

| Window | Complexity | Priority |
|--------|------------|----------|
| Chat | High (tabs, circle menus, indicators) | Sprint 1-3 |
| App | Medium | Sprint 4-5 |

## Shared Systems

| System | Purpose | Priority |
|--------|---------|----------|
| Toasts | Action feedback | Sprint 1.75 |
| Tooltips | Hover info | Sprint 1.5 |
| Interactions | AI-callable UI touchpoints (reduce typing) | Sprint 2.5 |

---

## Sprint 0: Foundation - Seal the Boundary

**Goal:** Protect Orchestrator IP by making Engine a proper facade that NEVER leaks internal types.

> **CRITICAL:** This sprint MUST complete before ANY UI work begins.
> See full plan: [orchestrator/README.md](../../orchestrator/README.md)
> See signal mapping: [orchestrator/SIGNAL_TRANSLATION.md](../../orchestrator/SIGNAL_TRANSLATION.md)

### Why This Matters

- Orchestrator = 2 years of proprietary IP (RRO, CAG, Rumination)
- Engine = Public facade (what desktop sees)
- NEVER let orchestrator types leak to engine or desktop
- ALL signals translated to layman-friendly versions at boundary

### Phase 1: Shared Types (SSOT)

1. [ ] Create `shared/src/types/sink.rs` - Move SinkKind from engine
2. [ ] Create `shared/src/types/adapter.rs` - AdapterKind (Local/Web/Memory)
3. [ ] Add WebProvider enum to `adapter.rs` (Anthropic, OpenAI, Ollama, etc.)
4. [ ] Update `shared/src/types/mod.rs` - Export new types

### Phase 2: Seal Engine Boundary

5. [ ] Remove ALL `pub use orchestrator::` from `engine/src/lib.rs`
6. [ ] Create `engine/src/types/mod.rs`
7. [ ] Create `engine/src/types/model.rs` - Engine-local ModelInfo (no internals)
8. [ ] Create `engine/src/types/config.rs` - Engine-local ConfigEntry

### Phase 3: Unify Signals

9. [ ] Audit all uses of `SignalVariant` in engine
10. [ ] Replace with `SignalKind` from shared
11. [ ] Delete `engine/src/signals/variants.rs`
12. [ ] Delete `engine/src/signals/payloads.rs`
13. [ ] Update `engine/src/signals/router.rs` to use `shared::SignalKind`

### Phase 4: Reorganize Orchestrator Adapters

14. [ ] Create `orchestrator/src/adapters/mod.rs` - Traits
15. [ ] Create `orchestrator/src/adapters/local/` - Candle inference
16. [ ] Create `orchestrator/src/adapters/web/` - API providers
17. [ ] Create `orchestrator/src/adapters/memory/` - Moka cache
18. [ ] Rename internal `ProviderKind` → use `AdapterKind` + `WebProvider`

### Phase 5: Desktop Alignment

19. [ ] Update all `desktop/src-tauri/` to use engine types only
20. [ ] Verify NO `use orchestrator::` in desktop crate

### Phase 6: Signal Translation

21. [ ] Create `engine/src/facade/signals.rs` - SignalTranslator
22. [ ] Add ThinkingStarted/Progress/Complete to `shared::SignalKind`
23. [ ] Add StreamToken to `shared::SignalKind`
24. [ ] Map InfraSignal → layman SignalKind in translator

### Phase 7: Dev Tools Feature Gate (Hybrid Approach)

> **Purpose:** Allow dev-time orchestrator access that gets stripped from release builds.

25. [ ] Add `dev-tools` feature to `engine/Cargo.toml`
26. [ ] Create `engine/src/dev/mod.rs` - Conditionally exposes orchestrator types
27. [ ] Add `dev-tools` feature to `desktop/src-tauri/Cargo.toml` (default ON)
28. [ ] Create `desktop/src-tauri/src/commands/dev.rs` - Dev-only Tauri commands
29. [ ] Update `desktop/src-tauri/src/commands/mod.rs` - Conditional `mod dev;`
30. [ ] Verify `cargo tauri build --release --no-default-features` strips dev code

**Feature Chain:**
```
desktop (dev-tools) → engine (dev-tools) → orchestrator (direct access)
```

**Engine Dev Module (only with feature):**
```rust
// engine/src/dev/mod.rs
pub use orchestrator::types::InfraSignal;
pub use orchestrator::cortex::rumination::ChainTrace;
pub use orchestrator::cortex::cag::AssemblyContext;
```

**Desktop Dev Commands (only with feature):**
```rust
// desktop/src-tauri/src/commands/dev.rs
use engine::dev::{InfraSignal, ChainTrace};

#[tauri::command]
pub fn tap_infra_signals() -> Vec<InfraSignal> { ... }
```

**Audit Point:** `cat engine/src/dev/mod.rs` shows all dev-only exports

### Acceptance Criteria

```bash
# Must return NOTHING (production boundary check)
grep -r "pub use orchestrator::" alpha/engine/src/  # Exclude dev/
grep -r "use orchestrator::" alpha/desktop/

# All must pass
cargo check -p shared
cargo check -p orchestrator
cargo check -p engine
cargo check -p devpulse-desktop

# Dev-tools verification
cargo check -p engine --features dev-tools    # Dev mode compiles
cargo check -p devpulse-desktop               # Default includes dev-tools

# Release stripping verification
cargo build -p devpulse-desktop --release --no-default-features
# Confirm: engine/src/dev/ not compiled, commands/dev.rs not compiled
```

### Key Files Created

| File | Purpose |
|------|---------|
| `orchestrator/README.md` | Boundary contract documentation |
| `orchestrator/SIGNAL_TRANSLATION.md` | Internal → layman signal mapping |
| `shared/src/types/sink.rs` | SinkKind (Broadcast, Cache, etc.) |
| `shared/src/types/adapter.rs` | AdapterKind + WebProvider |
| `engine/src/types/model.rs` | Public-safe ModelInfo |
| `engine/src/facade/signals.rs` | Signal translator |
| `engine/src/dev/mod.rs` | Dev-only orchestrator exports (feature-gated) |
| `desktop/src-tauri/src/commands/dev.rs` | Dev-only Tauri commands (feature-gated) |

---

## Pre-Sprint: Scaffold Structure

Create empty folder structure with index.ts files:

```bash
src/lib/
├── sys/
│   ├── settings/
│   ├── theme/
│   └── commands/
│
├── layouts/
│   ├── app/frame/
│   │   ├── topbar/
│   │   ├── leftsidebar/
│   │   ├── main/
│   │   └── statusbar/
│   ├── app/components/
│   │
│   ├── chat/frame/
│   │   ├── tabbar/                    # NEW: Above topbar
│   │   ├── topbar/left/
│   │   ├── topbar/center/
│   │   ├── topbar/right/
│   │   ├── leftsidebar/
│   │   ├── rightsidebar/              # NEW: Invisible slots
│   │   ├── messagelist/
│   │   ├── messageinput/
│   │   ├── bottombar/
│   │   └── circlemenus/               # NEW: 3-4 radial menus
│   ├── chat/components/
│   │
│   └── shared/
│       ├── tooltips/                  # Global tooltip system
│       ├── indicators/                # Stackable indicators
│       ├── toasts/                    # Global toast system
│       └── interactions/              # AI-callable interactive components
│
├── domains/
│   ├── app/thinkspace/
│   ├── app/devspace/
│   ├── app/topbar/
│   ├── app/leftsidebar/
│   ├── app/statusbar/
│   │
│   ├── chat/features/status/
│   ├── chat/features/history/
│   ├── chat/features/projects/
│   ├── chat/topbar/
│   ├── chat/messages/
│   ├── chat/input/
│   ├── chat/stores/
│   │
│   ├── shared/user/
│   └── shared/auth/
│
└── design-system/
    ├── tokens/
    └── primitives/
```

---

## Sprint 1: Chat Frame Core (Layout Only)

**Goal:** Dumb visual shell for chat window renders with slots

### Tasks:
1. [ ] `layouts/chat/frame/ChatFrame.svelte` - Root with all snippet slots
2. [ ] `layouts/chat/frame/tabbar/TabBar.svelte` - Tab container ABOVE topbar (2+ tabs)
3. [ ] `layouts/chat/frame/tabbar/tabbar.css` - Tab styling
4. [ ] `layouts/chat/frame/topbar/Topbar.svelte` - Header container with L/C/R slots
5. [ ] `layouts/chat/frame/topbar/topbar.css` - Chat-specific color tints
6. [ ] `layouts/chat/frame/topbar/left/TopbarLeft.svelte` - Left slot
7. [ ] `layouts/chat/frame/topbar/center/TopbarCenter.svelte` - Center slot
8. [ ] `layouts/chat/frame/topbar/right/TopbarRight.svelte` - Right slot
9. [ ] `layouts/chat/frame/leftsidebar/LeftSidebar.svelte` - Left sidebar
10. [ ] `layouts/chat/frame/rightsidebar/RightSidebar.svelte` - Invisible right slots
11. [ ] `layouts/chat/frame/messagelist/MessageList.svelte` - Scroll container
12. [ ] `layouts/chat/frame/messageinput/MessageInput.svelte` - Input frame
13. [ ] `layouts/chat/frame/bottombar/Bottombar.svelte` - Status bar frame
14. [ ] `layouts/chat/index.ts` - Barrel export

### Acceptance:
- Chat window renders empty frame with all sections
- TabBar sits ABOVE topbar
- Topbar has left/center/right slots
- All sections accept snippets
- No business logic, just visual structure

---

## Sprint 1.5: Chat Advanced Layouts

**Goal:** Circle menus, tooltips, indicators

### Tasks:
1. [ ] `layouts/chat/frame/circlemenus/CircleMenu.svelte` - Radial menu component
2. [ ] `layouts/chat/frame/circlemenus/CircleMenuSlot.svelte` - Position wrapper (3-4 slots)
3. [ ] `layouts/chat/frame/circlemenus/circlemenus.css` - Radial styling
4. [ ] `layouts/shared/tooltips/Tooltip.svelte` - Single tooltip
5. [ ] `layouts/shared/tooltips/TooltipProvider.svelte` - Global tooltip context
6. [ ] `layouts/shared/tooltips/tooltips.css` - Variants (info, warning, success, error), colors
7. [ ] `layouts/shared/indicators/Indicator.svelte` - Single indicator
8. [ ] `layouts/shared/indicators/IndicatorStack.svelte` - Stacked indicators with hover

### Acceptance:
- Circle menus can be placed around message area
- Tooltips render with correct variant/color
- Indicators can stack and show tooltip on hover

---

## Sprint 1.75: Global Toast System

**Goal:** Every action gets visual confirmation

### Tasks:
1. [ ] `layouts/shared/toasts/Toast.svelte` - Single toast component
2. [ ] `layouts/shared/toasts/ToastContainer.svelte` - Positions toasts (corner stack)
3. [ ] `layouts/shared/toasts/ToastProvider.svelte` - Global context
4. [ ] `layouts/shared/toasts/toasts.css` - Variants (success, error, warning, info, loading)
5. [ ] `layouts/shared/toasts/types.ts` - Toast types
6. [ ] `sys/toast.svelte.ts` - Toast store/API

### Toast Variants:
| Variant | Color | Use |
|---------|-------|-----|
| `success` | Green | Action completed |
| `error` | Red | Action failed |
| `warning` | Orange | Needs attention |
| `info` | Blue | Informational |
| `loading` | Accent | In progress |

### Features:
- [ ] Color-coded by variant
- [ ] Auto-dismiss with progress bar
- [ ] Click to dismiss
- [ ] Action buttons (undo, retry)
- [ ] Glass styling

### Acceptance:
- `toast.success('Saved')` shows green toast
- `toast.error('Failed')` shows red toast
- `toast.loading('Working...')` shows spinner
- Toasts stack and auto-dismiss

---

## Sprint 2: Chat Domain Content

**Goal:** Smart content fills the chat frame

### Tasks:
1. [ ] `domains/chat/stores/chat.svelte.ts` - Chat state (messages, mode, status)
2. [ ] `domains/chat/types/index.ts` - Message, Conversation types
3. [ ] `domains/chat/topbar/HeadsupIndicator.svelte` - Connection/thinking status
4. [ ] `domains/chat/topbar/ModeSelector.svelte` - Mode dropdown
5. [ ] `domains/chat/messages/MessageBubble.svelte` - Single message
6. [ ] `domains/chat/input/ChatInputLogic.svelte` - Send logic, voice toggle
7. [ ] `domains/chat/index.ts` - Barrel export

### Acceptance:
- Can send/receive messages
- Mode selector works
- Status indicators update

---

## Sprint 3: Chat Features (Tabs)

**Goal:** Tab content panels

### Tasks:
1. [ ] `domains/chat/features/status/StatusPanel.svelte` - Connection, AI state
2. [ ] `domains/chat/features/history/HistoryList.svelte` - Past conversations
3. [ ] `domains/chat/features/projects/ProjectsList.svelte` - Project context
4. [ ] Wire tabs in `routes/domains/chat/+page.svelte`

### Acceptance:
- Tabs switch between status/history/projects
- Each panel renders content

---

## Sprint 4: App Frame (Layout Only)

**Goal:** Dumb visual shell for main app window

### Tasks:
1. [ ] `layouts/app/frame/AppFrame.svelte` - Root with snippet slots
2. [ ] `layouts/app/frame/topbar/Topbar.svelte` - Header container
3. [ ] `layouts/app/frame/leftsidebar/LeftSidebar.svelte` - Nav container
4. [ ] `layouts/app/frame/main/Main.svelte` - Main content area
5. [ ] `layouts/app/frame/statusbar/Statusbar.svelte` - Bottom bar
6. [ ] `layouts/app/index.ts` - Barrel export

### Acceptance:
- App window renders empty frame with all sections
- All sections accept snippets

---

## Sprint 5: App Domain Content

**Goal:** Smart content fills the app frame

### Tasks:
1. [ ] `domains/app/topbar/AppTopbarContent.svelte`
2. [ ] `domains/app/leftsidebar/AppSidebarContent.svelte` - Navigation
3. [ ] `domains/app/statusbar/AppStatusbarContent.svelte`
4. [ ] `domains/shared/user/UserBadge.svelte` - Used in both windows
5. [ ] `domains/shared/user/stores/user.svelte.ts`

### Acceptance:
- App navigation works
- User badge shows in topbar

---

## Sprint 6: ThinkSpace & DevSpace

**Goal:** App-exclusive features

### Tasks:
1. [ ] `domains/app/thinkspace/ThinkSpace.svelte`
2. [ ] `domains/app/thinkspace/stores/thinkspace.svelte.ts`
3. [ ] `domains/app/devspace/DevSpace.svelte`
4. [ ] `domains/app/devspace/stores/devspace.svelte.ts`
5. [ ] `routes/(app)/thinkspace/+page.svelte`
6. [ ] `routes/(app)/devspace/+page.svelte`

### Acceptance:
- Can navigate to ThinkSpace/DevSpace
- Basic functionality works

---

## Sprint 2.5: Interactions (AI-Callable)

**Goal:** Maximize UI touchpoints so users click instead of typing paragraphs. Collect COSTAR-style structured input and track selections as baseline configurations for different modes.

### Tasks:
1. [ ] `layouts/shared/interactions/InteractionCard.svelte` - Container (sm/md/lg/full variants)
2. [ ] `layouts/shared/interactions/InteractionImage.svelte` - Interactive image with animations
3. [ ] `layouts/shared/interactions/InteractionButtons.svelte` - Yes/No, True/False pairs
4. [ ] `layouts/shared/interactions/InteractionChoice.svelte` - Multiple choice (single/multi)
5. [ ] `layouts/shared/interactions/InteractionInput.svelte` - Text input with "Other" option
6. [ ] `layouts/shared/interactions/InteractionActions.svelte` - Action buttons (submit, cancel)
7. [ ] `layouts/shared/interactions/InteractionRenderer.svelte` - Renders interaction schema dynamically
8. [ ] `layouts/shared/interactions/interactions.css` - All interaction component styling
9. [ ] `layouts/shared/interactions/types.ts` - Interaction schema types

### Component Variants (via data attributes):
```svelte
<InteractionCard data-size="sm|md|lg|full" data-variant="default|highlight|warning">
<InteractionButtons data-type="yes-no|true-false|confirm-cancel">
<InteractionChoice data-mode="single|multi" data-layout="vertical|horizontal">
```

### Acceptance:
- AI can send interaction schema → InteractionRenderer outputs interactive UI
- Yes/No, True/False buttons work
- Multiple choice with "Other" text input works
- Images have interactivity/animations
- User selections recorded for baseline mode configurations

---

## Sprint 7: Cross-Window Commands

**Goal:** Chat can trigger app actions

### Tasks:
1. [ ] `sys/commands/intents.ts` - Define command types
2. [ ] `sys/commands/router.ts` - Route to correct window
3. [ ] Wire up Tauri events for cross-window communication
4. [ ] Test: "make a note in devspace" from chat → app opens devspace

### Acceptance:
- Chat can command app without navigating
- App receives and executes commands

---

## Sprint 8: Polish & Deduplication

**Goal:** Extract repeated patterns

### Tasks:
1. [ ] Identify duplicate glass/container patterns
2. [ ] Extract to `design-system/primitives/`
3. [ ] Identify duplicate layout patterns between app/chat
4. [ ] Consider shared base components if 3+ duplicates

### Acceptance:
- No copy-paste code
- Clear component hierarchy

---

## File Checklist (Bare Minimum)

### Layouts - Chat (Dumb)
- [ ] `layouts/chat/frame/ChatFrame.svelte`
- [ ] `layouts/chat/frame/tabbar/TabBar.svelte`
- [ ] `layouts/chat/frame/tabbar/tabbar.css`
- [ ] `layouts/chat/frame/topbar/Topbar.svelte`
- [ ] `layouts/chat/frame/topbar/topbar.css`
- [ ] `layouts/chat/frame/topbar/left/TopbarLeft.svelte`
- [ ] `layouts/chat/frame/topbar/center/TopbarCenter.svelte`
- [ ] `layouts/chat/frame/topbar/right/TopbarRight.svelte`
- [ ] `layouts/chat/frame/leftsidebar/LeftSidebar.svelte`
- [ ] `layouts/chat/frame/rightsidebar/RightSidebar.svelte`
- [ ] `layouts/chat/frame/messagelist/MessageList.svelte`
- [ ] `layouts/chat/frame/messageinput/MessageInput.svelte`
- [ ] `layouts/chat/frame/bottombar/Bottombar.svelte`
- [ ] `layouts/chat/frame/circlemenus/CircleMenu.svelte`
- [ ] `layouts/chat/frame/circlemenus/CircleMenuSlot.svelte`

### Layouts - App (Dumb)
- [ ] `layouts/app/frame/AppFrame.svelte`
- [ ] `layouts/app/frame/topbar/Topbar.svelte`
- [ ] `layouts/app/frame/topbar/topbar.css`
- [ ] `layouts/app/frame/leftsidebar/LeftSidebar.svelte`
- [ ] `layouts/app/frame/main/Main.svelte`
- [ ] `layouts/app/frame/statusbar/Statusbar.svelte`

### Layouts - Shared (Dumb)
- [ ] `layouts/shared/tooltips/Tooltip.svelte`
- [ ] `layouts/shared/tooltips/TooltipProvider.svelte`
- [ ] `layouts/shared/tooltips/tooltips.css`
- [ ] `layouts/shared/indicators/Indicator.svelte`
- [ ] `layouts/shared/indicators/IndicatorStack.svelte`
- [ ] `layouts/shared/toasts/Toast.svelte`
- [ ] `layouts/shared/toasts/ToastContainer.svelte`
- [ ] `layouts/shared/toasts/ToastProvider.svelte`
- [ ] `layouts/shared/toasts/toasts.css`
- [ ] `layouts/shared/interactions/InteractionCard.svelte`
- [ ] `layouts/shared/interactions/InteractionImage.svelte`
- [ ] `layouts/shared/interactions/InteractionButtons.svelte`
- [ ] `layouts/shared/interactions/InteractionChoice.svelte`
- [ ] `layouts/shared/interactions/InteractionInput.svelte`
- [ ] `layouts/shared/interactions/InteractionActions.svelte`
- [ ] `layouts/shared/interactions/InteractionRenderer.svelte`
- [ ] `layouts/shared/interactions/interactions.css`

### Domains - Chat (Smart)
- [ ] `domains/chat/stores/chat.svelte.ts`
- [ ] `domains/chat/topbar/HeadsupIndicator.svelte`
- [ ] `domains/chat/topbar/ModeSelector.svelte`
- [ ] `domains/chat/messages/MessageBubble.svelte`
- [ ] `domains/chat/input/ChatInputLogic.svelte`
- [ ] `domains/chat/features/status/StatusPanel.svelte`
- [ ] `domains/chat/features/history/HistoryList.svelte`
- [ ] `domains/chat/features/projects/ProjectsList.svelte`

### Domains - App (Smart)
- [ ] `domains/app/topbar/AppTopbarContent.svelte`
- [ ] `domains/app/leftsidebar/AppSidebarContent.svelte`
- [ ] `domains/app/statusbar/AppStatusbarContent.svelte`
- [ ] `domains/app/thinkspace/ThinkSpace.svelte`
- [ ] `domains/app/devspace/DevSpace.svelte`

### Domains - Shared (Smart)
- [ ] `domains/shared/user/UserBadge.svelte`
- [ ] `domains/shared/auth/AuthModal.svelte`

### System
- [ ] `sys/settings/settings.svelte.ts`
- [ ] `sys/theme/theme.svelte.ts`
- [ ] `sys/toast.svelte.ts`
- [ ] `sys/commands/router.ts`
- [ ] `sys/commands/intents.ts`

### Routes (Wiring)
- [ ] `routes/domains/chat/+layout@.svelte`
- [ ] `routes/domains/chat/+page.svelte`
- [ ] `routes/(app)/+layout.svelte`
- [ ] `routes/(app)/+page.svelte`
- [ ] `routes/(app)/thinkspace/+page.svelte`
- [ ] `routes/(app)/devspace/+page.svelte`
- [ ] `routes/(app)/settings/+page.svelte`

### Tauri (Rust)
- [ ] `src-tauri/src/adapters/mod.rs`
- [ ] `src-tauri/src/adapters/ai/mod.rs`
- [ ] `src-tauri/src/adapters/storage/mod.rs`
- [ ] `src-tauri/src/commands/mod.rs`
- [ ] `src-tauri/src/commands/chat.rs`
- [ ] `src-tauri/src/commands/window.rs`
- [ ] `src-tauri/capabilities/chat-window.json`

---

*Generated: 2026-01-12*
