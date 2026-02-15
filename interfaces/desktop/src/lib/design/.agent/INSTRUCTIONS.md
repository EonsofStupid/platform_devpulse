# COLD LIGHT Design System — AI Agent Instructions

> **READ THIS ENTIRE FILE BEFORE TOUCHING ANY CODE.**
> Violations = immediate rejection. No exceptions.

---

## WHAT IS THIS SYSTEM?

**DevPulse is an enterprise SaaS platform with a NO-CODE visual design system.**

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | SvelteKit 5 | App framework, routing, SSR, runes |
| **Behavior** | MeltUI | Headless primitives (accessibility, keyboard, focus) |
| **Styling** | Tailwind CSS | Utility classes, JIT compilation |
| **Values SSOT** | `tokens.ts` | Colors, spacing, shadows - SINGLE SOURCE OF TRUTH |
| **Visual Composition** | VPB (Visual Page Builder) | No-code tool that composes BlockNodes |

**This is NOT:**
- A portable design system
- A component library for external consumption
- Framework-agnostic

**This IS:**
- DevPulse's internal design system
- Tightly coupled to SvelteKit 5 + MeltUI + Tailwind
- Driven by VPB for no-code visual editing

---

## THE CSS RULES (NON-NEGOTIABLE)

### ✅ ALLOWED TO MANUALLY EDIT:
```
src/lib/design/recipes/css/keyframes.css  ← ONLY THIS CSS FILE
```

### ❌ NEVER MANUALLY EDIT (GENERATED):
```
src/lib/design/tokens/tokens.css          ← Generated from tokens.ts
src/lib/design/recipes/css/surfaces.gen.css ← Generated from tokens.ts
src/lib/design/tokens/types.ts            ← Generated from tokens.ts
src/lib/design/tokens/tailwind.preset.ts  ← Generated from tokens.ts
```

### HOW STYLING WORKS:
1. **tokens.ts** = Define values (colors, spacing, etc.)
2. **Run generator** = `pnpm ds:tokens:build`
3. **surfaces.gen.css** = Uses `data-*` attribute selectors
4. **Components** = Apply `data-surface`, `data-variant`, `data-glow`, etc.
5. **Tailwind** = Layout utilities (flex, grid, padding, etc.)

**Example correct component:**
```svelte
<div
  class="dp-surface p-4 flex items-center gap-2"
  data-surface="glass"
  data-variant="deep"
  data-glow="teal"
>
  Content
</div>
```

**Example WRONG component:**
```svelte
<!-- ❌ NEVER DO THIS -->
<div class="bg-[#00ff00] text-[12px]">
<div style="background: oklch(...)">
```

---

## REGISTRY-FIRST ARCHITECTURE

**Nothing exists until registries define it.**

```
tokens.ts (SSOT)
    ↓
taxonomy/kinds.ts (what blocks exist)
    ↓
taxonomy/contracts.ts (prop schemas)
    ↓
recipes/index.ts (how it looks)
    ↓
VPB registration (palette + defaults)
    ↓
renderers/*.svelte (LAST - applies recipe classes only)
```

### THE 6-STAGE GATE

Before ANY renderer `.svelte` can be created:

| Stage | Check | Location |
|-------|-------|----------|
| 0 | Name + Intent defined | Documentation |
| 1 | Tokens exist in `tokens.ts` | `src/lib/design/tokens/tokens.ts` |
| 2 | Kind + Contract defined | `src/lib/design/taxonomy/` |
| 3 | Recipe defined | `src/lib/design/recipes/` |
| 4 | VPB palette + defaults | `src/lib/sys/debug/vpb/` |
| 5 | THEN create renderer | `src/lib/design/renderers/` |
| 6 | CI enforcement passes | Build scripts |

**If any stage fails: STOP. Fix registries first.**

---

## VPB (VISUAL PAGE BUILDER)

VPB is the NO-CODE tool for visual composition. It lives at:
```
src/lib/sys/debug/vpb/
```

