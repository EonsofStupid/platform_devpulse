/**
 * @file scripts/dev/design/ds-tokens-build.ts
 *
 * @description
 * Token generator - produces tokens.css, types.ts, and tailwind.preset.ts
 * from the SSOT tokens.ts file.
 *
 * Usage:
 *   pnpm ds:tokens:build    # One-shot generation
 *   pnpm ds:tokens:watch    # Watch mode (use ds-tokens-watch.ts)
 *
 * @since 1.0.0
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import {
  hues,
  colorScales,
  matte,
  glass,
  text,
  spacing,
  panelGap,
  radius,
  borderWidth,
  blur,
  glowBase,
  glowComposed,
  bevel,
  inset,
  shadow,
  shadowZ,
  imprint,
  fontFamily,
  textSize,
  easing,
  duration,
  zIndex,
  code,
  surface,
  accent,
  // Component tokens
  glassButton,
  glassInput,
  glassTint,
  glassScrim,
  panel,
  // Token arrays for types.ts
  accentTokens,
  glowKeys,
  surfaceTokens,
  glassVariantTokens,
  sizeTokens,
  radiusKeys,
  blurKeys,
  depthKeys,
  bevelKeys,
  imprintKeys,
  shellDepthKeys,
  spacingKeys,
  textSizeKeys,
  paddingTokens,
  type OklchColor,
} from "../../../src/lib/design/tokens/tokens.js";

// ===========================================
// HELPERS
// ===========================================

function oklchToCSS(color: OklchColor): string {
  const l = `${(color.l * 100).toFixed(0)}%`;
  const c = color.c.toFixed(2);
  const h = typeof color.h === "number" ? color.h : `var(--dp-hue-${color.h})`;

  if (color.a !== undefined && color.a < 1) {
    return `oklch(${l} ${c} ${h} / ${color.a})`;
  }
  return `oklch(${l} ${c} ${h})`;
}

function oklchToRaw(color: OklchColor): string {
  const l = `${(color.l * 100).toFixed(0)}%`;
  const c = color.c.toFixed(2);
  const h = typeof color.h === "number" ? color.h : `var(--dp-hue-${color.h})`;
  return `${l} ${c} ${h}`;
}

function clampValue(v: { min: number; preferred: number; max: number }, unit = "px"): string {
  return `clamp(${v.min}${unit}, ${v.preferred}vw, ${v.max}${unit})`;
}

function clampRem(v: { min: number; preferred: number; max: number }): string {
  return `clamp(${v.min}rem, ${v.preferred}vw, ${v.max}rem)`;
}

// ===========================================
// CSS GENERATOR
// ===========================================

function generateCSS(): string {
  const lines: string[] = [];

  lines.push(`/**
 * @file src/lib/design/tokens/tokens.css
 * @layer tokens
 *
 * @description
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from tokens.ts by ds-tokens-build.ts
 *
 * Run \`pnpm ds:tokens:build\` to regenerate.
 *
 * @since 1.0.0
 */

/* ============================================
   TOKENS.CSS - COLD LIGHT Design System SSOT
   All values OKLCH, token-based, VPB-ready
   ============================================ */

