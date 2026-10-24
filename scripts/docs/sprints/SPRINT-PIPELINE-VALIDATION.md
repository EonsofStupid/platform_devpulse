# SPRINT: Pipeline Validation & SVG Filter Completion

**Status**: PLANNED
**Priority**: P0 — Foundation. Nothing looks right if the visual pipeline can't produce the effects.
**Prerequisites**: None — this IS the foundation.
**Category**: ColdLight / Token Pipeline / SVG Filters

---

## Problem Statement

The SD5 token pipeline is production-grade (18 DTCG JSON sources, 664-line config, 28 platforms). The SVG filter system is architecturally correct (data-driven registry, `SvgFilters.svelte` mounted in root layout, CSS @utility classes reference filter IDs). But the filter library only covers ~30% of the visual vocabulary needed for the reference images. Liquid metal, metallic surfaces, glass refraction, frosted glass, effect chaining, and dynamic parameterization are all missing. The params arrays define CSS custom properties but the SVG output uses hardcoded values, not `var()` references.

---

## Pre-Execution Research (Verified 2026-03-21)

### Token Build Pipeline (VERIFIED COMPLETE)

| Asset | Location | Lines | Status |
|-------|----------|-------|--------|
| 18 DTCG JSON sources | `scripts/build/styledictionary/tokens/src/` | ~2000 | REAL |
| SD5 config | `scripts/build/styledictionary/sd.config.ts` | 664 | 28 platforms, 4 custom formats |
| CSS primitives output | `src/lib/design/css/primitives/` | 11 files | oklch(), multi-layer composites |
| CSS semantic output | `src/lib/design/css/semantic/` | 9 files | Real |
| Tailwind @theme | `src/lib/design/theme/` | 20 files | Namespace-remapped |
| TypeScript types | `src/lib/design/types/` | 14 .d.ts | 3-part type system |
| Token manifest | `generated/token-manifest.json` | VPB metadata | Real |
| Variants CSS | `generated/variants.css` | 8-axis @utility | Real |
| Build command | `pnpm ds:tokens:build` | — | Wired |

### SVG Filter System (VERIFIED PARTIAL)

| Asset | Location | Status |
|-------|----------|--------|
| Filter registry | `svg/filters/registry.ts` | REAL — registerFilter/getAllFilters |
| Filter definitions | `svg/filters/definitions/` | 3 files: bevel.ts, glow.ts, noise.ts |
| SvgFilters.svelte | `svg/filters/SvgFilters.svelte` | Mounted in root +layout.svelte line 33 |
| CSS utilities | `svg/filters/filters.css` | 7 @utility classes referencing filter IDs |
| FilterDef schema | `svg/_schema/types.ts` | Typed: id, category, params, steps |

### Existing Filters (7 total)

| Filter | Category | Primitives Used | Parameterized |
|--------|----------|----------------|---------------|
| bevel-soft | bevel | feGaussianBlur → feSpecularLighting → feComposite → feMerge | 4 params (specular, roughness, elevation, azimuth) |
| bevel-medium | bevel | Same pipeline, stronger values | 4 params |
| bevel-strong | bevel | Dual-light (key + teal fill), 3 merge nodes | 4 params |
| glow-teal-svg | glow | feFlood → feComposite → feGaussianBlur → feMerge | 2 params (radius, color) |
| glow-purple-svg | glow | Same pipeline, purple | 2 params |
| noise-subtle | noise | feTurbulence → feColorMatrix → feBlend | 2 params (frequency, octaves) |
| noise-medium | noise | Same, more visible | 2 params |

### Missing Filters for Reference Visuals

| Effect | SVG Approach | Priority |
|--------|-------------|----------|
| **Glow ember** | Same as teal, oklch hue shift to ~30 | P0 — registry defines it, no filter |
| **Glow magenta** | Same, hue ~330 | P0 |
| **Glow frost** | Same, hue ~210, higher lightness | P0 |
| **Glow cyber** | Same, hue ~160 | P0 |
| **Liquid metal** | `feTurbulence(animated)` → `feDisplacementMap` → `feSpecularLighting` | P1 — key visual from references |
| **Metallic chrome** | Multi-angle `feSpecularLighting` + high exponent + environment approximation | P1 |
| **Metallic copper** | Same as chrome, warm lighting-color oklch(0.7 0.15 50) | P1 |
| **Metallic brushed** | `feTurbulence(type=turbulence, low octaves)` → directional blur → specular | P1 |
| **Glass refraction** | `feGaussianBlur` + `feDisplacementMap` for optical distortion behind glass | P2 |
| **Frosted glass** | `feTurbulence` + `feGaussianBlur` composite for matte diffusion | P2 |
| **Composite effects** | Chain bevel + glow + noise into single compound filter | P1 — needed for real surfaces |

### Dynamic Params Issue

The `params` array on each FilterDef has `cssProperty` fields (e.g. `--svg-bevel-specular`). But the SVG output in SvgFilters.svelte renders hardcoded `attrs` values:

```svelte
<!-- Current: hardcoded -->
<feSpecularLighting surfaceScale={3} specularConstant={0.6} ...>

<!-- Needed: CSS custom property driven -->
<feSpecularLighting surfaceScale="var(--svg-bevel-scale, 3)" specularConstant="var(--svg-bevel-specular, 0.6)" ...>
```

**Problem**: SVG filter attributes don't support `var()` references in most browsers. The standard workaround is to use `feFunc*` or to parameterize via JavaScript/Svelte reactivity — update the filter DOM when CSS properties change.

**STOP — Owner Decision Required**

