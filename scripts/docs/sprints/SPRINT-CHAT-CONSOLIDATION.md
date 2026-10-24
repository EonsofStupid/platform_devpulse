# SPRINT: Chat Layout Consolidation

**Status**: PLANNED — awaiting owner approval
**Date**: 2026-03-24
**Priority**: CRITICAL — architectural drift, duplicate implementations

---

## Problem Statement

Previous sessions created a competing chat implementation (`layouts/app/ChatOverlay.svelte`) that duplicates the spec-defined chat architecture. The spec is in `layouts/chat/README.md` and `domains/chat/README.md`. It was written 2026-01-22 and has never been violated — it was simply ignored.

### What the Spec Defines (Verbatim from README)

**Two-window architecture** (Steam-style):
- **Main window**: `layouts/app/` → `routes/(app)/` — the app shell (TopBar, Sidebar, Content, StatusBar)
- **Chat window**: `layouts/chat/` → `routes/(chat)/` — separate Tauri child window, opened via `open_chat_window` Rust command

**Tauri wiring already exists** (`src-tauri/src/commands/window/mod.rs`):
- `open_chat_window` creates a Tauri `WebviewWindow` labeled `"chat"` pointing to `/chat` route
- `decorations: false`, `transparent: true`, `always_on_top: true`
- 450×600 initial size
- Reuses window if already open (focus instead of recreate)

**Chat window spec** (`layouts/chat/README.md`):
- True window — separate layer, not embedded in app shell
- Glass aesthetic via ColdLight
- 30-40% transparent when idle, opaque on engage
- Own CSS grid: topbar / mode-selector / dashboard / context-panel / footer
- 5 grid areas defined in README lines 474-635
- Data attributes: `data-layout="chat"`, `data-state="open|minimized|closed"`, `data-engaged`, `data-context-collapsed`
- Mode selector: DEVELOPER | PLANNING | IMAGE | GENERAL (per-hub availability matrix)
- Cortex visualization in right context panel
- Voice button always visible in footer
- Interactions folder: MultipleChoice, TrueFalse, FillBlank, Confirmation

**Separation of concerns** (`domains/chat/README.md`):
- `layouts/chat/` = visual layer (UI components, styling, animations)
- `domains/chat/` = logic layer (state, validation, service calls)
- `domains/maestro/` = AI orchestration layer
- Event bus between layers (ADR-007 pending)

**State contract** (spec says `sys/runes/global.svelte.ts`):
- `chat_open`, `chat_minimized`, `chat_mode`, `chat_transparency`
- Currently globalState has NONE of these fields — they were never added

**Chat route page** (`routes/(chat)/chat/+page.svelte`):
- Already exists, 139 lines, uses ColdLight blocks (ChatPanel, ThreadList, Card, Text)
- Imports from `$lib/design/blocks/chat/` (central library)
- Has thread sidebar, chat area, context viz placeholder
- Wired to Tauri IPC: `load_recent`, `send_message`

---

## SSOT Map

| Concept | Authority | Location | On Disk? |
|---------|-----------|----------|----------|
| Chat visual architecture | README | `layouts/chat/README.md` | YES |
| Chat CSS grid (5 regions) | README lines 474-635 | `layouts/chat/README.md` | YES (inline in README, not extracted to file) |
| Chat state contract | README lines 400-416 | `layouts/chat/README.md` | SPEC ONLY — not implemented in globalState |
| Interaction component contracts | README lines 109-205 | `layouts/chat/README.md` | SPEC ONLY — no implementations |
| Mode availability matrix | README lines 210-227 | `layouts/chat/README.md` | SPEC ONLY |
| Data attributes contract | README lines 306-323 | `layouts/chat/README.md` | SPEC ONLY |
| Chat-specific tokens | README lines 327-360 | `layouts/chat/README.md` | SPEC ONLY — not in token pipeline |
| Chat domain logic | README | `domains/chat/README.md` | SPEC ONLY — domain is scaffold |
| Chat domain services | README | `domains/chat/README.md` | SPEC ONLY — no service files |
| Mode config contract | README lines 160-176 | `domains/chat/README.md` | SPEC ONLY |
| Tool contract | README lines 198-206 | `domains/chat/README.md` | SPEC ONLY |
| Event bus contracts | Both READMEs | `layouts/chat/README.md` + `domains/chat/README.md` | SPEC ONLY — ADR-007 pending |
| ChatMessage type | Rust struct | `src-tauri/src/commands/chat/mod.rs` → `sys/generated/chat.types.ts` | YES |
| Tauri window command | Rust | `src-tauri/src/commands/window/mod.rs` | YES — `open_chat_window` works |
| Chat route page | SvelteKit | `routes/(chat)/chat/+page.svelte` | YES — 139 lines, functional |
| Chat route layout | SvelteKit | `routes/(chat)/+layout.svelte` | YES — imports ChatFrame |
| Chat shell Frame | Svelte | `layouts/chat/components/shell/Frame.svelte` | YES — simplified, doesn't match grid spec |
| Chat shell stubs (10) | Svelte | `layouts/chat/components/*/` | YES — all empty stubs |
| **DUPLICATE** ChatOverlay | Svelte | `layouts/app/ChatOverlay.svelte` | YES — 243 lines, VIOLATES spec |

