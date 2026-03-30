# ColdLight Master Inventory v2 — SSOT

> **Status**: ACTIVE — this file drives ALL sprint planning
> **Verified against**: melt@0.44.0 — source: next.melt-ui.com
> **Package**: `npm i melt@0.44.0`
> **Svelte 5**: runes-native. Zero stores. Class-based builders.
> **Last generated**: 2026-02-25
> **Generator**: `pnpm coldlight:inventory` (auto-generated — do NOT edit manually)

---

## CRITICAL RULES

1. `melt` imports NEVER leak past the adapter layer (`_internal/`)
2. ColdLight-owned = no adapter, ColdLight builds its own builder
3. Late-binding ARIA: melt handles its own behavior, ColdLight handles its own ARIA
4. `data-kind` / `data-slot` / `data-state` on EVERY primitive
5. `mergeAttrs()` when combining melt spreads with ColdLight attrs
6. No stores. No `$`. No `createX()`. No `use:melt={}`. Class builders only.
7. Controlled state: getter + `onXChange` callback
8. Schema-guarded absorption only — no migration from old code
9. Every primitive declares a VPB manifest (design-time introspection contract)
10. At build: tree-shake to project-specific subset. Dev: full library available.

---

## STATUS KEY

| Symbol | Meaning |
|--------|---------|
| DONE | Complete, committed, verified |
| — | Not yet implemented |

---
## 1. MELT-BACKED PRIMITIVES (17 stable via dsAdapter)

MeltUI is NEVER exposed publicly. ColdLight wraps via dsAdapter + mergeAttrs().

### 1a. _internal Transport Layer (factory + _transport)

| # | Primitive | _internal Status |
|---|-----------|-----------------|
| 1 | Accordion | DONE |
| 2 | Avatar | DONE |
| 3 | Collapsible | DONE |
| 4 | Combobox | DONE |
| 5 | Dialog | DONE |
| 6 | FileUpload | DONE |
| 7 | PinInput | DONE |
| 8 | Popover | DONE |
| 9 | Progress | DONE |
| 10 | RadioGroup | DONE |
| 11 | Select | DONE |
| 12 | Slider | DONE |
| 13 | Tabs | DONE |
| 14 | Toaster | DONE |
| 15 | Toggle | DONE |
| 16 | Tooltip | DONE |
| 17 | Tree | DONE |

**_internal transport: 17/17 DONE**

### 1b. Primitive .svelte (structureless, transport-consuming)

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
| 1 | Accordion | — | DONE | DONE |
| 2 | Avatar | — | DONE | DONE |
| 3 | Collapsible | — | DONE | DONE |
| 4 | Combobox | — | DONE | DONE |
| 5 | Dialog | — | DONE | DONE |
| 6 | FileUpload | — | DONE | DONE |
| 7 | PinInput | — | DONE | DONE |
| 8 | Popover | — | DONE | DONE |
| 9 | Progress | — | DONE | DONE |
| 10 | RadioGroup | — | DONE | DONE |
| 11 | Select | — | DONE | DONE |
| 12 | Slider | — | DONE | DONE |
| 13 | Tabs | — | DONE | DONE |
| 14 | Toaster | — | DONE | DONE |
| 15 | Toggle | — | DONE | DONE |
| 16 | Tooltip | — | DONE | DONE |
| 17 | Tree | — | DONE | DONE |

**Melt-backed .svelte: 0/17 DONE**

---

## 2. COLDLIGHT-OWNED PRIMITIVES — Interactive (23)

