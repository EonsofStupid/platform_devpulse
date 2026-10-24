# S1: Fluid Tokens + Tailwind Filtering

**Status**: READY TO EXECUTE
**Depends on**: Nothing — this is ground zero
**Covers gap items**: 1.1, 1.2, 1.3, 1.5, 1.7, 5.1, 5.2, 5.3, 8.2

---

## Overview

This sprint transforms the entire token pipeline:
1. Static dimensions → fluid `clamp()` values
2. All colors in Tailwind → only brand + semantic in Tailwind
3. Individual text properties → composed text utilities
4. Hand-authored aliases → DTCG-sourced tokens
5. Wrong `$type` on enriched presets → correct DTCG types

---

## Task 1: Fluid Clamp Transform in SD5

### 1.1 Add `computeFluid()` to `generate-scales.mjs`

Add after the existing `round()` function (line ~117):

```javascript
/** Fluid clamp: linear interpolation between two viewport-size pairs */
function computeFluid(minPx, maxPx, minVP = 320, maxVP = 1440, base = 16) {
  const slope = (maxPx - minPx) / (maxVP - minVP);
  const intercept = minPx - slope * minVP;
  const slopeVw = round(slope * 100);
  const interceptRem = round(intercept / base);
  const minRem = round(minPx / base);
  const maxRem = round(maxPx / base);
  const sign = interceptRem >= 0 ? ' + ' : ' - ';
  const absIntercept = round(Math.abs(interceptRem));
  return `clamp(${minRem}rem, ${slopeVw}vw${sign}${absIntercept}rem, ${maxRem}rem)`;
}

/** Fluid dimension token */
function fluidDim(minPx, maxPx) {
  return { $value: computeFluid(minPx, maxPx), $type: 'dimension' };
}
```

### 1.2 Convert spacing scale to fluid

Replace the static space scale (lines 122-140) with fluid values.
Small spaces scale gently. Large spaces scale aggressively.

```javascript
space: (() => {
  // Small spaces: minimal scaling (±1px)
  // Large spaces: aggressive scaling (±50%)
  const entries = {
    '0':   { $value: '0', $type: 'dimension' },
    '1':   fluidDim(1, 1),         // 1px — no scaling
    '2':   fluidDim(2, 2),         // 2px — no scaling
    '3':   fluidDim(3, 3),         // 3px — no scaling
    '4':   fluidDim(4, 5),         // 4→5px
    '5':   fluidDim(5, 6),
    '6':   fluidDim(6, 7),
    '7':   fluidDim(7, 8),
    '8':   fluidDim(8, 10),        // 8→10px
    '9':   fluidDim(9, 11),
    '10':  fluidDim(10, 12),
    '11':  fluidDim(11, 13),
    '12':  fluidDim(12, 14),       // 12→14px
    '14':  fluidDim(14, 16),
    '16':  fluidDim(16, 20),       // 16→20px (1rem → 1.25rem)
    '18':  fluidDim(18, 22),
    '20':  fluidDim(20, 26),
    '24':  fluidDim(24, 32),       // 24→32px
    '28':  fluidDim(28, 36),
    '32':  fluidDim(32, 44),       // 32→44px
    '36':  fluidDim(36, 48),
    '40':  fluidDim(40, 56),
    '44':  fluidDim(44, 60),
    '48':  fluidDim(48, 64),       // 48→64px
    '56':  fluidDim(56, 76),
    '64':  fluidDim(64, 88),
    '72':  fluidDim(72, 100),
    '80':  fluidDim(80, 112),
    '96':  fluidDim(96, 132),
    '112': fluidDim(112, 156),
    '128': fluidDim(128, 176),
  };
  return entries;
})(),
```

### 1.3 Convert fontSize to fluid type scale

Replace the static fontSize scale (lines 204-218) with fluid compounding scale:

```javascript
fontSize: (() => {
  const baseMin = 16;     // 16px at 320vw
  const baseMax = 18;     // 18px at 1440vw
  const ratioMin = 1.2;   // minor third at mobile
  const ratioMax = 1.333;  // perfect fourth at desktop
  const names = ['3xs', '2xs', 'xs', 'sm', 'base', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl'];
  const steps = [-4, -3, -2, -1, 0, 1, 2, 3, 4, 5, 6];
  const result = {};
  for (let i = 0; i < names.length; i++) {
    const minPx = baseMin * Math.pow(ratioMin, steps[i]);
    const maxPx = baseMax * Math.pow(ratioMax, steps[i]);
    result[names[i]] = fluidDim(minPx, maxPx);
  }
  return result;
})(),
```

### 1.4 Convert padding to fluid