---

## What's Wrong (Precise)

### 1. `layouts/app/ChatOverlay.svelte` — DUPLICATE, DELETE
- 243 lines building chat as a draggable `<div>` inside the main app window
- Violates spec: chat is a separate Tauri window, not an in-app overlay
- Has its own message loading, sending, drag state — duplicates the real chat route page
- Imported by `routes/(app)/+layout.svelte` with Ctrl+Shift+C toggle

### 2. `layouts/chat/components/shell/Frame.svelte` — WRONG, REWRITE
- Current: simplified 2-zone grid (topbar + dashboard), 80 lines
- Spec: 5-zone CSS grid (topbar / mode / dashboard / context / footer)
- Missing: data-state, data-engaged, data-context-collapsed attributes
- Missing: doesn't use the CSS from README lines 474-635

### 3. `globalState` — MISSING FIELDS
- Current: `current_domain`, `sidebar_mode`, `sidebar_submenu`, `context_mode`, `overlay_active`
- Missing per spec: `chat_open`, `chat_minimized`, `chat_mode`, `chat_transparency`, `toggleChat()`, `setMode()`, `minimizeChat()`

### 4. 10 chat shell stubs — NEVER IMPLEMENTED
- TopBar, LeftSidebar, QuickMenu, ChatDashboard (shell/)
- ContextPanel, HistoryPanel, StatusBar, Footer (panels/)
- CommandPalette, ModeSelector (overlays/)
- All are empty files with `@defaults` blocks and `[TODO]` markers

### 5. Chat CSS grid — IN README, NOT EXTRACTED
- README lines 474-635 contain the full CSS but it's embedded in the markdown
- Never extracted to `layouts/chat/styles/shell.css`
- Chat window has no structural CSS

### 6. `layouts/app/AppLayout.svelte` — EMPTY DEAD FILE
- 1 line, does nothing, delete

---

## Phase 1: Delete Drift + Dead Files

> Goal: Remove the duplicate. Clean dead weight.

- [ ] **1.1** DELETE `layouts/app/ChatOverlay.svelte`
- [ ] **1.2** EDIT `routes/(app)/+layout.svelte` — remove ChatOverlay import, remove `chatOpen` state, remove Ctrl+Shift+C keybinding, remove `onKeydown` handler. Result: just Frame wrapping children.
- [ ] **1.3** DELETE `layouts/app/AppLayout.svelte` (empty stub)
- [ ] **1.4** DELETE `.claude/` folders inside `layouts/` and `layouts/app/` and `layouts/chat/` (AI session artifacts)
- [ ] **1.5** `pnpm svelte-check` — zero new errors
- [ ] **1.6** Verify main app window still renders at `/devpulse`

---

## Phase 2: Add Chat State to GlobalState

> Goal: `global.svelte.ts` has the fields the spec defines.

Per spec (README lines 400-416):

- [ ] **2.1** Add to `GlobalState` class:
  ```typescript
  chat_open = $state(false);
  chat_minimized = $state(false);
  chat_mode = $state<'developer' | 'planning' | 'image' | 'general'>('general');
  chat_transparency = $state(0.35);

  toggleChat() { this.chat_open = !this.chat_open; }
  setMode(mode: 'developer' | 'planning' | 'image' | 'general') { this.chat_mode = mode; }
  minimizeChat() { this.chat_minimized = true; }
  ```
