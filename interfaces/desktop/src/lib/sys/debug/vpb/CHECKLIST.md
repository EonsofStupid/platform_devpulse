# VPB Foundation Checklist

> **ZERO TOLERANCE** for shortcuts, legacy patterns, or half-measures.
> This is the 8th rebuild. The foundation MUST be correct.

---

## Industry Architecture: Headless Design System + Recipe-Driven Styling

| Layer | Pattern | Technology | Status |
|-------|---------|------------|--------|
| **Values** | Design Tokens | `tokens.ts` → generator | ✅ EXISTS |
| **Behavior** | Headless UI | MeltUI (primitives/) | ✅ EXISTS |
| **Styling** | Recipe Pattern | `data-*` → CSS selectors | ✅ EXISTS |
| **Validation** | Compound Variants | Zod schemas | ✅ EXISTS |
| **Composition** | Block-Based Editor | VPB BlockNodes | 🔲 INCOMPLETE |
| **Enforcement** | CI Kill Switch | Vite plugin + scripts | ❌ MISSING |

---

## PHASE 0: Foundation Enforcement (MUST COMPLETE FIRST)

### 0.1 Token Pipeline ✅
- [x] `tokens.ts` is SSOT
- [x] `ds-tokens-build.ts` generates outputs
- [x] `tokens.css` generated (never edit)
- [x] `types.ts` generated (never edit)
- [x] `tailwind.preset.ts` generated (never edit)
- [x] `surfaces.gen.css` generated (never edit)

### 0.2 Enforcement Scripts ❌ MISSING
- [ ] `ds-tokens-watch.ts` - Watch mode for dev
- [ ] `scan-violations.ts` - THE KILL SWITCH
  - Scans for raw `oklch()`, `#hex`, `rgb()` in .svelte
  - Scans for arbitrary Tailwind `[...]` brackets
  - Scans for `bits-ui` imports outside primitives/
  - Scans for inline `style=` with visual values
  - **Build FAILS if any violations found**
- [ ] `verify-recipes.ts` - All recipe IDs are registered
- [ ] `verify-kinds.ts` - All kinds have contracts

### 0.3 Vite Plugin ❌ MISSING
```typescript
// vite-plugin-cold-light.ts
// - Runs scan-violations on HMR
// - Blocks build if violations exist
// - Logs warnings in dev mode
```

---

## PHASE 1: Props Registry (Document Before Code)

### 1.1 Base Surface Props (DsSurfaceProps)
| Prop | Type | Values | Status |
|------|------|--------|--------|
| `data-surface` | SurfaceToken | `glass`, `matte`, `solid` | ✅ |
| `data-variant` | GlassVariantToken | `void`, `deep`, `smoke`, `frost` | ✅ |
| `data-role` | RoleToken | `button`, `input`, `panel`, `card`, `scrim` | ✅ |
| `data-tint` | TintToken | `teal`, `purple`, `gold`, `coral` | ✅ |
| `data-glow` | GlowToken | `off`, `teal`, `purple`, `magenta`, `ember`, `frost`, `cyber` | 🔲 cyber MISSING |
| `data-bevel` | BevelToken | `off`, `subtle`, `soft`, `medium`, `inset`, `deep`, `pressed` | ✅ |
| `data-size` | SizeToken | `sm`, `md`, `lg` | ✅ |
| `data-depth` | DepthToken | `1`, `2`, `3`, `4` | ✅ |
| `data-state` | StateToken | `open`, `closed`, `disabled`, `loading` | 🔲 PARTIAL |
| `data-accent` | AccentToken | `teal`, `purple`, `magenta`, `ember`, `frost` | ✅ |

### 1.2 Effect Props (REUSABLE PRESETS)
| Prop | Type | Values | Status |
|------|------|--------|--------|
| `data-effect` | EffectToken | `none`, `glitch-pulse`, `cyber-glow`, `ripple`, `shimmer` | ❌ MISSING |
| `data-trigger` | TriggerToken | `hover`, `click`, `sporadic`, `always` | ❌ MISSING |
| `data-intensity` | IntensityToken | `subtle`, `medium`, `strong` | ❌ MISSING |

