# ColdLight Primitive Catalog v0.1 (LOCKED)

> **Date Locked:** 2026-01-25
> **Provider ARIA:** MeltUI
> **ColdLight Contract:** `data-kind`, `data-slot`, `data-state`

---

## Architecture

```
ColdLight = framework-owned public API (SSOT)
MeltUI = provider implementation (ARIA handled here)
_internals = adapter boundary (provider abstraction layer)
```

**Rule:** Consumers import ColdLight primitives, NOT Melt directly.

---

## Folder Structure (LOCKED)

```
primitives/<primitive>/
  <primitive>.svelte    # Named .svelte file (NOT Root/Trigger naming)
  types.ts              # TypeScript interfaces
  index.ts              # Import/export ONLY
  docs.md               # JSDoc-backed documentation
  <primitive>.test.ts   # Tests
```

---

## Data Attribute Contract (LOCKED)

| Attribute | Purpose |
|-----------|---------|
| `data-kind` | Primitive identity (e.g., `button`, `tabs`) |
| `data-slot` | Slot within primitive (e.g., `root`, `trigger`, `panel`) |
| `data-state` | Normalized state (e.g., `open`, `closed`, `active`) |

---

## Locked Primitives (Implement FIRST)

| Primitive | Provider | ColdLight State | Priority |
|-----------|----------|-----------------|----------|
| button | MeltUI | Yes | 1 (GOLDEN) |
| tabs | MeltUI | Yes | 2 |
| input | MeltUI | Yes | 3 |
| accordion | MeltUI | Yes | 4 |
| otp | MeltUI (PinInput) | Yes | 5 |

---

## Backlog Primitives (After Spine is Stable)

| Primitive | Provider | Notes |
|-----------|----------|-------|
| dialog | MeltUI | Open/close + focus trap + portal |
| popover | MeltUI | Positioning complexity |
| tooltip | MeltUI | Hover/focus trigger |
| alertdialog | MeltUI | Dialog variant |
| select | MeltUI | Positioning + keyboard nav |
| panel | MeltUI | Layout/container primitive |
| toggle | MeltUI | Toggled state |
| switch | MeltUI | On/off state |
| slider | MeltUI | Range input |
| menu | MeltUI | Context/dropdown |
| toast | MeltUI (Toaster) | App-level queue |

---

## Slot Inventories (Gap 1 - LOCKED)

### button
```typescript
slots: ["root", "icon", "label", "badge"] as const
```

### tabs
```typescript
slots: ["root", "list", "trigger", "panel"] as const
```

### input
```typescript
slots: ["root", "label", "field", "description", "error"] as const
```

### accordion
```typescript
slots: ["root", "item", "trigger", "content"] as const
```

### otp (PinInput)
```typescript
slots: ["root", "input", "hidden-input"] as const
```

### dialog
```typescript
slots: ["root", "trigger", "portal", "overlay", "content", "title", "description", "close"] as const
```

### popover
```typescript
slots: ["root", "trigger", "content", "arrow", "close"] as const
```

### tooltip
```typescript
slots: ["root", "trigger", "content", "arrow"] as const
```

### select
```typescript
slots: ["root", "trigger", "content", "viewport", "item", "item-text", "group", "label", "separator", "arrow"] as const
```

### toggle
```typescript
slots: ["root"] as const
```

### panel
```typescript
slots: ["root", "header", "content", "footer"] as const
```

---

## Canonical State Values (Gap 2 - LOCKED)

These are the NORMALIZED state tokens. Provider states map TO these.

### Open/Close States
```typescript
type OpenState = "open" | "closed"
// Used by: dialog, popover, tooltip, select, accordion
```

### Active/Inactive States
```typescript
type ActiveState = "active" | "inactive"
// Used by: tabs, accordion items
```

### Selected/Unselected States
```typescript
type SelectedState = "selected" | "unselected"
// Used by: select items, toggle
```

### Checked States
```typescript
type CheckedState = "checked" | "unchecked" | "indeterminate"
// Used by: checkbox, switch
```

### Disabled State
```typescript
type DisabledState = "disabled"
// Presence attribute - add when disabled, remove when not
```

### Invalid State
```typescript
type InvalidState = "invalid"
// Presence attribute for form validation
```

### Focus State
```typescript
type FocusState = "focused"
// Presence attribute for focus styling
```

### Pressed State
```typescript
type PressedState = "pressed"
// Used by: button during press
```

---

## Filesystem Placement (Gap 3 - LOCKED)