- [ ] **2.2** `pnpm svelte-check` passes

---

## Phase 3: Extract Chat CSS Grid

> Goal: The CSS from README lines 474-635 becomes a real stylesheet.

- [ ] **3.1** Create `layouts/chat/styles/shell.css` — verbatim from README spec (lines 474-635)
- [ ] **3.2** Import in CSS chain so it loads in the chat window
- [ ] **3.3** Verify CSS loads via browser dev tools when chat window opens

---

## Phase 4: Rewrite Frame.svelte to Match Spec

> Goal: Frame renders the 5-zone CSS grid with correct data attributes.

Per spec — component flow (line 69-86), data attributes (lines 306-323), grid areas (lines 494-497):

- [ ] **4.1** Rewrite `layouts/chat/components/shell/Frame.svelte`:
  - Root div: `data-layout="chat"` `data-state` `data-engaged` `data-context-collapsed`
  - 5 children with `data-slot`: topbar, mode-selector, chat-dashboard, context-panel, chat-footer
  - Each slot renders the corresponding component (TopBar, LeftSidebar, ChatDashboard, ContextPanel, Footer)
  - Reads `globalState.chat_open`, `chat_minimized` for state
- [ ] **4.2** Update `layouts/chat/index.ts` barrel export
- [ ] **4.3** `pnpm svelte-check` passes

---

## Phase 5: Implement Shell Components (from stubs)

> Goal: Each stub becomes a real component per the spec.

### 5A: TopBar.svelte
Per spec: "Hub tabs, minimize, close"
- [ ] **5A.1** Hub label showing current domain (e.g. "DEVPULSE/HQ")
- [ ] **5A.2** "CORTEX MEMORY" title
- [ ] **5A.3** Minimize + close buttons (invoke `close_window` for close)
- [ ] **5A.4** All ColdLight components from central library

### 5B: LeftSidebar.svelte (Mode Selector)
Per spec: MODE selector — DEVELOPER | PLANNING | IMAGE | GENERAL
- [ ] **5B.1** Vertical mode buttons: DEV, PLAN, IMG, GEN
- [ ] **5B.2** Active state styling with mode colors from tokens (`--mode-developer`, etc.)
- [ ] **5B.3** Hub-based availability (mode matrix from README lines 210-218)
- [ ] **5B.4** Reads/writes `globalState.chat_mode`, reads `globalState.current_domain`
- [ ] **5B.5** `data-slot="mode-selector"` `data-mode="{current_mode}"`

### 5C: Footer.svelte
Per spec: Input area + voice + tools
- [ ] **5C.1** Text input field (ColdLight TextField)
- [ ] **5C.2** Send button
- [ ] **5C.3** Voice button (always visible, bottom right per spec)
- [ ] **5C.4** `data-slot="chat-footer"`
- [ ] **5C.5** Wire to existing `send_message` IPC

### 5D: ChatDashboard.svelte
Per spec: Main chat thread view
- [ ] **5D.1** Message thread container with auto-scroll
- [ ] **5D.2** Uses existing ChatPanel/ThreadList blocks from `$lib/design/blocks/chat/`
- [ ] **5D.3** `data-slot="chat-dashboard"`
- [ ] **5D.4** Scrollbar styling per spec (lines 619-634)

### 5E: StatusBar.svelte + ContextPanel.svelte + QuickMenu.svelte
- [ ] **5E.1** StatusBar — chat-specific connection status
- [ ] **5E.2** ContextPanel — placeholder with "Cortex visualization" text (full viz is SPRINT-CHAT-UI-ENGINE Phase C)
- [ ] **5E.3** QuickMenu — tools quick-access (placeholder, wired later)

### Verification
- [ ] **5F.1** `pnpm svelte-check` passes
- [ ] **5F.2** Chat window opens via TopBar button (Tauri `open_chat_window`)
- [ ] **5F.3** All 5 grid regions visible in chat window
- [ ] **5F.4** Mode selector toggles modes
- [ ] **5F.5** Messages send and display

---

## Phase 6: Wire Chat-Specific Tokens

