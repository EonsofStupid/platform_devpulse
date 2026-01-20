# COLD LIGHT Prop Taxonomy — CAPTURE DOCUMENT

> **STATUS: TEMPORARY** — This document captures the complete prop taxonomy before it becomes permanent documentation.
> **DELETE AFTER:** Props are properly documented in final location.

---

## AUTHORITY RULES

1. **Token Authority:** Zod/typed validation — ZERO tolerance for drift
2. **Color Format:** OKLCH dominant — exceptions require explicit justification
3. **Registry-First:** If it's not in the registry, it doesn't exist

---

## 0) GLOBAL / IDENTITY (Always Present)

These aren't "styling" — they're how the system stays registry-first.

| Prop | Type | Values | Notes |
|------|------|--------|-------|
| `kind` | enum | `shell` \| `container` \| `panel` \| `card` \| `modal` \| `input` \| `button` \| `widget` \| `chart` \| `graph` \| `toast` \| ... | Registry-backed |
| `recipeId` | enum | Registry-backed | Required |
| `presetId` | enum? | Registry-backed | Optional shortcut for defaults |
| `intent` | enum | `neutral` \| `info` \| `success` \| `warning` \| `danger` | Semantic meaning |
| `tone` | enum | `app` \| `chat` \| `maestro` | Rune context → preset selection |
| `state` | enum | `default` \| `hover` \| `active` \| `focus` \| `disabled` \| `loading` \| `readonly` | Interaction state |
| `density` | enum | `comfortable` \| `compact` \| `dense` | UI density |
| `importance` | enum | `standard` \| `elevated` \| `critical` | Visual priority |

**2026 Best Practice:** `tone/intent/state/density` are universal, everything else composes off these.

---

## 1) LAYOUT (Display + Positioning + Flow)

Platform CSS layer expressed as enums/scales.

### Display / Visibility

| Prop | Type | Values |
|------|------|--------|
| `display` | enum | `block` \| `inline` \| `inlineBlock` \| `flex` \| `grid` \| `none` |
| `visibility` | enum | `visible` \| `hidden` \| `collapse` |
| `opacity` | scale | `0–100` (slider, tokens-backed) |

### Positioning

| Prop | Type | Values |
|------|------|--------|
| `position` | enum | `static` \| `relative` \| `absolute` \| `fixed` \| `sticky` |
| `inset` | enum | `none` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `full` |
| `zIndex` | enum | `base` \| `dock` \| `overlay` \| `modal` \| `toast` \| `max` |

### Flex (when allowed — inline rows only)

| Prop | Type | Values |
|------|------|--------|
| `flexDirection` | enum | `row` \| `col` |
| `flexWrap` | enum | `nowrap` \| `wrap` |
| `justifyContent` | enum | `start` \| `center` \| `end` \| `between` \| `around` \| `evenly` |
| `alignItems` | enum | `start` \| `center` \| `end` \| `stretch` \| `baseline` |
| `gap` | enum | `0` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` |

### Grid (mandatory for Shell/Dashboard)

| Prop | Type | Values |
|------|------|--------|
| `gridTemplate` | enum | `shellBasic` \| `shellNav` \| `shellNavAside` \| `dashboard2` \| `dashboard3` \| `dashboardDense` \| `flowBuilder` \| `inspectorTwoPane` |
| `gridAutoFlow` | enum | `row` \| `col` \| `dense` |
| `gridAlign` | enum | `start` \| `center` \| `end` \| `stretch` |
| `gridGap` | enum | `0` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` |

**RULE:** Shells + dashboards = grid-first. Flex is for inline rows only.

---

## 2) SIZING (Width/Height/Aspect)

Composable but bounded.

### Width

| Prop | Type | Values |
|------|------|--------|
| `widthMode` | enum | `auto` \| `fill` \| `fit` \| `content` |
| `widthScale` | enum | `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` \| `4xl` \| `full` |
| `minWidth` | enum | `none` \| `xs` \| `sm` \| `md` \| `lg` |
| `maxWidth` | enum | `none` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` \| `4xl` \| `screen` |

### Height

| Prop | Type | Values |
|------|------|--------|
| `heightMode` | enum | `auto` \| `fill` \| `fit` \| `content` |
| `heightScale` | enum | `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` \| `4xl` \| `full` |
| `minHeight` | enum | `none` \| `xs` \| `sm` \| `md` \| `lg` |
| `maxHeight` | enum | `none` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` \| `4xl` \| `screen` |

### Aspect

| Prop | Type | Values |
|------|------|--------|
| `aspectRatio` | enum | `square` \| `video` \| `wide` \| `portrait` \| `auto` |

---

## 3) SPACING (Padding/Margin/Space)

Where systems win or die.

### Padding