:root {`);

  // Base Hues
  lines.push(`  /* =============================================
     COLOR SYSTEM - OKLCH (Hue-based tokens)
     ============================================= */

  /* Base Hues (the source of truth) */`);
  for (const [name, value] of Object.entries(hues)) {
    lines.push(`  --dp-hue-${name}: ${value};`);
  }

  // Color Scales
  for (const [scaleName, scale] of Object.entries(colorScales)) {
    lines.push(`
  /* Derived Colors - ${scaleName.charAt(0).toUpperCase() + scaleName.slice(1)} family */`);
    for (const [step, color] of Object.entries(scale)) {
      lines.push(`  --dp-${scaleName}-${step}: oklch(${(color.l * 100).toFixed(0)}% ${color.c.toFixed(2)} var(--dp-hue-${scaleName}));`);
    }
  }

  // Matte surfaces
  lines.push(`
  /* Derived Colors - Matte Surface (Deep teal-blue) */`);
  for (const [name, color] of Object.entries(matte)) {
    lines.push(`  --dp-matte-${name}: oklch(${(color.l * 100).toFixed(0)}% ${color.c.toFixed(2)} var(--dp-hue-matte));`);
  }

  // Glass
  lines.push(`
  /* Glass Tints (Semi-transparent for layering) */`);
  lines.push(`  --dp-glass-tint-teal: oklch(${(glass.tintTeal.l * 100).toFixed(0)}% ${glass.tintTeal.c.toFixed(2)} var(--dp-hue-teal) / ${glass.tintTeal.a});`);
  lines.push(`  --dp-glass-tint-purple: oklch(${(glass.tintPurple.l * 100).toFixed(0)}% ${glass.tintPurple.c.toFixed(2)} var(--dp-hue-purple) / ${glass.tintPurple.a});`);
  lines.push(`  --dp-glass-base: oklch(${(glass.base.l * 100).toFixed(0)}% ${glass.base.c.toFixed(2)} var(--dp-hue-teal) / ${glass.base.a});`);

  lines.push(`
  /* Glass Surface Variants (VPB selectable) */`);
  lines.push(`  --dp-glass-void: oklch(${(glass.void.l * 100).toFixed(0)}% ${glass.void.c.toFixed(2)} var(--dp-hue-teal) / ${glass.void.a});`);
  lines.push(`  --dp-glass-deep: oklch(${(glass.deep.l * 100).toFixed(0)}% ${glass.deep.c.toFixed(2)} var(--dp-hue-teal) / ${glass.deep.a});`);
  lines.push(`  --dp-glass-smoke: oklch(${(glass.smoke.l * 100).toFixed(0)}% ${glass.smoke.c.toFixed(2)} var(--dp-hue-matte) / ${glass.smoke.a});`);
  lines.push(`  --dp-glass-frost: oklch(${(glass.frost.l * 100).toFixed(0)}% ${glass.frost.c.toFixed(2)} var(--dp-hue-frost) / ${glass.frost.a});`);

  // Text
  lines.push(`
  /* Text */`);
  lines.push(`  --dp-text-primary: oklch(${(text.primary.l * 100).toFixed(0)}% ${text.primary.c.toFixed(2)} var(--dp-hue-teal));`);
  lines.push(`  --dp-text-secondary: oklch(${(text.secondary.l * 100).toFixed(0)}% ${text.secondary.c.toFixed(2)} var(--dp-hue-teal));`);
  lines.push(`  --dp-text-muted: oklch(${(text.muted.l * 100).toFixed(0)}% ${text.muted.c.toFixed(2)} var(--dp-hue-teal));`);
  lines.push(`  --dp-text-white: oklch(${(text.white.l * 100).toFixed(0)}% ${text.white.c.toFixed(2)} var(--dp-hue-frost));`);

  // Spacing
  lines.push(`
  /* =============================================
     SPACING - Fluid clamp() based
     ============================================= */`);
  for (const [key, value] of Object.entries(spacing)) {
    lines.push(`  --dp-space-${key}: ${clampValue(value)};`);
  }
  lines.push(`
  /* Gap for panel structure */
  --dp-panel-gap: ${clampValue(panelGap)};`);

  // Radius
  lines.push(`
  /* =============================================
     BORDERS & RADIUS - Fluid
     ============================================= */`);
  lines.push(`  --dp-radius-none: 0;`);
  for (const [key, value] of Object.entries(radius)) {
    if (key === "none" || key === "full") continue;
    if (typeof value === "object") {
      lines.push(`  --dp-radius-${key}: ${clampValue(value)};`);
    }
  }
  lines.push(`  --dp-radius-full: 9999px;`);
  lines.push("");
  for (const [key, value] of Object.entries(borderWidth)) {
    lines.push(`  --dp-border-${key}: ${value};`);
  }

  // Blur
  lines.push(`
  /* =============================================
     EFFECTS - Blur, Glow, Shadow
     ============================================= */`);
  for (const [key, value] of Object.entries(blur)) {
    lines.push(`  --dp-blur-${key}: ${value}px;`);
  }
  lines.push("");
  lines.push(`  --dp-glow-color: oklch(${(glowBase.color.l * 100).toFixed(0)}% ${glowBase.color.c.toFixed(2)} var(--dp-hue-teal));`);
  lines.push(`  --dp-glow-sm: ${glowBase.sm};`);
  lines.push(`  --dp-glow-md: ${glowBase.md};`);
  lines.push(`  --dp-glow-lg: ${glowBase.lg};`);

  // Composed glows
  lines.push(`
  /* Composed Glow Tokens (VPB selectable, box-shadow ready) */`);
  for (const [name, g] of Object.entries(glowComposed)) {
    const inner = `oklch(${(g.inner.l * 100).toFixed(0)}% ${g.inner.c.toFixed(2)} var(--dp-hue-${name}) / ${g.inner.a})`;
    const outer = `oklch(${(g.outer.l * 100).toFixed(0)}% ${g.outer.c.toFixed(2)} var(--dp-hue-${name}) / ${g.outer.a})`;
    lines.push(`  --dp-glow-${name}: 0 0 ${g.inner.spread}px ${inner}, 0 0 ${g.outer.spread}px ${outer};`);
  }

  // Depth / Bevel
  lines.push(`
  /* =============================================
     DEPTH - Bevel & Shadow tokens
     ============================================= */
  /* Light edge (top-left highlight) */`);
  lines.push(`  --dp-bevel-light: oklch(${(bevel.light.l * 100).toFixed(0)}% ${bevel.light.c.toFixed(2)} var(--dp-hue-teal) / ${bevel.light.a});`);
  lines.push(`  --dp-bevel-light-strong: oklch(${(bevel.lightStrong.l * 100).toFixed(0)}% ${bevel.lightStrong.c.toFixed(2)} var(--dp-hue-teal) / ${bevel.lightStrong.a});`);
  lines.push(`
  /* Dark edge (bottom-right shadow) */`);
  lines.push(`  --dp-bevel-dark: oklch(${(bevel.dark.l * 100).toFixed(0)}% ${bevel.dark.c.toFixed(2)} var(--dp-hue-purple) / ${bevel.dark.a});`);
  lines.push(`  --dp-bevel-dark-strong: oklch(${(bevel.darkStrong.l * 100).toFixed(0)}% ${bevel.darkStrong.c.toFixed(2)} var(--dp-hue-purple) / ${bevel.darkStrong.a});`);
  lines.push(`
  /* Inset (stamped) bevels */`);
  lines.push(`  --dp-inset-light: oklch(${(inset.light.l * 100).toFixed(0)}% ${inset.light.c.toFixed(2)} var(--dp-hue-matte) / ${inset.light.a});`);
  lines.push(`  --dp-inset-dark: oklch(${(inset.dark.l * 100).toFixed(0)}% ${inset.dark.c.toFixed(2)} var(--dp-hue-matte) / ${inset.dark.a});`);

  // Shadows
  lines.push(`
  /* Drop shadows */`);
  for (const [key, s] of Object.entries(shadow)) {
    lines.push(`  --dp-shadow-${key}: 0 ${s.y}px ${s.blur}px oklch(${(s.color.l * 100).toFixed(0)}% ${s.color.c.toFixed(2)} var(--dp-hue-purple) / ${s.color.a});`);
  }
  lines.push(`
  /* Shadow Z-Levels (elevation system) */`);
  for (const [key, s] of Object.entries(shadowZ)) {
    lines.push(`  --dp-shadow-${key}: 0 ${s.y}px ${s.blur}px oklch(${(s.color.l * 100).toFixed(0)}% ${s.color.c.toFixed(2)} var(--dp-hue-purple) / ${s.color.a});`);
  }

  // Bevel presets
  lines.push(`
  /* Bevel Presets (composed box-shadows) */
  --dp-bevel-outset: inset 1px 1px 0 var(--dp-bevel-light), inset -1px -1px 0 var(--dp-bevel-dark);
  --dp-bevel-inset: inset -1px -1px 0 var(--dp-bevel-light), inset 1px 1px 0 var(--dp-bevel-dark);
  --dp-bevel-deep: inset 2px 2px 4px var(--dp-inset-dark), inset -1px -1px 2px var(--dp-inset-light);

  /* Bevel Imprint (embossed edge for shell layers) */
  --dp-bevel-imprint: inset 0 1px 0 var(--dp-bevel-light-strong), inset 0 -1px 0 var(--dp-bevel-dark-strong), inset 1px 0 0 oklch(40% 0.05 var(--dp-hue-teal) / 0.3), inset -1px 0 0 oklch(20% 0.03 var(--dp-hue-purple) / 0.4);
  --dp-bevel-pressed: inset 2px 2px 6px var(--dp-inset-dark), inset -1px -1px 3px var(--dp-inset-light), inset 0 0 12px var(--dp-inset-dark);`);

  // Imprint intensity
  lines.push(`
  /* Imprint Intensity (VPB selectable) */`);
  for (const [key, value] of Object.entries(imprint)) {
    lines.push(`  --dp-imprint-${key}: ${value};`);
  }

  // Border presets
  lines.push(`
  /* Border Presets (VPB selectable) */
  --dp-border-soft: var(--dp-border-thin) solid oklch(50% 0.08 var(--dp-hue-teal) / 0.3);
  --dp-border-glow: var(--dp-border-thin) solid oklch(60% 0.15 var(--dp-hue-teal) / 0.5);
  --dp-border-matte: var(--dp-border-thin) solid oklch(30% 0.04 var(--dp-hue-matte) / 0.4);`);

  // Typography
  lines.push(`
  /* =============================================
     TYPOGRAPHY - Fluid
     ============================================= */
  --dp-font-sans: ${fontFamily.sans};
  --dp-font-mono: ${fontFamily.mono};
`);
  for (const [key, value] of Object.entries(textSize)) {
    lines.push(`  --dp-text-${key}: ${clampRem(value)};`);
  }

  // Transitions
  lines.push(`
  /* =============================================
     TRANSITIONS
     ============================================= */
  --dp-ease-out: ${easing.out};
  --dp-ease-bounce: ${easing.bounce};
  --dp-duration-fast: ${duration.fast}ms;
  --dp-duration-normal: ${duration.normal}ms;
  --dp-duration-slow: ${duration.slow}ms;

  /* Composed Transitions */
  --dp-transition-fast: var(--dp-duration-fast) var(--dp-ease-out);
  --dp-transition-normal: var(--dp-duration-normal) var(--dp-ease-out);`);

  // Z-index
  lines.push(`
  /* =============================================
     Z-INDEX SYSTEM
     ============================================= */`);
  for (const [key, value] of Object.entries(zIndex)) {
    lines.push(`  --dp-z-${key}: ${value};`);
  }

  // Code colors
  lines.push(`
  /* Data/Code Colors (Generic) */`);
  for (const [key, color] of Object.entries(code)) {
    lines.push(`  --dp-code-${key}: oklch(${(color.l * 100).toFixed(0)}% ${color.c.toFixed(2)} ${color.h});`);
  }

  // Semantic surfaces
  lines.push(`
  /* Semantic Surfaces (Generic) */`);
  for (const [key, color] of Object.entries(surface)) {
    const comment = key === "1" ? "/* Deepest/Base */" : key === "2" ? "/* Panel/Sunken */" : key === "3" ? "/* Raised/Card */" : "/* Overlay/Pop */";
    lines.push(`  --dp-surface-${key}: oklch(${(color.l * 100).toFixed(0)}% ${color.c.toFixed(2)} ${color.h} / ${color.a}); ${comment}`);
  }

  // Accents
  lines.push(`
  /* Accents / Signals (Generic) */
  --dp-accent-cyber: oklch(${accent.cyber.l} ${accent.cyber.c} ${accent.cyber.h}); /* Neon Scan/Highlight */
  --dp-accent-tint: oklch(${accent.tint.l} ${accent.tint.c} ${accent.tint.h} / ${accent.tint.a}); /* Overlay Tint */`);

  // Glass Button tokens
  lines.push(`
  /* =============================================
     COMPONENT TOKENS - Glass Button
     ============================================= */`);
  lines.push(`  --dp-glass-btn-bg: ${oklchToCSS(glassButton.bg)};`);
  lines.push(`  --dp-glass-btn-bg-hover: ${oklchToCSS(glassButton.bgHover)};`);
  lines.push(`  --dp-glass-btn-bg-primary: ${oklchToCSS(glassButton.bgPrimary)};`);
  lines.push(`  --dp-glass-btn-bg-primary-hover: ${oklchToCSS(glassButton.bgPrimaryHover)};`);
  lines.push(`  --dp-glass-btn-border: ${oklchToCSS(glassButton.border)};`);
  lines.push(`  --dp-glass-btn-border-hover: ${oklchToCSS(glassButton.borderHover)};`);
  lines.push(`  --dp-glass-btn-border-primary: ${oklchToCSS(glassButton.borderPrimary)};`);
  lines.push(`  --dp-glass-btn-glow-hover: ${oklchToCSS(glassButton.glowHover)};`);
  lines.push(`  --dp-glass-btn-shadow: ${oklchToCSS(glassButton.shadowBase)};`);

  // Glass Input tokens
  lines.push(`
  /* =============================================
     COMPONENT TOKENS - Glass Input
     ============================================= */`);
  lines.push(`  --dp-glass-input-bg: ${oklchToCSS(glassInput.bg)};`);
  lines.push(`  --dp-glass-input-border: ${oklchToCSS(glassInput.border)};`);
  lines.push(`  --dp-glass-input-border-focus: ${oklchToCSS(glassInput.borderFocus)};`);
  lines.push(`  --dp-glass-input-glow-focus: ${oklchToCSS(glassInput.glowFocus)};`);

  // Glass Tint tokens
  lines.push(`
  /* =============================================
     COMPONENT TOKENS - Glass Tints
     ============================================= */`);
  lines.push(`  --dp-glass-tint-teal: ${oklchToCSS(glassTint.teal)};`);
  lines.push(`  --dp-glass-tint-purple: ${oklchToCSS(glassTint.purple)};`);
  lines.push(`  --dp-glass-tint-purple-bg: ${oklchToCSS(glassTint.purpleBg)};`);
  lines.push(`  --dp-glass-tint-gold: ${oklchToCSS(glassTint.gold)};`);
  lines.push(`  --dp-glass-tint-gold-bg: ${oklchToCSS(glassTint.goldBg)};`);
  lines.push(`  --dp-glass-tint-coral: ${oklchToCSS(glassTint.coral)};`);
  lines.push(`  --dp-glass-tint-coral-bg: ${oklchToCSS(glassTint.coralBg)};`);

  // Glass Scrim tokens
  lines.push(`
  /* =============================================
     COMPONENT TOKENS - Glass Scrim
     ============================================= */`);
  lines.push(`  --dp-glass-scrim-bg: ${oklchToCSS(glassScrim.bg)};`);

  // Panel tokens
  lines.push(`
  /* =============================================
     COMPONENT TOKENS - Panel
     ============================================= */`);
  lines.push(`  --dp-panel-outer-border: ${oklchToCSS(panel.outerBorder)};`);
  lines.push(`  --dp-panel-outer-border-hover: ${oklchToCSS(panel.outerBorderHover)};`);
  lines.push(`  --dp-panel-outer-glow: ${oklchToCSS(panel.outerGlow)};`);
  lines.push(`  --dp-panel-inner-border: ${oklchToCSS(panel.innerBorder)};`);
  lines.push(`  --dp-panel-inner-gradient-teal-start: ${oklchToCSS(panel.innerGradientTeal.start)};`);
  lines.push(`  --dp-panel-inner-gradient-teal-mid: ${oklchToCSS(panel.innerGradientTeal.mid)};`);
  lines.push(`  --dp-panel-inner-gradient-purple-start: ${oklchToCSS(panel.innerGradientPurple.start)};`);
  lines.push(`  --dp-panel-inner-gradient-purple-mid: ${oklchToCSS(panel.innerGradientPurple.mid)};`);
  lines.push(`  --dp-panel-inner-base: ${oklchToCSS(panel.innerBase)};`);
  lines.push(`  --dp-panel-focus-ring: ${oklchToCSS(panel.focusRing)};`);
  lines.push(`  --dp-panel-focus-glow: ${oklchToCSS(panel.focusGlow)};`);

  lines.push(`}`);

  return lines.join("\n");
}

// ===========================================
// TYPES.TS GENERATOR
// ===========================================

function generateTypes(): string {
  return `/**
 * @file src/lib/design/tokens/types.ts
 * @layer tokens
 *
 * @description
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from tokens.ts by ds-tokens-build.ts
 *
 * TypeScript types + runtime arrays for all COLD LIGHT design system tokens.
 * Used by VPB for prop enumeration and type checking.
 *
 * Run \`pnpm ds:tokens:build\` to regenerate.
 *
 * @since 1.0.0
 */

