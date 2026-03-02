# SPRINT: dsAdapter Alignment — Fix Layer Violations

> **Status**: READY FOR APPROVAL
> **Date**: 2026-03-02
> **Research**: `SPRINT-DSADAPTER-ALIGNMENT.research.md`
> **Depends On**: Existing builders (55, correct), existing primitives (87, correct)
> **Blocks**: UI layer, VPB integration, correct component API

---

## Problem Statement

The component layer (`components/{kind}/`) has been contaminated with visual concerns (useColdLight, ColdLightProps, recipes, data-encoding) that violate the locked four-layer architecture. Visual styling belongs in a `ui/` layer that does not exist yet.

**Locked decision (2026-02-21):**
```
primitives/  → Zero ARIA, zero style
components/  → ARIA + state, ZERO visual
ui/          → Styled (component + recipe)
```

**Current state:**
- components/ has both ARIA AND visual — WRONG
- ui/ does not exist — MISSING

---

## Prerequisites

- [x] 87 primitives exist with correct data-kind/data-slot
- [x] 55 ColdLight builders exist with correct ARIA/state/keyboard
- [x] resolveVisual() pipeline works
- [x] useColdLight() rune works
- [x] Recipe system exists
- [ ] MeltUI installed (`pnpm install` in interfaces/desktop)

---

## Phase 0: Verify Foundation

### Task 0.1: Ensure dependencies installed
```bash
cd interfaces/desktop && pnpm install
```

### Task 0.2: Verify builders compile
```bash
cd interfaces/desktop && pnpm svelte-check
```

### Task 0.3: Verify existing tests pass
```bash
cd interfaces/desktop && npx vitest run
```

---

## Phase 1: Create ui/ Layer Structure

### Task 1.1: Create ui/ directory
```
ui/{kind}/
├── {Name}.svelte    ← Wraps component, applies recipe + ColdLight visual
├── types.ts         ← Extends component props + ColdLightProps
└── index.ts         ← Barrel export (PUBLIC API — users import from here)
```

### Task 1.2: Build gold reference — ui/button/
- `ui/button/Button.svelte` — imports component Button, applies buttonRecipe + useColdLight
- `ui/button/types.ts` — extends ButtonComponentProps + ColdLightProps
- `ui/button/index.ts` — barrel export

Pattern:
```svelte
<script lang="ts">
  import type { ButtonUIProps } from "./types.js";
  import Button from "$lib/design/components/button/Button.svelte";
  import { useColdLight } from "$lib/design/components/_base/use-coldlight.svelte.js";
  import { buttonRecipe } from "$lib/design/recipes/components/button/recipe.js";
  import { cn } from "$lib/design/primitives/types.js";

  let {
    // Component props (forwarded)
    intent, size, pressed, onPressedChange, loading, disabled, expanded, children,
    class: className,
    // ColdLight 8-axis props (visual — UI layer only)
    preset, surface, material, depth, bevel, glow, frame, motion, transition,
    encoding, radius,
    ...rest
  }: ButtonUIProps = $props();

  const visual = useColdLight(() => ({
    preset, surface, material, depth, bevel, glow, frame, motion, transition,
    encoding, radius, size,
  }));

  const classes = $derived(cn(buttonRecipe(size), visual.segments, visual.radius, className));
</script>

<Button {intent} {size} {pressed} {onPressedChange} {loading} {disabled} {expanded} {...rest} class={classes}>
  {@render children?.()}
</Button>
```

### Task 1.3: Verify ui/button/ compiles and renders

---

## Phase 2: Strip Visual from components/

### Task 2.1: For each component, remove:
- `import { useColdLight }`
- `import { ColdLightProps }` from types
- ColdLight 8-axis destructuring (preset, surface, material, depth, bevel, glow, frame, motion, transition, encoding, radius)
- `const visual = useColdLight(...)` call
- `visual.segments`, `visual.radius`, `visual.encoding` from class composition
- `data-encoding` attribute from template
- Recipe import and usage (recipe moves to ui/ layer)

### Task 2.2: Component .svelte should ONLY have:
- Kind-specific props (intent, size, pressed, disabled, etc.)
- Builder creation: `const builder = createXxx({...})`
- `class` passthrough (from ui/ layer via prop)
- Template: `<PrimitiveRoot {...builder.root} {...rest} class={className}>`

