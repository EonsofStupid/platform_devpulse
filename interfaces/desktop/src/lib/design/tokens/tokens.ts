/**
 * @file src/lib/design/tokens/tokens.ts
 * @layer tokens
 *
 * @description
 * SSOT (Single Source of Truth) for COLD LIGHT Design System tokens.
 * This file is the canonical definition - all other token files are GENERATED.
 *
 * DO NOT EDIT tokens.css, types.ts, or tailwind.preset.ts directly.
 * Run `pnpm ds:tokens:build` to regenerate them from this file.
 *
 * @generated-files
 * - tokens.css (CSS custom properties)
 * - types.ts (TypeScript types and runtime arrays)
 * - tailwind.preset.ts (Tailwind theme mapping)
 *
 * @since 1.0.0
 */

// ===========================================
// OKLCH COLOR TYPE
// ===========================================
export interface OklchColor {
  /** Lightness: 0-1 (displayed as 0%-100% in CSS) */
  l: number;
  /** Chroma: 0-0.4 typically */
  c: number;
  /** Hue: 0-360 degrees */
  h: number;
  /** Alpha: 0-1 (optional, defaults to 1) */
  a?: number;
}

// ===========================================
// BASE HUES (Source of Truth)
// ===========================================
export const hues = {
  teal: 195,
  purple: 280,
  matte: 200,
  electric: 220,
  magenta: 330,
  ember: 35,
  frost: 210,
} as const;

export type HueKey = keyof typeof hues;

// ===========================================
// COLOR SCALES
// Each scale has 9 steps (100-900)
// ===========================================
export const colorScales = {
  teal: {
    100: { l: 0.95, c: 0.05, h: hues.teal },
    200: { l: 0.85, c: 0.08, h: hues.teal },
    300: { l: 0.75, c: 0.12, h: hues.teal },
    400: { l: 0.65, c: 0.16, h: hues.teal },
    500: { l: 0.55, c: 0.18, h: hues.teal },
    600: { l: 0.45, c: 0.16, h: hues.teal },
    700: { l: 0.35, c: 0.12, h: hues.teal },
    800: { l: 0.25, c: 0.08, h: hues.teal },
    900: { l: 0.15, c: 0.05, h: hues.teal },
  },
  purple: {
    100: { l: 0.95, c: 0.05, h: hues.purple },
    200: { l: 0.85, c: 0.10, h: hues.purple },
    300: { l: 0.75, c: 0.15, h: hues.purple },
    400: { l: 0.65, c: 0.20, h: hues.purple },
    500: { l: 0.55, c: 0.22, h: hues.purple },
    600: { l: 0.45, c: 0.20, h: hues.purple },
    700: { l: 0.35, c: 0.15, h: hues.purple },
    800: { l: 0.25, c: 0.10, h: hues.purple },
    900: { l: 0.15, c: 0.05, h: hues.purple },
  },
  magenta: {
    100: { l: 0.95, c: 0.05, h: hues.magenta },
    200: { l: 0.85, c: 0.12, h: hues.magenta },
    300: { l: 0.75, c: 0.18, h: hues.magenta },
    400: { l: 0.65, c: 0.22, h: hues.magenta },
    500: { l: 0.55, c: 0.24, h: hues.magenta },
    600: { l: 0.45, c: 0.22, h: hues.magenta },
    700: { l: 0.35, c: 0.18, h: hues.magenta },
    800: { l: 0.25, c: 0.12, h: hues.magenta },
    900: { l: 0.15, c: 0.06, h: hues.magenta },
  },
  ember: {
    100: { l: 0.95, c: 0.05, h: hues.ember },
    200: { l: 0.85, c: 0.12, h: hues.ember },
    300: { l: 0.75, c: 0.18, h: hues.ember },
    400: { l: 0.68, c: 0.20, h: hues.ember },
    500: { l: 0.60, c: 0.22, h: hues.ember },
    600: { l: 0.50, c: 0.20, h: hues.ember },
    700: { l: 0.40, c: 0.16, h: hues.ember },
    800: { l: 0.30, c: 0.10, h: hues.ember },
    900: { l: 0.20, c: 0.05, h: hues.ember },
  },
  frost: {
    100: { l: 0.98, c: 0.01, h: hues.frost },
    200: { l: 0.95, c: 0.02, h: hues.frost },
    300: { l: 0.90, c: 0.03, h: hues.frost },
    400: { l: 0.82, c: 0.04, h: hues.frost },
    500: { l: 0.70, c: 0.04, h: hues.frost },
    600: { l: 0.55, c: 0.03, h: hues.frost },
    700: { l: 0.40, c: 0.02, h: hues.frost },
    800: { l: 0.25, c: 0.01, h: hues.frost },
    900: { l: 0.12, c: 0.01, h: hues.frost },
  },
} as const;

