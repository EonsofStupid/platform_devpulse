# Research: ColdLight Visual Scaffolding

**Date**: 2026-02-07
**Sprint**: SPRINT-VISUAL-SCAFFOLDING
**Status**: COMPLETE

## Question/Goal

Fix ColdLight's broken token→CSS pipeline, delete ad-hoc CSS, implement variant key encoding (`v-s1z2l0t2m0`), SVG depth/bevel, schema-driven 3-tier token architecture, and scaffold visuals matching reference images (CHAT-REFERENCE-01/02.png, DASHBOARD-REFERENCE-01.png).

Sub-questions:
1. What is the correct structure for a massive schema-driven design token library?
2. What are clear conceptual lines between tokens, recipes, variant keys, molecules?
3. What CSS exists, what's broken, what's dead weight?
4. How should SVG filters provide depth/bevel effects?
5. What real-world design systems (Material, Spectrum, Radix, Open Props) do for token organization?

---

## Codebase Analysis

### Current Token System State

**SSOT**: `interfaces/desktop/src/lib/design/tokens/tokens.ts` (288 lines)
- 6 accent hues (teal, purple, magenta, ember, frost, cyber)
- 6 color scales × 9 steps = 54 colors + neutral scale
- 4 glass variants (void, deep, smoke, frost)
- 3 matte variants (dark, medium, light)
- 7 text colors, 7 spacing values, 6 radius values, 5 blur values
- 7 glow shadows, 5 elevation shadows, 4 bevel presets
- 9 z-index layers, 5 durations, 5 easings, 6 text sizes, 3 paddings

**Generated outputs** (via `pnpm ds:tokens:build`):
- `tokens.css` — 332 lines, CSS custom properties + @theme block
- `types.ts` — 71 lines, TypeScript const arrays + inferred types
- `tailwind.preset.ts` — Tailwind theme extension
- `schema.ts` — 66 lines, Zod validators for each token enum

### BROKEN: Token→Tailwind Gap

`recipes/utils.ts` maps tokens to Tailwind class names:
```
RADIUS_MAP: rounded-dp-none, rounded-dp-sm, rounded-dp-md, rounded-dp-lg, rounded-dp-xl, rounded-dp-full
DEPTH_MAP: shadow-dp-z1, shadow-dp-z2, shadow-dp-z3, shadow-dp-z4
SIZE_MAP: text-dp-sm, text-dp-base, text-dp-lg
GLOW_MAP: shadow-dp-glow-teal, shadow-dp-glow-purple, etc.
surfaceClass(): bg-glass-void, bg-glass-deep, bg-matte-dark, etc.
```

These class names DO NOT EXIST in the @theme block. The @theme in `tokens.css` defines:
```
--color-glass-void, --color-glass-deep, etc. (wrong prefix for bg- utility)
--shadow-z0 through --shadow-z4 (missing "dp-" prefix)
--shadow-glow-teal, etc. (missing "dp-" prefix)
```

The @theme needs to define these as Tailwind v4 theme variables that generate the exact utility names recipes expect.

### BROKEN: Dual @theme Blocks

- `tokens.css` has @theme with token mappings
- `app.css` has SEPARATE @theme with void/obsidian colors, font families, animation

These need unification. `tokens.ts` should own ALL design values. `app.css` keeps only font imports + base html/body.

### DEAD: layout.css (712 lines)

File: `layouts/app/styles/layout.css`
Header says: "CO-LOCATED / TEMPORARY / HARD-CODED"
Header says: "Later conversion to ColdLight tokens AFTER visuals are locked"

Contains: .app-frame grid, .glass morphism, .liquidSheen, .iconBtn (pointer-tracked), .tooltipWrap (CSS-only), .search-overlay, .sidebar/.navGroup, .statusbar/.statusPill/.statusDot, scrollbars, popIn keyframe.

**All 712 lines use raw oklch values.** Not a single `var()` token reference. User confirmed: these effects never captured the glass vision. DELETE ENTIRELY.

### Working CSS (~2,300 lines across layout files)

