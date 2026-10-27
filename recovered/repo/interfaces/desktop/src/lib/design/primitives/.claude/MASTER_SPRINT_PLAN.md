# MASTER SPRINT PLAN — ColdLight Primitives

> **Primitives are headless structural shells. ZERO behavior. ZERO ARIA.**
> **Behavior and ARIA are composed at the component layer via dsAdapter.**
> **See CHECKLIST.md for golden standard patterns. See ADR.md for rationale.**

---

## ARCHITECTURE REFERENCE

```
LAYER 3: Components ─── ARIA, roles, IDs, focus, keyboard, melt
LAYER 2: Primitives ─── data-kind, data-slot, data-state, class, children (THIS PLAN)
LAYER 1: Taxonomy ───── Contracts: slots, states, ARIA spec, keyboard spec (THIS PLAN)
```

Primitives own structure. Components own behavior. Taxonomy owns the DNA.

---

## CURRENT STATE

### Golden Standards (complete, verified)

| Kind | Taxonomy | Primitive | Parity | Notes |
|------|----------|-----------|--------|-------|
| button | ✅ | ✅ | coldlight (2-folder) | Simple primitive, no context |
| dialog | ✅ | ✅ | meltui (3-folder) | Compound, 8 sub-components |
| tabs | ✅ | ✅ | meltui (3-folder) | Compound, 3 sub-components |

### Partial (taxonomy exists, primitive needs work)

| Kind | Taxonomy | Primitive | Status |
|------|----------|-----------|--------|
| sheet | ✅ | ✅ created | Verify against golden standard |
| alert-dialog | ✅ | ❌ | Taxonomy only |
| popover | ✅ | ❌ | Taxonomy only |
| tooltip | ✅ | ❌ | Taxonomy only |
| select | ✅ | ❌ | Taxonomy only |

### Not Started (no taxonomy, no primitive)

Everything in Sprints 2–7 below.

---

## PER-KIND WORKFLOW

Every primitive follows this exact sequence. No skipping. No reordering.

### Step 1: Taxonomy 3-File Stack

```
taxonomy/kinds/primitives/{kind}/
├── types.ts      ← as const arrays, derived type unions, slotStates map
├── contract.ts   ← imports types, exports PrimitiveContract
└── index.ts      ← barrel re-exports
```

### Step 2: Primitive Stack

```
primitives/{kind}/
├── types.ts      ← prop interfaces: OmitStyle<T> + BaseProps
├── context.ts    ← Symbol-keyed get/set (compound only)
├── {Kind}.svelte ← root component
├── {Kind}{Slot}.svelte  ← per sub-component (compound only)
└── index.ts      ← barrel exports
```

### Step 3: Wire Up

- Add exports to `primitives/index.ts`
- Add exports to `taxonomy/kinds/primitives/index.ts`

### Step 4: Verify

- `pnpm svelte-check` — 0 errors
- Every `.svelte` has: `data-kind`, `data-slot`, `class={cn(className)}`, `{@render children?.()}`
- Every `.svelte` has: `{...rest}` spread, DEV `stripStyleProp` guard
- ZERO: `@melt-ui/svelte` imports, `role`, `aria-*`, `id`, event handlers
- Types use `OmitStyle<T>` + `BaseProps`
- Barrel exports all components + types + context

---

## SPRINT 1: Current Core

Complete the primitives that already have taxonomy contracts.

### 1.1 Sheet — verify existing

- [ ] Verify all `.svelte` files match golden standard
- [ ] Verify types.ts uses `OmitStyle<T>` + `BaseProps`
- [ ] Verify context.ts uses Symbol-keyed pattern
- [ ] Verify index.ts barrel is complete
- [ ] Verify ZERO ARIA, ZERO behavior, ZERO melt
- [ ] Add to `primitives/index.ts` barrel

### 1.2 AlertDialog

Compound. Shares dialog's slot structure with `role="alertdialog"` at component layer.

