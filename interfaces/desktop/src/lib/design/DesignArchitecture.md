# ColdLight — Design Architecture

> Complete architecture for the DevPulse design system.

---

## THE COMPOSABLE VISUAL SYSTEM (CORE CONCEPT)

ColdLight's visual system is an 8-axis encoding that maps named values to CSS custom properties. Every component resolves through this pipeline:

```
Props (intent, surface, glow, depth, ...)
  → Preset lookup (PRESET_MAP[intent])
  → useColdLight({ preset, ...overrides })
  → resolveVisual(input) → ResolvedVisual
  → cn(recipe(size), visual.segments, visual.radius)
  → DOM classes: "btn h-10 px-4 v-s1 v-d2 v-g1 rounded-lg"
```

### 8-Axis Encoding

| Code | Category | Values | CSS Property Set |
|------|----------|--------|-----------------|
| `s` | Surface | glass-void, glass-deep, glass-teal, etc. | background, backdrop-filter, opacity |
| `z` | Material | glass-subtle, matte-dark, metal-chrome | surface physics |
| `d` | Depth | z0–z4 | box-shadow (drop) |
| `b` | Bevel | off, subtle, soft, medium, strong | box-shadow (inset), SVG specular |
| `g` | Glow | off, teal, purple, ember, magenta, frost, cyber | box-shadow (glow emission) |
| `f` | Frame | off, soft, hard, glow, accent-teal, accent-purple | border |
| `m` | Motion | off, breathe, shimmer, drift, pulse, fade-in, slide-up, scale-in | animation |
| `t` | Transition | snap, fast, normal, smooth, spring, bounce | transition |

SSOT: `registry/token-categories.ts` → generates `variants.css`, Zod schemas, TypeScript types.

---

## Preset System

60+ named presets across 28 component kinds in `registry/presets.ts`.

Each preset = named 8-axis composition:
```typescript
{
  surface: "glass-deep",
  material: "glass-subtle",
  depth: "z2",
  bevel: "soft",
  glow: "teal",
  frame: "accent-teal",
  motion: "off",
  transition: "normal"
}
```

Lookup: `getPreset(id)`, `getPresetsForKind(kind)`, `getAllPresets()`

---

## Recipe System

32 registered recipes in `recipes/`. Each recipe = per-slot class strings:

```typescript
registerRecipe({
  id: "button.default",
  kind: "button",
  slots: {
    root: { base: "inline-flex items-center justify-center font-medium", visual: "all" },
    icon: { base: "shrink-0", visual: "none" },
    label: { base: "truncate", visual: "none" }
  },
  defaults: { size: "md" },
  variants: { size: { sm: { root: "h-8 px-3 text-sm" }, md: { root: "h-10 px-4" } } }
});
```

Resolution: `resolveRecipe(recipe, props)` → `Record<string, string>` (per-slot class strings).
Recipes handle LAYOUT ONLY (Tailwind classes). Visual styling flows through the encoding system.

---

## Component Pattern

```
components/{kind}/
├── {Kind}.svelte      — useColdLight() + cn(recipe(), visual.segments, visual.radius)
├── types.ts           — Props extending ColdLightProps, PRESET_MAP
├── contract.ts        — W3C ARIA spec (ComponentContract)
├── recipe.ts          — Structural layout (Tailwind, no tokens)
├── index.ts           — Barrel exports
└── {Kind}.test.ts     — Vitest browser tests
```

89 component kinds, 167 .svelte files. All use `useColdLight()` + `cn()` pattern.

---

## SVG Neumorphism Engine

NOT CSS approximations. Real SVG filter primitives:

- **Bevel**: `feSpecularLighting` with Phong lighting model (surfaceScale, specularConstant, lightPosition)
- **Glow**: `feFlood` + `feGaussianBlur` (shape-aware halo emission)
- **Noise**: `feTurbulence` + `feDisplacementMap` (surface grain texture)

One SVG filter replaces 6-8 layered CSS hacks. Parameterized via CSS custom properties. VPB generates sliders/knobs from filter manifest.

---

## VPB (Visual Page Builder)

VPB is a no-code visual editor. It reads:
- Token manifest → generates sliders/knobs for each token
- Preset registry → shows preset palette
- Recipe registry → shows recipe options
- Filter manifest → generates SVG filter controls

User workflow:
1. Select material preset (glass, metal, matte)
2. Adjust parameters via sliders/knobs
3. See optimized neumorphic output in real-time
4. Save as new preset or export code

**Junior devs never write CSS. They compose via VPB.**

---

## Materials System

Materials are **depth/elevation effects**, NOT color tokens:

| Material | What It Does |
|----------|-------------|
| **Glass** | backdrop-filter blur + saturation, semi-transparent fill, frosted edge |
| **Matte** | Solid dark fill, subtle grain, low reflection |
| **Metal** | Chrome/brushed/copper specular, SVG feSpecularLighting, multi-angle light |

Glass and matte cannot be fully captured in Style Dictionary. SD5 captures the raw values (colors, dimensions, shadows). The material system is a ColdLight runtime concern with registered props/types.

---

## Block System

```
blocks/
├── schema.ts         — BlockNode, BlockDocument (Zod-validated, serializable)
├── kinds.ts          — BLOCK_CATEGORIES (12 categories, 80+ kinds)
├── factory.ts        — Block rendering
├── widgets/          — RadialGauge, SparkLine (working)
├── chat/             — Chat frame, bubbles
├── dashboards/       — Dashboard layouts
├── navigation/       — Nav blocks
├── dialogs/          — Dialog blocks
├── carousels/        — Carousel blocks
├── cta/              — Call-to-action blocks
├── features/         — Feature blocks
└── heroes/           — Hero sections
```

Backgrounds (circuit-board, neural, void) → `recipes/backgrounds/` (TO BUILD as Svelte components).

---

## Reference Visual Quality

What ColdLight must produce (from reference images):

- **Dashboard**: Teal HUD with radial gauges, 4-5 layer glass panels, circuit board grid, 20-40px glow spread
- **Chat**: Purple-shifted neural grid, glass chat bubbles with accent bevel, text-shadow glow
- **Liquid Metal**: Chrome sphere with caustic specular lighting, metallic edge relief
- **CAG Hub**: Frosted glass nodes with directional glow halos, depth-of-field blur

**NOT**: 12px glows at 0.4 opacity, 1px borders, flat fills. **YES**: 20-40px glows at 0.6-0.8 opacity, gradient borders, multi-layer depth stacks, text-level neumorphism.

---

## Enforcement

Components use:
- Token CSS var references (via encoding system)
- Recipe-generated per-slot class strings
- v-* encoding utilities

Components NEVER contain:
- Raw color values (`#fff`, `oklch()`, `rgb()`)
- Arbitrary Tailwind values (`bg-[#000]`)
- Inline styles (`style="color: red"`)
- Hand-written CSS outside `design/`