| File | Lines | Status |
|------|-------|--------|
| `tokens/tokens.css` | 332 | GENERATED, working |
| `molecules/glass.css` | 36 | Working, uses @utility syntax |
| `molecules/glow.css` | 30 | Working, uses @utility syntax |
| `molecules/bevel.css` | 11 | Working, uses @utility syntax |
| `layouts/app/styles/shell.css` | 111 | Working, grid structure |
| `layouts/app/styles/surfaces.css` | 149 | Partially working, some --dp-* refs |
| `layouts/app/styles/depth.css` | 228 | Working, complex shadow system |
| `layouts/chat/styles/shell.css` | 186 | Working |
| `layouts/chat/styles/surfaces.css` | 252 | Working |
| `layouts/chat/styles/depth.css` | 132 | Working, chat depth presets |
| `layouts/chat/styles/interactions.css` | 304 | Working, chat UI patterns |
| `layouts/common/styles/focus.css` | 122 | Working |
| `layouts/common/styles/keyframes.css` | 331 | Working, 37 keyframes |
| `layouts/common/styles/scrollbars.css` | 125 | Working |
| `layouts/common/styles/typography.css` | 207 | Working |

### design/index.css — Nearly Empty

Only imports 3 molecule files. Should be the true CSS SSOT entry point importing everything.

### Recipe System — Scaffolded, No CSS Output

4 recipes registered (panel, dialog, combobox, tabs). Each has a `classes()` function returning per-slot CSS class strings. But those strings reference Tailwind classes that don't exist (see Token→Tailwind Gap above).

Runtime flow works: Blueprint → Recipe → `classes(DsSurfaceProps)` → `Record<string, string>` → applied via `cn()` (clsx + tailwind-merge) → DOM class attribute.

### Variant Key System — Zero Implementation

Documented encoding: `v-s{#}z{#}l{#}t{#}m{#}`
- s = surface, z = depth, l = layers, t = transition, m = motion
- Each digit 0-4 selects a token value

No CSS classes. No encode/decode functions. No Zod schema.

User decision: Support BOTH individual segments (`v-s1 v-z2 v-t2`) AND combined (`v-s1z2l0t2m0`).

### SVG — Zero Usage

No SVG filters, no inline SVG, no filter definitions. All depth/bevel via CSS box-shadow only.

---

## Layout → ColdLight Primitive Audit

### CRITICAL: Layouts MUST Use ColdLight Primitives

The layout components were built with hardcoded HTML and emoji icons because "ColdLight primitives are NOT built yet" (per resume notes from 2026-01-24). **That is no longer true.** ColdLight now has 42 primitive contracts with .svelte implementations on disk. Every layout element that maps to a ColdLight primitive MUST use it. No raw `<button>`, `<input>`, or hand-rolled tooltip markup when a primitive exists.

### Available Primitives (42 on disk)

accordion, alert, alert-dialog, aspect-ratio, **avatar**, **badge**, breadcrumb, **button**, card, checkbox, collapsible, **combobox**, **command**, context-menu, **dialog**, **dropdown-menu**, hover-card, **input**, label, menubar, **navigation-menu**, pagination, pin-input, **popover**, progress, radio-group, **scroll-area**, select, **separator**, **sheet**, skeleton, slider, spinner, switch, **tabs**, textarea, **toggle**, **toggle-group**, **toolbar**, **tooltip**, visually-hidden

**Bold** = directly needed by layouts.

### App Shell: Current State vs Required State

#### TopBar.svelte (90 lines)

| Element | Current | Required ColdLight Primitive |
|---------|---------|------------------------------|
| DevPulse logo | `<Parasite />` plugin | Keep — plugin, not a primitive |
| Search button | Raw `<button>` with emoji | **Button** primitive + **Tooltip** |
| Search overlay | Raw `<input>` in floating div | **Command** primitive (Cmd+K pattern) |
| User avatar | Missing entirely | **Avatar** primitive |
| Notifications | Missing entirely | **Button** + **DropdownMenu** or **Popover** |
| Web/links icon | Missing entirely | **Button** + **Tooltip** |
| Icon hover effects | Inline `track()` pointer function | Recipe action (`glowTrack`) |