| Prop | Type | Values |
|------|------|--------|
| `padAll` | enum | `0` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` |
| `padX` | enum | `0` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` |
| `padY` | enum | `0` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` |

### Margin (usually restricted)

| Prop | Type | Values |
|------|------|--------|
| `marginAll` | enum | `none` \| `xs` \| `sm` \| `md` \| `lg` |
| `marginX` | enum | `none` \| `xs` \| `sm` \| `md` \| `lg` |
| `marginY` | enum | `none` \| `xs` \| `sm` \| `md` \| `lg` |

### Content Spacing

| Prop | Type | Values |
|------|------|--------|
| `contentSpacing` | enum | `tight` \| `normal` \| `loose` |

**Best Practice:** Keep margin limited, rely on layout containers + gaps instead.

---

## 4) OVERFLOW + SCROLLING

Including touch behavior.

| Prop | Type | Values |
|------|------|--------|
| `overflowX` | enum | `visible` \| `hidden` \| `clip` \| `scroll` \| `auto` |
| `overflowY` | enum | `visible` \| `hidden` \| `clip` \| `scroll` \| `auto` |
| `scrollBehavior` | enum | `auto` \| `smooth` |
| `overscrollBehavior` | enum | `auto` \| `contain` \| `none` |
| `scrollbar` | enum | `native` \| `thin` \| `hidden` \| `glassTrack` \| `neonTrack` |
| `scrollSnap` | enum | `none` \| `xMandatory` \| `yMandatory` \| `both` |
| `touchScroll` | enum | `auto` \| `panX` \| `panY` \| `panXY` \| `none` |
| `momentumScrolling` | enum | `on` \| `off` |

---

## 5) INTERACTION (Pointer/Cursor/Select/Events)

Non-negotiable for an app platform.

| Prop | Type | Values |
|------|------|--------|
| `cursor` | enum | `default` \| `pointer` \| `text` \| `grab` \| `grabbing` \| `wait` \| `notAllowed` \| `crosshair` |
| `pointerEvents` | enum | `auto` \| `none` |
| `userSelect` | enum | `auto` \| `none` \| `text` \| `all` |
| `appearance` | enum | `native` \| `none` |
| `focusPolicy` | enum | `auto` \| `ring` \| `glow` \| `none` |
| `hitArea` | enum | `default` \| `comfortable` \| `large` |

---

## 6) TYPOGRAPHY (Text System)

Consistent across app/chat/maestro.

### Font + Size

| Prop | Type | Values |
|------|------|--------|
| `fontFamily` | enum | `ui` \| `mono` \| `display` |
| `textSize` | enum | `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` \| `3xl` |
| `fontWeight` | enum | `thin` \| `light` \| `normal` \| `medium` \| `semibold` \| `bold` |
| `lineHeight` | enum | `tight` \| `snug` \| `normal` \| `relaxed` \| `loose` |
| `letterSpacing` | enum | `tight` \| `normal` \| `wide` |

### Rendering / Behavior

| Prop | Type | Values |
|------|------|--------|
| `textAlign` | enum | `left` \| `center` \| `right` \| `justify` |
| `textWrap` | enum | `wrap` \| `nowrap` \| `balance` |
| `textOverflow` | enum | `clip` \| `ellipsis` |
| `lineClamp` | enum | `none` \| `1` \| `2` \| `3` \| `4` \| `6` |

### Color + Emphasis

| Prop | Type | Values |
|------|------|--------|
| `textTone` | enum | `primary` \| `secondary` \| `muted` \| `subtle` \| `inverse` |
| `textIntent` | enum | `neutral` \| `info` \| `success` \| `warning` \| `danger` |

---

## 7) SURFACE MATERIAL (Glass / Metal / Liquid / Holo)

The heart of COLD LIGHT images.

### Material Family (primary selector)

| Prop | Type | Values |
|------|------|--------|
| `materialFamily` | enum | `solid` \| `glass` \| `acrylic` \| `metal` \| `holo` \| `liquid` \| `void` |

### Clarity / Tint / Noise

| Prop | Type | Values |
|------|------|--------|
| `clarity` | enum | `clear` \| `clean` \| `mist` \| `frosted` \| `heavyFrost` |
| `tintMode` | enum | `none` \| `mono` \| `duo` \| `iridescent` |
| `tintStrength` | scale | `0–100` |
| `noise` | enum | `off` \| `subtle` \| `medium` \| `heavy` |
| `smudge` | enum | `off` \| `subtle` \| `film` |
| `vignette` | enum | `off` \| `subtle` \| `strong` |

### Opacity / Transmittance / Diffusion (CORRECTED)

**HARD TERMINOLOGY (2026 Industry Correct):**

| Term | What It Is | CSS Driver |
|------|------------|------------|
| **opacity** | Layer alpha — how much the element itself fades | `opacity: 0..1` or color alpha |
| **transmittance** | How much of the background makes it through the material | Material knob (NOT generic style) |
| **diffusion** | How scattered/smeared the background becomes | `backdrop-filter: blur()` + noise overlay |

**❌ BANNED: "transparency"** — It's a perceived result, not a controllable primitive.

| Prop | Type | Values | Notes |
|------|------|--------|-------|
| `opacity` | scale | `0–100` | Element fade |
| `transmittance` | scale | `0–100` | Material see-through strength |
| `backdropBlur` | enum | `0` \| `xs` \| `sm` \| `md` \| `lg` \| `xl` \| `2xl` | Blur radius |
| `diffusionStrength` | scale | `0–100` | Scatter/milky effect intensity |

**Frosted glass = low clarity + high diffusion + moderate blur + subtle noise + reduced transmittance.**
**Frost is a MATERIAL PRESET, not a single slider.**

---

## 8) FRAME / EDGES (Border / Radius / Bevel)

The second half of the "pro UI" look.

| Prop | Type | Values |
|------|------|--------|
| `radius` | enum | `none` \| `sm` \| `md` \| `lg` \| `xl` \| `pill` |
| `borderWidth` | enum | `none` \| `hairline` \| `thin` \| `normal` \| `thick` |
| `borderStyle` | enum | `solid` \| `dashed` \| `dotted` |
| `borderTone` | enum | `subtle` \| `normal` \| `strong` |
| `bevelLevel` | enum | `none` \| `sm` \| `md` \| `lg` \| `xl` |
| `bevelStyle` | enum | `inset` \| `outset` \| `hybrid` |
| `edgeGlow` | enum | `off` \| `soft` \| `medium` \| `hot` |

---

## 9) DEPTH + SHADOWS (Elevation Model)

Standardized depth system.

| Prop | Type | Values |
|------|------|--------|
| `elevation` | enum | `0` \| `1` \| `2` \| `3` \| `4` \| `5` |
| `shadowStyle` | enum | `none` \| `soft` \| `crisp` \| `cinematic` \| `neon` |
| `innerShadow` | enum | `off` \| `subtle` \| `strong` |
| `ambientOcclusion` | enum | `off` \| `subtle` \| `strong` |

**Best Practice:** `elevation` is the "semantic knob", `shadowStyle` is "the aesthetic family".

---

## 10) GLOW / LIGHT FX (The "Twinkle" and "Lab Vibe" Layer)

What makes DevPULSE look alive.

| Prop | Type | Values |
|------|------|--------|
| `rimLight` | enum | `off` \| `subtle` \| `medium` \| `strong` |
| `innerGlow` | enum | `off` \| `subtle` \| `medium` \| `strong` |
| `outerGlow` | enum | `off` \| `subtle` \| `medium` \| `strong` \| `nuclear` |
| `sparkle` | enum | `off` \| `rare` \| `normal` \| `heavy` |
| `scanlines` | enum | `off` \| `subtle` \| `retro` \| `heavy` |
| `pulse` | enum | `off` \| `idle` \| `hover` \| `alert` |
| `specularHighlight` | enum | `off` \| `soft` \| `sharp` |

---

## 11) MOTION / ANIMATION (Presets + Interactions)

Where "tons of preset animations" belongs.

### Transition Behavior

| Prop | Type | Values |
|------|------|--------|
| `transitionPreset` | enum | `none` \| `snappy` \| `smooth` \| `elastic` \| `cinematic` |
| `duration` | enum | `fast` \| `normal` \| `slow` |
| `easing` | enum | `out` \| `inOut` \| `spring` |

### Interaction Motion (preset selection)

| Prop | Type | Values |
|------|------|--------|
| `hoverMotion` | enum | `none` \| `lift` \| `glow` \| `tilt` \| `shimmer` \| `ripple` |
| `pressMotion` | enum | `none` \| `compress` \| `click` \| `snap` |
| `focusMotion` | enum | `none` \| `ring` \| `glowPulse` |
| `idleMotion` | enum | `none` \| `breathe` \| `float` \| `flicker` \| `scan` |

**These map to `recipe.requires[]` actions (glowTrack, ripple, tilt, etc.)**

---

## 12) FORMS / INPUTS (Placeholder, Outline, Validation)

Where platform systems usually fall apart — standardized now.

| Prop | Type | Values |
|------|------|--------|
| `placeholderTone` | enum | `muted` \| `subtle` \| `ghost` |
| `outlineMode` | enum | `none` \| `ring` \| `glow` \| `hard` |
| `caretStyle` | enum | `default` \| `neon` |
| `inputSize` | enum | `sm` \| `md` \| `lg` |
| `inputState` | enum | `default` \| `focus` \| `invalid` \| `valid` \| `disabled` \| `readonly` |
| `validationIntent` | enum | `none` \| `info` \| `warning` \| `error` \| `success` |

---

## 13) SVG / ICONOGRAPHY

| Prop | Type | Values |
|------|------|--------|
| `iconSize` | enum | `xs` \| `sm` \| `md` \| `lg` |
| `iconStyle` | enum | `line` \| `solid` \| `duotone` \| `neon` |
| `strokeWeight` | enum | `thin` \| `normal` \| `bold` |
| `iconGlow` | enum | `off` \| `subtle` \| `hot` |
| `svgRendering` | enum | `auto` \| `crispEdges` \| `geometricPrecision` |

---

## 14) TABLES / DATA DENSITY (Platform Dashboards)

Mandatory for "massive charts/graphs/lab".

| Prop | Type | Values |
|------|------|--------|
| `rowDensity` | enum | `compact` \| `normal` \| `comfortable` |
| `gridlines` | enum | `off` \| `subtle` \| `normal` |
| `headerStyle` | enum | `flat` \| `glass` \| `elevated` |
| `striping` | enum | `off` \| `subtle` \| `strong` |
| `cellAlign` | enum | `left` \| `center` \| `right` |
| `selectionMode` | enum | `none` \| `row` \| `cell` \| `multi` |

---

## 15) CHARTS / GRAPHS / LAB WIDGETS (Massive Visuals)

Where most design systems are too shallow. COLD LIGHT is not.

### Chart Surface Styling

| Prop | Type | Values |
|------|------|--------|
| `plotMaterial` | (same as Material props) | glass/metal/holo |
| `axisTone` | enum | `muted` \| `normal` \| `bright` |
| `gridTone` | enum | `off` \| `subtle` \| `normal` |
| `seriesPalette` | enum | `default` \| `neon` \| `cyber` \| `mono` \| `thermal` |
| `markerStyle` | enum | `dot` \| `ring` \| `glowDot` \| `cross` |
| `lineStyle` | enum | `solid` \| `dashed` \| `glowLine` |
| `fillStyle` | enum | `none` \| `soft` \| `gradient` \| `glassFill` |

### Interaction Model

| Prop | Type | Values |
|------|------|--------|
| `tooltip` | enum | `off` \| `basic` \| `rich` |
| `zoomPan` | enum | `off` \| `zoom` \| `pan` \| `both` |
| `crosshair` | enum | `off` \| `x` \| `y` \| `both` |
| `selection` | enum | `off` \| `brush` \| `lasso` |

**Still VPB-friendly because it's all enums + bounded sliders.**

---

## TONE SYSTEM (3-Tier: Maestro / App / Chat)

`tone` = rune context

Rune context picks:
- Default preset set (recipes)
- Default motion/FX family
- Default notification behavior
- Default density

So:
- **Maestro** notifications can be "mad scientist"
- **Chat** can be "retro cyber"
- **App** can be "space/lab"

WITHOUT forking the prop system. That's the whole win.

---

## FINAL TRUTH (2026 Best Practice)

✅ Core tokens exist once (semantic names)
✅ Props are a stable, universal contract
✅ Recipes/presets do the visual assembly
✅ Inspector tiering is UI-only (collapse/hide), never schema changes

---

## PROP COUNTS

| Group | Prop Count |
|-------|------------|
| 0. Global/Identity | 8 |
| 1. Layout | 17 |
| 2. Sizing | 9 |
| 3. Spacing | 7 |
| 4. Overflow/Scrolling | 8 |
| 5. Interaction | 6 |
| 6. Typography | 13 |
| 7. Surface Material | 11 |
| 8. Frame/Edges | 7 |
| 9. Depth/Shadows | 4 |
| 10. Glow/Light FX | 7 |
| 11. Motion/Animation | 7 |
| 12. Forms/Inputs | 6 |
| 13. SVG/Iconography | 5 |
| 14. Tables/Data | 6 |
| 15. Charts/Graphs | 11 |

**TOTAL: ~132 props**

---

---

## CONTRACT ARCHITECTURE (CONFIRMED)

### Three Tiers (REFINED)

| Tier | Scope | What It Contains |
|------|-------|------------------|
| **DsCoreProps (Universal)** | Safe on EVERY block kind. Supports accessibility, state, density, intent, deterministic behavior. | intent, state, density, visibility, interaction, a11y |
| **DsSurfaceProps (Surface)** | ONLY for container/material kinds. Does NOT apply to text-only things. | glass/metal/holo, tint/clarity/noise, bevel/depth, frame/ring |
| **Kind-Specific** | Only where they belong. | Shell (layout contracts), Input (placeholder, caret, validation), Chart (data density, gridlines, tooltip) |

### DsCoreProps Interface (Universal)

```typescript
type DsIntent = "neutral" | "info" | "success" | "warn" | "critical";
type DsState = "default" | "hover" | "active" | "disabled" | "loading";
type DsDensity = "comfortable" | "compact" | "dense";
type DsVisibility = "visible" | "hidden" | "collapsed";

