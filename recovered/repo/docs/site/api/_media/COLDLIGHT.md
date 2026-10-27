# ColdLight Design System

> **@devpulse/coldlight** -- Liquid surface design system. Particle effects, metal, glass, molten aesthetics.
>
> Named for Nikola Tesla's cold light gas tubes -- documented as "cold light" in the 1890s.

---

## Package Identity

| Field | Value |
|-------|-------|
| **Name** | `@devpulse/coldlight` |
| **Version** | `0.1.0` |
| **Author** | Jesse "Hades" Hall <jessay@angryvibers.com> |
| **Maintainers** | team@devpulse.app |
| **License** | MIT |
| **Status** | Private (public release planned) |

---

## What ColdLight Is

ColdLight is a **token-first, taxonomy-driven design system** built for:

- **SvelteKit 5** -- Framework
- **Svelte 5 Runes** -- Reactivity ($state, $derived, $effect, $bindable)
- **Tailwind CSS 4** -- Utility classes via @tailwindcss/vite
- **dsAdapters** -- ARIA provider (accessibility, keyboard, focus) -- planned for adapter-backed primitives

ColdLight is **supports**:

- A CSS-in-JS solution
- A component library 
- recipes 
- it generates best practice organized CSS real world seniorpatterns 

---

## Core Architecture (Locked)

### Provider Model

| Provider | Responsibility |
|----------|---------------|
| **Melt UI** | ARIA attributes, focus management, keyboard navigation (adapter-backed primitives) |
| **ColdLight** | Taxonomy, data attributes, type system, recipes, structural primitives |
| **ReactAria**

### Two Primitive Archetypes

**Archetype A: ColdLight-Owned** -- Component renders its own DOM with ARIA set directly. No adapter needed. Examples: button, badge, skeleton, progress, alert, avatar, card, label, input, separator, textarea.

**Archetype B: Adapter-Backed** -- Uses MeltUI adapter bridged through transport chain. Root creates adapter + context. Sub-components consume from context. Examples (planned): dialog, tabs, select, popover, tooltip, sheet, accordion, collapsible.

### Primitive Contract

Every primitive is identified via:

```
data-kind   = primitive identity (dialog, select, button)
data-slot   = slot within primitive (root, trigger, content)
data-state  = state machine output (open, closed, active)
```

### Layer Model

| Layer | Folder | Description | Example |
|-------|--------|-------------|---------|
| 0 | `tokens/` | Design tokens (SSOT) | `tokens.ts` |
| 2 | `recipes/` | Style compositions | `data-surface="glass"` |
| 3 | `primitives/` | Structural + behavioral wrappers | `Dialog.svelte` |
| 4 | `semantics/` | Primitives + Recipes | `GlassButton.svelte` |
| 5 | `patterns/` | Multiple semantics | `LoginForm.svelte` |
| 6 | `blocks/` | Page sections | `HeroGlass.svelte` |

---

## Visual Identity

ColdLight produces interfaces with:

- **Liquid surfaces** -- Fluid, flowing aesthetics with depth and motion
- **Particle effects** -- Shimmer, scan lines, noise overlays
- **Metal finishes** -- Brushed, polished, oxidized surface treatments
- **Glass layers** -- Semi-transparent with backdrop blur and refraction
- **Molten accents** -- Glowing edges, ember trails, heat signatures
- **OKLCH color system** -- Perceptually uniform, wide-gamut colors
- **Beveled depth** -- Inset edges for tactile dimension
- **Dark-first** -- Dark variant only (light variant planned for future)

---

## Architecture

```
@devpulse/coldlight
├── tokens/           # SSOT values (OKLCH colors, spacing, etc.)
│   ├── tokens.ts     # Source of truth (hand-edited)
│   ├── tokens.css    # GENERATED
│   ├── types.ts      # GENERATED
│   └── tailwind.preset.ts  # GENERATED
├── taxonomy/         # SSOT registries
│   ├── primitiveKinds.ts   # All data-kind values
│   ├── primitiveRegistry.ts # Slots + metadata
│   ├── kinds.ts      # Block kinds (shell, surface, widget)
│   ├── contracts.ts  # Prop schemas
│   └── slots.ts      # Slot definitions
├── recipes/          # Style composition
│   ├── index.ts      # Recipe registry
│   ├── actions/      # Svelte actions (glowTrack, ripple)
│   └── css/          # Generated recipe CSS
├── primitives/       # Structural + behavioral wrappers
│   └── {name}/       # PascalCase: Button/, Dialog/, Tabs/
│       ├── {Name}.svelte       # Root component
│       ├── {Name}{Sub}.svelte  # Sub-components
│       ├── types.ts            # Props interfaces
│       ├── context.ts          # Symbol-keyed context (if compound)
│       └── index.ts            # Barrel export
├── semantics/        # Primitives + Recipes
├── patterns/         # Multi-semantic compositions
├── blocks/           # Page sections
└── docs/             # Documentation
```

---