**Problems:**
- Emoji icons (`🔍`) instead of proper SVG icon system
- Search is a bare `<input>` — should be Command primitive (accessible, keyboard-driven, Cmd+K)
- No Avatar, no notification bell, no additional icon actions per the README spec
- Pointer tracking duplicated inline instead of via recipe action

#### Sidebar.svelte (130 lines)

| Element | Current | Required ColdLight Primitive |
|---------|---------|------------------------------|
| Nav links | Raw `<a>` elements | **Button** (as="a") or nav composition |
| Tooltips | CSS `.tooltipWrap` class (from dead layout.css) | **Tooltip** primitive |
| Toggle button | Raw `<button>` | **Button** or **Toggle** primitive |
| Icon display | Emoji strings (`🏠`, `🎨`, etc.) | SVG icon components |
| Active state | Manual `class:active` | Data attribute + recipe |
| Animation | Inline `triggerAnim()` with setTimeout | Recipe action |
| Pointer tracking | Inline `track()` duplicate | Recipe action (`glowTrack`) |

**Problems:**
- `.sidebar`, `.navGroup`, `.navItem`, `.tooltipWrap` CSS classes reference layout.css (being deleted)
- No ColdLight primitives used anywhere
- Emoji icons are not scalable, not themeable
- Tooltip is CSS-only hack, not the accessible Tooltip primitive
- Pointer tracking function duplicated from TopBar

#### StatusBar.svelte (39 lines)

| Element | Current | Required ColdLight Primitive |
|---------|---------|------------------------------|
| Status pill (online/offline) | Inline span with conditional classes | **Badge** primitive |
| Status dot | Raw `<span>` with `bg-teal-400` | Badge with dot variant |
| Uptime display | Inline span | **Badge** or plain text |
| Version display | Inline span | **Badge** or plain text |

**Problems:**
- Hand-rolled badge-like markup should use Badge primitive
- Classes like `bg-teal-400`, `bg-ember-500`, `bg-purple-400` bypass token system
- `shadow-glow-teal` references broken @theme

#### Frame.svelte (86 lines)

| Element | Current | Required |
|---------|---------|----------|
| Grid shell | Tailwind grid classes | Keep — structural, not a primitive |
| Surface classes | `bg-glass-void`, `bg-glass-deep`, `bg-matte-dark` | Fix via @theme (Phase 1) |
| Border | `border-teal-700/30` | Semantic token `--border-subtle` |
| Shadows | `shadow-z1`, `shadow-z2` | Fix via @theme (Phase 1) |
| Backdrop blur | `backdrop-blur-lg`, `backdrop-blur-md` | Keep — Tailwind utility |

**Frame is the closest to correct** — it's structural CSS Grid which is appropriate. Fix the broken class names via @theme and it mostly works.

### Chat Layout: Current State

11 stub files exist in `layouts/chat/components/`. Per the README spec:

| Chat Element | Required ColdLight Primitive |
|-------------|------------------------------|
| Chat frame (overlay) | **Dialog** or **Sheet** (true window overlay) |
| Mode selector (DEV/PLAN/IMG/GEN) | **Tabs** or **ToggleGroup** |
| Message thread | **ScrollArea** + custom message components |
| Message input | **Input** or **Textarea** |
| Voice button | **Button** with pulse recipe |
| Command palette (Cmd+K) | **Command** primitive |
| Cortex visualization panel | Canvas/SVG — not a primitive |
| Interaction: MultipleChoice | **RadioGroup** or **Checkbox** group |
| Interaction: TrueFalse | **Toggle** or **Button** pair |
| Interaction: FillBlank | **Input** with label composition |
| Interaction: Confirmation | **AlertDialog** primitive |
| Quick menu | **DropdownMenu** or **Command** |
| History panel | **ScrollArea** + list |

### Layout README Requirements

