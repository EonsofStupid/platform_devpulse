# Research: StyleMacro Integration — ADR-001 Enforcement

**Date**: 2026-03-21
**Sprint**: SPRINT-STYLEMACRO-INTEGRATION
**Status**: IN_PROGRESS

## SSOT Map

### What EXISTS on disk (verified)

| Asset | Location | Status |
|-------|----------|--------|
| **StyleMacro.svelte** | `design/style/StyleMacro.svelte` | EXISTS, functional, ~95 lines |
| **base-state.svelte.ts** | `design/style/base-state.svelte.ts` | EXISTS, $state global theme |
| **macro-mappings.ts** | `design/style/macro-mappings.ts` | EXISTS, 30+ prop→CSS var mappings |
| **ADR-001** | `design/ADR-001-STYLE-MACRO.md` | EXISTS, ACCEPTED, IRREVERSIBLE |
| **SD5 component tokens** | `styles/components/component.css` | EXISTS, --button-bg, --badge-bg, etc. |
| **SD5 semantic tokens** | `styles/semantic/*.css` | EXISTS, --surface-base, --border-subtle, etc. |
| **SD5 primitive tokens** | `styles/primitives/*.css` | EXISTS, --glass-void, --color-teal-500, etc. |
| **Component token @theme** | `theme/*.css` (no component theme) | PARTIAL — component @theme NOT in import chain |
| **CSS import chain** | `app.css → index.css → css/index.css + theme/index.css` | EXISTS, wired |
| **ui/ folder** | `design/ui/` | DOES NOT EXIST |
| **DTCG composite recipe tokens** | JSON files | DO NOT EXIST |

### What EXISTS but ADR-001 says DELETE

| Asset | Location | ADR-001 Status |
|-------|----------|---------------|
| `use-coldlight.svelte.ts` | `components/_base/use-coldlight.svelte.ts` | SHOULD BE DELETED |
| `recipes/` JS system | `design/recipes/` (engine.ts, 80+ recipe files) | SHOULD BE DELETED |
| `registry/resolve-visual.ts` | `design/registry/resolve-visual.ts` | SHOULD BE DELETED |
| `registry/presets.ts` | `design/registry/presets.ts` | SHOULD BE DELETED |
| `registry/token-categories.ts` | `design/registry/token-categories.ts` | SHOULD BE DELETED |
| `registry/kind-definitions.ts` | `design/registry/kind-definitions.ts` | SHOULD BE DELETED |
| `registry/encoding.ts` | `design/registry/encoding.ts` | SHOULD BE DELETED |

### What EXISTS but VIOLATES ADR-001

| Component Pattern | Count | Violation |
|-------------------|-------|-----------|
| Components with hardcoded color classes | ~89 | Should be dumb (structure + ARIA + class) |
| `recipe.ts` in component folders (JS functions with visual classes) | 46 files | Recipes should be DTCG composite tokens, not JS |
| Components importing from `recipes/` JS system | ~60 .svelte files | Old system, should be deleted |
| INTENT_CLASSES / VARIANT_CLASSES Records with colors | button, badge, etc. | Visual decisions belong in StyleMacro/CSS, not components |

### Duplicates / Competing Sources

1. **TWO component token CSS files**: `styles/components/component.css` AND `style/components/tokens.css` — different values (e.g., `--button-bg: var(--surface-base)` vs `var(--surface-primary)`)
2. **TWO recipe systems**: `recipes/` folder (old registerRecipe JS) AND `components/*/recipe.ts` (new colocated JS functions) — both are JS, ADR says neither should exist
3. **StyleMacroProps** includes 30+ properties (spacing, sizing, typography, layout) beyond the 6 visual axes — maps to --cl-* vars that NO CSS rule consumes

## Question/Goal

Wire the StyleMacro provider pattern end-to-end so that:
1. Components are DUMB (structure + ARIA + class)
2. StyleMacro wraps components and provides visual treatment via --cl-* CSS custom properties
3. Users import from `ui/` which composes StyleMacro + component
4. Tokens actually render in the browser — not just generated files sitting unused

## Codebase Analysis

### The Gap: StyleMacro outputs vars, nothing consumes them

StyleMacro produces:
```html
<div style="--cl-bg: var(--color-coldlight-default-layer-1); --cl-shadow: var(--shadow-coldlight-default-z1); ...">
```

But there is NO CSS rule anywhere that says:
```css
[data-kind] {
  background-color: var(--cl-bg);
  box-shadow: var(--cl-shadow);
}
```

