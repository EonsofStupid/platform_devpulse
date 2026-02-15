# COLD LIGHT Design System — Style Guide (SSOT)

Single Source of Truth for code standards, file headers, and architectural boundaries.
All AI agents and developers MUST follow these patterns.

---

## THE COMPOSABLE RECIPE SYSTEM (READ THIS FIRST)

**This is the most important concept in the entire system. If you don't understand this, you will get everything wrong.**

### Recipes Are NOT Static Class Strings

```
❌ WRONG UNDERSTANDING:
   Recipe = "bg-glass-deep border-color-teal-500 shadow-glow-teal"
   (A hardcoded string that never changes)

✅ CORRECT UNDERSTANDING:
   Recipe = {
     defaults: { color: { a: "teal" }, glow: { color: "teal" } },
     classes: (props) => computed classes based on props
   }
   (A COMPOSABLE configuration with defaults that VPB can modify)
```

### The Complete Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPOSABLE RECIPE WORKFLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. BASE RECIPES (Capture the COLD LIGHT Vision)                    │
│     └── Stored in recipes/index.ts as COMPOSABLE configurations     │
│     └── Each has: id, defaults, classes(props), requires[]          │
│     └── Defaults ARE the captured visual vision                     │
│                                                                     │
│  2. VPB (Visual Page Builder = Visual Recipe Editor)                │
│     └── Reads recipe registry                                       │
│     └── Exposes DsSurfaceProps as UI controls (dropdowns, sliders)  │
│     └── User sees: Color dropdown, Motion dropdown, Glow slider     │
│     └── User changes color.a from "teal" to "purple"                │
│     └── VPB WRITES CODE for the user                                │
│                                                                     │
│  3. SAVE AS NEW RECIPE (Create Variants)                            │
│     └── User tweaks props in VPB                                    │
│     └── Clicks "Save as Preset"                                     │
│     └── Tweaked props become new named recipe                       │
│     └── "button.glass.primary" → "button.glass.myCustomPurple"      │
│     └── New recipe is registered, available platform-wide           │
│                                                                     │
│  4. BUILD PIPELINE (CSS Generation)                                 │
│     └── pnpm ds:tokens:build                                        │
│     └── Reads ALL registered recipes                                │
│     └── Generates CSS at compile time                               │
│     └── No runtime CSS generation                                   │
│                                                                     │
│  5. VITE PLUGIN ENFORCER (Mandatory)                                │
│     └── Watches files in real-time during pnpm dev                  │
│     └── BLOCKS build on any violation                               │
│     └── No mercy. No exceptions. No "I'll fix it later."            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### DsSurfaceProps = The Composable Schema

Every surface recipe accepts these composable props. **Each prop becomes a VPB UI control.**

```typescript
interface DsSurfaceProps {
  // VPB: Color dropdown (teal, purple, magenta, ember)
  color: {
    a: ColorToken;        // Primary accent
    b?: ColorToken;       // Secondary (for gradients)
  };

  // VPB: Finish dropdown (glass, matte, solid)
  finish: FinishToken;

  // VPB: Frame dropdown (none, soft, hard, crisp)
  frame: FrameToken;

  // VPB: Depth dropdown (z0, z1, z2, z3, z4)
  depth: DepthToken;

  // VPB: Motion dropdowns
  motion: {
    hover?: MotionToken;   // lift, glow, pulse, none
    enter?: MotionToken;   // fade-in, slide-up, scale
    ambient?: MotionToken; // breathe, pulse, shimmer
  };

  // VPB: Bevel dropdown (none, subtle, soft, deep)
  bevel: { level: BevelToken };

  // VPB: Glow dropdown + intensity slider
  glow: {
    color?: GlowToken;     // teal, purple, magenta, ember, frost
    intensity?: number;    // 0-1 slider
  };
}
```

### How VPB Uses Composable Recipes

1. **VPB reads `defaults`** → Populates initial preview with captured COLD LIGHT vision
2. **VPB reads prop types** → Generates dropdown for `color.a: ColorToken`
3. **User selects "purple"** → VPB calls `classes({ ...defaults, color: { a: "purple" } })`
4. **Preview updates** → Shows computed classes with new color
5. **User clicks "Save"** → VPB writes new recipe to registry
6. **Build runs** → New recipe's CSS is generated

### VPB Output Example

User drags Glass Button onto canvas. User changes:
- Color: teal → purple
- Motion: lift → pulse
- Glow: teal → magenta

**VPB GENERATES THIS CODE:**

```svelte
<GlassButton
  color={{ a: "purple" }}
  motion={{ hover: "pulse" }}
  glow={{ color: "magenta", intensity: 0.7 }}
>
  Click Me
</GlassButton>
```

**Junior dev never writes CSS. They compose via VPB. VPB writes code for them.**

---

## 0) Core Principles (Non-Violable)

### Registry-First, Always

```
Tokens → Taxonomy → Recipes → VPB Blocks → Renderers (.svelte)
```

