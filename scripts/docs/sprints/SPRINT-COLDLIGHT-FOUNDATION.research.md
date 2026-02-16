# Research: ColdLight Design System — Full Audit & External Patterns

**Date**: 2026-02-08
**Sprint**: SPRINT-COLDLIGHT-FOUNDATION
**Status**: COMPLETE

---

## Question/Goal

Full audit of the ColdLight design system as it exists NOW. Every layer: tokens, molecules, primitives, recipes, components, blocks, renderers, taxonomy, adapters, config. What's built, what's wired, what's broken, what's missing. Cross-reference with leading design system patterns (Panda CSS, Radix Themes, Stitches, Vanilla Extract, Mitosis, Plasmic, Style Dictionary, Open Props, Figma Variables) to identify actionable patterns for TW4 + SvelteKit 5.

---

## External Research

### 1. Panda CSS — Recipes + Slot Recipes + Presets

**Source**: [panda-css.com/docs/concepts/recipes](https://panda-css.com/docs/concepts/recipes), [slot-recipes](https://panda-css.com/docs/concepts/slot-recipes)

**Architecture**: 3 recipe tiers:
- **Atomic (cva)**: Colocated, generates all variants upfront, atomic classes. No responsive support.
- **Config (defineRecipe)**: Centralized in config, JIT generation, supports responsive/conditional values. Generates `<recipe>--<variant>` class names in `@layer recipes`.
- **Slot (sva/defineSlotRecipe)**: Multi-part components. Defines `slots: ['root', 'control', 'label']`, each slot gets independent base + variant styles. Generates `<recipe>__<slot>--<variant>` class names.

**Key pattern — Slot Recipes**:
```ts
defineSlotRecipe({
  className: 'checkbox',
  slots: ['root', 'control', 'label'],
  base: {
    root: { display: 'flex', gap: '2' },
    control: { borderWidth: '1px' },
    label: { marginStart: '2' }
  },
  variants: {
    size: {
      sm: { control: { width: '8' }, label: { fontSize: 'sm' } },
      md: { control: { width: '10' }, label: { fontSize: 'md' } }
    }
  }
})
```

**Key pattern — Compound Variants**: Apply rules when multiple variant values combine:
```ts
compoundVariants: [{ size: 'sm', isChecked: true, css: { control: { borderColor: 'green.500' } } }]
```

**Key pattern — splitVariantProps**: Separates variant props from HTML props at component boundary.

**Key pattern — Presets**: Package tokens + recipes + utilities as a shareable preset. Apps `import { preset } from '@ds/panda-preset'` and everything works.

**Relevance to ColdLight**: ColdLight's `RecipeDefinition.classes(props) → Record<string, string>` is equivalent to a Panda slot recipe. The `DsSurfaceProps` is the variant API. This pattern is CORRECT — it just needs to be wired.

---

### 2. Radix Themes — Token Pipeline + Component Architecture

**Source**: [deepwiki.com/radix-ui/themes](https://deepwiki.com/radix-ui/themes/1-overview)

**Token Architecture — 3 layers**:
1. **Base colors**: `@radix-ui/colors` provides 25 color scales × 12 steps
2. **Semantic mapping**: `[data-accent-color='blue'] { --accent-1: var(--blue-1); }` — data attributes remap tokens
3. **Component consumption**: `.rt-Card { background-color: var(--color-panel); }`

**Theme Component**: Wraps app, applies config via data attributes: `data-accent-color`, `data-gray-color`, `data-appearance`, `data-panel-background`. No JS recompilation needed — CSS custom properties cascade.

**Component prop pattern**:
```
Component (forwardRef)
  → extractProps() splits: component props / margin props / layout props / HTML props
  → classnames() generates: rt-ComponentName + rt-variant-* + rt-r-size-*
```

**CSS output structure**: Separate files — `tokens.css`, `components.css`, `utilities.css` — for fine-grained import control.

**Build**: esbuild for JS, PostCSS for CSS (postcss-import, postcss-nesting, postcss-custom-media, autoprefixer).

**Relevance to ColdLight**: Radix's `data-accent-color` + CSS variable remapping is analogous to ColdLight's `data-kind`/`data-slot` attribute system. The separate CSS output approach (tokens.css / components.css) matches ColdLight's `index.css` importing molecules. ColdLight already has this architecture — it's more advanced in the taxonomy/contract layer.

---

### 3. Stitches — Variant/Compound Variant System

**Source**: [stitches.dev/docs/variants](https://stitches.dev/docs/variants)

**Key innovations**:
- **Smart tokens**: 14 token types auto-map to CSS properties (colors to `color/backgroundColor`, space to `margin/padding`, etc.)
- **Compound variants**: First-class. `{ size: 'sm', color: 'violet', css: { ... } }` applies when both match.
- **Typed variants**: Full TypeScript inference — variant props are auto-typed from the definition.
- **Near-zero runtime**: Styles extracted statically where possible.

**Relevance to ColdLight**: ColdLight's `DsSurfaceProps` maps directly to Stitches' variant concept. The typed token types (`AccentToken`, `GlowToken`, etc.) provide the same compile-time safety. ColdLight's recipe `classes()` function is the equivalent of Stitches' `css()` function output.

---

### 4. Vanilla Extract + Sprinkles — Type-Safe Compile-Time CSS

**Source**: [vanilla-extract.style](https://vanilla-extract.style/)

**Architecture**:
- Zero runtime — all CSS generated at build time into static `.css` files
- TypeScript as the authoring language (`.css.ts` files)
- Sprinkles: declarative config → atomic class system with full type safety
- Theme contracts: `createThemeContract()` defines the shape, `createTheme()` fills values

**Key pattern — Theme Contracts**:
```ts
const vars = createThemeContract({ color: { brand: null, accent: null }, space: { small: null } });
const theme = createTheme(vars, { color: { brand: 'blue', accent: 'teal' }, space: { small: '4px' } });
```

**Relevance to ColdLight**: ColdLight's `tokens.ts → ds-tokens-build.ts → tokens.css` is the same pipeline as Vanilla Extract's theme contract → theme → CSS. The TypeScript-first approach matches. ColdLight's pipeline is already more advanced because it outputs both `:root` vars AND `@theme` block for TW4 integration.

---

### 5. Builder.io / Mitosis — Visual Compiler Patterns

**Source**: [github.com/BuilderIO/mitosis](https://github.com/BuilderIO/mitosis), [deepwiki.com/BuilderIO/mitosis](https://deepwiki.com/BuilderIO/mitosis)

**Architecture**: Write once → compile everywhere via JSON Intermediate Representation:
```
Source (.lite.tsx) → Parser → MitosisComponent JSON → Plugins → Generator → Framework output
```

**MitosisComponent IR**:
```ts
{ name, imports, state, context, refs, hooks, children: MitosisNode[], meta }
MitosisNode { name, bindings, properties, children, slots }
```

**Key pattern — JSON as universal component format**: Components decompose to a serializable tree. Generators consume the tree to produce framework-native code. This is exactly what a VPB needs — a block tree serialized as JSON, compiled to Svelte components.

**Key pattern — Bidirectional**: Builder.io visual editor → Mitosis IR → code. Code → Mitosis IR → visual editor. Design and code stay in sync.

**Svelte generator**: Converts `useStore` → reactive vars, `For` → `{#each}`, `Show` → `{#if}`, event handlers → inline listeners.

**Relevance to ColdLight VPB**: VPB's `BlockNode` tree is conceptually the same as Mitosis's `MitosisComponent` IR. The VPB could generate Svelte output from block trees using a similar generator pattern. Blocks define kind + recipe + props + slot children → generator produces `<Component class={recipe.classes(props).root}>` output.

---

### 6. Plasmic — Visual Design Compiler

**Source**: [github.com/plasmicapp/plasmic](https://github.com/plasmicapp/plasmic)

**Architecture**: Visual builder that outputs clean React code. Key capabilities:
- Drag/drop existing components from codebase into visual editor
- Figma import → DOM/CSS
- Code generation: produces actual component files, not runtime abstractions
- Headless API OR codegen — developer chooses

**Key pattern — Component registration**: Developers register their own components so the visual builder knows about them. The builder then lets designers compose registered components visually.

**Relevance to ColdLight VPB**: VPB should follow Plasmic's registration model — ColdLight components (Panel, Dialog, Tabs) register themselves with the VPB taxonomy. The VPB palette is generated FROM the taxonomy, not hardcoded. This is exactly what `paletteGroups` in Builder.svelte should be doing — reading from the taxonomy registry.

---

### 7. Style Dictionary — Enterprise Token Management

**Source**: [github.com/style-dictionary/style-dictionary](https://github.com/style-dictionary/style-dictionary), [styledictionary.com](https://styledictionary.com/)

**Architecture**: Token JSON → build transforms → platform outputs (CSS, iOS, Android, JS, etc.)

**Pipeline**:
1. Define tokens as JSON (platform-agnostic)
2. Configure transforms per platform (CSS: `size/rem`, `color/css`, etc.)
3. Build step generates platform-specific token files
4. CI/CD validates, transforms, distributes tokens

**Key pattern — Token references**: Tokens can reference other tokens: `{ color: { primary: { value: "{color.blue.500}" } } }`. Resolved at build time.

**Key pattern — W3C Design Tokens Format**: Moving toward the W3C Community Group standard for token interchange.

**Relevance to ColdLight**: ColdLight's `tokens.ts → ds-tokens-build.ts → tokens.css` pipeline IS a Style Dictionary analog. The `ds-tokens-build.ts` script is the transform step. ColdLight is already doing this correctly — it just needs the build to be in CI/CD.

---

### 8. Figma Variables → Code

**Source**: [designsystemscollective.com/design-system-mastery-with-figma-variables](https://www.designsystemscollective.com/design-system-mastery-with-figma-variables-the-2025-2026-best-practice-playbook-da0500ca0e66)

**2025-2026 developments**:
- Composite/Array variables (shadow, border, animation states)
- Expression variables (conditional/computed) — 2026 beta
- Figma CSS Variables Converter plugin → OKLCH + rem-based output
- "Code syntax: Web" field maps variable names to token names for AI code generation

**Key pattern — Figma → Git → CI/CD**: Export Figma variables as W3C JSON tokens → commit to Git → CI/CD runs Style Dictionary → generates CSS custom properties → deployed to app.

**Relevance to ColdLight**: ColdLight's OKLCH-first token system with CSS custom properties is exactly what Figma Variables exports to. The pipeline is Figma-ready. When Figma integration is needed, the output plugs directly into `tokens.ts`.

---

### 9. Open Props — CSS Custom Properties System

**Source**: [open-props.style](https://open-props.style/), [github.com/argyleink/open-props](https://github.com/argyleink/open-props)

**Architecture**: Ship a massive set of CSS custom properties (not utility classes). Developers use standard CSS selectors and reference the props. JIT compiler strips unused props.

**Key features**:
- OKLCH color spaces
- Container queries, CSS layers
- Open Props UI: copy-paste components using the token system
- No framework dependency — pure CSS

**Relevance to ColdLight**: ColdLight's tokens.css IS an Open Props-style custom properties system, but scoped to DevPulse's design language. The `@theme` block additionally integrates with TW4 for utility generation. ColdLight is doing both — pure CSS properties AND utility class generation.

---

## Codebase Analysis — ColdLight As It Exists NOW

### Layer Inventory

| # | Layer | Location | Files | Status |
|---|-------|----------|-------|--------|
| 1 | **Tokens** | `tokens/tokens.ts` → `ds-tokens-build.ts` → `tokens.css` | 3 + `types.ts` | Working. Build generates `:root` + `@theme`. Types auto-generated. |
| 2 | **Molecules** | `molecules/glass.css`, `bevel.css`, `glow.css`, `depth.css` | 4 | Working. `@utility` classes with shadow layering via `--_shadow-*`. |
| 3 | **Primitives** | `primitives/` — 42 primitive folders | 42 dirs, each with `index.ts` + `types.ts` | Exist. Unstyled, accessible. `data-slot`/`data-kind` attributes. MeltUI adapter-backed. |
| 4 | **Taxonomy** | `taxonomy/kinds/primitives/` — 42 kind definitions | 42 dirs with `contract.ts` + `types.ts` | Exist. Slot names, state tokens, ARIA specs per kind. Scanner validates parity. |
| 5 | **Recipes** | `recipes/components/` — panel(4), dialog(1), combobox(1), tabs(1) + `layouts/shell/` — app(1), chat(1) | 9 recipes total | Exist. `DsSurfaceProps → Record<string, string>`. Recipe utils (surfaceClass, etc.) work correctly now. |
| 6 | **Blueprints** | `blueprints/components/` — panel(1), dialog(1), combobox(1), tabs(1) | 4 blueprints | Exist. Composition defaults + slot wiring metadata. |
| 7 | **Components** | `components/` — dialog, combobox, panel, tabs | 4 dirs with schema + context + test + types | Exist. Zod-validated ARIA enforcement, slot contracts, keyboard maps. |
| 8 | **Blocks** | `blocks/dialogs/index.ts` | 1 file | Minimal. Page-level compositions. |
| 9 | **API/Adapters** | `api/adapters/coldlight/` (dialog, tabs transport) + `api/adapters/meltui/` (combobox) | ~15 files | Exist. ColdLight native adapter (dialog, tabs) + MeltUI adapter (combobox). |
| 10 | **Config** | `coldlight.config.ts` + `config/coldlight/` (7 config fragments) + `surface.config.ts` | 9 files | Exist. Identity, roots, adapters, generation, enforcement, attributes, vocabularies. |
| 11 | **Patterns** | `patterns/data/`, `patterns/forms/`, `patterns/search/` | 3 dirs with index.ts | Minimal stubs. |
| 12 | **Plugins** | `plugins/parasite/index.ts` | 1 file | Exists. Purpose unclear without reading. |
| 13 | **Actions** | `api/actions/aria.ts`, `aria-link.ts` | 2 files | ARIA action utilities. |
| 14 | **Design Docs** | `COLDLIGHT.md`, various `.claude/` sprint docs | Many | Mixed quality. Some reference dead patterns (`dp-surface`). |

### Registration Wiring Status

```
components/index.ts (BARREL — side-effect imports trigger registration):
  ├── recipes/components/dialog/index.js     ✅ imported
  ├── blueprints/components/dialog/index.js  ✅ imported
  ├── recipes/components/combobox/index.js   ✅ imported
  ├── blueprints/components/combobox/index.js ✅ imported
  ├── recipes/components/tabs/index.js       ✅ imported
  ├── blueprints/components/tabs/index.js    ✅ imported
  ├── recipes/components/panel/index.js      ✅ imported
  ├── blueprints/components/panel/index.js   ✅ imported
  └── recipes/layouts/shell/index.js         ✅ imported

routes/+layout.svelte:
  └── import "$lib/design/components/index.js"  ❓ NEEDS VERIFICATION
```

### What's Working

1. **Token pipeline**: `tokens.ts` → build script → `tokens.css` with `:root` + `@theme`. TW4 generates utilities from `@theme` vars.
2. **Molecule shadow layering**: `glass-void` + `bevel-subtle` + `glow-teal` compose via `--_shadow-*` vars sharing one `box-shadow` formula.
3. **Recipe system**: `registerRecipe()` → `getRecipe()` → `classes(DsSurfaceProps)` → `Record<string, string>`. Type-safe.
4. **Recipe utils**: `surfaceClass("glass", "void")` → `"glass-void"`. `depthClass(3)` → `"depth-elevated"`. `bevelClass("subtle")` → `"bevel-subtle"`. All correct.
5. **Taxonomy contracts**: 42 primitives with slot names, state tokens, ARIA requirements. Scanner validates primitive↔taxonomy parity at build time.
6. **Config system**: Comprehensive typed config with identity, roots, adapters, generation, enforcement, attributes.

### What's Broken/Missing

1. **Recipe registration may not be wired at app root** — need to verify `+layout.svelte` imports `components/index.js`
2. **No recipes for 38 of 42 primitives** — only panel, dialog, combobox, tabs have recipes. Accordion, button, card, checkbox, etc. have taxonomy contracts but no styling recipes.
3. **Layouts don't consume recipes** — `Frame.svelte` files don't call `getRecipe()`. They use hand-wired classes (some corrected this session to use molecule names + token vars, but not recipe-driven).
4. **VPB disconnected from taxonomy** — VPB Builder palette is hardcoded, not generated from the taxonomy registry. VPB Inspector uses hardcoded token lists, not the typed token enums.
5. **Documentation stale** — COLDLIGHT.md, STYLE_GUIDE.md, AUTHORING.md reference dead patterns (`dp-surface`, `--dp-*`, `.dp-surface[data-surface="glass"]`).
6. **No compound variants** — Recipes only support flat `DsSurfaceProps`. No `compoundVariants` like Panda CSS (e.g., "when surface=glass AND glow=teal, add extra ring").
7. **No responsive variant support** — Recipes produce static class strings. No `{ size: { base: 'sm', md: 'lg' } }` conditional.
8. **Patterns layer empty** — `patterns/data/`, `patterns/forms/`, `patterns/search/` are stubs.
9. **Blocks layer minimal** — only `blocks/dialogs/index.ts` exists.
10. **No Figma export pipeline** — tokens exist in TS, no W3C JSON interchange format.

---

## Synthesis — Actionable Patterns for TW4 + SvelteKit 5

### Pattern A: Panda CSS Slot Recipes → ColdLight Recipes (ALREADY ALIGNED)

ColdLight's `RecipeDefinition` IS a slot recipe:
```
Panda:     defineSlotRecipe({ slots, base, variants, compoundVariants })
ColdLight: { id, kind, classes: (props) => Record<slot, classString> }
```

The key difference: Panda generates CSS at build time. ColdLight generates class strings at runtime that reference TW4 utilities + `@utility` molecules already in the CSS. **This is fine** — ColdLight's approach means zero build step for recipes, just TW4's standard CSS processing.

**Action**: Keep ColdLight's recipe pattern. Add `compoundVariants` support later if needed.

### Pattern B: Radix Themes Data Attributes → ColdLight Data Attributes (ALREADY ALIGNED)

Both use `data-*` attributes for theme/style switching:
```
Radix:     [data-accent-color='blue'] remaps --accent-* tokens
ColdLight: [data-kind='dialog'][data-slot='content'] identifies elements for recipe styling
```

**Action**: Keep ColdLight's `data-kind`/`data-slot` attribute system. It's the right pattern.

### Pattern C: Mitosis IR → VPB Block Tree (NATURALLY ALIGNED)

Mitosis: `MitosisComponent { name, state, children: MitosisNode[] }` → generators → framework output
VPB: `BlockNode { id, kind, recipe, props, slots: Record<string, BlockNode[]> }` → renderer → Svelte output

**Action**: VPB block tree is already the right shape. The renderer should consume recipes: `getRecipe(block.recipe).classes(block.props)` per slot. Generators can produce Svelte component code from block trees.

### Pattern D: Plasmic Component Registration → ColdLight Taxonomy (ALREADY ALIGNED)

Plasmic: Register components with the visual builder. Builder discovers them.
ColdLight: Taxonomy defines kinds with contracts. VPB should discover kinds from taxonomy.

**Action**: VPB palette should be generated from `getPrimitiveKinds()` + `getRecipesForKind()`, not hardcoded.

### Pattern E: Style Dictionary Pipeline → ColdLight Token Pipeline (ALREADY DONE)

Both: Source of truth (TS/JSON) → build transform → platform output (CSS custom properties).

**Action**: ColdLight's pipeline works. Add CI/CD step to run `ds-tokens-build.ts` on commit. Add W3C JSON export when Figma integration is needed.

### Pattern F: Vanilla Extract Theme Contracts → ColdLight Token Types (ALREADY DONE)

Both: TypeScript-defined token contracts → compile-time type safety → CSS output.

ColdLight's `tokens/types.ts` with `AccentToken`, `SurfaceToken`, etc. IS a theme contract. The auto-generation from `tokens.ts` ensures parity.

**Action**: Keep. This is correct.

---

## Recommendations

### ColdLight is already architecturally ahead of most systems.

The foundation exists:
- **Token pipeline**: Complete and working (tokens.ts → build → tokens.css → TW4)
- **Molecule layer**: Working with composable shadow layering
- **Recipe system**: Correctly typed, registration exists
- **Taxonomy/contracts**: 42 primitives with full ARIA/slot/state contracts
- **Adapter system**: ColdLight native + MeltUI adapters
- **Config system**: Comprehensive typed configuration

### What needs to happen (in priority order):

1. **Wire recipe registration at app root** — verify/add `import "$lib/design/components/index.js"` in `+layout.svelte`
2. **Make layouts consume recipes** — Frame.svelte files call `getRecipe()`, apply per-slot classes
3. **Fix stale documentation** — purge `dp-surface` references, update to current patterns
4. **Expand recipe coverage** — add recipes for more primitives (button, card, input, etc.)
5. **Connect VPB to taxonomy** — palette generated from registry, not hardcoded
6. **Add compound variant support to recipes** — optional enhancement
7. **CI/CD token build** — run `ds-tokens-build.ts` in CI pipeline
8. **Clean documentation layer** — COLDLIGHT.md, STYLE_GUIDE.md, AUTHORING.md

---

## Files Referenced

### Core System
- `design/index.ts` — public API barrel (exports recipes, blueprints, taxonomy)
- `design/index.css` — CSS entry point (imports molecules)
- `design/coldlight.config.ts` — config orchestrator
- `design/surface.config.ts` — surface types, variants, states

### Token Layer
- `design/tokens/tokens.ts` — SSOT token definitions
- `design/tokens/tokens.css` — generated CSS vars + @theme
- `design/tokens/types.ts` — auto-generated TypeScript token types

### Molecule Layer
- `design/molecules/glass.css` — glass @utility definitions (4 variants)
- `design/molecules/bevel.css` — bevel @utility definitions (3 variants)
- `design/molecules/glow.css` — glow @utility definitions (6 variants)
- `design/molecules/depth.css` — depth @utility definitions (4 variants + frame-bevel + neumorphic)

### Recipe Layer
- `design/recipes/index.ts` — registry (registerRecipe, getRecipe, getRecipesForKind)
- `design/recipes/types.ts` — DsSurfaceProps, RecipeDefinition, RecipeLegend
- `design/recipes/utils.ts` — surfaceClass, radiusClass, depthClass, glowClass, bevelClass
- `design/recipes/components/panel/panel.default.ts` — example recipe
- `design/recipes/layouts/shell/shell.app.ts` — app shell recipe
- `design/recipes/layouts/shell/shell.chat.ts` — chat shell recipe

### Blueprint Layer
- `design/blueprints/types.ts` — BlueprintDefinition, SlotWiring
- `design/blueprints/index.ts` — registry (registerBlueprint, getBlueprint)

### Component Layer
- `design/components/index.ts` — barrel with side-effect recipe/blueprint registration
- `design/components/schema.ts` — Zod-based ARIA enforcement
- `design/components/{dialog,combobox,panel,tabs}/` — 4 composed components

### Taxonomy Layer
- `design/taxonomy/index.ts` — barrel (kinds, registry, scanner, types)
- `design/taxonomy/kinds/primitives/` — 42 primitive kind contracts
- `design/taxonomy/registry.ts` — runtime manifest access
- `design/taxonomy/scanner.ts` — build-time parity checking

### API/Adapter Layer
- `design/api/adapters/coldlight/` — native adapter (dialog, tabs transport)
- `design/api/adapters/meltui/` — MeltUI adapter (combobox)
- `design/api/actions/` — ARIA utilities

### Config Layer
- `design/config/coldlight/types.ts` — ColdLightConfig type
- `design/config/coldlight/{identity,roots,adapters,generation,enforcement,attributes,vocabularies}.cfg.ts`

### Primitive Layer
- `design/primitives/` — 42 primitive folders (accordion through visually-hidden + tanstack)
