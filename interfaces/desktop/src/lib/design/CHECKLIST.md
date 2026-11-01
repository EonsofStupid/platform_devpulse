# COLD LIGHT Design System - Pre/Post Code Checklists

> Quick reference checklists for maintaining registry-first compliance.

---

## THE COMPOSABLE RECIPE SYSTEM (CRITICAL CONCEPT)

**Recipes are NOT static class strings. They are COMPOSABLE CONFIGURATIONS.**

### The Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│                     COMPOSABLE RECIPE WORKFLOW                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. BASE RECIPES (Established Presets)                              │
│     └── Capture the COLD LIGHT visual vision                        │
│     └── Stored in recipes/index.ts as configurations                │
│     └── Each has: id, classes(), requires[], defaults               │
│                                                                     │
│  2. VPB (Visual Recipe Editor)                                      │
│     └── Exposes DsSurfaceProps as dropdown/slider controls          │
│     └── User selects: color.a = "purple" instead of "teal"          │
│     └── User enables: motion.hover = "lift"                         │
│     └── User adjusts: bevel.level = "deep"                          │
│     └── VPB WRITES CODE for the user based on inputs                │
│                                                                     │
│  3. SAVE AS NEW RECIPE (Optional)                                   │
│     └── Tweaked configuration becomes a new named recipe            │
│     └── "button.glass.primary" → "button.glass.myCustomPurple"      │
│     └── New recipe is registered and available platform-wide        │
│                                                                     │
│  4. BUILD PIPELINE                                                  │
│     └── pnpm ds:tokens:build                                        │
│     └── Reads all registered recipes                                │
│     └── Generates CSS at build time                                 │
│     └── No runtime CSS generation - all compile-time                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### What This Means

| Concept | Wrong Understanding | Correct Understanding |
|---------|---------------------|----------------------|
| Recipe | Static class string | Composable configuration with defaults |
| VPB | Just selects which recipe | Edits recipe props, creates variants |
| Component | Receives class string | Receives composable props that map to classes |
| New color | Edit tokens.ts manually | VPB dropdown → save → new recipe variant |
| New animation | Write CSS keyframes | VPB dropdown → apply from registered actions |

### DsSurfaceProps = The Composable Schema

Every surface recipe accepts these composable props:

```typescript
interface DsSurfaceProps {
  color: { a: ColorToken; b?: ColorToken };  // VPB: color picker dropdown
  finish: FinishToken;                        // VPB: glass | matte | solid
  frame: FrameToken;                          // VPB: border style dropdown
  depth: DepthToken;                          // VPB: shadow/elevation
  motion: {
    hover?: MotionToken;                      // VPB: hover effect dropdown
    enter?: MotionToken;                      // VPB: enter animation
    ambient?: MotionToken;                    // VPB: idle animation
  };
  bevel: { level: BevelToken };               // VPB: bevel intensity
  glow: { color?: GlowToken; intensity?: number };  // VPB: glow controls
}
```

**VPB exposes EACH of these as UI controls. User edits → VPB writes code.**

---

## PRE-CODE CHECKLIST (Before Writing Any .svelte)

### For New Block Kinds

- [ ] Kind name decided (`panel`, `widget`, `chatDock`, etc.)
- [ ] Purpose documented in one sentence
- [ ] Slots defined (`root`, `header`, `body`, etc.)
- [ ] Layout mode determined (`grid` | `flex` | `none`)

### For New Visual Styles

- [ ] Check if existing tokens cover the need
- [ ] If not, add to `tokens/tokens.ts` (NEVER directly to tokens.css)
- [ ] Run `pnpm ds:tokens:build` to regenerate

### For New Recipes

- [ ] Recipe ID follows pattern: `{kind}.{surface}.{variant}`
- [ ] Recipe accepts DsSurfaceProps (composable, not hardcoded)
- [ ] Default values provided for all props
- [ ] Classes use only preset utilities (no arbitrary values)
- [ ] If JS effects needed, add to `requires: []`