Both layout READMEs (`layouts/app/README.md` and `layouts/chat/README.md`) specify UI elements that map to ColdLight primitives. The READMEs should be updated to explicitly state:

> **ColdLight Mandate:** Every interactive or visual element in this layout that has a ColdLight primitive MUST use it. No raw `<button>`, `<input>`, `<dialog>`, or hand-rolled tooltip/popover/dropdown markup. If a primitive doesn't exist for a layout need, file it as a new primitive request before building a one-off.

### Shared Concerns Across Layouts

1. **Icon system** — Both layouts use emoji. Need a proper SVG icon component (Lucide, Phosphor, or custom). This is NOT a ColdLight primitive but a utility the design system needs.
2. **Pointer tracking** — `track()` function duplicated in TopBar and Sidebar. Should be a recipe action (`glowTrack`).
3. **Tooltip pattern** — Sidebar uses CSS `.tooltipWrap` hack. TopBar uses `data-tooltip` attribute. Neither uses the ColdLight Tooltip primitive.

---

## External Research: Real-World Token Organization

### Industry Standard: 3-Tier Token Hierarchy

Every major design system (Material Design 3, Adobe Spectrum, Salesforce Lightning, IBM Carbon, Shopify Polaris) uses a 3-tier token architecture:

**Tier 1: Global / Primitive Tokens**
Raw values with no semantic meaning. The palette.
```
--color-blue-500: oklch(0.55 0.18 250)
--space-4: 1rem
--radius-md: 0.5rem
--shadow-z2: 0 3px 6px ...
```
ColdLight has this tier complete in `tokens.ts`.

**Tier 2: Semantic / Alias Tokens**
Intent-based names that reference Tier 1. Provides meaning.
```
--surface-primary: var(--glass-void)          // "primary surface" regardless of what glass-void is
--surface-elevated: var(--glass-smoke)        // "elevated surface" used for overlays
--border-default: var(--color-teal-700) / 0.22
--border-focus: var(--color-teal-400) / 0.38
--text-heading: var(--text-primary)
--depth-card: var(--shadow-z2)
--motion-standard: var(--duration-fast) var(--ease-out)
```
ColdLight MISSING this tier entirely.

**Tier 3: Component / Scoped Tokens**
Bound to specific component kinds. Override-friendly. Enable theming.
```
--button-surface: var(--surface-primary)
--button-surface-hover: var(--surface-elevated)
--button-border: var(--border-default)
--button-glow: var(--glow-off)
--panel-surface: var(--surface-primary)
--panel-depth: var(--depth-card)
--input-surface: var(--surface-elevated)
--input-border-focus: var(--border-focus)
```
ColdLight MISSING this tier entirely.

### Why 3 Tiers Matter

1. **Theming**: Change `--surface-primary` once → every component updates
2. **Consistency**: Components reference semantic names, not raw values
3. **Schema enforcement**: Tier 2 MUST reference Tier 1. Tier 3 MUST reference Tier 2. Raw values only allowed in Tier 1.
4. **Refactoring safety**: Change a global color → semantic tier maps it → zero component changes needed
5. **Documentation**: Semantic names are self-documenting (`--surface-elevated` vs `oklch(0.16 0.005 0 / 0.60)`)

### Material Design 3 Token Naming Convention

```
--md-sys-color-primary          (semantic)
--md-sys-color-surface          (semantic)
--md-ref-palette-primary-40     (global)
--md-comp-button-label-color    (component)
```

Pattern: `--{system}-{tier}-{category}-{name}`

### Recommended ColdLight Naming

```
--cl-ref-{category}-{name}      (Tier 1: reference/global)
--cl-sys-{category}-{name}      (Tier 2: system/semantic)
--cl-comp-{kind}-{property}     (Tier 3: component)
```

Or simpler (since ColdLight already uses unprefixed):
```
Tier 1: --color-teal-500, --glass-void, --shadow-z2         (existing, keep)
Tier 2: --surface-primary, --border-subtle, --depth-card     (new)
Tier 3: --button-bg, --panel-border, --input-bg-focus        (new)
```

