# COLD LIGHT Contract System

> **Authoritative reference for prop contracts, kind schemas, and validation architecture.**

---

## Overview

The Contract System enforces type safety and schema validation across the entire design system. It ensures:

1. **Every block kind has a defined schema**
2. **Props are validated at every boundary**
3. **Surface props are only allowed on surface-capable kinds**
4. **VPB cannot create invalid nodes**

---

## Contract Architecture (Three Tiers)

| Tier | Scope | What It Contains |
|------|-------|------------------|
| **DsCoreProps** | Universal — safe on EVERY block kind | intent, state, density, visibility, interaction, a11y |
| **DsSurfaceProps** | Surface-capable kinds ONLY | glass/metal/holo, tint/clarity/noise, bevel/depth, frame/ring |
| **Kind-Specific** | Only where they belong | Shell (layout), Input (validation), Chart (data density) |

---

## DsCoreProps (Universal Contract)

These props are safe on **every** block kind. They support accessibility, state, density, and deterministic behavior.

```typescript
// design/taxonomy/props/core.props.ts
export type DsIntent = "neutral" | "info" | "success" | "warning" | "danger";
export type DsTone = "app" | "chat" | "maestro";
export type DsState =
  | "default"
  | "hover"
  | "active"
  | "focus"
  | "disabled"
  | "loading"
  | "readonly";
export type DsDensity = "comfortable" | "compact" | "dense";

export interface DsCoreProps {
  intent: DsIntent;
  tone: DsTone;
  state: DsState;
  density: DsDensity;

  importance?: "standard" | "elevated" | "critical";
  visibility?: "visible" | "hidden" | "collapsed";

  interaction?: {
    cursor?:
      | "default"
      | "pointer"
      | "text"
      | "grab"
      | "grabbing"
      | "wait"
      | "notAllowed"
      | "crosshair";
    pointerEvents?: "auto" | "none";
    userSelect?: "auto" | "none" | "text" | "all";
  };

  a11y?: {
    ariaLabel?: string;
    role?:
      | "region"
      | "button"
      | "dialog"
      | "status"
      | "navigation"
      | "article";
    tabIndex?: -1 | 0;
  };
}
```

**Why this is correct:** These props exist everywhere without allowing "CSS injection" or breaking layout semantics.

---

## DsSurfaceProps (Material Contract)

Surface props are for **container/material kinds only**. They do NOT apply to text-only or leaf elements.

```typescript
// design/taxonomy/props/surface.props.ts
export type MaterialFamily =
  | "solid"
  | "glass"
  | "acrylic"
  | "metal"
  | "holo"
  | "liquid"
  | "void";

export type Clarity = "clear" | "clean" | "mist" | "frosted" | "heavyFrost";
export type TintMode = "none" | "mono" | "duo" | "iridescent";
export type NoiseLevel = "off" | "subtle" | "medium" | "heavy";
export type SmudgeLevel = "off" | "subtle" | "film";
export type VignetteLevel = "off" | "subtle" | "strong";

export type BlurStep = "0" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type Radius = "none" | "sm" | "md" | "lg" | "xl" | "pill";
export type BorderWidth = "none" | "hairline" | "thin" | "normal" | "thick";
export type BorderStyle = "solid" | "dashed" | "dotted";
export type BorderTone = "subtle" | "normal" | "strong";

export type BevelLevel = "none" | "sm" | "md" | "lg" | "xl";
export type BevelStyle = "inset" | "outset" | "hybrid";
export type EdgeGlow = "off" | "soft" | "medium" | "hot";

export type Elevation = "0" | "1" | "2" | "3" | "4" | "5";
export type ShadowStyle = "none" | "soft" | "crisp" | "cinematic" | "neon";
export type InnerShadow = "off" | "subtle" | "strong";
export type AmbientOcclusion = "off" | "subtle" | "strong";

export type GlowLevel = "off" | "subtle" | "medium" | "strong" | "nuclear";
export type Sparkle = "off" | "rare" | "normal" | "heavy";
export type Scanlines = "off" | "subtle" | "retro" | "heavy";
export type PulseMode = "off" | "idle" | "hover" | "alert";
export type Specular = "off" | "soft" | "sharp";

// Quantized slider (0..100 but only specific steps)
export type Q100 = 0 | 15 | 30 | 45 | 60 | 75 | 90 | 100;

export interface DsSurfaceProps {
  materialFamily?: MaterialFamily;
  clarity?: Clarity;

  tintMode?: TintMode;
  tintStrength?: Q100;

  noise?: NoiseLevel;
  smudge?: SmudgeLevel;
  vignette?: VignetteLevel;

  // Material knobs (NOT "transparency")
  transmittance?: Q100;      // background show-through strength
  diffusionStrength?: Q100;  // milkiness / scatter
  backdropBlur?: BlurStep;   // discrete blur radius step

  radius?: Radius;
  borderWidth?: BorderWidth;
  borderStyle?: BorderStyle;
  borderTone?: BorderTone;

  bevelLevel?: BevelLevel;
  bevelStyle?: BevelStyle;
  edgeGlow?: EdgeGlow;

  elevation?: Elevation;
  shadowStyle?: ShadowStyle;
  innerShadow?: InnerShadow;
  ambientOcclusion?: AmbientOcclusion;

  // ColdLight "alive" layer
  rimLight?: GlowLevel;
  innerGlow?: GlowLevel;
  outerGlow?: GlowLevel;
  sparkle?: Sparkle;
  scanlines?: Scanlines;
  pulse?: PulseMode;
  specularHighlight?: Specular;
}
```

