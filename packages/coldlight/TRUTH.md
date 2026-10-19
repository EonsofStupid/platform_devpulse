% TRUTH.md — ColdLight design system, ground-truth state of architecture
% Authority: this file. Anything not here, or not in the code, is hypothesis.
% Sourced from: read of D:\localdev\platform_devpulse\interfaces\desktop\src\lib\design\* on 2026-04-26.
% See also: RENDERFORGE.md, MACRO-LAW.md, PARKING-LOT.md (siblings of this file).

# ColdLight TRUTH

> **Rule 0 — Provenance Discipline.**
> No claim in this document is taken on memory. Every assertion below was
> verified against on-disk source at the path cited. If a future session's
> claim contradicts this file *and* the code, the code wins.
> If it contradicts this file *but agrees* with the code, the file is updated.

---

## 1. Authoritative file paths

This is the navigation map. These are the only sources of truth. Anything
referenced outside this list (e.g. `RenderForge.md`, `MACRO-LAW.md` as
"Law N" anchors, a hypothetical platform-root `AGENTS.md`) was conversational
fiction and is dead.

| Concern | File |
|---|---|
| Visual axes (DTCG-typed) | `visual/axes.ts` |
| Preset families | `visual/preset-families.ts` |
| Preset IDs + Semantic intents | `visual/preset-id.ts` |
| Preset definition schema | `visual/preset-definition.ts` |
| Kind names (generated union) | `visual/kind-names.ts` |
| Intent → preset map | `visual/intent-map.ts` |
| Per-family preset values | `visual/presets/{family}.ts` |
| Public preset API façade | `presets/index.ts` (re-exports `visual/presets/*`) |
| Runtime resolver (pure fn) | `renderforge/render.ts` |
| Resolver types | `renderforge/types.ts` |
| Inline-style serializer | `renderforge/css-var-string.ts` |
| Generated kind→families map | `renderforge/generated/kind-families.ts` |
| Family-split selectors CSS | `generated/render-base.css` |
| Component implementations | `components/{kind}/{Kind}.svelte` |
| Behavior hooks (WAI-ARIA APG) | `behaviors/...` |
| Block-level compositions | `blocks/{chat,widgets,governance,...}` |
| App-level provider | `provider/ColdLightProvider.svelte` |
| Package exports | `package.json` |

---

## 2. The styling pipeline (5 stages)

This is the actual data flow. Every stage corresponds to a real file or
file-group above. No invented stages.

```
   AUTHORED                          GENERATED                          RUNTIME
   ────────                          ─────────                          ───────

[ visual/presets/*.ts ]              [ SD5 build ]                  [ render-base.css ]
   PresetDefinition[]    ───────►    emits CSS custom    ───┐       [data-cl-{family}]
   • DTCG-typed                      property tokens        │        selectors consume
   • OKLCH values                    --preset-{id}-{axis}   │        --{axis} vars
   • hover/active/                   per preset+state       │
     focus/disabled                                         │
                                                            │
[ visual/intent-map.ts ]             ┌──────────────────────┘
   SemanticIntent → PresetId         │
                          ───────►   │
                                     │
[ renderforge/render.ts ]            ▼
   renderForge({                [ Component.svelte ]
     kind, preset, state })       <element
                       ─────►       {...m.dataAttrs}        ──────►   browser paints
                                    style={cssVarString(            using the var() chain
                                      m.cssVars)}                    resolved through
                                    >                                the cascade
```

**Five stages, sequenced:**

1. **Author.** A `PresetDefinition` is hand-written in `visual/presets/{family}.ts`. Real OKLCH values, full state overrides.
2. **Build.** Style Dictionary 5 transforms preset definitions into CSS custom properties. (Build script lives at `scripts/build/styledictionary/sd.config.mjs` per `README.md`.)
3. **Resolve.** `renderForge({kind, preset, state})` returns `{kind, dataAttrs, cssVars}`. Pure function. Same input → same output. `cssVars` values are var() chains pointing at the names emitted in step 2.
4. **Apply.** A component spreads `m.dataAttrs` onto its root element and serializes `m.cssVars` into the inline `style` attribute via `cssVarString`.
5. **Paint.** `render-base.css` provides selector-scoped CSS that consumes the `--{axis}` custom properties, scoped by `[data-cl-{family}]` markers and `[data-state]` / pseudo-classes.

---

## 3. The data-attribute taxonomy (5 tiers, real)

Discovery method: regex search of `data-([a-z][a-z0-9-]*)=` across
`design/**/*.svelte` returned ~440 matches across ~50 components plus
provider, plugins, debug, overlays. Distilled into the tiers below.

> **The "3 attributes only" rule from prior conversations was fiction.** The
> code uses ~20 distinct data-attributes organized into the 5 tiers below.
> The taxonomy is real; only the rule was wrong.

