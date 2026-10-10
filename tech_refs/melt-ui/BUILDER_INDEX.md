# Melt UI — Complete Builder Index

> All builders available in @melt-ui/svelte
> Use this to plan ColdLight primitive coverage

---

## Overlay / Floating

| Builder | Purpose | ARIA Pattern | Priority |
|---------|---------|--------------|----------|
| `createDialog` | Modal dialog | Dialog | HIGH |
| `createPopover` | Floating interactive content | Disclosure | HIGH |
| `createTooltip` | Non-modal informational popup | Tooltip | HIGH |
| `createLinkPreview` | Hover preview for links | — | LOW |
| `createToast` | Notification system | Alert | MEDIUM |

## Selection

| Builder | Purpose | ARIA Pattern | Priority |
|---------|---------|--------------|----------|
| `createSelect` | Dropdown listbox | Listbox | HIGH |
| `createCombobox` | Autocomplete input | Combobox | HIGH |
| `createRadioGroup` | Single selection group | Radio Group | HIGH |
| `createCheckbox` | Single checkbox | Checkbox | HIGH |
| `createSwitch` | On/off toggle | Switch | HIGH |
| `createToggle` | Single toggle button | Button | MEDIUM |
| `createToggleGroup` | Multiple toggle selection | Button Group | MEDIUM |

## Navigation

| Builder | Purpose | ARIA Pattern | Priority |
|---------|---------|--------------|----------|
| `createTabs` | Tabbed interface | Tabs | HIGH |
| `createAccordion` | Expandable sections | Accordion | HIGH |
| `createDropdownMenu` | Action menu | Menu/Menu Button | HIGH |
| `createContextMenu` | Right-click menu | Menu | MEDIUM |
| `createMenubar` | Application menubar | Menubar | LOW |
| `createPagination` | Page navigation | — | MEDIUM |

## Form Inputs

| Builder | Purpose | ARIA Pattern | Priority |
|---------|---------|--------------|----------|
| `createPinInput` | OTP/PIN entry | — | HIGH |
| `createTagsInput` | Multi-value tags | — | MEDIUM |
| `createSlider` | Range selection | Slider | MEDIUM |

## Date/Time

| Builder | Purpose | ARIA Pattern | Priority |
|---------|---------|--------------|----------|
| `createCalendar` | Date picker calendar | Grid | MEDIUM |
| `createDateField` | Date input segments | — | MEDIUM |
| `createDatePicker` | Calendar + field | — | MEDIUM |
| `createDateRangeField` | Date range segments | — | LOW |
| `createDateRangePicker` | Range calendar + field | — | LOW |

## Layout / Display

| Builder | Purpose | ARIA Pattern | Priority |
|---------|---------|--------------|----------|
| `createCollapsible` | Expandable section | Disclosure | HIGH |
| `createSeparator` | Visual divider | Separator | HIGH |
| `createProgress` | Progress indicator | Progressbar | MEDIUM |
| `createAvatar` | User avatar with fallback | — | MEDIUM |
| `createScrollArea` | Custom scrollbars | — | LOW |
| `createAspectRatio` | Constrained ratio container | — | LOW |

## Tree / Hierarchy

| Builder | Purpose | ARIA Pattern | Priority |
|---------|---------|--------------|----------|
| `createTree` | Tree view | Tree | LOW |
| `createTableOfContents` | Document navigation | — | LOW |

---

## ColdLight Priority Mapping

### Phase 1 — Core (HIGH)

```
Dialog, Popover, Tooltip, Select, Combobox, Tabs, Accordion,
DropdownMenu, Checkbox, Switch, RadioGroup, Collapsible, Separator, PinInput
```

### Phase 2 — Extended (MEDIUM)

```
Toast, Toggle, ToggleGroup, Pagination, Slider, Calendar,
DatePicker, Progress, Avatar, ContextMenu, TagsInput
```

### Phase 3 — Complete (LOW)

```
Menubar, LinkPreview, ScrollArea, AspectRatio, Tree,
TableOfContents, DateRangeField, DateRangePicker
```

---

## Import Pattern

```typescript
import {
  createDialog,
  createPopover,
  createSelect,
  // ...
  melt,
} from '@melt-ui/svelte';
```

---

## Common Return Structure

Every builder returns:

```typescript
const {
  elements: { /* element builders */ },
  states: { /* reactive stores */ },
  helpers: { /* utility functions */ },
  options: { /* mutable config refs */ },
} = createBuilder(options);
```