interface DsCoreProps {
  intent: DsIntent;
  state: DsState;
  density: DsDensity;

  visibility?: DsVisibility;

  interaction?: {
    cursor?: "default" | "pointer" | "text" | "move" | "grab" | "notAllowed";
    pointerEvents?: "auto" | "none";
    userSelect?: "auto" | "none" | "text";
  };

  a11y?: {
    ariaLabel?: string;
    role?: "region" | "button" | "dialog" | "status" | "navigation";
    tabIndex?: -1 | 0;
  };
}
```

**Why this is correct:** These props can exist everywhere without allowing "CSS injection" or breaking layout semantics.

### Kind-Specific Interfaces

**Shell kinds (appShell, topBar, sideNav, dock, statusBar):**
```typescript
interface ShellLayoutProps {
  layout: {
    mode: "grid"; // hard constraint
    template: "shell" | "shell-nav" | "shell-nav-aside";
    safeArea: "on" | "off";
    insetGrid: "on" | "off";
  };
}
```

**Inputs (inputFrame, searchBox, etc.):**
```typescript
interface InputProps {
  input: {
    size: "sm" | "md" | "lg";
    placeholderTone: "quiet" | "normal";
    validation: "none" | "valid" | "invalid";
  };
}
```

**Data viz (chart, graphNetwork, timeline):**
```typescript
interface ChartProps {
  chart: {
    type: "line" | "bar" | "area" | "scatter" | "heatmap";
    density: "low" | "med" | "high";
    gridlines: "off" | "soft" | "full";
    tooltip: "off" | "hover" | "pinned";
  };
}
```

---

## PRESET SYSTEM (CONFIRMED)

### Preset Definition Interface

```typescript
interface PresetDefinition<K extends BlockKind> {
  id: `${K}.${string}`;          // panel.glass.clean, shell.devpulse.default
  kind: K;
  recipe: AllowedRecipe<K>;
  label: string;

  // Typed partial props (deep partial)
  props: Partial<KindProps<K>>;

