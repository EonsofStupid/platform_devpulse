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
updated: 2026-10-18
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

## ColdLight's package boundary (owner question 2026-10-18)

> "what is the real world advance practices and methods to do this right
> during pre-release not just rushed or fasted solution but the actual proper
> path"

**Why now.** SvelteKit 3 removes `$lib` for `#lib`, which is Node subpath
imports (plan 0001 L3). Node resolves `#…` against the nearest
`package.json`, and `src/lib/design/package.json` (`@devpulse/coldlight`
0.2.1) is that file for every ColdLight module, so their `#lib` imports
cannot resolve. That file declares a package (name, version, `exports`,
peer dependencies, MIT licence) but the package does not exist:
`pnpm-workspace.yaml` lists only `interfaces/desktop` and `scripts/docs`,
and nothing imports `@devpulse/coldlight`. It only changes resolution.

**ColdLight imports the app in 16 files**, against your locked rules
(`docs/platform/Desktop.md` §1.1.1: `ui/` imports only `util` and ColdLight,
only `feature/` wires `data-access`; `COMPOSITION-CONTRACT.md`: adapters
never import state; `design/CLAUDE.md` ADR-001: ColdLight is the bottom
layer). By library type:

| Kind | Files | Proper home |
| --- | --- | --- |
| Presentational, typed by a domain contract | the 8 knowledge cards (`KnowledgeEntry` + payload types), `CommunityFeedList` (`FeedItem`) | the domain's `ui/` (`domains/app/knowledge/ui/`, `domains/app/community/ui/`), exported through its `index.ts`; they compose ColdLight primitives |
| Smart, wired to state | `KnowledgeDeck`, `KnowledgeTerm`, `ClyffyKnowledgeNudge` (knowledge state), `LatestUpdateCard` (updates state) | the domain's `feature/`, with a `ui/` split where the visual is reused |
| A ColdLight component reaching into a domain | `LoadingBlock` dynamically imports Clyffy's `LoadingContentCard` | inversion: a `content` snippet prop; the caller passes the Clyffy card (Svelte 5 snippets) |
| A ColdLight prop typed by app state | `chat-sidebar/types.ts` takes `ChatMode` from `sys/runes/global` | inversion: ColdLight owns the prop contract; the app's rune imports it |
| App infrastructure | `TokenDebugOverlay` (IPC `commands`, logger) | `lib/sys/debug/` |

### What established projects do

- **Internal packages in a workspace** (Turborepo "internal packages",
  pnpm workspaces): the design system is a workspace package the app
  depends on with `workspace:*`. Just-in-time form: `exports` point at
  source, the app compiles it, no build step; inside the package, Node
  subpath imports (`#…`), supported by TypeScript 5.4+, instead of path
  aliases. For Svelte, `exports` carry the `svelte` condition (SvelteKit
  packaging docs). The dependency direction is then enforced by the
  package graph: the design system cannot import the app because the app
  is not its dependency.
- **Node's rules make this the only clean form**: `imports` are "private
  mappings that only apply to import specifiers from within the package
  itself", keys start with `#`, targets stay inside the package (or name an
  external package), and self-reference works only through `exports`.
- **Library-type boundaries** (Nx `enforce-module-boundaries`): `type:ui`
  depends only on `ui` and `util`; `type:feature` on `feature`, `ui`,
  `data-access`, `util`. Same rule as your Desktop.md.
- **Presentational / container split**: presentational components take
  data and callbacks through props and have no dependencies on the rest of
  the app; containers fetch and pass. In Svelte 5 the container passes
  markup as typed snippet props.
- **Enforce first, then fix** (dependency-cruiser and Nx adoption reports):
  turning a boundary rule on surfaces every existing violation; a known
  list that may only shrink keeps the refactor honest and stops new ones.
- **Move with tooling, verify by compiling**: `ts-morph` `SourceFile.move`
  rewrites relative imports in the moved file and its importers (`.ts`
  only; `.svelte` specifiers are rewritten from the move map), `git mv`
  keeps history, and svelte-check, the build and the live page sweep prove
  it.

