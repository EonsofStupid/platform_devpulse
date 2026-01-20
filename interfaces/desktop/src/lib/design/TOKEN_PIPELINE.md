# COLD LIGHT Token Pipeline

> **Authoritative reference for token generation, Style Dictionary v4, and DTCG compliance.**

---

## Overview

The token pipeline converts a single TypeScript SSOT (`tokens.ts`) into multiple output formats through Style Dictionary v4 with DTCG 2025.10 compliance.

```
tokens.ts (SSOT) → DTCG JSON → Style Dictionary v4 → Outputs
```

---

## Architecture Decision

### Why Style Dictionary v4 (Not Terrazzo)

| Factor | SD4 | Terrazzo |
|--------|-----|----------|
| Philosophy | TanStack-style — DIY but well-architected | Higher abstraction |
| Downloads | 693k weekly npm | Lower adoption |
| Maintainer | Amazon + Tokens Studio | Smaller team |
| Control | Full control over transforms, formats, parsers | More opinionated |
| DTCG | 2025.10 compliant | 2025.10 compliant |

**Decision: Style Dictionary v4** — Maximum control, largest ecosystem, same DTCG compliance.

---

## Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHORING LAYER                             │
│  tokens.ts (TypeScript SSOT)                                    │
│  - Human-authored                                                │
│  - Zod-validated at authoring time                              │
│  - OKLCH values, semantic names                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPORT STEP                                  │
│  tokens.ts → tokens.json (DTCG format)                          │
│  - Build-time conversion                                         │
│  - DTCG 2025.10 compliant                                       │
│  - Portable to any tool that speaks DTCG                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     STYLE DICTIONARY v4                          │
│  tokens.json → SD4 transforms → outputs                         │
│                                                                  │
│  Outputs:                                                        │
│  ├── tokens.css         (CSS custom properties)                 │
│  ├── types.ts           (TypeScript types + arrays)             │
│  ├── tailwind.preset.ts (Tailwind theme extension)              │
│  └── surfaces.gen.css   (Recipe CSS classes)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VITE PLUGIN ("coldlight")                    │
│  Orchestration + Verification                                    │
│                                                                  │
│  On dev start / file change:                                     │
│  1. Watch tokens.ts                                              │
│  2. Run export → tokens.json                                     │
│  3. Run SD4 build                                                │
│  4. Verify registries (kinds, recipes, presets)                  │
│  5. Trigger HMR / full reload                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## File Structure

```
src/lib/design/tokens/
├── tokens.ts              # SSOT — human-authored, Zod-validated
├── tokens.json            # GENERATED — DTCG format (SD4 input)
├── tokens.css             # GENERATED — CSS custom properties
├── types.ts               # GENERATED — TS types + enum arrays
├── tailwind.preset.ts     # GENERATED — Tailwind theme
├── schema.ts              # Zod schemas (hand-authored)
└── sd.config.ts           # Style Dictionary v4 config

scripts/dev/design/
├── export-dtcg.ts         # tokens.ts → tokens.json
├── sd-build.ts            # Run SD4 transforms
└── ds-tokens-build.ts     # Orchestrates export + SD4

vite-plugins/
└── coldlight.ts           # Vite plugin (watch + verify + HMR)
```

---

## tokens.ts Structure (Authoring SSOT)