**Slots:** root, trigger, portal, overlay, content, title, description, action, cancel
**Context:** `{ open: boolean }`
**Elements:** root=none, trigger=button, portal=div, overlay=div, content=div, title=h2, description=p, action=button, cancel=button

- [ ] Taxonomy: types.ts, contract.ts, index.ts
- [ ] Primitive: types.ts, context.ts
- [ ] Primitive: AlertDialog.svelte (root, context provider)
- [ ] Primitive: AlertDialogTrigger.svelte, AlertDialogPortal.svelte, AlertDialogOverlay.svelte
- [ ] Primitive: AlertDialogContent.svelte, AlertDialogTitle.svelte, AlertDialogDescription.svelte
- [ ] Primitive: AlertDialogAction.svelte, AlertDialogCancel.svelte
- [ ] Primitive: index.ts
- [ ] Verify

### 1.3 Popover

Compound. Floating content anchored to a trigger.

**Slots:** root, trigger, portal, content, close, arrow
**Context:** `{ open: boolean }`
**Elements:** root=none, trigger=button, portal=div, content=div, close=button, arrow=div

- [ ] Taxonomy: types.ts, contract.ts, index.ts
- [ ] Primitive: types.ts, context.ts
- [ ] Primitive: Popover.svelte, PopoverTrigger.svelte, PopoverPortal.svelte
- [ ] Primitive: PopoverContent.svelte, PopoverClose.svelte, PopoverArrow.svelte
- [ ] Primitive: index.ts
- [ ] Verify

### 1.4 Tooltip

Compound. Hover/focus content.

**Slots:** root, trigger, portal, content, arrow
**Context:** `{ open: boolean }`
**Elements:** root=none, trigger=button, portal=div, content=div, arrow=div

- [ ] Taxonomy: types.ts, contract.ts, index.ts
- [ ] Primitive: types.ts, context.ts
- [ ] Primitive: Tooltip.svelte, TooltipTrigger.svelte, TooltipPortal.svelte
- [ ] Primitive: TooltipContent.svelte, TooltipArrow.svelte
- [ ] Primitive: index.ts
- [ ] Verify

### 1.5 Select

Compound. Dropdown selection.

**Slots:** root, trigger, value, portal, content, viewport, item, item-text, item-indicator, group, group-label, separator, scroll-up, scroll-down, arrow
**Context:** `{ open: boolean }`
**Elements:** root=none, trigger=button, value=span, portal=div, content=div, viewport=div, item=div, item-text=span, item-indicator=span, group=div, group-label=div, separator=div, scroll-up=div, scroll-down=div, arrow=div

- [ ] Taxonomy: types.ts, contract.ts, index.ts
- [ ] Primitive: types.ts, context.ts
- [ ] Primitive: Select.svelte, SelectTrigger.svelte, SelectValue.svelte, SelectPortal.svelte
- [ ] Primitive: SelectContent.svelte, SelectViewport.svelte, SelectItem.svelte
- [ ] Primitive: SelectItemText.svelte, SelectItemIndicator.svelte
- [ ] Primitive: SelectGroup.svelte, SelectGroupLabel.svelte, SelectSeparator.svelte
- [ ] Primitive: SelectScrollUp.svelte, SelectScrollDown.svelte, SelectArrow.svelte
- [ ] Primitive: index.ts
- [ ] Verify

### Sprint 1 Gate

- [ ] `pnpm svelte-check` — 0 errors
- [ ] All 5 kinds pass sign-off checklist
- [ ] `primitives/index.ts` exports all Sprint 1 kinds
- [ ] `taxonomy/kinds/primitives/index.ts` exports all Sprint 1 contracts

---

## SPRINT 2: Layout & Structure

### 2.1 Accordion

Compound. Expandable sections.

**Slots:** root, item, trigger, header, content
**Context:** `{ value: string[] }` (which items are open)

