# ColdLight Visual Language

> The aesthetic + token-category + SVG-filter reference for ColdLight.
> **Architecture-agnostic.** For the resolver architecture — 20-axis **RenderForge**,
> 2-layer (`behaviors/{kind}` hook + `components/{kind}` product), **ArkType** validation —
> see [`ADR-001-RENDER-FORGE.md`](./ADR-001-RENDER-FORGE.md) + [`RENDERFORGE.md`](./RENDERFORGE.md).
> Those are the current truth.
>
> Absorbed 2026-06-30 from the superseded `COLDLIGHT.md` (recovered from the 581ac988
> purge). The dead 8-axis / 4-layer / `useColdLight()` / `registerRecipe()` / Zod sections
> were dropped — only the still-true visual language below was folded here before deletion.

> Named for Nikola Tesla's cold light gas tubes — documented as "cold light" in the 1890s.

---

## Visual Identity

ColdLight produces interfaces with:

- **Liquid metal surfaces** — Chrome/metallic with multi-angle specular reflections (SVG `feSpecularLighting`)
- **Glass depth** — 4-5 visible inset shadow layers creating crisp raised edges, frosted blur + saturation
- **Glow emission** — 20-40px spread at 0.6-0.8 opacity, shape-aware halos, accent-colored
- **Bevel relief** — 5-7 layer inset shadow stacks for crisp elevated neumorphism
- **Text neumorphism** — Glow/bevel/depth applied directly ON text via text-shadow, not container
- **Circuit board grids** — Radial glow halos, teal/purple accent variants
- **OKLCH color system** — Perceptually uniform, wide-gamut, authored as HEX → transformed to oklch
- **Dark-first** — Dark variant only

**3x heavy visuals, optimized. Not conservative. Not MVP. Full neumorphic depth.**

---

## The owner's palette

The owner's words: "NEVER USE BLACK USE DARKS BUT TEALS PURPLES BLUES ALL DARK DARK DARK OR SLATE",
and on gradients: use them sparingly, "DO NOT GO FULL RAINBOW TASTEFULLY USED IT CAN BE INCREDIBLY
STUNNING". The tokens hold these values (authored OKLCH, with the hex beside them).

| Token | Value | Source |
|---|---|---|
| `glass.void`, `color.void.base` | `rgba(15, 23, 42, 0.97)` | his void: dark blue-slate |
| `glass.deep` | `rgba(30, 41, 59, 0.95)` | his deep |
| `glass.smoke` | `rgba(30, 41, 59, 0.7)` | his glass panel |
| `glass.standard` | `hsl(222 48% 11% / 0.7)` | his pulseos panel |
| `glass.light` | `hsl(220 22% 23% / 0.7)` | his cyber panel |
| `matte.dark` / `medium` / `light` | `hsl(220 64% 12%)`, `#1e293b`, `#334155` | his cyber deep and matte solid |
| `color.void.950`, `overlay.scrim` | `hsl(222 84% 5%)` | his deepest navy, the floor |
| `accent.teal.main` | `rgba(65, 240, 219, 1)` | "Primary teal" |
| `accent.pink.main` | `rgba(255, 10, 190, 1)` | "Secondary pink" |
| `accent.purple.main` | `rgba(147, 51, 234, 1)` | "Tertiary purple" |
| `accent.lime.main` | `hsl(125 100% 59%)` | his lime |
| `accent.amber.main` | `hsl(38 95% 55%)` | his amber |
| `accent.cyan` `green` `hotpink` `coral` `blue` `salmon` `gold` | `#17deef` `#29b468` `#f8397a` `#fc6b83` `#3ea4ea` `#f16971` `#d6d232` | the brand colours he gave later |

`primary` defaults to blue, editable in the visual editor (his words: "It should just be primary and
then default blue"). A surface darker than L 0.17 in OKLCH, or a dark with chroma under 0.03, is a
black by another name: lift it. Shadows may stay `oklch(0 0 0 / …)`; his own bevels are.

---

## SVG Filter System

Location: `svg/filters/`

Real SVG filter primitives (NOT CSS approximations):

- **Bevel**: `feSpecularLighting` (surfaceScale, specularConstant, Phong model)
- **Glow**: `feGaussianBlur` + `feColorMatrix` (shape-aware halos)
- **Noise**: `feTurbulence` + `feDisplacementMap` (surface grain)

Parameterized via CSS custom properties; one SVG filter replaces 6-8 layered CSS hacks for
neumorphism. (The visual controls are surfaced through RenderForge's axes — see `RENDERFORGE.md`.)

---

## Token Categories

Produced by the Style Dictionary 5 pipeline (see `docs/styledictionary/**` for the full
pipeline reference). HEX → oklch, PX → rem, DTCG → CSS shorthand.

| Category | CSS Prefix | Example |
|----------|-----------|---------|
| Colors | `--color-{hue}-{step}` | `--color-teal-500` |
| Glass | `--glass-*` | `--glass-deep` |
| Matte | `--matte-*` | `--matte-dark` |
| Glow | `--glow-*` | `--glow-teal` |
| Shadow | `--shadow-*` | `--shadow-z2` |
| Bevel | `--bevel-*` | `--bevel-subtle` |
| Radius | `--radius-*` | `--radius-md` |
| Spacing | `--space-*` | `--space-4` |
| Motion duration | `--motion-duration-*` | `--motion-duration-fast` |
| Motion easing | `--motion-ease-*` | `--motion-ease-spring` |
| Motion animation | `--motion-animation-*` | `--motion-animation-breathe` |
| Transition | `--transition-*` | `--transition-fade` |
| Surface | `--surface-*` | `--surface-glass-deep` |
| Blur | `--blur-*` | `--blur-md` |
| Typography | `--text-size-*` | `--text-size-base` |
| Gradient | `--gradient-*` | `--gradient-teal-glow` |

---

**ColdLight is the public API. The owner directs ColdLight. ColdLight directs everything else.**
