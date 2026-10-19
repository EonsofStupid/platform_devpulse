# Research: ColdLight Component Foundation — SD5 + 36 Component Build + Full Test Suite

**Date**: 2026-02-15
**Sprint**: SPRINT-COMPONENT-FOUNDATION
**Status**: COMPLETE

---

## Question/Goal

Build the COMPLETE component layer for ColdLight v0.2.0:

1. **Style Dictionary v5 pipeline** — DTCG token interchange → platform outputs (CSS, TS, Tailwind)
2. **36 missing components** — every one built from its taxonomy contract with full Svelte code, context, props, child props, recipes, blueprints
3. **Comprehensive Vitest + Playwright tests** — contract compliance, ARIA, keyboard, state, recipes, accessibility
4. **Taxonomy enforcement** — contracts DEMAND component existence; biome enforces code quality
5. **VPB-ready** — AI-aware, configurable, preset-driven

---

## Codebase Analysis

### Current Inventory (Audit: 2026-02-15)

**4 COMPLETE components** (Svelte files, context, types, recipes, blueprints, tests):

| Component | Files | Pattern | Transport | Slots |
|-----------|-------|---------|-----------|-------|
| dialog | 10 .svelte | A (transport) | ColdLight native `<dialog>` | root, trigger, portal, overlay, content, title, description, close, header, footer |
| combobox | 8 .svelte | A (transport) | MeltUI `createCombobox<T>` | root (generic `<T>`), input, trigger, content, item, label, empty, group |
| tabs | 4 .svelte | A (transport) | ColdLight native ARIA | root, list, trigger, content |
| panel | 4 .svelte | B (classes-only) | None | root, header, body, footer |

**36 INCOMPLETE components** (only schema.ts, contract.ts, types.ts — zero Svelte code):

| Tier | Components | Slot Count | Complexity |
|------|-----------|------------|------------|
| **Tier 1: Single-slot** | separator, skeleton, spinner, visually-hidden, badge, label, progress | 1-2 slots | Minimal — single element + optional children |
| **Tier 2: Simple multi-slot** | button, input, textarea, toggle, card, alert, avatar, breadcrumb | 2-4 slots | Standard — root + 2-3 sub-components |
| **Tier 3: Interactive multi-slot** | checkbox, switch, radio-group, toggle-group, pin-input, slider, scroll-area, pagination, toolbar, collapsible, hover-card, popover, tooltip, accordion | 3-6 slots | State management, keyboard, ARIA attributes |
| **Tier 4: Complex compound** | alert-dialog, sheet, select, dropdown-menu, context-menu, command, navigation-menu, menubar | 7-14 slots | Focus management (trap/roving/activedescendant), nested menus, modal behavior |

### Component Contract Analysis — Complex Examples

#### Select (10 slots, activedescendant focus)
```
Slots: root(fragment), trigger(button/combobox), value(span), content(listbox),
       viewport(div), item(option), item-text(span), group, label, separator
Focus: activedescendant — DOM focus on trigger, visual focus on items
Keyboard: ArrowUp/Down(navigate/open), Enter/Space(select), Escape(close),
          Home/End(first/last), Tab(exit)
ARIA: trigger[aria-expanded, aria-haspopup, aria-controls],
      item[aria-selected], group[aria-labelledby]
Selection: single, selectionFollowsFocus=false
```

#### Dropdown-Menu (13 slots, roving focus, submenus)
```
Slots: root(fragment), trigger(button), content(menu), group, item(menuitem),
       checkbox-item(menuitemcheckbox), radio-group, radio-item(menuitemradio),
       label, separator, sub(fragment), sub-trigger(menuitem), sub-content(menu)
Focus: roving tabindex — first item on open, wraps around
Keyboard: ArrowDown/Up(navigate), Enter/Space(activate), Escape(close),
          Home/End(first/last), ArrowRight(open submenu), ArrowLeft(close submenu)
ARIA: trigger[aria-haspopup, aria-expanded], content[aria-labelledby],
      checkbox-item[aria-checked], radio-item[aria-checked],
      sub-trigger[aria-haspopup, aria-expanded]
```