---

## Terminology Corrections (Industry 2026)

| Term | What It Is | CSS Driver |
|------|------------|------------|
| **opacity** | Layer alpha — how much the element itself fades | `opacity: 0..1` or color alpha |
| **transmittance** | How much of the background makes it through the material | Material knob (NOT generic style) |
| **diffusion** | How scattered/smeared the background becomes | `backdrop-filter: blur()` + noise overlay |

**BANNED: "transparency"** — It's a perceived result, not a controllable primitive.

**Frost is a MATERIAL PRESET, not a single slider:**
- Low clarity + high diffusion + moderate blur + subtle noise + reduced transmittance

---

## Zod Schemas (Strict, Composable)

### Core Schema

```typescript
// design/taxonomy/zod/core.schema.ts
import { z } from "zod";

export const zDsCoreProps = z.object({
  intent: z.enum(["neutral", "info", "success", "warning", "danger"]),
  tone: z.enum(["app", "chat", "maestro"]),
  state: z.enum(["default","hover","active","focus","disabled","loading","readonly"]),
  density: z.enum(["comfortable","compact","dense"]),

  importance: z.enum(["standard","elevated","critical"]).optional(),
  visibility: z.enum(["visible","hidden","collapsed"]).optional(),

  interaction: z.object({
    cursor: z.enum([
      "default","pointer","text","grab","grabbing","wait","notAllowed","crosshair"
    ]).optional(),
    pointerEvents: z.enum(["auto","none"]).optional(),
    userSelect: z.enum(["auto","none","text","all"]).optional(),
  }).strict().optional(),

  a11y: z.object({
    ariaLabel: z.string().optional(),
    role: z.enum(["region","button","dialog","status","navigation","article"]).optional(),
    tabIndex: z.union([z.literal(-1), z.literal(0)]).optional(),
  }).strict().optional(),
}).strict();
```

### Surface Schema

