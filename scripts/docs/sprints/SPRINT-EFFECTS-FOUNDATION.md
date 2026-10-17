# SPRINT: ColdLight Foundation — Full Pipeline + Effects + VPB

**Status**: `READY FOR REVIEW`
**Depends on**: SD5 pipeline (DONE), token-categories.ts (DONE), encoding.ts (DONE), manifest (DONE), primitives (50+ DONE), Button gold standard (DONE)
**Research**: `SPRINT-EFFECTS-FOUNDATION.research.md`

---

## Vision

ColdLight is a **teaching tool disguised as a design system**. The pipeline:

```
┌─────────────────────────────────────────────────────────────┐
│ BUILDERS                                                     │
│ ColdLight-owned (default)  │  MeltUI transport (exception)  │
│ createButton()             │  createDialogTransport()        │
│ createCheckbox()           │  createComboboxTransport()      │
│ → owns ARIA, keyboard,    │  → wraps melt, exposes slots,   │
│   state, data-* attrs     │    ColdLight vocabulary          │
└────────────────┬───────────┴────────────┬───────────────────┘
                 │                        │
                 ▼                        ▼
┌─────────────────────────────────────────────────────────────┐
│ PRIMITIVES (50+ exist, structureless shells)                 │
│ data-kind="button" data-slot="root"                         │
│ Zero ARIA. Zero behavior. Zero styling.                     │
│ Receives builder attrs via spread: {...builder.root}        │
└─────────────────────────┬───────────────────────────────────┘
                          │ DsAdapter (this sprint builds it)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│ PREPARED COMPONENTS (ColdLight-driven)                       │
│ = primitive + builder + recipe + 8-axis props + v= system   │
│                                                              │
│ EVERY component gets:                                        │
│  • 8 ColdLight props (surface, material, depth, bevel,      │
│    glow, frame, motion, transition)                          │
│  • ARIA from builder (role, aria-*, keyboard, focus)         │
│  • data-kind + data-slot + data-state                       │
│  • .name convention (kind identifier)                        │
│  • v= encoding system (v-s1z2d3 class strings)             │
│  • Default preset per kind (overridable)                     │
│  • Recipe-driven CSS composition via DsSurfaceProps          │
│  • VPB-clickable in dev mode                                │
└─────────────────────────────────────────────────────────────┘
```

**Button is the GOLD STANDARD** — it proves the full pipeline works:
- `primitives/button/Button.svelte` — structureless shell with `data-kind="button"` `data-slot="root"`
- `api/adapters/coldlight/_internal/button/factory.ts` — `createButton()` owns ARIA, keyboard, state
- `components/button/Button.svelte` — spreads `{...builder.root}`, applies `buttonRecipe({ intent, size })`
- `components/button/recipe.ts` — returns `"btn btn-primary v-s1 v-d1 v-g6 sz-md rounded-lg"`
- `components/button/contract.ts` — ComponentContract with slots, ARIA, keyboard, states

**THIS SPRINT** scales the Button pattern to ALL components, builds the DsAdapter bridge, wires VPB, and expands effects/tokens for full Tailwind coverage.

---

## What EXISTS and WORKS End-to-End

| Layer | Status | Files |
|-------|--------|-------|
| **50+ Primitives** | DONE | `primitives/{kind}/` — structureless, contract-driven |
| **Primitive contracts** | DONE | `primitives/{kind}/contract.ts` — PrimitiveContract type, Zod-validated |
| **ColdLight builders** | PARTIAL | `api/adapters/coldlight/_internal/button/` — Button ONLY |
| **MeltUI transports** | DONE | `api/adapters/meltui/_internal/` — 18 builders wrapped |
| **Button component** | DONE | `components/button/` — gold standard: primitive + builder + recipe |
| **Recipe system** | DONE | `recipes/` — registerRecipe/getRecipe + DsSurfaceProps |
| **Recipe utilities** | DONE | `recipes/utils.ts` — emitSegments/emitEncoding/emitCategory/radiusClass |
| **DsSurfaceProps** | DONE | `recipes/types.ts` — 8 semantic categories + radius + size, Zod-validated |
| **Encoding system** | DONE | `registry/encoding.ts` — encode/decode/resolve + `registry/token-categories.ts` — 52 values |
| **Builder infrastructure** | DONE | `api/adapters/coldlight/builders/` — Synced runes, metadata, keyboard, merge-attrs |
| **Config SSOT** | DONE | `coldlight.config.ts` — adapters, vocabularies, attributes, enforcement |
| **Vocabularies** | DONE | `config/coldlight/vocabularies.cfg.ts` — ARIA_ROLES, STATE_TOKENS, KEYBOARD_KEYS, HTML_ELEMENTS, FOCUS_STRATEGIES |
| **SD5 pipeline** | DONE | `scripts/dev/design/sd/build.ts` — generates ALL CSS, manifest, types |
| **Variant CSS** | DONE | `generated/variants.css` — 52 @utility blocks from SSOT |
| **Manifest** | DONE | `generated/coldlight.manifest.json` — 8 categories, 52 values, 17 enums |
| **Effects schema** | DONE | `effects/_schema/` — types + Zod |
| **Effects registry** | DONE | `effects/registry.ts` — 29 effects across 5 categories |
| **Keyframes** | DONE | `generated/keyframes.css` — 10 @keyframes |