// ===========================================
// ACCENT TOKENS (color accents for VPB dropdown)
// ===========================================
export const AccentTokens = ${JSON.stringify(accentTokens)} as const;
export type AccentToken = (typeof AccentTokens)[number];

// ===========================================
// GLOW TOKENS (glow color for VPB dropdown)
// ===========================================
export const GlowTokens = ${JSON.stringify(glowKeys)} as const;
export type GlowToken = (typeof GlowTokens)[number];

// ===========================================
// SURFACE TOKENS (material type)
// ===========================================
export const SurfaceTokens = ${JSON.stringify(surfaceTokens)} as const;
export type SurfaceToken = (typeof SurfaceTokens)[number];

// ===========================================
// GLASS VARIANT TOKENS (glass surface darkness)
// ===========================================
export const GlassVariantTokens = ${JSON.stringify(glassVariantTokens)} as const;
export type GlassVariantToken = (typeof GlassVariantTokens)[number];

// ===========================================
// SIZE TOKENS (component sizing)
// ===========================================
export const SizeTokens = ${JSON.stringify(sizeTokens)} as const;
export type SizeToken = (typeof SizeTokens)[number];

// ===========================================
// RADIUS TOKENS (border radius)
// ===========================================
export const RadiusTokens = ${JSON.stringify(radiusKeys)} as const;
export type RadiusToken = (typeof RadiusTokens)[number];

