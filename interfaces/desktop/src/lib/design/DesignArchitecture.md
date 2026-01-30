# COLD LIGHT - Design Architecture

> Complete architecture notes for the DevPulse design system.

---

## THE COMPOSABLE RECIPE SYSTEM (CORE CONCEPT)

**This is the most important thing to understand about COLD LIGHT.**

### Recipes Are NOT Static

```
❌ WRONG: Recipe = hardcoded class string
   "button.glass.default" → "bg-dp-glass-deep border-dp-teal-500"

✅ CORRECT: Recipe = composable configuration with defaults
   "button.glass.default" → {
     defaults: { color: { a: "teal" }, glow: { color: "teal" } },
     classes: (props) => computed classes from props
   }
```

### The Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPOSABLE RECIPE WORKFLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. BASE RECIPES                                                    │
│     └── Capture the COLD LIGHT visual vision as defaults            │
│     └── Stored in recipes/index.ts                                  │
│     └── Each has: id, classes(props), requires[], defaults          │
│                                                                     │
│  2. VPB (Visual Page Builder = Visual Recipe Editor)                │
│     └── Exposes DsSurfaceProps as UI controls                       │
│     └── Dropdowns for colors, finish, frame, motion                 │
│     └── User changes color.a from "teal" to "purple"                │
│     └── VPB WRITES CODE for the user                                │
│                                                                     │
│  3. SAVE AS NEW RECIPE                                              │
│     └── Tweaked props become a new named recipe                     │
│     └── "button.glass.primary" → "button.glass.myPurple"            │
│     └── Registered and available platform-wide                      │
│                                                                     │
│  4. BUILD PIPELINE                                                  │
│     └── Reads all registered recipes                                │
│     └── Generates CSS at compile time                               │
│     └── No runtime CSS generation                                   │
│                                                                     │
│  5. VITE PLUGIN ENFORCER                                            │
│     └── Watches files in real-time during dev                       │
│     └── BLOCKS build on any violation                               │
│     └── No mercy. No exceptions.                                    │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### DsSurfaceProps = The Composable Schema

This is the contract that makes everything composable:

```typescript
interface DsSurfaceProps {
  // Colors - VPB shows dropdown of registered ColorTokens
  color: {
    a: ColorToken;        // Primary color (teal, purple, magenta, ember)
    b?: ColorToken;       // Secondary color for gradients
  };

  // Surface finish - VPB shows dropdown
  finish: FinishToken;    // glass | matte | solid

  // Border/frame style - VPB shows dropdown
  frame: FrameToken;      // none | soft | hard | crisp

  // Shadow/elevation - VPB shows dropdown
  depth: DepthToken;      // z0 | z1 | z2 | z3 | z4

  // Motion effects - VPB shows dropdowns
  motion: {
    hover?: MotionToken;  // lift | glow | pulse | none
    enter?: MotionToken;  // fade-in | slide-up | scale
    ambient?: MotionToken; // breathe | pulse | shimmer
  };

  // Bevel effect - VPB shows dropdown
  bevel: {
    level: BevelToken;    // none | subtle | soft | deep
  };

  // Glow effect - VPB shows dropdown + slider
  glow: {
    color?: GlowToken;    // teal | purple | magenta | ember | frost
    intensity?: number;   // 0-1 slider
  };
}
```

**Every single prop maps to a VPB UI control. This is how junior devs use the system.**

---

## Core Principles

1. **Registry-First, Always** - Tokens → Taxonomy → Recipes → VPB → Renderers
2. **Recipes Are Composable** - Not static strings, configurable objects with defaults
3. **VPB Writes Code** - It's a code generator, not just a previewer
4. **Token IDs, Not Strings** - Components accept constrained enums, VPB can enumerate
5. **SSOT in TypeScript** - `index.ts` files ARE the single source of truth
6. **Bits UI Boundary** - Only `primitives/` imports from `meltui`
7. **Validate at Boundaries** - VPB load, API response, not every render
8. **Vite Plugin Enforces** - Violations block builds. No exceptions.

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
| 7a | **Primitives** | Bits UI wrappers (NO styling) | Bits UI only |
| 7b | **Components** | Recipe-driven presets | Primitives, Recipes |
| 8 | **Renderers** | VPB block renderers | Recipes, Taxonomy |

---

## Recipe Registry Structure

Each recipe in `recipes/index.ts`:

```typescript
const recipeRegistry = {
  "button.glass.default": {
    id: "button.glass.default",

    // Default prop values - the COLD LIGHT vision captured
    defaults: {
      color: { a: "teal" },
      finish: "glass",
      frame: "soft",
      depth: "z2",
      motion: { hover: "lift" },
      bevel: { level: "soft" },
      glow: { color: "teal", intensity: 0.5 }
    },

    // Classes computed from props - composable
    classes: (props: DsSurfaceProps) => ({
      root: buildClasses(props),
      icon: "...",
      label: "..."
    }),

    // Required actions - auto-attached by renderer
    requires: (props) => {
      if (props.motion.hover === "glow-track") return ["glowTrack"];
      return [];
    }
  }
};
```

