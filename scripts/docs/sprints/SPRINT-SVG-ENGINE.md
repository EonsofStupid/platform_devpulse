# SPRINT: SVG Visual Engine

**Status**: PLANNED — awaiting owner approval
**Research**: [SPRINT-SVG-ENGINE.research.md](SPRINT-SVG-ENGINE.research.md)
**Goal**: Build the SVG visual engine as a peer to the HTML engine. Pure resolver function. 20 axes. Accent-agnostic presets. DTCG-aligned. Svelte 5 runes-first.

---

## Prerequisites
- [x] All decisions locked (see research doc)
- [x] HTML StyleMacro with intent resolver working
- [x] SD5 build pipeline functional
- [x] Accent tokens exist in aliases.css
- [x] SVG filter definitions exist in svg/filters/
- [ ] behaviors/ folder move complete and compiling (owner confirms)

---

## Phase 1: SVG Engine Infrastructure

### 1.1 Types
- [ ] Create `svg/svg-types.ts`
  - `SvgAxis` — union of 20 axis names
  - `SvgMacroResolved` — `{ style: string; attrs: Record<string, string> }`
  - `SvgAccent` — `"teal" | "purple" | "magenta" | "ember" | "frost" | "cyber"`
  - `SvgPresetProps` — record of all 20 axis values

### 1.2 Axis Dictionary
- [ ] Create `svg/svg-macro-mappings.ts`
  - 20-axis map: axis name → CSS var name → DTCG type → default value
  - Export `SVG_AXES` constant
  - Export `SVG_AXIS_KEYS` for iteration

### 1.3 Resolver Function
- [ ] Create `svg/resolve-svg-macro.ts`
  - `resolveSvgPreset(kind, intent)` → structural vars (17 axes)
  - `resolveSvgAccent(accent)` → accent vars (3 vars)
  - `resolveSvgMacro({ kind, intent, accent })` → merged `SvgMacroResolved`
  - Uses same `INTENT_MAP` as HTML StyleMacro (primary→glass, etc.)
  - Reads `--svg-style-{kind}-{visual}-{axis}` from computed style

### 1.4 Glue CSS
- [ ] Create `svg/svg-macro-base.css`
  - `[data-svg-kind]` base rule with fallback defaults
  - `[data-svg-slot="track"]` targeting
  - `[data-svg-slot="value"]` targeting
  - `[data-svg-slot="label"]` targeting

### 1.5 Barrel + Index
- [ ] Create `svg/index.ts`
  - Export `resolveSvgMacro`, `resolveSvgPreset`, `resolveSvgAccent`
  - Export types
  - Export `SVG_AXES`
- [ ] Wire `svg/svg-macro-base.css` into `design/index.css`

### 1.6 Compile check
- [ ] `pnpm svelte-check` — 0 errors

**Checkpoint**: Owner reviews engine files. No widgets yet — just infrastructure.

---

## Phase 2: DTCG SVG Presets

### 2.1 Author SVG Presets
- [ ] Create `tokens/src/svg-presets.json`
  - `radial-gauge-default` — 20 axes, all declared
  - `radial-gauge-glass` — delta from default (thicker stroke, more glow, bevel filter)
  - `radial-gauge-stark` — delta (sharp edges, high contrast, no glow)
  - `radial-gauge-flat` — delta (thin stroke, no glow, no filter)
  - `radial-gauge-matte` — delta (medium stroke, subtle glow, matte track)
  - `spark-line-default` — 20 axes, all declared
  - `spark-line-glass` — delta
  - `spark-line-stark` — delta
  - `spark-line-flat` — delta
  - `spark-line-matte` — delta

### 2.2 SD5 Config
- [ ] Add `css-svg-presets` platform to `sd.config.mjs`
  - buildPath: `${paths.design}/svg/presets/`
  - destination: `svg-presets.generated.css`
  - filter: `token.path[0] === 'svg-style'`
  - `outputReferences: true` (accent vars must pass through)
- [ ] Add `svg-style` to tier classification (component tier, not primitive/semantic)

### 2.3 Build + Verify
- [ ] Run `pnpm ds:tokens:build`
- [ ] Verify `svg/presets/svg-presets.generated.css` exists and contains `--svg-style-radial-gauge-default-stroke` etc.
- [ ] Verify accent var references passed through as `var(--cl-svg-accent-main)`

**Checkpoint**: Owner reviews generated CSS.

---

## Phase 3: Migrate RadialGauge

### 3.1 Create Component
- [ ] Create `components/radial-gauge/radial-gauge.types.ts`
  - `RadialGaugeProps` — value, max, label, unit, accent, intent, size, strokeWidth, class
- [ ] Create `components/radial-gauge/index.ts` — barrel export