  ui?: {
    tier: "basic" | "advanced";
    safeKnobs: (keyof KindProps<K>)[];
  };
}
```

### Merge Order (Non-Negotiable)

When VPB renders a node:
1. Kind contract defaults
2. Preset props
3. Node overrides (from VPB)
4. Then validate

```typescript
finalProps = merge(defaultProps, preset.props, node.props)
schema.parse(finalProps) // strict
```

This gives you:
- ✅ Predictable defaults
- ✅ Safe beginner UX
- ✅ Power-user expansion
- ✅ Zero drift

### UI Modes

- **Basic mode:** Pick preset + 3–6 knobs
- **Advanced mode:** Same preset, more knobs unlocked
- **No "new schema" per mode** (that's drift fuel)

---

## CONTRACT BINDING MECHANISM (CONFIRMED)

### Taxonomy = Source of Truth

Each kind registry entry owns:
- allowed recipes
- allowed slots
- schema (Zod strict)
- constraints (layoutMode: "grid" for shells)

### Non-Negotiable: Zod Strict Everywhere

```typescript
z.object({...}).strict()
```

No passthrough. No unknown keys. No "optional garbage."

### VPB Must Only Build Legal Nodes

When user adds a block:
1. VPB reads `KindRegistry[kind]`
2. Offers only legal recipes
3. Generates props from defaults/presets
4. Validates props
5. If invalid → VPB refuses to create the node

### Renderer Must Also Validate (Defense in Depth)

Renderers are a runtime boundary. DB gives you JSON. So renderers must validate and fail safe.

---

## TOKENS VS RECIPES (STERN)

**Tokens store VALUES.**
**Recipes store DECISIONS.**
**Never duplicate values inside recipes.**

```
✅ Tokens: --dp-glass-void (value)
✅ Recipe: "glass panel uses glass.void + blur.md + bevel.md" (decision)
```

If you blur this line, you will recreate the exact mess you're trying to escape.

---

## SLIDER QUANTIZATION (CONFIRMED)

- **Increments of 15:** 0 | 15 | 30 | 45 | 60 | 75 | 90 | 100
- **Advanced mode:** Allows manual input (still guardrailed)
- **Runtime:** Just the value being captured

---

## INDUSTRY TOKEN CATEGORIES (Full Coverage)

### Core Foundations (Must Exist)

**Color:**
- `color.surface.*` (background materials)
- `color.content.*` (text/icons)
- `color.border.*`
- `color.accent.*`
- `color.status.*` (info/success/warn/critical)
- `color.dataViz.*` (chart series, gridlines)

**Dimension / Layout scales:**
- `space.*` (padding/margin/gap)
- `size.*` (control sizes)
- `radius.*`
- `borderWidth.*`
- `zIndex.*`
- `breakpoint.*` (if responsive tiers matter)

**Typography:**
- `font.family.*`
- `font.weight.*`
- `text.size.*`
- `text.lineHeight.*`
- `text.tracking.*`

**Motion:**
- `motion.duration.*`
- `motion.easing.*`
- `motion.transition.*`
- `motion.animation.*` (preset animation packs)

**Shadow / Elevation:**
- `shadow.*` (depth stacks)
- `elevation.*` (semantic levels)

**Opacity:**
- `opacity.*` (not "transparency")

### ColdLight Material System

**Material: glass:**
- `material.glass.clarity.*` (how sharp the background is)
- `material.glass.transmittance.*` (alpha scale / see-through strength)
- `material.glass.blur.*` (backdrop blur strength)
- `material.glass.tint.*` (subtle color cast)
- `material.glass.noise.*` (grain / frosted scatter illusion)

**Material: metal / chrome:**
- `material.metal.specular.*`
- `material.metal.roughness.*`
- `material.metal.highlight.*` (edge shine / rim light bias)

**Glow / Emissive:**
- `glow.intensity.*`
- `glow.spread.*`
- `glow.color.*` (still token-backed)

**FX overlays:**
- `fx.scanline.*`
- `fx.sparkle.*`
- `fx.twinkle.*`
- `fx.noiseOverlay.*`
- `fx.rimLight.*`
- `fx.vignette.*`

---

## FROST DEFINITION (CONFIRMED)

Frost is NOT a single slider. Frost is a combination:
- transmittance (see-through)
- diffusion (scatter)
- blur (backdrop filter)
- noise (micro-texture)

**"Frost" should be a preset/material profile, not a single slider.**

---

## VITE PLUGIN ("coldlight") SPEC

### 1) Token Generation (SSOT)

On dev server start + on file change:
- Watch `design/tokens/tokens.ts`
- Generate:
  - `tokens.css`
  - `types.ts`
  - `tailwind.preset.ts` (optional)

### 2) Registry Verification (Fail Fast)

On startup/build:
- Verify kinds/contracts exist
- Verify recipe IDs exist
- Verify presets match kind+recipe constraints
- Optionally verify VPB palette consistency

### 3) HMR + Reload Strategy

- Token changes → update CSS (full reload acceptable)
- Recipe/preset changes → HMR reload virtual module / trigger module invalidation

### 4) Tailwind JIT Coverage Enforcement

- Validate Tailwind content includes `design/recipes/**/*.ts`
- If missing → error loudly (dev overlay)

### 5) Virtual Module Exports

Provide virtual modules so VPB and debug UIs can import:
- kinds list
- recipes list
- preset list
- action registry metadata

Example: `virtual:coldlight-registry` returns JSON-like typed exports.

---

## TONE SYSTEM (Runes → Preset Selection)

Context lanes (Maestro/App/Chat) select preset families. Tokens remain global and stable.

```
✅ notify(domain="maestro") → presetId "notify.maestro.madScientist"
✅ notify(domain="chat") → presetId "notify.chat.cyberRetro"
✅ notify(domain="app") → presetId "notify.app.spaceParticle"
```

That's recipe/preset selection, NOT token mutation.

---

## NEEDS CLARIFICATION

1. ~~Which props are universal vs kind-specific?~~ ✅ ANSWERED
2. ~~How do presets compose?~~ ✅ ANSWERED
3. ~~Slider mapping?~~ ✅ ANSWERED
4. ~~Token categories?~~ ✅ ANSWERED
5. ~~Vite plugin spec?~~ ✅ ANSWERED

---

## SPACING RULES (CONFIRMED)

**Three Tiers:**

| Tier | Kinds | Spacing Props |
|------|-------|---------------|
| **Full** | shell, panel, modal, container, card | padAll, padX, padY, marginAll, marginX, marginY, gap, contentSpacing |
| **Limited** | button, input, widget, chatBubble, chatDock | padX, padY, gap |
| **None** | icon, text, badge, label | Inherits from parent |

**This is what smart systems do.** Not cookie-cutter allowlists.

---

## OVERFLOW RULES (CONFIRMED)

**Overflow props allowed on:**
- Any kind with child slots
- Widgets (explicitly)
- Shell, Panel, Modal, Container (core containers)
- ChatDock (toggle-able, not always)

**Overflow props NOT allowed on:**
- Leaf nodes (icon, badge, label)
- Kinds without slots

---

## CHATBUBBLE KIND (CONFIRMED)

**chatBubble IS a true surface material.**
- Gets full DsSurfaceProps (glass/metal/holo)
- Is a container, not text content
- Can have material, tint, clarity, noise
- Sits in chatThread as a surface container

---

## TOKEN PIPELINE ARCHITECTURE (SD4 + DTCG)

### Decision: Style Dictionary v4

**Why SD4 over Terrazzo:**
- TanStack-style philosophy — DIY but well-architected
- 693k weekly npm downloads, Amazon-backed, Tokens Studio co-maintains
- Full control over transforms, formats, parsers
- Larger ecosystem, more examples
- DTCG 2025.10 compliant (same as Terrazzo)

### Pipeline Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     AUTHORING LAYER                             │
│  tokens.ts (TypeScript SSOT)                                    │
│  - Human-authored                                                │
│  - Zod-validated at authoring time                              │
│  - OKLCH values, semantic names                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     EXPORT STEP                                  │
│  tokens.ts → tokens.json (DTCG format)                          │
│  - Build-time conversion                                         │
│  - DTCG 2025.10 compliant                                       │
│  - Portable to any tool that speaks DTCG                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     STYLE DICTIONARY v4                          │
│  tokens.json → SD4 transforms → outputs                         │
│                                                                  │
│  Outputs:                                                        │
│  ├── tokens.css         (CSS custom properties)                 │
│  ├── types.ts           (TypeScript types + arrays)             │
│  ├── tailwind.preset.ts (Tailwind theme extension)              │
│  └── surfaces.gen.css   (Recipe CSS classes)                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     VITE PLUGIN ("coldlight")                    │
│  Orchestration + Verification                                    │
│                                                                  │
│  On dev start / file change:                                     │
│  1. Watch tokens.ts                                              │
│  2. Run export → tokens.json                                     │
│  3. Run SD4 build                                                │
│  4. Verify registries (kinds, recipes, presets)                  │
│  5. Trigger HMR / full reload                                    │
└─────────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/lib/design/tokens/
├── tokens.ts              # SSOT — human-authored, Zod-validated
├── tokens.json            # GENERATED — DTCG format (SD4 input)
├── tokens.css             # GENERATED — CSS custom properties
├── types.ts               # GENERATED — TS types + enum arrays
├── tailwind.preset.ts     # GENERATED — Tailwind theme
├── schema.ts              # Zod schemas (hand-authored)
└── sd.config.ts           # Style Dictionary v4 config

scripts/dev/design/
├── export-dtcg.ts         # tokens.ts → tokens.json
├── sd-build.ts            # Run SD4 transforms
└── ds-tokens-build.ts     # Orchestrates export + SD4

vite-plugins/
└── coldlight.ts           # Vite plugin (watch + verify + HMR)
```