export type ColorScaleKey = keyof typeof colorScales;
export type ColorStep = 100 | 200 | 300 | 400 | 500 | 600 | 700 | 800 | 900;

// ===========================================
// MATTE SURFACES
// ===========================================
export const matte = {
  dark: { l: 0.08, c: 0.04, h: hues.matte },
  mid: { l: 0.12, c: 0.05, h: hues.matte },
  light: { l: 0.18, c: 0.06, h: hues.matte },
} as const;

export type MatteKey = keyof typeof matte;

// ===========================================
// GLASS SURFACES
// ===========================================
export const glass = {
  tintTeal: { l: 0.50, c: 0.12, h: hues.teal, a: 0.15 },
  tintPurple: { l: 0.45, c: 0.15, h: hues.purple, a: 0.15 },
  base: { l: 0.10, c: 0.03, h: hues.teal, a: 0.85 },
  void: { l: 0.06, c: 0.02, h: hues.teal, a: 0.92 },
  deep: { l: 0.10, c: 0.04, h: hues.teal, a: 0.88 },
  smoke: { l: 0.15, c: 0.03, h: hues.matte, a: 0.82 },
  frost: { l: 0.25, c: 0.02, h: hues.frost, a: 0.75 },
} as const;

export type GlassKey = keyof typeof glass;

// ===========================================
// TEXT COLORS
// ===========================================
export const text = {
  primary: { l: 0.95, c: 0.01, h: hues.teal },
  secondary: { l: 0.75, c: 0.02, h: hues.teal },
  muted: { l: 0.55, c: 0.03, h: hues.teal },
  white: { l: 0.98, c: 0.01, h: hues.frost },
} as const;

export type TextColorKey = keyof typeof text;

// ===========================================
// SPACING (clamp-based fluid scale)
// ===========================================
export const spacing = {
  1: { min: 2, preferred: 0.25, max: 4 },
  2: { min: 4, preferred: 0.5, max: 8 },
  3: { min: 8, preferred: 0.75, max: 12 },
  4: { min: 12, preferred: 1, max: 16 },
  5: { min: 16, preferred: 1.25, max: 20 },
  6: { min: 20, preferred: 1.5, max: 24 },
  8: { min: 28, preferred: 2, max: 32 },
} as const;

export type SpacingKey = keyof typeof spacing;
export const spacingKeys = ["1", "2", "3", "4", "5", "6", "8"] as const;

// Panel gap
export const panelGap = { min: 3, preferred: 0.4, max: 6 };

// ===========================================
// RADIUS
// ===========================================
export const radius = {
  none: "0",
  sm: { min: 4, preferred: 0.5, max: 6 },
  md: { min: 6, preferred: 0.75, max: 10 },
  lg: { min: 10, preferred: 1, max: 14 },
  xl: { min: 14, preferred: 1.25, max: 20 },
  full: "9999px",
} as const;

export type RadiusKey = keyof typeof radius;
export const radiusKeys = ["none", "sm", "md", "lg", "xl", "full"] as const;

// ===========================================
// BORDERS
// ===========================================
export const borderWidth = {
  thin: "1px",
  medium: "2px",
  thick: "3px",
} as const;

export type BorderWidthKey = keyof typeof borderWidth;

// ===========================================
// BLUR
// ===========================================
export const blur = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export type BlurKey = keyof typeof blur;
export const blurKeys = ["off", "sm", "md", "lg", "xl"] as const;

