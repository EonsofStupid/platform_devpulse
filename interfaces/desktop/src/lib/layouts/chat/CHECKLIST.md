# layouts/chat — Quality Checklist

> **Purpose:** Automated quality gates and manual verification steps
> **Last Updated:** `2026-01-22`
> **Scope:** `commitlint`, `svelte-check`, `vitest`, `lefthook`

---

## Pre-Commit Gates (Automated via Lefthook)

### TypeScript / Svelte Check

```bash
pnpm svelte-check --fail-on-warnings
```

- [ ] No TypeScript errors
- [ ] No implicit `any` types
- [ ] All interaction props typed via interface

### Commitlint Scopes

```bash
type(layouts): message
type(layouts/chat): message
type(layouts/chat/interactions): message
```

---

## Shell Components Quality Gates

### Frame.svelte

| Check | Status | Notes |
|-------|--------|-------|
| Z-index above app shell (1000+) | [ ] | |
| Glass effect tokens | [ ] | |
| Transparency states work | [ ] | idle 35%, engaged 100% |
| Click-through when idle | [ ] | pointer-events handling |
| `data-layout="chat"` | [ ] | |
| `data-state` attribute | [ ] | open/minimized/closed |

### LeftSidebar.svelte (Mode Selector)

| Check | Status | Notes |
|-------|--------|-------|
| 4 mode buttons | [ ] | DEV, PLAN, IMG, GEN |
| Mode colors match tokens | [ ] | |
| Hub availability enforced | [ ] | See mode matrix |
| `data-mode` attribute | [ ] | |
| Active mode indicator | [ ] | |

### ChatDashboard.svelte

| Check | Status | Notes |
|-------|--------|-------|
| Message thread renders | [ ] | |
| Auto-scroll to bottom | [ ] | |
| Interaction components slot | [ ] | |
| `data-slot="chat-dashboard"` | [ ] | |

### Footer.svelte (Input Area)

| Check | Status | Notes |
|-------|--------|-------|
| Text input accessible | [ ] | |
| Voice button visible | [ ] | Always visible |
| Tools menu functional | [ ] | |
| Send on Enter | [ ] | |
| Shift+Enter for newline | [ ] | |

---

## Interactions Components Quality Gates

### MultipleChoice.svelte

| Check | Status | Notes |
|-------|--------|-------|
| Props interface complete | [ ] | MultipleChoiceProps |
| Single select mode | [ ] | Radio behavior |
| Multi select mode | [ ] | Checkbox behavior |
| Keyboard navigation | [ ] | Arrow keys, Enter |
| Option descriptions render | [ ] | |
| `data-interaction="multiple-choice"` | [ ] | |
| Focus management | [ ] | |

### TrueFalse.svelte

| Check | Status | Notes |
|-------|--------|-------|
| Props interface complete | [ ] | TrueFalseProps |
| Yes/No toggle works | [ ] | |
| Context text renders | [ ] | |
| Keyboard accessible | [ ] | Space/Enter to toggle |
| `data-interaction="true-false"` | [ ] | |

### FillBlank.svelte

| Check | Status | Notes |
|-------|--------|-------|
| Props interface complete | [ ] | FillBlankProps |
| Text input type | [ ] | |
| Number input type | [ ] | |
| Select dropdown type | [ ] | |
| Tab navigation between blanks | [ ] | |
| `data-interaction="fill-blank"` | [ ] | |

### Confirmation.svelte

| Check | Status | Notes |
|-------|--------|-------|
| Props interface complete | [ ] | ConfirmationProps |
| Default variant | [ ] | |
| Destructive variant (red) | [ ] | |
| Success variant (green) | [ ] | |
| Focus trap active | [ ] | |
| Escape to cancel | [ ] | |
| `data-interaction="confirmation"` | [ ] | |

---

## Mode Availability Rules

| Hub → Mode | DEVELOPER | PLANNING | IMAGE | GENERAL |
|------------|-----------|----------|-------|---------|
| DevPulse | DISABLED | DISABLED | DISABLED | DEFAULT |
| OverMind | DISABLED | DEFAULT | DISABLED | ALLOWED |
| DevForge | DEFAULT | ALLOWED | ALLOWED | ALLOWED |
| WiredFront | DISABLED | DISABLED | DEFAULT | ALLOWED |

### Implementation Checklist

- [ ] Mode selector grays out unavailable modes
- [ ] Mode auto-switches on hub change
- [ ] Attempting disabled mode shows toast
- [ ] Mode persists within hub session

---

## Accessibility Checklist

| Element | Requirement | Status |
|---------|-------------|--------|
| Chat overlay | `aria-label="Chat with Gus"` | [ ] |
| Mode buttons | `aria-pressed` state | [ ] |
| Message thread | `role="log"` or `aria-live` | [ ] |
| Input field | `aria-label` | [ ] |
| Voice button | `aria-pressed` for active | [ ] |
| Interactions | Focus management | [ ] |
| MultipleChoice | `role="radiogroup"` or `group` | [ ] |
| TrueFalse | `role="switch"` or `radio` | [ ] |
| Confirmation | `role="alertdialog"` | [ ] |

---

## State Isolation Rules

### layouts/chat CAN:

- [ ] Read/write `global.chat_*` state
- [ ] Read `global.current_domain` (for mode availability)
- [ ] Emit events to Maestro via event bus
- [ ] Listen to events from Maestro
- [ ] Have UI state for interactions

### layouts/chat CANNOT:

- [ ] Call Tauri commands directly
- [ ] Import from `$lib/domains/*` (except types)
- [ ] Access project-specific data directly
- [ ] Modify `global.current_domain`

