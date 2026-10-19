# ColdLight Token Pipeline

> How tokens flow from DTCG JSON source to generated outputs via Style Dictionary 5.

---

## Overview

```
17 DTCG JSON files (tokens/src/*.json)
  → SD5 transforms (colorOklch, sizePxToRem, shadowCssShorthand, gradientCssShorthand)
  → coldlight/css format → css/{primitives,semantic,components}/*.css (@layer tokens.*)
  → coldlight/tailwind-theme format → theme/*.css (@theme blocks)
  → coldlight/types format → types/*.d.ts (const arrays, union types, CSS var types)
  → coldlight/manifest format → generated/token-manifest.json (VPB scale/control metadata)
```

**Command**: `pnpm ds:tokens:build`

---

## File Structure

```
scripts/build/styledictionary/
├── sd.config.ts           # SD5 config (664 lines, enum-authored)
├── build.ts               # Build runner + barrel generation
└── tokens/src/            # 17 DTCG JSON source files
    ├── color.json         # HEX values → oklch
    ├── shadow.json        # DTCG shadow objects → CSS shorthand
    ├── glow.json          # Glow shadow tokens
    ├── bevel.json         # Inset shadow stacks
    ├── blur.json          # Blur values
    ├── radius.json        # Border radius
    ├── spacing.json       # Space scale
    ├── border.json        # Border tokens
    ├── typography.json    # Font tokens
    ├── gradient.json      # DTCG gradients → linear-gradient()
    ├── surface.json       # Surface compositions
    ├── motion.json        # Duration, easing, animations
    ├── interaction.json   # Interaction states
    ├── overlay.json       # Overlay tokens
    ├── scrollbar.json     # Scrollbar styling
    ├── backdrop.json      # Backdrop tokens
    └── component.json     # Component-level tokens

packages/coldlight/
├── css/                   # GENERATED — CSS custom properties
│   ├── index.css          # Barrel (layer ordering)
│   ├── primitives/        # @layer tokens.primitives (11 files)
│   ├── semantic/          # @layer tokens.semantic (9 files)
│   └── components/        # @layer tokens.components (1 file)
├── theme/                 # GENERATED — Tailwind @theme blocks
│   └── index.css          # Per-domain composable imports
├── types/                 # GENERATED — TypeScript types
│   └── index.d.ts         # Re-export barrel
└── generated/
    ├── token-manifest.json  # VPB metadata
    └── variants.css         # 8-axis @utility rules (from token-categories.ts)
```

---

## DTCG Token Format

Every token file follows DTCG 1.0:

```json
{
  "glow": {
    "$type": "shadow",
    "$description": "Glow emission shadows",
    "teal": {
      "$value": "0 0 24px 8px #00d4aa99",
      "$description": "Teal accent glow"
    }
  }
}
```

### Authoring Rules
- **Colors**: Author as HEX. SD5 transforms HEX → oklch for CSS output.
- **Dimensions**: Author as PX. SD5 transforms PX → rem for CSS output.
- **Shadows**: Standard DTCG shadow objects. SD5 built-in → CSS shorthand.
- **Gradients**: DTCG gradient type with HEX color stops. Custom transform → linear-gradient().
- **Cubic Bezier**: Array format `[x1, y1, x2, y2]`. SD5 built-in → cubic-bezier().
- **References**: `{group.path.leaf}` syntax for cross-token references.
- **Extensions**: `$extensions.com.coldlight` for VPB scale metadata (control, scale, default, tier).

---

## SD5 Config (sd.config.ts)

### Transforms (11 CSS + 1 custom)
All referenced via `style-dictionary/enums`:
- `attributeCti`, `nameKebab`, `timeSeconds`
- `sizePxToRem`, `colorOklch`, `fontFamilyCss`
- `cubicBezierCss`, `borderCssShorthand`, `typographyCssShorthand`
- `transitionCssShorthand`, `shadowCssShorthand`
- `gradient/css/shorthand` (custom ColdLight transform)

### Preprocessor
`coldlight/capture-extensions` — Walks raw token tree BEFORE SD5 strips `$extensions`. Stashes group-level `$extensions['com.coldlight']` into a Map. Custom formats read from that Map.

### Custom Formats
- `coldlight/css` — CSS custom properties with `@layer tokens.{sublayer}`. Handles inset shadow conversion.
- `coldlight/tailwind-theme` — Per-domain `@theme` blocks with namespace remapping.
- `coldlight/types` — TypeScript: const arrays, union types, CSS var types, record shapes.
- `coldlight/manifest` — JSON manifest with group metadata + token details for VPB.

### Platforms (28 total)
- 11 css-primitives, 9 css-semantic, 1 css-components
- 17 theme-* (per-domain Tailwind)
- 8 types-* (TypeScript)
- 1 manifest

---

## CSS Variable Naming

SD5 generates variables using `{group}-{subgroup}-{name}` kebab convention:

| Token Group | CSS Variable | Example |
|-------------|-------------|---------|
| color.teal.500 | `--color-teal-500` | oklch(0.65 0.15 180) |
| glow.teal | `--glow-teal` | 0 0 24px 8px ... |
| shadow.z2 | `--shadow-z2` | 0 4px 12px ... |
| bevel.subtle | `--bevel-subtle` | inset 0 1px ... |
| motion.duration.fast | `--motion-duration-fast` | 150ms |
| motion.ease.spring | `--motion-ease-spring` | cubic-bezier(...) |
| motion.animation.breathe | `--motion-animation-breathe` | cl-breathe 4s ... |
| transition.fade | `--transition-fade` | opacity 250ms ease-out |

---

## Wiring

```
src/app.css
  @import "tailwindcss";
  @import "#coldlight/index.css";

packages/coldlight/index.css
  @import "./css/index.css";           ← SD5 token CSS (3-tier layers)
  @import "./theme/index.css";         ← SD5 Tailwind @theme
  @import "./generated/variants.css";  ← 8-axis encoding utilities
  @import "./generated/typography.css";
  @import "./generated/focus.css";
  @import "./generated/scrollbars.css";
  @import "./generated/keyframes.css";
  @import "./svg/filters/filters.css"; ← SVG neumorphism
```

---

## Adding a New Token

1. Add to the appropriate JSON file in `tokens/src/`
2. Follow DTCG format: `$type` on group, `$value` on leaf
3. Run `pnpm ds:tokens:build`
4. CSS, types, theme, manifest all auto-update
5. If it maps to an encoding axis, update `registry/token-categories.ts`

---

## Core Truths

| Truth | Enforcement |
|-------|-------------|
| DTCG JSON is SSOT | Never edit generated CSS/types/theme files |
| HEX → oklch, PX → rem | SD5 transforms handle conversion |
| SD5 enums, not raw strings | All built-ins via `style-dictionary/enums` |
| 3-tier layering | primitives → semantic → components |
| VPB reads manifest | `$extensions.com.coldlight` metadata drives editor controls |

---

**This is the canonical token pipeline. SD5 is the UI compiler.**