### Schema-Driven Enforcement Pattern

From Salesforce Lightning Design System + Style Dictionary:

```typescript
// Token definition with metadata
interface TokenDefinition {
  value: string;
  tier: 1 | 2 | 3;
  category: string;
  references?: string[];  // what Tier 1/2 tokens this references
}

// Build-time validation
function validateTokens(tokens: TokenDefinition[]) {
  for (const t of tokens) {
    if (t.tier === 2) {
      assert(t.references?.every(ref => getTier1Token(ref)),
        `Tier 2 token ${t.name} must reference Tier 1`);
    }
    if (t.tier === 3) {
      assert(t.references?.every(ref => getTier2Token(ref)),
        `Tier 3 token ${t.name} must reference Tier 2`);
    }
    if (t.tier > 1) {
      assert(!containsRawValue(t.value),
        `Tier ${t.tier} token ${t.name} must not contain raw values`);
    }
  }
}
```

ColdLight already has Zod schemas for Tier 1 token enums. Extend to validate the full 3-tier chain.

---

## Findings

### 1. Conceptual Lines (CLEAR)

| Concept | Role | Contains Styling? | Contains Structure? |
|---------|------|------------------|-------------------|
| **Token** | Raw value | No (just a value) | No |
| **Molecule** | Single CSS effect | Yes (one effect) | No |
| **Recipe** | Composition function | Yes (class strings) | No |
| **Variant Key** | Serialized recipe params | Yes (sets CSS vars) | No |
| **Primitive** | Accessible structure | No | Yes |
| **Component** | Primitive + Recipe | Yes (applied) | Yes |
| **Blueprint** | Component preset | No (just defaults) | No |

Tokens define WHAT. Recipes define HOW. Variant keys SERIALIZE the how. Molecules are atomic CSS effects. Primitives are skeletons. Components are the finished product.

### 2. Token Pipeline Is Severable at One Point

The ONLY break is the @theme block. Fix the token build script to emit proper Tailwind v4 @theme mappings → recipe class names resolve → components render.

### 3. layout.css Is a Dead End

712 lines of raw oklch. Never achieved the vision. Delete. Extract zero-to-few concepts as properly tokenized molecules.

### 4. 3-Tier Token Architecture Is Industry Standard

Every major system does it. ColdLight has Tier 1. Adding Tier 2 (semantic) and Tier 3 (component) with Zod validation creates a schema-enforced, theme-ready, refactor-safe token chain.

### 5. SVG Filters Fill the Gap CSS Can't

Reference images show bevel/depth that CSS box-shadow alone can't produce. SVG `<feSpecularLighting>` for bevel, `<feTurbulence>` for noise, `<feGaussianBlur>` for glow. Rendered once in root layout, referenced via `filter: url(#name)`.

### 6. Variant Keys Need Both Forms

Individual (`v-s1 v-z2`) for composability in templates. Combined (`v-s1z2l0t2m0`) for recipe output compactness. Both set the same CSS custom properties.

### 7. Layouts Are Not Using ColdLight Primitives

42 primitives exist on disk. Zero are used in layouts. TopBar has raw `<button>` + `<input>` instead of Button/Command primitives. Sidebar uses CSS tooltip hacks instead of the Tooltip primitive. StatusBar hand-rolls badge markup instead of using Badge. The chat layout is all stubs but its README specifies exactly which primitives to use (Dialog/Sheet, Tabs/ToggleGroup, Command, RadioGroup, AlertDialog, etc.).

### 8. MASTER-PLAN.md Has Significant Drift

The ColdLight MASTER-PLAN.md is architecturally correct but ~30 days stale:
- Contradictory on token prefixes (`--dp-*` throughout vs "Token NONE LOCKED")
- Missing: 3-tier tokens, variant keys, SVG filters, molecules, the broken pipeline
- Phase status wrong (Phase 2 Biome is DONE, Phase 0 is partially broken)
- References non-existent files (recipes/css/, tailwind.preset.ts as active)
- DsSurfaceProps schema doesn't match actual implementation