```typescript
// src/lib/design/tokens/tokens.ts
import { z } from "zod";

// ===========================================
// SCHEMA DEFINITIONS (Zod strict)
// ===========================================

const OklchSchema = z.object({
  l: z.number().min(0).max(100),
  c: z.number().min(0).max(0.4),
  h: z.number().min(0).max(360),
}).strict();

const SpaceScaleSchema = z.enum(["0", "xs", "sm", "md", "lg", "xl", "2xl"]);

// ===========================================
// TOKEN DEFINITIONS
// ===========================================

export const tokens = {
  // COLORS (OKLCH channels for alpha composability)
  color: {
    surface: {
      void: { l: 6, c: 0.02, h: 195 },
      deep: { l: 8, c: 0.025, h: 200 },
      base: { l: 12, c: 0.03, h: 205 },
      raised: { l: 16, c: 0.035, h: 210 },
      overlay: { l: 20, c: 0.04, h: 215 },
    },
    content: {
      primary: { l: 95, c: 0.01, h: 210 },
      secondary: { l: 75, c: 0.02, h: 210 },
      muted: { l: 55, c: 0.02, h: 210 },
      subtle: { l: 40, c: 0.02, h: 210 },
    },
    accent: {
      teal: { l: 75, c: 0.15, h: 195 },
      cyan: { l: 80, c: 0.14, h: 210 },
      lime: { l: 85, c: 0.18, h: 127 },
    },
    status: {
      info: { l: 70, c: 0.12, h: 240 },
      success: { l: 70, c: 0.15, h: 145 },
      warn: { l: 75, c: 0.16, h: 85 },
      critical: { l: 65, c: 0.2, h: 25 },
    },
  },

  // SPACE (rem values)
  space: {
    "0": "0",
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "2rem",
    "2xl": "3rem",
  },

  // RADIUS
  radius: {
    none: "0",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    pill: "9999px",
  },

  // BLUR (backdrop-filter values)
  blur: {
    "0": "0",
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "40px",
  },

  // SHADOW (elevation stacks)
  shadow: {
    "0": "none",
    "1": "0 1px 2px oklch(0% 0 0 / 0.1)",
    "2": "0 2px 4px oklch(0% 0 0 / 0.15)",
    "3": "0 4px 8px oklch(0% 0 0 / 0.2)",
    "4": "0 8px 16px oklch(0% 0 0 / 0.25)",
    "5": "0 16px 32px oklch(0% 0 0 / 0.3)",
  },

  // MOTION
  motion: {
    duration: {
      fast: "100ms",
      normal: "200ms",
      slow: "400ms",
    },
    easing: {
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  },

  // MATERIAL: GLASS
  material: {
    glass: {
      clarity: {
        clear: { blur: "sm", noise: "0", tint: "0" },
        clean: { blur: "md", noise: "subtle", tint: "5" },
        mist: { blur: "lg", noise: "subtle", tint: "10" },
        frosted: { blur: "xl", noise: "medium", tint: "15" },
        heavyFrost: { blur: "2xl", noise: "heavy", tint: "25" },
      },
    },
  },

  // GLOW
  glow: {
    off: "none",
    soft: "0 0 8px",
    medium: "0 0 16px",
    hot: "0 0 24px",
    cyber: "0 0 32px",
  },

  // Z-INDEX
  zIndex: {
    base: "0",
    dock: "100",
    overlay: "200",
    modal: "300",
    toast: "400",
    vpb: "800",
    vpbFab: "900",
    max: "9999",
  },
} as const;

// ===========================================
// TYPE EXPORTS (derived from tokens)
// ===========================================

export type TokensConfig = typeof tokens;
export type ColorSurface = keyof typeof tokens.color.surface;
export type ColorContent = keyof typeof tokens.color.content;
export type ColorAccent = keyof typeof tokens.color.accent;
export type ColorStatus = keyof typeof tokens.color.status;
export type Space = keyof typeof tokens.space;
export type Radius = keyof typeof tokens.radius;
export type Blur = keyof typeof tokens.blur;
export type Shadow = keyof typeof tokens.shadow;
export type Glow = keyof typeof tokens.glow;
export type ZIndex = keyof typeof tokens.zIndex;
```

---

## tokens.json (DTCG Output)

```json
{
  "$schema": "https://design-tokens.org/schema/2025.10",
  "color": {
    "surface": {
      "void": {
        "$type": "color",
        "$value": "oklch(6% 0.02 195)"
      },
      "deep": {
        "$type": "color",
        "$value": "oklch(8% 0.025 200)"
      }
    }
  },
  "space": {
    "md": {
      "$type": "dimension",
      "$value": "1rem"
    }
  },
  "radius": {
    "md": {
      "$type": "dimension",
      "$value": "0.5rem"
    }
  }
}
```

---

## SD4 Configuration

```typescript
// src/lib/design/tokens/sd.config.ts
import StyleDictionary from "style-dictionary";

export default {
  source: ["src/lib/design/tokens/tokens.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "src/lib/design/tokens/",
      files: [{
        destination: "tokens.css",
        format: "css/variables",
        options: {
          outputReferences: true,
        },
      }],
    },
    ts: {
      transformGroup: "js",
      buildPath: "src/lib/design/tokens/",
      files: [{
        destination: "types.ts",
        format: "typescript/es6-declarations",
      }],
    },
    tailwind: {
      transformGroup: "js",
      buildPath: "src/lib/design/tokens/",
      files: [{
        destination: "tailwind.preset.ts",
        format: "tailwind/preset", // Custom format
      }],
    },
  },
};
```

---

## Custom SD4 Transforms (OKLCH)

```typescript
// scripts/dev/design/sd-transforms.ts
import StyleDictionary from "style-dictionary";

// Register OKLCH color transform
StyleDictionary.registerTransform({
  name: "color/oklch",
  type: "value",
  matcher: (token) => token.$type === "color",
  transformer: (token) => {
    // Convert OKLCH object to CSS string
    const { l, c, h } = token.$value;
    return `oklch(${l}% ${c} ${h})`;
  },
});

// Register Tailwind preset format
StyleDictionary.registerFormat({
  name: "tailwind/preset",
  formatter: ({ dictionary }) => {
    // Generate Tailwind theme extension
    const colors = {};
    const spacing = {};
    const borderRadius = {};

    dictionary.allTokens.forEach((token) => {
      // Map tokens to Tailwind theme structure
      // ...
    });

    return `
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 2)},
      spacing: ${JSON.stringify(spacing, null, 2)},
      borderRadius: ${JSON.stringify(borderRadius, null, 2)},
    },
  },
} satisfies Partial<Config>;
`;
  },
});
```