Without this "glue CSS", StyleMacro's output goes nowhere.

### The Gap: var() construction doesn't match actual token names

StyleMacro constructs: `var(--${category}-${activeId}-${value})`
Example: `var(--color-coldlight-default-layer-1)`

But SD5 generates: `--glass-void`, `--surface-base`, `--color-teal-500`
NOT: `--color-coldlight-default-layer-1`

**The var() construction in StyleMacro does not resolve to any existing CSS custom property.** This is a fundamental wiring issue.

### The Gap: ui/ folder doesn't exist

ADR-001 defines a 3-layer model: Component → Recipe (DTCG) → UI wrapper
Users import from `ui/`. The `ui/` folder does not exist.

### Current component pattern (every component)

All ~89 components follow this broken pattern:
```svelte
<!-- Badge.svelte -->
const VARIANT_CLASSES = {
  neutral: "bg-[var(--surface-elevated)] text-text-secondary ...",  // VISUAL — should not be here
  accent: "bg-[var(--color-teal-500)]/10 text-[var(--color-teal-400)] ...",  // VISUAL
};
const SIZE_CLASSES = { sm: "px-1.5 py-0.5 text-xs", ... };  // STRUCTURAL — correct
```

Visual decisions are hardcoded in components. The 46 `recipe.ts` files in component folders are JS functions that also hardcode visual classes.

## Anti-Pattern Risks

1. **Creating macro-base.css without fixing StyleMacro var() construction** — the glue CSS would reference --cl-bg, but StyleMacro would set it to `var(--color-coldlight-default-layer-1)` which doesn't exist
2. **Deleting old recipe system before ui/ folder exists** — app breaks, nothing renders
3. **Batch-rewriting 89 components without compile-checking each** — phantom errors compound
4. **Keeping two recipe systems during migration** — confusion about which is authoritative

## Findings

### STOP — Owner Decision Required

**Question 1: StyleMacro var() construction is broken**

StyleMacro line 67: `cssString += \`\${mapping.varName}: var(--\${mapping.category}-\${activeId}-\${value}); \``

This produces: `--cl-bg: var(--color-coldlight-default-layer-1)`
But no CSS custom property `--color-coldlight-default-layer-1` exists.

**Options:**
- **A)** Fix StyleMacro to reference ACTUAL SD5 token names: `--cl-bg: var(--glass-void)` / `--cl-bg: var(--surface-base)`
- **B)** Generate the missing intermediate tokens in SD5 with the `--{category}-{styleId}-{value}` naming convention
- **C)** Something else the owner has in mind

**Impact:** Nothing works until this is resolved. This is the root of "tokens never render."

**Question 2: What about intent/variant?**

ADR-001 says components are dumb. But `intent="primary"` drives visual differences (teal bg vs transparent bg). Where does intent resolution live?

**Options:**
- **A)** Intent is a StyleMacro concern — `<StyleMacro kind="button" localOverrides={{ backgroundColor: "accent-teal" }}>` at the ui/ wrapper level
- **B)** Intent maps to different compiled-base entries — `compiledBase["button-primary"]`, `compiledBase["button-ghost"]`
- **C)** Intent CSS lives in a separate stylesheet scoped by `[data-intent]`
- **D)** Something else

**Impact:** This determines how every component with variants works.

**Question 3: Migration order**

89 components, 46 recipe.ts files, 80+ old recipes/, 60+ old registry/ files. What order?

**Options:**
- **A)** Fix StyleMacro var() → create glue CSS → create ui/ for ONE component (Button) → verify renders → batch the rest
- **B)** Delete all old systems first → then build new
- **C)** Owner has a different order

## Files Referenced

- `design/ADR-001-STYLE-MACRO.md` — the locked architecture decision
- `design/style/StyleMacro.svelte` — the macro component (broken var() construction)
- `design/style/macro-mappings.ts` — prop→CSS var dictionary
- `design/style/base-state.svelte.ts` — global $state theme
- `design/styles/components/component.css` — SD5-generated component tokens
- `design/styles/semantic/surface.css` — SD5-generated semantic tokens
- `design/components/button/Button.svelte` — current button (hardcoded visual classes)
- `design/components/badge/Badge.svelte` — current badge (same pattern)
- `design/recipes/` — old JS recipe system (ADR says delete)
- `design/registry/` — old visual resolution system (ADR says delete)
- `design/components/_base/use-coldlight.svelte.ts` — old per-component hook (ADR says delete)
