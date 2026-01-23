# ColdLight Taxonomy System

> **The mandatory registry for all design system entities.**
> Every component, recipe, and token must register against this taxonomy.

---

## Overview

The Taxonomy is ColdLight's type system. It defines:

1. **What entities can exist** (kinds, materials, recipes)
2. **What properties they must have** (minimal requirements)
3. **What values are legal** (Zod-enforced validation)
4. **How context affects them** (FOCUS weights, environment)

```
Taxonomy = Registry + Validation + Context
```

---

## Hierarchy

| Level | Category | Responsibility |
|-------|----------|----------------|
| 0 | **Tokens** | Raw values (colors, spacing, blur, timing) |
| 1 | **Intent** | Semantic meaning (what a value does) |
| 2 | **Recipe** | Combining intents into blueprints |
| 3 | **Context** | Environment modifiers (FOCUS, mode, platform) |

---

## Level 0: Tokens (Primitives)

Raw values with no semantic meaning. These are the atoms.

```typescript
// taxonomy/tokens/blur.ts
export const BlurTokens = {
  "blur-0": "0px",
  "blur-xs": "4px",
  "blur-sm": "8px",
  "blur-md": "12px",
  "blur-lg": "20px",
  "blur-xl": "24px",
} as const;

export type BlurToken = keyof typeof BlurTokens;
```

```typescript
// taxonomy/tokens/timing.ts
export const TimingTokens = {
  "instant": "50ms",
  "fast": "150ms",
  "normal": "250ms",
  "slow": "400ms",
  "glacial": "800ms",
} as const;

export type TimingToken = keyof typeof TimingTokens;
```

```typescript
// taxonomy/tokens/depth.ts
export const DepthTokens = {
  "lift-0": "0px",
  "lift-1": "-1px",
  "lift-2": "-2px",
  "lift-3": "-4px",
  "z-near": "20px",
  "z-far": "-20px",
} as const;

export type DepthToken = keyof typeof DepthTokens;
```

---

## Level 1: Intent (Semantic)

What tokens DO, not what they ARE.

```typescript
// taxonomy/intent/focus.ts
export const FocusIntent = {
  low: {
    blur: "blur-sm",
    shadow: "shadow-subtle",
    saturation: 150,
    timing: "slow",
  },
  medium: {
    blur: "blur-md",
    shadow: "shadow-elevated",
    saturation: 180,
    timing: "normal",
  },
  high: {
    blur: "blur-lg",
    shadow: "shadow-deep",
    saturation: 200,
    timing: "fast",
  },
  critical: {
    blur: "blur-xl",
    shadow: ["shadow-glow", "shadow-deep"],
    saturation: 200,
    timing: "instant",
  },
} as const;

export type FocusLevel = keyof typeof FocusIntent;
```

```typescript
// taxonomy/intent/depth.ts
export const DepthIntent = {
  flat: { lift: "lift-0", z: null },
  raised: { lift: "lift-1", z: null },
  floating: { lift: "lift-2", z: null },
  elevated: { lift: "lift-3", z: null },
  // 3D mode (when transformZ toggle enabled)
  "3d-near": { lift: null, z: "z-near" },
  "3d-far": { lift: null, z: "z-far" },
} as const;

export type DepthLevel = keyof typeof DepthIntent;
```

---

## Level 2: Recipe (Physics Blueprint)

Combining intents into reusable blueprints.

```typescript
// taxonomy/recipes/glass.ts
export const GlassRecipes = {
  "glass-subtle": {
    material: "glass",
    tokens: {
      bg: "rgba(255, 255, 255, 0.02)",
      border: "rgba(255, 255, 255, 0.05)",
      blur: "blur-sm",
      saturation: 150,
    },
    layers: {
      shadow: null,
      inset: null,
    },
    pseudo: null,
  },

  "glass-medium": {
    material: "glass",
    tokens: {
      bg: "rgba(255, 255, 255, 0.04)",
      border: "rgba(255, 255, 255, 0.08)",
      blur: "blur-md",
      saturation: 180,
    },
    layers: {
      shadow: "shadow-elevated",
      inset: ["highlight-top", "shadow-bottom"],
    },
    pseudo: null,
  },

  "glass-intense": {
    material: "glass",
    tokens: {
      bg: "rgba(36, 3, 54, 0.6)",
      border: "rgba(139, 92, 246, 0.25)",
      blur: "blur-lg",
      saturation: 200,
    },
    layers: {
      shadow: "shadow-deep",
      inset: ["highlight-top", "shadow-bottom"],
    },
    pseudo: null,
  },

  "glass-ultra": {
    material: "glass",
    tokens: {
      bg: "rgba(88, 28, 135, 0.4)",
      border: "rgba(167, 139, 250, 0.4)",
      blur: "blur-xl",
      saturation: 200,
    },
    layers: {
      shadow: ["shadow-glow", "shadow-deep"],
      inset: ["highlight-top", "shadow-bottom"],
    },
    pseudo: "glow-border",
  },
} as const;

export type GlassRecipe = keyof typeof GlassRecipes;
```