---

## Recommendations

### Execution Order

1. **PHASE 1: Token Bridge + 3-Tier Architecture** — Fix @theme generation, add semantic.ts + components.ts, validate with Zod. THIS UNBLOCKS EVERYTHING.
2. **PHASE 2: Delete layout.css + Rebuild Molecules** — Extract effects as tokenized molecules, move common CSS under design/, rebuild design/index.css as true entry point.
3. **PHASE 3: Variant Key System** — CSS classes + TS encode/decode + Zod schema.
4. **PHASE 4: SVG Filters** — SvgFilters.svelte + filter utilities, wire to variant `l` key.
5. **PHASE 5: Layout Rebuild with ColdLight Primitives** — Rewrite TopBar/Sidebar/StatusBar using Button, Tooltip, Command, Badge, Avatar. Wire chat stubs using Dialog/Sheet, Tabs, Command, Input, RadioGroup, AlertDialog. Every interactive element uses its ColdLight primitive.
6. **PHASE 6: Recipe Expansion + Visual Scaffolding** — New recipes for dashboard/chat reference images, new gauge/sparkline primitives.
7. **PHASE 7: CSS Audit Enforcement** — Build-time scanner, lefthook hook, zero raw values allowed.
8. **PHASE 8: MASTER-PLAN.md Update** — Fix all contradictions, add missing sections, align with reality.

### Key Architecture Decisions

- Token tiers: Keep existing unprefixed naming for Tier 1, add `--surface-*`, `--border-*`, `--depth-*` for Tier 2, add `--{kind}-*` for Tier 3
- Variant keys: Separate + Combined support
- layout.css: DELETE entirely, rebuild from ColdLight
- SVG: Hidden inline SVG with `<filter>` definitions, referenced via CSS `filter: url(#id)`
- CSS audit: Lefthook pre-commit hook scans for raw oklch/hsl/rgb outside tokens.ts
- Layout mandate: Every interactive element MUST use its ColdLight primitive (Button, Tooltip, Command, Badge, Avatar, etc.) — no raw HTML for things that have primitives
- Icon system: Replace all emoji icons with proper SVG icon components

---

## Files Referenced

### Token System
- `interfaces/desktop/src/lib/design/tokens/tokens.ts` — Tier 1 SSOT (288 lines)
- `interfaces/desktop/src/lib/design/tokens/tokens.css` — Generated CSS (332 lines)
- `interfaces/desktop/src/lib/design/tokens/types.ts` — Generated types (71 lines)
- `interfaces/desktop/src/lib/design/tokens/schema.ts` — Zod validators (66 lines)
- `interfaces/desktop/scripts/dev/design/ds-tokens-build.ts` — Token build script

### Recipe System
- `interfaces/desktop/src/lib/design/recipes/utils.ts` — Token→class maps (76 lines)
- `interfaces/desktop/src/lib/design/recipes/index.ts` — Recipe registry
- `interfaces/desktop/src/lib/design/recipes/components/panel/` — Panel recipes
- `interfaces/desktop/src/lib/design/recipes/components/dialog/` — Dialog recipes

### CSS Files (to modify/delete/move)
- `interfaces/desktop/src/app.css` — Global entry (52 lines, has duplicate @theme)
- `interfaces/desktop/src/lib/design/index.css` — Design SSOT entry (23 lines, nearly empty)
- `interfaces/desktop/src/lib/design/molecules/glass.css` — Glass effects (36 lines)
- `interfaces/desktop/src/lib/design/molecules/glow.css` — Glow effects (30 lines)
- `interfaces/desktop/src/lib/design/molecules/bevel.css` — Bevel effects (11 lines)
- `interfaces/desktop/src/lib/layouts/app/styles/layout.css` — **DELETE** (712 lines, dead weight)
- `interfaces/desktop/src/lib/layouts/app/styles/shell.css` — Grid structure (111 lines)
- `interfaces/desktop/src/lib/layouts/app/styles/surfaces.css` — Surface styles (149 lines)
- `interfaces/desktop/src/lib/layouts/app/styles/depth.css` — Depth system (228 lines, move to design/)
- `interfaces/desktop/src/lib/layouts/common/styles/typography.css` — Move to design/ (207 lines)
- `interfaces/desktop/src/lib/layouts/common/styles/keyframes.css` — Move to design/ (331 lines)
- `interfaces/desktop/src/lib/layouts/common/styles/focus.css` — Move to design/ (122 lines)
- `interfaces/desktop/src/lib/layouts/common/styles/scrollbars.css` — Move to design/ (125 lines)