### For VPB Integration

- [ ] All recipe props are VPB-enumerable (union types, not strings)
- [ ] Default prop values specified for VPB preview
- [ ] New recipe appears in VPB palette

---

## POST-CODE CHECKLIST (After Making Changes)

### Token Compliance

- [ ] No raw colors (`#fff`, `oklch()`, `rgb()`, `hsl()`)
- [ ] All colors reference `--dp-*` tokens or `dp-*` Tailwind classes
- [ ] No hardcoded spacing values

### Tailwind Compliance

- [ ] No arbitrary values (`bg-[#fff]`, `text-[12px]`, etc.)
- [ ] All classes come from preset or recipe output
- [ ] Recipe files included in tailwind content config

### Component Compliance

- [ ] No `<style>` blocks in primitives
- [ ] No `<style>` blocks in renderers (use recipe classes)
- [ ] No component-scoped CSS variables (`--dp-panel-bg`)
- [ ] No inline `style=` attributes (except allowlisted)

### Registry Compliance

- [ ] New kinds registered in `taxonomy/kinds.ts`
- [ ] New contracts registered in `taxonomy/contracts.ts`
- [ ] New slots registered in `taxonomy/slots.ts`
- [ ] New recipes registered in `recipes/index.ts`

### VPB Compliance

- [ ] New kinds appear in VPB palette
- [ ] Default props set for new kinds
- [ ] Property controls use enums only (no text inputs for colors)
- [ ] VPB can enumerate all valid values for each prop

### Shell/Layout Compliance

- [ ] Shell kinds use CSS Grid (not flexbox)
- [ ] Dashboard widgets use CSS Grid
- [ ] Flexbox only for inline content (buttons, icons)

---

## COMPOSABLE RECIPE EXAMPLE

**Wrong approach (static):**
```typescript
// ❌ BAD - hardcoded, not composable
const buttonRecipe = {
  id: "button.glass.default",
  classes: () => "bg-dp-glass-deep border-dp-teal-500 shadow-dp-glow-teal"
};
```

**Correct approach (composable):**
```typescript
// ✅ GOOD - composable via VPB
const buttonRecipe = {
  id: "button.glass.default",
  defaults: {
    color: { a: "teal" },
    finish: "glass",
    frame: "soft",
    depth: "z2",
    motion: { hover: "lift" },
    bevel: { level: "soft" },
    glow: { color: "teal", intensity: 0.5 }
  },
  classes: (props: DsSurfaceProps) => ({
    root: [
      `bg-dp-glass-${props.finish}`,
      `border-dp-${props.color.a}-500`,
      `shadow-dp-${props.depth}`,
      props.glow.color && `shadow-dp-glow-${props.glow.color}`,
      props.bevel.level && `shadow-dp-bevel-${props.bevel.level}`
    ].filter(Boolean).join(" ")
  }),
  requires: props => props.motion.hover === "glow-track" ? ["glowTrack"] : []
};
```

**VPB usage:**
1. User drags "Glass Button" onto canvas
2. VPB shows controls: Color (dropdown), Glow (dropdown), Motion (dropdown)
3. User changes Color from "teal" to "purple"
4. VPB updates the live preview
5. User clicks "Save as Preset" → creates "button.glass.myPurple"
6. New recipe is registered and available everywhere

---

## QUICK GREP CHECKS

Run these to verify compliance:

```bash
# No CSS vars in renderers
grep -rE "var\(--" src/lib/design/renderers/ --include="*.svelte"
# Should return NOTHING

# No arbitrary Tailwind values
grep -rE 'class="[^"]*\[[^"]*\]' src/lib/design/ --include="*.svelte"
# Should return NOTHING

# No <style> blocks in primitives
grep -rE "<style" src/lib/design/primitives/ --include="*.svelte"
# Should return NOTHING

# No inline styles in renderers
grep -rE 'style="[^"]*"' src/lib/design/renderers/ --include="*.svelte"
# Should return NOTHING
```

