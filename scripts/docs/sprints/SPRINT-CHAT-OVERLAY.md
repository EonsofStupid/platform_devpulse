# SPRINT: Chat Overlay with ColdLight Primitives

> **Status**: READY (blocked by SPRINT-TOKEN-BRIDGE + SPRINT-APP-SHELL-REBUILD)
> **Priority**: HIGH
> **Goal**: Build the true-window chat overlay using ColdLight primitives, thick glass aesthetic, interactions folder
> **Research**: [SPRINT-VISUAL-SCAFFOLDING.research.md](./SPRINT-VISUAL-SCAFFOLDING.research.md)
> **Spec**: [layouts/chat/README.md](../../../interfaces/desktop/src/lib/layouts/chat/README.md)
> **Master Plan Phase**: Phase 8 (Layout Rebuild) + Phase 9 (Recipe Expansion)
> **Date**: 2026-02-07

---

## Problem Statement

11 chat layout stubs exist on disk — all empty TODO templates. The chat README specifies a detailed architecture: true-window floating overlay, mode selector (DEV/PLAN/IMG/GEN), interactions folder (MultipleChoice, TrueFalse, FillBlank, Confirmation), cortex visualization, and voice button. Every interactive element maps to a ColdLight primitive.

### Current State

All 11 files contain only the auto-generated comment header. Zero implementation.

```
shell/Frame.svelte          — empty stub
shell/ChatDashboard.svelte  — empty stub
shell/TopBar.svelte         — empty stub
shell/LeftSidebar.svelte    — empty stub
shell/QuickMenu.svelte      — empty stub
panels/ContextPanel.svelte  — empty stub
panels/Footer.svelte        — empty stub
panels/HistoryPanel.svelte  — empty stub
panels/StatusBar.svelte     — empty stub
overlays/CommandPalette.svelte — empty stub
overlays/ModeSelector.svelte   — empty stub
```

Interactions folder does NOT exist yet (4 components + barrel).

---

## Prerequisites

- [ ] **SPRINT-TOKEN-BRIDGE complete** — @theme emits correct utilities
- [ ] **SPRINT-APP-SHELL-REBUILD complete** — pattern for using ColdLight primitives in layouts established
- [x] Chat README spec exists (450 lines, detailed contracts)
- [x] ColdLight primitives on disk: dialog, sheet, tabs, toggle-group, command, input, textarea, radio-group, alert-dialog, dropdown-menu, button, tooltip, badge, scroll-area, separator
- [ ] Icon system installed (from app shell sprint)
- [ ] Global state extended with chat runes (chat_open, chat_minimized, chat_mode)

---

## Primitive→Component Mapping

| Chat Component | ColdLight Primitive(s) | Reason |
|---------------|----------------------|--------|
| **Frame** (overlay) | **Sheet** | Side-anchored overlay panel with backdrop, escape dismiss, focus trap |
| **TopBar** | **Tabs** + **Button** + **Separator** | Hub tabs (DEVPULSE/HQ, CORTEX MEMORY), minimize/close buttons |
| **LeftSidebar** (modes) | **ToggleGroup** | Mutually exclusive mode selection (DEV/PLAN/IMG/GEN) |
| **ChatDashboard** | **ScrollArea** | Scrollable message thread |
| **QuickMenu** | **DropdownMenu** | Tools quick-access (attach, code, etc.) |
| **Footer** | **Textarea** + **Button** | Message input + send + voice button |
| **ContextPanel** | Canvas/SVG (not a primitive) | Cortex memory visualization graph |
| **HistoryPanel** | **ScrollArea** + list items | Conversation thread list |
| **StatusBar** | **Badge** | Chat-specific status indicators |
| **CommandPalette** | **Command** | Cmd+K command interface |
| **ModeSelector** | **ToggleGroup** | Mode switching (also used by LeftSidebar) |
| **MultipleChoice** | **RadioGroup** (single) / **Checkbox** group (multi) | AI-generated option selection |
| **TrueFalse** | **ToggleGroup** (2 items) or **Button** pair | Binary yes/no choice |
| **FillBlank** | **Input** + **Label** + **Select** (for select type) | Text/number/select blanks |
| **Confirmation** | **AlertDialog** | Action confirmation with confirm/cancel |