---

## Level 3: Context (Environment)

Global modifiers that affect all entities.

```typescript
// taxonomy/context/environment.ts
export const EnvironmentContext = {
  // Visual mode
  mode: ["light", "dark"] as const,

  // Platform detection
  platform: ["web", "desktop", "mobile"] as const,

  // Motion preference
  motion: ["full", "reduced", "none"] as const,

  // Contrast preference
  contrast: ["normal", "high"] as const,

  // FOCUS level (global attention weight)
  focus: ["low", "medium", "high", "critical"] as const,
} as const;
```

---

## Global FOCUS System

FOCUS is a global context that cascades to all children:

```svelte
<!-- App-level focus context -->
<FocusProvider level="medium">
  <App />
</FocusProvider>

<!-- Override for critical section -->
<FocusProvider level="critical">
  <AlertPanel />
</FocusProvider>
```

**Effect on Materials:**

| FOCUS Level | Blur | Shadow | Saturation | Timing |
|-------------|------|--------|------------|--------|
| `low` | 8px | subtle | 150% | slow |
| `medium` | 12px | elevated | 180% | normal |
| `high` | 20px | deep | 200% | fast |
| `critical` | 24px | glow+deep | 200% | instant |

---

## Kind Registry

Every UI entity registers as a "kind":

```typescript
// taxonomy/kinds/registry.ts
export const KindRegistry = {
  // Interactive
  button: {
    kind: "button",
    materials: ["glass", "solid"],
    defaultRecipe: "glass-medium",
    slots: [],
    minimalProps: ["intent"],
  },

  // Container
  panel: {
    kind: "panel",
    materials: ["glass", "solid", "metal"],
    defaultRecipe: "glass-medium",
    slots: ["header", "content", "footer"],
    minimalProps: ["intent"],
  },

  // Overlay
  dialog: {
    kind: "dialog",
    materials: ["glass"],
    defaultRecipe: "glass-intense",
    slots: ["overlay", "content", "header", "footer", "title", "description", "close"],
    minimalProps: ["intent"],
  },

  // ... all kinds
} as const;

export type KindId = keyof typeof KindRegistry;
```

---

## Material Registry

Materials define what visual properties are available:

```typescript
// taxonomy/materials/registry.ts
export const MaterialRegistry = {
  glass: {
    id: "glass",
    recipes: ["glass-subtle", "glass-medium", "glass-intense", "glass-ultra"],
    requiredTokens: ["blur", "saturation", "bg", "border"],
    optionalLayers: ["shadow", "inset", "pseudo"],
    supportsFocus: true,
    supports3D: true,
  },

  solid: {
    id: "solid",
    recipes: ["solid-matte", "solid-satin"],
    requiredTokens: ["bg", "border"],
    optionalLayers: ["shadow"],
    supportsFocus: true,
    supports3D: false,
  },

  metal: {
    id: "metal",
    recipes: ["metal-brushed", "metal-chrome", "metal-copper"],
    requiredTokens: ["gradient", "specular", "roughness"],
    optionalLayers: ["shadow", "reflection"],
    supportsFocus: true,
    supports3D: true,
  },
} as const;

export type MaterialId = keyof typeof MaterialRegistry;
```

---

## Zod Schema Generation

Schemas are GENERATED from taxonomy, never handwritten:

```typescript
// taxonomy/zod/generated/focus.schema.ts
// AUTO-GENERATED FROM taxonomy/context/environment.ts
import { z } from "zod";

export const FocusLevelSchema = z.enum(["low", "medium", "high", "critical"]);
export type FocusLevel = z.infer<typeof FocusLevelSchema>;
```

```typescript
// taxonomy/zod/generated/kind.schema.ts
// AUTO-GENERATED FROM taxonomy/kinds/registry.ts
import { z } from "zod";

export const KindIdSchema = z.enum([
  "button",
  "panel",
  "dialog",
  // ... all kinds
]);

export type KindId = z.infer<typeof KindIdSchema>;
```

---

## Entity Registration

When creating a component, it MUST register:

```typescript
// Registering a Panel entity
const PanelEntity = Taxonomy.register({
  // Required
  kind: "panel",              // From KindRegistry
  material: "glass",          // From MaterialRegistry
  recipe: "glass-medium",     // From material.recipes

  // Contextual (inherited if not specified)
  focus: "medium",            // Inherits from FocusProvider
  depth: "raised",            // From DepthIntent

  // Optional overrides
  layers: {
    pseudo: "glow-border",    // Add effect
  },
  motion: {
    timing: "normal",         // Animation timing
  },
});
```