// ===========================================
// GLOW
// ===========================================
export const glowBase = {
  color: { l: 0.70, c: 0.18, h: hues.teal },
  sm: "0 0 8px",
  md: "0 0 16px",
  lg: "0 0 24px",
} as const;

// Composed glow tokens (box-shadow ready)
export const glowComposed = {
  teal: {
    inner: { l: 0.60, c: 0.18, h: hues.teal, a: 0.5, spread: 20 },
    outer: { l: 0.55, c: 0.15, h: hues.teal, a: 0.25, spread: 40 },
  },
  purple: {
    inner: { l: 0.55, c: 0.20, h: hues.purple, a: 0.5, spread: 20 },
    outer: { l: 0.50, c: 0.18, h: hues.purple, a: 0.25, spread: 40 },
  },
  magenta: {
    inner: { l: 0.60, c: 0.22, h: hues.magenta, a: 0.5, spread: 20 },
    outer: { l: 0.55, c: 0.20, h: hues.magenta, a: 0.25, spread: 40 },
  },
  ember: {
    inner: { l: 0.65, c: 0.20, h: hues.ember, a: 0.5, spread: 20 },
    outer: { l: 0.60, c: 0.18, h: hues.ember, a: 0.25, spread: 40 },
  },
  frost: {
    inner: { l: 0.85, c: 0.03, h: hues.frost, a: 0.4, spread: 20 },
    outer: { l: 0.80, c: 0.02, h: hues.frost, a: 0.2, spread: 40 },
  },
} as const;

export type GlowKey = keyof typeof glowComposed | "off";
export const glowKeys = ["off", "teal", "purple", "magenta", "ember", "frost"] as const;

// ===========================================
// DEPTH / BEVEL / SHADOW
// ===========================================
export const bevel = {
  light: { l: 0.80, c: 0.06, h: hues.teal, a: 0.3 },
  lightStrong: { l: 0.90, c: 0.08, h: hues.teal, a: 0.5 },
  dark: { l: 0.15, c: 0.04, h: hues.purple, a: 0.5 },
  darkStrong: { l: 0.08, c: 0.06, h: hues.purple, a: 0.7 },
} as const;

export const inset = {
  light: { l: 0.25, c: 0.03, h: hues.matte, a: 0.3 },
  dark: { l: 0.05, c: 0.02, h: hues.matte, a: 0.6 },
} as const;

export const shadow = {
  sm: { y: 2, blur: 8, color: { l: 0.05, c: 0.02, h: hues.purple, a: 0.3 } },
  md: { y: 4, blur: 16, color: { l: 0.05, c: 0.02, h: hues.purple, a: 0.4 } },
  lg: { y: 8, blur: 32, color: { l: 0.05, c: 0.02, h: hues.purple, a: 0.5 } },
} as const;

// Z-level shadows (elevation system)
export const shadowZ = {
  z1: { y: 1, blur: 4, color: { l: 0.05, c: 0.02, h: hues.purple, a: 0.2 } },
  z2: { y: 4, blur: 12, color: { l: 0.05, c: 0.02, h: hues.purple, a: 0.35 } },
  z3: { y: 8, blur: 24, color: { l: 0.05, c: 0.02, h: hues.purple, a: 0.45 } },
  z4: { y: 16, blur: 48, color: { l: 0.05, c: 0.02, h: hues.purple, a: 0.55 } },
} as const;

export type ShadowKey = keyof typeof shadow;
export type ShadowZKey = keyof typeof shadowZ;

// Imprint intensity levels
export const imprint = {
  subtle: 0.3,
  medium: 0.5,
  strong: 0.8,
} as const;

export type ImprintKey = keyof typeof imprint;
export const imprintKeys = ["subtle", "medium", "strong"] as const;

// Bevel tokens for VPB
export const bevelKeys = ["off", "subtle", "soft", "medium"] as const;
export type BevelKey = (typeof bevelKeys)[number];

// Depth tokens (0-4)
export const depthKeys = [0, 1, 2, 3, 4] as const;
export type DepthKey = (typeof depthKeys)[number];

// Shell depth tokens
export const shellDepthKeys = ["shallow", "standard", "deep"] as const;
export type ShellDepthKey = (typeof shellDepthKeys)[number];