---

## What's MISSING — This Sprint Builds It

### Phase 1: Generator Fix + Pipeline Verification

#### Task 1: Fix SD5 Generator — Empty @utility Blocks ✅ DONE

**Problem**: `sd/formats/variants.ts` emitted empty `@utility` blocks. Tailwind v4 crashes.
**Fix**: Generator now emits `--v-{code}: {index};` for empty tokenRefs.

- [x] Fix `sd/formats/variants.ts` — emit inert custom property for empty tokenRefs
- [x] Run `pnpm ds:tokens:build` — regenerate `variants.css`
- [x] Verify dev server starts clean — no `@utility is empty` errors

---

### Phase 2: DsAdapter — The Primitive-to-Component Bridge

This is the CORE of the sprint. Every primitive becomes a prepared component.

#### Task 2: `resolveVisual()` — Universal Prop Resolution

**What**: The ONE function that takes ANY input and produces resolved CSS. Every component calls this. VPB manipulates this. This IS the DsAdapter resolution engine.

**File**: `registry/resolve-visual.ts` (NEW)

**API**:
```typescript
// Input — pick any combination, mix freely:
type ColdLightProps = {
  preset?: string;                    // "panel-glass", "btn-primary"
  surface?: number | SurfaceId;       // 1 or "glass-void"
  material?: number | MaterialId;
  depth?: number | DepthId;
  bevel?: number | BevelId;
  glow?: number | GlowId;
  frame?: number | FrameId;
  motion?: number | MotionId;
  transition?: number | TransitionId;
  encoding?: string;                  // "v-s1z2d3"
  radius?: RadiusToken;              // "md", "lg", "full"
  size?: SizeToken;                  // "sm", "md", "lg"
};

// Output — everything needed to render:
type ResolvedVisual = {
  values: EncodingIndices;            // { s: 1, z: 0, d: 2, ... }
  preset: Preset;                     // { surface: "glass-void", depth: "z2", ... }
  encoding: string;                   // "v-s1d2" (dense)
  segments: string;                   // "v-s1 v-d2" (sparse, composable)
  radius: string;                     // "rounded-lg"
  cssProperties: Record<string, string>;  // resolved tokenRefs for inline styles
};
```

**Resolution order**: `kind defaults → preset → individual props → encoding override`

- [ ] Create `registry/resolve-visual.ts`
- [ ] Import existing `resolveToIndices`, `resolveToPreset` from token-categories.ts
- [ ] Import `emitSegments`, `emitEncoding`, `radiusClass` from recipes/utils.ts
- [ ] Add preset lookup (reads from presets registry)
- [ ] Add semantic-to-index resolution (e.g., `glow: "teal"` → index 1)
- [ ] Add encoding string parse → merge with props
- [ ] Collect resolved tokenRefs from registry for `cssProperties`
- [ ] Export `resolveVisual()`, `ColdLightProps`, `ResolvedVisual`
- [ ] Zod validate inputs at boundary (ColdLightPropsSchema)

---

#### Task 3: Prepared Component Base — The Universal Interface

**What**: The base types and mixin that makes ANY primitive into a prepared ColdLight component. This is what "DsAdapter to ColdLight" means in code.

**Files**: `components/_base/` (NEW)

##### 3A: Base Types
- [ ] Create `components/_base/types.ts`
- [ ] `PreparedComponentProps<TKind>` — ColdLightProps + `class` + `children` + kind-specific
- [ ] Every component type extends `PreparedComponentProps`
- [ ] `ComponentDefaults` — per-kind default preset mapping

##### 3B: `useColdLight()` Rune Helper
- [ ] Create `components/_base/use-coldlight.svelte.ts`
- [ ] Svelte 5 rune that wraps `resolveVisual()` reactively:
  ```typescript
  export function useColdLight(props: () => ColdLightProps, kindDefaults?: Partial<Preset>) {
    const resolved = $derived(resolveVisual({ ...kindDefaults, ...props() }));
    return resolved; // { segments, encoding, radius, cssProperties, ... }
  }
  ```
- [ ] Memoized — only recalculates when props actually change
- [ ] Returns `ResolvedVisual` that components spread as class strings

##### 3C: `data-*` Attribute Wiring
- [ ] Every prepared component emits: `data-kind={kind}`, `data-slot="root"`, `data-state={state}`
- [ ] These already exist on primitives — verify they're preserved through the component layer
- [ ] Add `data-encoding` attribute for VPB to read current v= string
- [ ] Add `data-preset` attribute if a named preset is active