- [ ] Taxonomy 3-file stack
- [ ] Primitive stack (types, context, svelte files, index)
- [ ] Verify

### 2.2 Separator

Simple. Visual divider.

**Slots:** root
**Element:** div (or hr)

- [ ] Taxonomy 3-file stack
- [ ] Primitive stack (types, Separator.svelte, index)
- [ ] Verify

### 2.3 AspectRatio

Simple. Constrains child to aspect ratio via CSS.

**Slots:** root
**Element:** div
**Note:** `ariaStateProvider: "coldlight"` — pure CSS, no adapter needed

- [ ] Taxonomy 3-file stack
- [ ] Primitive stack (types, AspectRatio.svelte, index)
- [ ] Verify

### 2.4 Collapsible

Compound. Single expandable region.

**Slots:** root, trigger, content
**Context:** `{ open: boolean }`

- [ ] Taxonomy 3-file stack
- [ ] Primitive stack (types, context, svelte files, index)
- [ ] Verify

### 2.5 ScrollArea

Compound. Custom scrollbar region.

**Slots:** root, viewport, scrollbar, thumb, corner
**Context:** TBD

- [ ] Taxonomy 3-file stack
- [ ] Primitive stack (types, context, svelte files, index)
- [ ] Verify

### 2.6 Toolbar

Compound. Grouping for toolbar controls.

**Slots:** root, group, item, separator, link
**Context:** TBD

- [ ] Taxonomy 3-file stack
- [ ] Primitive stack (types, context, svelte files, index)
- [ ] Verify

### Sprint 2 Gate

- [ ] `pnpm svelte-check` — 0 errors
- [ ] All 6 kinds pass sign-off
- [ ] Barrel exports updated

---

## SPRINT 3: Input & Form

### 3.1 Checkbox

Compound. Checkable control.

**Slots:** root, indicator
**Context:** `{ checked: boolean | "indeterminate" }`

### 3.2 Combobox

Compound. Searchable select.

**Slots:** root, input, trigger, portal, content, item, item-indicator, group, group-label, empty

### 3.3 Label

Simple. Form label.

**Slots:** root
**Element:** label

### 3.4 RadioGroup

Compound. Exclusive selection group.

**Slots:** root, item, indicator

### 3.5 Slider

Compound. Range input.

**Slots:** root, track, range, thumb

### 3.6 Switch

Compound. Toggle switch.

**Slots:** root, thumb
**Context:** `{ checked: boolean }`

### 3.7 TagsInput

Compound. Multi-value text input.

**Slots:** root, input, item, item-text, item-delete, clear

### 3.8 PinInput

Compound. One-character-per-field input.

**Slots:** root, input

---

Per kind: taxonomy 3-file stack → primitive stack → verify.

### Sprint 3 Gate

- [ ] `pnpm svelte-check` — 0 errors
- [ ] All 8 kinds pass sign-off
- [ ] Barrel exports updated

---

## SPRINT 4: Navigation

### 4.1 ContextMenu

Compound. Right-click menu.

**Slots:** root, trigger, portal, content, item, sub, sub-trigger, sub-content, group, group-label, separator, checkbox-item, radio-group, radio-item, item-indicator

### 4.2 DropdownMenu

Compound. Click-triggered menu. Same slot structure as ContextMenu.

### 4.3 Menubar

Compound. Horizontal menu bar.

**Slots:** root, menu, trigger, portal, content, item, sub, sub-trigger, sub-content, group, group-label, separator, checkbox-item, radio-group, radio-item, item-indicator

### 4.4 Pagination

Compound. Page navigation.

**Slots:** root, previous, next, list, item, ellipsis

### 4.5 NavigationMenu

Compound. Site navigation.

**Slots:** root, list, item, trigger, content, link, viewport, indicator

### Sprint 4 Gate

- [ ] `pnpm svelte-check` — 0 errors
- [ ] All 5 kinds pass sign-off
- [ ] Barrel exports updated

---

