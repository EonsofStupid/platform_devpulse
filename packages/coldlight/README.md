# ColdLight

Liquid-surface design system — particle effects, metal, glass, molten
aesthetics. Named for Tesla's cold-light gas tubes (1870s).

- **Package:** `@devpulse/coldlight` (private to the DevPulse monorepo)
- **Version:** see [`package.json`](./package.json)
- **Entry points:** see the `exports` map in `package.json`

## Layout

```text
packages/coldlight/
├── behaviors/      Primitive hooks — WAI-ARIA APG, no styling
├── components/     Renderable components — hook + StyleMacro
├── config/         Token / preset / surface config
├── generated/      Style Dictionary 5 output — DO NOT hand-edit
├── presets/        Declarative visual presets (flat, glass, neuro, …)
├── renderforge/    Render-time token resolution
├── styles/         Token CSS (primitives + semantic) — generated
├── svg/            SVG surface effects
├── theme/          Per-module @theme CSS — generated
├── types/          TypeScript declarations — generated
└── index.css       Single entry composing the full stylesheet graph
```

## Token pipeline

Source tokens live under
`scripts/build/styledictionary/tokens/src/**/*.tokens.json` (DTCG 2025
shape). `pnpm ds:tokens:build` runs the custom SD5 config in
`scripts/build/styledictionary/sd.config.mjs` and writes the
`styles/`, `theme/`, and `types/` trees here.

Fluid tokens (viewport-responsive sizes) carry
`$extensions.com.devpulse.coldlight.fluid` with `min` / `max` /
`minViewport` / `maxViewport`. The `coldlight/fluid-dimension-to-clamp`
transform emits a `clamp(...)` expression; tokens without the extension
pass through as static `rem`. See `styles/primitives/typography.css` and
`styles/primitives/spacing.css` for the generated output.

## Architecture

Two layers:

1. **Primitive hooks** — behaviour only (WAI-ARIA APG compliant).
2. **Components** — the product surface; a hook plus a `StyleMacro`.

No third-party headless libraries in product source — ColdLight is the
sole UI authority. Wider contribution rules live in the workspace-root
`CLAUDE.md`.

## Development

```sh
pnpm ds:tokens:build   # Rebuild generated CSS / types
pnpm ds:generate       # Rebuild component + preset emitters
pnpm ds:build          # Both of the above
pnpm coldlight:docs    # TypeDoc — consumed by CI; this file is its README
```