---

#### Task 4: Preset Registry — System Presets (Per-Kind Defaults)

**What**: Named presets that map to curated 8-axis DsSurfaceProps. These are the per-kind defaults. What VPB shows. What juniors pick.

**File**: `registry/presets.ts` (NEW)

- [ ] Create `registry/presets.ts`
- [ ] `PresetDefinition = { id, kind, label, description, values: Partial<Preset>, isSystem }`
- [ ] Register system presets — grouped by component kind:

**Buttons** (default: `btn-primary`):
```
btn-primary:   { surface: "glass-void", depth: "z1", glow: "cyber", frame: "none", transition: "fast" }
btn-secondary: { surface: "glass-void", depth: "z1", frame: "soft", transition: "fast" }
btn-outline:   { surface: "transparent", frame: "hard", transition: "fast" }
btn-ghost:     { surface: "transparent", transition: "fast" }
btn-danger:    { surface: "solid-teal", depth: "z1", glow: "ember", transition: "fast" }
```

**Panels** (default: `panel-glass`):
```
panel-glass:   { surface: "glass-deep", depth: "z2", bevel: "subtle", frame: "soft" }
panel-matte:   { surface: "matte-dark", depth: "z1", frame: "soft" }
panel-void:    { surface: "glass-void", frame: "none" }
panel-code:    { surface: "matte-dark", frame: "hard", bevel: "subtle" }
```

**Cards** (default: `card-default`):
```
card-default:  { surface: "glass-smoke", depth: "z2", frame: "soft", bevel: "subtle" }
card-elevated: { surface: "glass-frost", depth: "z3", bevel: "soft", frame: "soft" }
card-glow:     { surface: "glass-deep", depth: "z2", glow: "teal", frame: "soft" }
```

**Shell** (default: per-slot):
```
shell-app:       { surface: "void-gradient" }
shell-sidebar:   { surface: "glass-void", frame: "soft" }
shell-topbar:    { surface: "glass-void", bevel: "subtle" }
shell-statusbar: { surface: "glass-void" }
```

**Inputs** (default: `input-default`):
```
input-default: { surface: "glass-void", frame: "soft", transition: "fast" }
input-focus:   { surface: "glass-void", frame: "glow", glow: "teal", transition: "fast" }
input-error:   { surface: "glass-void", frame: "hard", glow: "ember", transition: "fast" }
```

**Badges** (default: `badge-accent`):
```
badge-accent:  { surface: "solid-teal", frame: "none" }
badge-signal:  { surface: "glass-void", glow: "teal", frame: "soft" }
badge-ghost:   { surface: "transparent", frame: "soft" }
```

**Chat** (default: per-slot):
```
chat-bubble-ai:     { surface: "glass-deep", depth: "z1", bevel: "subtle" }
chat-bubble-user:   { surface: "glass-smoke", depth: "z1" }
chat-bubble-system: { surface: "matte-dark", frame: "soft" }
chat-input:         { surface: "glass-void", frame: "soft", transition: "fast" }
```

**Widgets** (default: per-kind):
```
widget-stat:     { surface: "glass-smoke", depth: "z1", frame: "soft" }
widget-chart:    { surface: "glass-deep", depth: "z2", frame: "soft" }
widget-gauge:    { surface: "glass-deep", depth: "z1", glow: "teal", motion: "breathe" }
widget-timeline: { surface: "glass-smoke", bevel: "subtle" }
widget-table:    { surface: "matte-dark", frame: "hard" }
widget-kpi:      { surface: "glass-frost", depth: "z2", glow: "cyber" }
```

**Modals** (default: `modal-glass`):
```
modal-glass: { surface: "glass-frost", depth: "z4", bevel: "soft", frame: "soft", transition: "smooth" }
modal-alert: { surface: "glass-deep", depth: "z3", glow: "ember", frame: "hard", transition: "fast" }
```

**Navigation** (default: per-state):
```
nav-item:   { surface: "transparent", transition: "fast" }
nav-active: { surface: "glass-void", glow: "teal", frame: "soft", transition: "fast" }
nav-group:  { surface: "glass-void" }
```

- [ ] `getPreset(id)` → O(1) Map lookup
- [ ] `getPresetsForKind(kind)` → filtered list for VPB palette
- [ ] `getDefaultPreset(kind)` → the default preset for a component kind
- [ ] `getAllPresets()` → manifest serialization
- [ ] Zod schema: `PresetDefinitionSchema`
- [ ] Wire into manifest generation in `sd/build.ts`

---

#### Task 5: Scale Button Pattern to High-Priority Components

**What**: Take the Button gold standard and replicate it for the next tier of components. Each one gets: ColdLight builder (if ColdLight-owned) or transport usage (if MeltUI-backed), recipe with DsSurfaceProps, 8-axis props, prepared component.

