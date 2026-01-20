# ColdLight Design System

> **@devpulse/coldlight** — Liquid surface design system. Particle effects, metal, glass, molten aesthetics.
>
> Named for Nikola Tesla's cold light gas tubes — PBS documented this phenomenon in the 1890 as "cold light."

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

ColdLight is a **token-first, recipe-driven design system** built for:

- **SvelteKit 5** — Framework
- **Bits UI** — Headless primitives (accessibility, keyboard, focus)
- **Tailwind CSS** — Utility classes, JIT compilation
- **Vite** — Build-time enforcement and generation

ColdLight is **NOT**:

- A portable/framework-agnostic system
- A CSS-in-JS solution
- A component library (it ships primitives + surfaces, not styled components)

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

Reference aesthetic: Tesla's gas tube experiments, liquid metal interfaces, particle physics visualizations, molten glass formations.

---

## Architecture

```
@devpulse/coldlight
├── tokens/           # SSOT values (OKLCH colors, spacing, etc.)
│   ├── tokens.ts     # Source of truth (hand-edited)
│   ├── tokens.css    # GENERATED
│   ├── types.ts      # GENERATED
│   └── schema.ts     # Zod validators
├── taxonomy/         # Block definitions
│   ├── kinds.ts      # Block kinds (panel, card, shell, etc.)
│   ├── contracts.ts  # Prop schemas per kind
│   └── slots.ts      # Slot definitions
├── recipes/          # Style composition
│   ├── index.ts      # Recipe registry
│   ├── actions/      # Svelte actions (glowTrack, ripple)
│   └── css/          # GENERATED recipe CSS
├── primitives/       # Bits UI wrappers (no styling)
└── vite-plugin.ts    # Build-time generation + enforcement
```

---

## The Rules (Non-Negotiable)

### Rule 1: tokens.ts is the ONLY source of truth

All token values live in `tokens/tokens.ts`. Everything else is generated:

- `tokens.css` — Generated CSS custom properties
- `types.ts` — Generated TypeScript types
- `tailwind.preset.ts` — Generated Tailwind theme mapping
- `surfaces.gen.css` — Generated recipe CSS

**Never hand-edit generated files.**

### Rule 2: Components cannot contain colors or CSS

Components use:

- Token references (`var(--dp-*)`)
- Recipe classes (`dp-surface`)
- Data attributes (`data-surface="glass"`)

Components **never** contain:

- Raw color values (`#fff`, `oklch()`, `rgb()`)
- Arbitrary Tailwind values (`bg-[#000]`, `text-[12px]`)
- Inline styles (`style="color: red"`)
- CSS custom property definitions (`--my-var: value`)

### Rule 3: Recipes are the only place styling decisions happen

Recipes map (kind + variant + modifiers) → CSS classes.

Components don't "style themselves" — they apply recipe output.

### Rule 4: Vite plugin enforces at build time

The Vite plugin:

1. **Generates** — Runs token generator on build/HMR
2. **Validates** — Checks all .svelte files in scope
3. **Fails** — Hard error with file:line on violation

No manual scripts. No CI checks. Build-time enforcement only.

### Rule 5: Dark variant first

Build the dark variant completely before adding light.

Theme variants change **values only**, never token **names** or component **structure**.

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

/* Role modifier */
.dp-surface[data-role="button"] { ... }
.dp-surface[data-role="input"] { ... }
.dp-surface[data-role="panel"] { ... }

/* Variant modifier */
.dp-surface[data-variant="void"] { ... }
.dp-surface[data-variant="deep"] { ... }

/* Glow modifier */
.dp-surface[data-glow="teal"] { ... }
.dp-surface[data-glow="purple"] { ... }

/* Bevel modifier */
.dp-surface[data-bevel="subtle"] { ... }
.dp-surface[data-bevel="deep"] { ... }
```

### Using Recipes

```svelte
<!-- Glass button with teal glow -->
<button class="dp-surface" data-surface="glass" data-role="button" data-glow="teal">
  Click me
</button>

<!-- Deep glass panel -->
<div class="dp-surface" data-surface="glass" data-role="panel" data-variant="deep">
  Content
</div>
```

---

## Primitives

Primitives are **Bits UI wrappers** with no styling:

| Primitive | Wraps | Purpose |
|-----------|-------|---------|
| `Button` | Bits UI Button | Click interaction |
| `Dialog` | Bits UI Dialog | Modal overlay |
| `Toggle` | Bits UI Toggle | Boolean switch |
| `Tabs` | Bits UI Tabs | Tab navigation |
| `Accordion` | Bits UI Accordion | Collapsible sections |
| `Popover` | Bits UI Popover | Floating content |
| `Select` | Bits UI Select | Dropdown selection |

Primitives handle **behavior** (focus, keyboard, accessibility).
Recipes handle **appearance** (colors, shadows, borders).

---

## Vite Plugin

### Installation

```typescript
// vite.config.ts
import { coldlight } from '@devpulse/coldlight/vite-plugin';

