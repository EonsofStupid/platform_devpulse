/**
 * @fileoverview Generated Token Types
 * @file src/lib/design/tokens/types.ts
 * @module @devpulse/design/tokens/types
 * @layer tokens
 *
 * @description
 * Auto-generated from tokens.json - DO NOT EDIT MANUALLY
 * Provides TypeScript types + runtime arrays for all token categories.
 *
 * @since 1.0.0
 */

// ===========================================
// SURFACE TOKENS
// ===========================================
export const SurfaceTokens = ["glass", "solid", "matte", "slime"] as const;
export type SurfaceToken = typeof SurfaceTokens[number];

// ===========================================
// TONE TOKENS
// ===========================================
export const ToneTokens = ["cold", "neutral", "warm"] as const;
export type ToneToken = typeof ToneTokens[number];

// ===========================================
// GLOW TOKENS
// ===========================================
export const GlowTokens = ["off", "soft", "hard"] as const;
export type GlowToken = typeof GlowTokens[number];

// ===========================================
// RADIUS TOKENS
// ===========================================
export const RadiusTokens = ["r0", "r1", "r2", "r3", "r4"] as const;
export type RadiusToken = typeof RadiusTokens[number];

// ===========================================
// ACCENT TOKENS
// ===========================================
export const AccentTokens = ["teal", "purple", "neutral"] as const;
export type AccentToken = typeof AccentTokens[number];

// ===========================================
// SPACE TOKENS
// ===========================================
export const SpaceTokens = ["s0", "s1", "s2", "s3", "s4", "s5", "s6", "s8"] as const;
export type SpaceToken = typeof SpaceTokens[number];

// ===========================================
// BLUR TOKENS
// ===========================================
export const BlurTokens = ["b0", "b1", "b2", "b3"] as const;
export type BlurToken = typeof BlurTokens[number];

// ===========================================
// DEPTH TOKENS
// ===========================================
export const DepthTokens = ["d0", "d1", "d2", "d3"] as const;
export type DepthToken = typeof DepthTokens[number];

// ===========================================
// TEXT TOKENS
// ===========================================
export const TextTokens = ["xs", "sm", "base", "lg", "xl", "2xl"] as const;
export type TextToken = typeof TextTokens[number];

// ===========================================
// TOKEN ID HELPER TYPE
// ===========================================
export type TokenId<T extends keyof TokenCategories> = TokenCategories[T];

export interface TokenCategories {
  surface: SurfaceToken;
  tone: ToneToken;
  glow: GlowToken;
  radius: RadiusToken;
  accent: AccentToken;
  space: SpaceToken;
  blur: BlurToken;
  depth: DepthToken;
  text: TextToken;
}

// ===========================================
// ALL TOKEN ARRAYS (for runtime iteration)
// ===========================================
export const TokenArrays = {
  surface: SurfaceTokens,
  tone: ToneTokens,
  glow: GlowTokens,
  radius: RadiusTokens,
  accent: AccentTokens,
  space: SpaceTokens,
  blur: BlurTokens,
  depth: DepthTokens,
  text: TextTokens,
} as const;