**Gold standard pattern** (what Button already does):
```svelte
<!-- components/{kind}/{Kind}.svelte -->
<script lang="ts">
  // 1. Builder owns ARIA + state
  const builder = createXxx({ disabled: () => disabled, ... });

  // 2. useColdLight() resolves 8-axis props → class strings
  const visual = useColdLight(() => ({ preset, surface, depth, glow, ... }), KIND_DEFAULTS);

  // 3. Recipe composes structural + visual classes
  const classes = $derived(cn(visual.segments, visual.radius, structuralClasses, className));
</script>

<!-- 4. Spread builder ARIA onto primitive -->
<{Kind}Root {...builder.root} class={classes} data-encoding={visual.encoding}>
  {@render children?.()}
</{Kind}Root>
```

##### 5A: ColdLight-Owned (need builder + component)
Priority order — most used first:
- [ ] **Checkbox** — `createCheckbox()` builder + component + recipe
- [ ] **Switch** — `createSwitch()` builder + component + recipe
- [ ] **Input** — `createInput()` builder + component + recipe
- [ ] **Card** — `createCard()` builder + component + recipe
- [ ] **Panel** — `createPanel()` builder + component + recipe
- [ ] **Badge** — `createBadge()` builder + component + recipe
- [ ] **Alert** — `createAlert()` builder + component + recipe
- [ ] **Divider** — `createDivider()` builder + component + recipe

Each gets:
- `api/adapters/coldlight/_internal/{kind}/factory.ts` — builder class
- `api/adapters/coldlight/_internal/{kind}/types.ts` — builder props
- `components/{kind}/{Kind}.svelte` — prepared component
- `components/{kind}/recipe.ts` — DsSurfaceProps recipe (gold standard pattern)
- `components/{kind}/types.ts` — PreparedComponentProps<"{kind}">
- `components/{kind}/contract.ts` — ComponentContract

##### 5B: MeltUI-Backed (transport exists, need component)
These already have transports — need prepared component wrappers:
- [ ] **Dialog** — component wrapping `createDialogTransport()` + recipe
- [ ] **Tabs** — component wrapping `createTabsTransport()` + recipe
- [ ] **Select** — component wrapping `createSelectTransport()` + recipe
- [ ] **Popover** — component wrapping `createPopoverTransport()` + recipe
- [ ] **Accordion** — component wrapping `createAccordionTransport()` + recipe
- [ ] **Tooltip** — component wrapping `createTooltipTransport()` + recipe

Each gets:
- `components/{kind}/{Kind}.svelte` — prepared component using transport
- `components/{kind}/recipe.ts` — DsSurfaceProps recipe
- `components/{kind}/types.ts` — PreparedComponentProps
- `components/{kind}/contract.ts` — ComponentContract

##### 5C: Kill Legacy Recipe Pattern
- [ ] Migrate `components/button/recipe.ts` from hardcoded v-encoding to `useColdLight()` + DsSurfaceProps
- [ ] Remove ALL legacy shortcodes (`v-l1`, `v-e-2`, `sz-sm`) from recipe files
- [ ] Every recipe uses `emitSegments(toPreset(props))` + `radiusClass()` — NO hardcoded class strings

---

### Phase 3: VPB — Dev-Mode Teaching Tool

VPB is NOT a separate app. It IS the dev-mode UI overlay. It reads ColdLight's manifest/registry and presents controls. It teaches. It generates files.

#### Task 6: VPB Overlay Foundation

##### 6A: VPB State Rune
- [ ] Create `sys/debug/vpb/state.svelte.ts`
- [ ] `$state` for: active node, current preset values, edit mode, overlay visibility, selected avenue
- [ ] Edit modes: `"quick"` (preset picker), `"standard"` (category controls), `"advanced"` (full compositor)
- [ ] Track: selectedKind, currentEncoding, currentPreset, modifications stack

##### 6B: VPB Dev-Mode Click Action
- [ ] Create `sys/debug/vpb/actions/vpb-click.ts`
- [ ] Svelte action: `use:vpbClick`
- [ ] In dev mode: clicking a prepared component → reads `data-kind`, `data-slot`, `data-encoding`, `data-preset`
- [ ] Opens VPB overlay populated with that component's current state
- [ ] Also: `use:vpbHighlight` — hover highlight shows component boundaries + kind label

##### 6C: VPB Overlay Shell
- [ ] Create `sys/debug/vpb/VpbOverlay.svelte`
- [ ] Renders when `import.meta.env.DEV` + component clicked
- [ ] Avenue tabs: Visual, Component, Block, Recipe, Code, Docs
- [ ] Each avenue has its own panel component
- [ ] Overlay position: anchored to selected component, repositionable

##### 6D: Category Controls (Visual Avenue)
- [ ] Create `sys/debug/vpb/panels/CategoryPanel.svelte`
- [ ] Reads manifest → renders controls per category based on `vpbControl`:
  - `"select"` → dropdown with preview swatches (surface, material, glow, frame, motion, transition)
  - `"slider"` → range slider with live preview (depth, bevel)
