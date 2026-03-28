# Sprint: Primitive Authoring Plan

> Every primitive planned. Correct element. Correct ARIA. Correct props. No shells.

---

## What a Primitive IS

A primitive is a **semantic structural element** that a developer reaches for when building UI. It renders the correct HTML element, carries the correct ARIA role, exposes `data-kind` + `data-slot` for styling hooks, and accepts typed props. It does NOT contain styling logic — that's the component's job via `resolveMacro()`.

Primitives are what you compose pages FROM. Without them you get `<div>` soup.

---

## Classification

Every primitive falls into one of 3 categories:

| Category | What It Is | Examples |
|----------|-----------|---------|
| **Structural** | Layout and semantic containers. Render correct HTML element. No ARIA roles needed. | Surface, Stack, Row, Text, Heading, Separator, IconSlot, Dot |
| **Interactive** | Render correct element + ARIA role + keyboard contract. Wire to behavior hook. | Checkbox, Switch, Toggle, Button, Tabs, Dialog, Menu, etc. |
| **Form** | Input containers with label/description/error wiring. | Field, TextField, NumberField, SearchField, ColorField |

---

## The 41 Primitives — Planned

### STRUCTURAL (8) — Layout & Semantic Containers

These do NOT wire to behavior hooks. They provide semantic HTML, layout props, and styling hooks.

---

#### 1. Surface

**Purpose:** Universal semantic container. The `<div>` replacement.

| Aspect | Value |
|--------|-------|
| Element | `<svelte:element this={as}>` — `div` \| `section` \| `article` \| `aside` \| `main` \| `footer` \| `header` \| `nav` |
| ARIA | None (semantic element carries meaning) |
| Props | `as?: string` (default: `"div"`), `children`, `class`, `...rest` |
| Data attrs | `data-kind="surface"`, `data-slot="root"` |
| Status | **EXISTS — CORRECT.** Keep as-is. |

---

#### 2. Stack

**Purpose:** Vertical flex layout container.

| Aspect | Value |
|--------|-------|
| Element | `<div>` |
| ARIA | None |
| Props | `gap?: string`, `align?: "start" \| "center" \| "end" \| "stretch" \| "baseline"`, `justify?: "start" \| "center" \| "end" \| "between" \| "around" \| "evenly"`, `children`, `class`, `...rest` |
| Data attrs | `data-kind="stack"`, `data-slot="root"` |
| Status | **EXISTS — CORRECT.** Keep as-is. Resolve duplication with `utils/stack/` (delete the util, keep the primitive). |

---

#### 3. Row

**Purpose:** Horizontal flex layout container.

| Aspect | Value |
|--------|-------|
| Element | `<div>` |
| ARIA | None |
| Props | `gap?: string`, `align?: "start" \| "center" \| "end" \| "stretch" \| "baseline"`, `justify?: "start" \| "center" \| "end" \| "between" \| "around" \| "evenly"`, `wrap?: boolean`, `children`, `class`, `...rest` |
| Data attrs | `data-kind="row"`, `data-slot="root"` |
| Status | **EXISTS — CORRECT.** Keep as-is. Resolve duplication with `utils/hstack/` (delete the util, keep the primitive). |

---

#### 4. Text

**Purpose:** Polymorphic inline text element.

| Aspect | Value |
|--------|-------|
| Element | `<svelte:element this={as}>` — `span` \| `p` \| `strong` \| `em` \| `small` \| `div` |
| ARIA | None |
| Props | `as?: string` (default: `"span"`), `children`, `class`, `...rest` |
| Data attrs | `data-kind="text"`, `data-slot="root"` |
| Status | **EXISTS — CORRECT.** Keep as-is. |

---

#### 5. Heading

**Purpose:** Semantic heading with level-driven element.

| Aspect | Value |
|--------|-------|
| Element | `<h1>` through `<h6>` based on `level` prop |
| ARIA | None (native heading semantics) |
| Props | `level?: 1 \| 2 \| 3 \| 4 \| 5 \| 6` (default: `2`), `children`, `class`, `...rest` |
| Data attrs | `data-kind="heading"`, `data-slot="root"`, `data-level="{level}"` |
| Status | **EXISTS — CORRECT.** Keep as-is. |

