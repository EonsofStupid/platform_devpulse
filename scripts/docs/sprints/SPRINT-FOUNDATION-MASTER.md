# SPRINT: ColdLight Foundation — Master Plan

**Status**: PLAN — no code until owner approves
**Scope**: Every layer from tokens to rendered routes
**Goal**: One complete, correct, rendering design system. No drift. No shells. No shortcuts.

---

## The Stack (bottom up)

```
DTCG tokens (source of truth — JSON)
  ↓ SD5 compile
CSS custom properties (primitives, semantic, components, SVG)
  ↓ consumed by
Primitives (structural HTML/SVG shells — correct elements, correct slots)
  ↓ composed with
Behaviors (WAI-ARIA APG hooks — keyboard, focus, ARIA attributes)
  ↓ assembled into
Components (THE PUBLIC API — primitive + behavior + StyleMacro intent)
  ↓ composed into
Blocks (layout compositions — Widget, ChatPanel, ThreadList)
  ↓ rendered by
Routes (thin shells importing from domains → blocks → components)
```

Every layer depends on the one below it. If a layer is broken, everything above it is broken.

---

## Layer 1: Tokens — CURRENT STATE

### What works
- SD5 pipeline compiles DTCG JSON → CSS vars (3968 vars)
- 480 color tokens (full spectrum + brand + void + neutral)
- Glow, shadow, bevel, blur, radius, spacing, typography, motion, transition, border, interaction, overlay, backdrop, scrollbar, text, signal tokens
- Style presets: 431 × 17 axes each (enriched)
- SVG presets: 10 × 20 axes each
- .d.ts type generation working (16 files)
- Theme @theme registration for Tailwind

### What's broken
- [ ] **No fluid clamp()** — every dimension is static (CRITICAL)
- [ ] **Primitives leak into Tailwind @theme** — 55 raw colors in autocomplete
- [ ] **Typography not composed for Tailwind** — no `text-display-lg` utility
- [ ] **aliases.css has 25 hand-authored vars** — should be in DTCG
- [ ] **Style preset font-* properties set to "inherit" as string** — wrong DTCG type

### Sprint: SD5-TAILWIND-ALIGNMENT
Must execute BEFORE primitives render properly.

---

## Layer 2: Primitives — CURRENT STATE

### What works
- 8 properly authored: surface, text, stack, row, dot, icon-slot, heading, separator
- 35 folders exist in primitives/

### What's broken
- [ ] **33 generic div shells** — wrong elements, no sub-slots, need full authoring
- [ ] **0 sub-component primitives** — no TabsList, DialogOverlay, AccordionItem, etc.
- [ ] **Missing RAC-parity primitives** — Input, Modal, Group, ToggleButton, Disclosure, etc.
- [ ] **No primitive for button** — the most used element has no structural primitive

### Gold Standard: What a Properly Authored Primitive Looks Like

```
primitives/tabs/
├── Tabs.svelte          ← root: <div data-kind="tabs" data-slot="root">
├── TabsList.svelte      ← <div data-kind="tabs" data-slot="list">
├── TabsTrigger.svelte   ← <button data-kind="tabs" data-slot="trigger">
├── TabsContent.svelte   ← <div data-kind="tabs" data-slot="content">
├── tabs.props.ts        ← TabsRootProps, TabsListProps, TabsTriggerProps, TabsContentProps
└── index.ts             ← barrel exports all
```

**Rules:**
1. Correct HTML element per slot (from anatomy)
2. `data-kind` = the component kind (same across all sub-components)
3. `data-slot` = the slot name (unique per sub-component)
4. Props extend correct `HTMLAttributes<HTMLElement>` type
5. `{@render children?.()}` for content
6. `cn(className)` for class merging
7. `{...rest}` for attribute spread
8. ZERO behavior, ZERO ARIA, ZERO styling, ZERO hooks

### Sprint: PRIMITIVES-AUTHORING (6 batches, ~80 files)

---

## Layer 3: Behaviors — CURRENT STATE

### What works
- 67 behavior hooks in behaviors/
- WAI-ARIA APG implementations for button, dialog, tabs, checkbox, etc.
- Shared utilities in _shared/ (focus-trap, dismiss-layer, roving-focus, etc.)
- Runes-native ($state, $derived, $effect)

