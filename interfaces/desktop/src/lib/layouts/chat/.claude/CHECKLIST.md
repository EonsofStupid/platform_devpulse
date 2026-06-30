# layouts/chat — Quality Checklist

> **Purpose**: Ensure the true window chat overlay has proper glass depth, hypermodular structure, and ColdLight-convertible CSS.
> **Last Updated**: 2026-01-24

---

## Pre-Flight Verification

### [ ] Structure Audit
Chat is hypermodular with multiple nested folders:

```
layouts/chat/
├── components/
│   ├── shell/           # Core frame components
│   │   ├── Frame.svelte
│   │   ├── ChatDashboard.svelte
│   │   ├── TopBar.svelte
│   │   ├── LeftSidebar.svelte
│   │   └── QuickMenu.svelte
│   ├── panels/          # Content panels
│   │   ├── ContextPanel.svelte (Cortex viz)
│   │   ├── Footer.svelte (Input + Voice)
│   │   ├── HistoryPanel.svelte
│   │   └── StatusBar.svelte
│   ├── overlays/        # Floating overlays
│   │   ├── CommandPalette.svelte
│   │   └── ModeSelector.svelte
│   └── interactions/    # AI response components (TODO)
│       ├── MultipleChoice.svelte
│       ├── TrueFalse.svelte
│       ├── FillBlank.svelte
│       └── Confirmation.svelte
```

- [ ] All folders exist with proper structure
- [ ] `index.ts` barrel exports in each folder
- [ ] No orphan files outside folder structure

### [ ] Business Logic Boundaries
Chat has MORE business logic than app shell:
- [ ] **Mode switching**: DEV | PLAN | IMG | GEN
- [ ] **Chat state**: open, minimized, closed
- [ ] **Message thread**: display only (no data fetching)
- [ ] **Interactions**: Render AI-structured responses
- [ ] **Voice button**: Toggle state only

Domain logic (data fetching, AI communication) lives in `domains/chat/` and `domains/clyffy/` — NOT here.

---

## CSS Quality Gates

### [ ] Same Token Replacements as App
See `layouts/app/.claude/CHECKLIST.md` for full token → hardcoded value mapping.

### [ ] Chat-Specific Values

| Concept | Hardcoded Value |
|---------|-----------------|
| Chat idle opacity | `0.35` |
| Chat engaged opacity | `1` |
| Chat z-index | `1000` |
| Chat overlay z-index | `1001` |
| Chat width | `400px` |
| Chat min-width | `320px` |
| Chat max-width | `600px` |
| Chat height | `60vh` |
| Chat min-height | `400px` |
| Mode DEV color | `rgba(65, 240, 219, 1)` (teal) |
| Mode PLAN color | `rgba(147, 51, 234, 1)` (purple) |
| Mode IMG color | `rgba(251, 146, 60, 1)` (orange) |
| Mode GEN color | `rgba(255, 255, 255, 0.5)` (muted) |
| Voice active | `rgba(34, 197, 94, 1)` (green) |
| Voice pulse glow | `0 0 12px rgba(34, 197, 94, 0.6)` |

### [ ] Layered Glass Depth
Chat uses DEEPER glass than app shell (it floats above):
- [ ] Frame: `rgba(15, 23, 42, 0.95)` + `blur(32px)`
- [ ] Panels: `rgba(30, 41, 59, 0.85)` + `blur(24px)`
- [ ] Overlays: `rgba(51, 65, 85, 0.9)` + `blur(16px)`
- [ ] All with multi-layer box-shadows for true depth

### [ ] Transparency States
- [ ] Idle: 30-40% opacity, slight blur, click-through feel
- [ ] Engaged: 100% opacity, full interaction
- [ ] Transition: smooth 300ms ease

---

## Component Inventory

### shell/ (5 components)

#### Frame.svelte
- [ ] True window overlay (z-index: 1000)
- [ ] Position: fixed, bottom-right corner
- [ ] Transparency states (idle/engaged)
- [ ] Contains all other shell components

#### ChatDashboard.svelte
- [ ] Main chat thread view
- [ ] Message list with scroll
- [ ] Renders interactions/ components

#### TopBar.svelte
- [ ] Hub tabs: DEVPULSE/HQ | CORTEX MEMORY
- [ ] Minimize button
- [ ] Close button
- [ ] Glass bevel effect

#### LeftSidebar.svelte
- [ ] Mode selector: DEV | PLAN | IMG | GEN
- [ ] Vertical icon rail
- [ ] Mode-specific color indicators
- [ ] Tooltips on hover