// ===========================================
// TYPOGRAPHY
// ===========================================
export const fontFamily = {
  sans: "'Inter', system-ui, sans-serif",
  mono: "'JetBrains Mono', monospace",
} as const;

export type FontFamilyKey = keyof typeof fontFamily;

export const textSize = {
  xs: { min: 0.65, preferred: 1, max: 0.75 },
  sm: { min: 0.75, preferred: 1.1, max: 0.875 },
  base: { min: 0.875, preferred: 1.25, max: 1 },
  lg: { min: 1, preferred: 1.5, max: 1.125 },
  xl: { min: 1.125, preferred: 1.75, max: 1.25 },
  "2xl": { min: 1.25, preferred: 2, max: 1.5 },
} as const;

export type TextSizeKey = keyof typeof textSize;
export const textSizeKeys = ["xs", "sm", "base", "lg", "xl", "2xl"] as const;

// ===========================================
// TRANSITIONS
// ===========================================
export const easing = {
  out: "cubic-bezier(0.16, 1, 0.3, 1)",
  bounce: "cubic-bezier(0.68, -0.55, 0.265, 1.55)",
} as const;

export type EasingKey = keyof typeof easing;

export const duration = {
  fast: 150,
  normal: 300,
  slow: 500,
} as const;

export type DurationKey = keyof typeof duration;

// ===========================================
// Z-INDEX
// ===========================================
export const zIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
  overlay: 700,
} as const;

export type ZIndexKey = keyof typeof zIndex;

// ===========================================
// CODE SYNTAX COLORS
// ===========================================
export const code = {
  str: { l: 0.80, c: 0.15, h: 85 },
  num: { l: 0.75, c: 0.18, h: 35 },
  kw: { l: 0.75, c: 0.15, h: 330 },
  fn: { l: 0.80, c: 0.12, h: 195 },
  cmt: { l: 0.55, c: 0.05, h: 195 },
} as const;

export type CodeColorKey = keyof typeof code;

// ===========================================
// GLASS COMPONENT TOKENS
// ===========================================
export const glassButton = {
  bg: { l: 0.15, c: 0.03, h: hues.teal, a: 0.6 },
  bgHover: { l: 0.20, c: 0.05, h: hues.teal, a: 0.7 },
  bgPrimary: { l: 0.45, c: 0.15, h: hues.teal, a: 0.8 },
  bgPrimaryHover: { l: 0.50, c: 0.18, h: hues.teal, a: 0.9 },
  border: { l: 0.50, c: 0.10, h: hues.teal, a: 0.3 },
  borderHover: { l: 0.60, c: 0.15, h: hues.teal, a: 0.5 },
  borderPrimary: { l: 0.60, c: 0.18, h: hues.teal, a: 0.6 },
  glowHover: { l: 0.60, c: 0.15, h: hues.teal, a: 0.3 },
  shadowBase: { l: 0.05, c: 0.02, h: hues.purple, a: 0.3 },
} as const;

export const glassInput = {
  bg: { l: 0.08, c: 0.02, h: hues.matte, a: 0.8 },
  border: { l: 0.40, c: 0.08, h: hues.teal, a: 0.3 },
  borderFocus: { l: 0.60, c: 0.15, h: hues.teal, a: 0.6 },
  glowFocus: { l: 0.60, c: 0.15, h: hues.teal, a: 0.3 },
} as const;

export const glassTint = {
  teal: { l: 0.55, c: 0.15, h: hues.teal, a: 0.4 },
  purple: { l: 0.50, c: 0.18, h: hues.purple, a: 0.4 },
  purpleBg: { l: 0.15, c: 0.04, h: hues.purple, a: 0.6 },
  gold: { l: 0.60, c: 0.15, h: 50, a: 0.4 },
  goldBg: { l: 0.18, c: 0.05, h: 50, a: 0.6 },
  coral: { l: 0.55, c: 0.18, h: 25, a: 0.4 },
  coralBg: { l: 0.15, c: 0.05, h: 25, a: 0.6 },
} as const;

export const glassScrim = {
  bg: { l: 0.05, c: 0.02, h: hues.teal, a: 0.7 },
} as const;