### Tier 1 — Framework Universals (emitted by `renderForge`)

These come out of `m.dataAttrs` and are the contract every styled component
spreads onto its root element.

| Attribute | Purpose | Source |
|---|---|---|
| `data-kind` | Component identity. Universal `[data-kind]` selector in render-base.css applies transitions, opacity, animation. | `renderforge/render.ts` |
| `data-cl-{family}` | Family scope marker. Activates the matching `[data-cl-{family}]` rule in render-base.css. Family set comes from `renderforge/generated/kind-families.ts`. | `renderforge/render.ts` |

**Rule:** Tier 1 is owned by the framework. Components do not author these.

### Tier 2 — Sanctioned Structural (component authors)

Attributes that the framework expects components to author, used by
hooks, accessibility tooling, and StyleOS introspection.

| Attribute | Purpose | Cardinality |
|---|---|---|
| `data-slot` | Slot identity within a compound component (e.g. `data-slot="trigger"` on a Tabs trigger). | One per slotted element. |
| `data-state` | Runtime state. Documented values: `default | open | closed | minimized | hover | focus | active | disabled` (5 in CSS, 3 in resolver — see RENDERFORGE.md drift note). | One per stateful element. |
| `data-orientation` | `horizontal | vertical` for components with axis. | One per orientation-aware root. |

**Rule:** Tier 2 is sanctioned. Use these names, not synonyms.

### Tier 3 — Component Variant Markers (per-component license)

Each component MAY add data-attributes that scope its own internal CSS.
Examples observed in the codebase:

- `data-position` (Toaster — top-right, bottom-left, etc.)
- `data-size` (Spinner, SpinnerRow, StatusDot — sm | md | lg)
- `data-tone` (Spinner, Stat — semantic color tone)
- `data-variant` (Table — visual variant)
- `data-status` (StatusDot — pending, success, error, warning)
- `data-invalid` (Textarea — boolean)
- `data-engaged`, `data-context-collapsed`, `data-layout` (ChatFrame)
- `data-pulse`, `data-animate` (Parasite, plugin layer)

**Rule:** Tier 3 attributes are component-private. Other components
must not target them in CSS. If two components both want a `data-tone`
selector, each scopes it under their own `[data-kind]`.

### Tier 4 — Provider Globals

Authored once, in `provider/ColdLightProvider.svelte`, on the root container.
Used as cascade roots for theming.

- `data-coldlight-provider` — boolean marker for the root
- `data-accent` — accent color override
- `data-scheme` — `light | dark` (or auto-resolved)
- `data-neumorphism` — feature flag for neumorphic surfaces
- `data-animations` — feature flag for motion
- `data-scale` — global scale multiplier

**Rule:** Tier 4 attributes are provider-only. No component emits these.

### Tier 5 — SVG Namespace

A parallel set used by SVG-rendering components (e.g. `SparkLine`,
`NeuFrame`). Prefixed with `data-svg-` to avoid collision with HTML
ColdLight selectors.

- `data-svg-kind`, `data-svg-intent`, `data-svg-accent`, `data-svg-slot`

**Rule:** Tier 5 lives in `[data-svg-*]` selectors only. Never mix with `[data-cl-*]`.

### The policy (this is the answer to "what's the correct approach")

1. **Tier 1 is automatic.** Spread `{...m.dataAttrs}` and you're done.
2. **Tier 2 is a closed set.** New entries require updating this file.
3. **Tier 3 is open per-component.** New attribute names allowed inside
   the `[data-kind="<your-kind>"]` selector scope. Cross-component reuse
   of Tier 3 names is forbidden — promote to Tier 2 first.
4. **Tier 4 is provider-only.** Do not extend without a TRUTH.md update.
5. **Tier 5 is for SVG only.** HTML elements never carry `data-svg-*`.

---

## 4. The DTCG axis surface (real)

**11 conceptual axes** declared in `visual/axes.ts` as `VisualAxis`, plus
the optional `backgroundImage` axis listed alongside (12 total when
backgroundImage is included).

Two layered counts that can confuse readers:
- **Author count: 11** (the DTCG-typed axes) **or 12** (including optional `backgroundImage`).
- **Runtime CSS custom property count: 16** (in `render-base.css`) or **20** (pre-computed by `renderForge`, with several yet-unused longhands for forward compatibility).