```typescript
// design/taxonomy/zod/surface.schema.ts
import { z } from "zod";

const zQ100 = z.union([
  z.literal(0), z.literal(15), z.literal(30), z.literal(45),
  z.literal(60), z.literal(75), z.literal(90), z.literal(100),
]);

export const zDsSurfaceProps = z.object({
  materialFamily: z.enum(["solid","glass","acrylic","metal","holo","liquid","void"]).optional(),

  clarity: z.enum(["clear","clean","mist","frosted","heavyFrost"]).optional(),

  tintMode: z.enum(["none","mono","duo","iridescent"]).optional(),
  tintStrength: zQ100.optional(),

  noise: z.enum(["off","subtle","medium","heavy"]).optional(),
  smudge: z.enum(["off","subtle","film"]).optional(),
  vignette: z.enum(["off","subtle","strong"]).optional(),

  transmittance: zQ100.optional(),
  diffusionStrength: zQ100.optional(),
  backdropBlur: z.enum(["0","xs","sm","md","lg","xl","2xl"]).optional(),

  radius: z.enum(["none","sm","md","lg","xl","pill"]).optional(),
  borderWidth: z.enum(["none","hairline","thin","normal","thick"]).optional(),
  borderStyle: z.enum(["solid","dashed","dotted"]).optional(),
  borderTone: z.enum(["subtle","normal","strong"]).optional(),

  bevelLevel: z.enum(["none","sm","md","lg","xl"]).optional(),
  bevelStyle: z.enum(["inset","outset","hybrid"]).optional(),
  edgeGlow: z.enum(["off","soft","medium","hot"]).optional(),

  elevation: z.enum(["0","1","2","3","4","5"]).optional(),
  shadowStyle: z.enum(["none","soft","crisp","cinematic","neon"]).optional(),
  innerShadow: z.enum(["off","subtle","strong"]).optional(),
  ambientOcclusion: z.enum(["off","subtle","strong"]).optional(),

  rimLight: z.enum(["off","subtle","medium","strong","nuclear"]).optional(),
  innerGlow: z.enum(["off","subtle","medium","strong","nuclear"]).optional(),
  outerGlow: z.enum(["off","subtle","medium","strong","nuclear"]).optional(),
  sparkle: z.enum(["off","rare","normal","heavy"]).optional(),
  scanlines: z.enum(["off","subtle","retro","heavy"]).optional(),
  pulse: z.enum(["off","idle","hover","alert"]).optional(),
  specularHighlight: z.enum(["off","soft","sharp"]).optional(),
}).strict();
```

---

## Kind Schema Composition

### Surface-Capable Kind (Panel)

```typescript
// design/taxonomy/kinds/panel.kind.ts
import { z } from "zod";
import { zDsCoreProps } from "../zod/core.schema";
import { zDsSurfaceProps } from "../zod/surface.schema";

export const zPanelProps = z.object({
  core: zDsCoreProps,
  surface: zDsSurfaceProps.optional(),  // allowed but not forced
  layout: z.object({
    overflowX: z.enum(["visible","hidden","clip","scroll","auto"]).optional(),
    overflowY: z.enum(["visible","hidden","clip","scroll","auto"]).optional(),
  }).strict().optional(),
}).strict();
```

### Leaf Kind (Label) — No Surface

```typescript
// design/taxonomy/kinds/label.kind.ts
import { z } from "zod";
import { zDsCoreProps } from "../zod/core.schema";

export const zLabelProps = z.object({
  core: zDsCoreProps,
  text: z.object({
    size: z.enum(["xs","sm","md","lg","xl","2xl","3xl"]),
    tone: z.enum(["primary","secondary","muted","subtle","inverse"]),
  }).strict(),
}).strict(); // surface is NOT legal here
```

---

## Kind Registry with SurfacePolicy

```typescript
// design/taxonomy/kinds/kind.registry.ts
export type SurfacePolicy = "none" | "optional" | "required";

export interface KindRegistryEntry {
  kind: string;
  label: string;
  surfacePolicy: SurfacePolicy;
  schema: unknown; // Zod schema
  allowedRecipes: string[];
  slots: string[];
}

export const KindRegistry = {
  panel: {
    kind: "panel",
    label: "Panel",
    surfacePolicy: "optional",   // allowed but not forced
    schema: zPanelProps,
    allowedRecipes: ["panel.glass","panel.metal","panel.solid"],
    slots: ["header","content","footer"],
  },
  label: {
    kind: "label",
    label: "Label",
    surfacePolicy: "none",       // VPB hides surface category entirely
    schema: zLabelProps,
    allowedRecipes: ["text.label"],
    slots: [],
  },
  // ... other kinds
} as const;
```

---

## Surface-Capable vs Non-Surface Kinds