---

## Tasks

### Phase A: Global State Extension

- [ ] **A1.** Add chat state to `sys/runes/global.svelte.ts`:
  ```typescript
  chat_open = $state(false);
  chat_minimized = $state(false);
  chat_mode = $state<'developer' | 'planning' | 'image' | 'general'>('general');
  chat_transparency = $state(0.35);
  ```

- [ ] **A2.** Add chat methods:
  ```typescript
  toggleChat() { this.chat_open = !this.chat_open; }
  setMode(mode: ChatMode) { this.chat_mode = mode; }
  minimizeChat() { this.chat_minimized = true; }
  ```

- [ ] **A3.** Add `ChatMode` type export

### Phase B: Chat Shell Components

- [ ] **B1.** Build `shell/Frame.svelte` — floating overlay using **Sheet**:
  - Position: bottom-right, z-1000+
  - Size: 400px wide × 60vh tall (min/max from README tokens)
  - Glass surface: `bg-glass-void backdrop-blur-xl`
  - Idle opacity: 30-40% (`chat_transparency` state)
  - Active: full opacity on hover/focus-within
  - Close button, minimize button
  - Data attributes: `data-layout="chat" data-state="open|minimized|closed"`

- [ ] **B2.** Build `shell/TopBar.svelte` — hub tabs + controls:
  - **Tabs** primitive for hub/section switching (DEVPULSE/HQ, CORTEX MEMORY)
  - Minimize **Button** + close **Button** (top-right)
  - Glass surface for tab bar

- [ ] **B3.** Build `shell/LeftSidebar.svelte` — mode selector:
  - **ToggleGroup** with vertical orientation
  - 4 items: DEV, PLAN, IMG, GEN
  - Mode colors from tokens: `--mode-developer: var(--signal-teal)`, `--mode-planning: var(--signal-purple)`, `--mode-image: var(--signal-orange)`, `--mode-general: var(--text-muted)`
  - Data attributes: `data-slot="mode-selector" data-mode="{current_mode}"`

- [ ] **B4.** Build `shell/ChatDashboard.svelte` — message thread:
  - **ScrollArea** wrapping message list
  - Message components render inside (user messages, AI messages)
  - Interaction components render inline in thread
  - Auto-scroll to bottom on new messages
  - Data attributes: `data-slot="chat-dashboard"`

- [ ] **B5.** Build `shell/QuickMenu.svelte` — tools menu:
  - **DropdownMenu** with tool options (attach file, code block, etc.)
  - Trigger: icon **Button**
  - Glass surface for dropdown content

### Phase C: Chat Panel Components

- [ ] **C1.** Build `panels/Footer.svelte` — input area:
  - **Textarea** for message input (auto-resize)
  - Send **Button** (right of input)
  - Voice **Button** (always visible, bottom-right) with pulse animation
  - **DropdownMenu** trigger for QuickMenu
  - Keyboard: Enter to send, Shift+Enter for newline

- [ ] **C2.** Build `panels/ContextPanel.svelte` — cortex visualization:
  - Canvas or SVG for network graph (not a primitive)
  - Placeholder with glass surface until cortex engine is wired
  - Shows memory/context connections

- [ ] **C3.** Build `panels/HistoryPanel.svelte` — thread history:
  - **ScrollArea** with conversation list
  - Each item: title, preview, timestamp
  - Click to load conversation

- [ ] **C4.** Build `panels/StatusBar.svelte` — chat status:
  - **Badge** components for: thinking state, connection, mode indicator
  - Map to Maestro events (placeholder until wired)

### Phase D: Chat Overlay Components

