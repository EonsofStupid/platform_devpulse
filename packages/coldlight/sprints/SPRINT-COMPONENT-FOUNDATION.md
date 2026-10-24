# Sprint: ColdLight Component Foundation

**Date**: 2026-02-15
**Research**: `SPRINT-COMPONENT-FOUNDATION.research.md`
**Status**: IN PROGRESS
**Scope**: Style Dictionary v5 pipeline + 36 component builds + comprehensive tests

---

## Prerequisites

- [x] Taxonomy restructure complete (taxonomy/primitive/, taxonomy/component/)
- [x] 40 component contracts exist (schema.ts, contract.ts, types.ts)
- [x] 4 gold-standard components exist (dialog, combobox, tabs, panel)
- [x] Style Dictionary v5.3.0 installed
- [x] Vitest + Playwright configured
- [x] Biome configured with strict rules

---

## Phase 1: Style Dictionary v5 Pipeline

**Goal**: Wire SD5 into the token build pipeline. Produce DTCG-format tokens and generate identical outputs to the current manual pipeline.

### Tasks

- [ ] **1.1** Create `packages/coldlight/tokens/tokens.json` — DTCG-format token source
  - Convert all categories from tokens.ts: hues, color scales, glass, matte, text, spacing, radius, blur, glow, shadow, bevel, z-index, duration, easing, text-size, padding, signal, font, animation
  - Use `$type` and `$value` per W3C DTCG spec
  - Reference tokens via `{category.name}` syntax

- [ ] **1.2** Create `scripts/dev/design/sd5-config.ts` — SD5 configuration
  - Source: `tokens/tokens.json`
  - Platforms: css, ts, tailwind
  - Custom transforms for OKLCH values
  - Custom file headers

- [ ] **1.3** Create `scripts/dev/design/sd5-formats.ts` — Custom SD5 output formats
  - `coldlight/css` — CSS custom properties + Tier 2 semantic + Tier 3 component + @theme block
  - `coldlight/types` — TypeScript token unions + runtime arrays + TokenArrays aggregate
  - `coldlight/tailwind` — Tailwind v4 preset with dpPreset config

- [ ] **1.4** Create `scripts/dev/design/sd5-build.ts` — Build orchestrator
  - Reads tokens.ts → converts to DTCG JSON
  - Runs SD5 with config
  - Validates output parity with existing tokens.css, types.ts, tailwind.preset.ts

- [ ] **1.5** Add `ds:tokens:build:sd5` script to package.json

- [ ] **1.6** Verify parity — SD5 output matches existing pipeline output exactly

**Exit**: `pnpm ds:tokens:build:sd5` produces identical tokens.css, types.ts, tailwind.preset.ts

---

## Phase 2: Expand Component Tokens (Tier 3)

**Goal**: Every component kind gets Tier 3 tokens in `tokens/components.ts`.

### Tasks

- [ ] **2.1** Add tokens for all 40 component kinds:

| Kind | Tokens |
|------|--------|
| accordion | bg, border, trigger-bg, trigger-bg-hover, content-bg |
| alert | bg, border, icon-color |
| alert-dialog | bg, border, depth, overlay-bg |
| avatar | bg, border, fallback-bg, fallback-text |
| badge | bg, border (exists) |
| breadcrumb | separator-color, link-color, link-color-hover |
| button | bg, bg-hover, border, border-focus (exists) |
| card | bg, border, depth |
| checkbox | bg, border, border-checked, indicator-color |
| collapsible | trigger-bg, content-bg, border |
| command | bg, border, input-bg, item-bg-hover, depth |
| context-menu | bg, border, item-bg-hover, depth |
| dialog | bg, border, depth (exists) |
| dropdown-menu | bg, border, item-bg-hover, depth |
| hover-card | bg, border, depth |
| input | bg, bg-focus, border, border-focus (exists) |
| label | text-color |
| menubar | bg, border, trigger-bg-hover, item-bg-hover |
| navigation-menu | bg, border, trigger-bg-hover, content-bg |
| pagination | bg, border, active-bg, active-border |
| panel | bg, border, depth (exists) |
| pin-input | bg, border, border-focus |
| popover | bg, border, depth |
| progress | bg, fill-bg, border |
| radio-group | bg, border, border-checked, indicator-color |
| scroll-area | thumb-bg, thumb-bg-hover, track-bg |
| select | bg, border, trigger-bg, item-bg-hover, depth |
| separator | color |
| sheet | bg, border, depth, overlay-bg |
| skeleton | bg, shimmer-color |
| slider | track-bg, range-bg, thumb-bg, thumb-border |
| spinner | color, track-color |
| switch | bg, bg-checked, thumb-bg, border |
| textarea | bg, bg-focus, border, border-focus |
| toggle | bg, bg-pressed, border |
| toggle-group | bg, bg-active, border |
| toolbar | bg, border, separator-color |
| tooltip | bg, border (exists) |
| visually-hidden | — (no visual tokens) |