### The path

| # | Outcome | Check |
| --- | --- | --- |
| C0 | Boundary rule first: an architecture test fails when ColdLight imports `domains/`, `sys/`, `layouts/`, `devtools/` or `routes/`; the 16 are its known list, which may only shrink | the test passes on today's tree and fails on a seeded new import |
| C1 | The 16 resolved by library type (table above), importers go through each domain's `index.ts`; the known list is empty and the rule is absolute | svelte-check; tests; live: knowledge cards, community feed, latest card, loading block, chat sidebar |
| C2 | ColdLight becomes a real internal package (ruling below): `exports` with `types` / `svelte` / `default` conditions on source, its own `#coldlight/*` imports, its token pipeline and Storybook with it; the app depends on `@devpulse/coldlight: workspace:*` and imports `@devpulse/coldlight/...`; tool paths follow (Tailwind `@source`, lefthook globs, coldlight verify/docs, typedoc, Biome overrides, preflight checks) | build; svelte-check; all 44 pages load live; ColdLight cannot resolve an app import |
| C3 | Plan 0001 L3 (SvelteKit 3) finishes on top | plan 0001 L3's checks |

**Ruled 2026-10-18 (owner): option 1, a real internal package at `packages/coldlight/`.**
Where ColdLight lives was:

1. **Recommended: a real internal package at `packages/coldlight/`**, the
   standard `apps/*` + `packages/*` layout, `git mv` with history. Its own
   `package.json` already says this is the intent.
2. ColdLight stays a folder of the app; the empty package file is deleted
   and the boundary is held by the C0 test alone.

### C2 in three steps (inventory 2026-10-18)

What moves: 1,306 tracked files (1,090 code, 125 docs, 50 browser tests, no
stories). ColdLight's only outside packages are `svelte`, `arktype`, `clsx`,
`lucide-svelte`, `shiki` (plus `vitest` / `vitest-browser-svelte` in tests);
no `$app` or `$env` imports. The app imports it from 139 files: 466 imports,
60 specifiers, 336 of them `components/<name>/index.js`.

Tools that name `src/lib/design` today: Tailwind (auto-detection stops at the
app folder, so the package needs an `@source`), `app.css` and Storybook
`preview.ts` imports, the app's `biome.json` overrides and ignores, the
app's `vitest.config.ts` (its header says `@package @devpulse/coldlight`: it
is ColdLight's config), `tsconfig.json` excludes, lefthook (`tokens-regen`,
`coldlight-verify`, `coldlight-docs`, and the `src/**` globs of `biome-lint`,
`no-raw-values`, `no-legacy-prefixes`, `svelte-check`, `docs-preflight`),
the raw-values and coldlight-boundary hooks, five docs-preflight checks and
`cowlevel.policy.json`, the token pipeline and `scripts/coldlight/*`,
typedoc, release-please (config, manifest, `release.yml`), CODEOWNERS,
`.gitignore`, `config.json`, `project.manifest.yml`, and CI (`ci.yml`,
`verify-commits.yml`).

Found on the way: `interfaces/desktop/pnpm-lock.yaml` is stale (last touched
2026-02-02; the root lockfile is the live one since 2026-05-14) yet CI keys
its cache on it; `package.json` scripts `ds:generate`, `ds:validate`,
`coldlight:inventory`, `coldlight:generate` run files that do not exist; the
`./style-macro` export points at a folder that does not exist.