### tokens.ts Structure (Authoring SSOT)

```typescript
// src/lib/design/tokens/tokens.ts
import { z } from "zod";

// ===========================================
// SCHEMA DEFINITIONS (Zod strict)
// ===========================================

const OklchSchema = z.object({
  l: z.number().min(0).max(100),
  c: z.number().min(0).max(0.4),
  h: z.number().min(0).max(360),
}).strict();

const SpaceScaleSchema = z.enum(["0", "xs", "sm", "md", "lg", "xl", "2xl"]);

// ===========================================
// TOKEN DEFINITIONS
// ===========================================

export const tokens = {
  // COLORS (OKLCH channels for alpha composability)
  color: {
    surface: {
      void: { l: 6, c: 0.02, h: 195 },
      deep: { l: 8, c: 0.025, h: 200 },
      base: { l: 12, c: 0.03, h: 205 },
      raised: { l: 16, c: 0.035, h: 210 },
      overlay: { l: 20, c: 0.04, h: 215 },
    },
    content: {
      primary: { l: 95, c: 0.01, h: 210 },
      secondary: { l: 75, c: 0.02, h: 210 },
      muted: { l: 55, c: 0.02, h: 210 },
      subtle: { l: 40, c: 0.02, h: 210 },
    },
    accent: {
      teal: { l: 75, c: 0.15, h: 195 },
      cyan: { l: 80, c: 0.14, h: 210 },
      lime: { l: 85, c: 0.18, h: 127 },
    },
    status: {
      info: { l: 70, c: 0.12, h: 240 },
      success: { l: 70, c: 0.15, h: 145 },
      warn: { l: 75, c: 0.16, h: 85 },
      critical: { l: 65, c: 0.2, h: 25 },
    },
  },

  // SPACE (rem values)
  space: {
    "0": "0",
    "xs": "0.25rem",
    "sm": "0.5rem",
    "md": "1rem",
    "lg": "1.5rem",
    "xl": "2rem",
    "2xl": "3rem",
  },

  // RADIUS
  radius: {
    none: "0",
    sm: "0.25rem",
    md: "0.5rem",
    lg: "0.75rem",
    xl: "1rem",
    pill: "9999px",
  },

  // BLUR (backdrop-filter values)
  blur: {
    "0": "0",
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "40px",
  },

  // SHADOW (elevation stacks)
  shadow: {
    "0": "none",
    "1": "0 1px 2px oklch(0% 0 0 / 0.1)",
    "2": "0 2px 4px oklch(0% 0 0 / 0.15)",
    "3": "0 4px 8px oklch(0% 0 0 / 0.2)",
    "4": "0 8px 16px oklch(0% 0 0 / 0.25)",
    "5": "0 16px 32px oklch(0% 0 0 / 0.3)",
  },

  // MOTION
  motion: {
    duration: {
      fast: "100ms",
      normal: "200ms",
      slow: "400ms",
    },
    easing: {
      out: "cubic-bezier(0, 0, 0.2, 1)",
      inOut: "cubic-bezier(0.4, 0, 0.2, 1)",
      spring: "cubic-bezier(0.34, 1.56, 0.64, 1)",
    },
  },

  // MATERIAL: GLASS
  material: {
    glass: {
      clarity: {
        clear: { blur: "sm", noise: "0", tint: "0" },
        clean: { blur: "md", noise: "subtle", tint: "5" },
        mist: { blur: "lg", noise: "subtle", tint: "10" },
        frosted: { blur: "xl", noise: "medium", tint: "15" },
        heavyFrost: { blur: "2xl", noise: "heavy", tint: "25" },
      },
    },
  },

  // GLOW
  glow: {
    off: "none",
    soft: "0 0 8px",
    medium: "0 0 16px",
    hot: "0 0 24px",
    cyber: "0 0 32px", // The missing token!
  },

  // Z-INDEX
  zIndex: {
    base: "0",
    dock: "100",
    overlay: "200",
    modal: "300",
    toast: "400",
    vpb: "800",      // The missing token!
    vpbFab: "900",   // The missing token!
    max: "9999",
  },
} as const;

// ===========================================
// TYPE EXPORTS (derived from tokens)
// ===========================================

export type TokensConfig = typeof tokens;
export type ColorSurface = keyof typeof tokens.color.surface;
export type ColorContent = keyof typeof tokens.color.content;
export type ColorAccent = keyof typeof tokens.color.accent;
export type ColorStatus = keyof typeof tokens.color.status;
export type Space = keyof typeof tokens.space;
export type Radius = keyof typeof tokens.radius;
export type Blur = keyof typeof tokens.blur;
export type Shadow = keyof typeof tokens.shadow;
export type Glow = keyof typeof tokens.glow;
export type ZIndex = keyof typeof tokens.zIndex;
```

### tokens.json (DTCG Output)

```json
{
  "$schema": "https://design-tokens.org/schema/2025.10",
  "color": {
    "surface": {
      "void": {
        "$type": "color",
        "$value": "oklch(6% 0.02 195)"
      },
      "deep": {
        "$type": "color",
        "$value": "oklch(8% 0.025 200)"
      }
    }
  },
  "space": {
    "md": {
      "$type": "dimension",
      "$value": "1rem"
    }
  },
  "radius": {
    "md": {
      "$type": "dimension",
      "$value": "0.5rem"
    }
  }
}
```

### SD4 Config

```typescript
// src/lib/design/tokens/sd.config.ts
import StyleDictionary from "style-dictionary";

export default {
  source: ["src/lib/design/tokens/tokens.json"],
  platforms: {
    css: {
      transformGroup: "css",
      buildPath: "src/lib/design/tokens/",
      files: [{
        destination: "tokens.css",
        format: "css/variables",
        options: {
          outputReferences: true,
        },
      }],
    },
    ts: {
      transformGroup: "js",
      buildPath: "src/lib/design/tokens/",
      files: [{
        destination: "types.ts",
        format: "typescript/es6-declarations",
      }],
    },
    tailwind: {
      transformGroup: "js",
      buildPath: "src/lib/design/tokens/",
      files: [{
        destination: "tailwind.preset.ts",
        format: "tailwind/preset", // Custom format
      }],
    },
  },
};
```

### Custom SD4 Transforms (OKLCH)

```typescript
// scripts/dev/design/sd-transforms.ts
import StyleDictionary from "style-dictionary";

// Register OKLCH color transform
StyleDictionary.registerTransform({
  name: "color/oklch",
  type: "value",
  matcher: (token) => token.$type === "color",
  transformer: (token) => {
    // Convert OKLCH object to CSS string
    const { l, c, h } = token.$value;
    return `oklch(${l}% ${c} ${h})`;
  },
});

// Register Tailwind preset format
StyleDictionary.registerFormat({
  name: "tailwind/preset",
  formatter: ({ dictionary }) => {
    // Generate Tailwind theme extension
    const colors = {};
    const spacing = {};
    const borderRadius = {};

    dictionary.allTokens.forEach((token) => {
      // Map tokens to Tailwind theme structure
      // ...
    });

    return `
import type { Config } from "tailwindcss";