---

## ENFORCEMENT (VITE PLUGIN WATCHER - MANDATORY)

**NOT optional scripts. Vite plugin that BLOCKS builds on violation.**

```
src/vite/
├── ds-enforce.plugin.ts    # THE KILL SWITCH - Vite plugin
└── ds-enforce.rules.ts     # Violation detection rules
```

### What the Vite Plugin Does

1. **Watch Mode**: Runs on every file save during `pnpm dev`
2. **Build Mode**: Runs before build, FAILS build on violation
3. **Real-time Errors**: Shows violations in terminal AND browser overlay

### Violations That BLOCK Build

| Violation | Detection Pattern |
|-----------|-------------------|
| CSS vars in renderers | `var(--` in `renderers/*.svelte` |
| Arbitrary Tailwind | `[` in class attributes |
| `<style>` in primitives | `<style` in `primitives/*.svelte` |
| Inline styles in renderers | `style="` in `renderers/*.svelte` |
| Raw colors | `#[0-9a-f]`, `oklch(`, `rgb(`, `hsl(` outside tokens |
| Unregistered recipe | Recipe ID not in registry |
| Unregistered kind | Kind not in taxonomy |

### Plugin Config (vite.config.ts)

```typescript
import { dsEnforce } from './src/vite/ds-enforce.plugin';

export default defineConfig({
  plugins: [
    dsEnforce({
      strict: true,        // BLOCK on violations
      watch: true,         // Real-time in dev
      overlay: true,       // Show in browser
      paths: {
        primitives: 'src/lib/design/primitives',
        renderers: 'src/lib/design/renderers',
        tokens: 'src/lib/design/tokens',
        recipes: 'src/lib/design/recipes'
      }
    }),
    // ... other plugins
  ]
});
```

---

## 6-STAGE GATE (Reference)

Before ANY renderer `.svelte` can exist:

1. **Stage 0 - Naming**: Kind name + slots defined
2. **Stage 1 - Tokens**: Semantic tokens exist in `tokens.ts`
3. **Stage 2 - Taxonomy**: Kind + contract + slots registered
4. **Stage 3 - Recipe**: Recipe ID + composable props + defaults defined
5. **Stage 4 - VPB**: Block in palette with prop controls
6. **Stage 5 - Renderer**: NOW you can create `.svelte`

**If any stage fails: STOP. Fix registry first.**

**Vite plugin enforces this: unregistered renderer = build failure.**

---

## COMMON VIOLATIONS & FIXES

| Violation | Wrong | Right |
|-----------|-------|-------|
| Raw color | `bg-[#00ff00]` | `bg-dp-teal-500` |
| Arbitrary value | `p-[13px]` | `p-dp-4` |
| Component CSS var | `--dp-panel-bg` | Use recipe classes |
| Inline style | `style="color: red"` | Use data-* + recipe CSS |
| Self-styling component | `<style>` in renderer | Classes from recipe |
| Flexbox shell | `flex` on appShell | `grid grid-rows-shell` |
| Static recipe | Hardcoded class string | Composable props + defaults |
| Non-enumerable prop | `color: string` | `color: ColorToken` |

---

## VPB WRITES CODE

This is the key insight: **VPB is a code generator, not just a previewer.**

When a user configures a component in VPB:
1. VPB renders a live preview using the composable recipe
2. User adjusts props via UI controls (dropdowns, sliders)
3. VPB generates the actual Svelte code with those props
4. User can save as a new recipe variant for reuse

**VPB output example:**
```svelte
<!-- Generated by VPB -->
<GlassButton
  color={{ a: "purple", b: "magenta" }}
  motion={{ hover: "lift", ambient: "pulse" }}
  glow={{ color: "purple", intensity: 0.7 }}
>
  Click Me
</GlassButton>
```

This is how a junior dev uses the system - they don't write CSS, they compose via VPB.
