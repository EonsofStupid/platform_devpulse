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
- Token references (`var(--dp-*)`)
- Recipe classes (`dp-surface`)
- Data attributes (`data-surface="glass"`)

Components **never** contain:
- Raw color values (`#fff`, `oklch()`, `rgb()`)
- Arbitrary Tailwind values (`bg-[#000]`, `text-[12px]`)
- Inline styles (`style="color: red"`)

---

## Token Categories

| Category | Prefix | Example |
|----------|--------|---------|
| Hues | `--dp-hue-*` | `--dp-hue-teal` |
| Color Scales | `--dp-color-{name}-{step}` | `--dp-color-teal-500` |
| Glass | `--dp-glass-*` | `--dp-glass-deep` |
| Matte | `--dp-matte-*` | `--dp-matte-dark` |
| Text | `--dp-text-*` | `--dp-text-primary` |
| Spacing | `--dp-space-*` | `--dp-space-4` |
| Radius | `--dp-radius-*` | `--dp-radius-md` |
| Blur | `--dp-blur-*` | `--dp-blur-md` |
| Glow | `--dp-glow-*` | `--dp-glow-teal` |
| Shadow | `--dp-shadow-*` | `--dp-shadow-z2` |
| Bevel | `--dp-bevel-*` | `--dp-bevel-subtle` |
| Z-Index | `--dp-z-*` | `--dp-z-modal` |
| Duration | `--dp-duration-*` | `--dp-duration-fast` |
| Easing | `--dp-ease-*` | `--dp-ease-out` |
| Text Size | `--dp-text-size-*` | `--dp-text-size-base` |
| Padding | `--dp-padding-*` | `--dp-padding-md` |

---

## Recipe System

Recipes are CSS rules that style surfaces via data attributes:

```css
/* Base surface */
.dp-surface { ... }

/* Surface type */
.dp-surface[data-surface="glass"] { ... }
.dp-surface[data-surface="matte"] { ... }
.dp-surface[data-surface="solid"] { ... }

/* Modifiers */
.dp-surface[data-glow="teal"] { ... }
.dp-surface[data-bevel="subtle"] { ... }
```

### Using Recipes

```svelte
<!-- Primitive (behavior) + Recipe (appearance) -->
<button
  class="dp-surface"
  data-kind="button"
  data-slot="root"
  data-surface="glass"
  data-glow="teal"
>
  Click me
</button>
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
- Token system (OKLCH, `--dp-*` prefix)
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