// ===========================================
// BLUR TOKENS (backdrop blur)
// ===========================================
export const BlurTokens = ${JSON.stringify(blurKeys)} as const;
export type BlurToken = (typeof BlurTokens)[number];

// ===========================================
// DEPTH TOKENS (shadow depth level)
// ===========================================
export const DepthTokens = ${JSON.stringify(depthKeys)} as const;
export type DepthToken = (typeof DepthTokens)[number];

// ===========================================
// BEVEL TOKENS (bevel intensity)
// ===========================================
export const BevelTokens = ${JSON.stringify(bevelKeys)} as const;
export type BevelToken = (typeof BevelTokens)[number];

// ===========================================
// IMPRINT TOKENS (bevel imprint intensity for shell)
// ===========================================
export const ImprintTokens = ${JSON.stringify(imprintKeys)} as const;
export type ImprintToken = (typeof ImprintTokens)[number];

// ===========================================
// SHELL DEPTH TOKENS (shell layer depth)
// ===========================================
export const ShellDepthTokens = ${JSON.stringify(shellDepthKeys)} as const;
export type ShellDepthToken = (typeof ShellDepthTokens)[number];

// ===========================================
// SPACE TOKENS (spacing scale)
// ===========================================
export const SpaceTokens = ${JSON.stringify(spacingKeys)} as const;
export type SpaceToken = (typeof SpaceTokens)[number];

