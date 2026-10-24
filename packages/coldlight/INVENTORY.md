# ColdLight Inventory (Updated 2026-03-16)

> **Verified disk state. DO NOT trust counts from previous sessions — verify with Glob/Read.**

---

## Verified Counts

| Category | Count | Location |
|----------|-------|----------|
| Component kinds | 89 | `components/{kind}/` |
| Component .svelte files | 167 | `components/**/*.svelte` |
| Primitive kinds | 92 | `primitives/{kind}/` |
| Primitive .svelte files | 59 | `primitives/**/*.svelte` |
| Recipe .ts files | 104 | `recipes/**/*.ts` |
| Registered recipes | 32 | `recipes/` (registerRecipe calls) |
| Component recipe kinds | 44 | `recipes/components/{kind}/` |
| Registered presets | 60+ | `registry/presets.ts` |
| Kind definitions (CDOs) | 30 | `registry/kind-definitions.ts` |
| Token JSON source files | 17 | `scripts/build/styledictionary/tokens/src/` |
| SD5 platforms | 28 | `scripts/build/styledictionary/sd.config.ts` |
| SVG filter definitions | 3 | `svg/filters/definitions/` (bevel, glow, noise) |
| Block categories | 8 | `blocks/` subdirectories |

---

## Directory Structure

```
packages/coldlight/
├── components/          89 kinds, 167 .svelte — THE PRODUCT
├── primitives/          92 kinds, 59 .svelte — config shells
├── recipes/             104 .ts files — styling patterns
│   ├── _base/           schema, registry engine
│   ├── components/      44 recipe kinds
│   ├── layouts/         shell.app, shell.chat
│   ├── blocks/          widget.default
│   ├── animations/      ambient, entry
│   ├── transitions/     speed, easing presets
│   └── backgrounds/     circuit-board, neural, void (stub)
├── registry/            SSOT registries
│   ├── token-categories.ts   8-axis encoding SSOT
│   ├── presets.ts             60+ named presets
│   ├── resolve-visual.ts      resolution pipeline
│   └── kind-definitions.ts    30 CDOs
├── css/                 SD5-generated CSS (3-tier)
├── theme/               SD5-generated Tailwind @theme
├── types/               SD5-generated TypeScript
├── generated/           variants.css, manifest, typography, keyframes
├── svg/filters/         SVG neumorphism (feSpecularLighting, feGaussianBlur, feTurbulence)
├── blocks/              VPB block system (8 categories)
├── config/              coldlight.config.ts fragments
├── utils/               cn.js and utilities
└── api/dsadapters/      MeltUI adapter layer
```

---

## What Does NOT Exist

- `builders/` — NEVER existed
- `ui/` — APPROVED but not yet built
- `style/` — DELETED
- `taxonomy/` — DELETED concept (contracts in primitives/)
- `semantics/` — DELETED concept
- `renderers/` — DELETED concept

---

**Verify with Glob/Read before asserting counts. This inventory is a snapshot.**
