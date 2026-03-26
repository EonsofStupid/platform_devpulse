# Research: Primitives Foundation — Complete Audit

**Date**: 2026-03-26
**Status**: COMPLETE — ready for sprint plan

## Current State

35 primitives exist in `design/primitives/`. ALL are identical 20-line `<div>` shells with only a root slot. NONE use the correct HTML element. NONE render their full slot anatomy.

## Problems

### 1. Wrong HTML Elements
9 primitives should NOT be `<div>`:

| Primitive | Current | Correct | Why |
|---|---|---|---|
| badge | `<div>` | `<span>` | Inline label, flows with text |
| button | `<div>` | `<button>` | Native interactive element |
| checkbox | `<div>` | wrapper `<div>`, control is `<input>` | Native form control |
| heading | `<div>` | `<h1>`-`<h6>` via `as` prop | Semantic heading level |
| label | `<div>` | `<label>` | Native form association |
| link | `<div>` | `<a>` | Native navigation element |
| separator | `<div>` | `<hr>` or `<div role="separator">` | Semantic divider |
| table | `<div>` | `<table>` | Semantic tabular data |
| breadcrumbs | `<div>` | `<nav>` | Navigation landmark |

### 2. Missing Sub-Component Primitives
Most compound patterns need multiple primitives. Currently only root exists.

| Kind | Anatomy (from .anatomy.ts) | Missing Sub-Primitives |
|---|---|---|
| accordion | root, item, trigger, content | AccordionItem, AccordionTrigger, AccordionContent |
| alert-dialog | trigger, overlay, content, title, description, cancel, action | AlertDialogOverlay, AlertDialogContent, AlertDialogTitle, AlertDialogDescription, AlertDialogCancel, AlertDialogAction |
| breadcrumbs | root, list, item, link, separator | BreadcrumbsList, BreadcrumbsItem, BreadcrumbsLink, BreadcrumbsSeparator |
| checkbox | root, indicator, label | CheckboxIndicator, CheckboxLabel |
| color-field | root, input, label, swatch | ColorFieldInput, ColorFieldLabel, ColorFieldSwatch |
| color-slider | root, track, thumb, label | ColorSliderTrack, ColorSliderThumb, ColorSliderLabel |
| combobox | root, input, trigger, listbox, option, label | ComboboxInput, ComboboxTrigger, ComboboxListbox, ComboboxOption, ComboboxLabel |
| dialog | trigger, overlay, content, title, description, close | DialogTrigger, DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose |
| field | root, label, control, description, error | FieldLabel, FieldControl, FieldDescription, FieldError |
| menu | root, trigger, content, item, separator, group, label | MenuTrigger, MenuContent, MenuItem, MenuSeparator, MenuGroup, MenuLabel |
| popover | trigger, content, arrow, close | PopoverTrigger, PopoverContent, PopoverArrow, PopoverClose |
| select | root, trigger, value, listbox, option, label | SelectTrigger, SelectValue, SelectListbox, SelectOption, SelectLabel |
| sheet | trigger, overlay, content, title, description, close | SheetTrigger, SheetOverlay, SheetContent, SheetTitle, SheetDescription, SheetClose |
| slider | root, track, thumb, label, output | SliderTrack, SliderThumb, SliderLabel, SliderOutput |
| table | root, header, body, row, cell, column-header | TableHeader, TableBody, TableRow, TableCell, TableColumnHeader |
| tabs | root, list, trigger, content | TabsList, TabsTrigger, TabsContent |
| tree | root, item, group | TreeItem, TreeGroup |

### 3. Missing Structural Primitives
These don't map to WAI-ARIA patterns but are needed as building blocks:

| Primitive | Element | Purpose | Consumers |
|---|---|---|---|
| **dot** | `<span>` | Colored circle with optional glow | StatusDot, health indicators, activity dots |
| **surface** | `<div>` | Styled rectangle — bg/border/shadow/radius/blur | Card, Widget, Panel, every container |
| **row** | `<div>` | Horizontal flex with gap/align/justify | KeyValue, health rows, stats rows |
| **stack** | `<div>` | Vertical flex with gap | Form groups, widget content, stat displays |
| **text** | `<span>` | Styled text — size/weight/color/family | Every text element in the system |
| **icon-slot** | `<span>` | Icon container with sizing | Widget headers, buttons, badges |
| **input** | `<input>` | Text input field — styled bare input | TextField, SearchField, ComboboxInput |
| **textarea** | `<textarea>` | Multiline text input | Textarea component |
| **ring** | `<circle>` (SVG) | SVG circle stroke | RadialGauge track + value arc |
| **line** | `<polyline>` (SVG) | SVG polyline stroke | SparkLine data line |
| **area** | `<path>` (SVG) | SVG filled area | SparkLine area fill |

### 4. What the Dashboard and Chat NEED

**DevPulse Dashboard (`/devpulse`):**
- Widget → needs `surface` primitive (Card wraps it)
- RadialGauge → uses SVG primitives (ring, text)
- SparkLine → uses SVG primitives (line, area, dot)
- Health rows → need `row` + `dot` + `text` primitives
- Project cards → need `surface` + `row` + `dot` + `text` + badge
- Stats display → need `stack` + `text` primitives
- KeyValue → needs `row` + `text` primitives

**Chat (`/chat`):**
- Thread sidebar → needs `surface` + `stack` + `row` + `dot` + `text`
- Chat panel → needs `surface` (Card)
- Message bubbles → need `surface` + `text` + `stack`
- Status bar → needs `row` + `dot` + `text` + badge

## Priority: What to Build First

### Tier 1 — Structural primitives (makes everything render)
These are the atoms that EVERY component composes. Without them, nothing renders.

1. `surface` — the universal container primitive
2. `text` — styled text spans
3. `stack` — vertical layout
4. `row` — horizontal layout
5. `dot` — status/accent indicator
6. `icon-slot` — icon container

### Tier 2 — Fix wrong HTML elements on existing primitives
Quick wins — change `<div>` to the correct element.

7. badge → `<span>`
8. separator → `<hr>`
9. heading → `<h1>`-`<h6>`
10. label → `<label>`
11. link → `<a>`
12. breadcrumbs → `<nav>`
13. table → `<table>`

### Tier 3 — Sub-component primitives for compound patterns
Build sub-primitives for the patterns the dashboard/chat use NOW.

14. tabs → TabsList, TabsTrigger, TabsContent
15. accordion → AccordionItem, AccordionTrigger, AccordionContent
16. dialog → DialogOverlay, DialogContent, DialogTitle, DialogDescription, DialogClose

### Tier 4 — Everything else
Remaining sub-component primitives built as components need them.

## Anti-Pattern Risks

1. Building primitives that nothing consumes — only build what's needed NOW
2. Adding behavior to primitives — they're STRUCTURAL ONLY
3. Using StyleMacro inside primitives — primitives don't know about visual presets. Components add StyleMacro.
4. Making primitives too smart — they render HTML, accept class, spread rest props. That's it.
