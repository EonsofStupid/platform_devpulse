# Research: Gold Standard Button Component

**Date**: 2026-03-19
**Sprint**: SPRINT-GOLD-STANDARD-BUTTON
**Status**: COMPLETE — AWAITING OWNER DECISIONS

---

## SSOT Map

### DUPLICATE: Two Button Hooks

| Hook | Location | Pattern | What It Does |
|------|----------|---------|--------------|
| `useButton()` | `coldlight/primitives/button/use-button.svelte.ts` | Svelte 5 runes (`$state`, `$derived`) | Full reactive ARIA — pressed/toggle/expand, keyboard, getter-wrapped return |
| `createButton()` | `api/dsadapters/coldlight/_internal/button/index.ts` | Plain object (getter fns as args) | ARIA attributes + handlers — pressed/toggle/expand, keyboard, state string |

Both do the same thing. `useButton()` is rune-native. `createButton()` uses function getters. The component (`components/button/Button.svelte`) imports `createButton()`.

### DUPLICATE: Three Button Svelte Files

| File | Location | Purpose |
|------|----------|---------|
| `coldlight/primitives/button/Button.svelte` | ColdLight reference | Uses `cn()`, typed via `ButtonPrimitiveProps`, 25 lines |
| `primitives/button/Button.svelte` | Public Shard | Bare `<button>` with data-kind/data-slot, 34 lines |
| `components/button/Button.svelte` | Production | Composes `createButton()` + `useColdLight()` + `buttonRecipe()`, 72 lines |

### DUPLICATE: Two Recipe Systems

| Recipe | Location | Purpose |
|--------|----------|---------|
| `components/button/recipe.ts` | Structural only | Returns size classes (h-8/h-10/h-12, px, gap). No visual encoding. |
| `recipes/components/button/button.default.ts` | Full visual | Registers "button.glass.void", calls `emitSegments()` for v-* classes, radius, tokens |

The component imports `buttonRecipe()` from `components/button/recipe.ts` (structural).
It gets visual encoding from `useColdLight()` separately.
The recipes/ version registers with the recipe engine but the component doesn't directly call it.

### DUPLICATE: Two Type Definitions

| Types | Location | Exports |
|-------|----------|---------|
| `coldlight/primitives/button/button.types.ts` | Primitive layer | `ButtonType`, `UseButtonProps`, `UseButtonReturn` |
| `components/button/types.ts` | Component layer | `ButtonIntent`, `ButtonProps`, `BUTTON_INTENT_PRESETS`, `ButtonSize` |

These define different things (primitive hook types vs component props) but overlap on disabled/loading/pressed/expanded/type fields.

### Token Presets (Single Source — No Conflict)

`scripts/build/styledictionary/tokens/src/presets/button.json` — 4 presets (primary, secondary, ghost, danger), each with 8-axis encoding + CSS values.

### Contract (Single Source — No Conflict)

`components/button/contract.ts` — 138 lines, Zod. Defines slots (root, icon, label), ARIA attrs, data attrs, keyboard, interactions.

### Anatomy + A11y Spec (Single Source — No Conflict)

`coldlight/primitives/button/button.anatomy.ts` — `createAnatomy("button", ["root"])`
`coldlight/primitives/button/button.a11y.ts` — WAI-ARIA button pattern spec

### Kind Definition (Single Source — No Conflict)

`kind-definitions.ts` — `kind: "button"`, engine: "coldlight", defaultPreset: "btn-primary", defaultRecipe: "button.glass.void"

---

## Codebase Analysis

### What's Good (Keep)

1. **contract.ts** — Thorough Zod contract covering slots, ARIA, data attributes, keyboard. Sound.
2. **button.a11y.ts** — Clean WAI-ARIA spec. Matches APG pattern.
3. **button.anatomy.ts** — Uses `createAnatomy()` factory. Currently only `root` slot — needs `icon` and `label` added to match contract.
4. **SD5 presets** — 4 intents with full 8-axis encoding. DTCG compliant. Well-authored.
5. **Kind definition** — Registered, wired to preset + recipe.
6. **Component architecture** — Dual-hook pattern (`createButton` for ARIA, `useColdLight` for visual) is the right separation.

### What's Wrong (Fix)

