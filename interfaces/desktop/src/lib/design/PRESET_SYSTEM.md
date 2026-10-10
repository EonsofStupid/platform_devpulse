# ColdLight Preset System

> **How presets work in the 8-axis encoding system.**

---

## Overview

Presets are **named 8-axis compositions** that provide sensible visual defaults per component kind. They map to the encoding system.

```
Preset = kind + named 8-axis values (surface, material, depth, bevel, glow, frame, motion, transition)
```

---

## Preset Definition

```typescript
// registry/presets.ts
{
  id: "btn-primary",
  kind: "button",
  surface: "glass-deep",
  material: "glass-subtle",
  depth: "z2",
  bevel: "soft",
  glow: "teal",
  frame: "accent-teal",
  motion: "off",
  transition: "normal"
}
```

60+ presets across 28 component kinds.

---

## Resolution Flow

```
<Button intent="primary" glow="teal" depth="z2">
  → types.ts: PRESET_MAP["primary"] → "btn-primary"
  → getPreset("btn-primary") → { surface: "glass-deep", depth: "z2", ... }
  → resolveVisual({ preset: "btn-primary", glow: "teal", depth: "z2" })
  → ResolvedVisual { segments: "v-s6 v-d2 v-g1 ...", radius: "rounded-lg" }
```

### Merge Order
1. Kind defaults (from `kind-definitions.ts`)
2. Preset values (from `presets.ts`)
3. Component prop overrides (from user)
4. FOCUS context modifiers (from runtime)

---

## API

```typescript
getPreset(id: string): Preset | undefined
getPresetsForKind(kind: string): Preset[]
getAllPresets(): Preset[]
```

---

## Preset vs Recipe

| Aspect | Preset | Recipe |
|--------|--------|--------|
| What it is | Named 8-axis visual config | Per-slot layout class strings |
| What it stores | `{ surface, depth, glow, ... }` | `{ root: "flex h-10 px-4", ... }` |
| When it's used | Visual resolution | Class composition |
| Who uses it | `resolveVisual()` | `resolveRecipe()` |
| Token-driven | Yes — maps to v-* encoding | No — pure Tailwind layout |

---

## VPB Integration

1. VPB reads preset as starting values
2. Shows 8-axis controls (surface dropdown, depth slider, glow select, etc.)
3. User adjusts values
4. Live preview updates with new encoding
5. User can save as new preset

---

**This is the canonical preset system. SSOT: `registry/presets.ts`.**