- [ ] **D1.** Build `overlays/CommandPalette.svelte` — Cmd+K:
  - **Command** primitive (full accessible combobox pattern)
  - Keyboard: Cmd+K to open globally
  - Glass surface overlay
  - Actions: search messages, switch mode, clear thread, toggle panels

- [ ] **D2.** Build `overlays/ModeSelector.svelte` — mode switching:
  - **ToggleGroup** or **Tabs** (shares logic with LeftSidebar)
  - Used in compact view when LeftSidebar is hidden

### Phase E: Interactions Folder

> Location: `layouts/chat/components/interactions/`

These are ColdLight primitive compositions for AI-generated structured responses.

- [ ] **E1.** Build `interactions/MultipleChoice.svelte`:
  - **RadioGroup** when `multiSelect: false`
  - Checkbox group when `multiSelect: true`
  - Props: `question`, `options[]`, `selected`, `multiSelect`, `onSelect`
  - Glass card surface per option
  - Data attribute: `data-interaction="multiple-choice"`

- [ ] **E2.** Build `interactions/TrueFalse.svelte`:
  - Two **Button** components or **ToggleGroup** with 2 items
  - Props: `statement`, `context?`, `value`, `onChange`
  - Highlight selected button
  - Data attribute: `data-interaction="true-false"`

- [ ] **E3.** Build `interactions/FillBlank.svelte`:
  - **Input** (type text/number) or **Select** (for select type) per blank
  - **Label** for each blank
  - Props: `prompt`, `blanks[]`, `values`, `onChange`
  - Data attribute: `data-interaction="fill-blank"`

- [ ] **E4.** Build `interactions/Confirmation.svelte`:
  - **AlertDialog** primitive
  - Props: `title`, `message`, `confirmLabel?`, `cancelLabel?`, `variant?`, `onConfirm`, `onCancel`
  - Variant styling: default (teal), destructive (ember), success (teal glow)
  - Data attribute: `data-interaction="confirmation"`

- [ ] **E5.** Create `interactions/index.ts` barrel:
  ```typescript
  export { default as MultipleChoice } from './MultipleChoice.svelte';
  export { default as TrueFalse } from './TrueFalse.svelte';
  export { default as FillBlank } from './FillBlank.svelte';
  export { default as Confirmation } from './Confirmation.svelte';
  ```

### Phase F: Chat Layout Assembly + README

- [ ] **F1.** Create `layouts/chat/index.ts` barrel exporting all chat components

- [ ] **F2.** Wire Frame to compose all shell + panel components:
  ```
  Frame
  ├── TopBar (tabs + controls)
  ├── LeftSidebar (mode selector)
  ├── ChatDashboard (message thread + interactions)
  ├── ContextPanel (cortex viz) [optional, toggle-able]
  └── Footer (input + voice + tools)
  ```

- [ ] **F3.** Add chat-specific CSS tokens to design system (from README Token Dependencies):
  ```css
  --chat-idle-opacity: 0.35;
  --chat-engaged-opacity: 1;
  --chat-z-index: 1000;
  --chat-width: 400px;
  --chat-min-width: 320px;
  --chat-max-width: 600px;
  --chat-height: 60vh;
  --chat-min-height: 400px;
  --mode-developer: var(--signal-teal);
  --mode-planning: var(--signal-purple);
  --mode-image: var(--signal-orange);
  --mode-general: var(--text-muted);
  --voice-active: var(--signal-success);
  ```

- [ ] **F4.** Update `layouts/chat/README.md`:
  - Add ColdLight mandate
  - Update component inventory status from STUB → SCAFFOLD
  - Add primitive usage per component
  - Update interactions from TODO → SCAFFOLD

- [ ] **F5.** Evaluate/delete `layouts/chat/styles/` CSS files:
  - `shell.css` (186 lines) — migrate useful parts or DELETE if using inline Tailwind
  - `surfaces.css` (252 lines) — migrate useful parts or DELETE
  - `depth.css` (132 lines) — migrate to `design/molecules/`
  - `interactions.css` (304 lines) — review for useful patterns, otherwise DELETE