- [ ] **2.2** Regenerate tokens.css with new Tier 3 tokens
- [ ] **2.3** Verify compilation

**Exit**: All 40 kinds have Tier 3 component tokens (except visually-hidden)

---

## Phase 3: Build Tier 1 Components (7 Single-Slot)

**Goal**: Build the simplest components first to validate the pattern.

### Per Component: separator, skeleton, spinner, visually-hidden, badge, label, progress

Each gets:
- [ ] `context.ts` — ComponentContext with `{ classes }`
- [ ] `{Kind}.svelte` — Root element with data-kind, data-slot, recipe classes
- [ ] `index.ts` — Barrel export (Root + types)
- [ ] `recipes/components/{kind}/{kind}.default.ts` — Glass void recipe
- [ ] `recipes/components/{kind}/types.ts` — Recipe ID type
- [ ] `recipes/components/{kind}/index.ts` — Side-effect registration
- [ ] `blueprints/components/{kind}/{kind}.default.ts` — Default blueprint
- [ ] `blueprints/components/{kind}/types.ts` — Blueprint type
- [ ] `blueprints/components/{kind}/index.ts` — Side-effect registration

### Component Specifications

#### 3.1 Separator
```
Element: <hr> (horizontal) or <div> (vertical)
Props: orientation?: "horizontal" | "vertical", decorative?: boolean
ARIA: role="separator" (when not decorative), aria-orientation
Data: data-kind="separator" data-slot="root" data-orientation
Recipe slots: root
```

#### 3.2 Skeleton
```
Element: <div>
Props: width?: string, height?: string, circle?: boolean, animate?: boolean
ARIA: role="status", aria-label="Loading..."
Data: data-kind="skeleton" data-slot="root" data-state="loading"
Recipe slots: root (with pulse animation)
```

#### 3.3 Spinner
```
Element: <div> with SVG
Props: size?: "sm" | "md" | "lg", label?: string
ARIA: role="status", aria-label={label ?? "Loading"}
Data: data-kind="spinner" data-slot="root" data-state="loading"
Recipe slots: root
```

#### 3.4 Visually Hidden
```
Element: <span>
Props: children
ARIA: Screen reader only — CSS clip pattern
Data: data-kind="visually-hidden" data-slot="root"
Recipe slots: root (sr-only classes)
```

#### 3.5 Badge
```
Element: <span>
Props: variant?: "default" | "secondary" | "destructive" | "outline", children
Data: data-kind="badge" data-slot="root"
Recipe slots: root (with variant classes)
```

#### 3.6 Label
```
Element: <label>
Props: for?: string, required?: boolean, disabled?: boolean, children
ARIA: native label semantics
Data: data-kind="label" data-slot="root"
Recipe slots: root
```

#### 3.7 Progress
```
Element: <div> container + <div> fill
Props: value?: number, max?: number, indeterminate?: boolean
ARIA: role="progressbar", aria-valuenow, aria-valuemin, aria-valuemax, aria-label
Data: data-kind="progress" data-slot="root"/"indicator"
Recipe slots: root, indicator
Sub-components: ProgressIndicator.svelte
```

**Exit**: 7 components render, pass biome check

---

## Phase 4: Build Tier 2 Components (8 Simple Multi-Slot)

### Per Component: button, input, textarea, toggle, card, alert, avatar, breadcrumb

#### 4.1 Button
```
Slots: root(button), icon(span), label(span)
Props: variant?: "default"|"destructive"|"outline"|"secondary"|"ghost"|"link",
       size?: "sm"|"md"|"lg"|"icon", disabled?: boolean, loading?: boolean,
       pressed?: boolean, type?: "button"|"submit"|"reset", children
ARIA: native button, aria-pressed (toggle), aria-disabled, aria-busy
Keyboard: Enter, Space → activate
Recipe slots: root, icon, label (with variant × size matrix)
```

