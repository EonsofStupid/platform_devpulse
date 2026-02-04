# ColdLight Design System -- Master Plan

> **@devpulse/coldlight** v0.1.0
> Schema-registry-driven design system, component library, and block composition engine.
> Taxonomy-first architecture: typed contracts, Zod-validated boundaries, four runtime registries (recipes, blueprints, patterns, blocks).
> Every UI entity -- primitive, surface, composition, page section -- exists only if registered against the taxonomy with a typed ID, a validated contract, and a declared recipe.
>
> Visual identity: liquid surfaces, particle effects, metal/glass/molten aesthetics, OKLCH color system, dark-first.
> Named for Tesla's cold light gas tubes (1890s).

---

## Technology Stack (Locked)

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | SvelteKit 5 | Routing, SSR, adapter-static (Tauri SPA) |
| **Reactivity** | Svelte 5 Runes | `$state`, `$derived`, `$effect`, `$bindable` -- no legacy stores |
| **Desktop** | Tauri 2.0 | Rust backend, IPC via `invoke()` |
| **CSS** | Tailwind CSS v4 | `@tailwindcss/vite` plugin, `@theme {}` directive |
| **UI Provider** | Melt UI | Headless ARIA/state/behavior engine (adapter-backed primitives) |
| **Tokens** | `tokens.ts` SSOT | Channel-separated OKLCH, Zod-validated |
| **Validation** | Zod v4 | Token schemas, contract validation, boundary enforcement |
| **Lint/Format** | Biome | Single tool replacing ESLint + Prettier |
| **Node Graph** | SvelteFlow (`@xyflow/svelte`) | VPB node visualization |
| **Notifications** | svelte-sonner | Only toast provider (+ Tauri OS when minimized) |

**Banned:**

- shadcn/svelte, Bits UI, DaisyUI, or any competing component system
- CSS-in-JS solutions
- Legacy Svelte stores
- Inline style objects
- Raw color values outside tokens layer

---

## Core Terminology (Locked)

### The Four Registries

| Registry | Runtime? | What It Contains | Where It Lives |
|----------|----------|------------------|----------------|
| **Recipe** | Yes | CSS appearance rules: surfaces, layered bevels, pseudo-elements, motion/transition toggles | `recipes/` |
| **Blueprint** | Yes | Composition defaults + slot wiring: typed "how this component is assembled" -- slots, default props, child-prop inheritance, which recipe hooks apply by default | `blueprints/` |
| **Pattern** | No | Documentation guidance only: usage rules, do/don't, accessibility notes, examples | `patterns/` |
| **Block** | Yes | Runtime VPB payload: serializable object that VPB saves/loads | `blocks/` (schemas + renderers) |

Each registry has typed IDs. If it isn't registered, it doesn't exist.

### Provider Internals (Industry-Correct)

| Term | Definition |
|------|-----------|
| **UI Provider** | The headless ARIA/state/behavior engine: **Melt UI** |
| **Provider Adapter** (`dsAdapter`) | ColdLight's integration layer mapping provider APIs to ColdLight's API + `data-kind`/`data-slot`/`data-state` |
| **Provider Internals** | The provider-specific implementation boundary at `api/adapters/meltui/_internal/`. ColdLight public API never exposes these. |

Components NEVER import `@melt-ui/svelte` directly. The transport chain cloaks the dependency.

### Two Primitive Archetypes

**Archetype A: ColdLight-Owned** (`ariaStateProvider: "coldlight"`)
Component renders native HTML with ARIA set directly. No adapter. 2-folder parity enforced (taxonomy/kinds + primitives).

Examples: button, badge, skeleton, progress, alert, avatar, card, label, input, separator, textarea, spinner, visually-hidden, breadcrumb, aspect-ratio.

**Archetype B: Adapter-Backed** (`ariaStateProvider: "meltui"`)
Uses Melt UI adapter through transport chain. Root creates adapter + provides context via Symbol-keyed Svelte context. Sub-components consume from context. 3-folder parity enforced (taxonomy/kinds + api/adapters/meltui + primitives).

Examples: dialog, tabs, select, popover, tooltip, sheet, alert-dialog, accordion, collapsible, combobox, command, context-menu, dropdown-menu, hover-card, menubar, navigation-menu, slider, switch, toggle-group.

---

## Locked Decisions