**Dynamic parameterization approach:**
- **Option A**: Svelte reactivity — SvgFilters reads CSS custom properties via `getComputedStyle()` and re-renders filter elements. Works but requires JavaScript.
- **Option B**: Multiple filter variants at different param values (e.g., bevel-soft-low, bevel-soft-mid, bevel-soft-high). No JS, but combinatorial explosion.
- **Option C**: Svelte props on `<SvgFilterInstance>` per-element — each element that uses a filter gets its own `<filter>` with unique ID and prop-driven values. Most flexible, no combinatorial explosion.

**Recommendation**: Option C. Each component that needs parameterized effects gets its own filter instance with unique ID. The params become Svelte props. This is the React Spectrum S2 approach for dynamic SVG filters.

---

## Tasks

### Phase 1: Verify Build Runs Clean

#### Task 1.1: Run `pnpm ds:tokens:build`
Capture full output. Zero errors required.

#### Task 1.2: Verify output freshness
Compare timestamps: JSON sources vs generated CSS/types/manifest.

#### Task 1.3: Verify Tailwind integration
Confirm `css/index.css` imports correctly, theme/ files loaded.

### Phase 2: Complete Missing Glow Filters (P0)

#### Task 2.1: Add 5 missing glow SVG filters
File: `svg/filters/definitions/glow.ts`

Add ember, magenta, frost, cyber, and custom glow filters following the same pipeline as teal/purple. These are mechanical — same `feFlood → feComposite → feGaussianBlur → feMerge` with different oklch hue values.

| ID | oklch hue | CSS class |
|----|-----------|-----------|
| glow-ember-svg | ~30 | filter-glow-ember |
| glow-magenta-svg | ~330 | filter-glow-magenta |
| glow-frost-svg | ~210, higher L | filter-glow-frost |
| glow-cyber-svg | ~160 | filter-glow-cyber |

#### Task 2.2: Add @utility classes for new glows
File: `svg/filters/filters.css`

#### Task 2.3: Verify all 7 glow values in 8-axis registry have matching SVG filters

### Phase 3: Liquid Metal & Metallic Filters (P1)

#### Task 3.1: Liquid metal filter
File: `svg/filters/definitions/liquid.ts` (NEW)

Pipeline:
```
feTurbulence(type=fractalNoise, baseFrequency=0.015, numOctaves=3)
  → feDisplacementMap(in=SourceGraphic, scale=15) — distort surface
  → feGaussianBlur(stdDeviation=0.5) — smooth distortion edges
  → feSpecularLighting(surfaceScale=8, specularExponent=40) — metallic highlight
  → feComposite(in=specular, in2=displaced, operator=in) — mask
  → feMerge(displaced + specular)
```

Parameterized: displacement scale, turbulence frequency, specular intensity, light direction.

For animation: `feTurbulence` seed changes via Svelte `$effect` interval — creates ripple/flow.

#### Task 3.2: Chrome metallic filter
File: `svg/filters/definitions/metallic.ts` (NEW)

Pipeline:
```
feGaussianBlur(in=SourceAlpha, stdDeviation=1) — height map
  → feSpecularLighting(surfaceScale=10, specularExponent=80, specularConstant=1.5) — sharp highlight
  → second feSpecularLighting(azimuth=135, lower intensity) — secondary reflection
  → feComposite both to shape
  → feMerge(source + primary + secondary)
```

High exponent = tight specular = chrome look. Warm lighting-color for copper variant.

#### Task 3.3: Brushed metal filter
Uses directional `feTurbulence` + anisotropic blur for grain direction.

### Phase 4: Composite Effect Chaining (P1)

#### Task 4.1: Compound filter definitions
Allow combining bevel + glow + noise into a single `<filter>` element. The registry needs a `CompoundFilterDef` type:

```typescript
interface CompoundFilterDef extends FilterDef {
  layers: FilterRef[]; // references to base filters
  compositeMode: "merge" | "blend" | "composite";
}
```

#### Task 4.2: SvgFilters.svelte handles compound filters
Renders layer steps sequentially within a single `<filter>`.

### Phase 5: Dynamic Parameterization (per decision gate)

#### Task 5.1: Implement chosen parameterization approach
After owner decides Option A/B/C above.

### Phase 6: Glass Effects (P2)

#### Task 6.1: Glass refraction filter
`feDisplacementMap` distortion behind glass panels.

#### Task 6.2: Frosted glass filter
`feTurbulence` + `feGaussianBlur` for matte diffusion beyond `backdrop-filter: blur()`.

---

## Exit Criteria

- `pnpm ds:tokens:build` exits 0, all outputs current
- All 7 glow axis values have matching SVG filters (not just 2)
- Liquid metal filter renders visible ripple/distortion on a test element
- Chrome metallic filter produces sharp specular highlights
- At least one compound filter (bevel + glow) works on a single element
- Dynamic parameterization approach decided and at least prototyped
- All new filters registered, CSS @utility classes generated, FilterDef typed

---

## Files Changed (Estimate)

| File | Action |
|------|--------|
| `svg/filters/definitions/glow.ts` | MODIFY — add 5 glow colors |
| `svg/filters/definitions/liquid.ts` | NEW — liquid metal filter |
| `svg/filters/definitions/metallic.ts` | NEW — chrome/copper/brushed |
| `svg/filters/definitions/glass.ts` | NEW — refraction + frosted |
| `svg/filters/definitions/index.ts` | MODIFY — import new definitions |
| `svg/filters/filters.css` | MODIFY — add @utility classes |
| `svg/_schema/types.ts` | POSSIBLY MODIFY — CompoundFilterDef type |
| `svg/filters/SvgFilters.svelte` | POSSIBLY MODIFY — compound rendering |
