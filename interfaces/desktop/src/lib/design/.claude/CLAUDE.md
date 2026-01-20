# COLD LIGHT Design System — Claude AI Context

> **This document exists so Claude can fully understand this system after context compaction.**
> Read this ENTIRE file before touching ANY code in the design system.

---

## SYSTEM IDENTITY

**What is this?**
- DevPulse is an **enterprise SaaS platform**
- This is DevPulse's **internal design system** called "COLD LIGHT" (also "Maestro")
- It is **NOT** a portable component library for external use
- It is **NOT** framework-agnostic

**Technology Stack (LOCKED - NO SUBSTITUTIONS):**
| Layer | Technology | Purpose |
|-------|------------|---------|
| Framework | **SvelteKit 5** | App framework, SSR, runes ($state, $derived, $props) |
| Behavior | **Bits UI** | Headless primitives (accessibility, keyboard, focus) |
| Styling | **Tailwind CSS** | Utility classes, JIT compilation |
| Values | **tokens.ts** | SINGLE SOURCE OF TRUTH for all design values |
| Composition | **VPB** | Visual Page Builder - NO-CODE driven composition |

**The Core Pattern:**
```
VPB (Visual Page Builder) → composes BlockNodes → Renderer applies recipes → User sees UI
```

VPB is a NO-CODE tool. Users don't write code. They select blocks, recipes, and props from dropdowns.

---

## THE MENTAL MODEL (CRITICAL)

### You are NOT building "components"

You are building:
1. **Token System** — Values (colors, spacing, shadows) in `tokens.ts`
2. **Recipe System** — Visual presets that ANY element can use
3. **Block System** — VPB-composable structural units
4. **Contract System** — Typed props with schema validation

### The Flow
```
tokens.ts (SSOT)
    ↓ pnpm ds:tokens:build
    ↓
├── tokens.css (CSS custom properties)
├── types.ts (TypeScript types)
├── tailwind.preset.ts (Tailwind theme mapping)
└── surfaces.gen.css (Recipe CSS with data-* selectors)
    ↓
Components apply data-* attributes
    ↓
CSS rules match and apply styles
```

---

## FILE RULES (NON-NEGOTIABLE)

### ✅ FILES YOU CAN MANUALLY EDIT:
```
src/lib/design/tokens/tokens.ts          ← SSOT for all values
src/lib/design/recipes/css/keyframes.css ← ONLY manually written CSS (motion only)
src/lib/design/taxonomy/*.ts             ← Kind definitions
src/lib/design/recipes/*.ts              ← Recipe definitions
src/lib/design/recipes/actions/*.ts      ← Svelte actions for effects
src/lib/design/primitives/*.svelte       ← Bits UI wrappers ONLY
src/lib/design/components/*.svelte       ← Styled compositions
src/lib/design/renderers/*.svelte        ← VPB block renderers
```

### ❌ FILES YOU MUST NEVER MANUALLY EDIT (GENERATED):
```
src/lib/design/tokens/tokens.css         ← Generated from tokens.ts
src/lib/design/tokens/types.ts           ← Generated from tokens.ts
src/lib/design/tokens/tailwind.preset.ts ← Generated from tokens.ts
src/lib/design/recipes/css/surfaces.gen.css ← Generated from tokens.ts
```

After editing `tokens.ts`, ALWAYS run: `pnpm ds:tokens:build`

---

## RECIPES ARE A REUSABLE PRESET LIBRARY (MOST IMPORTANT CONCEPT)

### What Recipes Are
Recipes are **NOT component-specific**. They are a **LIBRARY of visual presets** that ANY element can use.

### Example: Glitch Pulse Effect
```
❌ WRONG: Build glitch effect directly into VPB FAB component
✅ RIGHT: Create "glitch-pulse" RECIPE in the library, VPB FAB just consumes it
```

### Recipe Library Structure
```typescript
// Recipes are presets applicable to ANY element:
"effect.glitch-pulse"     // Sporadic glitch animation
"effect.cyber-glow"       // Neon green glow on interaction
"effect.ripple"           // Click ripple effect
"surface.glass.deep"      // Deep glass surface preset
"surface.glass.void"      // Void glass surface preset
"surface.matte.dark"      // Dark matte surface preset
```

### How Components CONSUME Recipes
```svelte
<!-- Component doesn't OWN the effect, it USES a recipe -->
<button
  class="dp-surface"
  data-surface="glass"
  data-variant="deep"
  data-effect="glitch-pulse"
  data-glow="cyber"
>
```