### Layout Components (to rewrite with ColdLight primitives)
- `interfaces/desktop/src/lib/layouts/app/Frame.svelte` — Grid shell (86 lines, mostly correct)
- `interfaces/desktop/src/lib/layouts/app/TopBar.svelte` — Needs Command, Button, Tooltip, Avatar (90 lines)
- `interfaces/desktop/src/lib/layouts/app/Sidebar.svelte` — Needs Tooltip, Button, proper nav (130 lines)
- `interfaces/desktop/src/lib/layouts/app/StatusBar.svelte` — Needs Badge (39 lines)
- `interfaces/desktop/src/lib/layouts/app/AppLayout.svelte` — Empty, DELETE
- `interfaces/desktop/src/lib/layouts/app/styles/layout.css` — DELETE (712 lines dead weight)
- `interfaces/desktop/src/lib/layouts/app/styles/shell.css` — Evaluate: keep or merge into Frame
- `interfaces/desktop/src/lib/layouts/app/styles/surfaces.css` — Evaluate: migrate tokens or delete
- `interfaces/desktop/src/lib/layouts/app/styles/depth.css` — Move to design/molecules/
- `interfaces/desktop/src/lib/layouts/app/styles/index.css` — DELETE after migration

### Chat Layout Stubs (11 files, all need ColdLight primitives)
- `layouts/chat/components/shell/Frame.svelte` — Dialog/Sheet for overlay
- `layouts/chat/components/shell/TopBar.svelte` — Tabs for hub switching
- `layouts/chat/components/shell/LeftSidebar.svelte` — ToggleGroup for modes
- `layouts/chat/components/shell/ChatDashboard.svelte` — ScrollArea for thread
- `layouts/chat/components/shell/QuickMenu.svelte` — DropdownMenu/Command
- `layouts/chat/components/panels/Footer.svelte` — Input/Textarea + Button
- `layouts/chat/components/panels/ContextPanel.svelte` — Canvas/SVG viz
- `layouts/chat/components/panels/HistoryPanel.svelte` — ScrollArea + list
- `layouts/chat/components/panels/StatusBar.svelte` — Badge
- `layouts/chat/components/overlays/CommandPalette.svelte` — Command primitive
- `layouts/chat/components/overlays/ModeSelector.svelte` — ToggleGroup/Tabs

### Layout READMEs (to update with ColdLight mandate)
- `interfaces/desktop/src/lib/layouts/app/README.md` — App shell spec
- `interfaces/desktop/src/lib/layouts/chat/README.md` — Chat overlay spec

### Reference Images
- `interfaces/desktop/src/lib/design/REFERENCES/CHAT-REFERENCE-01.png`
- `interfaces/desktop/src/lib/design/REFERENCES/CHAT-REFERENCE-02.png`
- `interfaces/desktop/src/lib/design/REFERENCES/DASHBOARD-REFERENCE-01.png`

### Config
- `interfaces/desktop/src/lib/design/config/coldlight/attributes.cfg.ts` — data-kind/slot/state
- `interfaces/desktop/src/lib/design/config/coldlight/enforcement.cfg.ts` — Strict mode
- `interfaces/desktop/src/lib/design/config/coldlight/adapters.cfg.ts` — MeltUI adapter

### ColdLight MASTER-PLAN.md (to update)
- `interfaces/desktop/src/lib/design/MASTER-PLAN.md` — Fix contradictions, add missing sections
