# COLD LIGHT - Design Architecture

> Complete architecture notes for the DevPulse design system.

---

## Core Principles

1. **Token IDs, Not Strings** - Components accept constrained enums, VPB can enumerate
2. **SSOT in TypeScript** - `index.ts` files ARE the single source of truth
3. **Bits UI Boundary** - Only `primitives/` imports from `bits-ui`
4. **CSS Recipes** - Stay as CSS, token-only, no hardcoded values
5. **Validate at Boundaries** - VPB load, API response, not every render

---

## 8-Tier Responsibilities

| Tier | Name | Contains | Imports From |
|------|------|----------|--------------|
| 1 | **Taxonomy** | Categories, dependency gates | Nothing |
| 2 | **Tokens** | Values, types, Zod schemas | Nothing |
| 3 | **Foundations** | Spacing, Z-Index, Density maps | Tokens |
| 4 | **Surfaces** | SSOT registry + CSS recipes | Tokens |
| 5 | **Motion** | Keyframes, presets, budgets | Tokens |
| 6 | **Behaviors** | Interaction modules, constraints | Tokens, Motion |
| 7a | **Primitives** | Bits UI wrappers | Bits UI, Tokens |
| 7b | **Components** | Semantic styled UI | Primitives, Surfaces |
| 8 | **Blocks** | VPB compositions, validators | Components, Tokens |

---

## Surface Registry Structure

Each surface defines:
- **recipe** - CSS file path (or null for base)
- **capabilities** - What it supports (tone, glow, blur, accent)
- **allowedControls** - Which token values are valid
- **dependencies** - Required tokens/motion/behaviors
- **allowedComponents** - Which components can use it

---

## Behavior Types

| Type | Purpose |
|------|---------|
| `hover-intent` | Delayed hover recognition |
| `press-feedback` | Visual feedback on press |
| `pointer-tracking` | Follow cursor position |
| `parallax-tilt` | 3D tilt on hover |
| `focus-trap` | Keyboard focus containment |
| `click-outside` | Detect outside clicks |
| `drag-handle` | Draggable element |
| `resize-handle` | Resizable element |
| `zone-focus` | Activate zone on hover |

---

## Motion Categories

| Category | Purpose | Keyframes |
|----------|---------|-----------|
| **Ambient** | No interaction | `glow-pulse`, `breathe`, `subtle-pulse` |
| **Background** | Surface effects | `gradient-shift`, `glow-electric` |
| **Triggered** | On state change | `fade-in-up`, `focus-ring-pulse` |
| **Interactive** | User action | `hover-lift`, `press-down` |
| **Branding** | Logo/text | `parasite-sweep`, `text-shimmer` |

---

## ParasiteLogo Specification

### Visual Requirements
- **Typography**: Glass effect with thick bevel depth
- **Borders**: Crisp dark lines
- **Base State**: "DevPULSE" with glass styling

### Ink Creep Animation
- **Duration**: 2.3-2.6 seconds per letter
- **Effect**: Color "creeps" over letter like ink in water
- **Sequence**: As one letter finishes, next starts (overlap)
- **Order**: Left to right (D → e → v → P → U → L → S → E)

### Sporadic Pulse Overlay
- **Trigger**: Random intervals (every 8-15s)
- **Effect**: 4 brutalist/cyber colors pulse over entire "DevPULSE"
- **Colors**: TBD (teal, purple, electric blue, magenta)

### Technical Notes
> **Honest Assessment**: Pure CSS per-letter ink-creep is complex.
> Best approach: SVG text with Svelte transitions OR CSS staggered animations with `animation-delay` per letter span.
> May require JS for the random sporadic pulse timing.

---

## Plugin Architecture

Plugins live in `domains/plugins/`, NOT in design system.

```
domains/plugins/parasiteLogo/
├── plugin.manifest.ts    # Capabilities
├── plugin.vpb.tab.ts     # VPB contribution
└── plugin.blocks/        # Block definitions
```

Plugins contribute via registries, cannot modify core tokens.

---

## New Category Checklist

When adding (e.g., "slime" surface):

1. **Taxonomy**: Add to DesignCategories
2. **Tokens**: Add to token arrays
3. **SSOT**: Add entry with capabilities + controls
4. **Recipe CSS**: Only if custom styles needed
5. **Motion**: Only if keyframes required
6. **Components**: Declare which allow it
