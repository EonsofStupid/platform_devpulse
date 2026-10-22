---
id: 0006
boundary: desktop-coldlight
paths:
  - packages/coldlight/
  - interfaces/desktop/scripts/build/styledictionary/
touches: [desktop-models, desktop-chat, desktop-devtools]
status: draft
owner: Jesse Hades Hall
created: 2026-10-10
updated: 2026-10-22
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

Every "deleted" below is a consolidation: the content moves into the one
source first, and nothing is removed until that row's check proves the kept
source covers all of it, and the owner OKs that removal (owner rule
2026-10-19: dead or duplicate code stays until its purpose is included).

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
| 0a.1 | The generator runs as the build's first step. Composites stop going through hex: shadow and gradient transforms emit `oklch(L C H / a)` from the token's components. Numeric gradient angles get `deg`, and radial gradients are emitted as `radial-gradient`. The hex fallback uses real CSS Color 4 gamut mapping (binary search on chroma, lightness and hue kept, ΔE_OK 0.02), never C = 0. The two no-op collector steps stay until 0s.7 retires them (their jobs move into the one source). | `SD/build.mjs`, `SD/dtcg-emit.mjs`, `SD/sd.config.mjs` | Zero hex values in `styles/`; all 54 gradients parse (lightningcss 1.30.2, already installed); live shadow and gradient computed values are `oklch(...)` |
| 0a.2 | **The wheel.** Each hue's `chroma` becomes its peak. Each step takes `min(peak, the largest chroma sRGB can show at that L and H)`. A per-hue `chromaCurve` override is data in the hue table, for tuning without code. The generator prints a gamut report: per ramp, the stops fitted and how far chroma moved. | `SD/generate-scales.mjs` | Report: 440/440 stops in sRGB; a before/after diff proves every stop that was already displayable is byte-identical |

#### 0b — Clear categories, everything emitted

| Step | Change | Files | Done when |
| --- | --- | --- | --- |
| 0b.1 | *Partly done 2026-10-22 (`e65ee444`): the groups no file took are routed (border widths per main `d432e775`, animation, opacity, z-index, glass-blur, gradient-duration, scrollbar-size, chat, wizard), and the CSS barrel is generated from the config's file lists (`claude.css` is now imported). Remaining:* Tier comes from the source's top folder (`primitives/`, `semantic/`, `presets/`, `components/`). Category comes from the second folder, through one table. Output is generated per category as `styles/{tier}/{category}.css`, replacing the hand-kept prefix lists, and the CSS barrel is generated from the same table. A token in an unmapped folder fails the build. New gate `verify-tokens.mjs`, run by the build: (1) source leaves = emitted variables; (2) every `var(--x)` without a fallback in `src/**` resolves to an emitted or locally declared property; (3) every emitted declaration parses; (4) the gamut report. Stale `elevation` outputs deleted. | `SD/sd.config.mjs`, `SD/build.mjs`, new `SD/verify-tokens.mjs` | The 132 missing tokens are emitted; `--border-width-thin`, `--chat-*` and `--outline-offset-md` resolve live; `--hover-filter`, `--active-filter` and `--focus-ring` are reported, and 0b.3 removes them |
| 0b.2 | **Color semantics alias primitives.** In text, signal and accent, a literal equal to a ramp stop becomes that alias. A literal within ΔE_OK 0.02 of one becomes its alias, and each such change is listed in the log. Any other literal becomes a named primitive in the generator, then is aliased. The gate gains: zero literal values in the semantic tier. | `semantic/text`, `semantic/signal`, `semantic/accent` token files, `SD/generate-scales.mjs`, `SD/verify-tokens.mjs` | Semantic color is 100% aliases; the computed-style snapshot is unchanged, apart from the logged ≤0.02 moves |
| 0b.3 | **Interaction and motion.** State-layer color aliases `color.white` (fixes the corrupt pink L 1.0032). Opacities become `opacity` primitives with ColdLight's existing values: hover 0.059, pressed 0.102, selected 0.149, disabled 0.031; focus is new and takes 0.102, matching pressed, as Material 3 does. Focus-ring tokens (width, offset, color) alias the existing border-width, outline-offset and accent primitives. `render-base.css` reads these tokens in place of the undefined `--hover-filter` and `--active-filter`. Semantic transitions alias the `duration` and `easing` primitives. | `semantic/interaction`, `semantic/motion` token files, `SD/generate-scales.mjs` (opacity), `renderforge/render-base.css` | Live: computed hover, focus-visible and pressed values on a button; zero undefined variables reported by the gate |

#### 0c — Composites, one source, nothing hand-written