### 1.3 Motion Props
| Prop | Type | Values | Status |
|------|------|--------|--------|
| `data-motion-idle` | IdleMotion | `none`, `breathe`, `pulse`, `scan` | ✅ schema |
| `data-motion-hover` | HoverMotion | `none`, `glow`, `lift`, `highlight` | ✅ schema |
| `data-motion-press` | PressMotion | `none`, `sink`, `flash` | ✅ schema |
| `data-motion-focus` | FocusMotion | `none`, `ring`, `glow` | ✅ schema |

---

## PHASE 2: Recipe Library (Effects as Presets)

### 2.1 Surface Recipes ✅ EXISTS
```
panel.glass.default
panel.glass.glow
panel.solid.default
shell.app.default
shell.topBar.default
card.glass.default
```

### 2.2 Effect Recipes ❌ MUST CREATE
These are REUSABLE PRESETS - ANY element can consume them.

| Recipe ID | Description | Requires |
|-----------|-------------|----------|
| `effect.glitch-pulse` | Sporadic glitch animation | `sporadicPulse` action |
| `effect.cyber-glow` | Neon green glow on interaction | `glowTrack` action |
| `effect.ripple` | Click ripple | `ripple` action |
| `effect.shimmer` | Shimmer/scan line | keyframe only |
| `effect.breathe` | Subtle scale breathing | keyframe only |
| `effect.highlight` | Hover highlight | keyframe only |

### 2.3 Keyframes ❌ MUST ADD (motion only)
```css
/* Required in keyframes.css */
@keyframes dp-glitch-pulse { ... }  /* transform + opacity ONLY */
@keyframes dp-cyber-shimmer { ... } /* background-position ONLY */
@keyframes dp-ripple { ... }        /* transform + opacity ONLY */
```

### 2.4 Actions ❌ MUST CREATE
```
recipes/actions/
├── index.ts           ✅ EXISTS
├── types.ts           ✅ EXISTS
├── glowTrack.ts       ❌ MISSING - mouse position → CSS var
├── ripple.ts          ❌ MISSING - click → spawn ripple element
├── sporadicPulse.ts   ❌ MISSING - random interval → trigger class
```

---

## PHASE 3: VPB Block System

### 3.1 Kinds Registry ✅
All defined in `taxonomy/kinds.ts`:
- Shell: `appShell`, `topBar`, `sideNav`, `statusBar`, `dock`
- Surface: `panel`, `card`, `modal`, `glassFrame`, `inputFrame`
- Widget: `widget`, `statMeter`, `chart`
- Chat: `chatDock`, `chatThread`, `chatBubble`

### 3.2 Contracts ✅
All defined in `taxonomy/contracts.ts`:
- `DsSurfacePropsSchema` - base
- `PanelPropsSchema` - extends base
- `ShellPropsSchema` - extends base
- `ChatDockPropsSchema` - extends base
- `WidgetPropsSchema` - extends base

### 3.3 VPB Inspector
Must show ONLY enum dropdowns from token arrays:
- [ ] Surface dropdown → `SurfaceTokens`
- [ ] Variant dropdown → `GlassVariantTokens`
- [ ] Glow dropdown → `GlowTokens`
- [ ] Effect dropdown → `EffectTokens` ❌ MISSING
- [ ] Size dropdown → `SizeTokens`

---

## PHASE 4: VPB Entry Point (FAB)

### 4.1 VPB FAB Component ❌ MUST CREATE
The floating V button that opens VPB.

**Requirements:**
- Location: Fixed position, configurable
- Appearance: Glass surface + cyber glow + glitch-pulse effect
- Interaction: Click opens context menu
- Effects: CONSUMED from recipe library (not owned)

**Props consumed:**
```svelte
<button
  class="dp-surface"
  data-surface="glass"
  data-variant="deep"
  data-glow="cyber"
  data-effect="glitch-pulse"
  data-trigger="sporadic"
>
```

### 4.2 VPB Context Menu
- Open VPB Panel
- Enable Scan Mode
- Toggle Overlay Grid
- Settings

---

## PHASE 5: Z-Index System

| Layer | Z-Index | Purpose |
|-------|---------|---------|
| `base` | 0 | Normal content |
| `dropdown` | 100 | Dropdown menus |
| `sticky` | 200 | Sticky headers |
| `modal` | 300 | Modal dialogs |
| `popover` | 400 | Popovers, tooltips |
| `tooltip` | 500 | Tooltips |
| `toast` | 600 | Toast notifications |
| `overlay` | 700 | Full overlays |
| `vpb` | 800 | VPB always on top ❌ MISSING |
| `vpb-fab` | 900 | VPB FAB highest ❌ MISSING |

