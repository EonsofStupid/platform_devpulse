# ColdLight Design System

> **@devpulse/coldlight** — Optimized neumorphism engine. Liquid metal, glass depth, SVG lighting.
>
> Named for Nikola Tesla's cold light gas tubes — documented as "cold light" in the 1890s.

---

## Package Identity

| Field | Value |
|-------|-------|
| **Name** | `@devpulse/coldlight` |
| **Version** | `0.3.0` |
| **Author** | Jesse "Hades" Hall <jessay@angryvibers.com> |
| **Maintainers** | team@devpulse.app |
| **License** | MIT |
| **Status** | Private (`@coldlight/latest` npm planned) |

---

## What ColdLight Is

ColdLight is a **visual compiler** — Style Dictionary 5 is the engine that drives CSS generation, TypeScript type generation, and token manifest generation. Everything downstream (components, blocks, recipes, presets, VPB controls) consumes what SD5 produces.

**No hand-written CSS values. No raw `var()` strings. No inline styles. Every visual is token-driven, typed, composable, and optimized.**

Built for:
- **SvelteKit 5** + **Svelte 5 Runes** ($state, $derived, $effect, $bindable)
- **Tailwind CSS 4** via @tailwindcss/vite + @theme blocks
- **Style Dictionary 5.3.2** with DTCG 1.0 token format
- **MeltUI** (adapter for complex ARIA only — dialog, combobox, etc.)

---

## Visual Identity

ColdLight produces interfaces with:

- **Liquid metal surfaces** — Chrome/metallic with multi-angle specular reflections (SVG feSpecularLighting)
- **Glass depth** — 4-5 visible inset shadow layers creating crisp raised edges, frosted blur + saturation
- **Glow emission** — 20-40px spread at 0.6-0.8 opacity, shape-aware halos, accent-colored
- **Bevel relief** — 5-7 layer inset shadow stacks for crisp elevated neumorphism
- **Text neumorphism** — Glow/bevel/depth applied directly ON text via text-shadow, not container
- **Circuit board grids** — Radial glow halos, teal/purple accent variants
- **OKLCH color system** — Perceptually uniform, wide-gamut, authored as HEX → transformed to oklch
- **Dark-first** — Dark variant only

**3x heavy visuals, optimized. Not conservative. Not MVP. Full neumorphic depth.**

---

## Architecture

### 4-Layer Model (LOCKED)

| Layer | Folder | What It Does |
|-------|--------|-------------|
| **Primitives** | `primitives/{kind}/` | CONFIGURATION ONLY. Contract + structural shell. Never imported by users. |
| **Recipes** | `recipes/components/{kind}/` | Styling patterns. `registerRecipe()` + per-slot class strings. |
| **Components** | `components/{kind}/` | THE PRODUCT. ARIA + recipe styling + useColdLight(). What users import. |
| **UI** | `ui/{kind}/` | Styled wrappers (Radix/shadcn model). APPROVED, not yet built. |

### Provider Model

```
SD5 DTCG JSON → transforms → CSS Custom Properties (@layer tokens.*)
                           → Tailwind v4 @theme blocks
                           → TypeScript types (.d.ts)
                           → JSON manifest (VPB metadata)
                           → variants.css @utility rules (8-axis encoding)
```

### Component Resolution Flow

```
<Button intent="primary" glow="teal" depth="z2">
  → types.ts: PRESET_MAP[intent] → "btn-primary"
  → useColdLight({ preset, surface, depth, glow, ... })
  → resolveVisual(input) → ResolvedVisual
  → cn(recipe(size), visual.segments, visual.radius, className)
  → DOM: class="btn h-10 px-4 v-s1 v-d2 v-g1 rounded-lg"
```

---

## 8-Axis Encoding System

SSOT: `registry/token-categories.ts`

| Code | Category | Description | VPB Control |
|------|----------|-------------|-------------|
| `s` | Surface | Fill, backdrop-filter, opacity | select |
| `z` | Material | Glass clarity, matte, metal chrome/copper | select |
| `d` | Depth | Z-elevation via drop shadows (z0–z4) | slider |
| `b` | Bevel | Neumorphic inset shadows + SVG specular | slider |
| `g` | Glow | Emission halo: accent color + spread | select |
| `f` | Frame | Border: none/soft/hard/glow/accent | select |
| `m` | Motion | Ambient animations (breathe, shimmer, drift) | select |
| `t` | Transition | User-triggered speed + easing | select |

```
v-s3z1d2b1g0f1m0t2   (full explicit)
v-s3 v-d2 v-t2        (composable segments)
```

---

## Token Pipeline

### Source: DTCG JSON (17 files)
Location: `scripts/build/styledictionary/tokens/src/*.json`
Format: DTCG 1.0 — `$type`, `$value`, `$description`, `$extensions.com.coldlight`

### Build: Style Dictionary 5
Config: `scripts/build/styledictionary/sd.config.ts` (664 lines, enum-authored)
Runner: `scripts/build/styledictionary/build.ts`
Command: `pnpm ds:tokens:build`

### Transforms
- Colors: HEX → oklch
- Dimensions: PX → rem
- Shadows: DTCG → CSS shorthand
- Gradients: DTCG → linear-gradient()
- Cubic bezier: array → cubic-bezier()
- Typography: DTCG → CSS shorthand

### Output
- `css/primitives/*.css` — @layer tokens.primitives (color, shadow, glow, motion, etc.)
- `css/semantic/*.css` — @layer tokens.semantic (elevation, transition, interaction)
- `css/components/*.css` — @layer tokens.components
- `theme/*.css` — Tailwind @theme blocks per domain
- `types/*.d.ts` — TypeScript const arrays + union types
- `generated/token-manifest.json` — VPB scale/control metadata
- `generated/variants.css` — v-* @utility rules from token-categories.ts

---

## SVG Filter System

Location: `svg/filters/`

Real SVG filter primitives (NOT CSS approximations):
- **Bevel**: `feSpecularLighting` (surfaceScale, specularConstant, Phong model)
- **Glow**: `feGaussianBlur` + `feColorMatrix` (shape-aware halos)
- **Noise**: `feTurbulence` + `feDisplacementMap` (surface grain)

Parameterized via CSS custom properties. VPB reads manifest for slider/knob generation.
One SVG filter replaces 6-8 layered CSS hacks for neumorphism.

---

## Token Categories

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

## Commands

```bash
cd interfaces/desktop
pnpm ds:tokens:build    # SD5: JSON → CSS + @theme + .d.ts + manifest (3s)
pnpm svelte-check       # TypeScript verification (0 errors)
pnpm build              # Vite production build
pnpm dev                # Dev server on port 1420
```

---

## Rules (Non-Negotiable)

1. **SD5 is the UI compiler** — it drives EVERYTHING. No hand-written CSS values.
2. **Components never contain raw colors** — only token references, recipe classes, v-* encoding
3. **ColdLight owns ARIA by default** — MeltUI adapter only for complex patterns
4. **Three data attributes** — `data-kind`, `data-slot`, `data-state`
5. **Pre-release mode** — no backwards compat, no shims, aggressively reauthor
6. **Compile-check after every file edit** — edit → check → edit → check

---

**ColdLight is the public API. The owner directs ColdLight. ColdLight directs everything else.**