**VPB composes BlockNodes:**
```typescript
type BlockNode<K extends BlockKind> = {
  id: string;
  kind: K;                    // From taxonomy
  recipe: AllowedRecipe<K>;   // From recipes registry
  props: KindProps<K>;        // From contracts
  slots?: Record<SlotName<K>, BlockNode[]>;
}
```

**VPB NEVER stores:**
- CSS classnames
- Raw color values
- Inline styles

**VPB inspector shows:**
- Enum dropdowns (from token arrays)
- Recipe selectors
- Slot composition

---

## COMPONENT LOCATIONS

| Type | Location | Purpose |
|------|----------|---------|
| **Primitives** | `src/lib/design/primitives/` | MeltUI wrappers ONLY |
| **Components** | `src/lib/design/components/` | Styled compositions (use primitives + recipes) |
| **Renderers** | `src/lib/design/renderers/` | VPB block renderers |
| **Plugins** | `src/lib/design/plugins/` | Special branded components (Parasite logo, etc.) |

### MELTUI IMPORT RULE
```typescript
// ✅ ALLOWED - only in primitives/
import { Button } from "meltui";

// ❌ FORBIDDEN - anywhere else
import { Dialog } from "meltui"; // NOT in components, renderers, domains
```

---

## DATA ATTRIBUTE PATTERN

Styling is driven by `data-*` attributes, NOT class manipulation:

```svelte
<div
  class="dp-surface"
  data-surface="glass"      <!-- glass | matte | solid -->
  data-variant="deep"       <!-- void | deep | smoke | frost -->
  data-role="panel"         <!-- button | input | panel | card -->
  data-tint="teal"          <!-- teal | purple | gold | coral -->
  data-glow="teal"          <!-- teal | purple | magenta | ember | frost -->
  data-bevel="subtle"       <!-- off | subtle | soft | medium -->
  data-size="md"            <!-- sm | md | lg -->
  data-state={isOpen ? "open" : "closed"}
>
```

**CSS in surfaces.gen.css:**
```css
.dp-surface[data-surface="glass"][data-variant="deep"] {
  background: var(--glass-deep);
  /* ... */
}
```

---

## TOKEN PIPELINE

```
tokens.ts (EDIT THIS)
    ↓ pnpm ds:tokens:build
    ↓
├── tokens.css (CSS custom properties)
├── types.ts (TypeScript types)
├── tailwind.preset.ts (Tailwind theme)
└── surfaces.gen.css (Recipe CSS)
```

### Adding a new token:
1. Edit `src/lib/design/tokens/tokens.ts`
2. Run `pnpm ds:tokens:build`
3. Use in recipes via `var(--your-token)`

### Token naming convention:
```typescript
// In tokens.ts
export const myCategory = {
  myToken: { l: 0.50, c: 0.15, h: 195 },  // OKLCH
} as const;

// Generates:
// --my-category-my-token: oklch(50% 0.15 195);
```

---

## FORBIDDEN PATTERNS

### 1. No hardcoded values
```svelte
❌ class="bg-[#00ff00]"
❌ style="color: red"
❌ oklch(0.5 0.1 200) anywhere in .svelte
```

### 2. No arbitrary Tailwind values
```svelte
❌ class="text-[12px]"
❌ class="grid-cols-[auto,1fr]"
❌ ANY [...] bracket pattern
```

### 3. No CSS custom properties in components
```svelte
❌ style="--my-color: blue"
❌ var(--*) token references in component code (only in generated CSS)
```

### 4. No MeltUI outside primitives/
```typescript
❌ import { Dialog } from "meltui" // in components/
```

### 5. No visual event handlers without recipe.requires
```svelte
❌ onmousemove for glow tracking (use action)
✅ onclick for behavior (allowed)
```

---

## KEYFRAMES RULES

`keyframes.css` is the ONLY manually written CSS.

**ALLOWED in keyframes:**
- `transform` (translateX, scale, rotate)
- `opacity`
- `filter` with token vars only
- `background-position`

