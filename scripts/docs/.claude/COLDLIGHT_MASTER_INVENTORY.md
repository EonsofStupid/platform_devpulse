# ColdLight Master Inventory v2 — SSOT

> **Status**: ACTIVE — this file drives ALL sprint planning
> **Verified against**: melt@0.44.0 — source: next.melt-ui.com (2026-02-22)
> **Package**: `npm i melt@0.44.0`
> **Svelte 5**: runes-native. Zero stores. Class-based builders.
> **Last updated**: 2026-02-24

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
| WIP | In progress |
| READY | Prerequisites met, ready to build |
| BLOCKED | Waiting on dependency |
| PLANNED | Scheduled but not started |

---

## 1. MELT-BACKED PRIMITIVES (17 stable via dsAdapter)

MeltUI is NEVER exposed publicly. ColdLight wraps via dsAdapter + mergeAttrs().

### 1a. _internal Transport Layer (factory + _transport)

| # | Primitive | Builder | _internal Status | Commit |
|---|-----------|---------|-----------------|--------|
| 1 | Accordion | `new Accordion()` | DONE | e57a23e |
| 2 | Avatar | `new Avatar()` | DONE | e57a23e |
| 3 | Collapsible | `new Collapsible()` | DONE | e57a23e |
| 4 | Combobox | `new Combobox()` | DONE | e57a23e |
| 5 | Dialog | `new Dialog()` | DONE | e57a23e |
| 6 | File Upload | `new FileUpload()` | DONE | e57a23e |
| 7 | PIN Input | `new PinInput()` | DONE | e57a23e |
| 8 | Popover | `new Popover()` | DONE | e57a23e |
| 9 | Progress | `new Progress()` | DONE | e57a23e |
| 10 | Radio Group | `new RadioGroup()` | DONE | e57a23e |
| 11 | Select | `new Select()` | DONE | e57a23e |
| 12 | Slider | `new Slider()` | DONE | e57a23e |
| 13 | Tabs | `new Tabs()` | DONE | e57a23e |
| 14 | Toaster | `new Toaster()` | DONE | e57a23e |
| 15 | Toggle | `new Toggle()` | DONE | e57a23e |
| 16 | Tooltip | `new Tooltip()` | DONE | e57a23e |
| 17 | Tree | `new Tree()` | DONE | e57a23e |

**_internal transport: 17/17 DONE**

### 1b. Primitive .svelte (structureless, transport-consuming)

| # | Primitive | Slots | .svelte Status | types.ts | contract.ts |
|---|-----------|-------|---------------|----------|-------------|
| 1 | Accordion | root, item, trigger, content | READY | DONE | DONE |
| 2 | Avatar | root, image, fallback | READY | DONE | DONE |
| 3 | Collapsible | trigger, content | READY | DONE | DONE |
| 4 | Combobox | input, trigger, content, getOption | READY | DONE | DONE |
| 5 | Dialog | trigger, overlay, content, title, description, close | READY | DONE | DONE |
| 6 | File Upload | root, trigger, hiddenInput | READY | DONE | DONE |
| 7 | PIN Input | root, inputs[] | READY | DONE | DONE |
| 8 | Popover | trigger, content, arrow | READY | DONE | DONE |
| 9 | Progress | root, progress | READY | DONE | DONE |
| 10 | Radio Group | root, getItem | READY | DONE | DONE |
| 11 | Select | trigger, content, getOption, label | READY | DONE | DONE |
| 12 | Slider | root, thumb, range | READY | DONE | DONE |
| 13 | Tabs | triggerList, getTrigger, getContent | READY | DONE | DONE |
| 14 | Toaster | root, per-toast: content, title, description, close | READY | DONE | DONE |
| 15 | Toggle | trigger | READY | DONE | DONE |
| 16 | Tooltip | trigger, content, arrow | READY | DONE | DONE |
| 17 | Tree | root, children[].attrs | READY | DONE | DONE |

**Melt-backed .svelte: 0/17 DONE — READY for next sprint**

---

## 2. COLDLIGHT-OWNED PRIMITIVES — Interactive (22)

No adapter. ColdLight owns W3C APG, ARIA, keyboard, everything.
ColdLight will build its own builders for these (React Aria pattern).

