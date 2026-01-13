# Desktop Progress & Sprint Breakdown

> **Source of Truth:** This document tracks actual progress against `bad_desktop/src/SPRINTS.md`

---

## Current State Analysis

### What Exists in `alpha/desktop/`

**Config Files (DONE):**
- [x] `package.json`
- [x] `svelte.config.js`
- [x] `vite.config.ts`
- [x] `tsconfig.json`
- [x] `.gitignore`

**Tauri Backend (SKELETON ONLY):**
- [x] `src-tauri/Cargo.toml` - Basic, needs adapters
- [x] `src-tauri/build.rs`
- [x] `src-tauri/tauri.conf.json`
- [x] `src-tauri/src/main.rs`
- [x] `src-tauri/src/lib.rs`
- [x] `src-tauri/src/state.rs` - Empty struct
- [x] `src-tauri/src/commands/mod.rs`
- [x] `src-tauri/src/commands/chat.rs` - Echo only

**SvelteKit Frontend (MINIMAL):**
- [x] `src/app.html`
- [x] `src/app.css`
- [x] `src/routes/+layout.svelte`
- [x] `src/routes/+layout.ts`
- [x] `src/routes/+page.svelte`

**Layout Components (WRONG STRUCTURE):**
- [x] `src/lib/layouts/app/frame/AppFrame.svelte` - Basic, not matching SPRINTS.md structure
- [x] `src/lib/layouts/app/index.ts`
- [x] `src/lib/layouts/chat/frame/ChatFrame.svelte` - Basic, missing all sub-components
- [x] `src/lib/layouts/chat/index.ts`

**Design System CSS (DONE - SSOT):**
- [x] `src/styles/tokens/` (7 files)
- [x] `src/styles/primitives/` (3 files)
- [x] `src/styles/recipes/` (8 files)
- [x] `src/styles/keyframes/` (4 files)
- [x] `src/styles/utilities/` (4 files)
- [x] `src/styles/index.css`

---

## Sprint 0 Status: NOT COMPLETE

Sprint 0 has **two tracks** that must both complete:

### Track A: Rust Boundary (95% Done)

> **Goal:** Seal orchestrator IP behind engine facade

| Phase | Status | Description |
|-------|--------|-------------|
| Phase 1: Shared Types | DONE | `shared/src/types/sink.rs`, `adapter.rs` EXIST |
| Phase 2: Seal Engine | DONE | No `pub use orchestrator::` leaks found |
| Phase 3: Unify Signals | DONE | engine has own SignalVariant in signals/variants.rs |
| Phase 4: Orchestrator Adapters | DONE | `orchestrator/src/adapters/{local,web,memory}/` EXIST |
| Phase 5: Desktop Alignment | DONE | desktop only imports engine, never orchestrator |
| Phase 6: Signal Translation | DONE | engine/src/signals/ has full signal system |
| Phase 7: Dev Tools Gate | DONE | Feature gate added |

**Files that ALREADY EXISTED:**
- [x] `shared/src/types/sink.rs` - SinkKind enum
- [x] `shared/src/types/adapter.rs` - AdapterKind, WebAdapter, AdapterInfo
- [x] `engine/src/types/mod.rs` - exports ConfigEntry, DiscoveredModel, ModelInfo
- [x] `engine/src/types/model.rs` - public-safe model types
- [x] `engine/src/types/config.rs` - ConfigEntry
- [x] `engine/src/signals/` - full signal system (router, processor, variants, payloads)
- [x] `orchestrator/src/adapters/mod.rs` - InferenceAdapter, StorageAdapter, EmbeddingAdapter traits
- [x] `orchestrator/src/adapters/local/` - Candle inference
- [x] `orchestrator/src/adapters/web/` - Anthropic, OpenAI, Ollama clients
- [x] `orchestrator/src/adapters/memory/` - Moka cache