- [ ] **F6.** Run `pnpm svelte-check` — zero errors

---

## Verification

```bash
cd interfaces/desktop

# No empty stubs remaining
grep -r "TODO: Describe this" src/lib/layouts/chat/  # Should return empty

# ColdLight primitives imported
grep -r "import.*Sheet\|import.*Tabs\|import.*ToggleGroup\|import.*Command\|import.*RadioGroup\|import.*AlertDialog\|import.*ScrollArea\|import.*Badge\|import.*Button\|import.*Textarea\|import.*Input" src/lib/layouts/chat/

# Interactions folder exists
ls src/lib/layouts/chat/components/interactions/index.ts  # Should exist

# Data attributes present
grep -r "data-layout=\"chat\"" src/lib/layouts/chat/
grep -r "data-interaction=" src/lib/layouts/chat/components/interactions/

# Type check
pnpm svelte-check

# Visual verification
pnpm dev  # Chat overlay opens, glass surface visible, modes switch, interactions render
```

---

## Primitive Usage Map (Post-Sprint)

| Chat Component | ColdLight Primitives |
|---------------|---------------------|
| **Frame** | Sheet |
| **TopBar** | Tabs, Button, Separator |
| **LeftSidebar** | ToggleGroup |
| **ChatDashboard** | ScrollArea |
| **QuickMenu** | DropdownMenu, Button |
| **Footer** | Textarea, Button |
| **ContextPanel** | (Canvas/SVG — not a primitive) |
| **HistoryPanel** | ScrollArea |
| **StatusBar** | Badge |
| **CommandPalette** | Command |
| **ModeSelector** | ToggleGroup |
| **MultipleChoice** | RadioGroup / Checkbox |
| **TrueFalse** | ToggleGroup / Button |
| **FillBlank** | Input, Label, Select |
| **Confirmation** | AlertDialog |

---

## Files Modified

| File | Action |
|------|--------|
| `sys/runes/global.svelte.ts` | UPDATE — add chat state |
| `layouts/chat/components/shell/Frame.svelte` | BUILD — Sheet overlay |
| `layouts/chat/components/shell/TopBar.svelte` | BUILD — Tabs + controls |
| `layouts/chat/components/shell/LeftSidebar.svelte` | BUILD — ToggleGroup modes |
| `layouts/chat/components/shell/ChatDashboard.svelte` | BUILD — ScrollArea thread |
| `layouts/chat/components/shell/QuickMenu.svelte` | BUILD — DropdownMenu |
| `layouts/chat/components/panels/Footer.svelte` | BUILD — Textarea + Button |
| `layouts/chat/components/panels/ContextPanel.svelte` | BUILD — placeholder |
| `layouts/chat/components/panels/HistoryPanel.svelte` | BUILD — ScrollArea list |
| `layouts/chat/components/panels/StatusBar.svelte` | BUILD — Badge |
| `layouts/chat/components/overlays/CommandPalette.svelte` | BUILD — Command |
| `layouts/chat/components/overlays/ModeSelector.svelte` | BUILD — ToggleGroup |
| `layouts/chat/components/interactions/MultipleChoice.svelte` | NEW |
| `layouts/chat/components/interactions/TrueFalse.svelte` | NEW |
| `layouts/chat/components/interactions/FillBlank.svelte` | NEW |
| `layouts/chat/components/interactions/Confirmation.svelte` | NEW |
| `layouts/chat/components/interactions/index.ts` | NEW — barrel |
| `layouts/chat/index.ts` | NEW — barrel |
| `layouts/chat/README.md` | UPDATE — ColdLight mandate + status |
| `design/tokens/tokens.ts` | UPDATE — add chat-specific tokens |

---

## Depends On

- **SPRINT-TOKEN-BRIDGE** — @theme must work
- **SPRINT-APP-SHELL-REBUILD** — pattern and icon system established

## Blocks

- Dashboard visual scaffold (needs chat overlay rendering)
- Maestro integration (event bus wiring to chat components)