### What needs verification
- [ ] **Every hook returns correct ARIA attrs** — audit against APG specs
- [ ] **Every hook uses Svelte 5 runes** — no legacy stores
- [ ] **Keyboard handling matches APG** — correct keys per pattern
- [ ] **Hook return types match component expectations** — props spread correctly
- [ ] **_shared utilities work after a11y→_shared rename** — import paths correct

### Gold Standard: What a Properly Authored Behavior Looks Like

```
behaviors/tabs/
├── use-tabs.svelte.ts   ← the hook
├── tabs.anatomy.ts      ← createAnatomy("tabs", ["root", "list", "trigger", "content"])
├── tabs.types.ts        ← UseTabsProps, UseTabsReturn (ARIA attrs + keyboard + state)
└── index.ts             ← barrel exports hook + types + anatomy
```

**The hook returns:**
```typescript
interface UseTabsReturn {
  root: {
    // Spread onto primitive root
    id: string;
    "data-orientation": "horizontal" | "vertical";
  };
  list: {
    role: "tablist";
    "aria-orientation": "horizontal" | "vertical";
  };
  trigger: (value: string) => {
    role: "tab";
    id: string;
    "aria-selected": boolean;
    "aria-controls": string;
    tabindex: number;
    onclick: () => void;
    onkeydown: (e: KeyboardEvent) => void;
  };
  content: (value: string) => {
    role: "tabpanel";
    id: string;
    "aria-labelledby": string;
    hidden: boolean;
  };
}
```

**Rules:**
1. Returns reactive ARIA attributes per slot
2. Returns keyboard handlers per slot
3. Returns state (value, selected, open, etc.)
4. Uses Svelte 5 runes internally
5. References _shared utilities for focus/dismiss/roving
6. ZERO rendering — pure logic

---

## Layer 4: Components — CURRENT STATE

### What works
- 92 component folders exist
- 82 use StyleMacro with intent prop
- Intent resolver maps primary→glass, secondary→matte, ghost→flat, danger→stark
- StyleMacro reads --style-{kind}-{visual}-{axis} from SD5 output

### What's broken
- [ ] **Components don't compose primitives** — they render raw HTML directly
- [ ] **4 components hardcode style= instead of intent=**
- [ ] **3 components use intent={variant} naming mismatch**
- [ ] **Card has both variant and intent props** — confusing API
- [ ] **Badge uses variant in routes** — 16 instances
- [ ] **StatusDot, Stat, KeyValue** — partially fixed but not wired to dashboard
- [ ] **Chat components don't render** — ThreadList hardcodes var() refs

### Gold Standard: What a Properly Authored Component Looks Like

```
components/tabs/
├── Tabs.svelte          ← THE PRODUCT
├── TabsList.svelte      ← sub-component
├── TabsTrigger.svelte   ← sub-component
├── TabsContent.svelte   ← sub-component
├── tabs.types.ts        ← TabsProps (extends ComponentProps)
└── index.ts             ← barrel
```

**Tabs.svelte (root component):**
```svelte
<script lang="ts">
import { useTabs } from "$lib/design/behaviors/tabs/index.js";
import { StyleMacro } from "$lib/design/styles/index.js";
import { cn } from "$lib/design/utils/cn.js";
import type { TabsProps } from "./tabs.types.js";

let { value, onValueChange, orientation = "horizontal", intent = "default", children, class: className, ...rest } = $props();

const tabs = $derived(useTabs({ value, onValueChange, orientation }));
</script>

<StyleMacro kind="tabs" {intent}>
  <div {...tabs.root} class={cn(className)} {...rest}>
    {@render children?.()}
  </div>
</StyleMacro>
```

**Rules:**
1. Imports behavior hook from behaviors/
2. Wraps in StyleMacro with kind + intent
3. Spreads hook return attrs onto elements
4. Accepts intent prop (resolved by StyleMacro)
5. Sub-components get context from root (Svelte context)
6. Type-safe props extending ComponentProps
7. ZERO hardcoded styling — all from StyleMacro + presets
8. ZERO direct ARIA — all from behavior hook

---

## Layer 5: Blocks — CURRENT STATE