---

## PHASE 6: Liquid Glass / Cold Light Presets

From reference images, these visual effects are required:

### 6.1 Glass Surface Presets
- [ ] `glass.void` - Deepest, most transparent
- [ ] `glass.deep` - Standard glass (exists)
- [ ] `glass.smoke` - Slightly lighter (exists)
- [ ] `glass.frost` - Lightest (exists)

### 6.2 Glow Presets
- [ ] `glow.teal` - Teal accent glow (exists)
- [ ] `glow.purple` - Purple accent glow (exists)
- [ ] `glow.cyber` - Neon lime green ❌ MISSING
- [ ] `glow.magenta` - Hot pink (exists)
- [ ] `glow.ember` - Warm orange (exists)

### 6.3 Panel Effects (from references)
- [ ] Inner gradient overlay (teal → transparent)
- [ ] Outer glow on hover
- [ ] Bevel imprint for depth
- [ ] Particle network background ❌ SEPARATE SYSTEM

### 6.4 Dashboard Effects (from references)
- [ ] Gauge/meter rendering
- [ ] Chart glass containers
- [ ] Data visualization panels

---

## ENFORCEMENT RULES (Zero Tolerance)

### NEVER ALLOW:
```svelte
❌ class="bg-[#00ff00]"           // Arbitrary Tailwind
❌ style="color: oklch(...)"      // Inline OKLCH
❌ import { X } from "bits-ui"    // Outside primitives/
❌ onmousemove={handleGlow}       // Manual effect handlers
❌ --custom-var: value            // Component-scoped vars
```

### ALWAYS REQUIRE:
```svelte
✅ class="dp-surface"             // Base class
✅ data-surface="glass"           // Token-driven
✅ data-glow="cyber"              // Recipe preset
✅ data-effect="glitch-pulse"     // Effect preset
✅ use:applyRecipeActions         // Auto-attach actions
```

---

## COMPLETION CRITERIA

### Foundation Complete When:
- [ ] All enforcement scripts exist and pass
- [ ] Vite plugin enforces rules on build
- [ ] Zero violations in `scan-violations.ts` output
- [ ] All props documented in registry
- [ ] All effect recipes created
- [ ] All keyframes added (motion only)
- [ ] All actions created
- [ ] VPB FAB consumes recipes correctly
- [ ] Z-index system includes VPB layers

### Ready for Component Development When:
- [ ] Foundation complete
- [ ] VPB can create BlockNodes
- [ ] Inspector shows enum dropdowns
- [ ] Recipes render correctly
- [ ] Effects trigger correctly

---

## NEXT ACTIONS (Priority Order)

1. **Create enforcement scripts** (scan-violations.ts)
2. **Create Vite plugin** (vite-plugin-cold-light.ts)
3. **Add missing tokens** (glow.cyber, z-vpb, z-vpb-fab)
4. **Add effect keyframes** (dp-glitch-pulse, dp-cyber-shimmer)
5. **Create actions** (sporadicPulse, glowTrack, ripple)
6. **Add effect recipes** (effect.glitch-pulse, etc.)
7. **Create VPB FAB** (consumes recipes)
8. **Update VPB Inspector** (effect dropdowns)

---

## FILE LOCATIONS

```
scripts/dev/design/
├── ds-tokens-build.ts    ✅ EXISTS
├── ds-tokens-watch.ts    ❌ CREATE
├── scan-violations.ts    ❌ CREATE
├── verify-recipes.ts     ❌ CREATE
└── verify-kinds.ts       ❌ CREATE

src/lib/design/
├── tokens/tokens.ts      ✅ SSOT
├── recipes/
│   ├── index.ts          ✅ Recipe registry
│   ├── css/keyframes.css ✅ Manual CSS (motion)
│   └── actions/
│       ├── index.ts      ✅ Action registry
│       ├── sporadicPulse.ts  ❌ CREATE
│       ├── glowTrack.ts      ❌ CREATE
│       └── ripple.ts         ❌ CREATE

src/lib/sys/debug/vpb/
├── CHECKLIST.md          ✅ THIS FILE
├── VPB.svelte           ✅ EXISTS
├── components/
│   ├── fab/             ❌ CREATE
│   │   └── FAB.svelte   ❌ CREATE
│   └── ...
```

---

**This checklist is the contract. No code without checking boxes.**