## The Rules (Non-Negotiable)

### Rule 1: Two Primitive Archetypes

**Archetype A (ColdLight-owned)**: Component renders native HTML with ARIA props directly. Used for simple/self-contained primitives.

**Archetype B (Adapter-backed)**: Uses MeltUI through transport chain. Components never import `@melt-ui/svelte` directly. Transport chain cloaks the dependency.

### Rule 2: Taxonomy first

Before writing ANY primitive:
1. Verify kind exists in `taxonomy/primitiveKinds.ts`
2. Verify slots exist in `taxonomy/primitiveRegistry.ts`
3. Verify state enum exists (if stateful)
4. THEN write the primitive

### Rule 3: PascalCase file naming

```
-- Button.svelte, ButtonIcon.svelte, ButtonLabel.svelte
-- DialogTrigger.svelte, DialogContent.svelte
```

### Rule 4: `index.ts` is clean

```typescript
// CORRECT
export { default as Dialog } from './Dialog.svelte';
export type { DialogRootProps } from './types.js';

// WRONG - no logic in index.ts
import { something } from 'somewhere';
const computed = something();
```

### Rule 5: Three data attributes

Every primitive element emits:

| Attribute | Required | Example |
|-----------|----------|---------|
| `data-kind` | ALWAYS | `"dialog"` |
| `data-slot` | ALWAYS | `"content"` |
| `data-state` | If stateful | `"open"` |
| `data-id` | If user provides | `"my-dialog"` |

### Rule 6: Components cannot contain colors

Components use:
- Token references (`var(--*)`)
- ColdLight molecule classes (`glass-void`, `bevel-subtle`, `glow-teal`)
- Recipe-generated per-slot class strings via `getRecipe()`

Components **never** contain:
- Raw color values (`#fff`, `oklch()`, `rgb()`)
- Arbitrary Tailwind values (`bg-[#000]`, `text-[12px]`)
- Inline styles (`style="color: red"`)

---

## Token Categories

| Category | Prefix | Example |
|----------|--------|---------|
| Hues | `--hue-*` | `--hue-teal` |
| Color Scales | `--color-{name}-{step}` | `--color-teal-500` |
| Glass | `--glass-*` | `--glass-deep` |
| Matte | `--matte-*` | `--matte-dark` |
| Text | `--text-*` | `--text-primary` |
| Spacing | `--space-*` | `--space-4` |
| Radius | `--radius-*` | `--radius-md` |
| Blur | `--blur-*` | `--blur-md` |
| Glow | `--glow-*` | `--glow-teal` |
| Shadow | `--shadow-*` | `--shadow-z2` |
| Bevel | `--bevel-*` | `--bevel-subtle` |
| Z-Index | `--z-*` | `--z-modal` |
| Duration | `--duration-*` | `--duration-fast` |
| Easing | `--ease-*` | `--ease-out` |
| Text Size | `--text-size-*` | `--text-size-base` |
| Padding | `--padding-*` | `--padding-md` |

---

## Recipe System

Recipes are composable functions that map `DsSurfaceProps` to per-slot class strings:

```typescript
// Recipe definition
registerRecipe({
  id: "panel.glass.void",
  kind: "panel",
  defaults: { surface: "glass", variant: "void", bevel: "off", glow: "off", ... },
  classes: (props: DsSurfaceProps) => ({
    root: cn(surfaceClass(props.surface, props.variant), radiusClass(props.radius)),
    header: cn("px-4 py-3", "border-b border-white/6"),
    body: cn("px-4 py-3", "flex-1"),
  }),
});
```

### Molecule Classes (ColdLight Utilities)

Molecules compose via shadow layering — multiple molecules on one element work together:

```html
<!-- All three shadow layers compose, no conflicts -->
<div class="glass-void bevel-subtle glow-teal">...</div>
```

### Using Recipes in Components

```svelte
<script lang="ts">
import { getRecipe } from "$lib/design/recipes/index.js";

const recipe = getRecipe("shell.app.default");
const slots = $derived(recipe?.classes({ ...recipe.defaults }) ?? {});
</script>

<header data-slot="topbar" class={slots.topbar}>...</header>
```

---

## Commands

```bash
# Development
pnpm dev                    # Starts dev server

# Token generation
pnpm ds:tokens:build        # Generate token outputs

# Type checking
pnpm check                  # TypeScript check

# Tests
pnpm test:run primitives/   # Run primitive tests
```

---

## Changelog

### 0.1.0 (In Development)

- Taxonomy-first architecture
- PascalCase primitive file naming
- Two archetype model (ColdLight-owned + adapter-backed)
- Token system (OKLCH, unprefixed)
- Glass/matte/solid surface recipes
- Dark variant only
- 40+ primitives implemented (structural)

---

## License

MIT (c) Jesse "Hades" Hall

---

## Contact

- **Author**: Jesse "Hades" Hall <jessay@angryvibers.com>
- **Team**: team@devpulse.app

---

**This is the canonical ColdLight specification.**