---

## Token Usage Rules

### Chat-Specific Tokens Required

```css
--chat-idle-opacity
--chat-engaged-opacity
--chat-z-index
--chat-overlay-z
--chat-width
--chat-height
--mode-developer
--mode-planning
--mode-image
--mode-general
--voice-active
--voice-pulse
```

### Token Fallback Pattern

```css
/* Always provide fallbacks for chat tokens */
opacity: var(--chat-idle-opacity, 0.35);
z-index: var(--chat-z-index, 1000);
```

---

## Test Requirements

### Unit Tests (Vitest)

```typescript
// layouts/chat/components/interactions/__tests__/MultipleChoice.test.ts
describe('MultipleChoice', () => {
    it('renders all options');
    it('selects option on click');
    it('supports multi-select mode');
    it('calls onSelect with selected ids');
    it('handles keyboard navigation');
});
```

### Integration Tests

```typescript
// layouts/chat/__tests__/ModeSelector.test.ts
describe('ModeSelector', () => {
    it('shows correct modes for DevPulse hub');
    it('shows correct modes for DevForge hub');
    it('disables unavailable modes');
    it('auto-switches mode on hub change');
});
```

### Visual Tests (Playwright)

```typescript
// e2e/layouts/chat.spec.ts
test('chat overlay floats above content', async ({ page }) => {
    await page.goto('/');
    await page.click('[data-action="open-chat"]');
    await expect(page.locator('[data-layout="chat"]')).toBeVisible();
    await expect(page.locator('[data-layout="chat"]'))
        .toHaveCSS('z-index', '1000');
});
```

---

## Event Bus Contract Validation

### Outbound Events (Chat → Maestro)

| Event | Payload | Validated |
|-------|---------|-----------|
| `chat:message-send` | `{ content: string, mode: ChatMode }` | [ ] |
| `chat:mode-change` | `{ mode: ChatMode }` | [ ] |
| `chat:interaction-response` | `{ interactionId: string, value: unknown }` | [ ] |
| `chat:voice-start` | `void` | [ ] |
| `chat:voice-end` | `{ audio: Blob }` | [ ] |

### Inbound Events (Maestro → Chat)

| Event | Handler | Validated |
|-------|---------|-----------|
| `maestro:message-receive` | MessageThread | [ ] |
| `maestro:interaction-request` | RenderInteraction | [ ] |
| `maestro:thinking-start` | ShowThinkingIndicator | [ ] |
| `maestro:thinking-end` | HideThinkingIndicator | [ ] |
| `maestro:cortex-update` | UpdateCortexPanel | [ ] |

---

## File Cleanup Tasks

- [ ] Delete `notify/` folder (use `domains/notify` instead)
- [ ] Populate `index.ts` with exports
- [ ] Create `interactions/` folder
- [ ] Create interaction components

---

## Index.ts Exports

```typescript
// layouts/chat/index.ts

// Shell
export { default as ChatFrame } from './components/shell/Frame.svelte';
export { default as ChatDashboard } from './components/shell/ChatDashboard.svelte';
export { default as ChatTopBar } from './components/shell/TopBar.svelte';
export { default as LeftSidebar } from './components/shell/LeftSidebar.svelte';
export { default as QuickMenu } from './components/shell/QuickMenu.svelte';

// Panels
export { default as ContextPanel } from './components/panels/ContextPanel.svelte';
export { default as HistoryPanel } from './components/panels/HistoryPanel.svelte';
export { default as ChatStatusBar } from './components/panels/StatusBar.svelte';
export { default as Footer } from './components/panels/Footer.svelte';

// Overlays
export { default as CommandPalette } from './components/overlays/CommandPalette.svelte';
export { default as ModeSelector } from './components/overlays/ModeSelector.svelte';

// Interactions
export { default as MultipleChoice } from './components/interactions/MultipleChoice.svelte';
export { default as TrueFalse } from './components/interactions/TrueFalse.svelte';
export { default as FillBlank } from './components/interactions/FillBlank.svelte';
export { default as Confirmation } from './components/interactions/Confirmation.svelte';

// Types
export type {
    MultipleChoiceProps,
    TrueFalseProps,
    FillBlankProps,
    ConfirmationProps,
    ChatMode,
    InteractionRequest,
} from './types';
```

---

## Sprint Completion Criteria

### Sprint 1: Overlay Shell

- [ ] Frame floats at z-1000
- [ ] Transparency states work
- [ ] Position configurable
- [ ] Minimize/close work
- [ ] Click-through when idle

### Sprint 2: Input & Thread

- [ ] Text input sends messages
- [ ] Thread displays messages
- [ ] Voice button visible
- [ ] Tools menu works

### Sprint 3: Mode System

- [ ] Mode selector shows 4 modes
- [ ] Hub availability rules work
- [ ] Mode colors applied
- [ ] Mode persists in session

### Sprint 4: Interactions

- [ ] MultipleChoice works
- [ ] TrueFalse works
- [ ] FillBlank works
- [ ] Confirmation works
- [ ] All keyboard accessible

---

## Design Reference Compliance

Compare implementation against:
- `CHAT-REFERENCE-01.png` - Dark glass, cyan
- `CHAT-REFERENCE-02.png` - Purple variant

| Element | Reference Match | Status |
|---------|-----------------|--------|
| Mode sidebar position (left) | [ ] | |
| Cortex panel (right) | [ ] | |
| Glass effect intensity | [ ] | |
| Voice button position | [ ] | |
| Message bubble styling | [ ] | |
| Interaction card styling | [ ] | |