| Decision | Status |
|----------|--------|
| Provider is Melt UI (not Bits UI, not Ark/Zag) | **Locked** |
| ColdLight attributes: `data-kind`, `data-slot`, `data-state` | **Locked** |
| manifest.ts: `id` is camelCase, `ariaStateProvider` key required | **Locked** |
| PascalCase file naming: `Button.svelte`, `DialogTrigger.svelte` | **Locked** |
| Token prefix: `--dp-*` (DevPulse) | **Locked** |
| No shadcn | **Locked** |
| Biome for lint/format | **Locked** |
| svelte-sonner for notifications | **Locked** |
| Dark variant first, light variant later (value swap only) | **Locked** |
| CSS Grid for shell/dashboard layout | **Locked** |

### Not Yet Locked

| Item | Status |
|------|--------|
| DTCG token SSOT file format | Open -- evaluate Style Dictionary v4 |
| Exact generated CSS tier format | Open -- recipes implementation details |
| Concrete schemas for blueprints registry | Open -- define after recipe system proves out |
| Hook points (dev server vs build vs lefthook stages) | Open -- wire as enforcement matures |

---

## Architecture

```
@devpulse/coldlight
├── tokens/              # Layer 0: Design tokens (SSOT)
│   ├── tokens.ts        # SSOT -- channel-separated OKLCH objects
│   ├── schema.ts        # Zod validators for token values
│   ├── tokens.css       # GENERATED CSS custom properties
│   ├── types.ts         # GENERATED TypeScript types + runtime arrays
│   └── tailwind.preset.ts  # GENERATED Tailwind theme mapping
│
├── taxonomy/            # Layer 1: SSOT contracts + registries
│   ├── types.ts         # Core types (PrimitiveContract, SlotSpec, AriaRequirements)
│   ├── kinds/           # Per-primitive contracts (40+)
│   │   └── primitives/  # accordion/, button/, dialog/, etc.
│   │       └── {kind}/
│   │           ├── contract.ts
│   │           ├── types.ts
│   │           └── index.ts
│   ├── vpb/             # Block kinds, contracts, slots for VPB
│   │   ├── kinds.ts
│   │   ├── contracts.ts
│   │   └── slots.ts
│   ├── registry.ts      # Runtime manifest reader
│   ├── scanner.ts       # Build-time parity checker
│   └── .generated/      # coldlight.manifest.json, imports.gen.ts
│
├── recipes/             # Layer 2: CSS appearance system
│   ├── index.ts         # Recipe registry (getRecipe, registerRecipe)
│   ├── css/             # Generated recipe CSS
│   │   ├── keyframes.css
│   │   └── surfaces.gen.css
│   └── actions/         # Svelte actions required by recipes
│       ├── index.ts     # Action registry + applyRecipeActions
│       ├── glowTrack.ts
│       └── ripple.ts
│
├── blueprints/          # Layer 3: Composition defaults + slot wiring (TODO)
│   └── index.ts         # Blueprint registry
│
├── primitives/          # Layer 4: Structural + behavioral wrappers
│   └── {kind}/          # PascalCase: button/, dialog/, tabs/
│       ├── {Name}.svelte
│       ├── {Name}{Sub}.svelte
│       ├── types.ts
│       ├── context.ts   # Symbol-keyed (if compound)
│       └── index.ts
│
├── semantics/           # Layer 5: Primitives + Recipes composed
│   ├── buttons/
│   ├── cards/
│   ├── inputs/
│   └── panels/
│
├── patterns/            # Documentation-only (not runtime)
│   ├── data/
│   ├── forms/
│   └── search/
│
├── blocks/              # Layer 6: VPB block schemas + renderers
│   ├── chat/
│   ├── dashboards/
│   ├── heroes/
│   └── navigation/
│
├── api/                 # Provider adapter layer
│   └── adapters/
│       └── meltui/
│           └── _internal/  # Provider Internals (never public)
│
├── config/              # ColdLight configuration fragments
│   └── coldlight/
│       ├── identity.cfg.ts
│       ├── roots.cfg.ts
│       ├── adapters.cfg.ts
│       ├── generation.cfg.ts
│       ├── enforcement.cfg.ts
│       ├── attributes.cfg.ts
│       ├── vocabularies.cfg.ts
│       └── types.ts
│
├── plugins/             # Vite plugins (enforcement, hot reload)
│
├── coldlight.config.ts  # Config orchestrator (imports all fragments)
├── surface.config.ts    # Surface design config
├── index.ts             # Barrel export (re-exports taxonomy)
├── index.css            # SSOT CSS entry point
└── package.json
```

