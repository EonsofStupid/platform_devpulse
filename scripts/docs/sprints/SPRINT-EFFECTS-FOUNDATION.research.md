# Research: ColdLight Effects Foundation — Unified Transition + Motion System

**Date**: 2026-03-01
**Sprint**: SPRINT-EFFECTS-FOUNDATION
**Status**: COMPLETE

## Question/Goal

Build the complete ColdLight effects foundation that:
1. Unifies **transitions** (interactive: hover, focus, active) and **motion** (non-interactive: keyframe animations) into ONE composable, schema-driven system
2. Makes EVERY Tailwind v4 visual effect available during dev as composable ColdLight tokens
3. VPB exposes all of it via layman-friendly UI: presets, sliders, inputs with suggestions, dropdowns — multiple build/edit modes
4. Every CSS effect flows through the pipeline: raw capability → Tier 1 token → Tier 2 composable axis → Tier 3 preset → VPB consumption

## Codebase Analysis — What Exists

### Token Layer (Tier 1) — PARTIAL

**EXISTS:**
| File | Content | Status |
|------|---------|--------|
| `tokens/motion/duration.ts` | 6 durations: snap(50ms), fast(150ms), normal(250ms), smooth(400ms), glacial(700ms), moderate(3s) | COMPLETE |
| `tokens/motion/easing.ts` | 6 curves: linear, in, out, inOut, spring, bounce | COMPLETE |
| `tokens/motion/keyframes.ts` | 5 animations: pulse-glow, breathe, shimmer, drift, pulse + their @keyframes bodies | PARTIAL |
| `tokens/effects/blur.ts` | 6 blur values | COMPLETE |
| `tokens/effects/shadow.ts` | 5 shadow levels | COMPLETE |
| `tokens/effects/glow.ts` | 7 glow colors + 4 spread values | COMPLETE |
| `tokens/effects/bevel.ts` | 4 bevel levels | COMPLETE |

**MISSING Tier 1 tokens for full Tailwind effect coverage:**
| Gap | What It Covers | Why Needed |
|-----|---------------|------------|
| Opacity tokens | 0, 5, 10, 20, 40, 60, 80, 100 | Material transparency control — z axis currently hardcodes opacity |
| Transform tokens | scale, translate, rotate values | Interactive hover/press effects need named transforms |
| Filter tokens | brightness, contrast, saturate values | Material effects hardcode these — should be tokens |
| Additional keyframes | fade-in, slide-up, slide-down, scale-in, slide-left, slide-right, blur-in, rotate-in | More entrance/exit animations for VPB |

### Encoding System (Tier 2) — EXISTS, NEEDS FIXES

**`registry/token-categories.ts`** — 8 categories, 52 values total:
- `s` Surface (8) — WORKING
- `z` Material (10) — WORKING but tokenRefs use hardcoded values, should reference Tier 1
- `d` Depth (5) — WORKING
- `b` Bevel (5) — WORKING
- `g` Glow (7) — WORKING
- `f` Frame (5) — WORKING
- `m` Motion (5) — WORKING, maps to `--animate-*` tokens
- `t` Transition (7) — WORKING, maps to duration + easing token combos

**`generated/variants.css`** — The @utility CSS output:
- All 52 values have @utility blocks
- 4 were empty (v-z0, v-b0, v-g0, v-m0) — fixed with `--v-z: 0` / `box-shadow: none` / `animation: none` placeholders
- These utilities are what Tailwind v4 compiles

### Effects System — EXISTS, INCOMPLETE

**`effects/` directory structure:**
```
effects/
├── _schema/
│   ├── types.ts      # EffectDefinition, ComposedEffect, CompositorNode, etc.
│   └── schema.ts     # Zod validators for all effect types
├── categories/
│   ├── glass/        # 4 effects registered (void, deep, smoke, frost)
│   ├── depth/        # 7 effects (float, raised, elevated, lifted, neu-outset, neu-inset, frame-bevel)
│   ├── glow/         # 8 effects (6 colors + accent + track)
│   ├── bevel/        # 6 effects (3 CSS + 3 SVG)
│   └── motion/       # 4 effects ONLY (hover-lift, press-down, fade-in, pulse-glow)
├── registry.ts       # Map-based, registerEffect/getEffect/queries
└── index.ts          # Barrel
```

### Generated CSS — EXISTS

**`generated/keyframes.css`** has 10 @keyframes:
- 5 from tokens: pulse-glow, cl-breathe, cl-shimmer, cl-drift, cl-pulse
- 5 additional: fade-in, slide-up, slide-down, scale-in, spin

### What's MISSING

#### 1. Missing Effect Categories in `effects/categories/`

The effects system has 5 categories (glass, depth, glow, bevel, motion) but is missing:

| Missing Category | What It Should Contain | Why |
|-----------------|----------------------|-----|
| **transition** | Hover states, focus rings, active presses, disabled states | Interactive effects are fundamentally different from idle animations |
| **transform** | Scale, rotate, translate, skew effects | Composable transform effects for VPB |
| **filter** | CSS filter effects (blur, brightness, contrast, saturate, grayscale, sepia) | Visual processing effects beyond shadow/glow |
| **entrance** | Fade-in, slide-in, scale-in, blur-in with intersection/state triggers | Page/component entrance animations |
| **exit** | Fade-out, slide-out, scale-out reverse animations | Component exit animations |

