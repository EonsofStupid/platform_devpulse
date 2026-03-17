# Research: Maestro Chat UI Engine

**Date**: 2026-03-17
**Sprint**: SPRINT-CHAT-UI-ENGINE
**Status**: COMPLETE

## SSOT Map

### Types
| Type | Location | Notes |
|------|----------|-------|
| `ChatMessage` (TS) | `sys/generated/chat.types.ts` | Mirrors Rust, id/session_id/role/content/created_at |
| `ChatMessage` (Rust) | `src-tauri/src/commands/chat/mod.rs` | Source of truth |
| `ChatPayload` (Rust) | `systems/devpulse-engine/src/signals/payloads.rs` | Engine signal, has ChatRole enum |
| `ChatRole` (Rust) | `systems/devpulse-engine/src/signals/payloads.rs` | User/Assistant/System |

### Tauri IPC Commands
| Command | Status | What It Does |
|---------|--------|--------------|
| `send_message(content)` | WORKING | Persists to LibSQL, returns ChatMessage |
| `load_recent()` | WORKING | Last 50 messages from most recent session |
| `post_reaction()` | STUB | Empty function |
| `get_boot_state()` | WORKING | Boot snapshot with subsystem health |
| `get_status()` | WORKING | SystemHealth (Healthy/Degraded/Down) |

### Schemas
| Schema | Location | Notes |
|--------|----------|-------|
| `DsSurfaceProps` | `recipes/types.ts` | 8-axis visual props |
| `BlockNode` | `blocks/schema.ts` | Zod-validated block contract |
| `ComponentSchema` | `components/_base/schema.ts` | Component prop schemas |

### Chat Layout Files (ALL STUBS)
| File | Status |
|------|--------|
| `layouts/chat/components/shell/Frame.svelte` | PARTIAL — has topbar+dashboard, no grid |
| `layouts/chat/components/shell/TopBar.svelte` | EMPTY STUB |
| `layouts/chat/components/shell/LeftSidebar.svelte` | EMPTY STUB |
| `layouts/chat/components/shell/ChatDashboard.svelte` | EMPTY STUB |
| `layouts/chat/components/shell/QuickMenu.svelte` | EMPTY STUB |
| `layouts/chat/components/panels/Footer.svelte` | EMPTY STUB |
| `layouts/chat/components/panels/ContextPanel.svelte` | EMPTY STUB |
| `layouts/chat/components/panels/HistoryPanel.svelte` | EMPTY STUB |
| `layouts/chat/components/panels/StatusBar.svelte` | EMPTY STUB |
| `layouts/chat/components/overlays/CommandPalette.svelte` | EMPTY STUB |
| `layouts/chat/components/overlays/ModeSelector.svelte` | EMPTY STUB |

### Recipes
| Recipe | Location | Status |
|--------|----------|--------|
| `shell.chat.default` | `recipes/layouts/shell/shell.chat.ts` | WORKING — has frame/topbar/modeSelector/dashboard/footer slots |

### CSS Grid
- Full CSS grid spec is in `layouts/chat/README.md` (lines 474-635)
- NOT in a separate .css file — embedded in README
- Grid: topbar (full width), mode | dashboard | context, footer (full width)
- States: open, minimized, closed
- Context panel collapsible

### No Duplicates Found
- ChatMessage type exists in TS and Rust — they mirror, no conflict
- No competing chat schemas

## Question/Goal

Rebuild the Maestro chat from plain text bubbles into a full interactive UI generation engine matching the owner's design vision:
1. CSS grid shell with mode selector, chat thread, cortex panel, footer
2. Rich message content types (code blocks, task cards, action buttons)
3. Interactive response components (MultipleChoice, TrueFalse, Confirmation)
4. Cortex Memory network visualization
5. Voice Active indicator
6. Mode-aware behavior (DEVELOPER/PLANNING/IMAGE/GENERAL)

## Codebase Analysis

### What EXISTS and WORKS
- Chat page at `/chat` route — basic text bubbles, send/receive via IPC
- ChatOverlay — draggable floating panel, same basic bubbles
- ChatFrame — partial shell with topbar + dashboard slot only
- shell.chat.default recipe — has slots for all regions
- 89 ColdLight component kinds available
- Widget block system (Widget, RadialGauge, SparkLine)
- platformState rune — tracks boot state, subsystem health, connection status
- Voice service (Kokoros TTS) — exists in Rust, disabled in config

### What EXISTS as SPECS ONLY
- layouts/chat/README.md — full architecture spec with CSS grid, event bus, interactions
- domains/maestro/README.md — cortex/debug/minions/status folder structure
- Chat block definitions in blocks/kinds.ts (chat-frame, chat-topbar, etc.)

### What DOES NOT EXIST
- CSS grid layout as an actual .css file (only in README)
- Any shell component implementation (all empty stubs)
- interactions/ folder and components
- Message content type system
- Cortex visualization
- Event bus
- Chat-specific state rune

## Findings

1. **The grid CSS is fully designed** — it's in the README, just needs extraction to a real file
2. **The recipe has all 5 slots** — frame, topbar, modeSelector, dashboard, footer
3. **ChatMessage.content is raw string** — needs a content type discriminator for rich messages
4. **No event bus exists** — currently direct IPC. Event bus is ADR-PENDING
5. **Voice service exists but is disabled** — voice_enabled: false in config
6. **platformState already tracks subsystems** — can power the Cortex Memory viz from real data
7. **Interaction component specs are detailed** — MultipleChoice, TrueFalse, FillBlank, Confirmation all specced in README

## Anti-Pattern Risks

1. **Building event bus before it's needed** — Direct IPC works. Don't build infrastructure before features.
2. **Rich content parsing in frontend** — Content types should be structured data from backend, not markdown parsing.
3. **Cortex viz as cosmetic only** — Should show REAL subsystem data from platformState, not fake nodes.
4. **Overbuilding interactions before testing** — Build one interaction (Confirmation) first, validate the pattern, then the rest.

## Recommendations

### Phase approach (3 sprints):

**Sprint A: Shell Grid + Mode Selector + Footer**
- Extract CSS grid to real file
- Build Frame.svelte with full grid
- Build LeftSidebar (mode selector)
- Build Footer (input + voice indicator)
- Build TopBar (hub label + project badge)
- Wire to /chat route

**Sprint B: Rich Messages + Interactions**
- Define message content type system (text, code, task, interaction)
- Build message renderer that dispatches by content type
- Build code block rendering
- Build task card with action buttons (EDIT/APPROVE/DECLINE)
- Build Confirmation interaction component
- Build MultipleChoice interaction component

**Sprint C: Cortex Viz + Voice + Polish**
- Build ContextPanel with network graph from platformState subsystems
- Wire voice indicator to Kokoros service status
- Add TrueFalse and FillBlank interactions
- Update ChatOverlay to use new components
- Add idle transparency behavior

## Files Referenced
- `routes/(chat)/chat/+page.svelte` — current chat page (will be rewritten)
- `layouts/chat/README.md` — architecture spec (SSOT for chat design)
- `layouts/chat/components/shell/Frame.svelte` — partial frame (needs full grid)
- `recipes/layouts/shell/shell.chat.ts` — chat recipe with 5 slots
- `sys/generated/chat.types.ts` — ChatMessage type
- `sys/runes/platformState.svelte.ts` — boot/health state
- `sys/cfg/maestro/general.ts` — voice_enabled config
- `blocks/kinds.ts` — BLOCK_CATEGORIES with chat kinds
- `domains/maestro/README.md` — domain folder spec