### What Goes Where
| Visual Element | Location | NEVER Here |
|----------------|----------|------------|
| Glitch animation keyframe | `keyframes.css` | Component |
| Glitch animation trigger | `recipes/actions/` | Component |
| Cyber glow color value | `tokens.ts` | Component |
| Glass surface styles | `surfaces.gen.css` (generated) | Component |
| Sporadic random timing | `recipes/actions/sporadicPulse.ts` | Component |

### The Recipe Creation Flow
When you need a visual effect:
1. **Check if recipe exists** — search `recipes/`
2. **If missing, CREATE THE RECIPE FIRST** — not in the component
3. **Add keyframe to keyframes.css** — if animation needed (motion only, no colors)
4. **Add tokens to tokens.ts** — if new values needed
5. **Add action to recipes/actions/** — if JS behavior needed (sporadic trigger, glow tracking)
6. **Component just applies data-* attributes** — it CONSUMES, doesn't own

---

## THE DATA ATTRIBUTE PATTERN

Styling is driven by `data-*` attributes on elements, NOT by class manipulation or inline styles.

### Available Attributes
```svelte
<div
  class="dp-surface"           <!-- Base class for surfaces -->
  data-surface="glass"         <!-- glass | matte | solid -->
  data-variant="deep"          <!-- void | deep | smoke | frost -->
  data-role="panel"            <!-- button | input | panel | card | scrim -->
  data-tint="teal"             <!-- teal | purple | gold | coral -->
  data-glow="cyber"            <!-- off | teal | purple | magenta | ember | frost | cyber -->
  data-bevel="subtle"          <!-- off | subtle | soft | medium | inset | deep -->
  data-size="md"               <!-- sm | md | lg -->
  data-effect="glitch-pulse"   <!-- Recipe effect preset -->
  data-state={isOpen ? "open" : "closed"}
>
```

### How It Works
`surfaces.gen.css` contains rules like:
```css
.dp-surface[data-surface="glass"][data-variant="deep"] {
  background: var(--dp-glass-deep);
  backdrop-filter: blur(var(--dp-blur-md));
  /* ... */
}

.dp-surface[data-glow="cyber"] {
  box-shadow: 0 0 20px var(--dp-accent-cyber);
}
```

---

## KEYFRAMES.CSS RULES

`keyframes.css` is the **ONLY** manually written CSS file.

### ✅ ALLOWED in keyframes:
- `transform` (translateX, translateY, scale, rotate)
- `opacity`
- `filter` with token vars only (e.g., `blur(var(--dp-blur-md))`)
- `background-position` (for gradient animations)

### ❌ FORBIDDEN in keyframes:
- Colors (`#fff`, `oklch()`, `rgb()`, `hsl()`)
- Box shadows
- Hardcoded pixel sizes (use transforms)
- Any visual value that should be a token

### Example
```css
/* ✅ CORRECT — motion only */
@keyframes dp-glitch-pulse {
  0%, 100% { transform: translate(0, 0); opacity: 1; }
  25% { transform: translate(-2px, 1px); opacity: 0.9; }
  50% { transform: translate(2px, -1px); opacity: 0.95; }
  75% { transform: translate(-1px, 2px); opacity: 0.85; }
}

/* ❌ WRONG — has color value */
@keyframes dp-glow {
  0% { box-shadow: 0 0 10px oklch(0.91 0.16 126); }
}
```

---

## TOKENS THAT EXIST (REFERENCE)

### Accent / Cyber (The VPB signature color)
```typescript
accent: {
  cyber: { l: 0.9106, c: 0.1598, h: 126.64 },  // Neon lime green
  tint: { l: 0.9106, c: 0.1598, h: 126.64, a: 0.15 },
}
// CSS: --dp-accent-cyber, --dp-accent-tint
```

### Glass Surfaces
```typescript
glass: {
  void: { l: 0.06, c: 0.02, h: 195, a: 0.92 },
  deep: { l: 0.10, c: 0.04, h: 195, a: 0.88 },
  smoke: { l: 0.15, c: 0.03, h: 200, a: 0.82 },
  frost: { l: 0.25, c: 0.02, h: 210, a: 0.75 },
}
```

