# SPRINT: Chat UI Engine

**Status**: PLANNING — awaiting owner approval
**Research**: [SPRINT-CHAT-UI-ENGINE.research.md](SPRINT-CHAT-UI-ENGINE.research.md)
**Date**: 2026-03-17

---

## Objective

Transform the Maestro chat from plain text bubbles into a full interactive UI engine matching the owner's design vision. CSS grid shell, mode selector, rich message types, interactive response components, cortex memory visualization, voice indicator.

---

## Prerequisites

- [x] svelte-check 0 errors
- [x] App boots, all services healthy
- [x] ColdLight components available (89 kinds)
- [x] shell.chat.default recipe has all slots
- [x] platformState tracks subsystem health
- [x] Chat IPC working (send_message, load_recent)

---

## SSOT Map

| Concept | Authority | Location |
|---------|-----------|----------|
| Chat grid layout | README spec | `layouts/chat/README.md` (lines 474-635) |
| Chat recipe slots | Recipe | `recipes/layouts/shell/shell.chat.ts` |
| ChatMessage type | Rust struct | `src-tauri/src/commands/chat/mod.rs` → `sys/generated/chat.types.ts` |
| Subsystem health | platformState | `sys/runes/platformState.svelte.ts` |
| Mode definitions | README spec | `layouts/chat/README.md` (lines 219-227) |
| Interaction contracts | README spec | `layouts/chat/README.md` (lines 109-205) |
| Block kinds | Registry | `blocks/kinds.ts` |

---

## Phase A: Shell Grid + Mode Selector + Footer

> Goal: The chat window renders with the correct CSS grid layout, mode selector on the left, chat thread in the center, and input footer at the bottom. Context panel hidden (collapsed) for now.

### STOP — Owner Decision Required

**Question**: Where should the chat grid CSS live?

**Options**:
- **A)** Extract to `layouts/chat/styles/shell.css` (separate file, imported by Frame.svelte)
- **B)** Inline in Frame.svelte `<style>` block
- **C)** Add to the shell.chat recipe as Tailwind utility classes (current recipe pattern)

**Impact**: Sets the pattern for all layout CSS. The README spec uses `[data-layout="chat"]` selectors which implies option A. The recipe already handles some of this with `cn()` classes.

**My recommendation**: A — the CSS is grid-structural, not visual encoding. Recipes handle 8-axis visuals. Grid belongs in a layout stylesheet.

---

### STOP — Owner Decision Required

**Question**: Chat state management — where does chat_mode, chat_open, etc. live?

**Options**:
- **A)** New file `sys/runes/chatState.svelte.ts` (dedicated chat rune)
- **B)** Add to existing `sys/runes/platformState.svelte.ts`
- **C)** New file `layouts/chat/state.svelte.ts` (co-located with layout)

**Impact**: The README spec says `sys/runes/global.svelte.ts` but that file may not exist. Chat state includes: mode, open/minimized, transparency, engaged.

**My recommendation**: A — chat is cross-cutting (overlay + dedicated window), deserves its own rune.

---

### Tasks (after STOP decisions)

- [ ] **A.1** Extract CSS grid to chosen location
- [ ] **A.2** Build TopBar.svelte — hub label ("DEVPULSE/HQ"), "CORTEX MEMORY" title, project loaded badge
- [ ] **A.3** Build LeftSidebar.svelte — mode selector (DEVELOPER/PLANNING/IMAGE/GENERAL) with active state
- [ ] **A.4** Build Footer.svelte — input bar + mic button + send button + voice active indicator
- [ ] **A.5** Build ChatDashboard.svelte — message thread container (scrollable, auto-scroll to bottom)
- [ ] **A.6** Rewrite Frame.svelte — full CSS grid with all 5 regions, data-layout/data-state attributes
- [ ] **A.7** Create chatState rune (or add to chosen location)
- [ ] **A.8** Rewrite `/chat` route page to use new shell components
- [ ] **A.9** svelte-check passes, dev server renders correctly

---

## Phase B: Rich Messages + Interactions

> Goal: Maestro responses can contain structured content — code blocks, task cards with action buttons, interactive response components. Not just plain text.

### STOP — Owner Decision Required

**Question**: How do rich message types flow from backend to frontend?

**Options**:
- **A)** ChatMessage.content stays as string, but uses a structured JSON format that the frontend parses (e.g. `{"type":"task","title":"task.md","items":[...],"actions":["EDIT","APPROVE","DECLINE"]}`)
- **B)** Add a new `content_type` field to ChatMessage (Rust struct change + migration)
- **C)** Use a message wrapper: `{ blocks: [{ type: "text", content: "..." }, { type: "code", language: "ts", content: "..." }] }`