### How VPB Uses This

1. VPB reads `defaults` to populate initial preview
2. VPB reads type of each prop to generate UI control
3. User changes `color.a` from "teal" to "purple" via dropdown
4. VPB calls `classes({ ...defaults, color: { a: "purple" } })`
5. Preview updates with new computed classes
6. User clicks "Save" → VPB writes new recipe to registry

---

## Surface Registry (Extended)

Each surface in `recipes/surface.registry.ts`:

```typescript
SurfaceRegistry = {
  glass: {
    recipe: "glass.surface.css",
    capabilities: {
      supportsTone: true,
      supportsGlow: true,
      supportsBlur: true,
      supportsAccent: true,
    },
    allowedComponents: ["Panel", "Card", "Modal", "Popover", "Drawer"],
    allowedControls: {
      tone: ["cold", "neutral", "warm"],
      glow: ["off", "soft", "hard"],
      radius: ["r1", "r2", "r3", "r4"],
      blur: ["b1", "b2", "b3"],
    },
    dependencies: {
      tokens: ["dp-glass-base", "dp-glass-tint-*", "dp-blur-*"],
      motion: null,
      behaviors: null,
    },
  }
};
```

---

## VPB = Visual Recipe Editor

**VPB is NOT just a page builder. It's a code generator.**

### What VPB Does

1. **Reads registries** - Enumerates all kinds, recipes, tokens
2. **Shows palette** - User drags blocks onto canvas
3. **Shows prop controls** - Dropdowns/sliders for each DsSurfaceProps field
4. **Live preview** - Applies composable recipe classes in real-time
5. **Writes code** - Generates Svelte code with exact props user selected
6. **Saves recipes** - User can save tweaked config as new recipe

### VPB Output Example

User configures a button in VPB:
- Color: purple (was teal)
- Motion: pulse (was lift)
- Glow: magenta (was teal)

VPB generates:

```svelte
<GlassButton
  color={{ a: "purple" }}
  motion={{ hover: "pulse" }}
  glow={{ color: "magenta", intensity: 0.7 }}
>
  Click Me
</GlassButton>
```

**Junior dev never writes CSS. They compose via VPB.**

---

## Behavior Types

| Type | Purpose | Declared In |
|------|---------|-------------|
| `hover-intent` | Delayed hover recognition | recipe.requires[] |
| `press-feedback` | Visual feedback on press | recipe.requires[] |
| `pointer-tracking` | Follow cursor position | recipe.requires[] |
| `parallax-tilt` | 3D tilt on hover | recipe.requires[] |
| `focus-trap` | Keyboard focus containment | recipe.requires[] |
| `click-outside` | Detect outside clicks | recipe.requires[] |
| `glow-track` | Glow follows mouse | recipe.requires[] |
| `drag-handle` | Draggable element | recipe.requires[] |
| `resize-handle` | Resizable element | recipe.requires[] |

**Behaviors are NEVER manually attached. Recipe declares, renderer attaches.**

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

## Enforcement (Vite Plugin - MANDATORY)

**NOT optional scripts. Vite plugin that BLOCKS builds.**

```typescript
// vite.config.ts
import { dsEnforce } from './src/vite/ds-enforce.plugin';

export default defineConfig({
  plugins: [
    dsEnforce({
      strict: true,    // BLOCK on violations
      watch: true,     // Real-time during dev
      overlay: true    // Show in browser
    })
  ]
});
```

### Violations That Block Build

| Violation | Pattern |
|-----------|---------|
| CSS vars in renderers | `var(--` in `renderers/*.svelte` |
| Arbitrary Tailwind | `[` in class attributes |
| `<style>` in primitives | `<style` in `primitives/*.svelte` |
| Inline styles in renderers | `style="` in `renderers/*.svelte` |
| Raw colors | `#`, `oklch(`, `rgb(`, `hsl(` outside tokens |
| Unregistered recipe | Recipe ID not in registry |
| Unregistered kind | Kind not in taxonomy |

---

## 6-Stage Gate (Enforced by Vite Plugin)

Before ANY renderer `.svelte` can exist:

1. **Stage 0 - Naming**: Kind name + slots defined in taxonomy
2. **Stage 1 - Tokens**: Semantic tokens exist in `tokens.ts`
3. **Stage 2 - Taxonomy**: Kind + contract + slots registered
4. **Stage 3 - Recipe**: Recipe ID + composable props + defaults defined
5. **Stage 4 - VPB**: Block in palette with prop controls
6. **Stage 5 - Renderer**: NOW you can create `.svelte`

**Vite plugin checks all stages. Missing stage = build failure.**

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
2. **Tokens**: Add to token arrays in `tokens.ts`
3. **Recipe**: Add composable recipe with defaults
4. **VPB**: Ensure new recipe appears in palette
5. **Motion**: Add keyframes if required
6. **Run Vite**: If violations, fix before proceeding