| # | Primitive | APG Pattern | Complexity | Priority | Builder Status | .svelte Status | types.ts | contract.ts |
|---|-----------|------------|-----------|---------|---------------|---------------|----------|-------------|
| 1 | Button | button | LOW | P0 | N/A (native) | DONE | DONE | DONE |
| 2 | Checkbox | checkbox | LOW | P0 | PLANNED | DONE | DONE | DONE |
| 3 | Switch | switch | LOW | P0 | PLANNED | DONE | DONE | DONE |
| 4 | Label | native label | LOW | P0 | N/A (native) | DONE | DONE | DONE |
| 5 | Separator | separator | LOW | P1 | N/A (native) | DONE | DONE | DONE |
| 6 | Alert Dialog | alertdialog | MED | P1 | PLANNED | PLANNED | DONE | DONE |
| 7 | Dropdown Menu | menu | MED | P1 | PLANNED | PLANNED | DONE | DONE |
| 8 | Context Menu | menu | MED | P1 | PLANNED | PLANNED | DONE | DONE |
| 9 | Menubar | menubar | MED | P2 | PLANNED | PLANNED | DONE | DONE |
| 10 | Toggle Group | group | MED | P1 | PLANNED | PLANNED | DONE | DONE |
| 11 | Toolbar | toolbar | MED | P2 | PLANNED | PLANNED | DONE | DONE |
| 12 | Tags Input | listbox + textbox | MED | P2 | PLANNED | PLANNED | DONE | DONE |
| 13 | Link Preview | tooltip variant | MED | P2 | PLANNED | PLANNED | DONE | DONE |
| 14 | Scroll Area | custom | MED | P2 | N/A (CSS) | DONE | DONE | DONE |
| 15 | Pagination | navigation | MED | P2 | PLANNED | PLANNED | DONE | DONE |
| 16 | Table of Contents | navigation | MED | P3 | N/A (native) | DONE | DONE | DONE |
| 17 | Calendar | grid / date | HIGH | P3 | PLANNED | PLANNED | DONE | DONE |
| 18 | Date Field | spinbutton | HIGH | P3 | PLANNED | PLANNED | DONE | DONE |
| 19 | Date Picker | dialog + calendar | HIGH | P3 | PLANNED | PLANNED | DONE | DONE |
| 20 | Date Range Field | spinbutton × 2 | HIGH | P3 | PLANNED | PLANNED | DONE | DONE |
| 21 | Date Range Picker | dialog + range cal | HIGH | P3 | PLANNED | PLANNED | DONE | DONE |
| 22 | Range Calendar | grid / date range | HIGH | P3 | PLANNED | PLANNED | DONE | DONE |

**ColdLight interactive .svelte: 8/22 DONE (native/simple ones)**

---

## 3. COLDLIGHT-OWNED PRIMITIVES — Layout (11)

Structural primitives. No ARIA complexity. Token-driven spacing/sizing.

| # | Primitive | Purpose | Priority | .svelte Status | types.ts | contract.ts |
|---|-----------|---------|---------|---------------|----------|-------------|
| 1 | Box | Base layout, polymorphic `as` prop | P0 | DONE | DONE | DONE |
| 2 | Flex | Flexbox container, gap/align/justify tokens | P0 | DONE | DONE | DONE |
| 3 | Stack | Vertical flex shorthand (gap tokenized) | P0 | DONE | DONE | DONE |
| 4 | HStack | Horizontal flex shorthand | P0 | DONE | DONE | DONE |
| 5 | Grid | CSS Grid container, columns/rows/gap tokens | P0 | DONE | DONE | DONE |
| 6 | Container | Max-width wrapper, responsive breakpoints | P0 | DONE | DONE | DONE |
| 7 | Center | Flex centering shorthand | P1 | DONE | DONE | DONE |
| 8 | Spacer | Flex spacer (grows to fill) | P1 | DONE | DONE | DONE |
| 9 | Divider | Visual divider (h/v), tokenized | P1 | DONE | DONE | DONE |
| 10 | Aspect Ratio | Aspect ratio box (16:9, 4:3, 1:1, custom) | P1 | DONE | DONE | DONE |
| 11 | Sticky | Sticky position wrapper with offset tokens | P2 | DONE | DONE | DONE |

**Layout .svelte: 11/11 DONE**