**Files CREATED this session:**
- [x] `engine/src/dev/mod.rs` - feature-gated orchestrator exports
- [x] `desktop/src-tauri/src/commands/dev.rs` - dev-only Tauri commands

**Cargo.toml changes this session:**
- [x] `engine/Cargo.toml` - added `[features] dev-tools = []`
- [x] `desktop/src-tauri/Cargo.toml` - added `[features] default = ["dev-tools"], dev-tools = ["engine/dev-tools"]`

**lib.rs changes this session:**
- [x] `engine/src/lib.rs` - added `#[cfg(feature = "dev-tools")] pub mod dev;`
- [x] `desktop/src-tauri/src/lib.rs` - conditional command registration
- [x] `desktop/src-tauri/src/commands/mod.rs` - conditional dev module

### Track B: Desktop Scaffold (20% Done)

> **Goal:** Create proper folder structure per SPRINTS.md Pre-Sprint

**What's Missing (Per Pre-Sprint Structure):**

```
src/lib/
├── sys/                          # NOT CREATED
│   ├── settings/
│   ├── theme/
│   └── commands/
│
├── layouts/
│   ├── app/frame/               # PARTIAL - only AppFrame.svelte
│   │   ├── topbar/              # MISSING
│   │   ├── leftsidebar/         # MISSING
│   │   ├── main/                # MISSING
│   │   └── statusbar/           # MISSING
│   ├── app/components/          # MISSING
│   │
│   ├── chat/frame/              # PARTIAL - only ChatFrame.svelte
│   │   ├── tabbar/              # MISSING
│   │   ├── topbar/left/         # MISSING
│   │   ├── topbar/center/       # MISSING
│   │   ├── topbar/right/        # MISSING
│   │   ├── leftsidebar/         # MISSING
│   │   ├── rightsidebar/        # MISSING
│   │   ├── messagelist/         # MISSING
│   │   ├── messageinput/        # MISSING
│   │   ├── bottombar/           # MISSING
│   │   └── circlemenus/         # MISSING
│   ├── chat/components/         # MISSING
│   │
│   └── shared/                  # NOT CREATED
│       ├── tooltips/
│       ├── indicators/
│       ├── toasts/
│       └── interactions/
│
├── domains/                     # NOT CREATED
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
└── design-system/               # DIFFERENT LOCATION
    ├── tokens/                  # We have src/styles/tokens/
    └── primitives/              # We have src/styles/primitives/
```

---

## Revised Sprint Breakdown

### Sprint 0.A: Rust Boundary Sealing

**Must complete BEFORE any UI work per SPRINTS.md line 24**

See: `bad_desktop/src/SPRINTS.md` lines 20-146

Tasks:
1. [ ] Phase 1: Shared Types (4 tasks)
2. [ ] Phase 2: Seal Engine Boundary (4 tasks)
3. [ ] Phase 3: Unify Signals (5 tasks)
4. [ ] Phase 4: Reorganize Orchestrator Adapters (5 tasks)
5. [ ] Phase 5: Desktop Alignment (2 tasks)
6. [ ] Phase 6: Signal Translation (4 tasks)
7. [ ] Phase 7: Dev Tools Feature Gate (6 tasks)

**Acceptance:**
```bash
grep -r "pub use orchestrator::" alpha/engine/src/  # Must return NOTHING (exclude dev/)
grep -r "use orchestrator::" alpha/desktop/         # Must return NOTHING
cargo check -p shared && cargo check -p engine && cargo check -p devpulse-desktop
```

---

### Sprint 0.B: Desktop Scaffold Structure

Create empty folder structure with index.ts barrel files.

