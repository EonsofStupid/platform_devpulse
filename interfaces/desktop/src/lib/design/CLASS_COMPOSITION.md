# ColdLight Class Composition System

> **How classes are structured, composed, and applied.**

---

## Overview

ColdLight uses a layered class composition pattern:

```
base + semantic + recipe + modifiers
```

Example:
```html
<button class="btn btn-primary v-cyber s-glass e-2 sz-md">
```

---

## Class Categories

### 1. Base Class (Required)

The foundational class that identifies the component:

```css
.btn { /* Button base */ }
.panel { /* Panel base */ }
.card { /* Card base */ }
.input { /* Input base */ }
```

### 2. Semantic Intent (DaisyUI-style)

What the component MEANS, not how it looks:

```css
.btn-primary { /* Primary action */ }
.btn-secondary { /* Secondary action */ }
.btn-danger { /* Destructive action */ }
.btn-ghost { /* Minimal presence */ }
```

### 3. Recipe Variant (v-*)

The visual "physics blueprint" from taxonomy:

```css
.v-cyber { /* Cyber aesthetic preset */ }
.v-glacial { /* Cool, frosted preset */ }
.v-molten { /* Warm, glowing preset */ }
.v-chrome { /* Metallic preset */ }
```

### 4. Surface/Material (s-*)

The material system applied:

```css
.s-glass { /* Glass material */ }
.s-solid { /* Solid material */ }
.s-metal { /* Metal material */ }
```

### 5. Elevation (e-*)

Depth and shadow level:

```css
.e-0 { /* Flat, no shadow */ }
.e-1 { /* Subtle lift */ }
.e-2 { /* Standard elevation */ }
.e-3 { /* High elevation */ }
.e-4 { /* Maximum elevation */ }
```

### 6. Size (sz-*)

Component size variant:

```css
.sz-xs { /* Extra small */ }
.sz-sm { /* Small */ }
.sz-md { /* Medium (default) */ }
.sz-lg { /* Large */ }
.sz-xl { /* Extra large */ }
```

---

## Internal vs External Classes

### External Classes (User-Facing)

These appear in markup and are part of the API:

| Prefix | Purpose | Example |
|--------|---------|---------|
| (none) | Base | `.btn`, `.panel` |
| `-{intent}` | Semantic | `.btn-primary` |
| `v-` | Recipe | `.v-cyber` |
| `s-` | Surface | `.s-glass` |
| `e-` | Elevation | `.e-2` |
| `sz-` | Size | `.sz-md` |

### Internal Classes (System-Applied)

These are applied automatically by the system, never in markup:

| Prefix | Purpose | Applied When |
|--------|---------|--------------|
| `_motion-` | Animation | Motion context enabled |
| `_blend-` | Color blend | Blend mode selected |
| `_focus-` | Focus level | FOCUS context cascades |
| `_state-` | Interaction | Hover/active/disabled |

```css
/* Internal - system applies based on context */
._motion-pulse { animation: pulse 2s ease infinite; }
._motion-flow { animation: flow 3s ease infinite; }
._blend-cool-bright { /* Color calculations */ }
._focus-high { /* Intensified materials */ }
```

---

## Data Attribute Selectors

Classes work alongside data attributes:

```css
/* Recipe sets semantic properties */
[data-kind="panel"][data-recipe="cyber"] {
  --surface-blur: var(--blur-lg);
  --surface-bg-alpha: 0.25;
  --surface-glow-hsl: var(--color-cyan-hsl);
}

/* State-based styling */
[data-kind="dialog"][data-state="open"] {
  opacity: 1;
  transform: scale(1);
}

[data-kind="dialog"][data-state="closed"] {
  opacity: 0;
  transform: scale(0.95);
}

/* Slot-specific styling */
[data-kind="dialog"][data-slot="overlay"] {
  backdrop-filter: blur(4px);
}
```

---

## Composition Examples

### Button Variations

```html
<!-- Primary cyber button -->
<button class="btn btn-primary v-cyber s-glass e-2 sz-md">
  Submit
</button>

<!-- Secondary glacial button -->
<button class="btn btn-secondary v-glacial s-glass e-1 sz-sm">
  Cancel
</button>

<!-- Danger solid button -->
<button class="btn btn-danger v-molten s-solid e-2 sz-lg">
  Delete
</button>

<!-- Ghost minimal button -->
<button class="btn btn-ghost e-0 sz-md">
  Learn More
</button>
```

### Panel Variations

```html
<!-- Standard glass panel -->
<div class="panel v-cyber s-glass e-2">
  <div class="panel-header">Title</div>
  <div class="panel-content">Content</div>
</div>

<!-- Intense focused panel -->
<div class="panel v-cyber s-glass e-3" data-focus="high">
  <div class="panel-content">Critical Info</div>
</div>

<!-- Flat metal panel -->
<div class="panel v-chrome s-metal e-1">
  <div class="panel-content">Dashboard</div>
</div>
```

---

## CSS Variable Flow

Classes set CSS custom properties that components consume:

```css
/* Recipe defines semantic properties */
.v-cyber {
  --recipe-blur: var(--blur-lg);
  --recipe-saturation: 200;
  --recipe-bg-alpha: 0.25;
  --recipe-glow-color: var(--color-cyan);
  --recipe-border-alpha: 0.15;
}

.v-glacial {
  --recipe-blur: var(--blur-xl);
  --recipe-saturation: 150;
  --recipe-bg-alpha: 0.15;
  --recipe-glow-color: var(--color-blue);
  --recipe-border-alpha: 0.1;
}

/* Surface applies material behavior */
.s-glass {
  backdrop-filter: blur(var(--recipe-blur)) saturate(var(--recipe-saturation));
  background: hsl(var(--surface-bg-hsl) / var(--recipe-bg-alpha));
  border: 1px solid hsl(var(--surface-border-hsl) / var(--recipe-border-alpha));
}

/* Elevation adds depth */
.e-2 {
  box-shadow: var(--shadow-elevated);
}

.e-3 {
  box-shadow: var(--shadow-deep), var(--shadow-glow);
}
```

---

## FOCUS Context Cascade

FOCUS level modifies recipe output:

```css
/* Base recipe */
.v-cyber {
  --recipe-blur: var(--blur-md);
  --recipe-saturation: 180;
}

/* FOCUS overrides */
[data-focus="low"] .v-cyber {
  --recipe-blur: var(--blur-sm);
  --recipe-saturation: 150;
}

[data-focus="high"] .v-cyber {
  --recipe-blur: var(--blur-lg);
  --recipe-saturation: 200;
}

[data-focus="critical"] .v-cyber {
  --recipe-blur: var(--blur-xl);
  --recipe-saturation: 200;
  --recipe-glow-intensity: 1.5;
}
```

---

## Blend System (Internal)

Blends are applied internally based on quadrant:

| Blend | Temperature | Brightness |
|-------|-------------|------------|
| `_blend-cool-bright` | Cool | High |
| `_blend-cool-muted` | Cool | Low |
| `_blend-warm-bright` | Warm | High |
| `_blend-warm-muted` | Warm | Low |

```css
/* System applies based on context */
._blend-cool-bright {
  --blend-hue-shift: -15;
  --blend-saturation-mod: 1.2;
  --blend-lightness-mod: 1.1;
}

._blend-warm-muted {
  --blend-hue-shift: 15;
  --blend-saturation-mod: 0.8;
  --blend-lightness-mod: 0.9;
}
```

---

## Motion System (Internal)

Motion is toggled via context, applied internally:

```css
/* Only applied when motion context allows */
._motion-pulse {
  animation: pulse 2s ease-in-out infinite;
}

._motion-flow {
  animation: flow 3s linear infinite;
}

._motion-shimmer {
  animation: shimmer 1.5s ease infinite;
}

/* Respects prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  ._motion-pulse,
  ._motion-flow,
  ._motion-shimmer {
    animation: none;
  }
}
```

---

## Class Precedence

Specificity order (lowest to highest):

1. Base class (`.btn`)
2. Semantic intent (`.btn-primary`)
3. Recipe variant (`.v-cyber`)
4. Surface material (`.s-glass`)
5. Elevation (`.e-2`)
6. Size (`.sz-md`)
7. Data attributes (`[data-state="active"]`)
8. Internal classes (`._focus-high`)

---

## VPB Class Generation

When VPB creates a node, it generates the class string:

```typescript
function generateClassString(node: BlockNode): string {
  const classes: string[] = [];

  // 1. Base (from kind)
  classes.push(node.kind);

  // 2. Semantic intent (if applicable)
  if (node.intent && node.intent !== "neutral") {
    classes.push(`${node.kind}-${node.intent}`);
  }

  // 3. Recipe variant
  if (node.recipe) {
    classes.push(`v-${node.recipe}`);
  }

  // 4. Surface material
  if (node.material) {
    classes.push(`s-${node.material}`);
  }

  // 5. Elevation
  if (node.elevation !== undefined) {
    classes.push(`e-${node.elevation}`);
  }

  // 6. Size
  if (node.size) {
    classes.push(`sz-${node.size}`);
  }

  return classes.join(" ");
}

// Example output:
// "btn btn-primary v-cyber s-glass e-2 sz-md"
```

---

## Validation

Classes are validated against taxonomy:

```typescript
import { z } from "zod";

const ClassCompositionSchema = z.object({
  base: z.string(),
  intent: z.enum(["neutral", "primary", "secondary", "danger", "success", "warning"]).optional(),
  recipe: z.enum(["cyber", "glacial", "molten", "chrome", "void"]).optional(),
  surface: z.enum(["glass", "solid", "metal"]).optional(),
  elevation: z.enum(["0", "1", "2", "3", "4"]).optional(),
  size: z.enum(["xs", "sm", "md", "lg", "xl"]).optional(),
});

// Invalid combinations caught at build time
ClassCompositionSchema.parse({
  base: "btn",
  recipe: "invalid-recipe",  // ERROR: not in enum
});
```

---

## Summary

| Class Type | Prefix | User-Facing | Example |
|------------|--------|-------------|---------|
| Base | — | Yes | `.btn` |
| Intent | `-{name}` | Yes | `.btn-primary` |
| Recipe | `v-` | Yes | `.v-cyber` |
| Surface | `s-` | Yes | `.s-glass` |
| Elevation | `e-` | Yes | `.e-2` |
| Size | `sz-` | Yes | `.sz-md` |
| Motion | `_motion-` | No | `._motion-pulse` |
| Blend | `_blend-` | No | `._blend-cool-bright` |
| Focus | `_focus-` | No | `._focus-high` |
| State | `_state-` | No | `._state-hover` |

---

**This is the canonical class composition system.**