| Step | Change | Files | Done when |
| --- | --- | --- | --- |
| 0c.1 | `typography`, `border` and `transition` stop expanding. They use Style Dictionary 5's built-in `typography/css/shorthand`, `border/css/shorthand`, `transition/css/shorthand` and `strokeStyle/css/shorthand`. The 104 split properties (`…-duration-value`, `…-components`) become one shorthand each, and their consumers are renamed, in batches if more than 5. | `SD/sd.config.mjs` + consumers | Zero variables ending `-value`, `-unit` or `-components`; every shorthand parses |
| 0c.2 | *Superseded by 0s (owner 2026-10-22).* **One preset source:** `tokens/src/presets/*.tokens.json` (DTCG, one file per family, as in the tier table). Measured: those files hold 1211 leaves, identical to `style-presets.json` with zero value conflicts; only the 86 `button-*` leaves are missing. Those move into a new `presets/button.tokens.json`. `style-presets.json`, `generate-style-presets.ts` and `enrich-presets.mjs` are deleted. | new `presets/button.tokens.json`; delete the 3 | The emitted `--preset-*` set is identical (diff) |
| 0c.3 | *Superseded by 0s.2.* The third copy, `visual/presets/*.ts`, is read only by `presets/catalog.ts`. The catalog reads ids and labels from the generated manifest instead, and the TS value modules are deleted. | `presets/catalog.ts`; delete `visual/presets/*` | `pnpm check` 0 errors; catalog lists the same ids |
| 0c.4 | **`app.css` hand-written layer out.** The `--accent-{role}-*` aliases (33 uses) are generated as semantic color role aliases, so consumers don't change. The 7 button-primary shim values move into `presets/button.tokens.json`. The `:root` block is deleted, leaving `app.css` with imports and layout only. | `src/app.css`, the semantic role token file, `presets/button.tokens.json` | Snapshot unchanged for the primary button and accent consumers |

#### 0d — Component tokens; the status bar as an app-shell component

| Step | Change | Files | Done when |
| --- | --- | --- | --- |
| 0d.1 | *Superseded by 0s.3–0s.5: component tokens are colocated `.tokens.json` files the build globs.* `collect-component-tokens.ts` reads every `src/lib/design/components/*/tokens.ts` and `src/lib/layouts/**/tokens.ts` and writes `tokens/src/components/<kind>.tokens.json`. Style Dictionary emits `styles/components/<kind>.css` with `--<kind>-<part>-<prop>` in `@layer tokens.components`, which brings the 10 existing files to life. `Badge.svelte` is the first consumer. | `SD/collect-component-tokens.ts`, `SD/sd.config.mjs`, `components/badge/Badge.svelte` | Every key in every `tokens.ts` is emitted; badge computed values come from `--badge-*` |
| 0d.2 | The status bar becomes `layouts/app/status-bar/`: a `StatusBar.svelte` shell plus `status-bar.tokens.ts`, and `segments/<name>/` folders holding a `Segment.svelte` and its own `tokens.ts`. Variants are `data-state` (ready, loading, failed, pending). Each segment's `<style>` reads only its generated variables, with no literal values. First step: the shell plus the subsystem segment. | shell, its tokens, subsystem segment and tokens, `Frame.svelte` | One line at 1280 and 1920 px (no "Turso (system)" wrap); `scrollWidth <= clientWidth` (no scrollbar); VRAM text not clipped; when space runs out, groups collapse to dot + icon (container query), with the full detail in the existing tooltip |
| 0d.3 | The remaining segments (connection, brain, VRAM, uptime/version), in batches of 5 or fewer. The old `StatusBar.svelte` and `SubsystemBadge.svelte` are deleted. | segment folders | Zero literal colors or sizes in `status-bar/`; screenshots |

#### 0s — The styling model, rewritten *(owner rulings 2026-10-22)*

> "we merge them to one clear source that is grounded in advance best
> practices for colocated styling and svelte"
>
> "rewrite it while in pre-release to align with best practices and how real
> world advance senior dev would approach this ensuring consistency and
> extending what is right and reading the full code to rewrite and align"

Supersedes 0c.2, 0c.3, 0d.1 and 0a.1's collector deletion. It realises
§1–§6 and Phases 1, 3 and 5 as one model, and it unparks PL-001 and PL-007
(`packages/coldlight/PARKING-LOT.md`).

##### What the full read found (2026-10-22)

These come from two inventories: every component folder (93) and block (21),
and every call site in the app (2,579 ColdLight tags in 193 files).

- **Most look props do nothing.**
  - Text `color` is used 753 times but is not a prop, so it lands as an HTML attribute.
  - Badge `variant` (180) and `fillStyle` (41): every badge renders the same `neuro-elevated` look.
  - InlineMessage `tone` (35): `TONE_PRESETS` is declared and unused, so 29 error messages look like info.
  - Also inert: Callout `variant` (25), Card `variant` (9), Widget's six axis props (24 widgets), the stories' Button `intent` (27).
  - Only `preset`, Spinner `tone`, StatusDot `status` and the SVG/Stat `accent` change anything.
- **Five names for "which look":** `preset`, `variant`, `tone`, `intent`, and a `style` string (7 chat components).
  - `variant` means eight unrelated things: severity, surface, role, layout, marker, shape, line, brand.
  - `preset` mixes intents (`primary`, `danger`) and materials (`glass`, `flat`), which collapse onto about five looks through `INTENT_MAP`. Unknown values fall back silently.
- **Size:** 27 of 57 components declare `size` and ignore it. Where it works, it is a per-file Tailwind class map, on six different scales.
- **State:**
  - No component passes `state`. Hover, disabled, selected and open are Tailwind patches or missing.
  - The generated `-hover` / `-active` / `-disabled` preset tokens are unreachable, and `RenderState` has no `hover`.