#### 4.2 Input
```
Slots: root(input — self-closing)
Props: type?: string, placeholder?: string, value?: string ($bindable),
       disabled?: boolean, required?: boolean, invalid?: boolean
ARIA: native input, aria-invalid, aria-required, aria-describedby
Recipe slots: root
```

#### 4.3 Textarea
```
Slots: root(textarea — self-closing)
Props: placeholder?: string, value?: string ($bindable), rows?: number,
       disabled?: boolean, required?: boolean, invalid?: boolean, resize?: "none"|"vertical"|"horizontal"|"both"
ARIA: native textarea, aria-invalid, aria-required
Recipe slots: root
```

#### 4.4 Toggle
```
Slots: root(button)
Props: pressed?: boolean ($bindable), disabled?: boolean, children
ARIA: aria-pressed, aria-disabled
Keyboard: Enter, Space → toggle
Data: data-state="on"|"off"
Recipe slots: root
```

#### 4.5 Card
```
Slots: root(div), header(div), title(h3), description(p), content(div), footer(div)
Props: children, per-slot children
ARIA: optional article role
Recipe slots: root, header, title, description, content, footer
Sub-components: CardHeader, CardTitle, CardDescription, CardContent, CardFooter
```

#### 4.6 Alert
```
Slots: root(div), icon(span), title(h5), description(p)
Props: variant?: "default"|"destructive"|"success"|"warning", children
ARIA: role="alert" (or role="status" for non-urgent)
Recipe slots: root, icon, title, description
Sub-components: AlertIcon, AlertTitle, AlertDescription
```

#### 4.7 Avatar
```
Slots: root(span), image(img — self-closing), fallback(span)
Props: src?: string, alt?: string, fallback?: string, size?: "sm"|"md"|"lg"
ARIA: aria-label on root, alt on image
Data: data-state="loaded"|"loading"|"error"
Recipe slots: root, image, fallback
Sub-components: AvatarImage, AvatarFallback
```

#### 4.8 Breadcrumb
```
Slots: root(nav), list(ol), item(li), link(a), separator(span), page(span)
Props: children (composed)
ARIA: nav[aria-label="Breadcrumb"], link (standard a), page[aria-current="page"]
Recipe slots: root, list, item, link, separator, page
Sub-components: BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage
```

**Exit**: 8 components render with all sub-components, pass biome check

---

## Phase 5: Build Tier 3 Components (14 Interactive Multi-Slot)

### Per Component: checkbox, switch, radio-group, toggle-group, pin-input, slider, scroll-area, pagination, toolbar, collapsible, hover-card, popover, tooltip, accordion

#### 5.1 Checkbox
```
Slots: root(button), indicator(span)
Props: checked?: boolean | "indeterminate" ($bindable), disabled?: boolean, required?: boolean, name?: string, value?: string
ARIA: role="checkbox", aria-checked (true|false|mixed), aria-required
Keyboard: Space → toggle
Data: data-state="checked"|"unchecked"|"indeterminate"
```

#### 5.2 Switch
```
Slots: root(button), thumb(span)
Props: checked?: boolean ($bindable), disabled?: boolean, required?: boolean, name?: string
ARIA: role="switch", aria-checked
Keyboard: Space → toggle
Data: data-state="checked"|"unchecked"
```

#### 5.3 Radio Group
```
Slots: root(div/fieldset), item(button), indicator(span)
Props: value?: string ($bindable), disabled?: boolean, required?: boolean, orientation?: "horizontal"|"vertical", loop?: boolean
ARIA: root[role="radiogroup"], item[role="radio", aria-checked], aria-orientation
Keyboard: ArrowDown/Right(next), ArrowUp/Left(prev), Home, End
Focus: roving tabindex
```

#### 5.4 Toggle Group
```
Slots: root(div), item(button)
Props: type?: "single"|"multiple", value?: string|string[] ($bindable), disabled?: boolean, orientation?: "horizontal"|"vertical", loop?: boolean
ARIA: root[role="group"], item[aria-pressed]
Keyboard: ArrowRight/Left or ArrowDown/Up (based on orientation), Home, End
Focus: roving tabindex
```

