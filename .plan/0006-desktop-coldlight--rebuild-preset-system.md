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
updated: 2026-10-10
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