---

#### 6. Separator

**Purpose:** Visual/semantic divider.

| Aspect | Value |
|--------|-------|
| Element | `<hr>` |
| ARIA | `role="separator"` (native on `<hr>`), `aria-orientation` |
| Props | `orientation?: "horizontal" \| "vertical"` (default: `"horizontal"`), `decorative?: boolean`, `class`, `...rest` |
| Data attrs | `data-kind="separator"`, `data-slot="root"`, `data-orientation` |
| Changes needed | Add `decorative` prop — when true, set `role="none"` to remove separator semantics. Add `aria-orientation`. |
| Status | **EXISTS — NEEDS UPDATE.** Add `decorative` + `aria-orientation`. |

---

#### 7. Dot

**Purpose:** Status indicator dot.

| Aspect | Value |
|--------|-------|
| Element | `<span>` |
| ARIA | `aria-hidden="true"` (decorative) |
| Props | `size?: string` (default: `"0.5rem"`), `color?: string` (default: `"currentColor"`), `glow?: boolean`, `animate?: boolean`, `class`, `...rest` |
| Data attrs | `data-kind="dot"`, `data-slot="root"` |
| Status | **EXISTS — CORRECT.** Keep as-is. |

---

#### 8. IconSlot

**Purpose:** Icon container with consistent sizing.

| Aspect | Value |
|--------|-------|
| Element | `<span>` |
| ARIA | `aria-hidden="true"` (decorative — icons need visible label elsewhere) |
| Props | `size?: string` (default: `"1rem"`), `children`, `class`, `...rest` |
| Data attrs | `data-kind="icon-slot"`, `data-slot="root"` |
| Status | **EXISTS — CORRECT.** Keep as-is. |

---

### INTERACTIVE (27) — Wire to Behavior Hooks

Each of these renders the correct HTML element with the correct ARIA role. The behavior hook provides the attrs — the primitive renders the structural DOM and spreads them.

**Pattern for every interactive primitive:**

```svelte
<script lang="ts">
  import type { Snippet } from 'svelte';
  import { cn } from '$lib/design/utils/cn.js';
  import type { XxxPrimitiveProps } from './types.js';

  let { children, class: className, ...rest }: XxxPrimitiveProps = $props();
</script>

<element
  data-kind="xxx"
  data-slot="root"
  class={cn(className)}
  {...rest}
>
  {@render children?.()}
</element>
```

The component layer calls `useXxx()` and spreads the hook's attrs via `{...rest}`. The primitive just renders the right element.

---

#### 9. Accordion

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | None on root |
| Sub-elements needed | `AccordionItem` (`<div>`), `AccordionTrigger` (`<button>`), `AccordionContent` (`<div>` with `role="region"`) |
| Behavior hook | `useAccordion()` — slots: root, item, trigger, content |
| Status | **REAUTHOR.** Currently single empty div. Needs 4 sub-primitives matching anatomy. |

---

#### 10. AlertDialog