// ===========================================
// TEXT SIZE TOKENS (typography scale)
// ===========================================
export const TextSizeTokens = ${JSON.stringify(textSizeKeys)} as const;
export type TextSizeToken = (typeof TextSizeTokens)[number];

// ===========================================
// PADDING TOKENS (component padding)
// ===========================================
export const PaddingTokens = ${JSON.stringify(paddingTokens)} as const;
export type PaddingToken = (typeof PaddingTokens)[number];

// ===========================================
// TOKEN CATEGORIES INTERFACE
// ===========================================
export interface TokenCategories {
  accent: AccentToken;
  glow: GlowToken;
  surface: SurfaceToken;
  glassVariant: GlassVariantToken;
  size: SizeToken;
  radius: RadiusToken;
  blur: BlurToken;
  depth: DepthToken;
  bevel: BevelToken;
  imprint: ImprintToken;
  shellDepth: ShellDepthToken;
  space: SpaceToken;
  textSize: TextSizeToken;
  padding: PaddingToken;
}

// ===========================================
// TOKEN ID HELPER TYPE
// ===========================================
export type TokenId<T extends keyof TokenCategories> = TokenCategories[T];

// ===========================================
// ALL TOKEN ARRAYS (for runtime iteration / VPB)
// ===========================================
export const TokenArrays = {
  accent: AccentTokens,
  glow: GlowTokens,
  surface: SurfaceTokens,
  glassVariant: GlassVariantTokens,
  size: SizeTokens,
  radius: RadiusTokens,
  blur: BlurTokens,
  depth: DepthTokens,
  bevel: BevelTokens,
  imprint: ImprintTokens,
  shellDepth: ShellDepthTokens,
  space: SpaceTokens,
  textSize: TextSizeTokens,
  padding: PaddingTokens,
} as const;
`;
}

// ===========================================
// TAILWIND PRESET GENERATOR
// ===========================================

function generateTailwindPreset(): string {
  return `/**
 * @file src/lib/design/tokens/tailwind.preset.ts
 * @layer config
 *
 * @description
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from tokens.ts by ds-tokens-build.ts
 *
 * Tailwind CSS preset mapping design system tokens to Tailwind theme.
 *
 * Run \`pnpm ds:tokens:build\` to regenerate.
 *
 * @since 1.0.0
 */

import type { Config } from "tailwindcss";

