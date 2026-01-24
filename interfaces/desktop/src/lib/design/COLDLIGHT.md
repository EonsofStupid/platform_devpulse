# ColdLight Design System

> **@devpulse/coldlight** — Liquid surface design system. Particle effects, metal, glass, molten aesthetics.
>
> Named for Nikola Tesla's cold light gas tubes — documented as "cold light" in the 1890s.

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

- **SvelteKit 5** — Framework
- **Melt UI** — ARIA provider (accessibility, keyboard, focus)
- **Tailwind CSS 4** — Utility classes, JIT compilation
- **DaisyUI** — UI quality via recipes
- **Vite** — Build-time enforcement and generation

ColdLight is **NOT**:

- A portable/framework-agnostic system (Svelte-first)
- A CSS-in-JS solution
- A component library (it ships primitives + surfaces + semantics)

---

## Core Architecture (Locked)

### Provider Model

| Provider | Responsibility |
|----------|---------------|
| **Melt UI** | ARIA attributes, focus management, keyboard navigation |
| **ColdLight** | Taxonomy, data attributes, type system, recipes |

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
| 3 | `primitives/` | Melt UI wrappers | `dialog.svelte` |
| 4 | `semantics/` | Primitives + Recipes | `GlassButton.svelte` |
| 5 | `patterns/` | Multiple semantics | `LoginForm.svelte` |
| 6 | `blocks/` | Page sections | `HeroGlass.svelte` |

---

## Visual Identity

ColdLight produces interfaces with:

- **Liquid surfaces** — Fluid, flowing aesthetics with depth and motion
- **Particle effects** — Shimmer, scan lines, noise overlays
- **Metal finishes** — Brushed, polished, oxidized surface treatments
- **Glass layers** — Semi-transparent with backdrop blur and refraction
- **Molten accents** — Glowing edges, ember trails, heat signatures
- **OKLCH color system** — Perceptually uniform, wide-gamut colors
- **Beveled depth** — Inset/outset edges for tactile dimension
- **Dark-first** — Dark variant only (light variant planned for future)

---

## Architecture

```
@devpulse/coldlight
├── tokens/           # SSOT values (OKLCH colors, spacing, etc.)
│   ├── tokens.ts     # Source of truth (hand-edited)
│   ├── tokens.css    # GENERATED
│   ├── types.ts      # GENERATED
│   └── schema.ts     # Zod validators
├── taxonomy/         # SSOT registries
│   ├── primitiveKinds.ts   # All data-kind values
│   ├── primitiveRegistry.ts # Slots + metadata
│   ├── kinds.ts      # Block kinds (shell, surface, widget)
│   ├── contracts.ts  # Prop schemas (Zod)
│   └── slots.ts      # Slot definitions
├── sys/api/_internal/ # Provider mapping layer
│   └── melt/         # Melt UI integration
├── recipes/          # Style composition
│   ├── index.ts      # Recipe registry
│   ├── actions/      # Svelte actions (glowTrack, ripple)
│   └── css/          # Generated recipe CSS
├── primitives/       # Melt UI wrappers (data-kind/slot/state)
│   └── {name}/       # Each primitive in its own folder
└── vite-plugin.ts    # Build-time generation + enforcement
```

---

## The Rules (Non-Negotiable)

### Rule 1: Melt UI is the ARIA provider

ColdLight does NOT set:
- `role` attributes
- `aria-*` attributes
- `tabindex`
- Focus trap logic
- Keyboard handlers

Melt UI handles all of this via `use:melt={$element}`.

### Rule 2: Taxonomy first

Before writing ANY primitive:
1. Verify kind exists in `taxonomy/primitiveKinds.ts`
2. Verify slots exist in `taxonomy/primitiveRegistry.ts`
3. Verify state enum exists (if stateful)
4. THEN write the primitive

### Rule 3: `{name}.svelte` naming

```
✅ dialog.svelte, dialog.trigger.svelte
❌ Dialog.svelte, DialogTrigger.svelte
```

### Rule 4: `index.ts` is clean