#### 5.5 Pin Input
```
Slots: root(div), input(input — self-closing)
Props: value?: string ($bindable), length?: number, placeholder?: string, disabled?: boolean, mask?: boolean, type?: "numeric"|"alphanumeric"
ARIA: root[role="group", aria-label], input[aria-label="Digit N"]
Keyboard: ArrowLeft/Right(navigate), Backspace(delete+move back), auto-advance on input
Focus: roving tabindex between inputs
```

#### 5.6 Slider
```
Slots: root(div), track(div), range(div), thumb(div)
Props: value?: number|number[] ($bindable), min?: number, max?: number, step?: number, disabled?: boolean, orientation?: "horizontal"|"vertical"
ARIA: root[role="group"], thumb[role="slider", aria-valuenow, aria-valuemin, aria-valuemax, aria-orientation]
Keyboard: ArrowRight/Up(increment), ArrowLeft/Down(decrement), Home(min), End(max), PageUp/PageDown(large step)
```

#### 5.7 Scroll Area
```
Slots: root(div), viewport(div), scrollbar(div), thumb(div), corner(div)
Props: type?: "auto"|"always"|"scroll"|"hover", scrollHideDelay?: number, orientation?: "horizontal"|"vertical"|"both"
ARIA: Custom scrollbar (div-based, not native), aria-orientation on scrollbar
```

#### 5.8 Pagination
```
Slots: root(nav), content(div), item(button), previous(button), next(button), ellipsis(span)
Props: page?: number ($bindable), count: number, siblingCount?: number, disabled?: boolean
ARIA: nav[aria-label="Pagination"], item[aria-current="page" when active], previous/next[aria-label]
```

#### 5.9 Toolbar
```
Slots: root(div), group(div), separator(div), button(button), link(a), toggle(button)
Props: orientation?: "horizontal"|"vertical", loop?: boolean
ARIA: root[role="toolbar", aria-orientation], group[role="group"]
Keyboard: ArrowRight/Left or ArrowDown/Up, Home, End, Tab(exit)
Focus: roving tabindex
```

#### 5.10 Collapsible
```
Slots: root(div), trigger(button), content(div)
Props: open?: boolean ($bindable), disabled?: boolean
ARIA: trigger[aria-expanded, aria-controls], content[id]
Keyboard: Enter/Space(toggle)
Data: data-state="open"|"closed"
```

#### 5.11 Hover Card
```
Slots: root(fragment), trigger(a|button), content(div)
Props: openDelay?: number, closeDelay?: number
ARIA: Content announced via aria-describedby linkage
Data: data-state="open"|"closed"
```

#### 5.12 Popover
```
Slots: root(fragment), trigger(button), content(div), close(button)
Props: open?: boolean ($bindable), modal?: boolean
ARIA: trigger[aria-expanded, aria-haspopup, aria-controls], content[role depends on modal]
Keyboard: Escape(close), Tab(navigate within or exit)
Data: data-state="open"|"closed"
```

#### 5.13 Tooltip
```
Slots: root(fragment), trigger(any), content(div)
Props: openDelay?: number, closeDelay?: number
ARIA: trigger[aria-describedby → content.id], content[role="tooltip"]
Data: data-state="open"|"closed"
```

#### 5.14 Accordion
```
Slots: root(div), item(div), header(h3), trigger(button), content(div)
Props: type?: "single"|"multiple", value?: string|string[] ($bindable), collapsible?: boolean, disabled?: boolean, orientation?: "vertical"
ARIA: trigger[aria-expanded, aria-controls], content[role="region", aria-labelledby]
Keyboard: Enter/Space(toggle), ArrowDown/Up(navigate triggers), Home/End
Focus: roving tabindex on triggers
Data: data-state="open"|"closed" per item
Sub-components: AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent
```

**Exit**: 14 components render with state management and keyboard behavior, pass biome check

---

## Phase 6: Build Tier 4 Components (7 Complex Compound)

### Per Component: alert-dialog, sheet, select, dropdown-menu, context-menu, command, navigation-menu, menubar

These are the most complex. Each gets Pattern B initially (structural Svelte + data attributes + recipe classes). Transport factories for ARIA state management will be built when adapter work is prioritized.