export const dpPreset: Partial<Config> = {
  theme: {
    extend: {
      colors: {
        dp: {
          // Color scales
          teal: {
            100: "var(--dp-teal-100)",
            200: "var(--dp-teal-200)",
            300: "var(--dp-teal-300)",
            400: "var(--dp-teal-400)",
            500: "var(--dp-teal-500)",
            600: "var(--dp-teal-600)",
            700: "var(--dp-teal-700)",
            800: "var(--dp-teal-800)",
            900: "var(--dp-teal-900)",
          },
          purple: {
            100: "var(--dp-purple-100)",
            200: "var(--dp-purple-200)",
            300: "var(--dp-purple-300)",
            400: "var(--dp-purple-400)",
            500: "var(--dp-purple-500)",
            600: "var(--dp-purple-600)",
            700: "var(--dp-purple-700)",
            800: "var(--dp-purple-800)",
            900: "var(--dp-purple-900)",
          },
          magenta: {
            100: "var(--dp-magenta-100)",
            200: "var(--dp-magenta-200)",
            300: "var(--dp-magenta-300)",
            400: "var(--dp-magenta-400)",
            500: "var(--dp-magenta-500)",
            600: "var(--dp-magenta-600)",
            700: "var(--dp-magenta-700)",
            800: "var(--dp-magenta-800)",
            900: "var(--dp-magenta-900)",
          },
          ember: {
            100: "var(--dp-ember-100)",
            200: "var(--dp-ember-200)",
            300: "var(--dp-ember-300)",
            400: "var(--dp-ember-400)",
            500: "var(--dp-ember-500)",
            600: "var(--dp-ember-600)",
            700: "var(--dp-ember-700)",
            800: "var(--dp-ember-800)",
            900: "var(--dp-ember-900)",
          },
          frost: {
            100: "var(--dp-frost-100)",
            200: "var(--dp-frost-200)",
            300: "var(--dp-frost-300)",
            400: "var(--dp-frost-400)",
            500: "var(--dp-frost-500)",
            600: "var(--dp-frost-600)",
            700: "var(--dp-frost-700)",
            800: "var(--dp-frost-800)",
            900: "var(--dp-frost-900)",
          },
          // Matte
          matte: {
            dark: "var(--dp-matte-dark)",
            mid: "var(--dp-matte-mid)",
            light: "var(--dp-matte-light)",
          },
          // Glass
          glass: {
            void: "var(--dp-glass-void)",
            deep: "var(--dp-glass-deep)",
            smoke: "var(--dp-glass-smoke)",
            frost: "var(--dp-glass-frost)",
            base: "var(--dp-glass-base)",
            "tint-teal": "var(--dp-glass-tint-teal)",
            "tint-purple": "var(--dp-glass-tint-purple)",
          },
          // Text
          text: {
            primary: "var(--dp-text-primary)",
            secondary: "var(--dp-text-secondary)",
            muted: "var(--dp-text-muted)",
            white: "var(--dp-text-white)",
          },
          // Surfaces
          surface: {
            1: "var(--dp-surface-1)",
            2: "var(--dp-surface-2)",
            3: "var(--dp-surface-3)",
            4: "var(--dp-surface-4)",
          },
          // Accents
          accent: {
            cyber: "var(--dp-accent-cyber)",
            tint: "var(--dp-accent-tint)",
          },
          // Code
          code: {
            str: "var(--dp-code-str)",
            num: "var(--dp-code-num)",
            kw: "var(--dp-code-kw)",
            fn: "var(--dp-code-fn)",
            cmt: "var(--dp-code-cmt)",
          },
        },
      },
      spacing: {
        "dp-1": "var(--dp-space-1)",
        "dp-2": "var(--dp-space-2)",
        "dp-3": "var(--dp-space-3)",
        "dp-4": "var(--dp-space-4)",
        "dp-5": "var(--dp-space-5)",
        "dp-6": "var(--dp-space-6)",
        "dp-8": "var(--dp-space-8)",
        "dp-panel-gap": "var(--dp-panel-gap)",
      },
      borderRadius: {
        "dp-none": "var(--dp-radius-none)",
        "dp-sm": "var(--dp-radius-sm)",
        "dp-md": "var(--dp-radius-md)",
        "dp-lg": "var(--dp-radius-lg)",
        "dp-xl": "var(--dp-radius-xl)",
        "dp-full": "var(--dp-radius-full)",
      },
      borderWidth: {
        "dp-thin": "var(--dp-border-thin)",
        "dp-medium": "var(--dp-border-medium)",
        "dp-thick": "var(--dp-border-thick)",
      },
      blur: {
        "dp-sm": "var(--dp-blur-sm)",
        "dp-md": "var(--dp-blur-md)",
        "dp-lg": "var(--dp-blur-lg)",
        "dp-xl": "var(--dp-blur-xl)",
      },
      boxShadow: {
        "dp-sm": "var(--dp-shadow-sm)",
        "dp-md": "var(--dp-shadow-md)",
        "dp-lg": "var(--dp-shadow-lg)",
        "dp-z1": "var(--dp-shadow-z1)",
        "dp-z2": "var(--dp-shadow-z2)",
        "dp-z3": "var(--dp-shadow-z3)",
        "dp-z4": "var(--dp-shadow-z4)",
        "dp-glow-teal": "var(--dp-glow-teal)",
        "dp-glow-purple": "var(--dp-glow-purple)",
        "dp-glow-magenta": "var(--dp-glow-magenta)",
        "dp-glow-ember": "var(--dp-glow-ember)",
        "dp-glow-frost": "var(--dp-glow-frost)",
        "dp-bevel-outset": "var(--dp-bevel-outset)",
        "dp-bevel-inset": "var(--dp-bevel-inset)",
        "dp-bevel-deep": "var(--dp-bevel-deep)",
        "dp-bevel-imprint": "var(--dp-bevel-imprint)",
        "dp-bevel-pressed": "var(--dp-bevel-pressed)",
      },
      fontFamily: {
        "dp-sans": "var(--dp-font-sans)",
        "dp-mono": "var(--dp-font-mono)",
      },
      fontSize: {
        "dp-xs": "var(--dp-text-xs)",
        "dp-sm": "var(--dp-text-sm)",
        "dp-base": "var(--dp-text-base)",
        "dp-lg": "var(--dp-text-lg)",
        "dp-xl": "var(--dp-text-xl)",
        "dp-2xl": "var(--dp-text-2xl)",
      },
      transitionTimingFunction: {
        "dp-out": "var(--dp-ease-out)",
        "dp-bounce": "var(--dp-ease-bounce)",
      },
      transitionDuration: {
        "dp-fast": "var(--dp-duration-fast)",
        "dp-normal": "var(--dp-duration-normal)",
        "dp-slow": "var(--dp-duration-slow)",
      },
      zIndex: {
        "dp-base": "var(--dp-z-base)",
        "dp-dropdown": "var(--dp-z-dropdown)",
        "dp-sticky": "var(--dp-z-sticky)",
        "dp-modal": "var(--dp-z-modal)",
        "dp-popover": "var(--dp-z-popover)",
        "dp-tooltip": "var(--dp-z-tooltip)",
        "dp-toast": "var(--dp-z-toast)",
        "dp-overlay": "var(--dp-z-overlay)",
      },
      // Shell grid utilities (per plan requirement)
      gridTemplateColumns: {
        shell: "1fr",
        "shell-nav": "auto 1fr",
        "shell-nav-aside": "auto 1fr auto",
      },
      gridTemplateRows: {
        shell: "auto 1fr auto",
        "shell-topbar": "auto 1fr",
        "shell-statusbar": "1fr auto",
      },
    },
  },
};