export default defineConfig({
  plugins: [
    coldlight(),
    // ... other plugins
  ],
});
```

### What It Does

1. **On build start**: Generates all CSS/TS from tokens.ts
2. **On HMR**: Regenerates when tokens.ts changes
3. **On transform**: Validates .svelte files for violations
4. **On violation**: Fails build with detailed error

### Violation Errors

```
[coldlight] VIOLATION in src/components/MyButton.svelte:42
  Found arbitrary Tailwind value: bg-[#ff0000]
  Use a token instead: bg-dp-ember-500

[coldlight] VIOLATION in src/components/Panel.svelte:18
  Found CSS custom property definition: --my-color
  Component-scoped CSS variables are not allowed
```

---

## Block Kinds (Taxonomy)

Kinds define what can be composed in VPB:

### Shell Kinds (CSS Grid required)

| Kind | Description | Slots |
|------|-------------|-------|
| `appShell` | Root application shell | topBar, sideNav, main, statusBar, dock |
| `topBar` | Top navigation bar | left, center, right |
| `sideNav` | Side navigation panel | header, body, footer |
| `statusBar` | Bottom status bar | left, center, right |
| `dock` | Floating dock container | content |

### Surface Kinds

| Kind | Description | Slots |
|------|-------------|-------|
| `panel` | Generic container | header, body, footer |
| `card` | Card surface | header, body, footer |
| `modal` | Modal overlay | header, body, footer |
| `glassFrame` | Glass frame | content |
| `inputFrame` | Input container | prefix, input, suffix |

### Widget Kinds

| Kind | Description | Slots |
|------|-------------|-------|
| `widget` | Dashboard widget | header, body |
| `statMeter` | Stat display | value, label |
| `chart` | Chart widget | header, chart |

### Chat Kinds

| Kind | Description | Slots |
|------|-------------|-------|
| `chatDock` | Chat dock panel | header, messages, input |
| `chatThread` | Message thread | messages |
| `chatBubble` | Single message | content, meta |

---

## Contracts (Prop Schemas)

Every kind has a Zod schema defining its props:

```typescript
// Base surface props (all surfaces extend this)
interface DsSurfaceProps {
  color: {
    mode: "mono" | "duo";
    a: AccentToken;
    b?: AccentToken;
  };
  surface: {
    finish: "glass" | "matte" | "solid";
    texture?: "none" | "noise" | "grain";
    clarity?: "void" | "deep" | "smoke" | "frost";
  };
  frame: {
    mode: "none" | "solid" | "glow";
    width: "thin" | "medium" | "thick";
    glow: GlowToken | "off";
  };
  depth: {
    intent: "flat" | "raised" | "sunken" | "floating";
    bevel: {
      level: "off" | "subtle" | "soft" | "medium";
      style: "outset" | "inset" | "imprint";
    };
  };
}
```

Props use **enum values only** — never raw colors or CSS.

---

## File Structure

```
interfaces/desktop/src/lib/design/
├── COLDLIGHT.md              # This document (canonical spec)
├── package.json              # Package manifest
├── index.ts                  # Main barrel export
├── index.css                 # CSS entry point
├── vite-plugin.ts            # Vite plugin
├── tokens/
│   ├── tokens.ts             # SSOT (hand-edited)
│   ├── tokens.css            # GENERATED
│   ├── types.ts              # GENERATED
│   ├── tailwind.preset.ts    # GENERATED
│   └── schema.ts             # Zod validators
├── taxonomy/
│   ├── kinds.ts              # Block kind definitions
│   ├── contracts.ts          # Prop schemas
│   └── slots.ts              # Slot definitions
├── recipes/
│   ├── index.ts              # Recipe registry
│   ├── actions/
│   │   ├── index.ts          # Action registry
│   │   ├── glowTrack.ts      # Mouse glow tracking
│   │   └── ripple.ts         # Ripple effect
│   └── css/
│       ├── keyframes.css     # Animation keyframes
│       └── surfaces.gen.css  # GENERATED recipe CSS
├── primitives/
│   ├── Button.svelte         # Bits UI Button
│   ├── Dialog.svelte         # Bits UI Dialog
│   ├── Toggle.svelte         # Bits UI Toggle
│   ├── Tabs.svelte           # Bits UI Tabs
│   ├── Accordion.svelte      # Bits UI Accordion
│   ├── Popover.svelte        # Bits UI Popover
│   └── Select.svelte         # Bits UI Select
└── docs/
    ├── tokens.md             # Token documentation
    ├── recipes.md            # Recipe documentation
    ├── primitives.md         # Primitive documentation
    └── taxonomy.md           # Taxonomy documentation
```

---

## Related Packages

| Package | Purpose | Relationship |
|---------|---------|--------------|
| `@devpulse/coldlight` | Design system | This package |
| `@devpulse/vpb` | Visual Page Builder | Consumes coldlight, separate package |

VPB composes BlockNodes using ColdLight's taxonomy, contracts, and recipes.

---

## Commands

```bash
# Development (handled by Vite plugin)
pnpm dev                    # Starts dev server, plugin auto-generates

# Manual generation (if needed)
pnpm coldlight:generate     # One-shot token generation

# Validation
pnpm coldlight:check        # Check for violations without building
```

---

## Changelog

### 0.1.0 (In Development)

- Initial token system (OKLCH)
- Glass/matte/solid surface recipes
- Glow and bevel modifiers
- Bits UI primitive wrappers
- Vite plugin for generation and enforcement
- Dark variant only

---

## License

MIT © Jesse "Hades" Hall

---

## Contact

- **Author**: Jesse "Hades" Hall <jessay@angryvibers.com>
- **Team**: team@devpulse.app