#### 6.1 Alert Dialog
```
Sub-components: AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction
Props: open ($bindable), preventScroll
Focus: trap, NO escape exit
ARIA: content[role="alertdialog", aria-modal, aria-labelledby(REQUIRED), aria-describedby(REQUIRED)]
```

#### 6.2 Sheet
```
Sub-components: Sheet, SheetTrigger, SheetPortal, SheetOverlay, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose
Props: open ($bindable), side?: "top"|"right"|"bottom"|"left", closeOnEscape, closeOnOutsideClick
Focus: trap, Escape closes
ARIA: content[role="dialog", aria-modal, aria-labelledby]
Recipe: side-aware slide animations
```

#### 6.3 Select
```
Sub-components: Select, SelectTrigger, SelectValue, SelectContent, SelectViewport, SelectItem, SelectItemText, SelectGroup, SelectLabel, SelectSeparator
Props: value ($bindable), open ($bindable), disabled, placeholder
Focus: activedescendant (DOM focus on trigger)
ARIA: trigger[combobox, aria-expanded, aria-haspopup, aria-controls], content[listbox], item[option, aria-selected]
Keyboard: ArrowUp/Down, Enter/Space, Escape, Home/End, type-ahead
```

#### 6.4 Dropdown Menu
```
Sub-components: DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent
Props: open ($bindable)
Focus: roving tabindex within menu
ARIA: trigger[aria-haspopup, aria-expanded], content[menu, aria-labelledby], items[menuitem/menuitemcheckbox/menuitemradio]
Keyboard: ArrowDown/Up, Enter/Space, Escape, Home/End, ArrowRight(submenu open), ArrowLeft(submenu close)
```

#### 6.5 Context Menu
```
Sub-components: ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent
Props: open ($bindable)
Focus: roving tabindex
Trigger: right-click (contextmenu event)
```

#### 6.6 Command
```
Sub-components: Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty, CommandSeparator
Props: value ($bindable), filter?: (value: string, search: string) => number
Focus: activedescendant (input retains DOM focus)
ARIA: root[combobox, aria-expanded], input[searchbox], list[listbox], item[option, aria-selected]
Keyboard: ArrowUp/Down, Enter, Escape, Home/End
Filtering: client-side contains match by default, custom filter function
```

#### 6.7 Navigation Menu
```
Sub-components: NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, NavigationMenuViewport
Props: value ($bindable), orientation?: "horizontal"|"vertical"
Focus: roving tabindex (horizontal)
ARIA: root[nav, aria-label], trigger[aria-expanded], link[aria-current]
Keyboard: ArrowRight/Left, ArrowDown(open), Escape(close), Home/End
Semantic: nav > ul > li > button/a
```

#### 6.8 Menubar
```
Sub-components: Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarGroup, MenubarItem, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem, MenubarLabel, MenubarSeparator, MenubarSub, MenubarSubTrigger, MenubarSubContent
Props: value ($bindable)
Focus: roving tabindex (horizontal at bar, vertical in menus)
ARIA: root[menubar], trigger[menuitem, aria-haspopup, aria-expanded], content[menu, aria-labelledby]
Keyboard: ArrowRight/Left(triggers), ArrowDown/Up(menu items), Enter/Space, Escape, Home/End
```

**Exit**: All 7 complex components render with structural Svelte, data attributes, recipe classes

---

## Phase 7: Comprehensive Tests

**Goal**: Every component gets 7-10 describe blocks testing contract, ARIA, recipes, state, keyboard, focus, edge cases.

### Per Component Test Structure