If it isn't registered, it doesn't exist.

### Recipes Are COMPOSABLE

- Recipes are NOT static class strings
- Recipes are configurable objects with defaults
- VPB edits recipe props
- Edited props can be saved as new recipe variants
- Build pipeline generates CSS from all registered recipes

### VPB Writes Code

- VPB is NOT just a previewer
- VPB is a code generator
- VPB reads registries, shows controls, outputs Svelte code
- Junior devs compose via VPB, not by writing CSS

### One Theme Identity

ColdLight / Maestro is the brand identity. Variants swap values only, never structure.

### Variants change VALUES only

Token names are immutable across variants. No "variant-specific token names."

### BlockNodes NEVER store theme values

No raw colors, no CSS vars, no Tailwind classes in BlockNode props.
BlockNodes store only typed, schema-validated enums.

### Recipes own visuals

Visual decisions live only in `recipes/*`.
Renderers apply recipe output. They do not style themselves.

### CSS Grid is mandatory for shells + dashboards

Shell kinds must be grid-first.
Flex only for small inline rows (icons, button groups).

### svelte-sonner only

No toast library sprawl. All app notifications go through `domains/notify`.

### Vite Plugin Enforces (Mandatory)

NOT optional scripts. Vite plugin that:
- Watches files in real-time during dev
- BLOCKS build on any violation
- Shows violations in terminal AND browser overlay

---

## 1) Architectural Layers (Updated + Strict)

@layer must match folder + responsibility, not "what the dev feels like."

| Layer | Purpose | Location | VPB Editable |
|-------|---------|----------|--------------|
| tokens | SSOT token keys + values | design/tokens/ | ✅ values |
| taxonomy | block kinds + contracts + slots | design/taxonomy/ | ✅ schema/constraints |
| recipes | Composable configs + classes() | design/recipes/ | ✅ props via VPB |
| actions | Svelte actions for recipes | design/recipes/actions/ | ⚠️ only via recipes |
| primitives | Bits UI wrappers (behavior) | design/primitives/ | ✅ props |
| renderers | DS render shells (apply recipes) | design/renderers/ | ✅ via VPB |
| vpb | VPB dev-tool inspector/builder | sys/debug/vpb/ | ✅ editor UI |
| domains | app behavior/state modules | domains/* | ⚠️ limited |
| plugins | optional extensions | design/plugins/ | custom |

Rule: Any file in the wrong layer is a violation.

---

## 2) File Header Standards (Mandatory)

Every file MUST include a structured header comment.

### TypeScript / JavaScript (.ts, .js)
```typescript
/**
 * @fileoverview [One-line description]
 * @module @devpulse/[path/from/lib]
 * @layer [tokens|taxonomy|recipes|actions|primitives|renderers|vpb|domains|plugins]
 *
 * @description
 * [2-3 sentence description of responsibility, boundaries, and non-goals]
 *
 * @registry
 * - [tokens|taxonomy|recipes|vpb] (if applicable)
 *
 * @dependencies
 * - [./relative/path] ([what it provides])
 *
 * @consumers
 * - [who/imports/this/*]
 *
 * @vpb-editable [prop1, prop2] (if applicable)
 * @since [version]
 */
```

### Svelte Components (.svelte)
```svelte
<!--
  @file [path/from/lib/Component.svelte]
  @layer [primitives|renderers|vpb|domains|plugins]

  [2-3 sentence responsibility statement]
  [Non-goals: what it must never do]

  Props:
  - [propName]: [type] - [description]

  @vpb-editable [prop1, prop2]
  @since [version]
-->
```

---

## 3) Prop Constraint Patterns (VPB-Compatible)

All props MUST be enumerable. VPB generates UI controls from prop types.

✅ Correct:
```typescript
type Size = "sm" | "md" | "lg";
type Variant = "glass" | "solid" | "ghost";
```

❌ Wrong:
```typescript
type Variant = string;
```

Rule: If VPB can't enumerate it, it doesn't belong in props.

---

## 4) Recipe System Rules (COMPOSABLE)

### Recipe Structure

```typescript
interface RecipeDefinition<Props extends DsSurfaceProps> {
  id: RecipeId;

  // The COLD LIGHT vision captured as defaults
  defaults: Props;

  // Composable - classes computed from props
  classes: (props: Props) => Record<string, string>;

