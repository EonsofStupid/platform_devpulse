/**
 * @file ColdLight Surface Configuration
 * @package @devpulse/coldlight
 *
 * Surface, variant, and recipe configuration.
 * Separate from the enforcement config (coldlight.config.ts).
 */

// =============================================================================
// VERSION
// =============================================================================

export const VERSION = "0.1.0" as const;

// =============================================================================
// FEATURE FLAGS
// =============================================================================

export const FEATURES = {
  oklch: true,
  glass: true,
  particles: true,
  motion: true,
  reducedMotion: true,
  darkMode: true,
  lightMode: false,
  highContrast: false,
  rtl: false,
  strictValidation: true,
  devWarnings: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

// =============================================================================
// SURFACES
// =============================================================================

export const SURFACES = ["glass", "matte", "solid"] as const;
export type Surface = (typeof SURFACES)[number];

export const SURFACE_VARIANTS = {
  glass: ["void", "deep", "smoke", "frost"] as const,
  matte: ["charcoal", "slate", "graphite"] as const,
  solid: ["primary", "secondary", "accent"] as const,
} as const;

export type GlassVariant = (typeof SURFACE_VARIANTS.glass)[number];
export type MatteVariant = (typeof SURFACE_VARIANTS.matte)[number];
export type SolidVariant = (typeof SURFACE_VARIANTS.solid)[number];

export const SURFACE_ROLES = ["button", "input", "panel", "scrim", "card", "menu"] as const;
export type SurfaceRole = (typeof SURFACE_ROLES)[number];

// =============================================================================
// PRIMITIVE STATES
// =============================================================================

export const PRIMITIVE_STATES = [
  "open",
  "closed",
  "checked",
  "unchecked",
  "indeterminate",
  "active",
  "inactive",
  "on",
  "off",
  "pressed",
  "loading",
  "disabled",
  "focused",
  "selected",
  "expanded",
  "collapsed",
] as const;

export type PrimitiveState = (typeof PRIMITIVE_STATES)[number];