```typescript
// {Kind}.test.svelte — Test harness
// - Imports component via barrel
// - Registers recipe and blueprint (side-effect imports)
// - Renders component with testable props
// - Exposes $bindable state

// {Kind}.test.ts — Test suite (7-10 blocks)
describe("{Kind} Component", () => {
  // 1. Contract
  describe("Contract", () => {
    it("root has data-kind='{kind}'");
    it("root has data-slot='root'");
    it("all slots have correct data-slot values");
    it("data-state reflects current state");
  });

  // 2. ARIA
  describe("ARIA", () => {
    it("has correct role");
    it("has required aria-* attributes");
    it("aria-expanded reflects open state");
    it("aria-labelledby references correct element");
    it("aria-controls references correct element");
  });

  // 3. Recipe Classes
  describe("Recipe Classes", () => {
    it("root has recipe surface class");
    it("sub-slots have recipe classes");
    it("custom className merges with recipe classes");
  });

  // 4. State
  describe("State", () => {
    it("initial state is correct");
    it("state transitions on interaction");
    it("data-state attribute updates");
    it("$bindable props sync both ways");
  });

  // 5. Keyboard
  describe("Keyboard", () => {
    it("{key} → {action}");
    // Per contract.keyboardMap entries
  });

  // 6. Focus
  describe("Focus", () => {
    it("focus strategy is {trap|roving|activedescendant|none}");
    it("initial focus placement");
    it("focus return on close");
    it("tabindex values correct");
  });

  // 7. Disabled
  describe("Disabled", () => {
    it("disabled prop prevents interaction");
    it("aria-disabled is set");
    it("disabled styling applied");
  });

  // 8. Edge Cases
  describe("Edge Cases", () => {
    it("handles empty children");
    it("handles undefined optional props");
    it("multiple instances isolated");
  });
});
```

### Tasks

- [ ] **7.1** Write tests for Tier 1 (7 components × 4-6 describe blocks)
- [ ] **7.2** Write tests for Tier 2 (8 components × 6-8 describe blocks)
- [ ] **7.3** Write tests for Tier 3 (14 components × 8-10 describe blocks)
- [ ] **7.4** Write tests for Tier 4 (7 components × 10 describe blocks)
- [ ] **7.5** Create Playwright e2e tests for critical paths:
  - Dialog open/close/escape/trap
  - Tabs keyboard navigation
  - Select open/navigate/select/close
  - Command filter/select
  - Menubar horizontal navigation + submenu
  - Accordion expand/collapse
  - Form components (input, textarea, checkbox, switch, radio-group)

**Exit**: `pnpm test:run` passes all component tests, `pnpm test:e2e` passes e2e tests

---

## Phase 8: Barrel Exports + Registration

**Goal**: All 40 components exported from components/index.ts with recipe/blueprint side-effect registration.

### Tasks

- [ ] **8.1** Update `components/index.ts` — add side-effect imports for all 36 new recipe/blueprint registrations, add namespace exports for all 36
- [ ] **8.2** Update `design/index.ts` — export all component namespaces
- [ ] **8.3** Verify `+layout.svelte` imports `#coldlight/components/index.js`

**Exit**: `import * from "#coldlight/components"` resolves all 40 namespaces

---

## Phase 9: Verification + Commit

### Tasks

- [ ] **9.1** Run `pnpm svelte-check` — zero TypeScript errors
- [ ] **9.2** Run biome check — zero lint/format errors
- [ ] **9.3** Run `pnpm test:run` — all vitest tests pass
- [ ] **9.4** Run `pnpm test:e2e` — all playwright tests pass
- [ ] **9.5** Commit with descriptive message

**Exit**: Clean compilation, clean lint, all tests pass, committed

---

## Component Inventory — Full Slot Map