---

## Token System

### SSOT: `tokens/tokens.ts`

All other token files are GENERATED. Never edit `tokens.css`, `types.ts`, or `tailwind.preset.ts` directly.

```bash
pnpm ds:tokens:build    # One-shot generation
pnpm ds:tokens:watch    # Watch mode during dev
```

### Token Pipeline

```
tokens.ts (SSOT)
    │
    ├── schema.ts validates at build time (Zod)
    │
    └── ds-tokens-build.ts generates:
        ├── tokens.css          (CSS custom properties)
        ├── types.ts            (TypeScript types + runtime arrays)
        └── tailwind.preset.ts  (Tailwind theme mapping)
```

### Current Token Format (String OKLCH)

```typescript
export const color = {
  teal: {
    50: "oklch(0.97 0.02 180)",
    500: "oklch(0.55 0.18 180)",
    900: "oklch(0.24 0.07 180)",
  },
} as const;
```

### Target Token Format (Channel-Separated OKLCH)

Channel-separated objects enable programmatic color manipulation -- alpha variants, lightness shifts, chroma adjustments -- without string parsing:

```typescript
interface OklchColor {
  l: number;  // 0-1 (lightness)
  c: number;  // 0-0.4 (chroma)
  h: number;  // 0-360 (hue)
  a?: number; // 0-1 (alpha, optional)
}

export const color = {
  teal: {
    50:  { l: 0.97, c: 0.02, h: 180 },
    500: { l: 0.55, c: 0.18, h: 180 },
    900: { l: 0.24, c: 0.07, h: 180 },
  },
} as const;
```

The build script composes `oklch()` strings from objects. CSS output is identical. TypeScript gains typed access to individual channels.

### Token Categories

| Category | Prefix | Format | Example |
|----------|--------|--------|---------|
| Hues | `--dp-hue-*` | number | `--dp-hue-teal: 180` |
| Color Scales | `--dp-color-{name}-{step}` | oklch | `--dp-color-teal-500: oklch(0.55 0.18 180)` |
| Glass | `--dp-glass-*` | oklch/alpha | `--dp-glass-deep: oklch(0.11 0.01 250 / 0.75)` |
| Matte | `--dp-matte-*` | oklch | `--dp-matte-dark: oklch(0.14 0.005 250)` |
| Text | `--dp-text-*` | oklch | `--dp-text-primary: oklch(0.95 0.01 250)` |
| Spacing | `--dp-space-*` | rem | `--dp-space-4: 1rem` |
| Radius | `--dp-radius-*` | rem/px | `--dp-radius-md: 0.5rem` |
| Blur | `--dp-blur-*` | px | `--dp-blur-md: 8px` |
| Glow | `--dp-glow-*` | box-shadow | `--dp-glow-teal: 0 0 12px oklch(...)` |
| Shadow | `--dp-shadow-*` | box-shadow | `--dp-shadow-z2: 0 3px 6px oklch(...)` |
| Bevel | `--dp-bevel-*` | inset shadow | `--dp-bevel-subtle: inset 0 1px 0 oklch(...)` |
| Z-Index | `--dp-z-*` | integer | `--dp-z-modal: 400` |
| Duration | `--dp-duration-*` | ms | `--dp-duration-fast: 150ms` |
| Easing | `--dp-ease-*` | cubic-bezier | `--dp-ease-out: cubic-bezier(0, 0, 0.2, 1)` |
| Text Size | `--dp-text-size-*` | rem | `--dp-text-size-base: 1rem` |
| Padding | `--dp-padding-*` | shorthand | `--dp-padding-md: 0.5rem 1rem` |

### Zod Token Validation (`schema.ts`)

Exists and validates token enum values at system boundaries (VPB load, API payloads, saved layouts). Not used in hot render paths.

```typescript
export const AccentSchema = z.enum(AccentTokens);
export const GlowSchema = z.enum(GlowTokens);
export const SurfaceSchema = z.enum(SurfaceTokens);
// ... 13 schemas total
```

**Planned upgrade:** Validate the SSOT itself at build time -- Zod schemas for OKLCH channel ranges, spacing units, shadow syntax. Build fails on invalid token values.

