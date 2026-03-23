# SPRINT: ADR-001 Full Alignment — Every File

**Status**: ACTIVE
**Date**: 2026-03-22
**Goal**: Zero errors. Every primitive and component aligned to ADR-001 2-layer pattern.

---

## Pattern (2-Layer — ADR-001 LOCKED)

### Layer 1: Primitive Hook
```
primitives/{kind}/
  {kind}.anatomy.ts       — createAnatomy(kind, slots)
  {kind}.types.ts         — behavioral props, per-slot typed attrs, return type
  use-{kind}.svelte.ts    — $state + $derived. ARIA, keyboard, focus, state.
  index.ts                — barrel
```

### Layer 2: Component (THE PRODUCT)
```
components/{kind}/
  {Kind}.svelte           — hook + StyleMacro in ONE file. What users import.
  {kind}.types.ts         — extends ComponentProps. Intent + size + behavioral.
  {kind}.schema.ts        — colocated Zod schema. Registers in registry.
  index.ts                — barrel (public API)
```

### DTCG Style Tokens
```
tokens/src/component.json
  style.{kind}-{variant}  — 11-axis DTCG token group per variant
```

**NO `ui/` folder. Component IS the product.**

---

## Gold Standard (Author First)

### 1. Button ✅ (done this session)
- [x] `primitives/button/` — useButton hook works
- [x] `components/button/Button.svelte` — dumb
- [x] `components/button/button.types.ts` — extends ComponentProps
- [x] `components/button/button.schema.ts` — colocated, registered
- [x] `ui/button/Button.svelte` — StyleMacro wrapper
- [x] `tokens/src/component.json` — style.button-primary/secondary/ghost/danger
- [ ] `button.types.ts` — verify extends ComponentProps correctly after latest edit

### 2. Accordion (Author Next)
- [ ] `primitives/accordion/` — fix anatomy type narrowing
- [ ] `components/accordion/Accordion.svelte` — strip to dumb
- [ ] `components/accordion/accordion.types.ts` — extend ComponentProps
- [ ] `components/accordion/accordion.schema.ts` — colocated, register
- [ ] `ui/accordion/Accordion.svelte` — StyleMacro wrapper
- [ ] `tokens/src/component.json` — style.accordion-default

---

## Root Cause Fixes (before batch)

### Anatomy type narrowing
**File**: `schema/anatomy.schema.ts`
**Error**: `data-slot` union doesn't narrow — `"root" | "label" | "icon"` not assignable to `"root"`
**Fix**: `createAnatomy` return type needs per-slot narrowed attrs
**Impact**: Fixes ~30 primitive files at once

### Deleted modules still imported
**Files**: `_schema/contract.ts`, `_schema/schema.ts`, `config/coldlight/types.ts`
**Error**: Cannot find module `primitives/_schema/types.js`
**Fix**: Delete or reauthor `_schema/` to use new `_base/schema.ts`

### Old `_base` exports still imported
**Error**: `ColdLightProps`, `PreparedComponentProps` not found
**Files**: ~80 component types.ts files
**Fix**: Change to `ComponentProps` from `_base/types.ts`

### Old `useColdLight` still imported
**Error**: Cannot find module `use-coldlight.svelte.js`
**Files**: ~60 component .svelte files
**Fix**: Remove import, strip visual logic, make dumb

### Old `recipes/` still imported
**Files**: ~60 component .svelte files
**Fix**: Remove recipe imports, delete recipe.ts files

---

## Every Component File (what happens)

### Components that need full reauthor (types.ts + .svelte + schema.ts + ui/)

accordion, alert, alert-dialog, avatar, avatar-group, badge, banner, button,
calendar, callout, card, checkbox, code, collapsible, color-area, color-field,
color-slider, color-swatch, color-swatch-picker, color-wheel, combobox,
contextual-help, data-table, date-field, date-picker, date-range-field,
date-range-picker, description-list, dialog, empty-state, file-upload, form,
form-field, heading, inline-message, input-group, kbd, label, link-preview,
list, loading-overlay, menubar, nav, navigation-menu, notification-center,
pagination, pin-input, popover, progress, prose, radio-group, range-calendar,
scroll-area, select, separator, sheet, sidebar, skeleton, skip-link, slider,
spinner, stat, steps, switch, table, table-of-contents, tabs, text, text-field,
textarea, toaster, toggle, toggle-group, toolbar, tooltip, tree

**Total: ~75 component kinds**

Per kind:
1. `types.ts` — extend ComponentProps, remove ColdLightProps/PreparedComponentProps
2. `.svelte` — remove useColdLight, remove recipe imports, remove visual classes, keep structure + ARIA + size
3. `schema.ts` — NEW colocated schema, extends _base, registers
4. `ui/{kind}/` — NEW StyleMacro wrapper + index.ts
5. `tokens/src/component.json` — NEW style.{kind}-{variant} DTCG token groups
6. Delete `recipe.ts` if exists

### Primitives that need anatomy fix

accordion, alert-dialog, badge, breadcrumbs, button, checkbox, color-field,
color-slider, combobox, dialog, field, grid-list, listbox, menu, meter,
number-field, popover, progress, radio-group, search-field, select, sheet,
slider, switch, table, tabs, tag-group, text-field, toolbar, tooltip, tree

**Total: ~31 primitive kinds**

Per kind: anatomy type narrowing fix propagates from `anatomy.schema.ts` root cause

### Files to DELETE

```
components/_base/use-coldlight.svelte.ts     ✅ DELETED this session
components/*/recipe.ts                        46 files — JS recipes replaced by DTCG JSON
recipes/                                      entire folder — old JS recipe system
registry/resolve-visual.ts                    old resolution pipeline
registry/presets.ts                           old preset system
registry/token-categories.ts                  old 8-axis encoding
registry/encoding.ts                          old encoding
registry/kind-definitions.ts                  old CDOs
_schema/contract.ts                           references deleted modules
_schema/schema.ts                             references deleted modules
components/types.ts                           old ColdLightProps barrel
style/style.ts                                old style barrel
provider/types.ts                             old provider types
```

### Routes/Layouts to update imports

```
layouts/app/ChatOverlay.svelte        ✅ DONE — imports from ui/button/
layouts/app/TopBar.svelte             ✅ DONE — imports from ui/button/
layouts/app/Sidebar.svelte            ✅ DONE — imports from ui/button/
routes/(chat)/chat/+page.svelte       ✅ DONE — imports from ui/button/
routes/(app)/ui-demo/+page.svelte     ✅ DONE — imports from ui/button/
routes/(app)/devforge/+page.svelte    — needs update when components reauthored
routes/(app)/maestro/+page.svelte     — needs update
routes/(app)/overmind/+page.svelte    — needs update
routes/(app)/wiredfront/+page.svelte  — needs update
```

### Stories to update

```
stories/shards/Button.stories.svelte  — import from ui/, remove old props
stories/shards/Panel.stories.svelte   — import from ui/
```

---

## Execution Order

1. Fix `anatomy.schema.ts` — root cause, fixes 31 primitives
2. Author Accordion gold standard (primitive fix + component + schema + ui + tokens)
3. Delete old systems (recipes/, registry/, _schema/, recipe.ts files)
4. Batch reauthor components (types.ts + .svelte + schema.ts) — one at a time, compile-check each
5. Create ui/ wrappers for each component
6. Author DTCG style tokens for each component
7. Update consumer imports (routes, layouts, stories)
8. Final: 0 errors, 0 warnings