export default dpPreset;
`;
}

// ===========================================
// RECIPE CSS GENERATOR
// ===========================================

function generateRecipeCSS(): string {
  return `/**
 * @file src/lib/design/recipes/css/surfaces.gen.css
 * @layer recipes
 *
 * @description
 * AUTO-GENERATED - DO NOT EDIT
 * Generated from tokens.ts by ds-tokens-build.ts
 *
 * Recipe CSS that ONLY references var(--dp-*) tokens.
 * No raw values. No magic numbers. No drift.
 *
 * Run \`pnpm ds:tokens:build\` to regenerate.
 *
 * @since 1.0.0
 */

/* ============================================
   BASE SURFACE RECIPE
   ============================================ */

.dp-surface {
  position: relative;
  transition: all var(--dp-transition-normal);
}

/* ============================================
   GLASS SURFACE
   ============================================ */

.dp-surface[data-surface="glass"] {
  background: var(--dp-glass-deep);
  backdrop-filter: blur(var(--dp-blur-md));
  border: var(--dp-border-thin) solid var(--dp-glass-btn-border);
  border-radius: var(--dp-radius-md);
  box-shadow: var(--dp-shadow-z1);
}

.dp-surface[data-surface="glass"]:hover {
  border-color: var(--dp-glass-btn-border-hover);
  box-shadow: var(--dp-shadow-z2), 0 0 20px var(--dp-glass-btn-glow-hover);
}

.dp-surface[data-surface="glass"]:focus-within {
  border-color: var(--dp-panel-focus-ring);
  box-shadow: var(--dp-shadow-z2), 0 0 16px var(--dp-panel-focus-glow);
  outline: none;
}

/* ============================================
   GLASS SURFACE - BUTTON ROLE
   ============================================ */

.dp-surface[data-surface="glass"][data-role="button"] {
  background: var(--dp-glass-btn-bg);
  border-color: var(--dp-glass-btn-border);
  cursor: pointer;
  user-select: none;
}

.dp-surface[data-surface="glass"][data-role="button"]:hover {
  background: var(--dp-glass-btn-bg-hover);
  border-color: var(--dp-glass-btn-border-hover);
  box-shadow: var(--dp-shadow-z2), 0 0 16px var(--dp-glass-btn-glow-hover);
  transform: translateY(-1px);
}

.dp-surface[data-surface="glass"][data-role="button"]:active {
  transform: translateY(0);
  box-shadow: var(--dp-shadow-z1);
}

.dp-surface[data-surface="glass"][data-role="button"][data-variant="primary"] {
  background: var(--dp-glass-btn-bg-primary);
  border-color: var(--dp-glass-btn-border-primary);
}

.dp-surface[data-surface="glass"][data-role="button"][data-variant="primary"]:hover {
  background: var(--dp-glass-btn-bg-primary-hover);
}

/* ============================================
   GLASS SURFACE - INPUT ROLE
   ============================================ */

.dp-surface[data-surface="glass"][data-role="input"] {
  background: var(--dp-glass-input-bg);
  border-color: var(--dp-glass-input-border);
}

.dp-surface[data-surface="glass"][data-role="input"]:focus-within {
  border-color: var(--dp-glass-input-border-focus);
  box-shadow: 0 0 12px var(--dp-glass-input-glow-focus);
}

/* ============================================
   GLASS SURFACE - PANEL ROLE
   ============================================ */

.dp-surface[data-surface="glass"][data-role="panel"] {
  background: var(--dp-panel-inner-base);
  border-color: var(--dp-panel-outer-border);
}

.dp-surface[data-surface="glass"][data-role="panel"]:hover {
  border-color: var(--dp-panel-outer-border-hover);
  box-shadow: var(--dp-shadow-z2), 0 0 24px var(--dp-panel-outer-glow);
}

/* Inner gradient overlay for panels */
.dp-surface[data-surface="glass"][data-role="panel"]::before {
  content: "";
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: linear-gradient(
    135deg,
    var(--dp-panel-inner-gradient-teal-start) 0%,
    var(--dp-panel-inner-gradient-teal-mid) 50%,
    transparent 100%
  );
  pointer-events: none;
}

.dp-surface[data-surface="glass"][data-role="panel"][data-accent="purple"]::before {
  background: linear-gradient(
    135deg,
    var(--dp-panel-inner-gradient-purple-start) 0%,
    var(--dp-panel-inner-gradient-purple-mid) 50%,
    transparent 100%
  );
}

/* ============================================
   GLASS SURFACE - SCRIM ROLE
   ============================================ */

.dp-surface[data-surface="glass"][data-role="scrim"] {
  background: var(--dp-glass-scrim-bg);
  backdrop-filter: blur(var(--dp-blur-lg));
}

/* ============================================
   GLASS VARIANTS (darkness levels)
   ============================================ */

.dp-surface[data-surface="glass"][data-variant="void"] {
  background: var(--dp-glass-void);
}