### Surface-Capable Kinds
- shell, container, panel, card, modal, widget, toast, chatBubble, chart, graph, dock

### Non-Surface Kinds (Leaf Nodes)
- icon, label, badge, text, svg-only elements

---

## VPB Behavior by SurfacePolicy

| SurfacePolicy | VPB Behavior |
|---------------|--------------|
| `"none"` | Surface UI is hidden entirely |
| `"optional"` | Surface shown only in Advanced mode (or toggleable) |
| `"required"` | Force at least `materialFamily` default |

This is the junior/advanced split in the inspector UI.

---

## Validation at Boundaries

### VPB Creates Only Legal Nodes

When user adds a block:
1. VPB reads `KindRegistry[kind]`
2. Offers only legal recipes
3. Generates props from defaults/presets
4. Validates props with Zod schema
5. If invalid → VPB refuses to create the node

### Renderer Also Validates (Defense in Depth)

Renderers are a runtime boundary. DB gives you JSON. So renderers must validate and fail safe.

```typescript
// When loading BlockNode trees from DB, ALWAYS validate:
async function loadLayoutTree(layoutVersionId: string): Promise<BlockNode[]> {
  const { tree_json } = await db.ds_block_tree.findUnique({ layout_version_id: layoutVersionId });

  const validated = BlockNodeArraySchema.safeParse(tree_json);
  if (!validated.success) {
    console.error('Invalid block tree from DB:', validated.errors);
    throw new BlockTreeValidationError(validated.errors);
  }

  return validated.data;
}
```

---

## Kind-Specific Contracts

### Shell Kinds (appShell, topBar, sideNav, dock, statusBar)

```typescript
interface ShellLayoutProps {
  layout: {
    mode: "grid"; // hard constraint
    template: "shell" | "shell-nav" | "shell-nav-aside";
    safeArea: "on" | "off";
    insetGrid: "on" | "off";
  };
}
```

### Input Kinds (inputFrame, searchBox)

```typescript
interface InputProps {
  input: {
    size: "sm" | "md" | "lg";
    placeholderTone: "quiet" | "normal";
    validation: "none" | "valid" | "invalid";
  };
}
```

### Data Viz Kinds (chart, graphNetwork, timeline)

```typescript
interface ChartProps {
  chart: {
    type: "line" | "bar" | "area" | "scatter" | "heatmap";
    density: "low" | "med" | "high";
    gridlines: "off" | "soft" | "full";
    tooltip: "off" | "hover" | "pinned";
  };
}
```

---

## Non-Negotiable Rules

1. **Zod `.strict()` on ALL schemas** — No passthrough, no unknown keys
2. **Surface props only on surface-capable kinds** — Enforced by SurfacePolicy
3. **VPB cannot create invalid nodes** — Validation happens before creation
4. **Renderers validate at runtime** — Defense in depth for DB data
5. **No "optional garbage"** — Every prop has a defined type or is explicitly optional

---

## File Organization

```
src/lib/design/taxonomy/
├── props/
│   ├── core.props.ts       # DsCoreProps interface + types
│   └── surface.props.ts    # DsSurfaceProps interface + types
├── zod/
│   ├── core.schema.ts      # zDsCoreProps Zod schema
│   └── surface.schema.ts   # zDsSurfaceProps Zod schema
└── kinds/
    ├── kind.registry.ts    # KindRegistry with SurfacePolicy
    ├── panel.kind.ts       # Surface-capable kind
    └── label.kind.ts       # Leaf kind (no surface)
```

---

## Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| One DsSurfaceProps SSOT | Universal interface, single definition |
| Allowed only on specific kinds | `surfacePolicy` in KindRegistry |
| Optional even when allowed | `surface: zDsSurfaceProps.optional()` |
| Strict Zod boundaries stop garbage | `.strict()` on all schemas |
| Presets + safe knobs for junior UX | `ui.tier` + `ui.safeKnobs` |
| Recipes assemble visuals | `classes()` function pattern |
| Renderers stay dumb | Only apply recipe output, no styling |

---

**This is the canonical contract system.**