---

## Taxonomy System

### PrimitiveContract

Every primitive is specified by a contract in `taxonomy/kinds/primitives/{kind}/contract.ts`. The contract declares:

- **kind** -- literal identifier (`"dialog"`, `"button"`)
- **ariaStateProvider** -- `"meltui"` or `"coldlight"`
- **slots** -- required, optional, forbidden
- **slotSpec** -- per-slot HTML element, children mode, ARIA requirements
- **states** -- shared and primitive-specific state tokens
- **slotStates** -- which states each slot can have
- **slotActions** -- per-slot action declarations
- **aria** -- role, required/optional ARIA attributes
- **keyboard** -- interaction keys
- **focusStrategy** -- how focus is managed
- **compound** -- whether sub-components share context
- **orientation** -- navigation axis (if applicable)
- **dismissBehavior** -- how overlays close (if applicable)

Contracts are adapter-agnostic. They don't care which provider fulfills them.

### Scanner + Manifest

Build-time scanner (`taxonomy/scanner.ts`) reads all contracts and validates parity:
- Archetype A (coldlight): contract + primitive must exist (2-folder)
- Archetype B (meltui): contract + adapter + primitive must exist (3-folder)

Scanner outputs `taxonomy/.generated/coldlight.manifest.json`. Runtime registry (`taxonomy/registry.ts`) reads only this manifest -- no filesystem scanning at runtime.

### Data Attributes

All primitive elements emit:

| Attribute | Required | Example |
|-----------|----------|---------|
| `data-kind` | Always | `"dialog"` |
| `data-slot` | Always | `"content"` |
| `data-state` | If stateful | `"open"` |
| `data-id` | If user provides | `"my-dialog"` |

Recipe-driven attributes:

| Attribute | Purpose | Example |
|-----------|---------|---------|
| `data-surface` | Surface type | `"glass"`, `"matte"`, `"solid"` |
| `data-material` | Material variant | `"void"`, `"deep"` |
| `data-motion` | Motion state | `"idle"`, `"hover"` |
| `data-focus` | Focus state | `"ring"`, `"glow"` |

---

## Recipe System

### Recipe Definition

A recipe is a composable configuration with defaults that produces CSS class strings per slot:

```typescript
interface RecipeDefinition<Props extends DsSurfaceProps> {
  id: RecipeId;
  kind: BlockKind;
  label: string;
  defaults: Props;
  classes: (props: Props) => Record<string, string>;
  requires?: ActionId[] | ((props: Props) => ActionId[]);
}
```

### DsSurfaceProps (Composable Schema)

Each prop becomes a VPB UI control:

```typescript
interface DsSurfaceProps {
  color: { a: ColorToken; b?: ColorToken };
  finish: FinishToken;       // glass, matte, solid
  frame: FrameToken;         // none, soft, hard, crisp
  depth: DepthToken;         // z0-z4
  motion: { hover?: MotionToken; enter?: MotionToken; ambient?: MotionToken };
  bevel: { level: BevelToken };
  glow: { color?: GlowToken; intensity?: number };
}
```

### Action Composition

Renderers use `use:applyRecipeActions` to auto-attach required Svelte actions:

```typescript
const actionRegistry = { glowTrack, ripple } as const;
type ActionId = keyof typeof actionRegistry;

export function applyRecipeActions(
  node: HTMLElement,
  recipe: RecipeDefinition
): ActionReturn {
  const cleanups: (() => void)[] = [];
  for (const id of recipe.requires ?? []) {
    const action = actionRegistry[id];
    if (action) {
      const result = action(node);
      if (result?.destroy) cleanups.push(result.destroy);
    }
  }
  return { destroy() { cleanups.forEach(fn => fn()); } };
}
```

If a recipe declares `requires`, the renderer MUST attach those actions. No manual JS effects.

---

## Blueprint System (Planned)

Blueprints are typed composition data (not prose):

```typescript
interface BlueprintDefinition<K extends BlockKind> {
  id: BlueprintId;
  kind: K;
  slots: Record<string, SlotWiring>;
  defaultProps: KindProps<K>;
  defaultRecipe: RecipeId;
  childInheritance: Record<string, string[]>; // which props cascade to children
}
```

Components reference their blueprint. VPB reads blueprints to know how to assemble a block.