#### QuickMenu.svelte
- [ ] Tools quick-access
- [ ] Context actions
- [ ] Glass popup style

### panels/ (4 components)

#### ContextPanel.svelte
- [ ] Cortex memory visualization (network graph)
- [ ] Right-side panel
- [ ] Animated nodes/edges

#### Footer.svelte
- [ ] Text input with glass styling
- [ ] Voice button (always visible)
- [ ] Send button
- [ ] Tools menu trigger

#### HistoryPanel.svelte
- [ ] Conversation thread history
- [ ] Collapsible sections
- [ ] Glass cards for each session

#### StatusBar.svelte
- [ ] Chat-specific status
- [ ] Mode indicator
- [ ] Connection status

### overlays/ (2 components)

#### CommandPalette.svelte
- [ ] Cmd+K interface
- [ ] Fuzzy search
- [ ] Glass backdrop

#### ModeSelector.svelte
- [ ] Mode switching dropdown
- [ ] Mode descriptions
- [ ] Current mode highlight

### interactions/ (4 components - TODO)

#### MultipleChoice.svelte
- [ ] Radio/checkbox selection
- [ ] Question display
- [ ] Option descriptions
- [ ] Selected state with glow

#### TrueFalse.svelte
- [ ] Binary yes/no choice
- [ ] Statement display
- [ ] Button pair styling

#### FillBlank.svelte
- [ ] Text input with blanks
- [ ] Inline input styling
- [ ] Select dropdowns

#### Confirmation.svelte
- [ ] Action confirmation dialog
- [ ] Variant: default, destructive, success
- [ ] Icon + message + buttons

---

## Svelte 5 Runes Compliance

### [ ] Maximize Runes Usage
- [ ] `$state()` for all reactive state
- [ ] `$props()` for all component inputs
- [ ] `$derived()` for computed values
- [ ] `$effect()` for side effects (sparingly)

### [ ] State Locations
| Component | Allowed State |
|-----------|---------------|
| Frame | `isMinimized`, `transparency` |
| ChatDashboard | `scrollPosition` |
| TopBar | `activeTab` |
| LeftSidebar | `hoveredMode`, `selectedMode` |
| Footer | `inputValue`, `isVoiceActive` |
| ModeSelector | `isOpen` |

---

## Data Attributes Contract

### [ ] Frame
```html
<div data-layout="chat" data-state="open|minimized|closed">
```

### [ ] Mode Selector
```html
<nav data-slot="mode-selector" data-mode="{current_mode}">
```

### [ ] Chat Dashboard
```html
<main data-slot="chat-dashboard">
```

### [ ] Interaction Components
```html
<div data-interaction="multiple-choice|true-false|fill-blank|confirmation">
```

### [ ] Messages
```html
<article data-message data-author="user|gus|system">
```

---

## Design Reference Compliance

### CHAT-REFERENCE-01.png
- [ ] Dark glass with cyan accents
- [ ] Network/cortex visualization on right
- [ ] Mode selector on left
- [ ] Deep neumorphic bevels

### CHAT-REFERENCE-02.png
- [ ] Purple tones available
- [ ] Interactive checkboxes (MultipleChoice)
- [ ] Holographic brain element

---

## Verification Steps

After each component rewrite:
1. [ ] Run `pnpm check` — no TypeScript errors
2. [ ] Run `pnpm dev` — visual inspection
3. [ ] Verify z-index layering (chat floats above app)
4. [ ] Verify transparency states work
5. [ ] Verify mode switching changes colors
6. [ ] Verify interactions render correctly
7. [ ] Verify voice button pulse animation

---

## Sign-off

| Gate | Status |
|------|--------|
| All tokens replaced with hardcoded values | [ ] YES / [ ] NO |
| No true black in any component | [ ] YES / [ ] NO |
| Glass morphism has proper depth (deeper than app) | [ ] YES / [ ] NO |
| Transparency states work | [ ] YES / [ ] NO |
| Mode colors correct | [ ] YES / [ ] NO |
| Interactions render properly | [ ] YES / [ ] NO |
| Runes used correctly | [ ] YES / [ ] NO |
| Data attributes match contract | [ ] YES / [ ] NO |
| Matches CHAT-REFERENCE-01.png | [ ] USER APPROVAL REQUIRED |
| Matches CHAT-REFERENCE-02.png | [ ] USER APPROVAL REQUIRED |