No adapter. ColdLight owns W3C APG, ARIA, keyboard, everything.

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
| 1 | AlertDialog | — | DONE | DONE |
| 2 | Button | DONE | DONE | DONE |
| 3 | Calendar | — | DONE | DONE |
| 4 | Checkbox | DONE | DONE | DONE |
| 5 | ContextMenu | — | DONE | DONE |
| 6 | DateField | — | DONE | DONE |
| 7 | DatePicker | — | DONE | DONE |
| 8 | DateRangeField | — | DONE | DONE |
| 9 | DateRangePicker | — | DONE | DONE |
| 10 | DropdownMenu | — | DONE | DONE |
| 11 | Label | DONE | DONE | DONE |
| 12 | LinkPreview | — | DONE | DONE |
| 13 | Menubar | — | DONE | DONE |
| 14 | Pagination | — | DONE | DONE |
| 15 | RangeCalendar | — | DONE | DONE |
| 16 | ScrollArea | DONE | DONE | DONE |
| 17 | Separator | DONE | DONE | DONE |
| 18 | Switch | DONE | DONE | DONE |
| 19 | TableOfContents | DONE | DONE | DONE |
| 20 | TagsInput | — | DONE | DONE |
| 21 | ToggleGroup | — | DONE | DONE |
| 22 | Toolbar | DONE | DONE | DONE |
| 23 | VisuallyHidden | — | — | — |

**COLDLIGHT-OWNED PRIMITIVES .svelte: 8/23 DONE**

---

## 3. COLDLIGHT-OWNED PRIMITIVES — Layout (11)

Structural primitives. No ARIA complexity. Token-driven spacing/sizing.

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
| 1 | AspectRatio | DONE | DONE | DONE |
| 2 | Box | DONE | DONE | DONE |
| 3 | Center | DONE | DONE | DONE |
| 4 | Container | DONE | DONE | DONE |
| 5 | Divider | DONE | DONE | DONE |
| 6 | Flex | DONE | DONE | DONE |
| 7 | Grid | DONE | DONE | DONE |
| 8 | Hstack | DONE | DONE | DONE |
| 9 | Spacer | DONE | DONE | DONE |
| 10 | Stack | DONE | DONE | DONE |
| 11 | Sticky | DONE | DONE | DONE |

**COLDLIGHT-OWNED PRIMITIVES .svelte: 11/11 DONE**

---

## 4. COLDLIGHT-OWNED PRIMITIVES — Typography (5)

Text rendering primitives. Token-driven scale/weight/leading.

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
| 1 | Code | DONE | DONE | DONE |
| 2 | Heading | DONE | DONE | DONE |
| 3 | Kbd | DONE | DONE | DONE |
| 4 | Prose | DONE | DONE | DONE |
| 5 | Text | DONE | DONE | DONE |

**COLDLIGHT-OWNED PRIMITIVES .svelte: 5/5 DONE**

---

## 5. COLDLIGHT-OWNED PRIMITIVES — Data Display (9)

Data presentation primitives.

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
| 1 | Badge | DONE | DONE | DONE |
| 2 | Card | DONE | DONE | DONE |
| 3 | DataTable | DONE | DONE | DONE |
| 4 | DescriptionList | DONE | DONE | DONE |
| 5 | EmptyState | DONE | DONE | DONE |
| 6 | List | DONE | DONE | DONE |
| 7 | Skeleton | DONE | DONE | DONE |
| 8 | Stat | DONE | DONE | DONE |
| 9 | Table | DONE | DONE | DONE |

**COLDLIGHT-OWNED PRIMITIVES .svelte: 9/9 DONE**

---

## 6. COLDLIGHT-OWNED PRIMITIVES — Feedback (6)

User feedback and loading indicators.

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
| 1 | Alert | DONE | DONE | DONE |
| 2 | Banner | DONE | DONE | DONE |
| 3 | Callout | DONE | DONE | DONE |
| 4 | InlineMessage | DONE | DONE | DONE |
| 5 | LoadingOverlay | DONE | DONE | DONE |
| 6 | Spinner | DONE | DONE | DONE |

**COLDLIGHT-OWNED PRIMITIVES .svelte: 6/6 DONE**

---

## 7. COLDLIGHT-OWNED PRIMITIVES — Form (9)

Form input primitives.

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
| 1 | ColorInput | DONE | DONE | DONE |
| 2 | ColorPicker | — | — | — |
| 3 | Form | DONE | DONE | DONE |
| 4 | FormField | DONE | DONE | DONE |
| 5 | Input | DONE | DONE | DONE |
| 6 | InputGroup | — | DONE | DONE |
| 7 | NumberInput | — | DONE | DONE |
| 8 | SearchInput | — | DONE | DONE |
| 9 | Textarea | DONE | DONE | DONE |