---

## Block System (VPB Runtime)

### BlockNode (What VPB Stores)

```typescript
type BlockNode<K extends BlockKind = BlockKind> = {
  id: string;
  kind: K;
  recipe: AllowedRecipe<K>;
  props: KindProps<K>;
  slots?: Record<SlotName<K>, BlockNode[]>;
  binds?: Record<string, string>;
}
```

**VPB never stores:** classNames, CSS, custom vars, raw colors. Only contract-bound, Zod-validated props.

### Block Kinds

**Shell / Chrome:** `appShell`, `topBar`, `sideNav`, `statusBar`, `dock`
**Surfaces:** `panel`, `card`, `modal`, `glassFrame`, `inputFrame`
**Data Widgets:** `widget`, `statMeter`, `chart`, `timeline`, `graphNetwork`
**Chat:** `chatDock`, `chatThread`, `chatBubble`, `chatAttachment`

---

## Component Manifest

The manifest (`manifest.ts`) registers 60+ components with:

- **camelCase `id`** (enforced by regex)
- **Required `ariaStateProvider`** key
- **Category classification** (primitive, form, navigation, data, feedback, layout, overlay, utility)
- **Structure type** (monolithic, compound, adapter)
- **Status lifecycle** (experimental, beta, stable, deprecated, removed)
- **Dependency graph** (component-to-component)
- **File paths** relative to primitives/

### Component Inventory (60+ total)

**Stable (3):** button, dialog, sheet

**Beta (55+):** accordion, alertDialog, aspectRatio, avatar, badge, breadcrumb, calendar, card, carousel, chart, checkbox, collapsible, combobox, command, contextMenu, dataTable, dateField, datePicker, dropdownMenu, empty, field, focusTrap, form, hoverCard, inputText, inputPassword, inputEmail, inputNumber, inputOTP, inputGroup, kbd, label, liveStatus, menubar, navMenu, nativeSelect, navigationMenu, pagination, popover, portal, presence, progress, radioGroup, scrollArea, select, separator, sidebar, skeleton, slider, spinner, switch, table, tabs, textarea, timeField, toast, toggle, toggleGroup, tooltip, typography, visuallyHidden

**Experimental (1):** chart

---

## CSS Rules (Strict)

### What's Allowed

- Token references: `var(--dp-*)`
- Recipe classes: `dp-surface`
- Data attributes: `data-surface="glass"`
- Tailwind preset utilities (no arbitrary values)

### What's Banned

| Violation | Why |
|-----------|-----|
| `var(--dp-*)` inside `.svelte` files | Tokens exist only in `tokens.css` |
| Raw colors (`#fff`, `oklch()`, `rgb()`, `hsl()`) outside tokens layer | All color through tokens |
| Arbitrary Tailwind (`bg-[#000]`, `text-[12px]`) | All values from preset |
| Inline styles (`style="..."`) | Recipes handle all styling |
| `<style>` blocks in primitives | Primitives are unstyled |
| Component-scoped CSS variables | Tokens are global only |

### Ephemeral Computed Vars

Allowed ONLY with `--_cl-*` prefix (private ColdLight runtime), in allowlisted files, numeric values only.

### CSS Entry Point

`app.css` imports ONE file: `./lib/design/index.css`. That barrel imports in order:
1. `tokens/tokens.css`
2. `recipes/css/keyframes.css`
3. `recipes/css/surfaces.gen.css`

---

## Enforcement Pipeline

### Pre-Commit (lefthook, parallel)

| Hook | Command |
|------|---------|
| `biome-check` | `pnpm biome check --no-errors-on-unmatched` |
| `rust-fmt` | `cargo fmt --all -- --check` |
| `rust-check` | `cargo check --workspace --quiet` |
| `svelte-check` | `pnpm exec svelte-check --threshold error` |
| `coldlight-docs` | `pnpm coldlight:docs` |
| `token-validate` | `pnpm ds:tokens:validate` (Zod schema check) |

### Pre-Push (lefthook, parallel)

| Hook | Command |
|------|---------|
| `clippy` | `cargo clippy --workspace -- -D warnings` |
| `cargo-deny` | `cargo deny check advisories` |
| `violation-scan` | `pnpm ds:scan-violations` |

### Commit Message

