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