- [ ] Each control shows: **Label** (human name), **Current value**, **Suggestions**, **Token reference** (what CSS this resolves to)
- [ ] Live preview updates via `$derived` reactivity as user interacts

##### 6E: Preset Picker (Quick Mode)
- [ ] Create `sys/debug/vpb/panels/PresetPanel.svelte`
- [ ] Grid of preset cards grouped by kind (buttons, panels, cards, etc.)
- [ ] Each card: name, visual preview (mini rendered element), encoding string
- [ ] Click to apply → calls `resolveVisual()` with preset → updates component
- [ ] "Customize" → switches to Standard mode with preset values loaded
- [ ] "Save as Preset" → future: DB persistence

##### 6F: Code Output (Code Avenue)
- [ ] Create `sys/debug/vpb/panels/CodePanel.svelte`
- [ ] Shows generated code for current selection:
  - Svelte: `<Panel preset="panel-glass" glow="teal" />`
  - Encoding: `v-s1z1d2g1f1t3`
  - CSS: resolved tokenRefs as CSS custom properties
  - Tailwind: equivalent TW4 utility classes
- [ ] Copy button per format
- [ ] Teaching: explains what each axis does in the context of the current selection

##### 6G: Suggestions Engine
- [ ] Create `sys/debug/vpb/suggestions.ts`
- [ ] Context-aware, rule-based (NOT random tips):

**Composition rules:**
- glass + depth ≥ 2 → "Glass with elevation creates floating panel effect"
- glow + no surface → "Glow needs a surface to anchor the halo"
- glow + glass → "Glass + glow creates the signature ColdLight look"
- depth ≥ 3 + no frame → "High elevation needs a frame to anchor shadows"
- multiple conflicting effects → warning about shadow layer conflicts

**Accessibility rules:**
- no focus style on interactive → "Interactive elements MUST have visible focus indicators"
- contrast check → "Text on this surface may not meet WCAG 2.1 contrast ratio"
- motion + prefers-reduced-motion → "All motion auto-respects prefers-reduced-motion"

**Terminology teaching:**
- Hovering any control → tooltip with: what it is, what CSS it maps to, when to use it

---

### Phase 4: Dashboard + Widget System

#### Task 7: Dashboard Widget Foundation

##### 7A: Widget Block Schema
- [ ] Create `blocks/widgets/schema.ts`
- [ ] Zod schema: `kind` (stat|chart|gauge|timeline|table|kpi), `coldlight` (ColdLightProps), `data` (binding), `size` (grid span), `refresh` (interval)

##### 7B: Widget Presets
- [ ] Register in presets registry: widget-stat, widget-chart, widget-gauge, widget-timeline, widget-table, widget-kpi (values listed in Task 4)

##### 7C: Dashboard Grid
- [ ] Create `blocks/dashboards/schema.ts`
- [ ] Dashboard = CSS Grid of widget blocks
- [ ] Per-hub layouts:
  - Chat: conversation stats, active sessions, model usage, token costs
  - Services: API health, uptime, error rates, latency
  - Utils: system metrics, disk, memory, network, processes

---

### Phase 5: Token + Effect Expansion for Full Tailwind Coverage

Every Tailwind v4 visual effect gets a ColdLight token. VPB exposes them all during dev.

#### Task 8: Expand Tier 1 Tokens

##### 8A: Transform Tokens
- [ ] Create `tokens/effects/transform.ts`
- [ ] Scale: scale-95, scale-100, scale-105, scale-110, scale-125, scale-150
- [ ] Translate: translate-0, translate-1, translate-2, translate-4, translate-8 (+ negative)
- [ ] Rotate: rotate-0, rotate-1, rotate-2, rotate-3, rotate-6, rotate-12, rotate-45, rotate-90, rotate-180
- [ ] Skew: skew-0, skew-1, skew-2, skew-3, skew-6, skew-12

##### 8B: Filter Tokens
- [ ] Create `tokens/effects/filter.ts`
- [ ] Brightness: brightness-0, 50, 75, 90, 95, 100, 105, 110, 125, 150, 200
- [ ] Contrast: contrast-0, 50, 75, 100, 125, 150, 200
- [ ] Saturate: saturate-0, 50, 100, 150, 200
- [ ] Grayscale: grayscale-0, grayscale-100
- [ ] Sepia: sepia-0, sepia-100

##### 8C: Opacity Tokens
- [ ] Create `tokens/effects/opacity.ts`
- [ ] Values: 0, 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100

##### 8D: Typography Tokens (gaps)
- [ ] Create `tokens/typography/weights.ts` — thin, light, normal, medium, semibold, bold, extrabold, black
- [ ] Create `tokens/typography/leading.ts` — none, tight, snug, normal, relaxed, loose
- [ ] Create `tokens/typography/tracking.ts` — tighter, tight, normal, wide, wider, widest