```javascript
padding: (() => {
  const entries = {
    'xs-y': fluidDim(4, 5),    'xs-x': fluidDim(8, 10),
    'sm-y': fluidDim(6, 8),    'sm-x': fluidDim(12, 16),
    'md-y': fluidDim(8, 12),   'md-x': fluidDim(16, 22),
    'lg-y': fluidDim(12, 16),  'lg-x': fluidDim(24, 32),
    'xl-y': fluidDim(16, 22),  'xl-x': fluidDim(32, 44),
    '2xl-y': fluidDim(24, 32), '2xl-x': fluidDim(48, 64),
  };
  return entries;
})(),
```

### 1.5 Convert radius to fluid (gentle)

```javascript
radius: (() => {
  const entries = {
    none: { $value: '0', $type: 'dimension' },
    xs:   fluidDim(2, 2),      // 2px — no scaling
    sm:   fluidDim(4, 5),      // 4→5px
    md:   fluidDim(8, 10),     // 8→10px
    lg:   fluidDim(12, 14),    // 12→14px
    xl:   fluidDim(16, 20),    // 16→20px
    '2xl': fluidDim(24, 28),   // 24→28px
    full: { $value: '9999px', $type: 'dimension' },
  };
  return entries;
})(),
```

### 1.6 Keep non-scaling tokens static

These should NOT use clamp():
- `blur` — visual effect, viewport-independent
- `opacity` — unitless ratio
- `shadow` — visual effect
- `zIndex` — unitless integer
- `breakpoint` — these ARE the viewport references, can't be fluid
- `color` — not a dimension

### STOP 1.1: Fluid scaling rates

**Question:** Are the min→max ranges above correct for your aesthetic? The current approach:
- Small spaces (1-7): minimal or no scaling
- Medium spaces (8-32): ~25% scaling
- Large spaces (48-128): ~35% scaling
- Font sizes: compounding ratio (minor third at mobile → perfect fourth at desktop)
- Radius: gentle scaling (~20%)
- Padding: scales with space

If these feel wrong, tell me what should be tighter or more aggressive.

---

## Task 2: Tailwind @theme Filtering

### 2.1 Add color tier metadata to `generate-scales.mjs`

Modify the color section to add `$extensions` metadata:

```javascript
color: {
  $type: 'color',

  // Brand hues — IN Tailwind @theme
  teal:    { ...colorRamp(173, 0.08), $extensions: { [CL_EXT]: { tier: 'brand' } } },
  purple:  { ...colorRamp(280, 0.12), $extensions: { [CL_EXT]: { tier: 'brand' } } },
  magenta: { ...colorRamp(330, 0.14), $extensions: { [CL_EXT]: { tier: 'brand' } } },
  ember:   { ...colorRamp(25, 0.12),  $extensions: { [CL_EXT]: { tier: 'brand' } } },
  frost:   { ...colorRamp(220, 0.06), $extensions: { [CL_EXT]: { tier: 'brand' } } },
  cyber:   { ...colorRamp(160, 0.1),  $extensions: { [CL_EXT]: { tier: 'brand' } } },
  void:    { ...voidRamp(220, 0.01),  $extensions: { [CL_EXT]: { tier: 'brand' } } },
  neutral: { ...colorRamp(0, 0),      $extensions: { [CL_EXT]: { tier: 'brand' } } },
  white:   { $value: 'oklch(1 0 0)', $type: 'color' },
  black:   { $value: 'oklch(0 0 0)', $type: 'color' },

  // Full spectrum — OUT of Tailwind @theme
  red:           { ...colorRamp(17, 0.16),  $extensions: { [CL_EXT]: { tier: 'spectrum' } } },
  'red-orange':  { ...colorRamp(38, 0.14),  $extensions: { [CL_EXT]: { tier: 'spectrum' } } },
  // ... (all 22 spectrum hues get tier: 'spectrum')
},
```

**Problem:** `colorRamp()` returns an object with individual step keys (`50`, `100`, etc.), not a spreadable object with `$extensions`. Need to refactor.

**Alternate approach:** Instead of metadata on the token, add a filter function in SD5 that checks the color name:

### 2.2 Add theme-color filter in `sd.config.mjs`

```javascript
/** Colors allowed in Tailwind @theme (brand + utility, no spectrum) */
const BRAND_COLORS = new Set([
  'teal', 'purple', 'magenta', 'ember', 'frost', 'cyber',
  'void', 'neutral', 'white', 'black',
]);

const isBrandColor = (token) => {
  if (token.path[0] !== 'color') return false;
  // token.path = ['color', 'teal', '500'] → check path[1]
  return BRAND_COLORS.has(token.path[1]) || token.path.length === 2; // white/black are path length 2
};
```

Replace the theme-color platform filter:

