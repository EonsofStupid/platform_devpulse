/**
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
 * Run `pnpm ds:tokens:build` to regenerate.
 *
 * @since 1.0.0
 */

// ===========================================
// ACCENT TOKENS (color accents for VPB dropdown)
// ===========================================
export const AccentTokens = ["teal","purple","magenta","ember","frost"] as const;
export type AccentToken = (typeof AccentTokens)[number];

// ===========================================
// GLOW TOKENS (glow color for VPB dropdown)
// ===========================================
export const GlowTokens = ["off","teal","purple","magenta","ember","frost"] as const;
export type GlowToken = (typeof GlowTokens)[number];

// ===========================================
// SURFACE TOKENS (material type)
// ===========================================
export const SurfaceTokens = ["glass","solid","matte"] as const;
export type SurfaceToken = (typeof SurfaceTokens)[number];

// ===========================================
// GLASS VARIANT TOKENS (glass surface darkness)
// ===========================================
export const GlassVariantTokens = ["void","deep","smoke","frost"] as const;
export type GlassVariantToken = (typeof GlassVariantTokens)[number];

// ===========================================
// SIZE TOKENS (component sizing)
// ===========================================
export const SizeTokens = ["sm","md","lg"] as const;
export type SizeToken = (typeof SizeTokens)[number];

// ===========================================
// RADIUS TOKENS (border radius)
// ===========================================
export const RadiusTokens = ["none","sm","md","lg","xl","full"] as const;
export type RadiusToken = (typeof RadiusTokens)[number];

// ===========================================
// BLUR TOKENS (backdrop blur)
// ===========================================
export const BlurTokens = ["off","sm","md","lg","xl"] as const;
export type BlurToken = (typeof BlurTokens)[number];

// ===========================================
// DEPTH TOKENS (shadow depth level)
// ===========================================
export const DepthTokens = [0,1,2,3,4] as const;
export type DepthToken = (typeof DepthTokens)[number];

// ===========================================
// BEVEL TOKENS (bevel intensity)
// ===========================================
export const BevelTokens = ["off","subtle","soft","medium"] as const;
export type BevelToken = (typeof BevelTokens)[number];

// ===========================================
// IMPRINT TOKENS (bevel imprint intensity for shell)
// ===========================================
export const ImprintTokens = ["subtle","medium","strong"] as const;
export type ImprintToken = (typeof ImprintTokens)[number];

// ===========================================
// SHELL DEPTH TOKENS (shell layer depth)
// ===========================================
export const ShellDepthTokens = ["shallow","standard","deep"] as const;
export type ShellDepthToken = (typeof ShellDepthTokens)[number];

// ===========================================
// SPACE TOKENS (spacing scale)
// ===========================================
export const SpaceTokens = ["1","2","3","4","5","6","8"] as const;
export type SpaceToken = (typeof SpaceTokens)[number];

// ===========================================
// TEXT SIZE TOKENS (typography scale)
// ===========================================
export const TextSizeTokens = ["xs","sm","base","lg","xl","2xl"] as const;
export type TextSizeToken = (typeof TextSizeTokens)[number];

// ===========================================
// PADDING TOKENS (component padding)
// ===========================================
export const PaddingTokens = ["sm","md","lg"] as const;
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
