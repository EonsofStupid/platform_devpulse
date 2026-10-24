# Research: ColdLight Unified Catalog

**Date**: 2026-03-02
**Sprint**: SPRINT-COLDLIGHT-UNIFIED-CATALOG
**Status**: COMPLETE

## Question/Goal

Align all 29 component files to the owner's vision: config-driven, schema-driven, ID-cataloged design system where every component is DEFAULT STYLED from the unified token registry the moment it's created. Delete the redundant ui/ layer. Components ARE the public API.

## Codebase Analysis

### Foundation Status (VERIFIED FUNCTIONAL)

| System | File | Status |
|--------|------|--------|
| Config | `coldlight.config.ts` | WORKING — 8 fragments, Zod-validated |
| Token Categories | `registry/token-categories.ts` | WORKING — 59 values, 8 axes, CSS tokenRefs |
| resolveVisual() | `registry/resolve-visual.ts` | WORKING — 4-layer pipeline |
| Presets | `registry/presets.ts` | WORKING — 50+ presets, wired via registerPresetLookup() |
| useColdLight() | `components/_base/use-coldlight.svelte.ts` | WORKING — Svelte 5 $derived rune |
| ColdLightProps | `components/_base/types.ts` | WORKING — 8-axis interface |
| SD5 Pipeline | `tokens/tokens.ts`, `semantic.ts`, `components.ts` | WORKING — DTCG 1.0, 3-tier |
| Variant CSS | `generated/variants.css` | WORKING — 59 @utility rules |
| Scanner | `scanner.ts` | WORKING — 850 lines, contract-aware |

### Current Broken State

The previous session:
1. STRIPPED `useColdLight()`, `ColdLightProps`, and recipes from 29 component .svelte + types.ts files
2. Created 29 redundant `[DELETED — components/{kind}/ IS the product]` wrapper folders (87 files)
3. Broke 9 test files (visual props passed to stripped components)
4. Left `design/index.ts` importing from `./ui/index.js` instead of `./components/`

### Per-Component Audit (from ui/ wrappers)

| Kind | Default Preset | Default Radius | Size Types | Intent/Variant Types |
|------|---------------|----------------|------------|---------------------|
| alert | `panel-glass` | `lg` | — | AlertIntent: info/success/warning/error |
| avatar | (none) | `full` | sm/md/lg | — |
| badge | via BADGE_INTENT_PRESETS | `full` | sm/md/lg | BadgeIntent: default/info/success/warning/error |
| banner | via BANNER_INTENT_PRESETS | `md` | — | BannerIntent: info/success/warning/error |
| box | (none) | `none` | — | — |
| button | via BUTTON_INTENT_PRESETS | `lg` | sm/md/lg | ButtonIntent: primary/secondary/ghost/danger |
| callout | via CALLOUT_VARIANT_PRESETS | `md` | — | CalloutVariant: info/success/warning/error/tip |
| card | via CARD_VARIANT_PRESETS | `lg` | sm/md/lg | CardVariant: default/outlined/elevated/ghost/glow |
| checkbox | `input-default` | `sm` | sm/md/lg | CheckboxIntent: default |
| code | `code-inline`/`code-block` | `sm`/`md` | — | CodeLanguage |
| container | (none) | — | sm/md/lg/xl | — |
| empty-state | (none) | `md` | sm/md/lg | — |
| grid | (none) | — | — | GridColumns/GridGap/GridRows |
| heading | `heading-default` | — | xs/sm/base/lg/xl/2xl/3xl | HeadingLevel: 1-6 |
| hstack | (none) | — | — | HStackGap/HStackAlign/HStackJustify |
| inline-message | (none) | `md` | — | InlineMessageTone |
| input | `input-default` | `md` | sm/md/lg | — |
| kbd | `kbd-default` | `sm` | sm/md/lg | — |
| label | `label-default` | — | sm/md/lg | — |
| progress | (none) | `full` | sm/md/lg | — |
| separator | `divider-default` | `none` | — | SeparatorVariant: solid/dashed/dotted |
| skeleton | `skeleton-default` | — | — | SkeletonVariant: text/circular/rectangular |
| spinner | `spinner-default` | — | sm/md/lg | — |
| stack | (none) | — | — | StackGap/StackAlign |
| stat | `stat-default` | `md` | sm/md/lg | — |
| switch | `input-default` | `full` | sm/md/lg | — |
| text | `text-default` | — | xs/sm/base/lg/xl/2xl/3xl | TextColor/TextWeight/TextAs |
| textarea | `textarea-default` | `md` | sm/md/lg | — |
| toggle | (none) | — | sm/md/lg | — |

All 29 components have `contract.ts` files.

## Findings

1. **The foundation is solid.** Every infrastructure piece (config, registry, presets, resolveVisual, useColdLight, SD5 pipeline, variant CSS, scanner) is functional and follows real-world patterns.

2. **The damage is in the component layer.** 29 components were stripped of their visual connection to the foundation, and 29 redundant ui/ wrappers were created.

3. **The fix is to merge ui/ logic INTO components/ and delete ui/.** Each component needs: `useColdLight()` + `ColdLightProps` + recipe + default preset from registry. This is what the ui/ wrappers already do — the logic just needs to live in the component, not a wrapper.

4. **Every component has a contract.ts.** Scanner can enforce required files.

5. **9 tests are broken.** They pass visual props (intent, size, variant) to stripped components.

## Recommendations

1. For each of the 29 components: merge the ui/ wrapper's visual logic into the component .svelte and types.ts
2. Delete the entire ui/ directory
3. Update design/index.ts to export from components/ directly
4. Fix broken tests
5. Verify with `pnpm svelte-check`

## Files Referenced

- `components/_base/types.ts` — ColdLightProps interface, ComponentDefaults
- `components/_base/use-coldlight.svelte.ts` — useColdLight() rune
- `registry/presets.ts` — 50+ system presets
- `registry/resolve-visual.ts` — resolveVisual() pipeline
- `registry/token-categories.ts` — 8-axis SSOT
- `coldlight.config.ts` — Master config
- `scanner.ts` — Contract-aware scanner
- `design/index.ts` — Public barrel (currently imports from ui/)
- `ui/index.ts` — Redundant barrel (to be deleted)
- All 29 `[DELETED — components/{kind}/ IS the product]` directories (to be deleted)
- All 29 `components/{kind}/` directories (to be fixed)