export default {
  theme: {
    extend: {
      colors: ${JSON.stringify(colors, null, 2)},
      spacing: ${JSON.stringify(spacing, null, 2)},
      borderRadius: ${JSON.stringify(borderRadius, null, 2)},
    },
  },
} satisfies Partial<Config>;
`;
  },
});
```

### Vite Plugin Integration

```typescript
// vite-plugins/coldlight.ts
import type { Plugin } from "vite";
import { exec } from "child_process";

export function coldlight(): Plugin {
  return {
    name: "vite-plugin-coldlight",

    buildStart() {
      // Run token build on startup
      this.runTokenBuild();
      this.verifyRegistries();
    },

    handleHotUpdate({ file, server }) {
      if (file.endsWith("tokens.ts")) {
        this.runTokenBuild();
        // Full reload for CSS changes
        server.ws.send({ type: "full-reload" });
      }

      if (file.includes("/recipes/") || file.includes("/taxonomy/")) {
        this.verifyRegistries();
        // HMR for registry changes
        server.ws.send({ type: "custom", event: "coldlight:registry-update" });
      }
    },

    runTokenBuild() {
      exec("pnpm ds:tokens:build", (err, stdout, stderr) => {
        if (err) {
          console.error("[coldlight] Token build failed:", stderr);
          // Show error overlay
        } else {
          console.log("[coldlight] Tokens rebuilt");
        }
      });
    },

    verifyRegistries() {
      // Verify kinds have contracts
      // Verify recipes are registered
      // Verify presets match constraints
      // Fail loudly if violations found
    },
  };
}
```

### npm Scripts

```json
{
  "scripts": {
    "ds:export": "tsx scripts/dev/design/export-dtcg.ts",
    "ds:sd:build": "style-dictionary build --config src/lib/design/tokens/sd.config.ts",
    "ds:tokens:build": "pnpm ds:export && pnpm ds:sd:build",
    "ds:tokens:watch": "nodemon --watch src/lib/design/tokens/tokens.ts --exec 'pnpm ds:tokens:build'"
  }
}
```

### Why This Architecture Works

| Concern | Solution |
|---------|----------|
| **Authoring DX** | TypeScript + Zod = autocomplete + validation |
| **Industry standard** | DTCG JSON = portable anywhere |
| **Transform power** | SD4 = custom formats, OKLCH handling |
| **Build orchestration** | Vite plugin = watch + verify + HMR |
| **Framework portable** | DTCG JSON works in NextJS, Remix, etc. |
| **No magic** | Every step is explicit, debuggable |

### Migration Path

1. **Keep existing `tokens.ts`** — already most of the way there
2. **Add DTCG export script** — `tokens.ts` → `tokens.json`
3. **Add SD4 config** — define outputs
4. **Add custom transforms** — OKLCH, Tailwind preset
5. **Wire Vite plugin** — orchestrate on file change
6. **Deprecate old generator** — SD4 replaces it

---

## CONFIRMED DECISIONS

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Token tool | **Style Dictionary v4** | TanStack-style, DIY but well-architected |
| Token format | **DTCG 2025.10** | Industry standard, portable |
| Authoring | **TypeScript + Zod** | Type safety, validation |
| Orchestration | **Vite plugin** | HMR, verification, fail-fast |

---

## INDUSTRY PLATFORM PROPS GROUPING (A–O)

**Reference map for serious platform DS builders:**

### A) Layout
- display
- visibility
- position
- inset
- z-index
- grid
- flex (restricted)

### B) Sizing
- width / min / max
- height / min / max
- aspect ratio

### C) Spacing
- padding
- margin (restricted)
- gap

### D) Overflow & Scrolling
- overflow-x/y
- scroll behavior
- overscroll behavior
- scrollbar style
- snap
- momentum

### E) Interaction
- cursor
- pointer-events
- user-select
- hit-area
- focus policy

### F) Typography
- font family
- size
- weight
- line-height
- tracking
- alignment
- wrapping/clamp

### G) Surface / Material
**This is where COLD LIGHT images live (glass, chrome, holo, liquid):**
- material family
- clarity
- transmittance
- diffusion
- blur
- tint
- noise/grain
- smudge
- vignette

### H) Frame / Edges
- radius
- border width/style
- bevel
- edge glow

### I) Depth / Elevation
- elevation (semantic)
- shadow family
- inner shadow
- ambient occlusion

### J) Light FX
- glow intensity/spread
- rim light
- sparkle/twinkle
- scanlines
- specular highlight

### K) Motion
- transition preset
- duration
- easing
- hover/press/focus/idle motion presets

### L) Forms
- placeholder tone
- caret style
- outline/ring mode
- validation intent/state
- input size

### M) Iconography / SVG
- icon size
- stroke weight
- style family
- rendering mode

### N) Data Density
- table row density
- gridlines/striping
- selection mode

### O) DataViz / Lab
- axis/grid tone
- series palette family
- marker/line/fill styles
- tooltip/zoom/crosshair/selection

---

## COMPONENT-SYSTEM TOKENS (Missing from Foundation)

These complete the platform:

```
focus.*        # ring/glow presets
hitArea.*      # touch target sizes
scrollbar.*    # custom scrollbar styles
overlay.*      # modals/toasts/blur plates
```

---

## VITE PLUGIN ("coldlight") DETAILED RESPONSIBILITIES

### Plugin Outputs (Generated Artifacts)

```
design/tokens/generated/
├── tokens.dtcg.json       # DTCG 2025.10 format
├── tokens.css             # CSS custom properties (root only)
├── tokens.types.ts        # TypeScript types + enum arrays
└── tailwind.preset.ts     # Tailwind theme extension

design/registry/generated/
└── registry.snapshot.ts   # Virtual module source
```

### Plugin Jobs (Watch + Validate)

**A) Token Pipeline**
- Watch: `design/tokens/tokens.ts`
- Export → DTCG JSON
- Run Style Dictionary → emit CSS + TS + Tailwind preset

**B) Registry Verification (Fail Fast)**
- Verify every `recipeId` exists
- Verify every `presetId` points to a legal kind + allowed recipe
- Verify taxonomy kinds exist and are strict schemas
- Verify `requires[]` actions exist

**C) Tailwind Coverage Enforcement**
- Confirm Tailwind content includes:
  - `design/recipes/**/*.ts`
  - `design/renderers/**/*.svelte`
  - VPB inspector sources
- If missing → dev overlay error

**D) Virtual Registry Modules**
- `virtual:coldlight-registry/kinds`
- `virtual:coldlight-registry/recipes`
- `virtual:coldlight-registry/presets`
- `virtual:coldlight-registry/actions`

Keeps system registry-first without runtime scanning.

---

## OKLCH + DTCG PORTABILITY

**Internally:** OKLCH is the right choice (perceptual uniformity, better ramps).

**For DTCG portability:**
- DTCG canonical output: sRGB components (portable to any ecosystem)
- Preserve OKLCH in `$extensions.coldlight.oklch`
- SD4 transforms convert OKLCH → sRGB at build time

This gives you:
- OKLCH SSOT authoring
- Portable exports
- No compromises

---

## COLDLIGHT FOUNDATION V1 LOCK (Non-Negotiable Baseline)

### Core Architecture Truths

| Truth | Enforcement |
|-------|-------------|
| Tokens store VALUES | Generator is only source |
| Recipes store DECISIONS | Recipe registry is SSOT |
| VPB nodes are typed + enum-only | Zod strict everywhere |
| Renderers apply outputs | No styling in components |
| Actions attach via `recipe.requires[]` | Auto-attached by renderer |
| Strict validation at every boundary | VPB + Renderer + DB load |

### Non-Negotiable V1 Lock Checklist

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

### What Gets Prized

This foundation scales into:
- Orchestration lab
- Massive graphs/charts
- Streaming tools
- Editing tools (image/video/audio/docs)