```javascript
// BEFORE:
'theme-color': { transforms: CSS_TRANSFORMS, buildPath: `...`, files: [themeFile('color.css', pathFilter('color'))] },

// AFTER:
'theme-color': { transforms: CSS_TRANSFORMS, buildPath: `...`, files: [themeFile('color.css', isBrandColor)] },
```

### 2.3 Verify

After rebuild:
- `theme/color.css` should contain teal, purple, magenta, ember, frost, cyber, void, neutral, white, black — NO red, orange, amber, etc.
- `styles/primitives/color.css` should still contain ALL colors (full spectrum available for StyleMacro)

---

## Task 3: Typography Composites for Tailwind

### 3.1 Register custom format `coldlight/tailwind-typography`

Add to `sd.config.mjs` after the existing custom formats:

```javascript
StyleDictionary.registerFormat({
  name: 'coldlight/tailwind-typography',
  format: async ({ dictionary, file }) => {
    const header = await fileHeader({ file });
    const groups = new Map();

    // Group textStyle tokens by style name
    for (const token of dictionary.allTokens) {
      if (token.path[0] !== 'textStyle') continue;
      const styleName = token.path[1]; // e.g., 'display-lg'
      const prop = token.path[2];       // e.g., 'font-size'
      if (!groups.has(styleName)) groups.set(styleName, {});
      groups.get(styleName)[prop] = token.$value ?? token.value;
    }

    // Build Tailwind @theme lines
    const lines = [];
    for (const [name, props] of groups) {
      // Tailwind v4: --font-size-{name} sets the size
      // Additional properties via CSS custom properties
      if (props['font-size']) {
        lines.push(`  --font-size-${name}: ${props['font-size']};`);
      }
      // Store composed properties as individual vars for reference
      if (props['line-height']) lines.push(`  --leading-${name}: ${props['line-height']};`);
      if (props['font-weight']) lines.push(`  --font-weight-${name}: ${props['font-weight']};`);
      if (props['letter-spacing']) lines.push(`  --tracking-${name}: ${props['letter-spacing']};`);
      if (props['font-family']) lines.push(`  --font-${name}: ${props['font-family']};`);
    }

    return `${header}@theme {\n${lines.join('\n')}\n}\n`;
  },
});
```

### 3.2 Add platform

```javascript
'theme-text-composed': {
  transforms: CSS_TRANSFORMS,
  buildPath: `${paths.design}/theme/`,
  files: [{
    destination: 'text-composed.css',
    format: 'coldlight/tailwind-typography',
    filter: pathFilter('textStyle'),
  }],
},
```

### 3.3 Wire into theme/index.css barrel

Add `@import "./text-composed.css";` to the theme barrel in `build.mjs`.

### STOP 3.1: Typography utility naming

**Question:** Should the composed text utilities be:
- `text-display-lg` (Tailwind fontSize key)
- `text-heading-sm`
- `text-body`
- `text-caption`
- etc.

This determines the `--font-size-{name}` var names. Confirm the names match your textStyle DTCG keys (display-lg, display-sm, heading-lg, heading-sm, body, body-sm, caption, overline, code, stat).

---

## Task 4: Migrate Aliases to DTCG

### 4.1 Create `tokens/src/accent.json`

```json
{
  "accent": {
    "$type": "color",
    "$description": "Semantic accent aliases — hue-specific role tokens",
    "teal-main":    { "$value": "{color.teal.400}" },
    "teal-glow":    { "$value": "oklch(0.63 0.08 173 / 0.35)" },
    "teal-fill":    { "$value": "oklch(0.63 0.08 173 / 0.08)" },
    "purple-main":  { "$value": "{color.purple.400}" },
    "purple-glow":  { "$value": "oklch(0.63 0.12 280 / 0.35)" },
    "purple-fill":  { "$value": "oklch(0.63 0.12 280 / 0.08)" },
    "magenta-main": { "$value": "{color.magenta.400}" },
    "magenta-glow": { "$value": "oklch(0.63 0.14 330 / 0.35)" },
    "magenta-fill": { "$value": "oklch(0.63 0.14 330 / 0.08)" },
    "ember-main":   { "$value": "{color.ember.400}" },
    "ember-glow":   { "$value": "oklch(0.63 0.12 25 / 0.35)" },
    "ember-fill":   { "$value": "oklch(0.63 0.12 25 / 0.08)" },
    "frost-main":   { "$value": "{color.frost.400}" },
    "frost-glow":   { "$value": "oklch(0.63 0.06 220 / 0.35)" },
    "frost-fill":   { "$value": "oklch(0.63 0.06 220 / 0.08)" },
    "cyber-main":   { "$value": "{color.cyber.400}" },
    "cyber-glow":   { "$value": "oklch(0.63 0.1 160 / 0.35)" },
    "cyber-fill":   { "$value": "oklch(0.63 0.1 160 / 0.08)" }
  }
}
```