- **Families are looked up by preset id, not by kind.** As a result:
  - no component gets the overlay family, so glass never blurs;
  - only Button gets the interactive family.
- **Parts and layers:**
  - One `renderForge` call per component; parts carry `data-kind` without styling, so opacity compounds down the tree.
  - Floating parts (select, combobox, menus, date pickers) have no surface.
  - Hard-coded Tailwind visuals inside components override presets, because utilities outrank `layer(components)`.
- **How the app compensates:**
  - 455 inline visual styles;
  - 101 visual `:global` rules;
  - 69 visual Tailwind classes on ColdLight components;
  - 88 variable names defined nowhere.
  - `{...rest}` order differs: Text, Button and Badge drop a caller's `style`, while Card and the message components let it wipe the preset.
- **The dependency runs both ways, and theming is ad hoc.**
  - ColdLight reads tokens and attributes the app defines (`--accent-primary-*`, `--accent-service-*`, `[data-layout="chat"]`).
  - The Provider is mounted nowhere.
  - Theming is per-route CSS in `app.css` plus about ten private local-accent properties.
- **Dead metadata:**
  - the `@defaults` / `@styleIds` annotations (84 files);
  - schemas that contradict the props (Button and Card `variant`);
  - `KindName`, which misses 35 rendered kinds;
  - `VisualAxisProps`, which no component reads.

##### The model

**1. Two dimensions of look (PL-001 unparked).** A *family* is a visual
language: neuro, glass, retro, chrome, flat, stark. A *role* is what the
element is for.

- **Family is a scope.**
  - `data-surface="<family>"` is set by the Provider at the root and by any container (§4, decision 2), and a component may set it on itself through its `surface` prop.
  - Switching a family restyles a whole subtree consistently. This is the pattern of Radix Themes (`<Theme>`) and Spectrum (`Provider`) nesting.
- **Role is the component's prop.**
  - A family defines every role: today's six family variants elevated / deep / minimal / solid / glow / muted are the surface roles.
  - The component's `variant` picks a role, and the family in scope supplies its values.
- **Chat is not a family.** Its 14 golden patterns are the chat feature's own looks, colocated with it (§5).

**2. One prop vocabulary for every component.** These are the only props
that select a look:

| Prop | Means | Values | Applies to |
| --- | --- | --- | --- |
| `variant` | role / emphasis | actions: `primary` `secondary` `ghost` `danger`; surfaces: `elevated` `deep` `minimal` `solid` `glow` `muted` | per category, closed per kind |
| `tone` | status colour | `neutral` `accent` `informative` `positive` `notice` `negative` (Spectrum's six, already Badge's) | badge, alert, callout, inline message, banner, toast, spinner, status dot, text |
| `fillStyle` | how a tone fills | `bold` `subtle` `outline` (Spectrum) | status kinds |
| `size` | dimensions | `xs` `sm` `md` `lg` `xl` (`visual/sizes.ts`) | sized kinds; pixel-geometry kinds (avatar, gauges) keep numbers |
| `role` | type role (decision 1) | Material 3 display / headline / title / body / label × L/M/S, plus `code` and `stat` | text, heading, label |
| `surface` | family for this subtree | the six families | any kind (a scope of one) |

`preset`, `intent`, the chat `style` string and the eight axis props leave
the API. Text's 753 dead `color=` become `tone=`.

**3. One colocated source per kind.**

- `components/<kind>/<kind>.tokens.json` (DTCG 2025.10) holds the kind's parts (from its anatomy) and, per part, the properties that alias semantic roles: `card.root.background = {surface.role.background}`. It also holds:
  - **variants** (role per variant),
  - **sizes** (dimension tokens per size),
  - **tones** (semantic tone tokens per part),
  - **defaults** (`$extensions["com.coldlight"].defaults`),
  - **accepted concerns** (§3).
- Per-family overrides for a kind live in the same file, as `<kind>.family.<family>.<part>.<prop>`. This is how RENDERFORGE.md P2, "fork one (kind, preset, axis)", stays possible without inline chains. It is also where the March per-kind looks go (decision D5).
- Variants share values through `$extends` (§6.4, `SD/preprocess-extends.mjs`).
- **The build generates both outputs from that file:**
  - CSS: `styles/components/<kind>.css` in `@layer coldlight.components`, selectors on `[data-kind][data-slot][data-variant][data-size][data-tone]`, scoped per family with `@scope ([data-surface="<f>"])`;
  - TypeScript: the kind's variant, size and tone unions and defaults, which the component's props use. Nothing is hand-declared twice.
- **Families:** `tokens/src/presets/<family>.tokens.json` define each family's roles. They are emitted as role custom properties under `[data-surface="<family>"]`, with neuro as the root default (today's `default` → neuro-elevated).
- **The pattern is recipes:** Panda / Chakra slot recipes (base + variants + sizes + defaultVariants + compoundVariants, one per part) and Spectrum S2's style macros. Unlike those, which are TS, ColdLight authors them as DTCG, so the VPB and token tools read and write them.

