---
id: 0006
boundary: desktop-coldlight
paths:
  - interfaces/desktop/src/lib/design/
  - interfaces/desktop/scripts/build/styledictionary/
touches: [desktop-models, desktop-chat, desktop-devtools]
status: draft
owner: Jesse Hades Hall
created: 2026-10-10
updated: 2026-10-13
supersedes: []
specs:
  - interfaces/desktop/src/lib/design/MASTER-PLAN.md
  - Design Tokens Format Module 2025.10 (W3C DTCG)
---

# Rebuild the ColdLight preset system

## Goal

Every element's visuals resolve through tiered tokens — primitive → semantic
→ composite → component → preset — applied by **generated CSS keyed on data
attributes**, with per-kind defaults (text never takes a surface), scope
inheritance (site → page → container → instance), and one-off variants
stored with the feature that owns them. No hand-written visual CSS, no inline
visual styles.

## Context (verified 2026-10-10)

**Why text renders as raised cards.** `<Heading>` / `<Text>` default to
`preset="default"` (`components/heading/Heading.svelte:52`,
`components/text/Text.svelte:48`) → `renderForge({ kind, preset })` →
`resolvePresetId("default")` looks up ONE kind-agnostic `INTENT_MAP`
(`visual/intent-map.ts:13-28`) → `neuro-elevated` → `renderforge/render.ts:84-85`
writes inline chains `var(--style-{kind}-{preset}-{axis}, var(--preset-{preset}-{axis}))`.
Verified live: an `h3` computes `background oklch(0.18 0.015 240)`, `12px`
radius, two-layer drop shadow.

**The preset source mixes concerns.** `tokens/src/style-presets.json` — 5,702
hand-authored lines, ~160 presets, each setting ~19 properties: surface
(`background-color`, `border-*`, `box-shadow`, `backdrop-filter`,
`border-radius`, `gradient`, `background-image`) **and** typography
(`font-family`, `font-size`, `font-weight`, `letter-spacing`, `line-height`,
`color`) in the same preset. A text element cannot take a type style without a
surface.

**States are duplicated presets.** `-hover`, `-active`, `-disabled` copies of
each preset instead of state deltas on `data-state` / interaction attributes.

**Feature presets sit in the global file.** `chat-bubble-*`, `chat-mode-pill-*`,
`chat-voice-orb-*`, `button-*` live beside the app-wide presets.

**Inline custom properties block inheritance.** `render.ts` sets visual custom
properties inline on every element. Inline values win over anything inherited,
so a site / page / container value can never reach the element. Scope
inheritance requires visuals to move out of inline styles into generated,
attribute-selected CSS.

**Nothing generates presets.** `collect-preset-styles.mjs`: "Currently a
no-op — style-presets.json is hand-authored". Colocated `tokens.ts` exists for
10 of 97 components; zero features colocate variants. `data-cl-surface` /
`data-cl-text` / `data-cl-frame` are emitted empty (`render.ts:143`).

**The kind contract has no implementations.** `components/_base/types.ts:124-130`
defines `requiredAxes`, `defaultStyleId`, `styleIds`, `slots` — zero
components declare it. MASTER-PLAN's `registry/token-categories.ts`,
`registry/presets.ts`, `registry/resolve-visual.ts`,
`registry/kind-definitions.ts` do not exist at this commit; MASTER-PLAN is
corrected as part of this plan.

## Design — grounded in established practice

### 1. Tiers (DTCG 2025.10)

| Tier | Holds | Source |
| --- | --- | --- |
| Primitive | Raw values only (OKLCH colors, spacing, radii, durations). The only place raw CSS values exist. | `tokens/src/primitives/**` |
| Semantic | Roles aliasing primitives (`color.surface.raised`, `color.text.muted`) | `tokens/src/semantic/**` |
| Composite | DTCG composite types: `typography`, `shadow`, `border`, `transition`, `gradient` | `tokens/src/composites/**` |
| Component | Per anatomy part (`button.root.background`), keyed to `data-kind` / `data-slot` | colocated `tokens.ts` → collected |
| Preset | Named bundles of semantic + composite tokens, **one concern each** | `tokens/src/presets/**` |

### 2. Presets split by concern

Following Material Design 3, which keeps **type roles** (display, headline,
title, body, label × large/medium/small) separate from **color and surface
roles**:

- **Typography presets** — family, size, weight, line height, tracking, text color.
- **Surface presets** — background, border, radius, shadow, backdrop, gradient.
- **State deltas** — not duplicated presets; generated as attribute rules
  (`[data-state="disabled"]`, `[data-hovered]`, `[data-pressed]`,
  `[data-focus-visible]` — React Aria state names).

### 3. Per-kind defaults *(owner-confirmed)*

Each kind definition declares which concerns it accepts and its default per
concern. Text kinds accept typography only — a surface prop does not exist on
them at the type level, so the raised-card bug cannot recur.

| Kind | Accepts | Default |
| --- | --- | --- |
| `text` | typography | `typography.body.medium` |
| `heading` | typography | level-mapped: h1 `display`, h2 `headline`, h3 `title`, … |
| `card`, `panel` | surface + typography | `surface.raised`, `typography.body.medium` |
| `button` | surface + typography + states | `surface.action`, `typography.label.large` |

### 4. Scope inheritance *(owner-confirmed)*

Precedent: **Radix Themes** nests `<Theme>` to re-configure a subtree with the
rest inherited from the parent; **Adobe Spectrum** nests `Provider` the same
way. Mechanism here:

- **Scopes**: site (`:root`), page (route root), container, instance (the
  element itself). A scope is any element carrying ColdLight scope attributes.
- **Attributes** set a concern for everything below: e.g. `data-surface`,
  `data-typography`, `data-accent`, `data-density`.
- **Generated CSS** maps each attribute value to semantic custom properties;
  components only read semantic properties (`background: var(--cl-surface-background)`)
  — never set them inline. Descendants inherit through the normal cascade.
- **Nearest scope wins**: CSS `@scope` proximity resolves nested scopes by DOM
  distance, not source order. Baseline in all major engines since Firefox 146
  (Dec 2025); Chromium 118+ (WebView2).