Conventional commits enforced by commitlint:
```
type(scope): description
```
Types: `feat`, `fix`, `perf`, `refactor`, `docs`, `style`, `test`, `chore`, `ci`, `build`
Scopes: `coldlight`, `engine`, `maestro`, `desktop`, `docs`

### Violation Scanner (THE KILL SWITCH)

```bash
pnpm ds:scan-violations
```

Scans for:
1. CSS vars in renderers (`var(--` in `renderers/*.svelte`)
2. Arbitrary Tailwind (`[...]` in class attributes)
3. `<style>` in primitives
4. Inline styles in renderers
5. Raw colors outside tokens layer
6. Unregistered recipe IDs
7. Unregistered kind IDs
8. Flexbox on shell kinds (must use CSS Grid)
9. Mouse handlers without recipe `requires` declaration

Any violation: delete or rewrite. No exceptions.

---

## VPB (Visual Page Builder)

Dev-only tool at `src/lib/sys/debug/vpb/`.

### Flow

1. Reads recipe registry + taxonomy contracts
2. Shows dropdown/slider controls per DsSurfaceProps field
3. User modifies props -> calls `classes()` with new props -> preview updates
4. User saves as new recipe variant -> registered platform-wide
5. VPB generates Svelte code
6. Build pipeline generates CSS from all registered recipes

### Node Graph (SvelteFlow)

VPB uses `@xyflow/svelte` for node-based composition visualization -- block hierarchy, slot connections, data flow.

### Block Storage

VPB persists `BlockNode[]` trees. No theme values, no CSS, no classnames in stored data. Runtime validation (Zod) on load catches schema drift before it breaks the UI.

---

## Implementation Phases

### Phase 0: Token Foundation (DONE)

- [x] `tokens/tokens.ts` SSOT with real values
- [x] `ds-tokens-build.ts` generator script
- [x] `pnpm ds:tokens:build` and `pnpm ds:tokens:watch`
- [x] Generate `tokens.css`, `types.ts`, `tailwind.preset.ts`
- [x] `schema.ts` Zod validators for token enums

### Phase 1: Token Pipeline Upgrade

- [ ] Restructure `tokens.ts` to channel-separated OKLCH objects
- [ ] Add OKLCH channel validation to `schema.ts` (L: 0-1, C: 0-0.4, H: 0-360)
- [ ] Update `ds-tokens-build.ts` to compose oklch() from objects + run Zod validation
- [ ] Regenerate all outputs
- [ ] Wire `pnpm ds:tokens:validate` into lefthook pre-commit
- [ ] Evaluate Style Dictionary v4 / DTCG token format for multi-platform output

### Phase 2: Biome + Tooling

- [ ] Create `biome.json` (lint + format, replaces ESLint + Prettier)
- [ ] Add `pnpm lint` and `pnpm format` scripts
- [ ] Wire Biome into lefthook pre-commit
- [ ] Delete any orphaned ESLint/Prettier configs

### Phase 3: Taxonomy Completion

- [ ] Verify all 40+ primitive contracts match disk state
- [ ] Run scanner, fix any parity gaps
- [ ] Regenerate `coldlight.manifest.json`

### Phase 4: Recipe System

- [ ] Expand `recipes/index.ts` from stub to full registry
- [ ] Add `requires?: ActionId[]` metadata to RecipeDefinition
- [ ] Implement `recipes/actions/index.ts` with `applyRecipeActions`
- [ ] Implement `glowTrack.ts`, `ripple.ts` Svelte actions
- [ ] Author base surface recipes: `surface.glass`, `surface.matte`, `surface.solid`
- [ ] Author component recipes: `button.glass`, `panel.glass`, `input.glass`
- [ ] Generate `surfaces.gen.css` from registry

### Phase 5: Blueprint System

- [ ] Define `BlueprintDefinition` interface
- [ ] Create `blueprints/index.ts` registry
- [ ] Author blueprints for core block kinds (panel, card, shell)
- [ ] Wire VPB to read blueprints for assembly defaults

### Phase 6: Semantics Layer

- [ ] Author semantic compositions in `semantics/`
- [ ] Each semantic = primitive + recipe + blueprint defaults
- [ ] Demo at `domains/app/ui-demo/` imports from `$lib/design/semantics/`

### Phase 7: VPB Refactor