```
design/
├── tokens/              # Design tokens (generated + manual)
│   ├── tokens.css       # GENERATED CSS vars
│   ├── tokens.ts        # Token definitions (source)
│   └── types.ts         # GENERATED TypeScript types
│
├── sys/                 # System internals
│   ├── api/
│   │   └── _internal/   # Provider adapter layer
│   │       ├── melt/    # Melt UI binding
│   │       └── index.ts # Adapter exports
│   └── utils/           # Foundation utilities
│       ├── viewport.ts  # viewport.clamp()
│       ├── tru.ts       # tru(px) token relative unit
│       ├── fluid.ts     # fluid.text()
│       ├── container.ts # container.query()
│       ├── motion.ts    # motion.reduced()
│       ├── math.ts      # math.lerp()
│       ├── color.ts     # color.glass()
│       ├── layer.ts     # layer.stack() z-index SSOT
│       ├── state.ts     # state.sync() provider→ColdLight
│       └── index.ts     # Utility barrel
│
├── primitives/          # Unstyled accessible components
│   ├── button/
│   ├── tabs/
│   ├── input/
│   ├── accordion/
│   ├── otp/
│   └── index.ts         # Primitive barrel
│
├── recipes/             # Appearance patterns (CSS)
│   └── css/
│
├── blueprints/          # Structure defaults
│
├── blocks/              # VPB payloads (composed primitives)
│
└── taxonomy/            # Gatekeeper (kinds, contracts, slots)
```

---

## Foundation Utilities (REQUIRED)

### 1. viewport.clamp()
Generates fluid values with `clamp(min, preferred, max)`.
```typescript
function clamp(min: string, preferred: string, max: string): string
function fluidValue(minPx: number, maxPx: number, minVw?: number, maxVw?: number): string
```

### 2. tru(px)
Token Relative Unit - converts design-tool px → rem/vi.
```typescript
function tru(px: number): string // Returns rem value
```

### 3. fluid.text()
Typography clamp helper with safeguards.
```typescript
function text(minPx: number, maxPx: number, options?: { lineHeight?: number }): string
```

### 4. container.query()
Container query aliases for layout logic.
```typescript
function query(name: string, minWidth: string): string
```

### 5. motion.reduced()
Kill switch for heavy glass effects.
```typescript
function reduced(): boolean // Returns true if prefers-reduced-motion
```

### 6. math.lerp()
Linear interpolation for micro-interactions.
```typescript
function lerp(start: number, end: number, t: number): number
```

### 7. color.glass()
Computes readable contrast for glass overlays.
```typescript
function glass(background: string): { foreground: string; scrim: number; edgeGlow: number }
```

### 8. layer.stack()
Z-index SSOT.
```typescript
const layers = {
  base: 0,
  shell: 10,
  overlay: 100,
  popover: 200,
  tooltip: 300,
  toast: 400,
  modal: 500,
} as const
```

### 9. state.sync()
Maps provider state → ColdLight data-state.
```typescript
function sync<T>(providerState: T): string // Returns normalized state token
```

---

## Melt UI Builder Coverage

| Melt Builder | ColdLight Primitive | Status |
|--------------|---------------------|--------|
| createAccordion | accordion | LOCKED |
| createAvatar | avatar | Backlog |
| createCalendar | calendar | Backlog |
| createCheckbox | checkbox | Backlog |
| createCollapsible | collapsible | Backlog |
| createCombobox | combobox | Backlog |
| createContextMenu | contextMenu | Backlog |
| createDateField | dateField | Backlog |
| createDatePicker | datePicker | Backlog |
| createDialog | dialog | Backlog |
| createDropdownMenu | dropdownMenu | Backlog |
| createLabel | label | Backlog |
| createLinkPreview | hoverCard | Backlog |
| createListbox | listbox | Backlog |
| createMenubar | menubar | Backlog |
| createPagination | pagination | Backlog |
| createPinInput | otp | LOCKED |
| createPopover | popover | Backlog |
| createProgress | progress | Backlog |
| createRadioGroup | radioGroup | Backlog |
| createScrollArea | scrollArea | Backlog |
| createSelect | select | Backlog |
| createSeparator | separator | Backlog |
| createSlider | slider | Backlog |
| createSwitch | switch | Backlog |
| createTabs | tabs | LOCKED |
| createTagsInput | tagsInput | Backlog |
| createToaster | toast | Backlog |
| createToggle | toggle | Backlog |
| createToggleGroup | toggleGroup | Backlog |
| createTooltip | tooltip | Backlog |
| createTreeView | treeView | Backlog |
| createToolbar | toolbar | Backlog |
| — | button | LOCKED (custom ARIA) |
| — | input | LOCKED (custom ARIA) |

---

## Custom ARIA Components (Melt doesn't cover)

| Primitive | Reason |
|-----------|--------|
| button | Simple enough for custom ARIA |
| input | Simple enough for custom ARIA |
| navigationMenu | Complex custom |
| command | Command palette |
| alert | Inline alert |
| badge | Display only |
| skeleton | Loading placeholder |
| spinner | Loading indicator |
| portal | DOM portal utility |
| presence | Animation wrapper |
| focusTrap | Focus management |
| visuallyHidden | SR-only content |
| liveStatus | ARIA live region |
| kbd | Keyboard display |
| dataTable | Complex data display |
| chart | Data visualization |

---

## Implementation Order

1. **Foundation Utils** (sys/utils/)
2. **button** (golden primitive)
3. **tabs**
4. **input**
5. **accordion**
6. **otp**

Then backlog as needed.

---

## Sign-Off

- [ ] Catalog locked
- [ ] Slot inventories defined
- [ ] State values normalized
- [ ] Filesystem paths locked
- [ ] Foundation utils implemented
- [ ] button primitive implemented
- [ ] tabs primitive implemented
- [ ] input primitive implemented
- [ ] accordion primitive implemented
- [ ] otp primitive implemented