```typescript
// ✅ CORRECT
export { default as Dialog } from './dialog.svelte';
export type { DialogRootProps } from './types.js';

// ❌ WRONG - no logic in index.ts
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
| Color Scales | `--dp-{color}-{step}` | `--dp-teal-500` |
| Glass | `--dp-glass-*` | `--dp-glass-deep` |
| Matte | `--dp-matte-*` | `--dp-matte-dark` |
| Text | `--dp-text-*` | `--dp-text-primary` |
| Spacing | `--dp-space-*` | `--dp-space-4` |
| Radius | `--dp-radius-*` | `--dp-radius-md` |
| Blur | `--dp-blur-*` | `--dp-blur-md` |
| Glow | `--dp-glow-*` | `--dp-glow-teal` |
| Shadow | `--dp-shadow-*` | `--dp-shadow-z2` |
| Bevel | `--dp-bevel-*` | `--dp-bevel-outset` |
| Z-Index | `--dp-z-*` | `--dp-z-modal` |
| Duration | `--dp-duration-*` | `--dp-duration-fast` |
| Easing | `--dp-ease-*` | `--dp-ease-out` |

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
  use:melt={$trigger}
  class="dp-surface"
  data-kind="dialog"
  data-slot="trigger"
  data-surface="glass"
  data-glow="teal"
>
  Open Dialog
</button>
```

---

## Primitives

Primitives are **Melt UI wrappers** with data-kind/slot/state:

| Primitive | Melt Builder | Purpose |
|-----------|-------------|---------|
| `dialog` | `createDialog` | Modal dialog |
| `alertDialog` | `createDialog` (role: alertdialog) | Alert requiring action |
| `popover` | `createPopover` | Floating content |
| `tooltip` | `createTooltip` | Information popup |
| `tabs` | `createTabs` | Tab navigation |
| `select` | `createSelect` | Dropdown selection |
| `button` | — | Click interaction |

Primitives handle **ARIA and behavior** (via Melt UI).
Recipes handle **appearance** (via CSS).

---

## File Structure

```
interfaces/desktop/src/lib/design/
├── COLDLIGHT.md              # This document
├── README.md                 # Quick start guide
├── index.ts                  # Main barrel export
├── index.css                 # CSS entry point
├── vite-plugin.ts            # Vite plugin
│
├── tokens/                   # Layer 0: Design Tokens
│   ├── README.md             # Token checklist
│   ├── tokens.ts             # SSOT (hand-edited)
│   ├── tokens.css            # GENERATED
│   ├── types.ts              # GENERATED
│   └── tailwind.preset.ts    # GENERATED
│
├── taxonomy/                 # SSOT Registries
│   ├── README.md             # Taxonomy checklist
│   ├── primitiveKinds.ts     # All primitive kinds
│   ├── primitiveRegistry.ts  # Slots + metadata
│   ├── kinds.ts              # Block kinds
│   ├── contracts.ts          # Prop schemas
│   └── slots.ts              # Slot definitions
│
├── recipes/                  # Layer 2: Style Compositions
│   ├── README.md             # Recipe checklist
│   ├── index.ts              # Recipe registry
│   ├── actions/              # Svelte actions
│   └── css/                  # GENERATED CSS
│
├── primitives/               # Layer 3: Melt UI Wrappers
│   ├── README.md             # Primitive checklist
│   └── {name}/               # Each primitive folder
│
├── semantics/                # Layer 4: Styled Components
│   ├── README.md             # Semantics checklist
│   ├── index.ts              # SSOT export
│   ├── buttons/              # Button semantics
│   ├── inputs/               # Input semantics
│   ├── panels/               # Panel semantics
│   └── cards/                # Card semantics
│
├── patterns/                 # Layer 5: Composed Patterns
│   ├── README.md             # Patterns checklist
│   ├── index.ts              # SSOT export
│   ├── forms/                # Form patterns
│   ├── search/               # Search patterns
│   └── data/                 # Data display patterns
│
├── blocks/                   # Layer 6: Page Sections
│   ├── README.md             # Blocks checklist
│   ├── index.ts              # SSOT export
│   ├── heroes/               # Hero sections
│   ├── features/             # Feature grids
│   ├── dashboards/           # Dashboard layouts
│   ├── chat/                 # Chat interfaces
│   ├── cta/                  # Call-to-action
│   ├── carousels/            # Carousel sections
│   └── navigation/           # Nav sections
│
└── docs/                     # Documentation
    ├── TERMINOLOGY.md        # Industry terms
    ├── tokens.md
    ├── recipes.md
    ├── primitives.md
    └── taxonomy.md
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

- Melt UI as ARIA provider (replacing bits-ui)
- Taxonomy-first architecture
- Three-tier model (Primitive → Semantic → Compound)
- `{name}.svelte` file naming convention
- Token system (OKLCH)
- Glass/matte/solid surface recipes
- Dark variant only

---

## License

MIT © Jesse "Hades" Hall

---

## Contact

- **Author**: Jesse "Hades" Hall <jessay@angryvibers.com>
- **Team**: team@devpulse.app

---

**This is the canonical ColdLight specification.**