| # | Component | Slots | Sub-Components (.svelte files) |
|---|-----------|-------|-------------------------------|
| 1 | separator | root | Separator |
| 2 | skeleton | root | Skeleton |
| 3 | spinner | root | Spinner |
| 4 | visually-hidden | root | VisuallyHidden |
| 5 | badge | root | Badge |
| 6 | label | root | Label |
| 7 | progress | root, indicator | Progress, ProgressIndicator |
| 8 | button | root, icon, label | Button, ButtonIcon, ButtonLabel |
| 9 | input | root | Input |
| 10 | textarea | root | Textarea |
| 11 | toggle | root | Toggle |
| 12 | card | root, header, title, description, content, footer | Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter |
| 13 | alert | root, icon, title, description | Alert, AlertIcon, AlertTitle, AlertDescription |
| 14 | avatar | root, image, fallback | Avatar, AvatarImage, AvatarFallback |
| 15 | breadcrumb | root, list, item, link, separator, page | Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage |
| 16 | checkbox | root, indicator | Checkbox, CheckboxIndicator |
| 17 | switch | root, thumb | Switch, SwitchThumb |
| 18 | radio-group | root, item, indicator | RadioGroup, RadioGroupItem, RadioGroupIndicator |
| 19 | toggle-group | root, item | ToggleGroup, ToggleGroupItem |
| 20 | pin-input | root, input | PinInput, PinInputInput |
| 21 | slider | root, track, range, thumb | Slider, SliderTrack, SliderRange, SliderThumb |
| 22 | scroll-area | root, viewport, scrollbar, thumb, corner | ScrollArea, ScrollAreaViewport, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaCorner |
| 23 | pagination | root, content, item, previous, next, ellipsis | Pagination, PaginationContent, PaginationItem, PaginationPrevious, PaginationNext, PaginationEllipsis |
| 24 | toolbar | root, group, separator, button, link, toggle | Toolbar, ToolbarGroup, ToolbarSeparator, ToolbarButton, ToolbarLink, ToolbarToggle |
| 25 | collapsible | root, trigger, content | Collapsible, CollapsibleTrigger, CollapsibleContent |
| 26 | hover-card | root, trigger, content | HoverCard, HoverCardTrigger, HoverCardContent |
| 27 | popover | root, trigger, content, close | Popover, PopoverTrigger, PopoverContent, PopoverClose |
| 28 | tooltip | root, trigger, content | Tooltip, TooltipTrigger, TooltipContent |
| 29 | accordion | root, item, header, trigger, content | Accordion, AccordionItem, AccordionHeader, AccordionTrigger, AccordionContent |
| 30 | alert-dialog | root, trigger, portal, overlay, content, title, description, cancel, action | AlertDialog, AlertDialogTrigger, AlertDialogPortal, AlertDialogOverlay, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction |
| 31 | sheet | root, trigger, portal, overlay, content, header, footer, title, description, close | Sheet, SheetTrigger, SheetPortal, SheetOverlay, SheetContent, SheetHeader, SheetFooter, SheetTitle, SheetDescription, SheetClose |
| 32 | select | root, trigger, value, content, viewport, item, item-text, group, label, separator | Select, SelectTrigger, SelectValue, SelectContent, SelectViewport, SelectItem, SelectItemText, SelectGroup, SelectLabel, SelectSeparator |
| 33 | dropdown-menu | root, trigger, content, group, item, checkbox-item, radio-group, radio-item, label, separator, sub, sub-trigger, sub-content | DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuCheckboxItem, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuSub, DropdownMenuSubTrigger, DropdownMenuSubContent |
| 34 | context-menu | root, trigger, content, group, item, checkbox-item, radio-group, radio-item, label, separator, sub, sub-trigger, sub-content | ContextMenu, ContextMenuTrigger, ContextMenuContent, ContextMenuGroup, ContextMenuItem, ContextMenuCheckboxItem, ContextMenuRadioGroup, ContextMenuRadioItem, ContextMenuLabel, ContextMenuSeparator, ContextMenuSub, ContextMenuSubTrigger, ContextMenuSubContent |
| 35 | command | root, input, list, group, item, empty, separator | Command, CommandInput, CommandList, CommandGroup, CommandItem, CommandEmpty, CommandSeparator |
| 36 | navigation-menu | root, list, item, trigger, content, link, viewport | NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuTrigger, NavigationMenuContent, NavigationMenuLink, NavigationMenuViewport |
| 37 | menubar | root, menu, trigger, content, group, item, checkbox-item, radio-group, radio-item, label, separator, sub, sub-trigger, sub-content | Menubar, MenubarMenu, MenubarTrigger, MenubarContent, MenubarGroup, MenubarItem, MenubarCheckboxItem, MenubarRadioGroup, MenubarRadioItem, MenubarLabel, MenubarSeparator, MenubarSub, MenubarSubTrigger, MenubarSubContent |

**Total new .svelte files: ~185**
**Total new files (all types): ~530**

---

## Execution Rules

1. **Taxonomy is SSOT** — if a component's contract doesn't declare a slot, the .svelte file doesn't create it
2. **Every component folder MUST have**: context.ts, index.ts, at least one .svelte file
3. **Every component MUST have**: recipe (registered), blueprint (registered), test (.test.ts + .test.svelte)
4. **Data attributes are NON-NEGOTIABLE**: data-kind, data-slot, data-state on every element
5. **SD5 compliance**: All tokens flow through Style Dictionary v5 pipeline
6. **Biome compliance**: All code passes biome check before commit
7. **No shortcuts**: Every component built to its contract specification
8. **Tests are comprehensive**: 7-10 describe blocks, not bare stubs