// ===========================================
// PANEL COMPONENT TOKENS
// ===========================================
export const panel = {
  outerBorder: { l: 0.50, c: 0.10, h: hues.teal, a: 0.4 },
  outerBorderHover: { l: 0.60, c: 0.14, h: hues.teal, a: 0.5 },
  outerGlow: { l: 0.60, c: 0.15, h: hues.teal, a: 0.2 },
  innerBorder: { l: 0.60, c: 0.08, h: hues.teal, a: 0.2 },
  innerGradientTeal: {
    start: { l: 0.65, c: 0.15, h: hues.teal, a: 0.25 },
    mid: { l: 0.55, c: 0.12, h: hues.teal, a: 0.12 },
  },
  innerGradientPurple: {
    start: { l: 0.55, c: 0.18, h: hues.purple, a: 0.25 },
    mid: { l: 0.45, c: 0.15, h: hues.purple, a: 0.12 },
  },
  innerBase: { l: 0.12, c: 0.04, h: hues.teal, a: 0.9 },
  focusRing: { l: 0.65, c: 0.18, h: hues.teal, a: 0.5 },
  focusGlow: { l: 0.60, c: 0.15, h: hues.teal, a: 0.3 },
} as const;

// ===========================================
// SEMANTIC SURFACES
// ===========================================
export const surface = {
  1: { l: 0.06, c: 0.02, h: 195, a: 0.95 }, // Deepest/Base
  2: { l: 0.10, c: 0.03, h: 195, a: 0.90 }, // Panel/Sunken
  3: { l: 0.14, c: 0.04, h: 195, a: 0.85 }, // Raised/Card
  4: { l: 0.18, c: 0.05, h: 195, a: 0.80 }, // Overlay/Pop
} as const;

export type SurfaceLevelKey = keyof typeof surface;

// ===========================================
// ACCENT / SIGNALS
// ===========================================
export const accent = {
  cyber: { l: 0.9106, c: 0.1598, h: 126.64 },
  tint: { l: 0.9106, c: 0.1598, h: 126.64, a: 0.15 },
} as const;

export type AccentKey = keyof typeof accent;

// ===========================================
// VPB TOKEN CATEGORIES (for dropdowns)
// ===========================================
export const accentTokens = ["teal", "purple", "magenta", "ember", "frost"] as const;
export type AccentToken = (typeof accentTokens)[number];

export const surfaceTokens = ["glass", "solid", "matte"] as const;
export type SurfaceToken = (typeof surfaceTokens)[number];

export const glassVariantTokens = ["void", "deep", "smoke", "frost"] as const;
export type GlassVariantToken = (typeof glassVariantTokens)[number];

export const sizeTokens = ["sm", "md", "lg"] as const;
export type SizeToken = (typeof sizeTokens)[number];

export const paddingTokens = ["sm", "md", "lg"] as const;
export type PaddingToken = (typeof paddingTokens)[number];

// ===========================================
// TOKEN CATEGORIES INTERFACE (for VPB)
// ===========================================
export interface TokenCategories {
  accent: AccentToken;
  glow: GlowKey;
  surface: SurfaceToken;
  glassVariant: GlassVariantToken;
  size: SizeToken;
  radius: RadiusKey;
  blur: (typeof blurKeys)[number];
  depth: DepthKey;
  bevel: BevelKey;
  imprint: ImprintKey;
  shellDepth: ShellDepthKey;
  space: SpacingKey;
  textSize: TextSizeKey;
  padding: PaddingToken;
}

// ===========================================
// ALL TOKEN ARRAYS (for VPB dropdowns)
// ===========================================
export const TokenArrays = {
  accent: accentTokens,
  glow: glowKeys,
  surface: surfaceTokens,
  glassVariant: glassVariantTokens,
  size: sizeTokens,
  radius: radiusKeys,
  blur: blurKeys,
  depth: depthKeys,
  bevel: bevelKeys,
  imprint: imprintKeys,
  shellDepth: shellDepthKeys,
  space: spacingKeys,
  textSize: textSizeKeys,
  padding: paddingTokens,
} as const;
