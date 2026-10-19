# React Spectrum S2 Style Macro — Reference for ColdLight

> This documents the S2 style macro pattern from Adobe React Spectrum.
> ColdLight adapts this for Svelte 5 + Style Dictionary 5.

## Architecture

```
S2 Style Macro Architecture:
  Theme (token definitions) → style() macro → CSS classes (build time)
  Provider (runtime context) → CSS custom properties → visual output

ColdLight Equivalent:
  SD5 DTCG JSON → sd.config.ts build → CSS custom properties (build time)
  style() function → maps token names to SD5-generated vars → class strings
  Provider (Svelte context) → controls which token set is active
```

## S2 SystemProvider Pattern

```tsx
import { RouterProvider } from "react-aria-components";

export function SystemProvider({ children }) {
  return (
    <RouterProvider navigate={(path) => window.location.assign(path)}>
      {/* SVG filter defs for hardware-accelerated neumorphism */}
      <svg aria-hidden="true" style={{ position: "absolute", width: 0, height: 0 }}>
        <defs>
          <filter id="sys-bevel" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceAlpha" stdDeviation="2" result="blur" />
            <feOffset dx="2" dy="2" result="offsetBlur" />
            <feSpecularLighting
              in="blur" surfaceScale="1" specularConstant="1" specularExponent="20"
              lightingColor="#ffffff"
            >
              <fePointLight x="-10000" y="-10000" z="10000" />
            </feSpecularLighting>
            <feComposite in="specOut" in2="SourceAlpha" operator="in" result="specOut" />
            <feComposite
              in="SourceGraphic" in2="specOut" operator="arithmetic"
              k1="0" k2="1" k3="1" k4="0" result="litPaint"
            />
            <feMerge>
              <feMergeNode in="offsetBlur" />
              <feMergeNode in="litPaint" />
            </feMerge>
          </filter>
        </defs>
      </svg>
      {children}
    </RouterProvider>
  );
}
```

## S2 style() Macro API

### Basic usage — static class name at build time
```tsx
import {style} from '@react-spectrum/s2/style' with {type: 'macro'};

<div className={style({backgroundColor: 'red-400', color: 'white'})}>
```

### Variants — runtime conditional
```tsx
const styles = style({
  backgroundColor: {
    variant: {
      primary: 'accent',
      secondary: 'neutral'
    }
  }
});

function MyComponent({variant}) {
  return <div className={styles({variant})} />
}
```

### State conditions — React Aria render props
```tsx
<Checkbox className={style({
  backgroundColor: {
    default: 'gray-100',
    isHovered: 'gray-200',
    isSelected: 'gray-900'
  }
})} />
```

### Typography
```tsx
<h1 className={style({font: 'heading-xl'})}>Heading</h1>
<p className={style({font: 'body'})}>Body</p>
```

### Spacing (numbers = pixels converted to rem)
```tsx
<Button styles={style({marginStart: 16})}>Hello</Button>
```

## S2 Color System

Colors have light/dark variants resolved by theme:
```typescript
const baseColors = {
  "gray-100": { type: "color", light: "rgb(233,233,233)", dark: "rgb(44,44,44)" },
  "gray-900": { type: "color", light: "rgb(19,19,19)", dark: "rgb(242,242,242)" },
  // Semantic refs
  "accent-800": { type: "ref", light: "blue-800", dark: "blue-800" },
  "negative-800": { type: "ref", light: "red-800", dark: "red-800" },
  // Transparent overlays
  "transparent-white-400": "rgba(255, 255, 255, 0.21)",
};
```

Colors support opacity: `'blue-800/50'` → `rgb(from ${value} r g b / 50%)`

## S2 Style Macro Internals

### Property types:
- `ArbitraryProperty` — raw CSS property passthrough
- `MappedProperty` — maps token names to CSS values via lookup
- `ColorProperty` — extends MappedProperty with opacity support (`color/opacity%`)
- `SizingProperty` — numbers to rem, percentages, viewport units
- `ExpandedProperty` — one token prop expands to multiple CSS properties

### Build process:
1. `style()` called as a macro at build time (via Parcel/bundler)
2. For each property, looks up in theme.properties → gets CSS value
3. Generates CSS classes with hashed names grouped into @layer blocks
4. If all conditions are static → returns a class name string
5. If runtime conditions exist → returns a function that resolves at runtime

### Class name format:
- Property prefix (from properties.json shortnames)
- Condition suffixes (from conditions map)
- Value hash (djb2)
- Version postfix

### Layer system:
- `@layer _.a, _.b, _.c, ...` — priority layers
- Higher priority layers override lower (conditions escalate priority)
- Sub-layers per condition for deduplication

## ColdLight Adaptation Notes

### What ColdLight already has that S2 builds:
- SD5 generates CSS custom properties (S2's "theme" is ColdLight's SD5 output)
- SVG filter defs already mounted via SvgFilters.svelte (S2's SystemProvider pattern)
- 8-axis encoding already maps token names to CSS classes (v-s1, v-d2, v-g1)

### What ColdLight needs from S2:
1. **Typed style function** — maps ColdLight token names to CSS, type-safe
2. **Provider** — Svelte context controlling which theme values are active
3. **Conditional styles** — variant/state-based class resolution
4. **Build-time resolution** — static where possible, runtime function where needed

### Key difference:
- S2 uses Parcel macros (build-time code transform)
- ColdLight can use SD5 output + Tailwind @theme + a runtime style function
- SD5 already does the "build-time" part — generates the CSS
- ColdLight's style function maps semantic names to the SD5-generated classes/vars
- No need for a macro bundler plugin — SD5 IS the build step