**Directories to Create:**
```bash
# sys
mkdir -p src/lib/sys/settings
mkdir -p src/lib/sys/theme
mkdir -p src/lib/sys/commands

# layouts/app
mkdir -p src/lib/layouts/app/frame/topbar
mkdir -p src/lib/layouts/app/frame/leftsidebar
mkdir -p src/lib/layouts/app/frame/main
mkdir -p src/lib/layouts/app/frame/statusbar
mkdir -p src/lib/layouts/app/components

# layouts/chat
mkdir -p src/lib/layouts/chat/frame/tabbar
mkdir -p src/lib/layouts/chat/frame/topbar/left
mkdir -p src/lib/layouts/chat/frame/topbar/center
mkdir -p src/lib/layouts/chat/frame/topbar/right
mkdir -p src/lib/layouts/chat/frame/leftsidebar
mkdir -p src/lib/layouts/chat/frame/rightsidebar
mkdir -p src/lib/layouts/chat/frame/messagelist
mkdir -p src/lib/layouts/chat/frame/messageinput
mkdir -p src/lib/layouts/chat/frame/bottombar
mkdir -p src/lib/layouts/chat/frame/circlemenus
mkdir -p src/lib/layouts/chat/components

# layouts/shared
mkdir -p src/lib/layouts/shared/tooltips
mkdir -p src/lib/layouts/shared/indicators
mkdir -p src/lib/layouts/shared/toasts
mkdir -p src/lib/layouts/shared/interactions

# domains/app
mkdir -p src/lib/domains/app/thinkspace
mkdir -p src/lib/domains/app/devspace
mkdir -p src/lib/domains/app/topbar
mkdir -p src/lib/domains/app/leftsidebar
mkdir -p src/lib/domains/app/statusbar

# domains/chat
mkdir -p src/lib/domains/chat/features/status
mkdir -p src/lib/domains/chat/features/history
mkdir -p src/lib/domains/chat/features/projects
mkdir -p src/lib/domains/chat/topbar
mkdir -p src/lib/domains/chat/messages
mkdir -p src/lib/domains/chat/input
mkdir -p src/lib/domains/chat/stores

# domains/shared
mkdir -p src/lib/domains/shared/user
mkdir -p src/lib/domains/shared/auth
```

**Acceptance:**
- All directories exist
- Each directory has `index.ts` barrel file (even if empty export)

---

### Sprint 1: Chat Frame Core (Layout Only)

> From SPRINTS.md lines 212-238

**Goal:** Dumb visual shell for chat window with slots

| # | File | Status |
|---|------|--------|
| 1 | `layouts/chat/frame/ChatFrame.svelte` | EXISTS but needs rewrite |
| 2 | `layouts/chat/frame/tabbar/TabBar.svelte` | NOT CREATED |
| 3 | `layouts/chat/frame/tabbar/tabbar.css` | NOT CREATED |
| 4 | `layouts/chat/frame/topbar/Topbar.svelte` | NOT CREATED |
| 5 | `layouts/chat/frame/topbar/topbar.css` | NOT CREATED |
| 6 | `layouts/chat/frame/topbar/left/TopbarLeft.svelte` | NOT CREATED |
| 7 | `layouts/chat/frame/topbar/center/TopbarCenter.svelte` | NOT CREATED |
| 8 | `layouts/chat/frame/topbar/right/TopbarRight.svelte` | NOT CREATED |
| 9 | `layouts/chat/frame/leftsidebar/LeftSidebar.svelte` | NOT CREATED |
| 10 | `layouts/chat/frame/rightsidebar/RightSidebar.svelte` | NOT CREATED |
| 11 | `layouts/chat/frame/messagelist/MessageList.svelte` | NOT CREATED |
| 12 | `layouts/chat/frame/messageinput/MessageInput.svelte` | NOT CREATED |
| 13 | `layouts/chat/frame/bottombar/Bottombar.svelte` | NOT CREATED |
| 14 | `layouts/chat/index.ts` | EXISTS |

**Acceptance:**
- Chat window renders empty frame with all sections
- TabBar sits ABOVE topbar
- Topbar has left/center/right slots
- All sections accept snippets
- No business logic, just visual structure

---

### Sprint 1.5: Chat Advanced Layouts

> From SPRINTS.md lines 241-259

**Goal:** Circle menus, tooltips, indicators