**COLDLIGHT-OWNED PRIMITIVES .svelte: 5/9 DONE**

---

## 8. COLDLIGHT-OWNED PRIMITIVES — Navigation (7)

Navigation and wayfinding primitives.

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
| 1 | Breadcrumb | DONE | DONE | DONE |
| 2 | Nav | DONE | DONE | DONE |
| 3 | NavItem | DONE | DONE | DONE |
| 4 | NavigationMenu | — | — | — |
| 5 | Sidebar | DONE | DONE | DONE |
| 6 | SkipLink | DONE | DONE | DONE |
| 7 | Steps | DONE | DONE | DONE |

**COLDLIGHT-OWNED PRIMITIVES .svelte: 6/7 DONE**

---

## 9. COLDLIGHT-OWNED PRIMITIVES — Overlay (4)

Modal and overlay primitives.

| # | Primitive | .svelte | types.ts | contract.ts |
|---|-----------|---------|----------|-------------|
| 1 | Command | — | — | — |
| 2 | CommandPalette | — | DONE | DONE |
| 3 | NotificationCenter | DONE | DONE | DONE |
| 4 | Sheet | — | DONE | DONE |

**COLDLIGHT-OWNED PRIMITIVES .svelte: 1/4 DONE**

---

## 10. COLDLIGHT UTILITY ACTIONS (10)

Reusable behavior. Svelte `use:action` pattern, runes-native.

| # | Action | Status |
|---|--------|--------|
| 1 | useClickOutside | DONE |
| 2 | useEscapeKey | DONE |
| 3 | useFocusReturn | DONE |
| 4 | useFocusTrap | DONE |
| 5 | useIntersection | DONE |
| 6 | useKeyboard | DONE |
| 7 | useMediaQuery | DONE |
| 8 | usePortal | DONE |
| 9 | useResizeObserver | DONE |
| 10 | useVisuallyHidden | DONE |

**Utility Actions: 10/10 DONE**

---

## 11. COLDLIGHT UTILITY FUNCTIONS (8)

Pure functions. No DOM, no Svelte dependency.

| # | Utility | Status |
|---|---------|--------|
| 1 | ariaAnnounce | DONE |
| 2 | cn | DONE |
| 3 | idGen | DONE |
| 4 | slotMerge | DONE |
| 5 | tokenResolve | DONE |
| 6 | vrecipeBuild | DONE |
| 7 | vrecipeParse | DONE |
| 8 | vrecipeValidate | DONE |

**Utility Functions: 8/8 DONE**

---

## 12. COMPONENT LAYER

Styled components: primitive + recipe + ARIA.

| # | Kind | .svelte | types.ts | contract.ts | recipe.ts |
|---|------|---------|----------|-------------|-----------|
| 1 | button | DONE | DONE | DONE | DONE |

**Component Layer: 1/1 with .svelte**

---

## 13. RECIPES

Styling patterns applied via class prop.

### Components (4)

| # | Kind | Variants | index.ts | types.ts |
|---|------|----------|----------|----------|
| 1 | combobox | combobox.default.ts | DONE | DONE |
| 2 | dialog | dialog.default.ts | DONE | DONE |
| 3 | panel | panel.default.ts, panel.glass-tint.ts, panel.matte.ts, panel.metal.ts | DONE | DONE |
| 4 | tabs | tabs.default.ts | DONE | DONE |

### Layouts (1)

| # | Kind | Variants | index.ts |
|---|------|----------|----------|
| 1 | shell | shell.app.ts, shell.chat.ts | DONE |

---

## 14. BLUEPRINTS

| # | Kind | Variants | index.ts | types.ts |
|---|------|----------|----------|----------|
| 1 | combobox | combobox.default.ts | DONE | DONE |
| 2 | dialog | dialog.default.ts | DONE | DONE |
| 3 | panel | panel.default.ts | DONE | DONE |
| 4 | tabs | tabs.default.ts | DONE | DONE |