#### 2. Motion Category Is Anemic

Only 4 effects registered when the scope docs describe a rich system:
- Missing: fade variants, slide variants, scale variants, blur-in, rotate
- Missing: combine transforms with opacity for entrance/exit
- Missing: attention animations (shake, wiggle, bounce, jiggle)
- Missing: loading animations (skeleton pulse, spinner, progress)

#### 3. Transition Category Doesn't Exist As Effects

The `t` encoding axis handles transition *timing* (duration + easing combos), but there are NO registered effects for:
- Hover brightness/opacity shifts
- Focus ring animations
- Active state transforms (press down, scale)
- Disabled state styling
- These are ALL in the scope doc's "Interactive State Tokens" section

#### 4. No Effect ↔ Encoding Bridge

The effects system (ComposedEffect, EffectDefinition) and the encoding system (token-categories.ts) are **two separate systems with no bridge**:
- Effects system: declarative effect objects with classes/triggers/composition
- Encoding system: numeric indices mapping to CSS tokenRefs
- They should be ONE unified system where VPB can work with either

## Alignment Check — MASTER-PLAN vs Scope Docs

### What MASTER-PLAN Says

From Section 23 (Foundation Requirements F):
> "VPB has popup overlay modals per category with specific sliders and inputs — surface picker, depth slider, glow color, bevel intensity, **motion curve, transition timing**. Each category gets its own UI panel."

From Variant Key System (line 653-655):
> | `t` | `--v-transition` | 0ms | 50ms | 150ms | 250ms | 400ms |
> | `m` | `--v-motion` | none | ease-out | ease-inOut | spring | bounce |

From DsSurfaceProps (line 580):
> `motion: { hover?: MotionToken; enter?: MotionToken; ambient?: MotionToken };`

### What Scope Doc Says

The Token-to-Props doc explicitly states:
1. **Every CSS capability gets a token** — "If Tailwind has a utility for it, ColdLight has a token backing it"
2. **185+ Tier 1 tokens** covering ALL visual domains
3. **4 equivalent consumption paths** — Props, Preset, Encoding, Tailwind classes
4. **VPB controls map** with specific UI widgets per category
5. **Full domain map** listing every Tailwind utility that should be token-backed

### Where They ALIGN

- Both agree on 8+ composable axes (s, z, d, b, g, f, m, t + l pending)
- Both agree on SD5 pipeline generating everything
- Both agree on Zod validation at every boundary
- Both agree VPB reads manifest for its palette
- Both agree effects compose via class strings

### Where They DIVERGE / Are Incomplete

1. **MASTER-PLAN's DsSurfaceProps** has `motion: { hover?, enter?, ambient? }` — 3 sub-props — but the encoding system just has a single `m` axis with 5 values. These need to unify.

2. **Scope Doc's "Full Domain Map"** lists ~185 tokens but the codebase only has ~120 actually implemented. Missing: font-weight, line-height, letter-spacing, opacity, extended spacing, transforms, filters.

3. **Neither document** defines how the effects system (`effects/categories/`) bridges to the encoding system (`token-categories.ts`). The effects registry is a SEPARATE system from the encoding knobs.

## Recommendations

### The Unified Architecture

The two systems (effects + encodings) serve different but complementary purposes:

**Encoding system** = the 8 composable KNOBS. Each knob has N discrete values. VPB exposes these as sliders/selects. Output: `v-s1z2d3` classes.

**Effects system** = the composable BUILDING BLOCKS. Each effect declares CSS classes, triggers, conflict groups. VPB exposes these as drag-and-drop palette items. Output: composed class strings + Svelte actions.

**UNIFIED**: Encoding knobs ARE effects. Each encoding value maps to an EffectDefinition. VPB can work at either level:
- **Knob mode** (layman): pick from dropdown/slider per category
- **Composer mode** (advanced): drag individual effects onto nodes

### Implementation Priority

1. **Complete Tier 1 tokens** — fill ALL gaps (opacity, transforms, filters, font-weight, etc.)
2. **Add missing effect categories** — transition, transform, filter, entrance, exit
3. **Expand motion category** — all animation variants
4. **Bridge encoding ↔ effects** — each encoding value references an EffectDefinition
5. **Fix variants.css empty utilities** — use `--v-{code}: 0` pattern
6. **Regenerate all CSS** via SD5 pipeline after token additions

## Files Referenced

| File | Why Relevant |
|------|-------------|
| `registry/token-categories.ts` | SSOT for 8 composable axes — needs `l` axis added |
| `effects/_schema/types.ts` | Effect type definitions — EFFECT_CATEGORIES needs expansion |
| `effects/_schema/schema.ts` | Zod validators — update when categories expand |
| `effects/registry.ts` | Effect registration — infrastructure is solid |
| `effects/categories/motion/index.ts` | Only 4 effects — needs 20+ |
| `tokens/motion/*.ts` | Duration/easing/keyframes — need expansion |
| `generated/variants.css` | @utility blocks — empty ones need fixes |
| `generated/keyframes.css` | 10 keyframes — needs more |
| `config/coldlight/tokens.cfg.ts` | Theme mappings — needs new domains |
| `MASTER-PLAN.md` | Phase 6 (Variant Key System) is where this lands |
| `index.css` | CSS barrel — order matters for specificity |