### 3.2 Rewrite RadialGauge.svelte
- [ ] Move from `blocks/widgets/RadialGauge.svelte` to `components/radial-gauge/RadialGauge.svelte`
- [ ] Replace all hardcoded color/style values with `resolveSvgMacro()` + CSS var references
- [ ] Add `data-svg-kind="radial-gauge"` to root `<svg>`
- [ ] Add `data-svg-slot="track"` to track circle
- [ ] Add `data-svg-slot="value"` to value arc
- [ ] Add `data-svg-slot="label"` to center text
- [ ] Remove hardcoded `cubic-bezier(0.34, 1.56, 0.64, 1)` — use `var(--cl-svg-transition)`
- [ ] Remove hardcoded oklch values from `@defaults` comment — point to preset
- [ ] Remove hardcoded `colors` object — all from CSS vars

### 3.3 Verify
- [ ] Compile check
- [ ] RadialGauge renders with correct accent colors
- [ ] Accent switch (teal→purple) works without re-deriving structural vars
- [ ] Visual matches DASHBOARD-REFERENCE-01.png gauge

**Checkpoint**: Owner reviews RadialGauge rendering.

---

## Phase 4: Migrate SparkLine

### 4.1 Create Component
- [ ] Create `components/spark-line/spark-line.types.ts`
- [ ] Create `components/spark-line/index.ts`

### 4.2 Rewrite SparkLine.svelte
- [ ] Move from `blocks/widgets/SparkLine.svelte` to `components/spark-line/SparkLine.svelte`
- [ ] Replace all hardcoded values with `resolveSvgMacro()` + CSS var references
- [ ] Add `data-svg-kind="spark-line"`
- [ ] Add `data-svg-slot="line"` to polyline
- [ ] Add `data-svg-slot="area"` to area path
- [ ] Add `data-svg-slot="dot"` to end dot circle
- [ ] Remove hardcoded `stdDeviation="3"` — use `var(--cl-svg-glow-blur)` via filter
- [ ] Remove hardcoded oklch values

### 4.3 Verify
- [ ] Compile check
- [ ] SparkLine renders with correct accent colors
- [ ] Visual matches DASHBOARD-REFERENCE-01.png charts

**Checkpoint**: Owner reviews SparkLine rendering.

---

## Phase 5: Update Consumers + Cleanup

### 5.1 Update Imports
- [ ] Update `blocks/widgets/index.ts` — re-export from new locations
- [ ] Update `routes/(app)/devpulse/+page.svelte` — import from `components/radial-gauge/` and `components/spark-line/`
- [ ] Update any other consumers

### 5.2 Remove Old Files
- [ ] Delete `blocks/widgets/RadialGauge.svelte`
- [ ] Delete `blocks/widgets/SparkLine.svelte`

### 5.3 Final Verification
- [ ] Compile check — 0 errors
- [ ] Debug overlay — verify SVG vars resolve (no empty `--cl-svg-*`)
- [ ] Visual verification: dashboard gauges + sparklines match reference
- [ ] Accent switching works on all widgets

### 5.4 Store Learnings
- [ ] Store SVG engine pattern in SurrealDB as a pattern
- [ ] Update memory files

---

## Files Created

| File | Purpose |
|------|---------|
| `svg/svg-types.ts` | Type definitions |
| `svg/svg-macro-mappings.ts` | 20-axis dictionary |
| `svg/resolve-svg-macro.ts` | Pure resolver function |
| `svg/svg-macro-base.css` | Glue CSS for data-svg-slot |
| `svg/index.ts` | Public API barrel |
| `svg/presets/svg-presets.generated.css` | SD5 output (generated) |
| `tokens/src/svg-presets.json` | DTCG source for SVG presets |
| `components/radial-gauge/RadialGauge.svelte` | Migrated gauge component |
| `components/radial-gauge/radial-gauge.types.ts` | Gauge types |
| `components/radial-gauge/index.ts` | Gauge barrel |
| `components/spark-line/SparkLine.svelte` | Migrated chart component |
| `components/spark-line/spark-line.types.ts` | Chart types |
| `components/spark-line/index.ts` | Chart barrel |

## Files Modified

| File | Change |
|------|--------|
| `sd.config.mjs` | Add `css-svg-presets` platform |
| `design/index.css` | Import `svg/svg-macro-base.css` |
| `blocks/widgets/index.ts` | Re-export from new component locations |
| `routes/(app)/devpulse/+page.svelte` | Update imports |

## Files Deleted

| File | Reason |
|------|--------|
| `blocks/widgets/RadialGauge.svelte` | Moved to components/ |
| `blocks/widgets/SparkLine.svelte` | Moved to components/ |