#### Menubar (14 slots, horizontal + vertical roving)
```
Slots: root(menubar), menu(fragment), trigger(menuitem), content(menu), group,
       item(menuitem), checkbox-item(menuitemcheckbox), radio-group,
       radio-item(menuitemradio), label, separator, sub(fragment),
       sub-trigger(menuitem), sub-content(menu)
Focus: roving tabindex at menubar level (horizontal) + within menus (vertical)
Keyboard: ArrowRight/Left(navigate triggers), ArrowDown(open menu),
          ArrowDown/Up in menu(navigate items), Escape(close),
          ArrowRight(open submenu), ArrowLeft(close submenu)
ARIA: root[role=menubar], trigger[aria-haspopup, aria-expanded],
      content[aria-labelledby]
Orientation: horizontal at bar, vertical within menus
```

#### Command (7 slots, activedescendant, filtering)
```
Slots: root(combobox), input(searchbox), list(listbox), group, item(option),
       empty, separator
Focus: activedescendant — input retains DOM focus, virtual focus on items
Keyboard: ArrowUp/Down(navigate), Enter(select), Escape(close), Home/End
ARIA: root[role=combobox, aria-expanded], input[role=searchbox],
      list[role=listbox], item[role=option, aria-selected]
Filtering: enabled, mode=contains, typeahead
```

#### Alert-Dialog (8 slots, focus trap, NON-DISMISSIBLE)
```
Slots: root(fragment), trigger(button), portal, overlay, content(alertdialog),
       title(h2), description(p), cancel(button), action(button)
Focus: trap — cycles within content, NO ESCAPE EXIT
Keyboard: Tab(cycle focus) — NO Escape key handler (intentional)
ARIA: content[role=alertdialog, aria-modal=true, aria-labelledby(REQUIRED),
      aria-describedby(REQUIRED)]
Critical: Escape does NOT close — user must explicitly cancel/confirm
```

#### Sheet (10 slots, focus trap, side-anchored)
```
Slots: root(fragment), trigger(button), portal, overlay, content(dialog),
       header, footer, title(h2), description(p), close(button)
Focus: trap — cycles within, Escape returns to trigger
Keyboard: Escape(close), Tab(cycle within trap)
ARIA: content[role=dialog, aria-modal=true, aria-labelledby(REQUIRED)]
Side: configurable (left/right/top/bottom)
```

### Style Dictionary v5 Status

- **Installed**: `style-dictionary@5.3.0` in package.json devDependencies
- **NOT configured**: Zero `sd.config.ts`, zero DTCG `tokens.json`, zero SD5 commands
- **Current pipeline**: Manual `ds-tokens-build.ts` (427 lines) reads `tokens.ts` → generates:
  - `tokens.css` — `:root {}` (Tier 1+2+3) + `@theme {}` (Tailwind v4)
  - `types.ts` — TypeScript unions + runtime arrays
  - `tailwind.preset.ts` — `dpPreset` config extending TW4 theme
- **SD5 must produce**: Identical outputs to maintain zero regression

### Existing Test Patterns (from 4 complete components)

Tests use **vitest browser mode** with `@vitest/browser-playwright`:

```
Test structure per component (7-10 describe blocks):
1. Contract Tests — data-kind, data-slot, data-state attributes
2. ARIA Tests — roles, aria-* attributes, semantic HTML
3. Recipe Class Tests — CSS classes from design system
4. State Tests — open/closed, checked/unchecked, active/inactive transitions
5. Keyboard Tests — arrow keys, Enter, Space, Escape, Tab, Home/End
6. Focus Tests — trap, roving tabindex, activedescendant
7. Disabled/Edge Cases — disabled state, closed state, empty state
8. Transport/ID Tests — unique IDs, aria-controls wiring, cross-references
9. Instance Isolation — multiple instances get unique IDs
10. Orientation Tests — horizontal vs vertical keyboard behavior
```