**Impact**: This is the core contract for interactive UI generation. The screenshots show code previews, task cards, and action buttons all in a single Maestro message. Needs to be extensible.

**My recommendation**: C — a blocks array allows one message to contain multiple content types (text paragraph + code block + action buttons), which matches the screenshots. Can be JSON-encoded in the existing content string field to avoid Rust struct changes initially.

---

### STOP — Owner Decision Required

**Question**: Which interactions to build first?

The README specs 4: MultipleChoice, TrueFalse, FillBlank, Confirmation.
The screenshots show task cards with EDIT/APPROVE/DECLINE buttons (closest to Confirmation).

**Options**:
- **A)** Build Confirmation first (matches screenshots), then MultipleChoice
- **B)** Build all 4 in order
- **C)** Build a generic ActionCard first (covers task.md screenshot), then the 4 interaction types

**My recommendation**: C — the task.md card in the screenshot is really an ActionCard (title, body, action buttons). That's the most visible win. Then Confirmation and MultipleChoice.

---

### Tasks (after STOP decisions)

- [ ] **B.1** Define message content block types (TypeScript discriminated union)
- [ ] **B.2** Build MessageRenderer.svelte — dispatches block types to renderers
- [ ] **B.3** Build TextBlock renderer (current plain text, with markdown support later)
- [ ] **B.4** Build CodeBlock renderer (syntax-highlighted code preview)
- [ ] **B.5** Build ActionCard renderer (title + body + action buttons — the task.md card)
- [ ] **B.6** Build InteractionBlock wrapper (renders interaction components inside messages)
- [ ] **B.7** Build Confirmation.svelte interaction
- [ ] **B.8** Build MultipleChoice.svelte interaction
- [ ] **B.9** Wire ActionCard button clicks back to chat state / IPC
- [ ] **B.10** svelte-check passes, interactions render in thread

---

## Phase C: Cortex Viz + Voice + Polish

> Goal: Right panel shows live backend connection visualization. Voice indicator works. Chat overlay updated to match.

### STOP — Owner Decision Required

**Question**: Cortex Memory visualization — what should the nodes represent?

**Options**:
- **A)** Platform subsystems from platformState (LibSQL, SurrealDB, DuckDB, RRO, Moka, Kokoros, Grammar) — shows REAL connection status
- **B)** Knowledge categories (IMAGES, NOTES, FLAT FILE, VECTOR DB, PROJECT BRAIN) — matches screenshot labels
- **C)** Both — subsystems as nodes, knowledge categories as labels on edges

**Impact**: Option A shows real data. Option B matches the screenshot mockup exactly. Option C is most complete but most complex.

**My recommendation**: B for visual labels, A for the actual health status indicators on each node. The screenshot shows "LIBSQL", "VECTOR DB", "FLAT FILE" etc. which maps to real subsystems, and "IMAGES", "NOTES" which are knowledge categories stored IN those subsystems.

---

### Tasks (after STOP decisions)

- [ ] **C.1** Build ContextPanel.svelte — network graph with nodes + edges (SVG or Canvas)
- [ ] **C.2** Wire nodes to platformState subsystem health (green/amber/red)
- [ ] **C.3** Add "PROJECT LOADED: DevPulse_V1.2" badge to TopBar
- [ ] **C.4** Wire voice indicator in Footer to Kokoros service status
- [ ] **C.5** Add voice active pulsing animation (when mic is active)
- [ ] **C.6** Update ChatOverlay.svelte to use new shell components (or defer)
- [ ] **C.7** Add idle transparency (30-40% when not engaged, 100% on hover)
- [ ] **C.8** Final svelte-check + visual review

---

## Out of Scope (Deferred)

- Event bus (ADR-007 pending — direct IPC works fine for now)
- FillBlank interaction (low priority)
- ChatSplit / ChatFullscreen block variants
- CommandPalette overlay
- HistoryPanel (thread switching)
- Actual voice recording / STT pipeline
- Mode-specific prompt weighting (backend concern)
- MCP tool support

---

## Verification

After each phase:
1. `pnpm svelte-check` — 0 errors
2. `pnpm dev` — chat renders correctly at localhost:1420
3. Visual comparison against reference screenshots
4. All ColdLight components used correctly (no raw HTML where components exist)