### What works
- Widget delegates to Card with intent prop
- Widget has tabs via WidgetTabs sub-component
- ChatPanel delegates to Card

### What's broken
- [ ] **ThreadList hardcodes var() refs** — should compose components
- [ ] **GovernanceControls is domain-specific** — doesn't belong in central library
- [ ] **Widget icon color has fragile fallback** — should come from StyleMacro

### Gold Standard: What a Block Looks Like

```svelte
<!-- Widget.svelte — a BLOCK, not a component -->
<script lang="ts">
import { Card } from "$lib/design/components/card/index.js";
import { Heading } from "$lib/design/components/heading/index.js";
import { Separator } from "$lib/design/components/separator/index.js";
// Blocks import from COMPONENTS, never from primitives or behaviors
</script>

<Card {intent}>
  <Heading level={3}>{title}</Heading>
  <Separator />
  {@render children?.()}
</Card>
```

**Rules:**
1. Imports ONLY from components/ (never primitives/ or behaviors/)
2. No StyleMacro — delegates to component children
3. No behavior hooks — no ARIA, no keyboard
4. Pure layout composition
5. Accepts intent and passes through to child components

---

## Layer 6: Routes — CURRENT STATE

### What's broken
- [ ] **Dashboard health rows use raw markup** — no components
- [ ] **Dashboard project cards use raw markup** — no components
- [ ] **Dashboard stats use raw markup** — partially fixed Stat component
- [ ] **Chat page doesn't render visuals** — components exist but don't paint
- [ ] **16 Badge instances use variant instead of intent** — in 5 route files
- [ ] **Error pages use hardcoded Tailwind colors** — not tokens
- [ ] **UI demo page uses hardcoded palette classes** — not semantic tokens

---

## Execution Order

### Phase A: Token Pipeline Fix (SD5-TAILWIND-ALIGNMENT sprint)
1. Fluid clamp() on all dimension tokens
2. Filter primitives out of Tailwind @theme
3. Compose typography for Tailwind
4. Migrate aliases.css to DTCG
5. Fix preset font-* types

### Phase B: Primitive Authoring (PRIMITIVES-AUTHORING sprint, 6 batches)
1. Batch 1: button, badge, tabs, progress, field, text-field (dashboard-critical)
2. Batch 2: dialog, alert-dialog, popover, sheet, tooltip, modal (overlay system)
3. Batch 3: checkbox, radio-group, switch, slider, select, combobox, etc. (forms)
4. Batch 4: accordion, breadcrumbs, link, menu, listbox, tree, toolbar (nav + collections)
5. Batch 5: table, meter, label, color-* (data display)
6. Batch 6: RAC-missing primitives (disclosure, drop-zone, file-trigger, etc.)

### Phase C: Behavior Audit (alongside Phase B)
Verify each hook as its primitive is authored. Fix any issues found.

### Phase D: Component Reauthoring
Rewrite components to compose primitives + behaviors. Currently they render raw HTML.
This is the biggest phase — 92 components need touching.

### Phase E: Block + Route Wiring
Wire dashboard and chat to use proper components. Delete raw markup.

---

## STOP Points

### STOP A.1: Fluid Token Strategy
Before any clamp() authoring — owner must confirm: viewport-scale base rem + token-level clamp, or token-level only?

### STOP A.2: Tailwind @theme Filtering
Owner must confirm: brand hues in Tailwind (A/B/C from earlier)?

### STOP B.1: Primitive Sub-Component Pattern
Before batch 1 — owner reviews one complete primitive (tabs) as the reference implementation. All others follow the same pattern.

### STOP D.1: Component Reauthoring Scope
Before Phase D — owner confirms: rewrite all 92, or only the ones dashboard + chat need?

---

## What This Achieves

When complete:
- Every primitive renders the correct HTML element with correct slots
- Every behavior provides WAI-ARIA APG compliant ARIA + keyboard
- Every component is primitive + behavior + StyleMacro (no raw HTML)
- Every block composes components (no raw markup)
- Every route renders through the design system (no hardcoded styles)
- Every token is fluid (clamp())
- Tailwind autocomplete shows only semantic tokens
- RAC parity on all implemented patterns
- Dashboard and chat render with full ColdLight visual treatment

**This is the foundation. Everything else builds on this.**