> Goal: Token vars from spec (lines 327-360) are in the token pipeline.

- [ ] **6.1** Add chat-specific tokens to DTCG source:
  - `--chat-idle-opacity`, `--chat-engaged-opacity`
  - `--chat-z-index`, `--chat-overlay-z`
  - `--chat-width`, `--chat-min-width`, `--chat-max-width`, `--chat-height`, `--chat-min-height`
  - `--chat-bottom`, `--chat-right`
  - `--mode-developer`, `--mode-planning`, `--mode-image`, `--mode-general`
  - `--voice-active`, `--voice-pulse`
- [ ] **6.2** Rebuild SD5 pipeline
- [ ] **6.3** Verify tokens appear in `tokens.generated.css`
- [ ] **6.4** Update `shell.css` to use token vars instead of hardcoded values

---

## Out of Scope (Deferred to SPRINT-CHAT-UI-ENGINE)

These are explicitly defined in the existing sprint plan and NOT part of this consolidation:

- Interaction components (MultipleChoice, TrueFalse, FillBlank, Confirmation)
- Rich message types / MessageRenderer
- Cortex visualization (network graph in ContextPanel)
- CommandPalette overlay
- ModeSelector overlay (dropdown variant)
- HistoryPanel (thread switching)
- Voice recording / STT pipeline
- Event bus (ADR-007 pending)
- Mode-specific prompt weighting

---

## Files Changed

| File | Action | Reason |
|------|--------|--------|
| `layouts/app/ChatOverlay.svelte` | **DELETE** | Duplicate — violates spec |
| `layouts/app/AppLayout.svelte` | **DELETE** | Empty dead file |
| `routes/(app)/+layout.svelte` | **EDIT** | Remove ChatOverlay import + keybinding |
| `sys/runes/global.svelte.ts` | **EDIT** | Add chat state fields per spec |
| `layouts/chat/styles/shell.css` | **CREATE** | Extract CSS grid from README |
| `layouts/chat/components/shell/Frame.svelte` | **REWRITE** | Match 5-zone grid spec |
| `layouts/chat/components/shell/TopBar.svelte` | **IMPLEMENT** | From stub |
| `layouts/chat/components/shell/LeftSidebar.svelte` | **IMPLEMENT** | From stub |
| `layouts/chat/components/shell/ChatDashboard.svelte` | **IMPLEMENT** | From stub |
| `layouts/chat/components/shell/QuickMenu.svelte` | **IMPLEMENT** | From stub (placeholder) |
| `layouts/chat/components/panels/Footer.svelte` | **IMPLEMENT** | From stub |
| `layouts/chat/components/panels/StatusBar.svelte` | **IMPLEMENT** | From stub |
| `layouts/chat/components/panels/ContextPanel.svelte` | **IMPLEMENT** | From stub (placeholder) |
| `layouts/chat/index.ts` | **EDIT** | Update barrel exports |
| Token DTCG source | **EDIT** | Add chat-specific tokens |

### NOT Changed (Correct As-Is)

| File | Why It Stays |
|------|-------------|
| `routes/(chat)/+layout.svelte` | Correct — loads ChatFrame for chat window |
| `routes/(chat)/chat/+page.svelte` | Correct — functional chat page using ColdLight blocks |
| `layouts/app/Frame.svelte` | Correct — main app shell, untouched |
| `layouts/app/TopBar.svelte` | Correct — has `open_chat_window` invoke |
| `layouts/app/Sidebar.svelte` | Correct — main app nav |
| `layouts/app/StatusBar.svelte` | Correct — main app status |
| `layouts/app/BootOverlay.svelte` | Correct — boot splash |
| `src-tauri/src/commands/window/mod.rs` | Correct — Tauri window management |

---

## Verification (Per Phase)

After each phase:
1. `pnpm svelte-check` — 0 errors
2. `pnpm dev` — main app renders at `/devpulse`
3. Chat window opens via TopBar button
4. No duplicate chat implementations on disk
5. All ColdLight components from central library — no raw HTML

---

## Depends On

- Nothing — this is consolidation of existing spec + deletion of drift

## Blocks

- SPRINT-CHAT-UI-ENGINE Phase B (rich messages)
- SPRINT-CHAT-UI-ENGINE Phase C (cortex viz)