---

## 4. COLDLIGHT-OWNED PRIMITIVES — Typography (5)

Text rendering primitives. Token-driven scale/weight/leading.

| # | Primitive | Purpose | Priority | .svelte Status | types.ts | contract.ts |
|---|-----------|---------|---------|---------------|----------|-------------|
| 1 | Text | Base text, polymorphic, scale tokens | P0 | DONE | DONE | DONE |
| 2 | Heading | h1-h6, semantic + visual scale decoupled | P0 | DONE | DONE | DONE |
| 3 | Code | Inline code, tokenized font/bg | P1 | DONE | DONE | DONE |
| 4 | Kbd | Keyboard shortcut display | P2 | DONE | DONE | DONE |
| 5 | Prose | Long-form content container | P2 | DONE | DONE | DONE |

**Typography .svelte: 5/5 DONE**

---

## 5. COLDLIGHT-OWNED PRIMITIVES — Data Display (9)

| # | Primitive | Purpose | Priority | .svelte Status | types.ts | contract.ts |
|---|-----------|---------|---------|---------------|----------|-------------|
| 1 | Badge | Status/label indicator, variant-driven | P0 | DONE | DONE | DONE |
| 2 | Card | Content container, header/body/footer slots | P0 | DONE | DONE | DONE |
| 3 | Table | Data table — thead/tbody/tfoot/tr/th/td | P1 | DONE | DONE | DONE |
| 4 | Data Table | Table + sort/filter/pagination (composed) | P2 | DONE | DONE | DONE |
| 5 | Skeleton | Loading placeholder, pulse/wave tokens | P1 | DONE | DONE | DONE |
| 6 | Empty State | No-data placeholder, icon/message/action | P2 | DONE | DONE | DONE |
| 7 | List | Semantic list (ul/ol) tokenized spacing | P1 | DONE | DONE | DONE |
| 8 | Description List | dl/dt/dd for key-value display | P2 | DONE | DONE | DONE |
| 9 | Stat | Metric display (label, value, delta, icon) | P1 | DONE | DONE | DONE |

**Data Display .svelte: 9/9 DONE**

---

## 6. COLDLIGHT-OWNED PRIMITIVES — Feedback (6)

| # | Primitive | Purpose | Priority | .svelte Status | types.ts | contract.ts |
|---|-----------|---------|---------|---------------|----------|-------------|
| 1 | Alert | Static alert banner (info/warn/error/success) | P0 | DONE | DONE | DONE |
| 2 | Spinner | Loading spinner, size/color tokens | P0 | DONE | DONE | DONE |
| 3 | Banner | Full-width notification bar, dismissible | P1 | DONE | DONE | DONE |
| 4 | Callout | Highlighted content block, icon + border | P1 | DONE | DONE | DONE |
| 5 | Inline Message | Inline validation/help text for forms | P0 | DONE | DONE | DONE |
| 6 | Loading Overlay | Full-area overlay with spinner + message | P2 | DONE | DONE | DONE |

**Feedback .svelte: 6/6 DONE**

---

## 7. COLDLIGHT-OWNED PRIMITIVES — Form (8)

| # | Primitive | Purpose | Priority | .svelte Status | types.ts | contract.ts |
|---|-----------|---------|---------|---------------|----------|-------------|
| 1 | Input | Text input, size/variant tokens | P0 | DONE | DONE | DONE |
| 2 | Textarea | Multi-line input, auto-resize option | P0 | DONE | DONE | DONE |
| 3 | Form Field | Wrapper: label + input + desc + error | P0 | DONE | DONE | DONE |
| 4 | Form | Form element with submit handling | P0 | DONE | DONE | DONE |
| 5 | Input Group | Input with prefix/suffix addons | P1 | PLANNED | DONE | DONE |
| 6 | Number Input | Stepper input, increment/decrement | P1 | PLANNED | DONE | DONE |
| 7 | Search Input | Input with search icon + clear | P1 | PLANNED | DONE | DONE |
| 8 | Color Input | Color picker input | P3 | DONE | DONE | DONE |

**Form .svelte: 5/8 DONE**

---

## 8. COLDLIGHT-OWNED PRIMITIVES — Navigation (6)