**Without collapsing into inconsistency.**

---

## SUMMARY: 2026-CORRECT STACK

```
┌─────────────────────────────────────────────┐
│         COLDLIGHT DESIGN SYSTEM             │
├─────────────────────────────────────────────┤
│ Tokens = VALUES (OKLCH SSOT → SD4 → CSS)    │
│ Recipes = DECISIONS (variant → classes)     │
│ Presets = DEFAULTS (safe starter configs)   │
│ VPB Nodes = TYPED + ENUM-ONLY               │
│ Renderers = APPLY OUTPUTS (no invention)    │
│ Actions = ATTACHED VIA recipe.requires[]    │
│ Validation = STRICT AT EVERY BOUNDARY       │
└─────────────────────────────────────────────┘
```

**This is the architecture that ships.**

---

## IMPLEMENTATION STRUCTURE (CANONICAL CODE)

### File Organization

```
src/lib/design/taxonomy/
├── props/
│   ├── core.props.ts       # DsCoreProps interface + types
│   └── surface.props.ts    # DsSurfaceProps interface + types
├── zod/
│   ├── core.schema.ts      # zDsCoreProps Zod schema
│   └── surface.schema.ts   # zDsSurfaceProps Zod schema
└── kinds/
    ├── kind.registry.ts    # KindRegistry with SurfacePolicy
    ├── panel.kind.ts       # Surface-capable kind
    └── label.kind.ts       # Leaf kind (no surface)
```

---

### 1) Core Props Types (SSOT)

```typescript
// design/taxonomy/props/core.props.ts
export type DsIntent = "neutral" | "info" | "success" | "warning" | "danger";
export type DsTone = "app" | "chat" | "maestro";
export type DsState =
  | "default"
  | "hover"
  | "active"
  | "focus"
  | "disabled"
  | "loading"
  | "readonly";
export type DsDensity = "comfortable" | "compact" | "dense";

export interface DsCoreProps {
  intent: DsIntent;
  tone: DsTone;
  state: DsState;
  density: DsDensity;

  importance?: "standard" | "elevated" | "critical";
  visibility?: "visible" | "hidden" | "collapsed";

  interaction?: {
    cursor?:
      | "default"
      | "pointer"
      | "text"
      | "grab"
      | "grabbing"
      | "wait"
      | "notAllowed"
      | "crosshair";
    pointerEvents?: "auto" | "none";
    userSelect?: "auto" | "none" | "text" | "all";
  };

  a11y?: {
    ariaLabel?: string;
    role?:
      | "region"
      | "button"
      | "dialog"
      | "status"
      | "navigation"
      | "article";
    tabIndex?: -1 | 0;
  };
}
```

---

### 2) Surface Props Types (Universal Shape)

```typescript
// design/taxonomy/props/surface.props.ts
export type MaterialFamily =
  | "solid"
  | "glass"
  | "acrylic"
  | "metal"
  | "holo"
  | "liquid"
  | "void";

export type Clarity = "clear" | "clean" | "mist" | "frosted" | "heavyFrost";
export type TintMode = "none" | "mono" | "duo" | "iridescent";
export type NoiseLevel = "off" | "subtle" | "medium" | "heavy";
export type SmudgeLevel = "off" | "subtle" | "film";
export type VignetteLevel = "off" | "subtle" | "strong";

export type BlurStep = "0" | "xs" | "sm" | "md" | "lg" | "xl" | "2xl";
export type Radius = "none" | "sm" | "md" | "lg" | "xl" | "pill";
export type BorderWidth = "none" | "hairline" | "thin" | "normal" | "thick";
export type BorderStyle = "solid" | "dashed" | "dotted";
export type BorderTone = "subtle" | "normal" | "strong";

export type BevelLevel = "none" | "sm" | "md" | "lg" | "xl";
export type BevelStyle = "inset" | "outset" | "hybrid";
export type EdgeGlow = "off" | "soft" | "medium" | "hot";

export type Elevation = "0" | "1" | "2" | "3" | "4" | "5";
export type ShadowStyle = "none" | "soft" | "crisp" | "cinematic" | "neon";
export type InnerShadow = "off" | "subtle" | "strong";
export type AmbientOcclusion = "off" | "subtle" | "strong";

export type GlowLevel = "off" | "subtle" | "medium" | "strong" | "nuclear";
export type Sparkle = "off" | "rare" | "normal" | "heavy";
export type Scanlines = "off" | "subtle" | "retro" | "heavy";
export type PulseMode = "off" | "idle" | "hover" | "alert";
export type Specular = "off" | "soft" | "sharp";

// Quantized slider (0..100 but only specific steps)
export type Q100 = 0 | 15 | 30 | 45 | 60 | 75 | 90 | 100;

export interface DsSurfaceProps {
  materialFamily?: MaterialFamily;
  clarity?: Clarity;

  tintMode?: TintMode;
  tintStrength?: Q100;

  noise?: NoiseLevel;
  smudge?: SmudgeLevel;
  vignette?: VignetteLevel;

  // Material knobs (NOT "transparency")
  transmittance?: Q100;      // background show-through strength
  diffusionStrength?: Q100;  // milkiness / scatter
  backdropBlur?: BlurStep;   // discrete blur radius step

  radius?: Radius;
  borderWidth?: BorderWidth;
  borderStyle?: BorderStyle;
  borderTone?: BorderTone;

  bevelLevel?: BevelLevel;
  bevelStyle?: BevelStyle;
  edgeGlow?: EdgeGlow;

  elevation?: Elevation;
  shadowStyle?: ShadowStyle;
  innerShadow?: InnerShadow;
  ambientOcclusion?: AmbientOcclusion;

  // ColdLight "alive" layer
  rimLight?: GlowLevel;
  innerGlow?: GlowLevel;
  outerGlow?: GlowLevel;
  sparkle?: Sparkle;
  scanlines?: Scanlines;
  pulse?: PulseMode;
  specularHighlight?: Specular;
}
```

---

### 3) Zod Schemas (Strict, Composable)

**Core Schema:**

```typescript
// design/taxonomy/zod/core.schema.ts
import { z } from "zod";

export const zDsCoreProps = z.object({
  intent: z.enum(["neutral", "info", "success", "warning", "danger"]),
  tone: z.enum(["app", "chat", "maestro"]),
  state: z.enum(["default","hover","active","focus","disabled","loading","readonly"]),
  density: z.enum(["comfortable","compact","dense"]),

  importance: z.enum(["standard","elevated","critical"]).optional(),
  visibility: z.enum(["visible","hidden","collapsed"]).optional(),

  interaction: z.object({
    cursor: z.enum([
      "default","pointer","text","grab","grabbing","wait","notAllowed","crosshair"
    ]).optional(),
    pointerEvents: z.enum(["auto","none"]).optional(),
    userSelect: z.enum(["auto","none","text","all"]).optional(),
  }).strict().optional(),

  a11y: z.object({
    ariaLabel: z.string().optional(),
    role: z.enum(["region","button","dialog","status","navigation","article"]).optional(),
    tabIndex: z.union([z.literal(-1), z.literal(0)]).optional(),
  }).strict().optional(),
}).strict();
```

**Surface Schema:**

