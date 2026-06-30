# Melt UI Reference — Claude Instructions

> **This folder is the CANONICAL reference for Melt UI integration with ColdLight.**
> **All 31 builders mapped 1:1 to ColdLight primitives.**

---

## CRITICAL RULES

1. **Melt UI is the ARIA Provider** — It handles ARIA, focus, keyboard navigation
2. **ColdLight owns everything else** — data-kind, data-slot, data-state, data-id, class, types
3. **Never duplicate ARIA** — `use:melt={$element}` applies all ARIA attributes
4. **Read the builder doc BEFORE implementing** — `builders/{name}.md` has the full API

---

## Directory Structure

```
tech_refs/melt-ui/
├── .claude/
│   └── CLAUDE.md              # THIS FILE
├── README.md                  # Integration philosophy
├── BUILDER_INDEX.md           # All 31 builders with priority
├── COMMON_TYPES.md            # Shared types (FloatingConfig, etc.)
└── builders/
    ├── dialog.md              # Modal dialog
    ├── select.md              # Dropdown listbox
    ├── popover.md             # Floating content
    ├── tooltip.md             # Information tooltip
    ├── tabs.md                # Tabbed interface
    ├── accordion.md           # Expandable sections
    ├── combobox.md            # Autocomplete
    ├── checkbox.md            # Checkbox input
    ├── switch.md              # Toggle switch
    ├── radio-group.md         # Radio buttons
    ├── dropdown-menu.md       # Action menu
    ├── collapsible.md         # Disclosure
    ├── separator.md           # Visual divider
    ├── progress.md            # Progress bar
    └── pin-input.md           # OTP entry
```

---

## COMPLETE BUILDER TO COLDLIGHT MAPPING

### 31 Melt UI Builders

| # | Melt Builder | ColdLight Kind | Elements | Priority |
|---|--------------|----------------|----------|----------|
| 1 | `createDialog` | `dialog` | trigger, portalled, overlay, content, title, description, close | HIGH |
| 2 | `createDialog` (role=alertdialog) | `alertDialog` | trigger, portalled, overlay, content, title, description, action, cancel | HIGH |
| 3 | `createPopover` | `popover` | trigger, content, arrow, close | HIGH |
| 4 | `createTooltip` | `tooltip` | trigger, content, arrow | HIGH |
| 5 | `createSelect` | `select` | trigger, menu, option, label, group, groupLabel, arrow, separator, hiddenInput | HIGH |
| 6 | `createCombobox` | `combobox` | input, menu, item, label, group, groupLabel, arrow, hiddenInput | HIGH |
| 7 | `createTabs` | `tabs` | root, list, trigger, content | HIGH |
| 8 | `createAccordion` | `accordion` | root, item, trigger, content, heading | HIGH |
| 9 | `createDropdownMenu` | `dropdownMenu` | trigger, menu, item, separator, group, groupLabel, checkboxItem, radioGroup, radioItem, submenu, subTrigger, arrow | HIGH |
| 10 | `createCheckbox` | `checkbox` | root, input, indicator | HIGH |
| 11 | `createSwitch` | `switch` | root, input, thumb | HIGH |
| 12 | `createRadioGroup` | `radioGroup` | root, item, itemInput | HIGH |
| 13 | `createCollapsible` | `collapsible` | root, trigger, content | HIGH |
| 14 | `createSeparator` | `separator` | root | HIGH |
| 15 | `createPinInput` | `pinInput` | root, input, hiddenInput | HIGH |
| 16 | `createToggle` | `toggle` | root | MEDIUM |
| 17 | `createToggleGroup` | `toggleGroup` | root, item | MEDIUM |
| 18 | `createSlider` | `slider` | root, range, thumb, tick | MEDIUM |
| 19 | `createProgress` | `progress` | root | MEDIUM |
| 20 | `createToast` | `toast` | content, title, description, close | MEDIUM |
| 21 | `createPagination` | `pagination` | root, prevButton, nextButton, page | MEDIUM |
| 22 | `createContextMenu` | `contextMenu` | trigger, menu, item, separator, group, groupLabel, checkboxItem, radioGroup, radioItem, submenu, subTrigger | MEDIUM |
| 23 | `createCalendar` | `calendar` | root, prevButton, nextButton, heading, grid, cell, day | MEDIUM |
| 24 | `createDateField` | `dateField` | field, segment, label, hiddenInput | MEDIUM |
| 25 | `createDatePicker` | `datePicker` | trigger, calendar, content, segment, label, hiddenInput | MEDIUM |
| 26 | `createAvatar` | `avatar` | root, image, fallback | MEDIUM |
| 27 | `createTagsInput` | `tagsInput` | root, input, tag, deleteTrigger, clear, hiddenInput | MEDIUM |
| 28 | `createLinkPreview` | `hoverCard` | trigger, content, arrow | LOW |
| 29 | `createMenubar` | `menubar` | root, menu, trigger, item, separator, submenu, subTrigger | LOW |
| 30 | `createScrollArea` | `scrollArea` | root, viewport, scrollbar, thumb | LOW |
| 31 | `createTree` | `tree` | root, group, item | LOW |