- **Layer order** (extends MASTER-PLAN's `@layer tokens.*`):
  `tokens.primitives, tokens.semantic, coldlight.scopes, coldlight.blocks, coldlight.exceptions, coldlight.overrides`.

### 5. Feature-colocated overrides

One-off variants live with the feature:
`domains/<domain>/features/<feature>/<feature>.tokens.json` (DTCG), aliasing or
`$extends`-ing global presets. The token build collects them (collector glob
widened beyond `design/components/`) and generates
`@layer coldlight.overrides { [data-feature="<feature>"] … }`. The VPB reads and
writes these same files.

### 6. Renderer

`renderForge` returns data attributes only. All inline visual custom
properties are removed.

## Non-goals

- No new visual values or redesign — existing values are migrated, not changed.
- No Tailwind changes (layout-only boundary already in force).
- VPB UI rebuild — this plan defines the file contract only.
- A2UI catalog generation — separate plan once presets are referenceable by id.

## Phase 0 — the token foundation (found 2026-10-13; comes before Phase 1)

Phases 1–5 assume the token layer underneath is sound. An audit of the build
on 2026-10-13 (every claim below spot-checked in the files) says it is not.

### The established version (what "correct" means here)

- **Format:** DTCG 2025.10 (Format + Color modules, stable). Simple types
  `color`, `dimension`, `fontFamily`, `fontWeight`, `duration`, `cubicBezier`,
  `number`; composites `border`, `transition`, `shadow`, `gradient`,
  `typography`, `strokeStyle`; `{alias}` references.
- **Tiers:** primitive (raw values only) → semantic (role aliases only) →
  component (per anatomy part, colocated) → presets (Phases 1–5).
- **Categories:** each is its own source folder with a primitive and a semantic
  layer, and each is emitted into its own `@layer`:

  | Category | Primitives | Semantic |
  | --- | --- | --- |
  | color | the wheel: hue ramps in OKLCH, neutrals | surface, text, border, accent, signal roles |
  | dimension | space, size, radius, border width | density, control sizes |
  | typography | families, weights, fluid size scale | type roles (Phase 1) |
  | elevation | shadows, z-index | raised / overlay / modal |
  | opacity | steps | disabled, scrim |
  | motion | durations, easing curves | transitions by intent (enter, exit, emphasize) |
  | interaction | state-layer opacities, focus ring | hover / focus / pressed / dragged / selected / disabled |

  Reference values: Material 3 state layers hover 0.08, focus 0.10, pressed
  0.10, dragged 0.16; durations 50–1000 ms; seven easing curves
  (AndroidX `StateTokens.kt` / `MotionTokens.kt`).
- **The color wheel:**
  - Generated from hue angles in OKLCH with a **chroma curve per step**: chroma
    peaks mid-ramp and tapers at the light and dark ends, so the steps stay
    displayable.
  - Emitted as `oklch()`.
  - Any sRGB fallback is gamut-mapped by the CSS Color 4 method (reduce chroma,
    keep lightness and hue), never clipped to grey.
  - Composites (shadows, gradients) alias the same color tokens as solids.
- **Pipeline:**
  - The generators run inside `pnpm ds:tokens:build`.
  - Style Dictionary emits each category.
  - Composites become CSS shorthands.
  - Nothing visual is hand-written outside it.

### What the build does today

- **Color wheel:**
  - Chroma is constant per hue across all 11 steps (`generate-scales.mjs:89-96`),
    so 270 of 440 ramp stops are outside sRGB.
  - The hex fallback (`dtcg-emit.mjs:62-80`) collapses colors to grey
    (purple-50 → `#f5f5f5`).
  - Shadows and gradients use that gamut-mapped hex, so they don't match their
    hue's solid tokens.
  - The generator is not in the build: no script runs it.
- **Interaction:**
  - Four tokens exist and none is focus.
  - All four are corrupt: `oklch(1.0032 0.0305 28.88 / α)` was meant to be
    white (`semantic/interaction.css:7-10`).
  - Hover and active actually use `filter: var(--hover-filter)`, which is
    defined nowhere.
- **Motion:**
  - The primitives exist (`--duration-*`, `--easing-*`).
  - Semantic transitions are literals, and they are exploded into junk
    properties such as `--transition-fade-duration-value: 150`.
- **Never emitted:** 132 tokens (z-index, opacity, border widths, wizard,
  chat). Components use some of them anyway (`--border-width-thin` × 15).
- **Invalid gradients:** 30 are invalid CSS — `linear-gradient(135, …)`, a
  unitless angle (`primitives/gradient.css`).
- **Presets:**
  - Two sources hold identical paths, so 1211 leaves collide.
  - They contain 2404 literal values and 104 aliases.
- **`src/app.css`:**
  - An unlayered, hand-written semantic layer of 28 properties.
  - It includes the button-primary shims, and it overrides generated tokens.
- **Dead or stale pieces:**
  - The 10 component `tokens.ts` files are never ingested.
  - `elevation.css` outputs are stale but still imported.
  - `claude.css` is emitted but not imported.
  - `modes/light.tokens.json` is orphaned.

### Implementation steps

`SD` = `interfaces/desktop/scripts/build/styledictionary/`. Each step touches at
most 5 hand-written files (generated outputs not counted) and stops for
approval.

**Every step runs the same checks:**

- `pnpm ds:tokens:build`, including the verify gate from 0b.1 onward;
- `pnpm check` with 0 errors, and Biome clean;
- on the running app over CDP, a computed-style snapshot of a fixed set of
  elements (button, card, text, heading, badge, status bar, Welcome panel)
  before and after. Any difference the step did not intend fails it.
- screenshots of the dashboard and Welcome.

#### 0a — Faithful color

| Step | Change | Files | Done when |
| --- | --- | --- | --- |
| 0a.1 | The generator runs as the build's first step. Composites stop going through hex: shadow and gradient transforms emit `oklch(L C H / a)` from the token's components. Numeric gradient angles get `deg`, and radial gradients are emitted as `radial-gradient`. The hex fallback uses real CSS Color 4 gamut mapping (binary search on chroma, lightness and hue kept, ΔE_OK 0.02), never C = 0. The two no-op collector steps are deleted. | `SD/build.mjs`, `SD/dtcg-emit.mjs`, `SD/sd.config.mjs`; delete `collect-element-seed-defs.mjs`, `collect-preset-styles.mjs` | Zero hex values in `styles/`; all 54 gradients parse (lightningcss 1.30.2, already installed); live shadow and gradient computed values are `oklch(...)` |
| 0a.2 | **The wheel.** Each hue's `chroma` becomes its peak. Each step takes `min(peak, the largest chroma sRGB can show at that L and H)`. A per-hue `chromaCurve` override is data in the hue table, for tuning without code. The generator prints a gamut report: per ramp, the stops fitted and how far chroma moved. | `SD/generate-scales.mjs` | Report: 440/440 stops in sRGB; a before/after diff proves every stop that was already displayable is byte-identical |

#### 0b — Clear categories, everything emitted

| Step | Change | Files | Done when |
| --- | --- | --- | --- |
| 0b.1 | Tier comes from the source's top folder (`primitives/`, `semantic/`, `presets/`, `components/`). Category comes from the second folder, through one table. Output is generated per category as `styles/{tier}/{category}.css`, replacing the hand-kept prefix lists, and the CSS barrel is generated from the same table. A token in an unmapped folder fails the build. New gate `verify-tokens.mjs`, run by the build: (1) source leaves = emitted variables; (2) every `var(--x)` without a fallback in `src/**` resolves to an emitted or locally declared property; (3) every emitted declaration parses; (4) the gamut report. Stale `elevation` outputs deleted. | `SD/sd.config.mjs`, `SD/build.mjs`, new `SD/verify-tokens.mjs` | The 132 missing tokens are emitted; `--border-width-thin`, `--chat-*` and `--outline-offset-md` resolve live; `--hover-filter`, `--active-filter` and `--focus-ring` are reported, and 0b.3 removes them |
| 0b.2 | **Color semantics alias primitives.** In text, signal and accent, a literal equal to a ramp stop becomes that alias. A literal within ΔE_OK 0.02 of one becomes its alias, and each such change is listed in the log. Any other literal becomes a named primitive in the generator, then is aliased. The gate gains: zero literal values in the semantic tier. | `semantic/text`, `semantic/signal`, `semantic/accent` token files, `SD/generate-scales.mjs`, `SD/verify-tokens.mjs` | Semantic color is 100% aliases; the computed-style snapshot is unchanged, apart from the logged ≤0.02 moves |
| 0b.3 | **Interaction and motion.** State-layer color aliases `color.white` (fixes the corrupt pink L 1.0032). Opacities become `opacity` primitives with ColdLight's existing values: hover 0.059, pressed 0.102, selected 0.149, disabled 0.031; focus is new and takes 0.102, matching pressed, as Material 3 does. Focus-ring tokens (width, offset, color) alias the existing border-width, outline-offset and accent primitives. `render-base.css` reads these tokens in place of the undefined `--hover-filter` and `--active-filter`. Semantic transitions alias the `duration` and `easing` primitives. | `semantic/interaction`, `semantic/motion` token files, `SD/generate-scales.mjs` (opacity), `renderforge/render-base.css` | Live: computed hover, focus-visible and pressed values on a button; zero undefined variables reported by the gate |

#### 0c — Composites, one source, nothing hand-written

| Step | Change | Files | Done when |
| --- | --- | --- | --- |
| 0c.1 | `typography`, `border` and `transition` stop expanding. They use Style Dictionary 5's built-in `typography/css/shorthand`, `border/css/shorthand`, `transition/css/shorthand` and `strokeStyle/css/shorthand`. The 104 split properties (`…-duration-value`, `…-components`) become one shorthand each, and their consumers are renamed, in batches if more than 5. | `SD/sd.config.mjs` + consumers | Zero variables ending `-value`, `-unit` or `-components`; every shorthand parses |
| 0c.2 | **One preset source:** `tokens/src/presets/*.tokens.json` (DTCG, one file per family, as in the tier table). Measured: those files hold 1211 leaves, identical to `style-presets.json` with zero value conflicts; only the 86 `button-*` leaves are missing. Those move into a new `presets/button.tokens.json`. `style-presets.json`, `generate-style-presets.ts` and `enrich-presets.mjs` are deleted. | new `presets/button.tokens.json`; delete the 3 | The emitted `--preset-*` set is identical (diff) |
| 0c.3 | The third copy, `visual/presets/*.ts`, is read only by `presets/catalog.ts`. The catalog reads ids and labels from the generated manifest instead, and the TS value modules are deleted. | `presets/catalog.ts`; delete `visual/presets/*` | `pnpm check` 0 errors; catalog lists the same ids |
| 0c.4 | **`app.css` hand-written layer out.** The `--accent-{role}-*` aliases (33 uses) are generated as semantic color role aliases, so consumers don't change. The 7 button-primary shim values move into `presets/button.tokens.json`. The `:root` block is deleted, leaving `app.css` with imports and layout only. | `src/app.css`, the semantic role token file, `presets/button.tokens.json` | Snapshot unchanged for the primary button and accent consumers |

#### 0d — Component tokens; the status bar as an app-shell component

| Step | Change | Files | Done when |
| --- | --- | --- | --- |
| 0d.1 | `collect-component-tokens.ts` reads every `src/lib/design/components/*/tokens.ts` and `src/lib/layouts/**/tokens.ts` and writes `tokens/src/components/<kind>.tokens.json`. Style Dictionary emits `styles/components/<kind>.css` with `--<kind>-<part>-<prop>` in `@layer tokens.components`, which brings the 10 existing files to life. `Badge.svelte` is the first consumer. | `SD/collect-component-tokens.ts`, `SD/sd.config.mjs`, `components/badge/Badge.svelte` | Every key in every `tokens.ts` is emitted; badge computed values come from `--badge-*` |
| 0d.2 | The status bar becomes `layouts/app/status-bar/`: a `StatusBar.svelte` shell plus `status-bar.tokens.ts`, and `segments/<name>/` folders holding a `Segment.svelte` and its own `tokens.ts`. Variants are `data-state` (ready, loading, failed, pending). Each segment's `<style>` reads only its generated variables, with no literal values. First step: the shell plus the subsystem segment. | shell, its tokens, subsystem segment and tokens, `Frame.svelte` | One line at 1280 and 1920 px (no "Turso (system)" wrap); `scrollWidth <= clientWidth` (no scrollbar); VRAM text not clipped; when space runs out, groups collapse to dot + icon (container query), with the full detail in the existing tooltip |
| 0d.3 | The remaining segments (connection, brain, VRAM, uptime/version), in batches of 5 or fewer. The old `StatusBar.svelte` and `SubsystemBadge.svelte` are deleted. | segment folders | Zero literal colors or sizes in `status-bar/`; screenshots |

#### 0e — Tailwind back to layout only

| Step | Change | Done when |
| --- | --- | --- |
| 0e | `@theme` emits only layout namespaces (spacing, breakpoints, containers). This fixes `--text-primary` landing in Tailwind's font-size namespace. The 43 visual utility classes in markup (`bg-teal-…`, `text-purple-…` and similar) move to ColdLight tokens and attributes, in batches of 5 or fewer. | Zero visual Tailwind classes (grep gate); snapshot unchanged |

**Order:** 0a.1 → 0a.2 → 0b.1 → 0b.2 → 0b.3 → 0c.1 → 0c.2 → 0c.3 → 0c.4 →
0d.1 → 0d.2 → 0d.3 → 0e. Then Phases 1–5 below. The dashboard rebuild (plan
0001, slice 2) starts after 0c, on the cleaned tokens. Out of scope:
`modes/light.tokens.json` (light theme is its own later phase).

**The one owner decision (0a.2):** the recommendation is to fit each step
to the largest chroma sRGB can show, capped at the hue's current chroma. That
leaves every color a normal screen can display exactly as it is, and changes
only the out-of-range steps, which browsers already clip today (and clipping
shifts the hue). The alternatives are a fixed taper curve, or keeping the
wider colors for wide-gamut displays behind `@media (color-gamut: p3)`.

## Phases (approval between each)

| # | Outcome | Files (≤5 unless generated) | Verification |
| --- | --- | --- | --- |
| 1 | Typography presets + per-kind defaults for `text` / `heading` (fixes raised-card text). Kind contract gains `concerns` + per-concern defaults; each component's definition is colocated with it (`components/<kind>/definition.ts`). | `presets/typography.tokens.json`, `components/_base/types.ts`, `visual/intent-map.ts`, `components/text/*`, `components/heading/*` | Live: every `[data-kind=text],[data-kind=heading]` computes transparent background, no shadow, no border |
| 2 | Scope layer: attribute → semantic property CSS, layer order, `@scope` | generator format + `index.css` layer order | Live: change `data-accent` on a container; only its subtree changes |
| 3 | Surface presets split out; states as attribute deltas; `-hover/-active/-disabled` copies removed | `presets/surface.tokens.json`, generator, `render.ts` | Live per state; gate counts drop |
| 4 | Feature overrides: collector + first override (setup wizard) | collector, `setup-wizard.tokens.json`, `build.mjs` | Override changes only `[data-feature=setup-wizard]` |
| 5 | Remove inline chains from `render.ts`; migrate remaining consumers | `render.ts` + consumers in batches | Zero inline `--style-*` / `--preset-*` in live DOM |

Every phase: `pnpm ds:tokens:build`, `svelte-check` 0 errors, biome clean,
`coldlight-boundary` gate counts ≤ baseline, Playwright/CDP screenshots and
computed-style assertions on the running app.

## Decisions

1. **Type roles — decided 2026-10-10:** Material 3 roles, display / headline /
   title / body / label × large / medium / small.
2. **Scope attributes — decided 2026-10-10:** `data-surface`,
   `data-typography`, `data-accent`, `data-density`.

### Type role mapping — extends what exists

Rule: every value comes from an existing token — an existing `textStyle.*`
unchanged, a step on ColdLight's own fluid `font-size` primitive scale, or an
existing size combined with its group's existing weight / line height /
tracking. Nothing is imported. All 10 existing styles keep their exact values.
Sizes descend monotonically through the table.

| Role | Built from (all existing) | Size | Weight | Line height | Tracking | Family |
| --- | --- | --- | --- | --- | --- | --- |
| display-large | `font-size.4xl` + `display-lg` conventions | 4.7348rem (fluid) | 700 | 1.1 | 0.02em | display |
| display-medium | `font-size.3xl` + `display-lg` conventions | 3.552rem (fluid) | 700 | 1.1 | 0.02em | display |
| display-small | `font-size.2xl` + `display-lg` conventions | 2.6647rem (fluid) | 700 | 1.1 | 0.02em | display |
| headline-large | `display-lg` unchanged | 2rem | 700 | 1.1 | 0.02em | display |
| headline-medium | `display-sm` unchanged | 1.5rem | 600 | 1.2 | 0.01em | display |
| headline-small | `heading-lg` unchanged | 1.25rem | 600 | 1.3 | -0.01em | sans |
| title-large | `heading-sm` unchanged | 1rem | 600 | 1.4 | -0.005em | sans |
| title-medium | `body` size + `heading-sm` conventions | 0.875rem | 600 | 1.4 | -0.005em | sans |
| title-small | `body-sm` size + `heading-sm` conventions | 0.8125rem | 600 | 1.4 | -0.005em | sans |
| body-large | `heading-sm` size + `body` conventions | 1rem | 400 | 1.5 | 0 | sans |
| body-medium | `body` unchanged | 0.875rem | 400 | 1.5 | 0 | sans |
| body-small | `body-sm` unchanged | 0.8125rem | 400 | 1.45 | 0 | sans |
| label-large | `body` size + `caption` conventions | 0.875rem | 500 | 1.4 | 0.01em | sans |
| label-medium | `caption` unchanged | 0.75rem | 500 | 1.4 | 0.01em | sans |
| label-small | `overline` unchanged | 0.6875rem | 600 | 1.3 | 0.08em | sans |
| `code` *(ColdLight extension)* | `code` unchanged | 0.8125rem | 400 | 1.6 | 0 | mono |
| `stat` *(ColdLight extension)* | `stat` unchanged | 1.5rem | 700 | 1.1 | 0.02em | display |

### Phase 1 split

- **1a — tokens + generator:** the roles above as DTCG `typography` tokens
  aliasing font primitives; fix the generator flattening DTCG dimensions into
  separate `-unit` / `-value` variables (`theme/text-style.css`); generate
  `[data-typography="<role>"]` rules.
- **1b — components:** kind contract gains accepted concerns; `Text` defaults
  to `data-typography="body-medium"`; `Heading`'s level/size → role mapping
  is derived from what it renders today (measured live), so no heading
  changes size; text kinds stop resolving surface presets.

## Verification

Recorded per phase in the log below.

## Log

- 2026-10-10 — Draft. Items 3 (per-kind defaults) and 4 (scope inheritance)
  confirmed by owner, conditional on established-practice grounding (above).
- 2026-10-10 — Decided: Material 3 type roles; scope attributes `data-surface`,
  `data-typography`, `data-accent`, `data-density`. Type role value mapping
  proposed; Phase 1 split into 1a (tokens + generator) and 1b (components).
- 2026-10-10 — Corrected per owner: new roles extend existing ColdLight tokens
  only (no imported Material 3 values); `stat` kept as an extension; Heading
  role mapping measured from current rendering.
- 2026-10-13 — Phase 0 added (the token foundation) after an audit of the
  build. Sources: DTCG 2025.10 Format and Color modules; Material 3 tokens
  (AndroidX `StateTokens.kt` v0_210, `MotionTokens.kt`); Style Dictionary
  5.3.1 source.
  - Style Dictionary's `color/css` parses with tinycolor2, so an OKLCH
    *string* passes through untouched (faithful), while a DTCG color *object*
    is converted to sRGB hex or rgb, with chroma reduced first.
  - The wheel itself is the problem: constant chroma per hue and a
    grey-collapsing hex fallback.
  - Awaiting the owner's go on 0a (the chroma curve decision).
