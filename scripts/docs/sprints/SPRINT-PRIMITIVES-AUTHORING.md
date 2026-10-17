# SPRINT: Primitive Authoring — Full RAC Parity

**Status**: PLANNED
**Depends on**: Behaviors/primitives split (DONE), structural primitives (DONE)
**Goal**: Every primitive has correct HTML element, full slot anatomy, proper props. Zero generic div shells.

## Current State
- 8 properly authored primitives (surface, text, stack, row, dot, icon-slot, heading, separator)
- 33 generic `<div>` shells that need full authoring
- 0 sub-component primitives (AccordionItem, DialogOverlay, TabsList, etc.)

## Authoring Standard

Every primitive MUST have:
1. **Correct HTML element** — not `<div>` unless it's actually a container
2. **All slots from anatomy** — root + every sub-component as separate .svelte file
3. **Proper props interface** — extends correct HTMLElement attributes
4. **data-kind + data-slot** — on every rendered element
5. **cn() for class merging** — accepts class prop
6. **{...rest} spread** — passes through HTML attributes
7. **{@render children?.()} for slots** — Svelte 5 snippet pattern
8. **ZERO behavior** — no ARIA, no keyboard, no hooks. Structural only.
9. **ZERO styling** — no StyleMacro, no inline styles. Class-only via consumer.

## Batch Execution Order

### Batch 1: Dashboard-critical (renders the devpulse page)
Priority: the dashboard and chat need these NOW.

- [ ] **button** → `<button>` + icon slot + label slot
- [ ] **badge** → `<span>` (already fixed element, needs icon + label slots)
- [ ] **tabs** → root `<div>` + TabsList `<div>` + TabsTrigger `<button>` + TabsContent `<div>`
- [ ] **progress** → root `<div>` + track `<div>` + fill `<div>` + label `<span>`
- [ ] **field** → root `<div>` + label `<label>` + control `<div>` + description `<span>` + error `<span>`
- [ ] **text-field** → root `<div>` + input `<input>` + label `<label>`

### Batch 2: Overlay system (modals, popovers, sheets)
- [ ] **dialog** → trigger `<button>` + overlay `<div>` + content `<div>` + title `<h2>` + description `<p>` + close `<button>`
- [ ] **alert-dialog** → trigger + overlay + content + title + description + cancel `<button>` + action `<button>`
- [ ] **popover** → trigger `<button>` + content `<div>` + arrow `<div>` + close `<button>`
- [ ] **sheet** → trigger + overlay + content + title + description + close
- [ ] **tooltip** → trigger `<span>` + content `<div>`
- [ ] **modal** → NEW — overlay `<div>` + content `<div>` (RAC has this, we don't)

### Batch 3: Form system
- [ ] **checkbox** → root `<div>` + indicator `<div>` + label `<label>`
- [ ] **radio-group** → root `<div>` + radio `<div>` + label `<label>` + description `<span>`
- [ ] **switch** → root `<button>` + thumb `<span>` + label `<label>`
- [ ] **slider** → root `<div>` + track `<div>` + thumb `<div>` + label `<label>` + output `<output>`
- [ ] **select** → root `<div>` + trigger `<button>` + value `<span>` + listbox `<div>` + option `<div>` + label `<label>`
- [ ] **combobox** → root `<div>` + input `<input>` + trigger `<button>` + listbox `<div>` + option `<div>` + label `<label>`
- [ ] **number-field** → root `<div>` + input `<input>` + increment `<button>` + decrement `<button>`
- [ ] **search-field** → root `<div>` + input `<input>` + icon `<span>` + clear `<button>`
- [ ] **toggle** → `<button>` (pressed toggle)
- [ ] **tag-group** → root `<div>` + tag `<span>` + label `<label>` + description `<span>` + remove `<button>`

### Batch 4: Navigation + collections
- [ ] **accordion** → root `<div>` + item `<div>` + trigger `<button>` + content `<div>`
- [ ] **breadcrumbs** → root `<nav>` + list `<ol>` + item `<li>` + link `<a>` + separator `<span>`
- [ ] **link** → `<a>` (already fixed but needs proper props)
- [ ] **menu** → root `<div>` + trigger `<button>` + content `<div>` + item `<div>` + separator `<hr>` + group `<div>` + label `<span>`
- [ ] **listbox** → root `<div>` + option `<div>` + group `<div>` + label `<span>`
- [ ] **grid-list** → root `<div>` + item `<div>`
- [ ] **tree** → root `<div>` + item `<div>` + group `<div>`
- [ ] **toolbar** → root `<div>` + item `<div>`

### Batch 5: Data display
- [ ] **table** → `<table>` + header `<thead>` + body `<tbody>` + row `<tr>` + cell `<td>` + column-header `<th>`
- [ ] **meter** → root `<div>` + track `<div>` + fill `<div>` + label `<span>`
- [ ] **label** → `<label>` (already fixed element, verify props)
- [ ] **color-field** → root + input + label + swatch
- [ ] **color-slider** → root + track + thumb + label

### Batch 6: Missing RAC primitives (new)
- [ ] **checkbox-group** → NEW: root `<div>` + label `<label>` + description `<span>`
- [ ] **toggle-button** → NEW: `<button>` (pressed toggle, separate from toggle)
- [ ] **toggle-button-group** → NEW: root `<div>`
- [ ] **disclosure** → NEW: root `<div>` + trigger `<button>` + content `<div>`
- [ ] **disclosure-group** → NEW: root `<div>` (accordion pattern)
- [ ] **drop-zone** → NEW: root `<div>`
- [ ] **file-trigger** → NEW: `<input type="file">` wrapper
- [ ] **group** → NEW: `<div role="group">`
- [ ] **input** → NEW: `<input>` base primitive
- [ ] **overlay-arrow** → NEW: `<div>` positioned arrow
- [ ] **progress-bar** → NEW: root `<div>` + track + fill + label
- [ ] **time-field** → NEW: root + segments

## Behavior Audit (run alongside)

For each primitive batch, verify the corresponding behavior hook:
- Exports correct return type
- Uses Svelte 5 runes ($state, $derived, $effect)
- Returns proper ARIA attributes
- Keyboard handling matches WAI-ARIA APG
- References _shared utilities correctly

## Gate per Batch

After each batch:
- [ ] `pnpm svelte-check` — 0 errors
- [ ] Every primitive has correct HTML element
- [ ] Every sub-component primitive renders its slot
- [ ] No behavior code in any primitive
- [ ] No StyleMacro in any primitive