---

## COLDLIGHT DATA ATTRIBUTES (LOCKED)

Every primitive component MUST have:

```svelte
<div
  use:melt={$element}           <!-- Melt UI: ARIA + events -->
  class={className}             <!-- ColdLight: styling -->
  data-kind="{primitiveKind}"   <!-- ColdLight: identity -->
  data-slot="{slotName}"        <!-- ColdLight: part -->
  data-state="{state}"          <!-- ColdLight: visual state -->
  data-id={dataId}              <!-- ColdLight: user ID -->
>
```

### State Values (data-state)

```
open | closed               # Dialog, Popover, Select, Accordion, Collapsible
checked | unchecked         # Checkbox, Switch, Toggle
active | inactive           # Tabs, ToggleGroup
on | off                    # Switch (alternative)
indeterminate               # Checkbox
selected                    # Select option, Combobox item
highlighted                 # Select option (keyboard)
loading | complete | error  # Progress
```

---

## IMPLEMENTATION PATTERN

### Root Component (creates builder, shares via context)

```svelte
<!-- primitives/{kind}/{kind}.svelte -->
<script lang="ts">
  import { create{Name}, melt } from '@melt-ui/svelte';
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import type { {Name}RootProps, {Name}State } from './types.js';
  import { {NAME}_CONTEXT_KEY } from './types.js';

  let {
    open = $bindable(false),
    onOpenChange,
    children,
    "data-id": dataId,
  }: {Name}RootProps = $props();

  // Sync with Melt's writable store
  const openStore = writable(open);
  $effect(() => { openStore.set(open); });
  $effect(() => { open = $openStore; });

  // Create builder
  const builder = create{Name}({
    open: openStore,
    onOpenChange: ({ curr, next }) => {
      onOpenChange?.(next);
      return next;
    },
  });

  // Share via context
  setContext({NAME}_CONTEXT_KEY, builder);

  const dataState: {Name}State = $derived(open ? 'open' : 'closed');
</script>

<div
  data-kind="{kind}"
  data-slot="root"
  data-state={dataState}
  data-id={dataId}
>
  {#if children}
    {@render children()}
  {/if}
</div>
```

### Slot Component (gets builder from context, uses element)

```svelte
<!-- primitives/{kind}/{kind}.{slot}.svelte -->
<script lang="ts">
  import { melt } from '@melt-ui/svelte';
  import { getContext } from 'svelte';
  import type { {Name}{Slot}Props, {Name}State } from './types.js';
  import { {NAME}_CONTEXT_KEY } from './types.js';
  import { stripStyleProp } from '../types.js';

  let {
    children,
    class: className = '',
    "data-id": dataId,
    ...rest
  }: {Name}{Slot}Props = $props();

  stripStyleProp(rest, '{Name}.{Slot}');

  // Get builder from context
  const builder = getContext({NAME}_CONTEXT_KEY);
  const { elements: { {slot} }, states: { open } } = builder;

  const dataState: {Name}State = $derived($open ? 'open' : 'closed');
</script>

<div
  use:melt={${slot}}
  class={className}
  data-kind="{kind}"
  data-slot="{slot}"
  data-state={dataState}
  data-id={dataId}
  {...rest}
>
  {#if children}
    {@render children({ open: $open })}
  {/if}
</div>
```