Helper pattern:
```typescript
const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));
function querySlot(slot: string): Element | null {
  return document.querySelector(`[data-slot="${slot}"]`);
}
```

### Biome Configuration

```
Enforcement: strict
Indent: tabs, width 2
Line width: 100
Line ending: LF
Rules: noUnusedVariables=error, noUnusedImports=error,
       noExplicitAny=error, noConsole=warn(allow warn,error)
```

### Two Component Patterns

**Pattern A — Transport-backed** (dialog, combobox, tabs):
```
Root.svelte:
  1. getBlueprint() → default props
  2. getRecipe() → classes function
  3. createXxx() → transport (from imports.gen.ts)
  4. $effect() → sync bindable props ↔ transport state
  5. setXxxComponentContext({ transport, classes })
  6. {@render children?.()}

Sub-component.svelte:
  1. getXxxComponentContext() → { transport, classes }
  2. {...transport.slots.slotName} → spread ARIA attrs
  3. data-kind, data-slot, data-state attributes
  4. cn(classes.slotName, className) → merged classes
  5. use:transport.attachXxx → Svelte action for behavior
```

**Pattern B — Classes-only** (panel, and all components without a transport factory):
```
Root.svelte:
  1. getBlueprint() → default props
  2. getRecipe() → classes function
  3. setXxxComponentContext({ classes })
  4. <element data-kind data-slot class={cn(classes.root, className)}>

Sub-component.svelte:
  1. getXxxComponentContext() → { classes }
  2. data-kind, data-slot attributes
  3. cn(classes.slotName, className) → merged classes
```

### VPB Integration Requirements

From MASTER-PLAN.md and PRESET_SYSTEM.md:
- Components register with taxonomy → VPB discovers them from registry
- VPB palette generated from `getPrimitiveKinds()` + `getRecipesForKind()`
- BlockNode tree: `{ id, kind, recipe, props, slots: Record<string, BlockNode[]> }`
- Presets provide defaults (not components) — `safeKnobs` constrain VPB editing
- AI introspection via component contracts: slots, states, interactions, keyboard

---

## External Research

### Style Dictionary v5 (DTCG Format)

SD5 uses W3C Design Token Community Group (DTCG) format:
```json
{
  "color": {
    "teal": {
      "500": {
        "$type": "color",
        "$value": "oklch(0.75 0.17 180)"
      }
    }
  }
}
```

SD5 config (`sd.config.ts`):
```typescript
import StyleDictionary from "style-dictionary";
export default {
  source: ["tokens/tokens.json"],
  platforms: {
    css: { transformGroup: "css", buildPath: "tokens/", files: [...] },
    ts: { transformGroup: "js", buildPath: "tokens/", files: [...] },
  }
};
```

SD5 custom formats allow producing any output (CSS custom properties, TypeScript types, Tailwind presets).

### Svelte 5 Component Patterns (2026 Best Practice)

- `$props()` with `$bindable()` for two-way binding
- `$state()` for local reactive state
- `$derived()` for computed values
- `$effect()` for side effects (sync props ↔ transport)
- `Snippet` type for children (replaces `$$slots`)
- `{@render children?.()}` for slot rendering
- `use:action` for Svelte actions (transport attachment)
- Generics via `<script lang="ts" generics="T">`

### APG Compliance Requirements

Every interactive component MUST implement its W3C ARIA APG pattern:
- Correct ARIA roles on every element
- Required aria-* attributes (aria-expanded, aria-selected, etc.)
- Keyboard interaction model (documented in contract.keyboardMap)
- Focus management (trap, roving, activedescendant)
- State transitions (data-state attribute changes)

---

## Findings

1. **SD5 pipeline gap**: Installed but zero config. Need: DTCG tokens.json → sd.config.ts → custom formats → identical outputs
2. **36 components have contracts but zero code**: Each needs 5-14 files depending on slot count
3. **Pattern B is correct for initial builds**: All 36 start as Pattern B (classes-only). Components requiring transport (select, dropdown-menu, etc.) get upgraded when transport factories are built
4. **Component tokens (Tier 3) incomplete**: Only 6 kinds have component tokens. Need all 40
5. **Test coverage gap**: Need 7-10 describe blocks per component, not bare stubs
6. **Biome enforcement**: Must pass biome check on all generated code
7. **VPB registration**: Components must be discoverable from taxonomy registry