**FORBIDDEN in keyframes:**
- Colors (`#fff`, `oklch()`, `rgb()`)
- Shadows
- Hardcoded sizes
- Any visual value

**Example:**
```css
/* ✅ Correct */
@keyframes dp-fade-in {
  0% { opacity: 0; }
  100% { opacity: 1; }
}

/* ❌ Wrong */
@keyframes dp-glow {
  0% { box-shadow: 0 0 10px #00ff00; }
}
```

---

## SELF-CHECK COMMANDS

Run these before ANY commit:

```bash
# 1) No raw colors in design system
grep -rE "(#[0-9a-fA-F]{3,}|oklch\\(|rgb\\(|hsl\\()" src/lib/design --include="*.ts" --include="*.svelte"

# 2) No arbitrary Tailwind values
grep -rE "\\[[^\\]]+\\]" src/lib/design --include="*.ts" --include="*.svelte"

# 3) No meltui outside primitives
grep -r "from ['\"]meltui['\"]" src/lib --include="*.ts" --include="*.svelte" | grep -v "primitives"

# 4) Tokens pipeline clean
pnpm ds:tokens:build
```

**All commands MUST return empty or succeed.**

---

## QUICK REFERENCE

| I want to... | Do this |
|--------------|---------|
| Add a color | Edit `tokens.ts` → run generator |
| Add a keyframe | Edit `keyframes.css` |
| Add a surface variant | Edit `tokens.ts` + generator updates `surfaces.gen.css` |
| Create a component | Use `data-*` attributes + Tailwind layout classes |
| Wrap MeltUI | Only in `primitives/` folder |
| Add block to VPB | Taxonomy → Recipe → VPB palette → Renderer |

---

## RECIPES ARE REUSABLE PRESETS (CRITICAL)

**Recipes are NOT component-specific. They are a LIBRARY of visual presets.**

### Example: Glitch Pulse Effect
```
WRONG: Build glitch effect directly into VPB FAB component
RIGHT: Create "glitch-pulse" RECIPE that ANY entity can use
```

### Recipe Library Concept
```typescript
// Recipes are presets that can be applied to ANY element:
recipes = {
  "effect.glitch-pulse": {
    // Sporadic glitch that randomly triggers
    animation: "dp-glitch-pulse",
    trigger: "sporadic",  // random interval
  },
  "effect.cyber-glow": {
    // Cyber green glow on interaction
    glow: "cyber",
    trigger: "hover" | "click",
  },
  "surface.glass.deep": {
    // Deep glass surface preset
    surface: "glass",
    variant: "deep",
  }
}
```

### How Components Use Recipes
```svelte
<!-- VPB FAB uses recipes, doesn't own them -->
<button
  class="dp-surface"
  data-surface="glass"
  data-effect="glitch-pulse"    <!-- Recipe preset -->
  data-glow="cyber"             <!-- Recipe preset -->
>
```

### Building the Recipe Library
When you need an effect:
1. **Check if recipe exists** - search recipes/
2. **If missing, CREATE THE RECIPE FIRST** - not in the component
3. **Add keyframe to keyframes.css** - if animation needed
4. **Add tokens to tokens.ts** - if new values needed
5. **Component just applies data-* attributes**

### What Goes Where
| Visual Effect | Location | NOT Here |
|--------------|----------|----------|
| Glitch animation | `recipes/` + `keyframes.css` | Component |
| Cyber glow color | `tokens.ts` | Component |
| Pulse timing | `recipes/` | Component |
| Sporadic trigger | `recipes/actions/` | Component |

---

## REMEMBER

1. **tokens.ts is SSOT** - edit this, run generator
2. **keyframes.css is ONLY manual CSS** - motion only, no visuals
3. **data-* attributes** - how styling is applied
4. **MeltUI only internal/** - nowhere else
5. **VPB never stores CSS** - only kind + recipe + props
6. **No arbitrary Tailwind** - no `[...]` brackets ever
7. **Recipes are REUSABLE** - effects belong in recipe library, not components
8. **Components CONSUME recipes** - they don't own visual effects