| # | Primitive | Purpose | Priority | .svelte Status | types.ts | contract.ts |
|---|-----------|---------|---------|---------------|----------|-------------|
| 1 | Breadcrumb | Path breadcrumbs, separator token | P1 | DONE | DONE | DONE |
| 2 | Nav | Semantic nav wrapper, aria-label | P1 | DONE | DONE | DONE |
| 3 | Nav Item | Nav link/button, active state | P1 | DONE | DONE | DONE |
| 4 | Sidebar | Collapsible side navigation panel | P2 | DONE | DONE | DONE |
| 5 | Steps | Step indicator (horizontal/vertical) | P2 | DONE | DONE | DONE |
| 6 | Skip Link | Accessibility skip-to-content | P0 | DONE | DONE | DONE |

**Navigation .svelte: 6/6 DONE**

---

## 9. COLDLIGHT-OWNED PRIMITIVES — Overlay (3)

| # | Primitive | Purpose | Priority | .svelte Status | types.ts | contract.ts |
|---|-----------|---------|---------|---------------|----------|-------------|
| 1 | Sheet / Drawer | Slide-in panel (top/right/bottom/left) | P1 | PLANNED | DONE | DONE |
| 2 | Command Palette | Cmd+K search overlay (composed) | P2 | PLANNED | DONE | DONE |
| 3 | Notification Center | Stacked notification panel | P3 | DONE | DONE | DONE |

**Overlay .svelte: 1/3 DONE**

---

## 10. COLDLIGHT UTILITY ACTIONS (10)

Reusable behavior. Svelte `use:action` pattern, runes-native.

| # | Action | Purpose | Priority | Status | Commit |
|---|--------|---------|---------|--------|--------|
| 1 | useClickOutside | Detect clicks outside element | P0 | DONE | 6503781 |
| 2 | useEscapeKey | Close on Escape keydown | P0 | DONE | 6503781 |
| 3 | useFocusTrap | Trap focus within container | P0 | DONE | 6503781 |
| 4 | usePortal | Render element to document.body | P0 | DONE | 6503781 |
| 5 | useVisuallyHidden | Screen-reader-only content | P0 | DONE | 6503781 |
| 6 | useFocusReturn | Return focus to trigger on close | P0 | DONE | 6503781 |
| 7 | useKeyboard | Keyboard shortcut handler | P1 | DONE | 6503781 |
| 8 | useMediaQuery | Reactive media query state | P1 | DONE | 6503781 |
| 9 | useIntersection | Intersection observer hook | P2 | DONE | 6503781 |
| 10 | useResizeObserver | Reactive element dimensions | P2 | DONE | 6503781 |

**Utility Actions: 10/10 DONE**

---

## 11. COLDLIGHT UTILITY FUNCTIONS (8)

Pure functions. No DOM, no Svelte dependency.

| # | Utility | Purpose | Priority | Status | Commit |
|---|---------|---------|---------|--------|--------|
| 1 | cn | Conditional class merging (Tailwind-safe) | P0 | DONE | 6503781 |
| 2 | vrecipeParse | Parse vrecipe string → dimension object | P0 | DONE | 6503781 |
| 3 | vrecipeBuild | Build vrecipe string from dimensions | P0 | DONE | 6503781 |
| 4 | vrecipeValidate | Validate vrecipe against schema | P0 | DONE | 6503781 |
| 5 | tokenResolve | Resolve token path → CSS variable | P0 | DONE | 6503781 |
| 6 | slotMerge | Merge slot props (class + data-attrs) | P0 | DONE | 6503781 |
| 7 | idGen | Deterministic unique ID generation | P0 | DONE | 6503781 |
| 8 | ariaAnnounce | Live region announcement helper | P1 | DONE | 6503781 |

**Utility Functions: 8/8 DONE**

---

## 12. COLDLIGHT BUILD UTILITIES (6)

Build-time only. Not shipped to browser.

| # | Utility | Purpose | Priority | Status |
|---|---------|---------|---------|--------|
| 1 | registryCompile | Schema → .generated/ typed registry | P0 | PLANNED |
| 2 | vrecipeGenerate | Generate all valid vrecipe combos at build | P0 | PLANNED |
| 3 | manifestEmit | Emit component manifest for VPB | P0 | PLANNED |
| 4 | tokenCompile | DTCG schemas → SD5 → CSS variables | P0 | DONE (SD5 pipeline) |
| 5 | treeShake | Per-project: prune unused components/tokens | P1 | PLANNED |
| 6 | validateDual | Dual-pass: save-time + CI validation | P0 | PLANNED |

