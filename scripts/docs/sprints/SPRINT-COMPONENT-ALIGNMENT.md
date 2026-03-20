# SPRINT: Component Alignment

**Created**: 2026-03-20
**Status**: DRAFT — OWNER APPROVAL REQUIRED
**Purpose**: Wire all 67 components to consume primitives correctly. Drop dead dsadapter imports. Style via useColdLight provider pattern. Create 8 missing components that have primitives but no component.

---

## The Pattern (Established by Button)

Every component follows ONE pattern:

```svelte
<script lang="ts">
  // 1. Hook from primitive (behavioral components only)
  import { use{Kind} } from '$lib/design/primitives/{kind}/index.js';
  // 2. Visual resolution
  import { useColdLight } from '$lib/design/components/_base/use-coldlight.svelte.js';
  // 3. Class merge
  import { cn } from '$lib/design/utils/cn.js';
  // 4. Types
  import type { {Kind}Props } from './{kind}.types.js';

  let { ...props }: {Kind}Props = $props();
  const hook = $derived(use{Kind}({...}));          // ARIA + keyboard
  const visual = useColdLight(() => ({...}));        // token resolution
  const classes = $derived(cn(SIZE[size], visual.segments, visual.radius, className));
</script>

<element {...hook.root} {...rest} class={classes}>
  {@render children?.()}
</element>
```

Presentational components skip the hook import — just useColdLight + native HTML.

---

## Phase 1: Behavioral Components (35)

These have a matching primitive. Replace dead dsadapter import with primitive hook.

### Group 1A: Already using primitives (VERIFY ONLY — 8)
These already import from primitives/. Just verify they're correct.
- [ ] alert-dialog → primitives/alert-dialog
- [ ] avatar → primitives/avatar (verify — avatar is presentational, may not need hook)
- [ ] button → primitives/button ✅ DONE
- [ ] calendar → primitives/calendar (verify — no calendar primitive exists)
- [ ] heading → primitives/heading (verify — heading is presentational)
- [ ] menubar → primitives/menubar (verify — no menubar primitive, uses menu)
- [ ] navigation-menu → primitives/navigation-menu (verify — no nav-menu primitive)
- [ ] progress → primitives/progress

### Group 1B: Dead dsadapter/coldlight → primitives (35)
Replace `api/dsadapters/coldlight/_internal/{kind}` with `primitives/{kind}`.

**Has matching primitive — direct swap:**
- [ ] checkbox → primitives/checkbox
- [ ] collapsible → primitives/toggle (or accordion)
- [ ] label → primitives/label
- [ ] radio-group → primitives/radio-group
- [ ] separator → primitives/separator
- [ ] sheet → primitives/sheet
- [ ] skip-link → primitives/link
- [ ] slider → primitives/slider
- [ ] switch → primitives/switch
- [ ] table → primitives/table
- [ ] tabs → primitives/tabs
- [ ] toggle → primitives/toggle
- [ ] toggle-group → primitives/toggle + primitives/radio-group
- [ ] toolbar → primitives/toolbar
- [ ] tooltip → primitives/tooltip
- [ ] tree → primitives/tree

**No matching primitive — presentational (drop hook, just useColdLight):**
- [ ] alert (role="alert" is static, no hook needed)
- [ ] badge (presentational)
- [ ] banner (presentational)
- [ ] callout (presentational)
- [ ] card (presentational)
- [ ] code (presentational)
- [ ] description-list (presentational)
- [ ] empty-state (presentational)
- [ ] inline-message (presentational)
- [ ] kbd (presentational)
- [ ] list (presentational)
- [ ] loading-overlay (presentational)
- [ ] nav (presentational — semantic landmark)
- [ ] prose (presentational)
- [ ] skeleton (presentational)
- [ ] spinner (presentational)
- [ ] stat (presentational)
- [ ] steps (presentational — or compose tabs)
- [ ] table-of-contents (presentational)
- [ ] text (presentational)

### Group 1C: Dead dsadapter/meltui → primitives (4)
These used MeltUI adapters. We own the ARIA now via primitives.
- [ ] accordion → primitives/accordion
- [ ] combobox → primitives/combobox
- [ ] popover → primitives/popover
- [ ] select → primitives/select

### Group 1D: Special cases (5)
- [ ] dialog → primitives/dialog (was dsadapter/coldlight, has ColdLightDialog wrapper)
- [ ] textarea → primitives/text-field (extends text-field behavior for multiline)
- [ ] scroll-area → no primitive (needs one or stays presentational)
- [ ] file-upload → primitives/button (trigger only)
- [ ] pagination → primitives/button + primitives/link

---

## Phase 2: Missing Components (8)

Primitives exist but no component consumes them yet. Create component following the Button pattern.

- [ ] text-field → components/text-field/ (primitives/text-field hook)
- [ ] search-field → components/search-field/ (primitives/search-field hook)
- [ ] number-field → components/number-field/ (primitives/number-field hook)
- [ ] color-field → components/color-field/ (primitives/color-field hook)
- [ ] tag-group → components/tag-group/ (primitives/tag-group hook)
- [ ] breadcrumbs → components/breadcrumbs/ (primitives/breadcrumbs hook)
- [ ] menu → components/menu/ (primitives/menu hook — dropdown + context are trigger variants)
- [ ] link → components/link/ (primitives/link hook)

---

## Phase 3: Composite Components (13)

These compose multiple primitives. Wire after Phase 1+2 are done.

- [ ] data-table → table + checkbox + select
- [ ] date-field → field + number-field
- [ ] date-picker → field + popover + calendar
- [ ] date-range-field → field + number-field
- [ ] date-range-picker → field + popover + calendar
- [ ] form → field + label
- [ ] form-field → field + label + text-field
- [ ] input-group → text-field + button
- [ ] link-preview → link + popover
- [ ] notification-center → popover + button + listbox
- [ ] pin-input → text-field + focus
- [ ] sidebar → sheet + button + toggle
- [ ] toaster → svelte-sonner (provider-controlled)

---

## Phase 4: Cleanup

- [ ] Delete `api/` folder entirely (only has `actions/` left)
- [ ] Delete `_internal/` hook files that duplicated primitives (if any remain)
- [ ] Delete stale `style/` folder (old SD5 output)
- [ ] Delete stale `css/primitives/` files (not imported by anything)
- [ ] Update components/index.ts barrel — remove deleted components, add new ones
- [ ] Update primitives/index.ts barrel — verify complete
- [ ] svelte-check — target zero NEW errors
- [ ] Update CLAUDE.md docs to match reality

---

## Execution Order

Phase 1B presentational (20 components) → fastest, just drop dead imports
Phase 1B behavioral with matching primitive (16 components) → swap imports
Phase 1C meltui → primitives (4 components) → swap + verify ARIA
Phase 1D special cases (5) → case-by-case
Phase 2 missing components (8) → author new
Phase 3 composites (13) → wire after deps ready
Phase 4 cleanup → final pass

---

## Definition of Done

- [ ] Zero imports from `api/dsadapters/` anywhere in codebase
- [ ] Zero imports from `api/dsadapters/meltui/` anywhere
- [ ] Every behavioral component imports its hook from `primitives/{kind}/`
- [ ] Every component uses `useColdLight()` for visual resolution
- [ ] Every component uses `$props()` (Svelte 5 runes)
- [ ] All 8 missing components created
- [ ] All composite components wire to correct primitives
- [ ] `api/` folder deleted
- [ ] svelte-check passes (no new errors)