---

## 15. ADAPTER LAYER

### MeltUI Adapters (17)

| # | Kind | factory | _transport | Complete |
|---|------|---------|------------|----------|
| 1 | accordion | DONE | DONE | DONE |
| 2 | avatar | DONE | DONE | DONE |
| 3 | collapsible | DONE | DONE | DONE |
| 4 | combobox | DONE | DONE | DONE |
| 5 | dialog | DONE | DONE | DONE |
| 6 | fileupload | DONE | DONE | DONE |
| 7 | pininput | DONE | DONE | DONE |
| 8 | popover | DONE | DONE | DONE |
| 9 | progress | DONE | DONE | DONE |
| 10 | radiogroup | DONE | DONE | DONE |
| 11 | select | DONE | DONE | DONE |
| 12 | slider | DONE | DONE | DONE |
| 13 | tabs | DONE | DONE | DONE |
| 14 | toaster | DONE | DONE | DONE |
| 15 | toggle | DONE | DONE | DONE |
| 16 | tooltip | DONE | DONE | DONE |
| 17 | tree | DONE | DONE | DONE |

### ColdLight Adapters (2)

| # | Kind | builder | _transport | Complete |
|---|------|---------|------------|----------|
| 1 | dialog | DONE | DONE | DONE |
| 2 | tabs | DONE | DONE | DONE |

---

## TOTALS

| Category | Count | Done | Remaining |
|----------|-------|------|-----------|
| Melt _internal transport | 17 | 17 | 0 |
| Melt-backed .svelte | 17 | 0 | 17 |
| ColdLight interactive .svelte | 23 | 8 | 15 |
| Layout .svelte | 11 | 11 | 0 |
| Typography .svelte | 5 | 5 | 0 |
| Data Display .svelte | 9 | 9 | 0 |
| Feedback .svelte | 6 | 6 | 0 |
| Form .svelte | 9 | 5 | 4 |
| Navigation .svelte | 7 | 6 | 1 |
| Overlay .svelte | 4 | 1 | 3 |
| Utility Actions | 11 | 11 | 0 |
| Utility Functions | 9 | 9 | 0 |
| Component Layer | 1 | 1 | 0 |
| Recipes | 5 | 5 | 0 |
| Blueprints | 4 | 4 | 0 |
| **TOTAL PRIMITIVES** | **91** | **51** | **40** |

---

## HEADER COMPLIANCE

| Metric | Count |
|--------|-------|
| Total Files | 705 |
| OK | 361 |
| Missing Header | 187 |
| Incomplete Header | 157 |

Run `pnpm headers:fix` to patch missing tags and inject missing headers.

---

## PLATFORM-WIDE NAMESPACES

| Namespace | Files |
|-----------|-------|
| @devpulse/coldlight | 44 (non-primitive) |
| @devpulse/sys | 8 |
| @devpulse/domains/app | 29 |
| @devpulse/domains/chat | 1 |
| @devpulse/domains/common | 1 |
| @devpulse/domains/clyffy | 1 |
| @devpulse/domains/notify | 1 |
| @devpulse/routes | 15 |
| @devpulse/tauri | 14 |
| @devpulse/engine | 14 |
| @devpulse/clyffy | 45 |
| @devpulse/scripts | 26 |

---

## SPRINT CARVING

Sprints are carved FROM this inventory. When a sprint completes, regenerate this file.

### Next Sprint: SPRINT-MELT-SVELTE
**Scope**: All 17 melt-backed .svelte primitives
**Prerequisite**: _internal transport layer (DONE)
**Pattern**: Structureless primitives consuming transport, ColdLight ARIA per contract

### After That: SPRINT-COLDLIGHT-BUILDERS
**Scope**: ColdLight's own builder system for the 15 remaining interactive primitives
**Pattern**: React Aria-inspired, W3C APG-driven, dsAdapter interface

### After That: SPRINT-REMAINING-SVELTE
**Scope**: Remaining form + overlay primitives
**Includes**: ColorPicker, InputGroup, NumberInput, SearchInput, Command, CommandPalette, Sheet
