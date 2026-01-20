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
| Generation | **Style Dictionary v4** | DTCG-compliant token transformation |
| Composition | **VPB** | Visual Page Builder - NO-CODE driven composition |

---

## AUTHORITATIVE DOCUMENTATION

For detailed specifications, see these files:

| Document | Purpose |
|----------|---------|
| [CONTRACT_SYSTEM.md](../CONTRACT_SYSTEM.md) | DsCoreProps, DsSurfaceProps, Kind Registry, SurfacePolicy |
| [TOKEN_PIPELINE.md](../TOKEN_PIPELINE.md) | SD4 + DTCG integration, token generation flow |
| [PRESET_SYSTEM.md](../PRESET_SYSTEM.md) | Preset definition, merge order, UI modes |
| [VITE_PLUGIN_SPEC.md](../VITE_PLUGIN_SPEC.md) | Vite plugin responsibilities, virtual modules |
| [AUTHORING.md](../AUTHORING.md) | How to author new kinds, recipes, actions |
| [STYLE_GUIDE.md](../STYLE_GUIDE.md) | Code rules + enforcement |
| [CHECKLIST.md](../CHECKLIST.md) | Pre/post code checks |

---

## CORE ARCHITECTURE TRUTHS

| Truth | Enforcement |
|-------|-------------|
| Tokens store VALUES | Generator is only source |
| Recipes store DECISIONS | Recipe registry is SSOT |
| VPB nodes are typed + enum-only | Zod strict everywhere |
| Renderers apply outputs | No styling in components |
| Actions attach via `recipe.requires[]` | Auto-attached by renderer |
| Strict validation at every boundary | VPB + Renderer + DB load |

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

## CONTRACT ARCHITECTURE (Three Tiers)

| Tier | Scope | What It Contains |
|------|-------|------------------|
| **DsCoreProps** | Universal — safe on EVERY block kind | intent, state, density, visibility, interaction, a11y |
| **DsSurfaceProps** | Surface-capable kinds ONLY | glass/metal/holo, tint/clarity/noise, bevel/depth, frame/ring |
| **Kind-Specific** | Only where they belong | Shell (layout), Input (validation), Chart (data density) |

### SurfacePolicy

```typescript
type SurfacePolicy = "none" | "optional" | "required";
```

| Policy | VPB Behavior |
|--------|--------------|
| `"none"` | Surface UI hidden entirely |
| `"optional"` | Surface shown only in Advanced mode |
| `"required"` | Force at least `materialFamily` default |

---

## TERMINOLOGY (Industry 2026 Correct)

| Term | What It Is | CSS Driver |
|------|------------|------------|
| **opacity** | Layer alpha — element fade | `opacity: 0..1` or color alpha |
| **transmittance** | Material see-through strength | Material knob (NOT generic style) |
| **diffusion** | Scatter/milky effect | `backdrop-filter: blur()` + noise |

**BANNED: "transparency"** — It's a perceived result, not a controllable primitive.

---

## FILE RULES (NON-NEGOTIABLE)

### FILES YOU CAN MANUALLY EDIT:
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

### FILES YOU MUST NEVER MANUALLY EDIT (GENERATED):
```
src/lib/design/tokens/tokens.css         ← Generated from tokens.ts
src/lib/design/tokens/types.ts           ← Generated from tokens.ts
src/lib/design/tokens/tailwind.preset.ts ← Generated from tokens.ts
src/lib/design/recipes/css/surfaces.gen.css ← Generated from tokens.ts
```

After editing `tokens.ts`, ALWAYS run: `pnpm ds:tokens:build`

---

## PRESET MERGE ORDER (Non-Negotiable)

When VPB renders a node:

```
1. Kind contract defaults
2. Preset props
3. Node overrides (from VPB)
4. Validate with Zod schema
```

```typescript
finalProps = merge(defaultProps, preset.props, node.props)
schema.parse(finalProps) // strict
```

---

## RECIPES ARE A REUSABLE PRESET LIBRARY

### What Recipes Are
Recipes are **NOT component-specific**. They are a **LIBRARY of visual presets** that ANY element can use.

### Recipe Structure