- [ ] Audit existing VPB code for registry consumption points
- [ ] Refactor `builder/schema.ts` to strictly typed `BlockNode<K>`
- [ ] Refactor `builder/palette.ts` to consume taxonomy for block kinds
- [ ] Refactor inspector to use taxonomy/contracts for prop validation
- [ ] Wire SvelteFlow for node graph visualization
- [ ] VPB state uses recipes for class generation

### Phase 8: Enforcement + CI

- [ ] Implement `scan-violations.ts` (THE KILL SWITCH)
- [ ] Implement `verify-kinds.ts`, `verify-recipes.ts`, `verify-tokens-sync.ts`
- [ ] Create `.github/workflows/ci.yml` (Rust + TypeScript PR validation)
- [ ] Create Vite enforcer plugin (`dsEnforce`) for dev-time blocking
- [ ] Run violation scanner on existing codebase, delete/rewrite violators

### Phase 9: Persistence (After Dark Variant Locked)

- [ ] DB migrations for theme/layout/block storage (libsql)
- [ ] Theme service (load/save token variant values)
- [ ] Layout service (load/save BlockNode trees)
- [ ] Wire VPB to persist layouts via layout service
- [ ] Scope-theme bindings

### Phase 10: Light Variant (Last)

- [ ] Add "light" variant -- same token NAMES, different VALUES
- [ ] Variant switcher UI
- [ ] Verify: switching variants changes look, NOT structure
- [ ] No code changes required for new variants

---

## Acceptance Criteria (Summary)

| Milestone | Done When |
|-----------|-----------|
| Token Pipeline | Channel-separated OKLCH, Zod validates at build, lefthook blocks invalid tokens |
| Taxonomy | Scanner clean, manifest regenerated, all 40+ contracts have parity |
| Recipes | Registry populated, `applyRecipeActions` works, base surface recipes authored |
| Blueprints | Core block kinds have typed blueprints, VPB reads them |
| Enforcement | Violation scanner returns 0 hits, Vite plugin blocks in dev, CI blocks PRs |
| VPB | Persists BlockNode trees, no theme values in storage, Zod validates on load |
| Dark Variant | Full visual identity locked, all recipes produce correct output |
| Light Variant | Token value swap only, zero component changes |

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `coldlight.config.ts` | Config orchestrator (identity, roots, adapters, generation, enforcement, attributes) |
| `taxonomy/types.ts` | Core types: PrimitiveContract, SlotSpec, AriaRequirements, ColdLightManifest |
| `taxonomy/registry.ts` | Runtime manifest reader (getManifest, getPrimitive, hasPrimitiveKind) |
| `taxonomy/scanner.ts` | Build-time parity checker |
| `tokens/tokens.ts` | SSOT token values |
| `tokens/schema.ts` | Zod token validators |
| `recipes/index.ts` | Recipe registry |
| `primitives/types.ts` | Shared: cn(), stripStyleProp(), BaseProps, OmitStyle, DATA_ATTRS |
| `index.ts` | Barrel: re-exports taxonomy |
| `index.css` | CSS barrel: imports tokens + recipe CSS in order |

---

## Transport Chain (Melt UI Cloaking)

```
@melt-ui/svelte                           <-- ORIGIN (never imported by components)
    |
    v
api/adapters/meltui/_internal/            <-- Provider Internals
    |
    v
primitives/{kind}/{Kind}.svelte           <-- ColdLight public API
```

Zero `@melt-ui/svelte` imports outside `_internal/`. If you see a direct Melt import in a primitive, it's a violation.

---

## 6-Stage Gate (Before Any .svelte Renderer)

1. **Stage 0 -- Naming + Intent:** Kind name exists, purpose documented, slots defined
2. **Stage 1 -- Token Check:** Uses existing tokens, new tokens added to SSOT only, generator run
3. **Stage 2 -- Taxonomy Contract:** Kind in `taxonomy/kinds.ts`, allowed recipes, prop schema, slot constraints
4. **Stage 3 -- Recipe Authoring:** Recipe ID in registry, variants mapped to Tailwind classes (token-backed only)
5. **Stage 4 -- VPB Registration:** Block in palette, default recipe + props, property UI config
6. **Stage 5 -- Implementation:** Create `.svelte`, receives `{ recipe, props, slots }`, does NOT implement theming

If any stage fails: **STOP. Fix registry first.**

---

**ColdLight is the public API. Users never see adapters.**