**Validation happens at registration:**

```typescript
// This FAILS - "glow" is not a valid recipe for solid material
Taxonomy.register({
  kind: "panel",
  material: "solid",
  recipe: "glass-ultra",  // ERROR: glass-ultra not in solid.recipes
});
```

---

## Minimal Requirements

Every kind has minimal required props:

| Kind | Minimal Props |
|------|---------------|
| `button` | `intent` |
| `panel` | `intent` |
| `dialog` | `intent` |
| `input` | `intent`, `name` |
| `chart` | `intent`, `data` |

If minimal props are missing, registration fails with clear error.

---

## Pseudo-Element Registry

Child elements (::before, ::after) are typed:

```typescript
// taxonomy/pseudo/registry.ts
export const PseudoRegistry = {
  "glow-border": {
    element: "before",
    position: "inset: -1px",
    background: "gradient-glow-135",
    animation: "gradient-shift",
    mask: "border-only",
  },

  "shimmer": {
    element: "after",
    position: "inset: 0",
    background: "gradient-shimmer-90",
    animation: "shimmer-slide",
  },

  "progress-shine": {
    element: "after",
    position: "inset: 0",
    background: "gradient-shine-90",
    animation: "shimmer-slide",
  },
} as const;

export type PseudoId = keyof typeof PseudoRegistry;
```

---

## Shadow Stack Registry

Multi-layer shadows are typed:

```typescript
// taxonomy/layers/shadow-stack.ts
export const ShadowStackRegistry = {
  "standard-depth": {
    outer: "0 4px 16px rgba(0, 0, 0, 0.3)",
    insetTop: "inset 0 1px 1px rgba(255, 255, 255, 0.1)",
    insetBottom: "inset 0 -1px 1px rgba(0, 0, 0, 0.2)",
  },

  "glow-depth": {
    outer: "0 4px 20px rgba(127, 47, 168, 0.4)",
    ambient: "0 0 30px rgba(127, 47, 168, 0.2)",
  },

  "glow-depth-hover": {
    outer: "0 6px 30px rgba(127, 47, 168, 0.5)",
    ambient: "0 0 40px rgba(127, 47, 168, 0.3)",
  },
} as const;

export type ShadowStackId = keyof typeof ShadowStackRegistry;
```

---

## Transform Mode Toggle

2D vs 3D depth separation:

```typescript
// taxonomy/transform/mode.ts
export const TransformMode = {
  "2d": {
    property: "translateY",
    preserveFlat: true,
  },

  "3d": {
    property: "translateZ",
    preserveFlat: false,  // preserve-3d
    perspective: "150px",
  },
} as const;

export type TransformModeId = keyof typeof TransformMode;
```

---

## File Structure

```
design/
├── sys/
│   ├── api/
│   │   └── _internal/        # Bits UI adapter layer
│   └── cfg/                  # Core configs
├── taxonomy/
│   ├── tokens/
│   │   ├── blur.ts
│   │   ├── timing.ts
│   │   ├── depth.ts
│   │   └── index.ts
│   ├── intent/
│   │   ├── focus.ts
│   │   ├── depth.ts
│   │   └── index.ts
│   ├── recipes/
│   │   ├── glass.ts
│   │   ├── solid.ts
│   │   ├── metal.ts
│   │   └── index.ts
│   ├── context/
│   │   ├── environment.ts
│   │   ├── focus-provider.svelte
│   │   └── index.ts
│   ├── kinds/
│   │   ├── registry.ts
│   │   └── index.ts
│   ├── materials/
│   │   ├── registry.ts
│   │   └── index.ts
│   ├── layers/
│   │   ├── shadow-stack.ts
│   │   ├── pseudo.ts
│   │   └── index.ts
│   ├── transform/
│   │   ├── mode.ts
│   │   └── index.ts
│   └── zod/
│       ├── generated/        # AUTO-GENERATED
│       └── index.ts
└── primitives/               # Components (data-kind)
```

---

## Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| Every entity typed | KindRegistry defines all kinds |
| Every material typed | MaterialRegistry defines all materials |
| Recipes match materials | Zod validates at registration |
| FOCUS cascades | Svelte context provider |
| Schemas generated | Never handwritten, from taxonomy |
| Invalid state impossible | Zod rejects at creation time |

---

## Core Truth

**You don't pass arbitrary props. You pass typed IDs that the compiler resolves.**

```typescript
// This is what taxonomy enables:
<Panel
  kind="panel"           // Resolved to KindRegistry.panel
  material="glass"       // Resolved to MaterialRegistry.glass
  recipe="glass-medium"  // Validated against material.recipes
  focus="high"           // Inherits or overrides context
/>
```

The taxonomy IS the design system's type system.

---

**This is the canonical taxonomy system.**