### Glass Tints
```typescript
glassTint: {
  teal: { l: 0.55, c: 0.15, h: 195, a: 0.4 },
  purple: { l: 0.50, c: 0.18, h: 280, a: 0.4 },
  gold: { l: 0.60, c: 0.15, h: 50, a: 0.4 },
  coral: { l: 0.55, c: 0.18, h: 25, a: 0.4 },
}
```

### VPB Tokens (TO BE ADDED)
These tokens from vpb-tokens.css need to be captured in tokens.ts:
```typescript
vpb: {
  cyberStart: { l: 0.70, c: 0.18, h: 195 },
  cyberEnd: { l: 0.55, c: 0.20, h: 280 },
  panelBg: { l: 0.12, c: 0.04, h: 195, a: 0.95 },
  panelBorder: { l: 0.55, c: 0.12, h: 195, a: 0.6 },
  panelGlow: { l: 0.60, c: 0.15, h: 195, a: 0.3 },
  actionPlay: { l: 0.75, c: 0.18, h: 145 },   // Green
  actionPause: { l: 0.80, c: 0.15, h: 85 },   // Yellow
  actionStop: { l: 0.70, c: 0.20, h: 25 },    // Red
}
```

---

## VPB (VISUAL PAGE BUILDER)

### What VPB Is
VPB is a **NO-CODE** dev tool that lives at `src/lib/sys/debug/vpb/`.

It allows composing UI by:
1. Selecting block kinds from a palette
2. Choosing recipes from dropdowns
3. Setting props via enum selectors (not text inputs)
4. Nesting blocks in slots

### What VPB Stores (BlockNode)
```typescript
type BlockNode<K extends BlockKind> = {
  id: string;
  kind: K;                      // "panel" | "card" | "chatDock" | etc.
  recipe: AllowedRecipe<K>;     // "panel.glass.deep" | etc.
  props: KindProps<K>;          // Typed, schema-validated
  slots?: Record<SlotName<K>, BlockNode[]>;
}
```

### What VPB NEVER Stores
- CSS classnames
- Raw color values (`#fff`, `oklch()`)
- Inline styles
- Theme values

### VPB Components
```
src/lib/sys/debug/vpb/
├── VPB.svelte              # Entry point
├── shell/
│   ├── frame.svelte        # Main container
│   ├── topbar.svelte       # Header with close button
│   ├── tabs.svelte         # Inspector/Builder tabs
│   └── toolbar.svelte      # Action buttons
├── components/
│   ├── builder/            # Block palette + tree
│   └── inspector/          # Prop editing
├── state/
│   └── vpb.svelte.ts       # Runes-based state ($state, $derived)
└── types/
    └── vpb.ts              # Type definitions
```

### VPB FAB (Floating Action Button)
The VPB FAB is the **floating V icon** that appears when VPB is minimized.
- It should use recipes: `data-surface="glass"`, `data-glow="cyber"`, `data-effect="glitch-pulse"`
- The glitch-pulse effect triggers **sporadically** (random intervals)
- On click, it opens a menu: Open VPB, Enable Scan, Settings

---

## FOLDER STRUCTURE

```
src/lib/design/
├── .agent/
│   └── INSTRUCTIONS.md     # AI agent instructions
├── .claude/
│   └── CLAUDE.md           # THIS FILE - comprehensive context
├── tokens/
│   ├── tokens.ts           # ✅ SSOT - edit this
│   ├── tokens.css          # ❌ GENERATED
│   ├── types.ts            # ❌ GENERATED
│   ├── tailwind.preset.ts  # ❌ GENERATED
│   └── schema.ts           # Zod validators
├── taxonomy/
│   ├── kinds.ts            # Block kind definitions
│   ├── contracts.ts        # Prop schemas
│   └── slots.ts            # Slot definitions
├── recipes/
│   ├── index.ts            # Recipe registry
│   ├── css/
│   │   ├── keyframes.css   # ✅ ONLY manual CSS
│   │   └── surfaces.gen.css # ❌ GENERATED
│   └── actions/
│       ├── index.ts        # Action registry
│       ├── glowTrack.ts    # Mouse glow tracking
│       ├── ripple.ts       # Click ripple
│       └── sporadicPulse.ts # Random interval trigger (TO CREATE)
├── primitives/             # Bits UI wrappers ONLY
│   ├── Button.svelte
│   ├── Dialog.svelte
│   ├── Tabs.svelte
│   └── Toggle.svelte
├── components/             # Styled compositions
│   ├── GlassPanel.svelte
│   ├── Card.svelte
│   └── Button.svelte
├── renderers/              # VPB block renderers
│   └── Panel.svelte
└── plugins/
    └── parasite/           # Parasite logo plugin
        └── index.ts
```