| Aspect | Value |
|--------|-------|
| Root element | `<dialog>` (native) |
| ARIA (from hook) | `role="alertdialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| Sub-elements needed | `AlertDialogContent` (`<dialog>`), `AlertDialogTitle` (`<h2>`), `AlertDialogDescription` (`<p>`), `AlertDialogCancel` (`<button>`), `AlertDialogAction` (`<button>`) |
| Behavior hook | `useAlertDialog()` — slots: trigger, overlay, content, title, description, cancel, action |
| Status | **REAUTHOR.** Currently empty div. Needs compound parts matching anatomy. |

---

#### 11. Badge

| Aspect | Value |
|--------|-------|
| Element | `<span>` |
| ARIA (from hook) | `role="presentation"` (decorative label) |
| Sub-elements | None (icon + label are children) |
| Behavior hook | `useBadge()` — slots: root, icon, label |
| Status | **EXISTS as span — CORRECT element.** Add `role="presentation"` from hook. |

---

#### 12. Breadcrumbs

| Aspect | Value |
|--------|-------|
| Root element | `<nav>` |
| ARIA (from hook) | `aria-label="Breadcrumbs"` on nav |
| Sub-elements needed | `BreadcrumbList` (`<ol>`), `BreadcrumbItem` (`<li>`), `BreadcrumbLink` (`<a>`), `BreadcrumbSeparator` (`<span>` with `aria-hidden`) |
| Behavior hook | `useBreadcrumbs()` — slots: root, list, item, link, separator |
| Status | **REAUTHOR.** Currently empty nav. Needs compound parts. |

---

#### 13. Checkbox

| Aspect | Value |
|--------|-------|
| Root element | `<button type="button">` |
| ARIA (from hook) | `role="checkbox"`, `aria-checked`, `aria-disabled`, `aria-required` |
| Sub-elements needed | `CheckboxIndicator` (`<span>` with `aria-hidden`), `CheckboxLabel` (`<label>`) |
| Behavior hook | `useCheckbox()` — slots: root, indicator, label |
| Status | **REAUTHOR.** Currently bare `<button>` with no ARIA. Needs correct element + compound parts. |

---

#### 14. ColorField

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | Group container |
| Sub-elements needed | `ColorFieldInput` (`<input type="text">`), `ColorFieldLabel` (`<label>`), `ColorFieldSwatch` (`<span>`) |
| Behavior hook | `useColorField()` — slots: root, input, label, swatch |
| Status | **REAUTHOR.** Needs compound parts. |

---

#### 15. ColorSlider

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | None on root |
| Sub-elements needed | `ColorSliderTrack` (`<div>`), `ColorSliderThumb` (`<div>` with `role="slider"`), `ColorSliderLabel` (`<label>`) |
| Behavior hook | `useColorSlider()` — slots: root, track, thumb, label |
| Status | **REAUTHOR.** Needs compound parts with slider role on thumb. |

---

#### 16. Combobox

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="combobox"` on input |
| Sub-elements needed | `ComboboxInput` (`<input type="text">` with `role="combobox"`), `ComboboxTrigger` (`<button>`), `ComboboxListbox` (`<div>` with `role="listbox"`), `ComboboxOption` (`<div>` with `role="option"`), `ComboboxLabel` (`<label>`) |
| Behavior hook | `useCombobox()` — slots: root, input, trigger, listbox, option, label |
| Status | **REAUTHOR.** Needs compound parts. |

---

#### 17. Dialog

| Aspect | Value |
|--------|-------|
| Root element | None (context provider only) |
| Content element | `<dialog>` (native) |
| ARIA (from hook) | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| Sub-elements needed | `DialogContent` (`<dialog>`), `DialogOverlay` (`<div>` with `aria-hidden`), `DialogTitle` (`<h2>`), `DialogDescription` (`<p>`), `DialogClose` (`<button>`) |
| Behavior hook | `useDialog()` — slots: trigger, overlay, content, title, description, close |
| Status | **REAUTHOR.** Currently empty div. Needs native `<dialog>` + compound parts. |

---

#### 18. Field

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="group"` on root |
| Sub-elements needed | `FieldLabel` (`<label>`), `FieldControl` (generic slot), `FieldDescription` (`<span>`), `FieldError` (`<span>` with `role="alert"`) |
| Behavior hook | `useField()` — slots: root, label, control, description, error |
| Status | **REAUTHOR.** Needs compound parts for form field pattern. |

---

#### 19. GridList

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="grid"` |
| Sub-elements needed | `GridListItem` (`<div>` with `role="row"` + `role="gridcell"`) |
| Behavior hook | `useGridList()` — slots: root, item |
| Status | **REAUTHOR.** Currently empty div. Needs `role="grid"` + item parts. |

---

#### 20. Label

| Aspect | Value |
|--------|-------|
| Element | `<label>` |
| ARIA (from hook) | None (native `<label>` semantics + `for` attr) |
| Behavior hook | `useLabel()` — slots: root |
| Status | **EXISTS — CORRECT element.** Already renders `<label>`. |

---

#### 21. Link