| # | File | Status |
|---|------|--------|
| 1 | `layouts/chat/frame/circlemenus/CircleMenu.svelte` | NOT CREATED |
| 2 | `layouts/chat/frame/circlemenus/CircleMenuSlot.svelte` | NOT CREATED |
| 3 | `layouts/chat/frame/circlemenus/circlemenus.css` | NOT CREATED |
| 4 | `layouts/shared/tooltips/Tooltip.svelte` | NOT CREATED |
| 5 | `layouts/shared/tooltips/TooltipAdapter.svelte` | NOT CREATED |
| 6 | `layouts/shared/tooltips/tooltips.css` | NOT CREATED |
| 7 | `layouts/shared/indicators/Indicator.svelte` | NOT CREATED |
| 8 | `layouts/shared/indicators/IndicatorStack.svelte` | NOT CREATED |

---

### Sprint 1.75: Global Toast System

> From SPRINTS.md lines 262-295

| # | File | Status |
|---|------|--------|
| 1 | `layouts/shared/toasts/Toast.svelte` | NOT CREATED |
| 2 | `layouts/shared/toasts/ToastContainer.svelte` | NOT CREATED |
| 3 | `layouts/shared/toasts/ToastAdapter.svelte` | NOT CREATED |
| 4 | `layouts/shared/toasts/toasts.css` | NOT CREATED |
| 5 | `layouts/shared/toasts/types.ts` | NOT CREATED |
| 6 | `sys/toast.svelte.ts` | NOT CREATED |

---

### Sprint 2: Chat Domain Content

> From SPRINTS.md lines 298-316

| # | File | Status |
|---|------|--------|
| 1 | `domains/chat/stores/chat.svelte.ts` | NOT CREATED |
| 2 | `domains/chat/types/index.ts` | NOT CREATED |
| 3 | `domains/chat/topbar/HeadsupIndicator.svelte` | NOT CREATED |
| 4 | `domains/chat/topbar/ModeSelector.svelte` | NOT CREATED |
| 5 | `domains/chat/messages/MessageBubble.svelte` | NOT CREATED |
| 6 | `domains/chat/input/ChatInputLogic.svelte` | NOT CREATED |
| 7 | `domains/chat/index.ts` | NOT CREATED |

---

## Duplication Analysis

### CSS Keyframes
| Keyframe | Location 1 | Location 2 | Resolution |
|----------|------------|------------|------------|
| `spin` | `keyframes/loading.css` | Would be in Chat.svelte | Use `.animate-spin` utility |
| `pulse` | `keyframes/glow.css` (as `pulse-glow`) | Would be in Chat.svelte | Use `.animate-pulse-glow` utility |

**Rule:** No component-local keyframes. All animations in `keyframes/*.css`.

### Glass Patterns
The design system CSS (`styles/recipes/glass.css`) is SSOT for all glass classes.
Components should ONLY use existing classes, never redefine.

---

## SSOT Verification

| System | Location | Verified |
|--------|----------|----------|
| Colors | `styles/tokens/colors.css` | Yes |
| Spacing | `styles/tokens/space.css` | Yes |
| Typography | `styles/tokens/type.css` | Yes |
| Glass | `styles/recipes/glass.css` | Yes |
| Buttons | `styles/recipes/buttons.css` | Yes |
| Keyframes | `styles/keyframes/*.css` | Yes |

---

## Decision: Parallel vs Sequential

**Option A: Sequential (Safe)**
1. Complete Sprint 0.A (Rust) first
2. Then Sprint 0.B (Scaffold)
3. Then Sprint 1+

**Option B: Parallel (Faster)**
- Sprint 0.A (Rust) can proceed independently
- Sprint 0.B + Sprint 1 (Frontend) can proceed in parallel
- Desktop just won't have real engine integration until 0.A completes

**Recommendation:** Option B - Desktop can develop with mock/echo commands while Rust boundary work proceeds.

---

*Last Updated: 2026-01-12*