.dp-surface[data-surface="glass"][data-variant="deep"] {
  background: var(--dp-glass-deep);
}

.dp-surface[data-surface="glass"][data-variant="smoke"] {
  background: var(--dp-glass-smoke);
}

.dp-surface[data-surface="glass"][data-variant="frost"] {
  background: var(--dp-glass-frost);
}

/* ============================================
   GLASS TINTS (accent colors)
   ============================================ */

.dp-surface[data-surface="glass"][data-tint="teal"] {
  border-color: var(--dp-glass-tint-teal);
}

.dp-surface[data-surface="glass"][data-tint="purple"] {
  background: var(--dp-glass-tint-purple-bg);
  border-color: var(--dp-glass-tint-purple);
}

.dp-surface[data-surface="glass"][data-tint="gold"] {
  background: var(--dp-glass-tint-gold-bg);
  border-color: var(--dp-glass-tint-gold);
}

.dp-surface[data-surface="glass"][data-tint="coral"] {
  background: var(--dp-glass-tint-coral-bg);
  border-color: var(--dp-glass-tint-coral);
}

/* ============================================
   MATTE SURFACE
   ============================================ */

.dp-surface[data-surface="matte"] {
  background: var(--dp-matte-dark);
  border: var(--dp-border-thin) solid var(--dp-matte-mid);
  border-radius: var(--dp-radius-md);
  box-shadow: var(--dp-bevel-outset);
}

.dp-surface[data-surface="matte"][data-variant="mid"] {
  background: var(--dp-matte-mid);
}

.dp-surface[data-surface="matte"][data-variant="light"] {
  background: var(--dp-matte-light);
}

/* ============================================
   SOLID SURFACE
   ============================================ */

.dp-surface[data-surface="solid"] {
  background: var(--dp-surface-2);
  border: var(--dp-border-thin) solid var(--dp-surface-3);
  border-radius: var(--dp-radius-md);
  box-shadow: var(--dp-shadow-z1);
}

.dp-surface[data-surface="solid"][data-depth="1"] {
  background: var(--dp-surface-1);
}

.dp-surface[data-surface="solid"][data-depth="2"] {
  background: var(--dp-surface-2);
}

.dp-surface[data-surface="solid"][data-depth="3"] {
  background: var(--dp-surface-3);
}

.dp-surface[data-surface="solid"][data-depth="4"] {
  background: var(--dp-surface-4);
}

/* ============================================
   BEVEL MODIFIERS
   ============================================ */

.dp-surface[data-bevel="subtle"] {
  box-shadow: var(--dp-bevel-outset);
}

.dp-surface[data-bevel="soft"] {
  box-shadow: var(--dp-bevel-outset), var(--dp-shadow-z1);
}

.dp-surface[data-bevel="medium"] {
  box-shadow: var(--dp-bevel-imprint), var(--dp-shadow-z2);
}

.dp-surface[data-bevel="inset"] {
  box-shadow: var(--dp-bevel-inset);
}

.dp-surface[data-bevel="deep"] {
  box-shadow: var(--dp-bevel-deep);
}

.dp-surface[data-bevel="pressed"] {
  box-shadow: var(--dp-bevel-pressed);
}

/* ============================================
   GLOW MODIFIERS
   ============================================ */

.dp-surface[data-glow="teal"] {
  box-shadow: var(--dp-glow-teal);
}

.dp-surface[data-glow="purple"] {
  box-shadow: var(--dp-glow-purple);
}

.dp-surface[data-glow="magenta"] {
  box-shadow: var(--dp-glow-magenta);
}

.dp-surface[data-glow="ember"] {
  box-shadow: var(--dp-glow-ember);
}

.dp-surface[data-glow="frost"] {
  box-shadow: var(--dp-glow-frost);
}
`;
}

// ===========================================
// MAIN
// ===========================================

function main() {
  const tokensDir = path.resolve(__dirname, "../../../src/lib/design/tokens");
  const recipesDir = path.resolve(__dirname, "../../../src/lib/design/recipes/css");
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");

  // Ensure recipes/css directory exists
  if (!fs.existsSync(recipesDir)) {
    fs.mkdirSync(recipesDir, { recursive: true });
  }

  // Generate tokens CSS
  const css = generateCSS();
  const cssPath = path.join(tokensDir, dryRun ? "tokens.generated.css" : "tokens.css");
  fs.writeFileSync(cssPath, css, "utf-8");
  console.log(`✅ Generated ${path.basename(cssPath)}`);

  // Generate types (this replaces the old types.ts)
  const types = generateTypes();
  const typesPath = path.join(tokensDir, dryRun ? "types.generated.ts" : "types.ts");
  fs.writeFileSync(typesPath, types, "utf-8");
  console.log(`✅ Generated ${path.basename(typesPath)}`);

  // Generate Tailwind preset
  const preset = generateTailwindPreset();
  const presetPath = path.join(tokensDir, "tailwind.preset.ts");
  fs.writeFileSync(presetPath, preset, "utf-8");
  console.log(`✅ Generated ${path.basename(presetPath)}`);

  // Generate recipe CSS
  const recipeCSS = generateRecipeCSS();
  const recipePath = path.join(recipesDir, "surfaces.gen.css");
  fs.writeFileSync(recipePath, recipeCSS, "utf-8");
  console.log(`✅ Generated surfaces.gen.css`);

  console.log("\n🎉 Token generation complete!");

  if (dryRun) {
    console.log("\n[DRY RUN] Files written with .generated suffix for comparison.");
  }
}

main();