| Aspect | Value |
|--------|-------|
| Element | `<a>` |
| ARIA (from hook) | None for native `<a>`. `role="link"` only if non-native element. |
| Behavior hook | `useLink()` — slots: root |
| Status | **EXISTS — CORRECT element.** Already renders `<a>`. |

---

#### 22. Listbox

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="listbox"` |
| Sub-elements needed | `ListboxOption` (`<div>` with `role="option"`), `ListboxGroup` (`<div>` with `role="group"`), `ListboxLabel` (`<span>`) |
| Behavior hook | `useListbox()` — slots: root, option, group, label |
| Status | **REAUTHOR.** Currently empty div. Needs `role="listbox"` + compound parts. |

---

#### 23. Menu

| Aspect | Value |
|--------|-------|
| Root element | None (context provider) |
| Content element | `<div>` with `role="menu"` |
| ARIA (from hook) | `role="menu"`, `aria-labelledby` |
| Sub-elements needed | `MenuTrigger` (`<button>` with `aria-haspopup="menu"`), `MenuContent` (`<div>` with `role="menu"`), `MenuItem` (`<div>` with `role="menuitem"`), `MenuSeparator` (`<div>` with `role="separator"`), `MenuGroup` (`<div>` with `role="group"`), `MenuLabel` (`<span>`) |
| Behavior hook | `useMenu()` — slots: root, trigger, content, item, separator, group, label |
| Status | **REAUTHOR.** Currently empty div. Needs full compound anatomy. |

---

#### 24. Meter

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="meter"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` |
| Sub-elements needed | `MeterTrack` (`<div>`), `MeterFill` (`<div>`), `MeterLabel` (`<span>`) |
| Behavior hook | `useMeter()` — slots: root, track, fill, label |
| Status | **REAUTHOR.** Currently empty div. Needs `role="meter"` + compound parts. |

---

#### 25. NumberField

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="group"` on root, `role="spinbutton"` on input |
| Sub-elements needed | `NumberFieldInput` (`<input type="text">` with `role="spinbutton"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`), `NumberFieldIncrement` (`<button>`), `NumberFieldDecrement` (`<button>`) |
| Behavior hook | `useNumberField()` — slots: root, input, increment, decrement |
| Status | **REAUTHOR.** Needs compound parts with spinbutton role. |

---

#### 26. Popover

| Aspect | Value |
|--------|-------|
| Root element | None (context provider) |
| Content element | `<div>` |
| ARIA (from hook) | `role="dialog"` on content |
| Sub-elements needed | `PopoverTrigger` (`<button>` with `aria-haspopup="dialog"`), `PopoverContent` (`<div>` with `role="dialog"`), `PopoverArrow` (`<div>`), `PopoverClose` (`<button>`) |
| Behavior hook | `usePopover()` — slots: trigger, content, arrow, close |
| Status | **REAUTHOR.** Currently empty div. Needs compound parts. |

---

#### 27. Progress

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="progressbar"`, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-label` |
| Sub-elements needed | `ProgressTrack` (`<div>`), `ProgressFill` (`<div>`), `ProgressLabel` (`<span>`) |
| Behavior hook | `useProgress()` — slots: root, track, fill, label |
| Status | **REAUTHOR.** Currently empty div. Needs `role="progressbar"` + compound parts. |

---

#### 28. RadioGroup

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="radiogroup"`, `aria-label` or `aria-labelledby` |
| Sub-elements needed | `RadioGroupItem` (`<div>` with `role="radio"`, `aria-checked`), `RadioGroupLabel` (`<label>`), `RadioGroupDescription` (`<span>`) |
| Behavior hook | `useRadioGroup()` — slots: root, radio, label, description |
| Status | **REAUTHOR.** Currently empty div. Needs `role="radiogroup"` + compound parts. |

---