## SPRINT 5: Feedback & Status

### 5.1 Progress

Simple (or compound with label). Progress indicator.

**Slots:** root, indicator
**Context:** `{ value: number; max: number }`

### 5.2 Toast

Compound. Notification system.

**Slots:** root, viewport, action, close, title, description

### 5.3 Avatar

Compound. User avatar with fallback.

**Slots:** root, image, fallback
**Context:** `{ loaded: boolean }`

### 5.4 Badge

Simple. Status indicator.

**Slots:** root
**Element:** span
**Note:** `ariaStateProvider: "coldlight"` — pure semantic element

### Sprint 5 Gate

- [ ] `pnpm svelte-check` — 0 errors
- [ ] All 4 kinds pass sign-off
- [ ] Barrel exports updated

---

## SPRINT 6: Data & Date

### 6.1 Calendar

Compound. Date grid.

**Slots:** root, header, heading, grid, grid-head, grid-body, head-cell, cell, day

### 6.2 DatePicker

Compound. Calendar + input combination.

**Slots:** root, input, trigger, portal, content, calendar (embeds Calendar)

### 6.3 DateRangePicker

Compound. Range variant of DatePicker.

**Slots:** Same as DatePicker + range-specific (start, end)

### 6.4 RangeCalendar

Compound. Range variant of Calendar.

**Slots:** Same as Calendar

### 6.5 Table

Compound. Data table structure.

**Slots:** root, header, body, footer, row, head, cell, caption
**Note:** `ariaStateProvider: "coldlight"` — native table elements provide semantics. TanStack handles logic externally.

### 6.6 Tree

Compound. Hierarchical list.

**Slots:** root, item, group, indicator

### Sprint 6 Gate

- [ ] `pnpm svelte-check` — 0 errors
- [ ] All 6 kinds pass sign-off
- [ ] Barrel exports updated

---

## SPRINT 7: Utilities

### 7.1 Toggle

Simple. Pressed/unpressed control.

**Slots:** root
**Element:** button
**Context:** `{ pressed: boolean }`

### 7.2 ToggleGroup

Compound. Group of toggles with single/multi selection.

**Slots:** root, item

### 7.3 LinkPreview

Compound. Hover preview card.

**Slots:** root, trigger, portal, content, arrow

### 7.4 Command

Compound. Command palette (cmdk pattern).

**Slots:** root, input, list, group, item, separator, empty
**Note:** `ariaStateProvider: "coldlight"` — custom implementation

### Sprint 7 Gate

- [ ] `pnpm svelte-check` — 0 errors
- [ ] All 4 kinds pass sign-off
- [ ] Barrel exports updated

---

## FINAL GATE

- [ ] ALL primitives pass sign-off (CHECKLIST.md §SIGN-OFF)
- [ ] `pnpm svelte-check` — 0 errors across entire project
- [ ] `primitives/index.ts` exports every kind
- [ ] `taxonomy/kinds/primitives/index.ts` exports every contract
- [ ] ZERO `@melt-ui/svelte` imports in `primitives/` tree
- [ ] ZERO `role`, `aria-*`, `id` attributes in `primitives/` tree
- [ ] ZERO event handlers in `primitives/` tree
- [ ] Scanner parity check passes for all kinds

---

## RULES

1. **Taxonomy first.** No primitive without a contract.
2. **Golden standard only.** Every `.svelte` follows CHECKLIST.md patterns exactly.
3. **Verify after every kind.** `pnpm svelte-check` before moving on.
4. **No ARIA in primitives.** The contract DECLARES what ARIA is needed. The component layer PROVIDES it. Primitives are structure.
5. **No behavior in primitives.** No event handlers, no focus management, no keyboard nav, no melt.
6. **Kind-prefixed names.** `DialogTrigger.svelte` not `Trigger.svelte`.
7. **Ask when uncertain.** If a slot list, element type, or context shape is unclear — stop and clarify before writing.