---

## BITS UI IMPORT RULE

Bits UI provides headless primitives (accessibility, keyboard, focus management).

### ✅ ALLOWED — only in `primitives/`
```typescript
// src/lib/design/primitives/Button.svelte
import { Button } from "bits-ui";
```

### ❌ FORBIDDEN — anywhere else
```typescript
// src/lib/design/components/MyComponent.svelte
import { Dialog } from "bits-ui";  // ❌ NOT ALLOWED

// src/lib/domains/app/SomePage.svelte
import { Tabs } from "bits-ui";  // ❌ NOT ALLOWED
```

Components in `components/`, `renderers/`, `domains/` must import from `primitives/`, not directly from Bits UI.

---

## FORBIDDEN PATTERNS

### 1. No hardcoded visual values
```svelte
❌ class="bg-[#00ff00]"
❌ style="color: oklch(0.5 0.1 200)"
❌ style="box-shadow: 0 0 10px #fff"
```

### 2. No Tailwind arbitrary values
```svelte
❌ class="text-[12px]"
❌ class="grid-cols-[auto,1fr]"
❌ ANY [...] bracket pattern
```

### 3. No CSS custom properties in components
```svelte
❌ style="--my-var: blue"
❌ Using var(--dp-*) directly in component markup
```
(Token vars are only used in generated CSS, not in component code)

### 4. No visual event handlers without recipe actions
```svelte
❌ onmousemove for glow tracking (should be action)
❌ Manual setInterval for sporadic effects (should be action)
✅ onclick for behavior (allowed)
```

### 5. No styling logic in renderers
```svelte
❌ {#if variant === 'primary'}class="bg-teal-500"{/if}
✅ data-variant={variant}  <!-- Let CSS handle it -->
```

---

## COMMANDS REFERENCE

### Token Pipeline
```bash
pnpm ds:tokens:build    # Generate all token outputs
pnpm ds:tokens:watch    # Watch mode
```

### Verification (Run before commits)
```bash
# No raw colors
grep -rE "(#[0-9a-fA-F]{3,}|oklch\\(|rgb\\(|hsl\\()" src/lib/design --include="*.svelte"

# No arbitrary Tailwind
grep -rE "\\[[^\\]]+\\]" src/lib/design --include="*.svelte"

# No bits-ui outside primitives
grep -r "from ['\"]bits-ui['\"]" src/lib --include="*.svelte" | grep -v "primitives"
```

---

## CURRENT WORK (TODO)

1. **Add VPB tokens to tokens.ts** — cyber gradient endpoints, panel colors, action colors
2. **Add dp-glitch-pulse keyframe** — to keyframes.css (motion only)
3. **Create sporadicPulse action** — in recipes/actions/ for random interval triggers
4. **Create cyber-glow recipe** — in surfaces.gen.css via tokens
5. **Create VPB FAB component** — uses recipes, doesn't own effects
6. **Run token generator** — after tokens.ts changes

---

## SUMMARY — THE 8 RULES

1. **tokens.ts is SSOT** — edit this, run `pnpm ds:tokens:build`
2. **keyframes.css is ONLY manual CSS** — motion only, no visual values
3. **data-* attributes drive styling** — not class manipulation
4. **Bits UI only in primitives/** — nowhere else
5. **VPB never stores CSS** — only kind + recipe + props
6. **No arbitrary Tailwind** — no `[...]` brackets ever
7. **Recipes are REUSABLE** — effects belong in recipe library, not components
8. **Components CONSUME recipes** — they don't own visual effects

---

## QUICK DECISION TREE

**"I need to add a visual effect"**
→ Is it a new color/value? → Add to `tokens.ts`, run generator
→ Is it an animation? → Add keyframe to `keyframes.css` (motion only)
→ Is it triggered by interaction? → Create action in `recipes/actions/`
→ Then: Component applies `data-effect="my-effect"`

**"I need to create a component"**
→ Does it wrap Bits UI? → Put in `primitives/`
→ Does it compose primitives + recipes? → Put in `components/`
→ Is it a VPB block renderer? → Put in `renderers/`

**"I need to add a new block kind"**
→ Add to `taxonomy/kinds.ts`
→ Add contract to `taxonomy/contracts.ts`
→ Add to VPB palette
→ THEN create renderer