| # | Outcome | Check |
| --- | --- | --- |
| C2a | Workspace foundation, nothing moves: a root `biome.json` holds the shared rules (Biome 2 monorepo form) and the GritQL rules move to `scripts/biome/gritql/`; the app's `biome.json` becomes `"extends": "//"` plus its own overrides; `pnpm-workspace.yaml` gains `packages/*` and a `catalog:` for every dependency the app and ColdLight share, so both resolve one copy; the stale lockfile goes and CI caches on the root one | `biome check` reports exactly what it did before; `pnpm install --frozen-lockfile`; svelte-check; `vite build` |
| C2b | The move: `git mv` to `packages/coldlight/` as it stands (its `exports` already assume that root). `package.json` gets an `exports` map of the entry points that have consumers (`types` / `svelte` / `default` on source) and `"imports": {"#coldlight/*": "./*"}`, declares its own dependencies, and gains `check` and `test`; its own `tsconfig.json`, `biome.json` (`extends "//"` + ColdLight's overrides) and `vitest.config.ts` (the browser project, moved from the app). Codemod: ColdLight's `$lib/design/…` → `#coldlight/…`; the app's → `@devpulse/coldlight/…`, deep paths normalised to entry points (`utils/cn.js` and the layout utils → `utils`, `Text.svelte` → `components/text`, `svg-types.js` → `svg`, …; `svg/filters` and `debug` indexes gain their components), duplicates merged, imports re-sorted. The app depends on `workspace:*`; every tool path above follows; the boundary test also asserts the app reaches ColdLight only through `@devpulse/coldlight` | both svelte-checks 0 errors; Biome clean in both; arch tests; ColdLight's 50 browser test files; `vite build` with a ColdLight-only class present in the CSS; all 44 pages live, no console errors |
| C2c | ColdLight owns its build: the token pipeline, its DTCG sources, `scripts/coldlight/*`, `validate-specs.ts` and typedoc move into the package as its `tokens`, `verify` and `docs` scripts, with their dev dependencies; lefthook runs them there, and `tokens-regen` watches the DTCG sources (its glob names `tokens/tokens.ts`, which has never existed); the dead scripts are deleted; the boundary test's app-side check gains `scripts/` (today the pipeline still reaches into the package by relative path) | `tokens` regenerates byte-identical output; `verify` and `docs` pass; the boundary test covers `scripts/` |

### Icon size tokens (owner 2026-10-19)

> "add an icon-size token please that is a shortcut and we are in
> pre-release and I want this correctly done"

ColdLight sized Lucide icons with literal px (`size={16}` ×8, `{14}` ×2,
`{20}` ×1) and had no icon-size token. Design, all on existing patterns:

- **Source:** semantic group `iconSize` in
  `tokens/src/semantic/icon/size.tokens.json`, hand-authored rem like
  `borderWidth`: `xs` 0.875rem (14 px, dense chrome), `sm` 1rem (16 px,
  beside body text, buttons, inputs), `md` 1.25rem (20 px, tiles, headers),
  `lg` 1.5rem (24 px, Lucide's native grid). Steps match what ColdLight
  already uses and the common design-system icon scales (Carbon 16/20/24/32).
- **Outputs:** `--icon-size-*` in `styles/semantic/icon.css`; Tailwind
  `@theme` key `--spacing-icon-*` (the layout namespace, so the boundary
  gate allows it), which gives `size-icon-*`; `types/icon.d.ts`.
- **Consumption:** icons take `class="size-icon-<step>"` (a layout
  utility; CSS overrides Lucide's `width`/`height` attributes); no literal
  icon px in ColdLight. The app's own literal icon sizes are a follow-up.

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
- 2026-10-18 — Package boundary section added (owner question while plan
  0001 L3 moved to SvelteKit 3): the empty `@devpulse/coldlight` package file
  breaks `#lib`; 16 ColdLight files import the app. Research and path C0–C3
  recorded; ruling needed on where ColdLight lives.
- 2026-10-18 — Owner ruling: ColdLight becomes a real internal package at
  `packages/coldlight/`. C0 done: `tests/architecture/coldlight-boundary.test.ts`
  holds the 22 imports in 16 files as the known list; it fails on a new one
  (verified with a seeded import) and on a fixed one still listed.
- 2026-10-18 — C1a done: the knowledge family. The 8 entry-type cards moved
  to `domains/app/knowledge/ui/knowledge-cards/` (props in, types from the
  domain's `util`); `KnowledgeDeck`, `KnowledgeTerm`, `KnowledgeTermStrip`
  to the domain's `feature/`, exported through its `index.ts`.
  `ClyffyKnowledgeNudge` deleted (mounted nowhere; plan 0004 B4b). ColdLight
  keeps the generic `KnowledgeCard`, `KnowledgeMultipleChoiceCard`,
  `KnowledgeOrderingCard`. `ChatThread` / `ChatPanel` take an `empty` snippet
  instead of rendering `KnowledgeDeck`. Known list 22 → 6. Live: Latest,
  Slots devtool and a datastore devtool render the deck and term chips, no
  console errors.
- 2026-10-18 — C1b done: `CommunityFeedList` → `domains/app/community/ui/`,
  `LatestUpdateCard` → `domains/app/updates/feature/`, both exported through
  their domain's `index.ts`; ColdLight's `blocks/community` and
  `blocks/latest` are gone. Known list 6 → 4. Live: Latest and Community
  render, no console errors.
- 2026-10-18 — C1c done: `LoadingBlock` takes a `content` snippet instead of
  dynamically importing Clyffy's card; the Clyffy domain's new
  `ClyffyLoadingBlock` fills it, and the 6 devtools that showed the tip card
  use it. `ChatSidebar` takes its modes as data (`{ id, label }[]`) instead of
  the app's `ChatMode` and hardcoded English labels; its 6 browser tests pass.
  Known list 4 → 2. Live: the 6 devtools load, no console errors (the
  loading state itself was not triggered: it needs a model load).
- 2026-10-18 — C1d done, C1 complete: `TokenDebugOverlay` was two tools.
  The CSS token diagnostic is ColdLight's and stays in `design/debug/`; its
  raw inline values are deliberate (a token debugger must render when tokens
  are broken), so `design/debug/` joins the raw-values hook's allow-list
  beside `sys/debug/vpb/`. The HuggingFace-token panel (IPC + logger) was a
  duplicate of the models domain's `DownloaderTokenStrip` and is removed.
  The boundary test has no exceptions left: ColdLight imports nothing from
  the app.
- 2026-10-18 — C2 inventoried and split into C2a (workspace foundation),
  C2b (the move) and C2c (ColdLight owns its build); see "C2 in three steps".
- 2026-10-18 — C2a done: root `biome.json` holds the shared rules and the
  GritQL plugins (now `scripts/biome/gritql/`); the app's config is
  `"extends": "//"` plus its overrides (three overrides for files that no
  longer exist dropped); Biome is a root dev dependency. `biome check` on the
  app: 1,618 files clean, the 1,629 before less the 11 moved `.grit` files;
  seeded raw hex / raw px / `any` / `console.log` files still fail where they
  did. `pnpm-workspace.yaml` gains `packages/*` and a catalog of the 14
  dependencies ColdLight will share; the lockfile changed only in specifiers.
  The stale `interfaces/desktop/pnpm-lock.yaml` is deleted and CI caches on
  the root lockfile. svelte-check 0 errors, arch tests 17 pass, build passes.
- 2026-10-19 — C2b done: ColdLight is `packages/coldlight/` (`git mv`, 1,305
  renames), the workspace package `@devpulse/coldlight`. Its `exports` name
  the 10 entry points the app uses; inside, `#coldlight/*` (619 rewrites in
  370 files). The app's 465 imports in 138 files go through the package; the
  25 deep paths map to entry points (`svg/filters` and `debug` gained their
  components). Its own `tsconfig`, `biome.json` (`extends "//"`), Vitest
  config and `.gitignore`; `clsx` and `shiki` move to it; Svelte, Vite and
  Vitest resolve to one copy (catalog, plus `@types/node`, which moved
  25.2.3 → 25.5.2 within range). Tool paths follow: Tailwind `@source`,
  lefthook (ColdLight's own svelte-check and Biome commands), the raw-values,
  legacy-prefix and boundary hooks, docs-preflight (rules take their own
  `targetPath`), release-please, CODEOWNERS, CI, docs. Checks: ColdLight's
  svelte-check 0 errors standalone (it maps no app alias); the app's 0;
  Biome 551 + 1,071 files = the 1,618 before + 4 new; arch tests 18 (the
  boundary test also asserts the app reaches ColdLight only through the
  package); the token build is byte-identical; the build's CSS equals the
  pre-move build's except Svelte's path-derived scope hashes; the boundary
  gate counts and the docs-preflight result are unchanged; live, 44 pages
  load with ColdLight rendered and no exceptions (`/logs` uses no ColdLight
  component; `/latest` logs the updater's 404 for `latest.json`, which no
  release publishes yet).
  - **Found, not fixed:** 106 of ColdLight's 379 browser tests fail, the
    same 106 at the pre-move commit (assertions such as Badge's
    `role="status"` against the `presentation` it renders). Tests and
    components drifted; that is its own phase.
  - Hooks: the content-diff hooks read past git's 1,000-rename limit, so a
    large move is a set of renames, not every moved line added; the hex
    rule no longer matches HTML character references (`&#8249;`).
  - ColdLight's API docs now build against its own `tsconfig`. TypeDoc
    reads the `tsdoc.json` beside it, so ColdLight's dormant `tsdoc.json`
    became live: it extended `@microsoft/api-extractor` (installed nowhere)
    and its 15 tags are a subset of `typedoc.json`'s 61, the stated SSOT.
    Deleted. The docs script runs the workspace's TypeDoc instead of `npx`,
    which from the package folder would fetch another version.
  - The two legacy stories the move touched had raw canvas values; they
    now use `--color-void-base` and rem. They still use Svelte 4 `let:`
    syntax and a removed `ButtonIntent` type.
  - Owner ruling 2026-10-19: **Minion is public vocabulary.** Removed from
    `kernel_terms.toml` and the GritQL kernel-terms rule, matching
    `signals.registry.yaml` and `ip-protection.md`; the generated
    terminology loses its unused `helper` entry.
  - **Corrected 2026-10-19 (owner: deleting `tsdoc.json` was a shortcut).**
    `tsdoc.json` is restored and is now ColdLight's single tag source:
    `@microsoft/api-extractor` 7.59.4 (latest) and TypeDoc are ColdLight dev
    dependencies, it extends api-extractor's base and `typedoc/tsdoc.json`
    (TypeDoc's documented setup), defines ColdLight's 19 tags (adding the
    five its `.ts` comments used undefined: `@file` ×450, `@description`,
    `@consumers`, `@render`, `@theme`) and marks every tag supported, since
    api-extractor's base puts TypeDoc in allow-list mode. `typedoc.json`'s
    duplicate `blockTags` / `modifierTags` are gone. Effective tags: all 55
    block tags kept except `@generated-files` (not a valid TSDoc name,
    unused) and `@inheritDoc` (TSDoc's inline form, now inline); modifier
    tags 6 → 40 (TypeDoc's own, e.g. `@hidden`, were unrecognised before).
    Docs build with no warnings.
  - **Corrected 2026-10-19 (owner: OKLCH and px rules, no relaxing):** the
    raw-values hook's hex rule is back as it was. The `&#8249;` / `&#8250;`
    it flagged in `RangeCalendarHeader` are replaced by the Lucide chevrons
    `CalendarHeader` uses, sized by the new icon-size token (section above);
    ColdLight's 11 literal icon sizes now use `size-icon-*`. Live: `/devpulse`
    7 icons at 16 px, `/devtools` 5 at 20 px, `/chat`, `/clyffy`,
    `/devforge`, `/overmind`, `/wiredfront` at 16 px, each overriding
    Lucide's 24 px attribute. The `xs` title-bar icons and the range calendar
    render on no page, so they rest on the build (the `size-icon-xs` utility
    is generated) and svelte-check. The app still has 239 literal icon sizes
    in 58 files across 13 values (12 px ×86): moving them onto the token
    needs the scale extended first (at least a `2xs` step).
  - Follow-up: the C2b commit skipped `coldlight-verify` and
    `coldlight-docs` (lefthook drops staged files outside a command's
    `root`, and theirs was the app). Both were run by hand before the
    commit and passed; they now run from the repo root and fire on
    ColdLight files.