```typescript
export const panelGlassRecipe = {
  id: "panel.glass",
  requires: ["glowTrack"], // Actions auto-attached by renderer
  classes: (props: PanelRecipeProps) => {
    const s = props.surface;
    const clarity = s?.clarity ?? "clean";
    const blur = s?.backdropBlur ?? "md";
    return {
      root: `cl-panel-base cl-glass-clarity-${clarity} cl-backdrop-${blur}`,
      header: "cl-panel-header",
      content: "cl-panel-content",
      footer: "cl-panel-footer",
    };
  },
} as const;
```

### How Components CONSUME Recipes
```svelte
<div
  class="dp-surface"
  data-surface="glass"
  data-variant="deep"
  data-effect="glitch-pulse"
  data-glow="cyber"
>
```

---

## THE DATA ATTRIBUTE PATTERN

Styling is driven by `data-*` attributes, NOT by class manipulation or inline styles.

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

---

## VPB (VISUAL PAGE BUILDER)

### What VPB Is
VPB is a **NO-CODE** dev tool at `src/lib/sys/debug/vpb/`.

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

---

## KEYFRAMES.CSS RULES

`keyframes.css` is the **ONLY** manually written CSS file.

### ALLOWED in keyframes:
- `transform` (translateX, translateY, scale, rotate)
- `opacity`
- `filter` with token vars only
- `background-position`

### FORBIDDEN in keyframes:
- Colors (`#fff`, `oklch()`, `rgb()`, `hsl()`)
- Box shadows
- Hardcoded pixel sizes
- Any visual value that should be a token

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

## BITS UI IMPORT RULE

### ALLOWED — only in `primitives/`
```typescript
// src/lib/design/primitives/Button.svelte
import { Button } from "bits-ui";
```

### FORBIDDEN — anywhere else
```typescript
// src/lib/design/components/MyComponent.svelte
import { Dialog } from "bits-ui";  // ❌ NOT ALLOWED
```

---

## FOLDER STRUCTURE

```
src/lib/design/
├── .agent/
│   └── INSTRUCTIONS.md
├── .claude/
│   └── CLAUDE.md           # THIS FILE
├── CONTRACT_SYSTEM.md      # Contract architecture
├── TOKEN_PIPELINE.md       # SD4 + DTCG pipeline
├── PRESET_SYSTEM.md        # Preset merge order
├── VITE_PLUGIN_SPEC.md     # Vite plugin spec
├── AUTHORING.md            # How to author
├── STYLE_GUIDE.md          # Code rules
├── CHECKLIST.md            # Pre/post checks
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
│       ├── glowTrack.ts
│       ├── ripple.ts
│       └── sporadicPulse.ts
├── primitives/             # Bits UI wrappers ONLY
├── components/             # Styled compositions
└── renderers/              # VPB block renderers
```

---

## COMMANDS REFERENCE

### Token Pipeline
```bash
pnpm ds:tokens:build    # Generate all token outputs
pnpm ds:tokens:watch    # Watch mode
```

### Verification
```bash
# No raw colors
grep -rE "(#[0-9a-fA-F]{3,}|oklch\\(|rgb\\(|hsl\\()" src/lib/design --include="*.svelte"

# No arbitrary Tailwind
grep -rE "\\[[^\\]]+\\]" src/lib/design --include="*.svelte"

# No bits-ui outside primitives
grep -r "from ['\"]bits-ui['\"]" src/lib --include="*.svelte" | grep -v "primitives"
```

---

## V1 LOCK CHECKLIST

Non-negotiable foundation requirements:

- [ ] DTCG export + SD4 generation always on
- [ ] Strict Zod validation everywhere
- [ ] Registry-first virtual modules
- [ ] Preset merge order fixed (kind defaults → preset props → node overrides)
- [ ] Basic vs Advanced is UI-only (never schema changes)
- [ ] Surface props only on surface kinds
- [ ] No arbitrary Tailwind `[...]` ever
- [ ] No raw values in components ever
- [ ] No inline CSS vars in renderers ever
- [ ] Shell kinds enforce `layoutMode: "grid"`

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

**This is the canonical system context for Claude AI.**