#### 29. SearchField

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="search"` on root, `role="searchbox"` on input |
| Sub-elements needed | `SearchFieldInput` (`<input type="search">` with `role="searchbox"`), `SearchFieldIcon` (`<span>` with `aria-hidden`), `SearchFieldClear` (`<button>`) |
| Behavior hook | `useSearchField()` — slots: root, input, icon, clear |
| Status | **REAUTHOR.** Needs `role="search"` + compound parts. |

---

#### 30. Select

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="combobox"` on trigger |
| Sub-elements needed | `SelectTrigger` (`<button>` with `role="combobox"`, `aria-haspopup="listbox"`), `SelectValue` (`<span>`), `SelectListbox` (`<div>` with `role="listbox"`), `SelectOption` (`<div>` with `role="option"`), `SelectLabel` (`<label>`) |
| Behavior hook | `useSelect()` — slots: root, trigger, value, listbox, option, label |
| Status | **REAUTHOR.** Needs compound parts. |

---

#### 31. Sheet

| Aspect | Value |
|--------|-------|
| Root element | None (context provider) |
| Content element | `<div>` |
| ARIA (from hook) | `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, `aria-describedby` |
| Sub-elements needed | `SheetContent` (`<div>` with `role="dialog"`), `SheetOverlay` (`<div>` with `aria-hidden`), `SheetTitle` (`<h2>`), `SheetDescription` (`<p>`), `SheetClose` (`<button>`) |
| Behavior hook | `useSheet()` — slots: trigger, overlay, content, title, description, close |
| Status | **REAUTHOR.** Currently empty div. Needs compound parts like Dialog. |

---

#### 32. Slider

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="slider"` on thumb, `aria-valuenow`, `aria-valuemin`, `aria-valuemax`, `aria-orientation` |
| Sub-elements needed | `SliderTrack` (`<div>`), `SliderThumb` (`<div>` with `role="slider"`), `SliderLabel` (`<label>`), `SliderOutput` (`<output>`) |
| Behavior hook | `useSlider()` — slots: root, track, thumb, label, output |
| Status | **REAUTHOR.** Currently empty div. Needs compound parts with slider role on thumb. |

---

#### 33. Switch

| Aspect | Value |
|--------|-------|
| Element | `<button type="button">` |
| ARIA (from hook) | `role="switch"`, `aria-checked` |
| Sub-elements needed | `SwitchThumb` (`<span>` decorative), `SwitchLabel` (`<label>`) |
| Behavior hook | `useSwitch()` — slots: root, thumb, label |
| Status | **REAUTHOR.** Currently bare `<button>`. Needs `role="switch"` + compound parts. |

---

#### 34. Table

| Aspect | Value |
|--------|-------|
| Root element | `<table>` |
| ARIA | Native table semantics |
| Sub-elements needed | `TableHead` (`<thead>`), `TableBody` (`<tbody>`), `TableRow` (`<tr>`), `TableHeader` (`<th>`), `TableCell` (`<td>`) |
| Behavior hook | `useTable()` — slots: root |
| Status | **REAUTHOR.** Currently renders `<table>` which is correct. Needs sub-elements for semantic markup. |

---

#### 35. Tabs

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="tablist"` on list, `role="tab"` on trigger, `role="tabpanel"` on content |
| Sub-elements needed | `TabsList` (`<div>` with `role="tablist"`), `TabsTrigger` (`<button>` with `role="tab"`), `TabsContent` (`<div>` with `role="tabpanel"`) |
| Behavior hook | `useTabs()` — slots: root, list, trigger, content |
| Status | **REAUTHOR.** Currently empty div. Needs compound parts. |

---

#### 36. TagGroup

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="grid"` |
| Sub-elements needed | `Tag` (`<div>` with `role="row"`/`role="gridcell"`), `TagGroupLabel` (`<span>`), `TagGroupDescription` (`<span>`), `TagRemove` (`<button>`) |
| Behavior hook | `useTagGroup()` — slots: root, tag, label, description, remove |
| Status | **REAUTHOR.** Currently empty div. Needs compound parts. |

---

#### 37. TextField

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | None on root; `aria-labelledby`, `aria-describedby` on input |
| Sub-elements needed | `TextFieldInput` (`<input type="text">`), `TextFieldLabel` (`<label>`), `TextFieldDescription` (`<span>`), `TextFieldError` (`<span>` with `role="alert"`) |
| Behavior hook | `useTextField()` — slots: root, input, label, description, error |
| Status | **REAUTHOR.** Needs compound parts. |