---

## npm Scripts

```json
{
  "scripts": {
    "ds:export": "tsx scripts/dev/design/export-dtcg.ts",
    "ds:sd:build": "style-dictionary build --config src/lib/design/tokens/sd.config.ts",
    "ds:tokens:build": "pnpm ds:export && pnpm ds:sd:build",
    "ds:tokens:watch": "nodemon --watch src/lib/design/tokens/tokens.ts --exec 'pnpm ds:tokens:build'"
  }
}
```

---

## OKLCH + DTCG Portability

### Internal: OKLCH is Primary

OKLCH provides:
- Perceptual uniformity
- Better color ramps
- Alpha composability via channel separation

### For DTCG Portability

- DTCG canonical output: sRGB components (portable to any ecosystem)
- Preserve OKLCH in `$extensions.coldlight.oklch`
- SD4 transforms convert OKLCH → sRGB at build time

This gives you:
- OKLCH SSOT authoring
- Portable exports
- No compromises

---

## Token Value Format (OKLCH Channels)

Store raw OKLCH channels for maximum composability:

```typescript
// In tokens.ts — store channels separately for alpha manipulation
export const tokens = {
  glass: {
    void: { l: 0.06, c: 0.02, h: 195 },      // Channels only
    deep: { l: 0.08, c: 0.025, h: 200 },
  },
  // Generator produces:
  // --dp-glass-void: oklch(6% 0.02 195);
  // --dp-glass-void-rgb: 6% 0.02 195;  // For alpha variants
} as const;

// Usage in CSS: oklch(var(--dp-glass-void-rgb) / 0.8)
```

This enables runtime alpha manipulation without regenerating tokens.

---

## Industry Token Categories (Full Coverage)

### Core Foundations

**Color:**
- `color.surface.*` (background materials)
- `color.content.*` (text/icons)
- `color.border.*`
- `color.accent.*`
- `color.status.*` (info/success/warn/critical)
- `color.dataViz.*` (chart series, gridlines)

**Dimension / Layout scales:**
- `space.*` (padding/margin/gap)
- `size.*` (control sizes)
- `radius.*`
- `borderWidth.*`
- `zIndex.*`
- `breakpoint.*` (if responsive tiers matter)

**Typography:**
- `font.family.*`
- `font.weight.*`
- `text.size.*`
- `text.lineHeight.*`
- `text.tracking.*`

**Motion:**
- `motion.duration.*`
- `motion.easing.*`
- `motion.transition.*`
- `motion.animation.*` (preset animation packs)

**Shadow / Elevation:**
- `shadow.*` (depth stacks)
- `elevation.*` (semantic levels)

**Opacity:**
- `opacity.*` (not "transparency")

### ColdLight Material System

**Material: glass:**
- `material.glass.clarity.*` (how sharp the background is)
- `material.glass.transmittance.*` (alpha scale / see-through strength)
- `material.glass.blur.*` (backdrop blur strength)
- `material.glass.tint.*` (subtle color cast)
- `material.glass.noise.*` (grain / frosted scatter illusion)

**Material: metal / chrome:**
- `material.metal.specular.*`
- `material.metal.roughness.*`
- `material.metal.highlight.*` (edge shine / rim light bias)

**Glow / Emissive:**
- `glow.intensity.*`
- `glow.spread.*`
- `glow.color.*` (still token-backed)

**FX overlays:**
- `fx.scanline.*`
- `fx.sparkle.*`
- `fx.twinkle.*`
- `fx.noiseOverlay.*`
- `fx.rimLight.*`
- `fx.vignette.*`

### Component-System Tokens

```
focus.*        # ring/glow presets
hitArea.*      # touch target sizes
scrollbar.*    # custom scrollbar styles
overlay.*      # modals/toasts/blur plates
```

---

## Generated Outputs

| Output | Purpose | Usage |
|--------|---------|-------|
| `tokens.css` | CSS custom properties | Root-scoped vars |
| `types.ts` | TypeScript types + arrays | Type safety in components |
| `tailwind.preset.ts` | Tailwind theme extension | JIT class generation |
| `surfaces.gen.css` | Recipe CSS with data-* selectors | Component styling |

---

## Core Truths

| Truth | Enforcement |
|-------|-------------|
| Tokens store VALUES | Generator is only source |
| tokens.ts is SSOT | Never edit generated files |
| OKLCH is primary | SD4 transforms for portability |
| DTCG for export | Industry-standard interchange |

---

**This is the canonical token pipeline.**
