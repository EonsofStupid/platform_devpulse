/**
 * @fileoverview Foundations - Typography, Density, Spacing, Z-Index
 * @file src/lib/design/foundations/index.ts
 * @module @devpulse/design/foundations
 * @layer foundations
 *
 * @description
 * TIER 3: Layout foundations - typography, density, spacing, z-index.
 * These are structural, not visual.
 *
 * @since 1.0.0
 */

// ===========================================
// SPACING MAPS
// ===========================================

export const SpaceMap = {
  s0: "var(--dp-space-1)",
  s1: "var(--dp-space-2)",
  s2: "var(--dp-space-3)",
  s3: "var(--dp-space-4)",
  s4: "var(--dp-space-5)",
  s5: "var(--dp-space-6)",
  s6: "var(--dp-space-8)",
  s8: "var(--dp-space-8)", // alias
} as const;

// ===========================================
// RADIUS MAPS
// ===========================================

export const RadiusMap = {
  r0: "0",
  r1: "var(--dp-radius-sm)",
  r2: "var(--dp-radius-md)",
  r3: "var(--dp-radius-lg)",
  r4: "var(--dp-radius-xl)",
} as const;

// ===========================================
// TEXT SIZE MAPS
// ===========================================

export const TextMap = {
  xs: "var(--dp-text-xs)",
  sm: "var(--dp-text-sm)",
  base: "var(--dp-text-base)",
  lg: "var(--dp-text-lg)",
  xl: "var(--dp-text-xl)",
  "2xl": "var(--dp-text-2xl)",
} as const;

// ===========================================
// Z-INDEX SYSTEM
// ===========================================

export const ZIndex = {
  base: 0,
  dropdown: 100,
  sticky: 200,
  modal: 300,
  popover: 400,
  tooltip: 500,
  toast: 600,
  overlay: 700,
  vpb: 900,     // VPB always on top during debug
  max: 999,
} as const;

// ===========================================
// DENSITY PRESETS
// ===========================================

export const Density = {
  compact: {
    padding: "s1",
    gap: "s1",
  },
  default: {
    padding: "s3",
    gap: "s2",
  },
  comfortable: {
    padding: "s5",
    gap: "s4",
  },
} as const;

export type DensityPreset = keyof typeof Density;