---

## Recommendations

### Execution Order (Bottom-Up)

1. **SD5 pipeline** — tokens are the foundation everything builds on
2. **Expand component tokens** — Tier 3 tokens for all 40 kinds
3. **Build Tier 1 components** (7 single-slot) — fastest, validates the pattern
4. **Build Tier 2 components** (8 simple multi-slot) — standard pattern
5. **Build Tier 3 components** (14 interactive) — state management, keyboard
6. **Build Tier 4 components** (7 complex compound) — focus management, modals, menus
7. **Write comprehensive tests** — 7-10 describe blocks per component
8. **Update barrels** — components/index.ts exports all 40
9. **Verify compilation + biome** — zero errors
10. **Commit**

### File Count per Component

| Component Type | context.ts | .svelte files | types.ts | recipe | blueprint | test.ts | test.svelte | index.ts | Total |
|---------------|-----------|--------------|---------|--------|-----------|---------|-------------|---------|-------|
| Single-slot (7) | 1 | 1 | exists | 1+types+index | 1+types+index | 1 | 1 | 1 | ~10 |
| Simple multi-slot (8) | 1 | 2-4 | exists | 1+types+index | 1+types+index | 1 | 1 | 1 | ~12 |
| Interactive (14) | 1 | 3-6 | exists | 1+types+index | 1+types+index | 1 | 1 | 1 | ~14 |
| Complex compound (7) | 1 | 7-14 | exists | 1+types+index | 1+types+index | 1 | 1 | 1 | ~18 |

**Estimated total new files: ~500**

---

## Files Referenced

### Gold Standard References (4 complete components)
- `components/dialog/` — Pattern A, 10 Svelte files, transport-backed, focus trap
- `components/combobox/` — Pattern A, 8 Svelte files, MeltUI adapter, generic `<T>`
- `components/tabs/` — Pattern A, 4 Svelte files, transport-backed, roving tabindex
- `components/panel/` — Pattern B, 4 Svelte files, classes-only

### Contract References (complex components)
- `components/select/contract.ts` — 10 slots, activedescendant
- `components/dropdown-menu/contract.ts` — 13 slots, submenus
- `components/menubar/contract.ts` — 14 slots, dual-axis roving
- `components/command/contract.ts` — 7 slots, filtering
- `components/alert-dialog/contract.ts` — 8 slots, non-dismissible
- `components/sheet/contract.ts` — 10 slots, side-anchored modal
- `components/navigation-menu/contract.ts` — 7 slots, semantic nav
- `components/context-menu/contract.ts` — 12 slots, right-click menu
- `components/accordion/contract.ts` — 5 slots, expandable sections

### Token Pipeline
- `tokens/tokens.ts` — SSOT (323 lines)
- `tokens/semantic.ts` — Tier 2 (43 lines)
- `tokens/components.ts` — Tier 3 (44 lines, only 6 kinds)
- `scripts/dev/design/ds-tokens-build.ts` — Current build (427 lines)

### Test Infrastructure
- `vitest.config.ts` — Browser mode with Playwright chromium
- `playwright.config.ts` — e2e config (empty e2e/ directory)
- `biome.json` — Strict enforcement rules

### Design System Documentation
- `COLDLIGHT.md` — Canonical specification
- `MASTER-PLAN.md` — Strategic plan for v0.2.0
- `STYLE_GUIDE.md` — Code standards SSOT
- `TOKEN_PIPELINE.md` — Token flow documentation
- `AUTHORING.md` — Component authoring guide
- `PROP_TAXONOMY_CAPTURE.md` — Complete prop taxonomy
- `.agent/INSTRUCTIONS.md` — AI agent rules
