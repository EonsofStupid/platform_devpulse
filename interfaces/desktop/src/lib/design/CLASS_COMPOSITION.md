# ColdLight Class Composition System

> **How classes are structured, composed, and applied.**

---

## Overview

ColdLight uses a layered class composition pattern via `cn()`:

```
recipe(size) + visual.segments + visual.radius + className
```

Example output:
```html
<button class="inline-flex items-center justify-center h-10 px-4 v-s1 v-d2 v-g1 rounded-lg"
        data-kind="button" data-slot="root" data-encoding="v-s1d2g1">
  Save
</button>
```

---

## Class Sources

### 1. Recipe Classes (Layout)
From `resolveRecipe(recipe, props)` — structural layout only, no visual tokens:
```
inline-flex items-center justify-center h-10 px-4 font-medium
```

### 2. Visual Encoding Segments (v-*)
From `resolveVisual(input).segments` — 8-axis token encoding:
```
v-s1 v-d2 v-g1
```
Each `v-*` utility sets CSS custom properties that reference SD5-generated token values.

### 3. Radius
From `resolveVisual(input).radius` — border radius:
```
rounded-lg
```

### 4. User className
From component prop — additional Tailwind utilities:
```
mt-4 w-full
```

---

## 8-Axis Encoding Classes

Generated into `variants.css` from `token-categories.ts`:

| Prefix | Category | Example | What It Sets |
|--------|----------|---------|-------------|
| `v-s` | Surface | `v-s1` | `background`, `backdrop-filter` |
| `v-z` | Material | `v-z2` | `opacity`, `filter` |
| `v-d` | Depth | `v-d2` | `--shadow-depth` (box-shadow layer) |
| `v-b` | Bevel | `v-b1` | `--shadow-bevel` (inset shadow layer) |
| `v-g` | Glow | `v-g1` | `--shadow-glow` (glow shadow layer) |
| `v-f` | Frame | `v-f1` | `border`, `--shadow-frame` |
| `v-m` | Motion | `v-m1` | `animation` |
| `v-t` | Transition | `v-t2` | `transition` |

### Composable
```html
<!-- Individual segments (most common) -->
<div class="v-s1 v-d2 v-g1">

<!-- Full explicit encoding -->
<div class="v-s1z0d2b1g1f1m0t2">

<!-- Preset + override -->
<Button intent="primary" glow="teal">  <!-- resolves to v-* classes -->
```

---

## Component Resolution Flow

```
<Button intent="primary" glow="teal" depth="z2" size="md">
  → PRESET_MAP["primary"] → "btn-primary"
  → useColdLight({ preset: "btn-primary", glow: "teal", depth: "z2" })
  → resolveVisual() → { segments: "v-s6 v-d1 v-b1 v-g1 v-f2 v-t2", radius: "rounded-lg" }
  → recipe("button.default", { size: "md" }) → "inline-flex items-center h-10 px-4"
  → cn(recipeClasses, visual.segments, visual.radius, className)
  → "inline-flex items-center h-10 px-4 v-s6 v-d1 v-b1 v-g1 v-f2 v-t2 rounded-lg"
```

---

## Data Attributes

Every component element emits:

| Attribute | Required | Example |
|-----------|----------|---------|
| `data-kind` | ALWAYS | `"button"` |
| `data-slot` | ALWAYS | `"root"` |
| `data-state` | If stateful | `"open"` |
| `data-encoding` | If visual | `"v-s1d2g1"` |

---

## What Components NEVER Contain

- Raw color values (`#fff`, `oklch()`, `rgb()`)
- Arbitrary Tailwind values (`bg-[#000]`, `text-[12px]`)
- Inline styles (`style="color: red"`)
- Hand-written CSS custom property references
- Token CSS var names directly — everything flows through the encoding

---

**This is the canonical class composition system.**