##### 8E: Expand Keyframes
- [ ] Add to `tokens/motion/keyframes.ts`:
  - **Entrance**: fade-in, slide-up, slide-down, slide-left, slide-right, scale-in, blur-in, rotate-in
  - **Exit**: fade-out, slide-out-up, slide-out-down, scale-out, blur-out
  - **Attention**: shake, wiggle, bounce-in, rubber-band, jiggle
  - **Loading**: skeleton-pulse, progress-bar, spinner-rotate

##### 8F: Update SD5 Pipeline
- [ ] Add new token domains to `config/coldlight/tokens.cfg.ts`
- [ ] Regenerate: `pnpm ds:tokens:build`
- [ ] All new tokens → CSS custom properties + @theme + TypeScript types

---

#### Task 9: Expand Effects Registry

##### 9A: Transition Effects (Interactive — hover, focus, active, disabled)
- [ ] Add `"transition"` to EFFECT_CATEGORIES in `effects/_schema/types.ts`
- [ ] Create `effects/categories/transition/index.ts`
- [ ] Register:
  - **Hover**: hover-brighten, hover-dim, hover-scale, hover-lift, hover-glow-teal, hover-glow-purple, hover-glow-ember
  - **Focus**: focus-ring, focus-glow, focus-outline
  - **Active**: active-press, active-dim, active-scale
  - **Disabled**: disabled-mute (opacity + grayscale + pointer-events)

##### 9B: Expand Motion Effects (Non-Interactive — animations, ambient)
- [ ] Add to `effects/categories/motion/index.ts`:
  - **Entrance**: slide-up, slide-down, slide-left, slide-right, scale-in, blur-in, rotate-in
  - **Attention**: shake, wiggle, bounce-in, rubber-band
  - **Ambient**: breathe, shimmer, drift, pulse (bridge to encoding m1-m4)
  - **Loading**: skeleton, spinner, progress

##### 9C: Effect ↔ Encoding Bridge
- [ ] Create `effects/bridge.ts`
- [ ] Map: encoding m0-m4 → registered motion effect definitions
- [ ] Map: encoding t0-t6 → transition timing effect definitions
- [ ] VPB works at either level: **Knob mode** (encoding slider) OR **Composer mode** (individual effects)
- [ ] `effectsForEncoding(code, index)` → EffectDefinition[]
- [ ] `encodingForEffect(effectId)` → { code, index } | null

---

#### Task 10: Effects CSS Generation (SD5 Pipeline)

- [ ] Create `sd/formats/effects.ts` — generates `@utility` blocks from effects registry
- [ ] Add `generated/effects.css` to CSS barrel (`index.css`)
- [ ] Import order: tokens → tailwind → variants → **effects** → typography → focus → scrollbars → keyframes → svg
- [ ] ALL effects flow through SD5 — zero hand-authored CSS

---

#### Task 11: Svelte Actions for JS-Driven Effects

- [ ] Create `effects/actions/intersection-reveal.ts` — IntersectionObserver → entrance animations on viewport enter
- [ ] Create `effects/actions/glow-track.ts` — cursor-following glow halo
- [ ] Create `effects/actions/index.ts` — action registry barrel
- [ ] Wire into effect definitions via `customJS` field on EffectDefinition

---

## Execution Order

```
Phase 1: Pipeline Fix (DONE)
  └─ Task 1 ✅ — generator fix, dev server boots

Phase 2: DsAdapter Bridge (CRITICAL PATH)
  ├─ Task 2 — resolveVisual() (everything depends on this)
  ├─ Task 3 — Prepared component base (useColdLight, types, data-*)
  ├─ Task 4 — Preset registry (per-kind defaults)
  └─ Task 5 — Scale to all high-priority components

Phase 3: VPB Dev Tool
  └─ Task 6 — Overlay, panels, click action, suggestions

Phase 4: Dashboard Widgets
  └─ Task 7 — Widget schemas, presets, dashboard grids

Phase 5: Token + Effect Expansion
  ├─ Task 8 — Tier 1 tokens (transform, filter, opacity, typography, keyframes)
  ├─ Task 9 — Effects registry (transition, motion, bridge)
  ├─ Task 10 — Effects CSS generation
  └─ Task 11 — JS actions (intersection, cursor)
```

---

## Checkpoints

**After Task 1** ✅: Dev server starts. `pnpm ds:tokens:build` produces clean variants.css.

**After Task 3**: `useColdLight()` rune works. Any component can call it to get resolved visual classes from 8-axis props.

**After Task 5**: All high-priority components are prepared: 8-axis props, ARIA from builder, data-kind/data-slot, recipe-driven CSS, default presets. Button pattern replicated everywhere.

**After Task 6**: Click any prepared component in dev mode → VPB overlay appears → 8-axis controls → change surface/depth/glow → live preview → see generated code → learn what each axis does.