| DTCG axis (authored) | DTCG `$type` | Maps to runtime CSS custom property(s) |
|---|---|---|
| `backgroundColor` | `color` | `--background-color`, `--background-alpha` |
| `backgroundBlur` | `dimension` | `--backdrop-filter` |
| `shadow` | `shadow` | `--box-shadow` |
| `border` | `border` | `--border-color`, `--border-width`, `--border-style` |
| `animation` | `duration` | `--animation` |
| `transition` | `transition` | `--transition-duration`, `--transition-timing` |
| `typography` | `typography` | `--font-family`, `--font-size`, `--font-weight`, `--tracking`, `--leading` |
| `gradient` | `gradient` | `--gradient`, `--background-image` (overlap) |
| `color` | `color` | `--color` |
| `borderRadius` | `dimension` | `--border-radius` |
| `opacity` | `number` | `--opacity` |
| `backgroundImage` *(optional)* | `string` | `--background-image` |

**Rule:** the canonical answer to "how many axes are there" is:
*"Eleven authored DTCG axes (twelve with the optional backgroundImage extension).
Sixteen runtime CSS custom properties consumed by render-base.css today;
the resolver pre-computes twenty for forward compatibility."* No
contradiction once you ask the right question.

---

## 5. The 7 preset families (real)

Defined in `visual/preset-families.ts`:

`neuro` (Neumorphic), `glass` (Glass), `retro` (Retro Pixel),
`chrome` (Chrome Metal), `flat` (Flat Minimal), `stark` (Stark Bold),
`chat` (Chat — golden vertical patterns).

**`chat` is a vertical-specific family.** Its variants are not the standard
6-variant set; they're golden patterns: `bubble-user`, `bubble-ai-developer`,
`bubble-ai-planning`, `bubble-ai-image`, `bubble-ai-general`, `bubble-system`,
`mode-pill-active`, `mode-pill-idle`, `decision-card`, `voice-orb-idle`,
`voice-orb-listening`, `cortex-node`, `session-row-active`, `frame-shell`.

This is a **competitive moat.** Other design systems do not ship a chat-vertical
preset family with this level of pattern coverage.

---

## 6. The 14 semantic intents → presets

From `visual/intent-map.ts`, this is the live shipping mapping:

| Intent | → Preset | Family |
|---|---|---|
| `primary` | `glass-deep` | glass |
| `secondary` | `neuro-minimal` | neuro |
| `ghost` | `flat-minimal` | flat |
| `danger` | `stark-glow` | stark |
| `neutral` | `neuro-muted` | neuro |
| `accent` | `chrome-glow` | chrome |
| `info` | `glass-minimal` | glass |
| `success` | `neuro-elevated` | neuro |
| `warning` | `stark-elevated` | stark |
| `default` | `neuro-elevated` | neuro |
| `glass` | `glass-deep` | glass |
| `matte` | `neuro-solid` | neuro |
| `flat` | `flat-minimal` | flat |
| `stark` | `stark-glow` | stark |

**Status:** This mapping is shipping. It is also the *provisional* behavior
for the parked Capability C decision (two-dimensional intent: family from
provider + role from intent). See PARKING-LOT.md PL-001.

---

## 7. The state model — internally inconsistent (drift flagged)

The state surface exists in three places and they don't agree:

| Layer | File | States |
|---|---|---|
| Preset schema | `visual/preset-definition.ts` `StateOverrides` | `hover`, `active`, `focus`, `disabled` (4) |
| Resolver type | `renderforge/types.ts` `RenderState` | `default`, `disabled`, `active` (3) |
| CSS/`data-state` runtime | `generated/render-base.css` + tests | `default`, `open`, `closed`, `minimized`, `hover`, `focus`, `active`, `disabled` (8 observed) |

**Bug:** `RenderState` is missing `hover` and `focus`, despite the preset
schema authoring them and the CSS handling them. See RENDERFORGE.md §
"Known bugs" item B2. Resolution: expand `RenderState`. (Phase 2 work.)

---

## 8. The package surface (and one ghost export)

From `package.json`:

```json
"exports": {
  "./style-macro":  { "import": "./style-macro/index.ts" },     // ← GHOST: directory does not exist
  "./behaviors":    { "import": "./behaviors/index.ts" },
  "./components/*": { "svelte":  "./components/*/index.ts" },
  "./blocks/*":     { "svelte":  "./blocks/*/index.ts" },
  "./primitives/*": { "svelte":  "./primitives/*/index.ts" },   // ← `primitives/` directory does not exist as such; behaviors/ has the WAI-ARIA APG hooks
  "./utils/*":      { "import":  "./utils/*/index.ts" },
  "./config":       { "import":  "./coldlight.config.ts" }
}
```

**Two export paths point at directories that don't exist:**
- `./style-macro` → no `style-macro/` folder. The resolver lives at `renderforge/`.
- `./primitives/*` → no `primitives/` folder. The behavior hooks live at `behaviors/`.

These are dead exports. See PARKING-LOT.md PL-002 for the resolution path.