---

#### 38. Toggle

| Aspect | Value |
|--------|-------|
| Element | `<button type="button">` |
| ARIA (from hook) | `aria-pressed` |
| Behavior hook | `useToggle()` — slots: root |
| Status | **REAUTHOR.** Currently bare `<button>`. Needs `aria-pressed` from hook. Single element, no compound parts. |

---

#### 39. Toolbar

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="toolbar"`, `aria-orientation`, `aria-label` |
| Sub-elements needed | `ToolbarItem` (generic slot for buttons/toggles) |
| Behavior hook | `useToolbar()` — slots: root, item |
| Status | **REAUTHOR.** Currently empty div. Needs `role="toolbar"`. |

---

#### 40. Tooltip

| Aspect | Value |
|--------|-------|
| Root element | None (context provider) |
| Content element | `<div>` with `role="tooltip"` |
| ARIA (from hook) | `role="tooltip"` on content, `aria-describedby` on trigger |
| Sub-elements needed | `TooltipTrigger` (wraps any element, adds `aria-describedby`), `TooltipContent` (`<div>` with `role="tooltip"`) |
| Behavior hook | `useTooltip()` — slots: trigger, content |
| Status | **REAUTHOR.** Currently empty div. Needs compound parts. |

---

#### 41. Tree

| Aspect | Value |
|--------|-------|
| Root element | `<div>` |
| ARIA (from hook) | `role="tree"` |
| Sub-elements needed | `TreeItem` (`<div>` with `role="treeitem"`, `aria-expanded`, `aria-level`, `aria-setsize`, `aria-posinset`), `TreeGroup` (`<div>` with `role="group"`) |
| Behavior hook | `useTree()` — slots: root, item, group |
| Status | **REAUTHOR.** Currently empty div. Needs `role="tree"` + compound parts. |

---

### FORM WRAPPERS (6) — Containers Already Covered Above

TextField, NumberField, SearchField, ColorField, ColorSlider, and Field are already planned above as interactive primitives with compound sub-elements.

---

## Summary

| Status | Count | Primitives |
|--------|-------|-----------|
| **KEEP AS-IS** | 8 | Surface, Stack, Row, Text, Heading, Dot, IconSlot, Label |
| **MINOR UPDATE** | 3 | Separator (+decorative), Badge (+role), Link (correct already) |
| **REAUTHOR** | 27 | Accordion, AlertDialog, Breadcrumbs, Checkbox, ColorField, ColorSlider, Combobox, Dialog, Field, GridList, Listbox, Menu, Meter, NumberField, Popover, Progress, RadioGroup, SearchField, Select, Sheet, Slider, Switch, Table, Tabs, TagGroup, TextField, Toggle |
| **ADD MISSING** | 3 | Toolbar (reauthor), Tooltip (reauthor), Tree (reauthor) |

### Reauthor Complexity

| Complexity | Count | Primitives |
|-----------|-------|-----------|
| **Simple** (1-2 elements) | 5 | Toggle, Badge, Label, Link, Separator |
| **Medium** (3-4 sub-elements) | 14 | Checkbox, Switch, Meter, Progress, Slider, Toolbar, RadioGroup, GridList, Listbox, SearchField, Tabs, TagGroup, ColorSlider, Field |
| **Complex** (5+ sub-elements) | 8 | Dialog, AlertDialog, Sheet, Menu, Combobox, Select, Breadcrumbs, TextField, NumberField, ColorField, Popover, Table, Tree, Tooltip, Accordion |

### Execution Order

1. **Simple first** — Toggle, Badge, Separator (warm up, verify pattern)
2. **Medium** — Checkbox, Switch, Progress, Meter, Slider, Tabs, RadioGroup (core interactive)
3. **Complex** — Dialog, Menu, Combobox, Select, Table, Tree (compound systems)
4. **Form** — Field, TextField, NumberField, SearchField, ColorField (form integration)

Each primitive gets:
- `types.ts` — typed props per sub-element
- `{Kind}.svelte` — root element
- `{Kind}{Part}.svelte` — each sub-element
- `index.ts` — barrel export
