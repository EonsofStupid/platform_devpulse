# ColdLight Design System

> **The visual compiler for DevPulse.** Token-driven neumorphism engine with SVG lighting filters.

---

## Documentation

| Document | Purpose |
|----------|---------|
| [COLDLIGHT.md](./COLDLIGHT.md) | **START HERE** — Canonical specification |
| [MASTER-PLAN.md](./MASTER-PLAN.md) | Full architecture, reference images, sprint state |
| [TOKEN_PIPELINE.md](./TOKEN_PIPELINE.md) | SD5 token pipeline |
| [DesignArchitecture.md](./DesignArchitecture.md) | Recipe system, VPB, enforcement |

---

## Architecture

```
SD5 DTCG JSON (17 token files)
  → Style Dictionary 5 transforms (oklch, rem, shorthand)
  → CSS custom properties (@layer tokens.*)
  → Tailwind v4 @theme blocks
  → TypeScript types (.d.ts)
  → Token manifest (VPB metadata)
  → variants.css (8-axis encoding utilities)

Primitives (config)  → Recipes (styling)  → Components (product)  → UI (styled wrappers, planned)
```

---

## Key Principles

1. **SD5 is the UI compiler** — drives ALL CSS generation from DTCG JSON
2. **8-axis encoding** — `v-s3z1d2b1g1f1m0t2` composable visual system
3. **SVG neumorphism** — feSpecularLighting, feGaussianBlur, feTurbulence (not CSS hacks)
4. **Token-driven** — no hand-written CSS values, no raw `var()` strings
5. **3x heavy visuals** — liquid metal, glass depth, glow emission, bevel relief

---

## Folders

| Folder | Purpose |
|--------|---------|
| `css/` | SD5-generated CSS custom properties (3-tier: primitives, semantic, components) |
| `theme/` | SD5-generated Tailwind @theme blocks |
| `types/` | SD5-generated TypeScript types |
| `generated/` | variants.css, token-manifest.json, typography, keyframes |
| `registry/` | Token categories SSOT, presets (60+), resolve-visual, kind definitions |
| `recipes/` | Recipe registry + engine (104 .ts files, 32 registered) |
| `primitives/` | Configuration shells (92 kinds, 59 .svelte) |
| `components/` | THE PRODUCT (89 kinds, 167 .svelte) |
| `blocks/` | VPB block system (8 categories) |
| `svg/filters/` | SVG neumorphism filter definitions + registry |
| `config/` | coldlight.config.ts fragments |

---

## Commands

```bash
cd interfaces/desktop
pnpm ds:tokens:build    # SD5 build (3s)
pnpm svelte-check       # TypeScript (0 errors)
pnpm build              # Vite build
pnpm dev                # Dev server :1420
```

---

**ColdLight is the public API. Users never see adapters.**