**After Task 7**: Each hub has a dashboard with widget blocks using ColdLight presets.

**After Task 10**: `pnpm ds:tokens:build` generates ALL CSS — variants, effects, keyframes — from SSOT. Zero hand-written CSS.

---

## VPB Edit Modes

| Mode | Who | What They See |
|------|-----|---------------|
| **Quick** | Complete beginners | Preset grid. Pick one. Done. |
| **Standard** | Juniors learning | Category controls (sliders/selects) + suggestions + token explanations |
| **Advanced** | Experienced devs | Full compositor. Individual effects. Custom presets. Code view. |

All modes produce the same output. Schema-driven from manifest. No CSS knowledge required.

---

## VPB — Comprehensive Notes

> VPB is NOT a visual page builder in the traditional sense. It is a **guided, educational, schema-driven dev tool** that happens to build pages. Its primary job is to make ColdLight's entire visual system accessible to juniors who don't know CSS, SD5, or accessibility patterns — while producing production-quality, best-practice code.

### What VPB IS

1. **A teaching tool** — Every control teaches. Tooltips explain "glass-void". Suggestions explain why bevel pairs with depth. Token references show generated CSS. Juniors learn SD5, OKLCH, Tailwind v4, accessibility, component architecture by USING it.

2. **A guided wizard system** — Walks users through decisions:
   - "What kind?" → validated taxonomy selection
   - "What visual identity?" → preset picker with previews
   - "Customize?" → category controls with suggestions
   - "Where does it go?" → slot/composition picker
   - "Save?" → generates files, folder structure, contracts, tests

3. **A file generator** — Generates following 6-Stage Gate:
   - `primitives/{kind}/contract.ts`, `{Kind}.svelte`, `types.ts`, `index.ts`, `{Kind}.test.ts`
   - `components/{kind}/contract.ts`, `{Kind}.svelte`, `recipe.ts`, `types.ts`, `index.ts`, `{Kind}.test.ts`
   - Recipe registrations, preset entries, manifest updates

4. **A multi-avenue system** — Tabs for different concerns:

### VPB Avenues

| Avenue | Purpose | What It Shows |
|--------|---------|---------------|
| **Visual** | 8-axis ColdLight controls | Surface/material/depth/bevel/glow/frame/motion/transition. Live preview. Preset picker. Encoding output. |
| **Component** | Kind-level settings | Taxonomy kind, ARIA requirements, slot definitions, state tokens, keyboard map, focus strategy. Reads/writes contracts. |
| **Block** | Composition/assembly | SvelteFlow node graph. Slot wiring. Child components. Block schema. Dashboard widget placement. |
| **Recipe** | Styling patterns | Recipe authoring. DsSurfaceProps mapping. Variant encoding. Per-slot class strings. Recipe registry. |
| **Code** | Generated output | Live code preview (Svelte, CSS, TypeScript). Copy buttons. Diff view (before/after). File generation triggers. |
| **Docs** | Educational reference | Terminology glossary. SD5 pipeline explanation. Token architecture diagrams. Best practice patterns. WAI-ARIA APG references. |

### VPB Wizard Flows

#### Flow 1: "Create a Component"
```
1. Name (kebab-case) → validates against taxonomy
2. Archetype: ColdLight-owned (default) or MeltUI adapter (justified exception)
3. Slots: root, trigger, content, etc. → picks from HTML_ELEMENTS
4. States: open/closed, selected, disabled → picks from STATE_TOKENS
5. ARIA role → picks from ARIA_ROLES
6. Focus strategy → trap, roving, activedescendant, redirect, none
7. Keyboard → picks from KEYBOARD_KEYS
8. Default preset → preset picker with visual preview
9. Review summary → shows what will be generated
10. Generate → ALL files following 6-Stage Gate
```

#### Flow 2: "Style a Component"
```
1. Click component in dev mode → VPB overlay opens
2. Visual avenue active → shows current 8-axis values
3. Quick: pick preset from grid → done
4. Standard: adjust categories (dropdowns, sliders, pickers)
5. Suggestions panel → contextual tips as user adjusts
6. Code panel → live encoding, Svelte usage, CSS output
7. Save as preset → name, categorize, register
```

#### Flow 3: "Build a Dashboard"
```
1. Select hub (chat, services, utils)
2. Pick layout template (or blank grid)
3. Widget palette → drag onto grid
4. Each widget → VPB click → customize with 8-axis controls
5. Data binding → select source, refresh interval
6. Save → block schema persisted
```

#### Flow 4: "Build a Block"
```
1. Choose block kind from palette
2. SvelteFlow composition tree
3. Add child components to slots
4. Each node → customize with VPB
5. Wire data flow (props cascade)
6. Preview → live rendered
7. Generate → block schema + renderer files
```

### VPB Suggestion System

Context-aware, rule-based guidance reading current state:

**Composition**: glass+depth → floating effect; glow+glass → signature look; depth+no frame → shadow anchor warning
**Accessibility**: no focus → must add; contrast check; motion → prefers-reduced-motion
**Teaching**: hover any control → tooltip with CSS mapping, use case, best practice

### VPB Build Modes

| Mode | Flag | Who | What Changes |
|------|------|-----|-------------|
| **Dev** | `import.meta.env.DEV` | Developers | Full VPB: all avenues, wizards, file generation, suggestions |
| **Production** | `!DEV` | End users | VPB stripped. Zero bundle impact. |
| **Customer** | Feature flag | Client teams | Simplified: preset picker only. No code gen. Theme within constraints. |

### VPB Data Flow

```
Click component → read data-kind, data-slot, data-encoding, data-preset
    → VPB state updates (selectedKind, currentEncoding, currentPreset)
    → Overlay renders with correct avenue
    → User modifies (preset / category / effect)
    → resolveVisual() recalculates ($derived)
    → Live preview updates
    → User saves: Apply | Save Preset | Generate | Copy Code
```

### VPB File Structure

```
sys/debug/vpb/
├── state.svelte.ts           # Reactive state ($state, $derived)
├── VpbOverlay.svelte         # Main shell (avenue tabs)
├── suggestions.ts            # Rule-based suggestion engine
├── panels/
│   ├── CategoryPanel.svelte  # 8-axis controls (Visual avenue)
│   ├── PresetPanel.svelte    # Preset grid picker
│   ├── CodePanel.svelte      # Generated code output
│   ├── ComponentPanel.svelte # Component wizard
│   ├── BlockPanel.svelte     # Block composition (SvelteFlow)
│   ├── RecipePanel.svelte    # Recipe authoring
│   └── DocsPanel.svelte      # Educational reference
├── actions/
│   ├── vpb-click.ts          # Svelte action: open overlay on click
│   └── vpb-highlight.ts      # Svelte action: hover boundary highlight
├── wizards/
│   ├── CreateComponent.svelte
│   ├── CreateBlock.svelte
│   ├── CreateDashboard.svelte
│   └── CreatePreset.svelte
└── generators/
    ├── component.ts          # Generate primitive + component files
    ├── block.ts              # Generate block schema + renderer
    ├── recipe.ts             # Generate recipe files
    └── templates/
        ├── primitive.svelte.template
        ├── component.svelte.template
        ├── contract.ts.template
        ├── types.ts.template
        └── test.ts.template
```

---

## The Full Pipeline — How Everything Connects

```
AUTHOR WRITES:
  <Button preset="btn-primary" glow="teal" />
      OR
  <Panel surface="glass-deep" depth={2} bevel="subtle" class="p-4">
  <Card encoding="v-s2d2b1f1">

COMPONENT LAYER:
  1. useColdLight() resolves props → ResolvedVisual
     - Merges: kind defaults → preset → individual props → encoding
     - Calls resolveToIndices() → numeric indices
     - Calls emitSegments() → "v-s1 v-d2 v-g1"
     - Calls radiusClass() → "rounded-lg"

  2. Builder provides ARIA + state
     - ColdLight-owned: createButton() → role, aria-*, keyboard, data-state
     - MeltUI-backed: createDialogTransport() → same via transport

  3. Recipe composes final class string
     - cn(visual.segments, visual.radius, structuralClasses, className)

PRIMITIVE LAYER:
  <button
    data-kind="button"
    data-slot="root"
    data-state="off"
    data-encoding="v-s1d1g1"
    data-preset="btn-primary"
    role="button"
    aria-pressed="false"
    class="v-s1 v-d1 v-g1 rounded-lg inline-flex items-center"
  >
    Label
  </button>

TAILWIND v4 RESOLVES:
  v-s1 → @utility → background: var(--glass-void); backdrop-filter: blur(...);
  v-d1 → @utility → box-shadow: var(--shadow-z1);
  v-g1 → @utility → box-shadow: var(--shadow-glow-teal);

VPB (DEV MODE):
  Click button → reads data-kind="button", data-encoding="v-s1d1g1"
  → Opens overlay → Visual avenue → shows surface=glass-void, depth=z1, glow=teal
  → User changes glow to "purple" → resolveVisual() recalculates → live preview
  → Code panel shows: <Button preset="btn-primary" glow="purple" />
  → Suggestion: "Purple glow on glass creates a deep-space look — pair with depth z2+"
```

---

## Out of Scope (Future Sprints)

- DB persistence for user presets/overrides (needs Prisma/LibSQL)
- Light variant theme (token value swap)
- Layers (`l`) axis — SVG filter stacking
- Full compositor compiler
- Theme import/export
- AI suggestion engine (Maestro integration)
- Customer build mode (simplified VPB for client teams)
- SvelteFlow block editor (Block avenue — needs @xyflow/svelte)
