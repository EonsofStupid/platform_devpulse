# COLD LIGHT Design System — Authoring Guide

> **ZERO AMBIGUITY.** This document contains everything needed to author new kinds, recipes, and actions without guessing.
> If something is missing from this guide, the guide is broken — not you.

---

## Table of Contents

1. [Complete Prop Reference](#1-complete-prop-reference)
2. [Token → CSS → Tailwind Mapping](#2-token--css--tailwind-mapping)
3. [Kind Authoring](#3-kind-authoring)
4. [Recipe Authoring](#4-recipe-authoring)
5. [Action Authoring](#5-action-authoring)
6. [Registration Checklist](#6-registration-checklist)
7. [Validation Rules](#7-validation-rules)

---

## 1. Complete Prop Reference

### 1.1 Data Attribute Props (CSS-Driven)

These props are set as `data-*` attributes on DOM elements. CSS selectors match and apply styles.

| Prop | Type | Valid Values | Default | CSS Generated | Token Source |
|------|------|--------------|---------|---------------|--------------|
| `data-surface` | `SurfaceToken` | `glass`, `solid`, `matte` | `solid` | Background, border, blur | `surfaceTokens` |
| `data-variant` | `GlassVariantToken` | `void`, `deep`, `smoke`, `frost` | `deep` | Glass opacity, tint | `glassVariantTokens` |
| `data-role` | `RoleToken` | `button`, `input`, `panel`, `card`, `scrim` | — | Component-specific rules | Manual |
| `data-tint` | `TintToken` | `teal`, `purple`, `gold`, `coral` | — | Accent gradient overlay | `glassTint` |
| `data-glow` | `GlowToken` | `off`, `teal`, `purple`, `magenta`, `ember`, `frost` | `off` | Box-shadow glow | `glowComposed` |
| `data-bevel` | `BevelToken` | `off`, `subtle`, `soft`, `medium` | `off` | Inset/outset shadow | `bevelKeys` |
| `data-size` | `SizeToken` | `sm`, `md`, `lg` | `md` | Padding, font-size, gaps | `sizeTokens` |
| `data-depth` | `DepthToken` | `0`, `1`, `2`, `3`, `4` | `0` | Elevation shadow | `depthKeys` |
| `data-accent` | `AccentToken` | `teal`, `purple`, `magenta`, `ember`, `frost` | `teal` | Border/text accent color | `accentTokens` |
| `data-state` | `StateToken` | `open`, `closed`, `disabled`, `loading` | — | State-specific styles | Manual |

### 1.2 Effect Props (Action-Driven)

| Prop | Type | Valid Values | Default | Action Required | Keyframe |
|------|------|--------------|---------|-----------------|----------|
| `data-effect` | `EffectToken` | `none`, `glitch-pulse`, `cyber-glow`, `ripple`, `shimmer`, `breathe` | `none` | Varies | Varies |
| `data-trigger` | `TriggerToken` | `hover`, `click`, `sporadic`, `always` | — | Varies | — |
| `data-intensity` | `IntensityToken` | `subtle`, `medium`, `strong` | `medium` | — | — |

**Effect → Action → Keyframe Mapping:**

| Effect | Action | Keyframe | Trigger |
|--------|--------|----------|---------|
| `glitch-pulse` | `sporadicPulse` | `dp-glitch-pulse` | `sporadic` |
| `cyber-glow` | `glowTrack` | — | `hover` |
| `ripple` | `ripple` | `dp-ripple` | `click` |
| `shimmer` | — | `dp-shimmer` | `always` |
| `breathe` | — | `dp-breathe` | `always` |

### 1.3 Motion Props (DsSurfaceProps.motion)

| Prop | Type | Valid Values | Default | CSS Generated |
|------|------|--------------|---------|---------------|
| `motion.idle` | `IdleMotion` | `none`, `breathe`, `pulse`, `scan` | `none` | Animation on idle |
| `motion.hover` | `HoverMotion` | `none`, `glow`, `lift`, `highlight` | `none` | Transform/shadow on hover |
| `motion.press` | `PressMotion` | `none`, `sink`, `flash` | `none` | Transform on active |
| `motion.focus` | `FocusMotion` | `none`, `ring`, `glow` | `none` | Outline/shadow on focus |

### 1.4 Frame Props (DsSurfaceProps.frame)

| Prop | Type | Valid Values | Default |
|------|------|--------------|---------|
| `frame.mode` | `FrameMode` | `none`, `solid`, `glow`, `gradient` | `none` |
| `frame.width` | `FrameWidth` | `thin`, `medium`, `thick` | `thin` |
| `frame.treatment` | `FrameTreatment` | `flat`, `beveled`, `rounded` | `flat` |
| `frame.glow` | `GlowToken` | `off`, `teal`, `purple`, `magenta`, `ember`, `frost` | `off` |

### 1.5 Depth Props (DsSurfaceProps.depth)

| Prop | Type | Valid Values | Default |
|------|------|--------------|---------|
| `depth.intent` | `DepthIntent` | `flat`, `raised`, `sunken`, `floating` | `flat` |
| `depth.bevel.level` | `BevelToken` | `off`, `subtle`, `soft`, `medium` | `off` |
| `depth.bevel.style` | `BevelStyle` | `outset`, `inset`, `imprint` | `outset` |

### 1.6 Color Props (DsSurfaceProps.color)

| Prop | Type | Valid Values | Default |
|------|------|--------------|---------|
| `color.mode` | `ColorMode` | `mono`, `duo` | `mono` |
| `color.a` | `AccentToken` | `teal`, `purple`, `magenta`, `ember`, `frost` | `teal` |
| `color.b` | `AccentToken` | `teal`, `purple`, `magenta`, `ember`, `frost` | — |
| `color.blend.type` | `BlendType` | `none`, `dissipate` | `none` |
| `color.blend.direction` | `BlendDirection` | `top`, `bottom`, `left`, `right`, `radial` | `bottom` |
| `color.blend.softness` | `BlendSoftness` | `sharp`, `soft`, `diffuse` | `soft` |
| `color.blend.bias` | `BlendBias` | `start`, `center`, `end` | `center` |
| `color.blend.strength` | `BlendStrength` | `subtle`, `medium`, `strong` | `medium` |

### 1.7 FX Props (DsSurfaceProps.fx)

| Prop | Type | Valid Values | Default |
|------|------|--------------|---------|
| `fx.rimLight` | `RimLight` | `off`, `subtle`, `medium`, `strong` | `off` |
| `fx.innerGlow` | `Strength` | `off`, `subtle`, `medium`, `strong` | `off` |
| `fx.sparkle` | `Sparkle` | `off`, `subtle`, `medium` | `off` |
| `fx.noiseOverlay` | `NoiseOverlay` | `off`, `subtle`, `medium` | `off` |

---

## 2. Token → CSS → Tailwind Mapping

### 2.1 Glass Surfaces

| Token Key | CSS Variable | Tailwind Class | OKLCH Value |
|-----------|--------------|----------------|-------------|
| `glass.void` | `--glass-void` | `bg-glass-void` | `oklch(6% 0.02 195 / 0.92)` |
| `glass.deep` | `--glass-deep` | `bg-glass-deep` | `oklch(10% 0.04 195 / 0.88)` |
| `glass.smoke` | `--glass-smoke` | `bg-glass-smoke` | `oklch(15% 0.03 200 / 0.82)` |
| `glass.frost` | `--glass-frost` | `bg-glass-frost` | `oklch(25% 0.02 210 / 0.75)` |

### 2.2 Matte Surfaces

| Token Key | CSS Variable | Tailwind Class | OKLCH Value |
|-----------|--------------|----------------|-------------|
| `matte.dark` | `--matte-dark` | `bg-matte-dark` | `oklch(8% 0.04 200)` |
| `matte.mid` | `--matte-mid` | `bg-matte-mid` | `oklch(12% 0.05 200)` |
| `matte.light` | `--matte-light` | `bg-matte-light` | `oklch(18% 0.06 200)` |

### 2.3 Color Scales (per accent)

Example for `teal`:

| Step | CSS Variable | Tailwind Class | OKLCH Value |
|------|--------------|----------------|-------------|
| 100 | `--color-teal-100` | `text-color-teal-100` | `oklch(95% 0.05 195)` |
| 300 | `--color-teal-300` | `text-color-teal-300` | `oklch(75% 0.12 195)` |
| 500 | `--color-teal-500` | `text-color-teal-500` | `oklch(55% 0.18 195)` |
| 700 | `--color-teal-700` | `text-color-teal-700` | `oklch(35% 0.12 195)` |
| 900 | `--color-teal-900` | `text-color-teal-900` | `oklch(15% 0.05 195)` |

### 2.4 Glow Shadows

| Token Key | CSS Variable | Tailwind Class | Box-Shadow |
|-----------|--------------|----------------|------------|
| `glow.teal` | `--glow-teal` | `shadow-glow-teal` | Inner + outer teal glow |
| `glow.purple` | `--glow-purple` | `shadow-glow-purple` | Inner + outer purple glow |
| `glow.magenta` | `--glow-magenta` | `shadow-glow-magenta` | Inner + outer magenta glow |
| `glow.ember` | `--glow-ember` | `shadow-glow-ember` | Inner + outer ember glow |
| `glow.frost` | `--glow-frost` | `shadow-glow-frost` | Inner + outer frost glow |

### 2.5 Spacing

| Token Key | CSS Variable | Tailwind Class | Value |
|-----------|--------------|----------------|-------|
| `spacing.1` | `--space-1` | `p-1`, `m-1`, `gap-1` | `clamp(2px, 0.25rem, 4px)` |
| `spacing.2` | `--space-2` | `p-2`, `m-2`, `gap-2` | `clamp(4px, 0.5rem, 8px)` |
| `spacing.3` | `--space-3` | `p-3`, `m-3`, `gap-3` | `clamp(8px, 0.75rem, 12px)` |
| `spacing.4` | `--space-4` | `p-4`, `m-4`, `gap-4` | `clamp(12px, 1rem, 16px)` |
| `spacing.5` | `--space-5` | `p-5`, `m-5`, `gap-5` | `clamp(16px, 1.25rem, 20px)` |
| `spacing.6` | `--space-6` | `p-6`, `m-6`, `gap-6` | `clamp(20px, 1.5rem, 24px)` |
| `spacing.8` | `--space-8` | `p-8`, `m-8`, `gap-8` | `clamp(28px, 2rem, 32px)` |

### 2.6 Radius

| Token Key | CSS Variable | Tailwind Class | Value |
|-----------|--------------|----------------|-------|
| `radius.none` | `--radius-none` | `rounded-none` | `0` |
| `radius.sm` | `--radius-sm` | `rounded-sm` | `clamp(4px, 0.5rem, 6px)` |
| `radius.md` | `--radius-md` | `rounded-md` | `clamp(6px, 0.75rem, 10px)` |
| `radius.lg` | `--radius-lg` | `rounded-lg` | `clamp(10px, 1rem, 14px)` |
| `radius.xl` | `--radius-xl` | `rounded-xl` | `clamp(14px, 1.25rem, 20px)` |
| `radius.full` | `--radius-full` | `rounded-full` | `9999px` |

### 2.7 Z-Index

| Token Key | CSS Variable | Tailwind Class | Value |
|-----------|--------------|----------------|-------|
| `zIndex.base` | `--z-base` | `z-base` | `0` |
| `zIndex.dropdown` | `--z-dropdown` | `z-dropdown` | `100` |
| `zIndex.sticky` | `--z-sticky` | `z-sticky` | `200` |
| `zIndex.modal` | `--z-modal` | `z-modal` | `300` |
| `zIndex.popover` | `--z-popover` | `z-popover` | `400` |
| `zIndex.tooltip` | `--z-tooltip` | `z-tooltip` | `500` |
| `zIndex.toast` | `--z-toast` | `z-toast` | `600` |
| `zIndex.overlay` | `--z-overlay` | `z-overlay` | `700` |
| `zIndex.vpb` | `--z-vpb` | `z-vpb` | `800` |
| `zIndex.vpbFab` | `--z-vpb-fab` | `z-vpb-fab` | `900` |

---

## 3. Kind Authoring

### 3.1 What is a Kind?

A **Kind** is a block type that VPB can instantiate. Every kind has:
- A name (e.g., `panel`, `chatDock`, `widget`)
- Allowed slots (where children can go)
- A layout mode constraint
- A recipe prefix (which recipes can style it)
- Optionally, allowed children per slot

### 3.2 BlockKindDefinition Interface

```typescript
interface BlockKindDefinition {
  /** Human-readable description */
  description: string;

  /** Layout mode constraint */
  layoutMode: "grid" | "flex" | "none";

  /** Recipe prefix for this kind (e.g., "panel" matches "panel.glass.default") */
  recipePrefix: string;

  /** Slot names where children can be placed */
  slots: readonly string[];

  /** Optional: restrict which kinds can go in each slot */
  allowedChildren?: Partial<Record<string, readonly string[]>>;
}
```

### 3.3 Kind Template (Copy-Paste)

```typescript
// Add to: packages/coldlight/taxonomy/kinds.ts

export const myNewKind = {
  myKindName: {
    description: "One sentence describing what this kind is for",
    layoutMode: "none" as const,  // "grid" | "flex" | "none"
    recipePrefix: "mykind",        // Recipes: "mykind.glass.default"
    slots: ["header", "body", "footer"],  // Available slots
    // Optional: restrict children
    // allowedChildren: {
    //   header: ["button", "icon"],
    //   body: ["panel", "widget"],
    // },
  },
} as const;

// Then add to blockKinds:
export const blockKinds = {
  ...shellKinds,
  ...surfaceKinds,
  ...widgetKinds,
  ...chatKinds,
  ...myNewKind,  // ADD HERE
} as const;
```

### 3.4 Contract Template (Copy-Paste)

```typescript
// Add to: packages/coldlight/taxonomy/contracts.ts

/**
 * MyKindName props.
 */
export const MyKindNamePropsSchema = DsSurfacePropsSchema.extend({
  myKindName: z.object({
    // Kind-specific props go here
    mode: z.enum(["compact", "full"]).default("full"),
    showHeader: z.boolean().default(true),
  }).default({}),
});

export type MyKindNameProps = z.infer<typeof MyKindNamePropsSchema>;

// Then add to kindContracts:
export const kindContracts = {
  // ... existing kinds
  myKindName: MyKindNamePropsSchema,  // ADD HERE
} as const;
```

### 3.5 Layout Mode Rules

| Mode | When to Use | CSS Pattern |
|------|-------------|-------------|
| `grid` | Shell layouts, dashboards, any 2D arrangement | `display: grid; grid-template-*` |
| `flex` | Inline content only (button row, icon + text) | `display: flex; flex-direction: row` |
| `none` | Leaf nodes, content containers | No layout constraint |

**RULE:** If a kind contains multiple child blocks arranged spatially, it MUST be `grid`.

---

## 4. Recipe Authoring

### 4.1 What is a Recipe?

A **Recipe** maps a (kind + variant) combination to Tailwind classes per slot.
Recipes are **composable** — they have defaults that VPB can override.

### 4.2 RecipeDefinition Interface

```typescript
interface RecipeDefinition {
  /** Unique recipe ID: "{kind}.{surface}.{variant}" */
  id: string;

  /** Block kind this recipe applies to */
  kind: BlockKind;

  /** Human description */
  description: string;

  /** Tailwind classes per slot */
  classes: Record<string, string>;

  /** Actions this recipe requires (auto-attached by renderer) */
  requires?: ActionId[];
}
```

### 4.3 Recipe ID Naming Convention

```
{kind}.{surface}.{variant}

Examples:
- panel.glass.default
- panel.glass.glow
- panel.solid.default
- button.glass.primary
- card.matte.compact
- widget.glass.chart
```

### 4.4 Recipe Template (Copy-Paste)

```typescript
// Add to: packages/coldlight/recipes/index.ts

"myKind.glass.default": {
  id: "myKind.glass.default",
  kind: "myKindName",  // Must match a registered kind
  description: "Glass variant for myKind with standard styling",
  classes: {
    // Slot name → Tailwind classes
    root: "bg-glass-deep backdrop-blur-md rounded-md border border-white/10",
    header: "px-4 py-2 border-b border-white/5",
    body: "px-4 py-3",
    footer: "px-4 py-2 border-t border-white/5",
  },
  // Optional: if this recipe needs JS effects
  // requires: ["glowTrack", "ripple"],
},
```

### 4.5 Class Composition Rules

**ALLOWED:**
```typescript
// Token-backed Tailwind classes
"bg-glass-deep"              // Glass background
"backdrop-blur-md"           // Blur
"rounded-md"                 // Token radius
"border border-white/10"     // Border with opacity
"px-4 py-2"                  // Token spacing
"shadow-glow-teal"           // Token glow
"text-text-primary"          // Token text color
```

**FORBIDDEN:**
```typescript
// ❌ Arbitrary values
"bg-[#00ff00]"               // Raw hex
"text-[oklch(50% 0.2 200)]"  // Raw oklch
"p-[13px]"                   // Raw px
"shadow-[0_0_20px_teal]"     // Raw shadow

// ❌ Non-token classes
"bg-red-500"                 // Tailwind default (not token-backed)
"text-blue-700"              // Tailwind default (not token-backed)
```

### 4.6 Slot Classes Pattern

```typescript
classes: {
  root: "...",    // Container element
  header: "...",  // Optional header slot
  body: "...",    // Main content slot
  footer: "...",  // Optional footer slot
  icon: "...",    // Icon element
  label: "...",   // Text label element
}
```

---

## 5. Action Authoring

### 5.1 What is an Action?

An **Action** is a Svelte action that attaches interactive behavior to a DOM element.
Actions handle things like mouse tracking, ripples, focus trapping — JS effects.

### 5.2 ActionFactory Interface

```typescript
type ActionCleanup = {
  destroy(): void;
  update?: (next: unknown) => void;
};

type ActionFactory<P = unknown> = (
  node: HTMLElement,
  params?: P
) => ActionCleanup;
```

### 5.3 Action Template (Copy-Paste)

```typescript
// Create: packages/coldlight/recipes/actions/myAction.ts

/**
 * @file packages/coldlight/recipes/actions/myAction.ts
 * @layer recipes
 * @description [One sentence describing what this action does]
 * @since 1.0.0
 */

import type { ActionFactory } from "./index";

export interface MyActionParams {
  // Action parameters (optional)
  delay?: number;
  onTrigger?: () => void;
}

const myAction: ActionFactory<MyActionParams> = (node, params = {}) => {
  const delay = params.delay ?? 100;

  // Setup: attach event listeners, create elements, etc.
  const handleEvent = (e: Event) => {
    // Handle the event
    params.onTrigger?.();
  };

  node.addEventListener("eventname", handleEvent);

  // Return cleanup
  return {
    destroy() {
      node.removeEventListener("eventname", handleEvent);
    },
    // Optional: update params while mounted
    update(newParams: MyActionParams) {
      // Handle param updates
    },
  };
};

export default myAction;
```

### 5.4 Registering an Action

```typescript
// Update: packages/coldlight/recipes/actions/index.ts

import myAction from "./myAction";

export const actionRegistry = {
  glowTrack: { create: glowTrack },
  ripple: { create: ripple },
  tilt: { create: tilt },
  focusTrap: { create: focusTrap },
  clickOutside: { create: clickOutside },
  hoverIntent: { create: hoverIntent },
  pressFeedback: { create: pressFeedback },
  myAction: { create: myAction },  // ADD HERE
} as const;
```

### 5.5 Using Actions in Recipes

```typescript
// In recipe definition:
"button.glass.interactive": {
  id: "button.glass.interactive",
  kind: "button",
  description: "Interactive glass button with glow tracking",
  classes: { /* ... */ },
  requires: ["glowTrack", "pressFeedback"],  // Actions auto-attached
},
```

### 5.6 Action Rules

1. **No inline styles with color values** — use CSS variables
2. **Cleanup is mandatory** — always remove event listeners
3. **Actions are declarative** — recipes declare them, renderers attach them
4. **No direct DOM manipulation for visuals** — set CSS vars, add classes

---

## 6. Registration Checklist

### 6.1 Adding a New Kind

| Step | File | What to Add |
|------|------|-------------|
| 1 | `taxonomy/kinds.ts` | Add to appropriate category object (`shellKinds`, `surfaceKinds`, etc.) |
| 2 | `taxonomy/kinds.ts` | Ensure spread into `blockKinds` |
| 3 | `taxonomy/contracts.ts` | Create `MyKindPropsSchema` extending `DsSurfacePropsSchema` |
| 4 | `taxonomy/contracts.ts` | Add to `kindContracts` object |
| 5 | `recipes/index.ts` | Add at least one recipe for the kind |

### 6.2 Adding a New Recipe

| Step | File | What to Add |
|------|------|-------------|
| 1 | `recipes/index.ts` | Add recipe to `recipeRegistry` object |
| 2 | Verify | Ensure `kind` matches a registered kind |
| 3 | Verify | Ensure all classes use token-backed utilities |
| 4 | If JS effects | Add `requires: [...]` array |

### 6.3 Adding a New Action

| Step | File | What to Add |
|------|------|-------------|
| 1 | `recipes/actions/myAction.ts` | Create action file with ActionFactory |
| 2 | `recipes/actions/index.ts` | Import and add to `actionRegistry` |
| 3 | `recipes/actions/types.ts` | Add to `BehaviorTypes` if new behavior type |

### 6.4 Adding a New Token

| Step | File | What to Add |
|------|------|-------------|
| 1 | `tokens/tokens.ts` | Add token value |
| 2 | `tokens/tokens.ts` | Add to appropriate `*Tokens` array |
| 3 | Run | `pnpm ds:tokens:build` |
| 4 | Verify | Check generated `tokens.css`, `types.ts` |

### 6.5 Adding a New Keyframe

| Step | File | What to Add |
|------|------|-------------|
| 1 | `recipes/css/keyframes.css` | Add `@keyframes dp-*` rule |
| 2 | Rule | **Motion only** — no colors, no raw values |

---

## 7. Validation Rules

### 7.1 Kind Validation

- [ ] Has `description` (string, non-empty)
- [ ] Has `layoutMode` (`"grid"` | `"flex"` | `"none"`)
- [ ] Has `recipePrefix` (string, non-empty)
- [ ] Has `slots` (non-empty array)
- [ ] If shell kind, `layoutMode` MUST be `"grid"`
- [ ] Is spread into `blockKinds`

### 7.2 Contract Validation

- [ ] Extends `DsSurfacePropsSchema`
- [ ] Uses Zod schemas from `tokens/schema.ts`
- [ ] All custom props have `.default()` values
- [ ] Registered in `kindContracts`

### 7.3 Recipe Validation

- [ ] `id` follows naming convention: `{kind}.{surface}.{variant}`
- [ ] `kind` is a registered kind
- [ ] `classes` has at least `root` slot
- [ ] All classes are token-backed (no arbitrary values)
- [ ] No raw colors (`#`, `oklch(`, `rgb(`, `hsl(`)
- [ ] If JS effects needed, has `requires` array

### 7.4 Action Validation

- [ ] Implements `ActionFactory` interface
- [ ] Returns `{ destroy() }` cleanup object
- [ ] No inline style colors (use CSS vars)
- [ ] Registered in `actionRegistry`

### 7.5 Token Validation

- [ ] Added to `tokens.ts` SSOT
- [ ] Added to appropriate `*Tokens` array for VPB dropdown
- [ ] Run `pnpm ds:tokens:build` after changes
- [ ] Generated files updated

---

## Quick Reference Card

### Recipe ID Format
```
{kind}.{surface}.{variant}
panel.glass.default
button.solid.primary
card.matte.compact
```

### Class Pattern
```
bg-{surface}-{variant}
text-{color}-{step}
shadow-glow-{color}
rounded-{size}
p-{size}
```

### Data Attribute Pattern
```svelte
<div
  class="dp-surface"
  data-surface="glass"
  data-variant="deep"
  data-glow="teal"
  data-size="md"
>
```

### File Locations
```
tokens/tokens.ts        → Token values (SSOT)
taxonomy/kinds.ts       → Kind definitions
taxonomy/contracts.ts   → Prop schemas
recipes/index.ts        → Recipe registry
recipes/actions/        → Action implementations
recipes/css/keyframes.css → Animation keyframes (motion only)
```

---

**This guide is the contract. If you need to guess, the guide is incomplete.**