---

## TYPES FILE TEMPLATE

```typescript
// primitives/{kind}/types.ts
import type { Snippet } from 'svelte';
import type { HTMLAttributes, HTMLButtonAttributes } from 'svelte/elements';

// ============================================
// SLOTS (must match taxonomy/primitiveRegistry.ts)
// ============================================

export const {Name}Slots = [
  'root',
  'trigger',
  // ... all slots
] as const;

export type {Name}Slot = (typeof {Name}Slots)[number];

// ============================================
// STATE
// ============================================

export type {Name}State = 'open' | 'closed';

// ============================================
// CONTEXT KEY
// ============================================

export const {NAME}_CONTEXT_KEY = 'coldlight-{kind}';

// ============================================
// PROPS (one per slot)
// ============================================

export interface {Name}RootProps {
  /** Controlled open state (bindable) */
  open?: boolean;
  /** Callback when open state changes */
  onOpenChange?: (open: boolean) => void;
  /** Children */
  children?: Snippet;
  /** User-defined stable ID */
  'data-id'?: string;
}

export interface {Name}TriggerProps
  extends Omit<HTMLButtonAttributes, 'style' | 'children'> {
  children?: Snippet;
  'data-id'?: string;
}

// ... one interface per slot
```

---

## READING A BUILDER DOC

Before implementing any primitive, read `builders/{name}.md`:

1. **Options** — What config the builder accepts
2. **Return Value** — Elements, states, helpers available
3. **Data Attributes** — What Melt sets on each element
4. **ARIA** — What ARIA Melt handles (DO NOT DUPLICATE)
5. **Keyboard** — Navigation patterns Melt implements
6. **ColdLight Pattern** — Example integration code

---

## MINIMUM TEST COUNTS

| Type | Minimum |
|------|---------|
| Simple (Button, Separator) | 15+ |
| Modal (Dialog, AlertDialog) | 35+ |
| Selection (Select, Combobox) | 50+ |
| Navigation (Tabs, Accordion) | 40+ |
| Floating (Popover, Tooltip, Menu) | 30+ |

---

## CHECKLIST FOR EACH PRIMITIVE

- [ ] Kind registered in `taxonomy/primitiveKinds.ts`
- [ ] Slots registered in `taxonomy/primitiveRegistry.ts`
- [ ] Metadata has `meltBuilder` field
- [ ] `types.ts` with slots, state, context key, props
- [ ] Root creates builder, shares via context
- [ ] All slots use `use:melt={$element}`
- [ ] All slots have `data-kind`, `data-slot`
- [ ] Stateful slots have `data-state`
- [ ] `index.ts` barrel export
- [ ] `a11y.md` accessibility doc
- [ ] Tests meet minimum count
- [ ] `pnpm check` passes
- [ ] All tests pass

---

## WHAT MELT HANDLES (DO NOT IMPLEMENT)

- `role` attributes
- `aria-*` attributes
- `id` generation and linking
- `tabindex` management
- Focus trapping
- Keyboard navigation
- Click outside handling
- Escape key handling
- Scroll locking
- Floating positioning
- Portal rendering

## WHAT COLDLIGHT HANDLES

- `data-kind` attribute
- `data-slot` attribute
- `data-state` attribute
- `data-id` attribute
- `class` styling
- Type definitions
- Context sharing pattern
- Taxonomy registry
- Test coverage
- Documentation

---

## PRIORITY ORDER

### Phase 1: HIGH (14 builders)
```
dialog, popover, tooltip, select, combobox, tabs, accordion,
dropdownMenu, checkbox, switch, radioGroup, collapsible,
separator, pinInput
```

### Phase 2: MEDIUM (12 builders)
```
toggle, toggleGroup, slider, progress, toast, pagination,
contextMenu, calendar, dateField, datePicker, avatar, tagsInput
```

### Phase 3: LOW (5 builders)
```
linkPreview (hoverCard), menubar, scrollArea, tree,
aspectRatio
```

---

**This is the canonical reference. Read the builder doc. Follow the pattern. No shortcuts.**