  // Actions auto-attached by renderer
  requires?: ActionId[] | ((props: Props) => ActionId[]);
}
```

### Example Composable Recipe

```typescript
const buttonGlassDefault: RecipeDefinition<ButtonProps> = {
  id: "button.glass.default",

  // Captured COLD LIGHT vision
  defaults: {
    color: { a: "teal" },
    finish: "glass",
    frame: "soft",
    depth: "z2",
    motion: { hover: "lift" },
    bevel: { level: "soft" },
    glow: { color: "teal", intensity: 0.5 }
  },

  // Composable - VPB can change any prop
  classes: (props) => ({
    root: [
      `bg-glass-${props.finish}`,
      `border-${props.color.a}-500`,
      `shadow-${props.depth}`,
      props.glow.color && `shadow-glow-${props.glow.color}`,
      props.bevel.level && `shadow-bevel-${props.bevel.level}`
    ].filter(Boolean).join(" "),
    icon: "text-text-primary",
    label: "font-medium"
  }),

  // Conditional actions based on props
  requires: (props) => {
    if (props.motion.hover === "glow-track") return ["glowTrack"];
    return [];
  }
};
```

### Custom-JS Rule (Hard)

JS effects are NEVER manually attached.
If a recipe needs effects:
1. Recipe declares `requires: ["glowTrack"]`
2. Renderer auto-attaches action(s)

No exceptions.

---

## 5) Token Usage Rules (No Drift)

✅ Correct token usage:
- Tokens exist as semantic keys (SSOT in tokens.ts)
- Consumed via Tailwind preset mapping (preferred)
- Or via recipe class maps

❌ Forbidden:
- Raw hex / oklch strings in components
- Arbitrary Tailwind values `bg-[#...]`, `text-[...]`, `shadow-[...]`
- "component-level theme vars"

### Scoped Rule for OKLCH

✅ Allowed: `oklch()` in tokens layer only (`tokens.ts`, `tokens.css`)
❌ Forbidden: `oklch()` in recipes / renderers / components

---

## 6) CSS Variable Injection (STRICT + LIMITED)

✅ Allowed: ROOT tokens only
- Unprefixed CSS custom properties exist only in tokens.css at root scope

✅ Allowed: Ephemeral computed vars ONLY when necessary (rare)
- Prefix: `--_cl-*` (private coldlight runtime)
- Allowlisted files only
- Numeric values only

❌ Forbidden:
- Injecting theme tokens per component
- Using token CSS vars inside .svelte
- Injecting colors via inline style
- Injecting spacing via px/rem values

---

## 7) CSS Grid Enforcement (Shell + Dashboard)

Shell kinds must have taxonomy constraint: `layoutMode: "grid"`

✅ Allowed flex usage:
- Icon + label rows
- Button groups
- Tiny inline alignment

❌ Forbidden flex usage:
- Shell scaffolding layout
- Dashboard layout
- Dock layout sizing

---

## 8) Notifications (svelte-sonner only)

All app notifications go through: `src/lib/domains/notify/`

Rules:
- Svelte UI toasts: svelte-sonner
- If running in Tauri: OS toast integration may trigger when minimized
- No direct `toast()` calls scattered around the app
- Root layout must include: `<Toaster />`

---

## 9) Enforcement (Vite Plugin - MANDATORY)

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

### Violations That BLOCK Build

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

## 10) Zero Tolerance Rules

1. No hardcoded colors — only tokens via recipes/preset
2. No hardcoded spacing — only preset spacing / recipe maps
3. No magic numbers — no raw px/rem/oklch strings in components
4. No duplicate primitives — one SSOT per primitive
5. No string props — union literals only
6. No raw theme vars in components — token CSS vars must never appear in .svelte
7. No Tailwind arbitrary values — ban any `[...]` class usage
8. No renderer styling logic — renderers only apply recipe outputs
9. No visual JS without recipe.requires — tracking effects must be declared
10. No static recipes — recipes must be composable with defaults

---

## 11) AI Agent Instructions (Correct + Enforceable)

When generating/modifying design system files:

1. **Recipes are COMPOSABLE** — Not static strings, configurable objects with defaults
2. **VPB writes code** — It's a code generator, not just a previewer
3. **Registry-first** — No .svelte until tokens/taxonomy/recipes/vpb entries exist
4. **Always include header** — Must include @layer, @since, and correct module path
5. **Never hardcode visuals** — No raw colors, spacing, or shadows
6. **No arbitrary Tailwind values** — No bracket classes. If needed, create a preset utility
7. **Union literals only** — VPB must be able to enumerate
8. **Actions only via requires[]** — Mouse glow/parallax/ripple must be declared in recipe metadata
9. **CSS Grid for shell/dashboard** — No flex scaffolding
10. **Notifications** — Only through domains/notify (svelte-sonner)
11. **Vite plugin enforces** — Violations block builds. No exceptions.

---

## 12) Glass Classification (Critical)

**Glass is NOT a component type. Glass is a surface finish recipe.**

❌ Wrong:
```
GlassButton exists as a standalone thing in DS core
```

✅ Correct:
```
Button exists (primitive / component)
glass is a recipe variant applied to Button
```

So:
- `Button` = primitive (Bits UI wrapper, no styling)
- `button.glass.default` = recipe (composable, has defaults)
- VPB applies recipe to Button = visual result

---

## 13) The Single Biggest Truth

```
✅ If you build the generator + preset + scanner + Vite enforcer, this is a weapon.
❌ If you don't, this is just a long document.
```

That's it.