**4. States are attributes.**

- Behaviors set React Aria's state attributes: `data-hovered`, `data-pressed`, `data-focus-visible`, `data-selected`, `data-disabled`, `data-open`.
- The kind's tokens file gives state deltas, emitted as attribute rules (§2, Phase 3).
- Interaction colour comes from Material 3 state layers (0b.3). This fixes PL-007 and the dead `-hover` / `-active` copies.

**5. The renderer emits attributes only (§6, Phase 5).**

- `renderForge` stays a pure, framework-free function (RENDERFORGE.md P1). It returns `data-kind`, `data-variant`, `data-size`, `data-tone` and, when given, `data-surface`.
- Generated CSS does the rest:
  - no inline custom properties;
  - no `KIND_FAMILIES`, no `data-cl-*` family markers;
  - no `INTENT_MAP` (a component's roles are its tokens file).
- TRUTH.md §3 moves `data-variant` / `data-size` / `data-tone` from Tier 3 (component-private) to Tier 1 (framework vocabulary).

**6. Component rules, all kinds.**

- **Parts:** every part is styled by `data-slot` rules from its kind's file, with no Tailwind visuals in components. Floating parts get the surface their tokens give.
- **Overrides:** `class` is layout only (Tailwind boundary, 0e). Each component spreads `{...rest}` before its own attributes, so a caller cannot replace its visuals; looks change through props and tokens.
- **Kind names:** `KindName` is generated from the component folders.
- **The folder is the component:** `Kind.svelte` + parts, `kind.tokens.json`, `kind.types.ts` (imports the generated unions), `index.ts`, `Kind.test.ts`, `Kind.stories.svelte`.
- **Direction:** ColdLight reads nothing the app defines. App accents such as `--accent-service-*` become a `data-accent` scope (§4).

##### Decisions for the owner

| # | Decision | Recommendation |
| --- | --- | --- |
| D1 | PL-001: family from scope, role from the component | Yes (above) |
| D2 | `tone` uses Spectrum's six for every status kind | Yes; Badge already does. InlineMessage's info/success/warning/error/help and Spinner's default/muted/… map onto them. |
| D3 | Dead props start working (Text `color`→`tone` 753, Badge 180, InlineMessage 35, Callout 25) | Yes: the intended look appears; each batch is shown before/after |
| D4 | One size scale `xs`–`xl`; Text and Heading move from `size`/`weight` to type roles, mapped from what they render today | Yes |
| D5 | March per-kind looks become `<kind>.family.<family>` overrides, one kind per step, emitted only after a side-by-side OK | Yes; consistent with "looks unchanged" until each is approved |
| D6 | RENDERFORGE.md P2/P5 and TRUTH.md §3 are rewritten to the attribute model (P2's capability is kept by family overrides) | Yes |

**Owner, 2026-10-22: D1–D6 approved as recommended.**

##### Steps

Each step touches ≤ 5 hand-written files; generated outputs and codemodded
call sites count as one batch. Every step runs the Phase 0 checks plus a
computed-style snapshot against a saved baseline (Button's:
`scratchpad/button-baseline.json`, 4 presets × 3 states).

| Step | Change | Done when |
| --- | --- | --- |
| 0s.1 | Measure the March per-kind looks | *Done:* report below |
| 0s.2 | Family DTCG files are the one preset source; the catalog is generated from them | *Done:* `efdd9820`; 1297 variables identical; VPB lists 50 |
| 0s.3 | The build resolves `$extends` and reads colocated files | *Done:* `fd8ca972`; output byte-identical |
| 0s.4 | *Done 2026-10-22 (`f8af043b`, `98a91239`, 0s.4b):* **The kind-file contract and its generator.** `kind-css.mjs`: base / variant / size / tone / state sections, validated at read; each token becomes `--<kind>-<property>` set by its section's selector, and one rule on the kind reads them; `accepts` filters what a variant inherits from a family role (render-base's concerns, motion universal), while the kind file's own tokens always apply. Button: `button.tokens.json` has the four looks as variants (primary `$extends` glass-deep, secondary neuro-minimal, ghost flat-minimal, danger stark-glow, each plus its own differences; primary takes the palette role the app.css shim used to patch in), sizes own the label type, `state.disabled` dims. The unused `destructive` look and the hand states stay as data (`$extensions … unused`). `Button.svelte` spreads `styleAttrs` (no inline style, layout classes only); `preset` → `variant` with generated `ButtonVariant` / `ButtonSize` / `BUTTON_*`; codemod: 360 call-site attributes in 99 files. | *Met:* 18 of 22 emulated cases identical; the 4 disabled cases differ by the dimming `disabled:opacity-50` meant and never applied (`useButton` sets `aria-disabled` / `data-disabled`, never `disabled`); 123 live Buttons on 8 routes identical to the baseline |
| 0s.5 | *Done 2026-10-22:* **Attributes-only renderer and the family scope.** `styleAttrs` is the attributes-only renderer (0s.4); the inline `renderForge` serves the kinds not yet moved until 0s.9. `surface-scopes.mjs` reads the families from the preset files (a file naming no surface role, chat, is not one) and emits `styles/scopes/surface.css` in `@layer tokens.scopes`: per family, `[data-surface="<family>"]` sets `--surface-role-<role>-<axis>` to that family's presets (6 families × 6 roles × 17 axes); neuro, the build's `SURFACE_DEFAULT`, is also on `:root` until the Provider (P0) writes the attribute. Custom properties inherit, so the nearest scope wins without `@scope`. `renderforge/generated/surfaces.ts` gives `SurfaceFamily` / `SurfaceRole`, and `styleAttrs`'s `surface` takes `SurfaceFamily`. The app.css `--preset-button-primary-*` shim no longer has a reader; it retires with 0s.9. | *Met:* Button 22/22 cases identical to 0s.4; 123 live Buttons identical; no element reads `--surface-role-*` yet (only the scope file names them); live: root = neuro, a glass subtree = glass, stark nested in glass = stark |
| 0s.6 | **Kinds by category, ≤ 5 per batch, with their call sites.** Actions (button done, toggle, link); surfaces (card, widget, dialog, popover, sheet, tooltip); status (badge, alert, callout, inline message, banner, spinner, status dot); text (text, heading, label: roles, `tone`); inputs; navigation; data display. Each batch: the kind file (from `tokens.ts` + today's computed look), props to the vocabulary, a codemod for its call sites (e.g. Button `preset=`→`variant=`; Card `preset="glass"` → `surface="glass" variant="deep"`), annotations removed. | Snapshot unchanged except D3's intended looks, shown before/after |
| 0s.7 | **Feature looks to their features.** Chat's 14 patterns → `domains/chat/**/<feature>.tokens.json` (§5); blocks (Widget, KnowledgeCard, SubsystemTile) on the vocabulary; the app accents → `data-accent` | Chat snapshot unchanged; zero `chat-*` presets in the global set |
| 0s.8 | **March looks (D5),** one kind per step, side by side | Owner OK per kind |
| 0s.9 | **Retire what the model replaced,** each with proof and the owner's OK (2026-10-19 rule): the inline chain, `KIND_FAMILIES`, `derive-kind-families.mjs`, `INTENT_MAP`, `visual/presets/*.ts`, `style-presets.json`, `generate-style-presets.ts`, `enrich-presets.mjs`, the three collector stubs, `tokens.ts`, `VisualAxisProps`, the duplicate `CL/presets/` / `CL/visual/` modules. ADR-001, RENDERFORGE.md, TRUTH.md, `PRESET_SYSTEM.md` and `TOKEN_PIPELINE.md` rewritten to this model. | Zero inline visual custom properties in the live DOM; each token has one definition site (`verify-tokens.mjs`) |

App-side cleanup (the 455 inline styles, 101 `:global` rules, 88 undefined
names, native controls) follows kind by kind as each ColdLight kind can
express what the app hand-rolled. It is tracked in 0d / 0e and plan 0004.

#### 0s.1 report — March per-kind looks (measured 2026-10-22)

Source: `component.json` → `style` at `1f85fe35^` (398 entries). For each family intent: the look most kinds shared, and each kind that had its own, with the axes that differ from the shared look.

- **`default`**: 61 of 77 kinds share one look; 16 differ.
- **`glass`**: 59 of 77 kinds share one look; 18 differ.
- **`flat`**: 64 of 77 kinds share one look; 13 differ.
- **`matte`**: 60 of 77 kinds share one look; 17 differ.
- **`stark`**: 79 of 79 kinds share one look; 0 differ.

**Kinds with a look of their own** (intent and the axes that differ):

- `accordion`: default (backgroundBlur, backgroundColor, border, borderRadius, color, shadow, transition)
- `alert`: glass (backgroundBlur, backgroundColor, color); flat (backgroundColor, border, color); matte (backgroundBlur, backgroundColor, borderRadius, transition)
- `alert-dialog`: default (shadow); glass (backgroundBlur, backgroundColor, color, shadow); flat (backgroundColor, border, color, shadow, transition); matte (backgroundBlur, backgroundColor, border, borderRadius, shadow, transition)
- `avatar`: default (shadow); glass (backgroundBlur, backgroundColor, color); flat (backgroundColor, border, color); matte (backgroundBlur, backgroundColor, border, borderRadius, transition)
- `badge`: default (shadow); glass (backgroundBlur, backgroundColor); flat (backgroundColor); matte (backgroundBlur, backgroundColor, borderRadius, transition)
- `calendar`: glass (backgroundBlur, backgroundColor, color); flat (backgroundColor, border, color); matte (backgroundBlur, backgroundColor, border, borderRadius, transition)
- `callout`: default (shadow); glass (backgroundBlur, backgroundColor, color); flat (backgroundColor, border, color); matte (backgroundBlur, backgroundColor, borderRadius, transition)
- `card`: glass (backgroundBlur, backgroundColor, color, shadow); flat (backgroundColor, border, color); matte (backgroundBlur, backgroundColor, border, borderRadius, shadow, transition)
- `checkbox`: default (backgroundBlur, backgroundColor, borderRadius, color, shadow); glass (backgroundBlur, backgroundColor, color); flat (backgroundColor, border, color); matte (backgroundColor, border, color, transition)
- `code`: default (backgroundBlur, backgroundColor, borderRadius, color); glass (backgroundBlur, backgroundColor, color, shadow); flat (backgroundColor, border); matte (backgroundColor, border, color, transition)
- `collapsible`: default (backgroundBlur, backgroundColor, border, borderRadius, color, shadow); glass (backgroundColor); flat (backgroundColor, color); matte (backgroundBlur, backgroundColor, borderRadius, transition)
- `combobox`: default (backgroundBlur, backgroundColor, borderRadius, color); glass (backgroundBlur, backgroundColor, color, shadow); flat (backgroundColor, border, color); matte (backgroundColor, border, color, transition)
- `contextual-help`: glass (backgroundBlur, backgroundColor, color, shadow); flat (backgroundColor, border, color, shadow); matte (backgroundBlur, backgroundColor, borderRadius, transition)
- `dialog`: default (shadow); glass (backgroundBlur, backgroundColor, color, shadow); flat (backgroundColor, border, color, shadow, transition); matte (backgroundBlur, backgroundColor, border, borderRadius, shadow, transition)
- `heading`: default (border, shadow, transition); glass (border, shadow, transition); matte (border, shadow, transition)
- `kbd`: default (shadow)
- `label`: default (backgroundBlur, backgroundColor, border, borderRadius, color, shadow, transition); glass (backgroundBlur, backgroundColor, border, borderRadius, color, shadow, transition); matte (backgroundColor, border, color, shadow, transition)
- `link-preview`: default (shadow); glass (shadow); matte (shadow)
- `loading-overlay`: default (border, shadow); glass (backgroundBlur, backgroundColor, border, color, shadow); matte (border)
- `toaster`: default (shadow); glass (shadow)

**One-off intents:** `badge-ember-glow`, `badge-glass-label`, `button-danger`, `button-ghost`, `button-primary`, `button-secondary`, `button-voice-active`, `chat-bubble-ai`, `chat-bubble-system`, `chat-bubble-user`, `tabs-chrome`.

**Owner decisions on this report (2026-10-22):** first "variants, looks unchanged"; then, when asked how to name them, "rewrite it … to align with best practices". The rewritten model above places the March looks as per-kind family overrides (D5), each emitted only after a side-by-side OK, so today's looks stay unchanged until then.

#### 0e — Tailwind back to layout only

| Step | Change | Done when |
| --- | --- | --- |
| 0e | `@theme` emits only layout namespaces (spacing, breakpoints, containers). This fixes `--text-primary` landing in Tailwind's font-size namespace. The 43 visual utility classes in markup (`bg-teal-…`, `text-purple-…` and similar) move to ColdLight tokens and attributes, in batches of 5 or fewer. | Zero visual Tailwind classes (grep gate); snapshot unchanged |

**Order:** 0a.1 → 0a.2 → 0b.1 → 0b.2 → 0b.3 → 0c.1 → 0s.1 … 0s.9 → 0c.4 →
0d.2 → 0d.3 → 0e. 0s.1–0s.5 are done (2026-10-22). 0s.6 onward can run before 0a/0b (their
generated CSS is per kind), except state colours, which wait for 0b.3's
interaction tokens; until then a kind's states keep today's values. Then Phases 1–5 below. The dashboard rebuild (plan
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
| C2c | ColdLight owns its build: the token pipeline, its DTCG sources, `scripts/coldlight/*`, `validate-specs.ts` and typedoc move into the package as its `tokens`, `verify` and `docs` scripts, with their dev dependencies; lefthook runs them there, and `tokens-regen` watches the DTCG sources (its glob names `tokens/tokens.ts`, which has never existed); the four package scripts whose files are gone are traced, not deleted — `generate-inventory.ts` and `generate-manifest.ts` (deleted 2026-03-20, `31dfab89`) restored from history and made to work, or shown covered by a current tool; `coldlight-generate.ts` and `coldlight-validate.ts` (never committed) put to the owner; the boundary test's app-side check gains `scripts/` (today the pipeline still reaches into the package by relative path) | `tokens` regenerates byte-identical output; `verify` and `docs` pass; the boundary test covers `scripts/` |

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

### ColdLight across frameworks (owner ruling 2026-10-19)

> "if its better to have a coldlight support react and sveltekit app"

- **Who would consume it:** the owner's other sites are React: `shippin`
  (React 18), `nomen-alpha` `apps/login` and `apps/docs` (Next 16, React 19),
  `vibeguard` and `onemanwho` (Next 16), `devlabs/connectome` (React 18).
  DevPulse is the only SvelteKit app.
- **Measured:** framework-free already — tokens and generated CSS,
  `renderForge`, `visual/`, `presets/`, `schema/`, `config/`, `types/`, all
  72 `*.anatomy.ts`. Svelte-bound — 221 components; behaviors (66 runes
  files, 110 importing Svelte types or context).
- **Options:** (a) core + Svelte bindings now, React bindings when a React
  site needs them, behaviors as ColdLight-owned state machines in Zag's
  shape; (b) Svelte-only, core kept framework-free, React decided later;
  (c) Web Components.

**Ruled 2026-10-19 (owner): (b).** No package split and no React work now.
The core stays free of Svelte (F0 enforces it), and the Provider's contract
is attributes, so a React binding stays possible.

| # | Outcome | Check |
| --- | --- | --- |
| F0 | Framework-free core, enforced: an architecture test fails when `styles/`, `theme/`, `generated/`, `types/`, `renderforge/`, `visual/`, `presets/`, `schema/`, `config/`, `utils/` or any `*.anatomy.ts` imports `svelte` or holds a `.svelte.ts`. Known today: `utils/cn.ts` (only the `ClassValue` type, which `clsx` itself exports); `styles/{index,base-state.svelte,macro-mappings}.ts`, imported by nothing — they are the Visual Page Builder's state and 11-axis mappings, and the VPB itself was deleted 2026-03-20 (`31dfab89`, "fixing foundation") although §5 still relies on it. Not deleted: moved out of `styles/` (which then holds only generated CSS) into `vpb/`, kept for the VPB's rebuild, on the owner's OK | the test passes, and fails on a seeded import |

### Provider — the documented API (owner 2026-10-19)

The owner ruled the documented per-concern API (`colorScheme`, `defaults`, …)
better than the `theme` object. Facts:

- The `theme` object (`provider/types.ts`, 2026-03-17) is mounted nowhere.
  The documented API (`ColdLightProvider.mdx`, 2026-03-19, "React Spectrum
  Provider, ported to Svelte 5") was never implemented.
- ColdLight is dark-only: its CSS has no colour-scheme selector, and
  `tokens/src/modes/light.tokens.json` (24 draft tokens) is outside the
  build's sources. Nothing reads `data-scale`.
- §4 above (owner-confirmed): concerns are scope attributes that the CSS
  cascade inherits, nearest scope wins; §6: `renderForge` emits attributes
  only. So the Provider writes attributes; it does not merge a JS object into
  each component.

| Prop | Writes | Effect |
| --- | --- | --- |
| `colorScheme` `dark` \| `light` (unset → the OS preference) | `data-color-scheme`, CSS `color-scheme` | once light mode exists (L1) |
| `density` (the docs' `scale`; `data-density` is the name decided 2026-10-10) | `data-density` | once the scope layer exists (Phase 2) |
| `locale` | `lang`, `dir` | at once: screen readers, right-to-left |
| `defaults` `{ surface, typography, accent }` | `data-surface`, `data-typography`, `data-accent` | once the scope layer exists (Phase 2) |
| `motion` `reduce` \| `full` (unset → the OS `prefers-reduced-motion`) | `data-motion` | with the motion tokens |
| `isDisabled`, `isQuiet`, `isEmphasized` | context, read by behaviors (`aria-disabled`) | per component as each adopts it |

A nested Provider writes only what it is given; everything else is inherited.
Every concern of the `theme` object is included before the object is
replaced: `accent` → `defaults.accent`, `colorScheme` → `colorScheme`,
`scale` → `density`, `neumorphism` (a surface choice) → `defaults.surface`,
`animations` (an in-app switch, not only the OS setting) → `motion`.
To confirm: the `density` values; whether and when light mode (L1) ships.

| # | Outcome | Check |
| --- | --- | --- |
| P0 | The Provider per the table, in Svelte; mounted at the app root; the `theme` object replaced only once each of its concerns works through the new props, with the owner's OK | component tests (attributes, nesting, each former `theme` concern); live: the root carries `lang`, `dir` and the attributes |
| L1 | Light mode: `modes/light.tokens.json` built as `[data-color-scheme="light"]`, with `prefers-color-scheme` as the default | token build; live toggle |

### Storybook — ColdLight's workshop (owner 2026-10-19)

> "rewrite storybook but make sure that is not the correct path or how a real
> senior dev would approach"

Facts:

- Storybook 10.3.0 runs inside the app on the SvelteKit framework. Its two
  stories crash at runtime: Svelte `invalid_default_snippet`, from Svelte 4
  `let:args` inside addon-svelte-csf 5's snippet `<Story>`. Their 12
  smoke-test passes are false positives.
- `Panel.stories` documents no ColdLight component (raw divs, legacy
  classes). `Configure.mdx` is Storybook's boilerplate.
  `ColdLightProvider.mdx` documents the unimplemented API (P0 implements it).
  `Terminology.mdx` describes the March model (8-axis encoding, three tiers).
- `@storybook/addon-actions` 9 and `addon-console` are installed and
  unregistered (actions are in Storybook's core since 9).
- Latest stable: Storybook 10.6.2, addon-svelte-csf 5.1.5.
- Specs: `Desktop.md` (a `ui/` component "could be shown in Storybook with
  fake data"); `PROGRAM-COLDLIGHT.md` (each component renders in the
  harness); `SPRINT-GOLD-STANDARD-BUTTON.md` §6 (props, accessibility,
  keyboard, usage); this plan's C2 row (Storybook moves with ColdLight).

Rewriting the two stories in place would be the shortcut. The path:

| # | Outcome | Check |
| --- | --- | --- |
| S0 | Storybook lives in `packages/coldlight`: `@storybook/svelte-vite` 10.6.2, addon-svelte-csf 5.1.5, docs, a11y (`test: "error"`), the Vitest addon as a project in ColdLight's Vitest config, a toolbar driving the Provider decorator (P0), Tailwind through `@tailwindcss/vite` for ColdLight's layout utilities. The app's Storybook config, its Storybook dependencies and its `storybook` Vitest project move with it (nothing left behind in the app). `Configure.mdx` becomes ColdLight's welcome page; `Panel.stories`' purpose (glass surfaces, glow variants, bevel progression, depth scale) becomes Foundations/Surfaces stories over the real presets; `ColdLightProvider.mdx` rewritten to P0's API; `Terminology.mdx` rewritten against this plan's model. Nothing is deleted | `storybook build`; the stories-as-tests run with zero unhandled errors |
| S1 | Button, the gold standard, in Svelte CSF 5 (`defineMeta`, args, snippets): every preset, size and state; a docs page with props, accessibility, keyboard and usage; interactions as play functions | stories pass as browser tests; a11y clean |
| S2… | One component family per phase, stories next to their components; that family's share of the 106 failing tests triaged (the test or the component fixed) | the family's suite green |

Order: F0 → P0 → S0 → S1 → S2…; L1 and Phase 2 when the owner orders them
(they give the Provider's visual props their effect).

## Phases (approval between each)

*2026-10-22: Phases 1 (type roles, per-kind defaults), 3 (states as attribute
deltas) and 5 (attributes-only renderer) are carried out inside 0s, per kind;
Phase 2's scope layer starts in 0s.5 (`data-surface`) and Phase 4's feature
overrides in 0s.7 (chat). The table stays as the outcome each must reach.*

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
  - 2026-10-19 — Owner rulings: ColdLight stays Svelte-only with a
    framework-free core, React decided later; the Provider follows its
    documented per-concern API; Storybook is rebuilt as ColdLight's
    workshop, not patched. Sections above; phases F0, P0, L1, S0–S2 await
    approval.
  - 2026-10-19 — **Owner rule: dead code stays, or its purpose is included
    first; never deleted for being unused.** Audit of this plan's work:
    - Broke the rule, now restored: `ClyffyKnowledgeNudge` (deleted in C1a
      as unmounted) → the knowledge domain's `feature/knowledge-nudge/`,
      body unchanged, still unmounted until plan 0004 B4b (`b10dd488`);
      the token debugger's HuggingFace panel (removed in C1d as a
      "duplicate" without proof — the downloader strip has no reveal, no
      refresh, and lives only in the downloader) → `sys/debug/HfTokenPanel`,
      passed into the debugger as children, live under Ctrl+Shift+D
      (`bbd045d6`); ColdLight's `./behaviors`, `./config`, `./utils/*`
      exports, dropped in C2b for lacking importers (`b10dd488`).
      `tsdoc.json` was already restored (`eb9959e2`).
    - Checked and covered: `ChatSidebar`'s labels live in the app's
      `ChatModeSelector`; the `blocks/community` and `blocks/latest`
      barrels' components moved into their domains; `./style-macro` is the
      exported `./renderforge` (renamed 2026-04-01).
    - Put to the owner, not code: the stale `interfaces/desktop/pnpm-lock.yaml`
      deleted in C2a (the root lockfile covers the workspace); Biome and
      raw-values entries removed in C2a/C2b for paths that do not exist.
    - Plan rows rewritten so nothing is deleted for being unused: F0 (the
      VPB's state moves to `vpb/`), P0 (each `theme` concern included,
      `motion` added), S0 (`Configure.mdx` and `Panel.stories` rebuilt),
      C2c (missing scripts traced and restored).
    - Found: the VPB itself was deleted 2026-03-20 (`31dfab89`), while §5
      and the non-goals still rely on it.
  - Follow-up: the C2b commit skipped `coldlight-verify` and
    `coldlight-docs` (lefthook drops staged files outside a command's
    `root`, and theirs was the app). Both were run by hand before the
    commit and passed; they now run from the repo root and fire on
    ColdLight files.
- 2026-10-22 — Step 0s rewritten to one styling model after a full read of components, blocks and call sites; D1–D6 approved by the owner (PL-001 and PL-007 unparked). 0s.1–0s.3 done (`285224ac`, `efdd9820`, `fd8ca972`).
- 2026-10-22 — 0s.4 done: Button is the first kind on its generated CSS. Found on the way: disabled Buttons never dimmed (the class map's `disabled:` variant needs the `disabled` attribute, which `useButton` does not set); the kind's `state.disabled` now dims them, as D3 rules for dead styling. SD5 reads `$value` objects even inside `$extensions`, so data kept there is plain values. Button's header annotations stay until 0s.6 removes them with `scan-annotations.mjs`.
- 2026-10-22 — 0s.5 done: the family scope is generated (`styles/scopes/surface.css`, `--surface-role-*` per `[data-surface]`, neuro on `:root`); nothing reads it yet, so every look is unchanged. 0s.6 points kinds' surface variants at it.