### Task 2.3: Component types.ts should ONLY extend:
- HTML element attributes
- BaseProps
- Kind-specific props (intent, size, pressed, etc.)
- NOT ColdLightProps (that's ui/ layer)

---

## Phase 3: Build Remaining ui/ Kinds

Build ui/ wrapper for every existing component. Same pattern as ui/button/:
- Import component
- Apply useColdLight() for visual
- Apply recipe for structural classes
- Compose with cn()
- Forward all props

### Batch 3A: Core interactive (7)
- [ ] ui/button/
- [ ] ui/checkbox/
- [ ] ui/switch/
- [ ] ui/input/
- [ ] ui/textarea/
- [ ] ui/label/
- [ ] ui/badge/

### Batch 3B: Feedback + display (8)
- [ ] ui/alert/
- [ ] ui/spinner/
- [ ] ui/skeleton/
- [ ] ui/card/
- [ ] ui/code/
- [ ] ui/kbd/
- [ ] ui/inline-message/
- [ ] ui/empty-state/

### Batch 3C: Layout (10)
- [ ] ui/box/
- [ ] ui/flex/
- [ ] ui/stack/
- [ ] ui/hstack/
- [ ] ui/grid/
- [ ] ui/container/
- [ ] ui/center/
- [ ] ui/spacer/
- [ ] ui/sticky/
- [ ] ui/aspect-ratio/

### Batch 3D: Navigation + content (8)
- [ ] ui/nav/
- [ ] ui/nav-item/
- [ ] ui/breadcrumb/
- [ ] ui/sidebar/
- [ ] ui/steps/
- [ ] ui/skip-link/
- [ ] ui/table-of-contents/
- [ ] ui/scroll-area/

### Batch 3E: Data display (6)
- [ ] ui/table/
- [ ] ui/data-table/
- [ ] ui/list/
- [ ] ui/description-list/
- [ ] ui/stat/
- [ ] ui/prose/

### Batch 3F: Form (7)
- [ ] ui/form/
- [ ] ui/form-field/
- [ ] ui/number-input/
- [ ] ui/search-input/
- [ ] ui/color-input/
- [ ] ui/input-group/
- [ ] ui/toggle-group/

### Batch 3G: Overlay + compound (remaining)
- [ ] ui/dialog/
- [ ] ui/sheet/
- [ ] ui/tooltip/
- [ ] ui/popover/
- [ ] ui/select/
- [ ] ui/combobox/
- [ ] ui/tabs/
- [ ] ui/accordion/
- [ ] ui/collapsible/
- [ ] ui/dropdown-menu/
- [ ] ui/context-menu/
- [ ] ui/alert-dialog/
- [ ] ui/menubar/
- [ ] ui/navigation-menu/
- [ ] ui/link-preview/
- [ ] ui/radio-group/
- [ ] ui/slider/
- [ ] ui/toggle/
- [ ] ui/calendar/
- [ ] ui/range-calendar/
- [ ] ui/date-field/
- [ ] ui/date-picker/
- [ ] ui/date-range-field/
- [ ] ui/date-range-picker/

### Batch 3H: Utility (remaining)
- [ ] ui/divider/
- [ ] ui/separator/
- [ ] ui/banner/
- [ ] ui/callout/
- [ ] ui/toolbar/
- [ ] ui/heading/
- [ ] ui/text/
- [ ] ui/loading-overlay/
- [ ] ui/notification-center/
- [ ] ui/pagination/
- [ ] ui/toaster/
- [ ] ui/file-upload/
- [ ] ui/pin-input/
- [ ] ui/tags-input/

---

## Phase 4: Update Imports Across App

### Task 4.1: Find all imports from components/
All app code that imports from `$lib/design/components/{kind}/` must be updated to import from `$lib/design/ui/{kind}/` instead.

### Task 4.2: Update barrel exports
Create `ui/index.ts` barrel that re-exports all UI components.

---

## Phase 5: Verification

### Task 5.1: svelte-check
```bash
cd interfaces/desktop && pnpm svelte-check
```
Expected: 0 errors

### Task 5.2: Component layer audit
Verify NO component .svelte file contains:
- `useColdLight`
- `ColdLightProps`
- `data-encoding`
- recipe imports

### Task 5.3: UI layer audit
Verify every ui/ wrapper:
- Imports from components/ (not primitives/)
- Applies useColdLight() for visual
- Applies recipe for structural classes
- Forwards all props

---

## Execution Strategy

### Wave 1: Gold Reference
- Phase 0 (verify foundation)
- Phase 1 (create ui/button/ as template)

### Wave 2: Strip + Build (Parallel)
- Agent A: Phase 2 (strip visual from components/)
- Agent B: Phase 3 Batch 3A-3C (build ui/ wrappers)
- Agent C: Phase 3 Batch 3D-3F
- Agent D: Phase 3 Batch 3G-3H

### Wave 3: Wire Up
- Phase 4 (update imports)
- Phase 5 (verification)

---

## What This Sprint Does NOT Cover

1. New builders — existing 55 are correct
2. New primitives — existing 87 are correct
3. MeltUI adapter layer refactoring — separate sprint
4. Effects system — separate sprint
5. VPB integration — separate sprint
6. Test coverage expansion — separate sprint

---

## Success Criteria

| Criterion | Metric |
|-----------|--------|
| Zero visual in components/ | grep -r "useColdLight\|ColdLightProps\|data-encoding" components/ returns 0 |
| ui/ layer exists | Every component kind has a corresponding ui/ wrapper |
| svelte-check | 0 errors |
| App renders | pnpm dev shows working UI |
| Imports updated | No app code imports from components/ directly |