**`blocks/` is alive and shipping.** Memory's "blocks is dead, replaced by templates" was conversational fiction. The directory has `chat/`, `widgets/`, `governance/` subfolders and is exported via `./blocks/*`. There is no `templates/` directory. Keep `blocks/`.

---

## 9. The component surface (real)

**65 primitive kinds** enumerated in `visual/kind-names.ts`:

> accordion, alert-dialog, badge, breadcrumbs, button, checkbox, color-field,
> color-slider, combobox, data-table, description-list, dialog, dot,
> empty-state, field, form, form-field, grid-list, heading, icon-slot,
> input-group, kbd, label, link, list, listbox, loading-overlay, menu,
> meter, notification-center, number-field, pagination, popover, progress,
> prose, radio-group, row, scroll-area, search-field, select, separator,
> sheet, sidebar, skeleton, skip-link, slider, spinner, stack, steps,
> surface, switch, table, table-of-contents, tabs, tag-group, text,
> text-field, textarea, toaster, toggle, toggle-group, toolbar, tooltip,
> tree.

**For comparison: HeroUI ships ~40, Radix ships ~30.** ColdLight's surface
is already enterprise-scale at 65.

---

## 10. Known bugs and drift (cross-references)

The full bug inventory is in RENDERFORGE.md. Summary here:

| ID | File | Issue |
|---|---|---|
| B1 | `renderforge/render.ts` | State branch only consults shared preset state tier; per-kind state tier is never consulted. |
| B2 | `renderforge/types.ts` | `RenderState` missing `hover` and `focus`. |
| B3 | `renderforge/render.ts` | `--border-style` hardcoded to `"solid"`, bypasses var chain. |
| B4 | `renderforge/resolve.test.ts` | Asserts `cssVars["-bg"]` everywhere; resolver emits `--background-color`. All assertions fail. |
| B5 | `components/chat-frame/ChatFrame.test.ts` | Same `-bg` assertion bug. |
| B6 | `components/chat-footer/ChatFooter.test.ts` | Same `-bg` assertion bug. |
| B7 | `renderforge/generated/kind-families.ts` | `glass`, `glass-deep`, `chat-frame` etc. don't include `overlay` family. Backdrop-filter resolves but the `[data-cl-overlay]` CSS rule never activates. |
| B8 | `renderforge/render.ts` + `intent.ts` + `types.ts` + `generated/render-base.css` | References "Per RenderForge.md Law N" / "Per MACRO-LAW.md Law N" — neither doc exists. |
| B9 | `package.json` | `./style-macro` and `./primitives/*` exports point at non-existent directories. |

**Bug-fix policy:** Phase 2 (next turn after sign-off) will address B1–B6 and B8. B7 is a real architectural call (does backdrop-filter belong only on overlay-family kinds, or universally on `[data-kind]`?) — see PARKING-LOT.md PL-003. B9 is a package-export decision — see PL-002.

---

## 11. What's locked vs what's parked

**Locked (no change without TRUTH.md update):**

- Five-stage styling pipeline (§2)
- Five-tier data-attribute taxonomy (§3)
- 11 DTCG authored axes / 16 runtime CSS custom properties consumed (§4)
- 7 preset families including `chat` vertical (§5)
- 14 semantic intents with their current mappings (§6, *provisional* per PL-001)
- 65 primitive kinds (§9)
- `blocks/` is real, alive, exported, and not going anywhere
- `renderforge/` is the runtime resolver location
- The pure-function constraint on `renderForge` (no DOM, no runes, no hooks)

**Parked (see PARKING-LOT.md):**

- PL-001: Two-dimensional intent model (Capability C)
- PL-002: `style-macro` and `primitives/*` ghost exports
- PL-003: Overlay family universality (B7 architectural call)
- PL-004: No-code compositional save-as-preset compiler (Capability D)
- PL-005: ChatFrame's `data-layout`, `data-engaged`, `data-context-collapsed` — Tier 3 (component-specific) by default, but worth a deliberate decision since they could promote to Tier 2 if other components adopt similar patterns.
- PL-006: React/RAC port package layout

---

## 12. Provenance discipline addendum

Going forward in this codebase:

1. **Every architectural claim cites a file path.** "TRUTH.md §3" or
   `visual/axes.ts:11` is fine; "ADR-001 § StyleMacro" is not allowed
   unless `ADR-001.md` exists on disk.

2. **Memory is a lead, not a source.** When an LLM or contributor's
   memory says X is locked, X is a hypothesis until verified against
   the file path that locks it.

3. **`tool_search` and filesystem reads come BEFORE confident
   assertions about the code.** Always.

4. **Distinguish "the code does X" from "we agreed X" from "memory
   says X."** Three different epistemic levels. Conflating them is
   how design systems rot.