```typescript
// design/taxonomy/zod/surface.schema.ts
import { z } from "zod";

const zQ100 = z.union([
  z.literal(0), z.literal(15), z.literal(30), z.literal(45),
  z.literal(60), z.literal(75), z.literal(90), z.literal(100),
]);

export const zDsSurfaceProps = z.object({
  materialFamily: z.enum(["solid","glass","acrylic","metal","holo","liquid","void"]).optional(),

  clarity: z.enum(["clear","clean","mist","frosted","heavyFrost"]).optional(),

  tintMode: z.enum(["none","mono","duo","iridescent"]).optional(),
  tintStrength: zQ100.optional(),

  noise: z.enum(["off","subtle","medium","heavy"]).optional(),
  smudge: z.enum(["off","subtle","film"]).optional(),
  vignette: z.enum(["off","subtle","strong"]).optional(),

  transmittance: zQ100.optional(),
  diffusionStrength: zQ100.optional(),
  backdropBlur: z.enum(["0","xs","sm","md","lg","xl","2xl"]).optional(),

  radius: z.enum(["none","sm","md","lg","xl","pill"]).optional(),
  borderWidth: z.enum(["none","hairline","thin","normal","thick"]).optional(),
  borderStyle: z.enum(["solid","dashed","dotted"]).optional(),
  borderTone: z.enum(["subtle","normal","strong"]).optional(),

  bevelLevel: z.enum(["none","sm","md","lg","xl"]).optional(),
  bevelStyle: z.enum(["inset","outset","hybrid"]).optional(),
  edgeGlow: z.enum(["off","soft","medium","hot"]).optional(),

  elevation: z.enum(["0","1","2","3","4","5"]).optional(),
  shadowStyle: z.enum(["none","soft","crisp","cinematic","neon"]).optional(),
  innerShadow: z.enum(["off","subtle","strong"]).optional(),
  ambientOcclusion: z.enum(["off","subtle","strong"]).optional(),

  rimLight: z.enum(["off","subtle","medium","strong","nuclear"]).optional(),
  innerGlow: z.enum(["off","subtle","medium","strong","nuclear"]).optional(),
  outerGlow: z.enum(["off","subtle","medium","strong","nuclear"]).optional(),
  sparkle: z.enum(["off","rare","normal","heavy"]).optional(),
  scanlines: z.enum(["off","subtle","retro","heavy"]).optional(),
  pulse: z.enum(["off","idle","hover","alert"]).optional(),
  specularHighlight: z.enum(["off","soft","sharp"]).optional(),
}).strict();
```

---

### 4) Kind Schemas (Composition Pattern)

**Surface-Capable Kind (Panel):**

```typescript
// design/taxonomy/kinds/panel.kind.ts
import { z } from "zod";
import { zDsCoreProps } from "../zod/core.schema";
import { zDsSurfaceProps } from "../zod/surface.schema";

export const zPanelProps = z.object({
  core: zDsCoreProps,
  surface: zDsSurfaceProps.optional(),  // ✅ optional but allowed
  layout: z.object({
    overflowX: z.enum(["visible","hidden","clip","scroll","auto"]).optional(),
    overflowY: z.enum(["visible","hidden","clip","scroll","auto"]).optional(),
  }).strict().optional(),
}).strict();
```

**Leaf Kind (Label) — No Surface:**

```typescript
// design/taxonomy/kinds/label.kind.ts
import { z } from "zod";
import { zDsCoreProps } from "../zod/core.schema";

export const zLabelProps = z.object({
  core: zDsCoreProps,
  text: z.object({
    size: z.enum(["xs","sm","md","lg","xl","2xl","3xl"]),
    tone: z.enum(["primary","secondary","muted","subtle","inverse"]),
  }).strict(),
}).strict(); // ✅ surface is NOT legal here
```

---

### 5) Kind Registry with SurfacePolicy

```typescript
// design/taxonomy/kinds/kind.registry.ts
export type SurfacePolicy = "none" | "optional" | "required";

export interface KindRegistryEntry {
  kind: string;
  label: string;
  surfacePolicy: SurfacePolicy;
  schema: unknown; // Zod schema
  allowedRecipes: string[];
  slots: string[];
}

export const KindRegistry = {
  panel: {
    kind: "panel",
    label: "Panel",
    surfacePolicy: "optional",   // ✅ allowed but not forced
    schema: zPanelProps,
    allowedRecipes: ["panel.glass","panel.metal","panel.solid"],
    slots: ["header","content","footer"],
  },
  label: {
    kind: "label",
    label: "Label",
    surfacePolicy: "none",       // ✅ VPB hides surface category entirely
    schema: zLabelProps,
    allowedRecipes: ["text.label"],
    slots: [],
  },
  // ... other kinds
} as const;
```

**Surface-Capable Kinds:**
- shell, container, panel, card, modal, widget, toast, chatBubble, chart, graph, dock

**Non-Surface Kinds (Leaf Nodes):**
- icon, label, badge, text, svg-only elements

---

### 6) Preset Structure

```typescript
// design/recipes/presets/panel/panel.glass.clean.preset.ts
export const panelGlassCleanPreset = {
  id: "panel.glass.clean",
  kind: "panel",
  recipeId: "panel.glass",
  label: "Glass Panel — Clean",
  props: {
    surface: {
      materialFamily: "glass",
      clarity: "clean",
      transmittance: 75,
      diffusionStrength: 45,
      backdropBlur: "md",
      bevelLevel: "md",
      edgeGlow: "soft",
      outerGlow: "subtle",
    },
  },
  ui: {
    tier: "basic",
    safeKnobs: [
      "surface.clarity",
      "surface.backdropBlur",
      "surface.transmittance",
      "surface.diffusionStrength",
      "surface.edgeGlow",
      "surface.outerGlow",
    ],
  },
} as const;
```

---

### 7) Recipe Structure (classes() Pattern)

```typescript
// design/recipes/panel/panel.recipe.ts
export interface PanelRecipeProps {
  core: DsCoreProps;
  surface?: DsSurfaceProps;
  layout?: { overflowX?: string; overflowY?: string };
}

export const panelGlassRecipe = {
  id: "panel.glass",
  requires: ["glowTrack"], // Actions auto-attached by renderer
  classes: (props: PanelRecipeProps) => {
    const s = props.surface;

    // Defaults if surface is omitted
    const clarity = s?.clarity ?? "clean";
    const blur = s?.backdropBlur ?? "md";
    const trans = s?.transmittance ?? 75;

    return {
      root: [
        "cl-panel-base",
        `cl-glass-clarity-${clarity}`,
        `cl-backdrop-${blur}`,
        `cl-trans-${trans}`,
      ].join(" "),
      header: "cl-panel-header",
      content: "cl-panel-content",
      footer: "cl-panel-footer",
    };
  },
} as const;
```

**Renderer applies:**
```svelte
<div class={slotClassMap.root} use:applyRecipeActions={recipe}>
  <slot name="header" />
  <slot name="content" />
  <slot name="footer" />
</div>
```

✅ Renderer stays dumb. Recipe does the decisions.

---

### 8) VPB Behavior Rules

| SurfacePolicy | VPB Behavior |
|---------------|--------------|
| `"none"` | Surface UI is hidden entirely |
| `"optional"` | Surface shown only in Advanced mode (or toggleable) |
| `"required"` | Force at least `materialFamily` default |

**This is the junior/advanced split.**

---

### Summary: What This Structure Guarantees

| Guarantee | Mechanism |
|-----------|-----------|
| One DsSurfaceProps SSOT | Universal interface, single definition |
| Allowed only on specific kinds | `surfacePolicy` in KindRegistry |
| Optional even when allowed | `surface: zDsSurfaceProps.optional()` |
| Strict Zod boundaries stop garbage | `.strict()` on all schemas |
| Presets + safe knobs for junior UX | `ui.tier` + `ui.safeKnobs` |
| Recipes assemble visuals | `classes()` function pattern |
| Renderers stay dumb | Only apply recipe output, no styling |

**This is the canonical implementation structure.**