1. **Two hooks doing the same thing** — `useButton()` and `createButton()` must consolidate. One SSOT.
2. **Three .svelte files** — Unclear which is the "real" primitive. Shard (`primitives/button/`) is the public one but `coldlight/primitives/button/` has more infrastructure.
3. **Two recipe paths** — Structural recipe in component + visual recipe in recipes/ engine. Should be one call.
4. **Story hardcodes INTENT_STYLES** — Bypasses the entire token → recipe chain. Anti-pattern.
5. **Anatomy only has `root`** — Contract defines `root`, `icon`, `label` slots. Anatomy must match.
6. **No anatomy SVG** — Required per feedback.
7. **No Storybook docs page** — Just stories, no MDX with anatomy diagram.
8. **Missing generated map** — No file bridges SD5 preset output to recipe consumption.

### S2 Pattern Reference (from EFFINGAI local docs)

S2 three-layer model adapted to ColdLight:

```
Layer 1: Behavior/ARIA hook (useButton / createButton)
         → Returns attributes object + reactive state
         → Keyboard, press, toggle, disabled, expanded

Layer 2: Primitive/Shard (Button.svelte in primitives/)
         → Structural shell: <button data-kind="button" data-slot="root">
         → Accepts hook output as spread attributes
         → Zero styling

Layer 3: Styled Component (Button.svelte in components/)
         → Composes: hook + recipe + useColdLight
         → Intent maps to preset → composite tokens → CSS
         → Exports the public API
```

S2 style() macro equivalent = SD5 token generation + recipe resolution. NOT runtime Tailwind arbitrary values.

### EFFINGAI ColdLight Button (Local Reference)

`c:\Users\jessa\Downloads\EFFINGAI-main\` has a parallel ColdLight implementation:
- Uses data-attribute selectors (`data-variant`, `data-size`, `data-glow`) instead of class names
- Recipe system generates CSS rules targeting data-* selectors
- `createButton()` hook composes press + hover + focus
- `button.def.ts` defines props schema with token bindings for VPB introspection

This pattern (data-attribute styling) is worth evaluating vs the current Tailwind class approach.

---

## Anti-Pattern Risks

1. **Patching the story to fix Storybook crash without fixing the component** — Story should call `<Button>`, not manually assemble classes
2. **Keeping both hooks** — Creates confusion about which to use. Future components will pick randomly.
3. **Structural recipe + visual recipe as separate calls** — Component has to know about two systems. Should be one.
4. **Hardcoding intent→CSS mapping anywhere** — Must flow from SD5 presets through generated map. Zero manual mapping.
5. **Adding slots to anatomy without updating contract/component** — Must move as a unit.

---

## Findings

### The Button is 80% there architecturally, but fragmented.

The dual-schema model (contract.ts + types.ts) is correct. The hook pattern is correct. The recipe concept is correct. The SD5 presets are correct. But there are duplicates at every layer that create confusion, and the story bypasses all of it.

### The generated map file is the missing piece.

Currently: SD5 presets exist in JSON → they generate CSS custom properties → but nothing generates a TypeScript/JS map that the recipe engine can consume. This gap is why the story has to hardcode `INTENT_STYLES` — there's no runtime lookup from intent → resolved CSS.

### Storybook crash root cause

The addon-svelte-csf v5 parser is choking on this specific file. `let:args` IS valid syntax per the docs. The likely cause is either:
- Complex `{@const}` expressions inside `<Story>` blocks confusing the indexer
- Import resolution failure on `$lib/design/...` paths during indexing (not Vite-resolved)
- A bug in the specific parser version with multi-story files

Fix: Simplify the story to import and render the actual `<Button>` component instead of manually assembling everything.

---

## Files Referenced

| File | Why |
|------|-----|
| `coldlight/primitives/button/*` | 7 files — reference primitive layer (hook, types, a11y, anatomy, props, component, barrel) |
| `primitives/button/Button.svelte` | Public Shard primitive |
| `components/button/*` | 5 files — production component (component, contract, types, recipe, barrel) |
| `api/dsadapters/coldlight/_internal/button/index.ts` | ARIA hook (createButton) |
| `recipes/components/button/*` | 3 files — recipe engine registration |
| `scripts/build/styledictionary/tokens/src/presets/button.json` | SD5 DTCG presets |
| `src/stories/shards/Button.stories.svelte` | Broken Storybook story |
| `c:\Users\jessa\Downloads\EFFINGAI-main\` | S2 architecture docs + ColdLight button reference |