### 4.2 Add border aliases to `tokens/src/border.json`

Add to existing border.json:
```json
"border-soft": { "$value": "oklch(from {color.teal.600} l c h / 0.30)", "$type": "color" },
"border-emphasis": { "$value": "{border.strong}", "$type": "color" }
```

**STOP 4.1:** `oklch(from var() l c h / alpha)` — relative color syntax references. SD5 may not handle `from {token}` references inside oklch(). Need to test. If it doesn't work, these stay as resolved oklch values, not references.

### 4.3 Add overlay aliases to `tokens/src/overlay.json`

Add to existing overlay.json:
```json
"overlay-bg": { "$value": "{overlay.scrim}", "$type": "color" },
"overlay-bg-heavy": { "$value": "{overlay.scrim-heavy}", "$type": "color" }
```

### 4.4 Add SVG track tokens to `tokens/src/svg-presets.json`

Already covered by SVG presets — these can reference the existing track vars.

### 4.5 Wire accent into SD5 config

Add `'accent'` to the semantic tier list:
```javascript
semantic: [
  'elevation', 'surface', 'border', 'borderPreset', 'transition',
  'interaction', 'overlay', 'scrollbar', 'backdrop', 'textStyle',
  'text', 'signal', 'accent',
],
```

Add CSS + theme platforms for accent:
```javascript
// In css-semantic files array:
cssFile('accent.css', pathFilter('accent'), layers.semantic),

// Theme platform:
'theme-accent': { transforms: CSS_TRANSFORMS, buildPath: `${paths.design}/theme/`, files: [themeFile('accent.css', pathFilter('accent'))] },
```

### 4.6 Update build.mjs barrels

Add `accent.css` to styles/index.css and theme/index.css barrel strings.
Add `accent` to types barrel.

### 4.7 Delete aliases.css

After all tokens are migrated and verified:
- Remove `@import "./generated/aliases.css"` from `design/index.css`
- Delete `generated/aliases.css`

**STOP 4.2:** Can we delete aliases.css entirely, or do the SVG track/status-dot tokens still need it? Those should move to their respective preset files.

---

## Task 5: Fix Enriched Preset Types

### 5.1 Update `enrich-presets.mjs`

Fix the `$type` values for font properties:

```javascript
const AXIS_DEFAULTS = {
  "animation":                    { "$value": "none", "$type": "string" },
  "transition-duration":          { "$value": "150ms", "$type": "duration" },
  "transition-timing-function":   { "$value": "ease-out", "$type": "cubicBezier" },
  "gradient":                     { "$value": "none", "$type": "gradient" },
  "font-family":                  { "$value": "inherit", "$type": "fontFamily" },
  "font-size":                    { "$value": "inherit", "$type": "dimension" },
  "font-weight":                  { "$value": "inherit", "$type": "fontWeight" },
  "letter-spacing":               { "$value": "0", "$type": "dimension" },
  "line-height":                  { "$value": "inherit", "$type": "number" },
};
```

### 5.2 Re-run enrichment + SD5 build

```bash
node scripts/build/styledictionary/enrich-presets.mjs
node scripts/build/styledictionary/build.mjs
```

---

## Task 6: Clean Up Build Scripts

### 6.1 Check for variants.css regeneration

Search `build.mjs` for any reference to `variants.css`. If found, remove the generation code.

### 6.2 Verify no dead generation

After full rebuild, confirm no unexpected files appear in `generated/` or `styles/`.

---

## Execution Order

1. Task 1 (fluid clamp) — changes `generate-scales.mjs`
2. Task 5 (fix types) — changes `enrich-presets.mjs`
3. Task 2 (Tailwind filter) — changes `sd.config.mjs`
4. Task 3 (typography compose) — changes `sd.config.mjs` + `build.mjs`
5. Task 4 (aliases → DTCG) — creates new token files, changes `sd.config.mjs` + `build.mjs`
6. Task 6 (cleanup) — verification
7. Full rebuild + compile check

## Gate

- [ ] `pnpm ds:tokens:build` succeeds
- [ ] `pnpm svelte-check` — 0 errors
- [ ] `theme/color.css` has NO spectrum colors (red, orange, amber, etc.)
- [ ] `styles/primitives/spacing.css` has `clamp()` values
- [ ] `styles/primitives/typography.css` has `clamp()` values
- [ ] `theme/text-composed.css` exists with composed text utilities
- [ ] `styles/semantic/accent.css` exists with accent tokens
- [ ] `generated/aliases.css` deleted (or reduced to SVG-only if needed)
- [ ] All `.d.ts` type files regenerated correctly