**Build Utilities: 1/6 DONE**

---

## 13. MELT UTILITIES CONSUMED BY COLDLIGHT (3 + 3 types)

| Export | Import From | Purpose | Status |
|--------|-------------|---------|--------|
| `mergeAttrs()` | `melt` | Merge spread attrs without event override | AVAILABLE |
| `ComponentProps<T>` | `melt` | Utility type for component prop wrapping | AVAILABLE |
| `getters()` | `melt` | Wrap plain props as getter functions | AVAILABLE |
| `MaybeGetter<T>` | type | `T \| (() => T)` | AVAILABLE |
| `MaybeMultiple<T, M>` | type | Single or iterable based on multiple flag | AVAILABLE |
| `IterableProp<T>` | type | `SvelteSet<T> \| MaybeGetter<Iterable<T>>` | AVAILABLE |

---

## FOUNDATION STATUS (completed before primitives)

| Item | Status | Commit |
|------|--------|--------|
| SD5 Pipeline (3 platforms: css, theme, types) | DONE | cad097e |
| Config type system aligned to SD5 | DONE | a46018e |
| TW v3 dead code deleted | DONE | a46018e |
| Zero compilation errors | DONE | a46018e |
| Tier 3 component tokens (30 groups) | DONE | b07e7c6 |

---

## TOTALS

| Category | Count | Done | Remaining |
|----------|-------|------|-----------|
| Melt _internal transport | 17 | 17 | 0 |
| Melt-backed .svelte | 17 | 0 | 17 |
| ColdLight interactive .svelte | 22 | 8 | 14 |
| Layout .svelte | 11 | 11 | 0 |
| Typography .svelte | 5 | 5 | 0 |
| Data Display .svelte | 9 | 9 | 0 |
| Feedback .svelte | 6 | 6 | 0 |
| Form .svelte | 8 | 5 | 3 |
| Navigation .svelte | 6 | 6 | 0 |
| Overlay .svelte | 3 | 1 | 2 |
| Utility Actions | 10 | 10 | 0 |
| Utility Functions | 8 | 8 | 0 |
| Build Utilities | 6 | 1 | 5 |
| **TOTAL** | **128** | **87** | **41** |

**Remaining work:**
- 17 melt-backed .svelte primitives (need dsAdapter pattern)
- 14 ColdLight interactive builders + .svelte (need ColdLight builder pattern)
- 3 form .svelte (input-group, number-input, search-input)
- 2 overlay .svelte (sheet, command-palette)
- 5 build utilities

---

## SPRINT CARVING

Sprints are carved FROM this inventory. When a sprint completes, this file gets updated with DONE status and commit hash.

### Next Sprint: SPRINT-MELT-SVELTE
**Scope**: All 17 melt-backed .svelte primitives
**Prerequisite**: _internal transport layer (DONE)
**Pattern**: Structureless primitives consuming transport, ColdLight ARIA per contract

### After That: SPRINT-COLDLIGHT-BUILDERS
**Scope**: ColdLight's own builder system for the 14 interactive primitives
**Pattern**: React Aria-inspired, W3C APG-driven, dsAdapter interface
**Includes**: Alert Dialog, Dropdown Menu, Context Menu, Menubar, Toggle Group, Toolbar, Tags Input, Link Preview, Pagination, Calendar, Date Field, Date Picker, Date Range Field/Picker, Range Calendar

### After That: SPRINT-REMAINING-SVELTE
**Scope**: 3 form + 2 overlay primitives
**Includes**: Input Group, Number Input, Search Input, Sheet, Command Palette

### After That: SPRINT-BUILD-UTILS
**Scope**: 5 remaining build utilities
**Includes**: registryCompile, vrecipeGenerate, manifestEmit, treeShake, validateDual

### After That: SPRINT-TW4-EFFECTS
**Scope**: SD5 pipeline tokenizes ALL Tailwind v4 effects
**Includes**: Shadows, animations, transitions, gradients, filters, transforms, backdrop filters — all composable through ColdLight props
