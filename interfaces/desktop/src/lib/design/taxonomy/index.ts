/**
 * @fileoverview Taxonomy - Category Definitions
 * @file src/lib/design/taxonomy/index.ts
 * @module @devpulse/design/taxonomy
 * @layer taxonomy
 *
 * @description
 * TIER 1: Defines WHAT CATEGORIES EXIST in the design system.
 * A new category must first exist here before it can have tokens.
 *
 * @since 1.0.0
 */

// ===========================================
// CATEGORY DEFINITIONS
// ===========================================

/**
 * All valid design system categories.
 * A new category (e.g., "slime") must be added here FIRST.
 */
export const DesignCategories = [
  "surface",   // Material types: glass, solid, matte, slime
  "tone",      // Color temperature: cold, neutral, warm
  "glow",      // Glow effect: off, soft, hard
  "radius",    // Border radius ramp
  "accent",    // Accent color palette
  "space",     // Spacing ramp
  "blur",      // Blur intensity ramp
  "depth",     // Depth/shadow ramp
  "text",      // Text size ramp
  "motion",    // Animation presets
  "behavior",  // Interaction modules
] as const;

export type DesignCategory = typeof DesignCategories[number];

// ===========================================
// CATEGORY TIER REQUIREMENTS
// ===========================================

/**
 * When adding a new value to a category, which tiers must be updated?
 * This is the "dependency checklist" for each category.
 */
export const CategoryTierRequirements: Record<DesignCategory, string[]> = {
  surface: ["tokens", "surfaces", "components", "blocks"],
  tone: ["tokens", "surfaces"],
  glow: ["tokens", "surfaces"],
  radius: ["tokens", "foundations"],
  accent: ["tokens", "surfaces"],
  space: ["tokens", "foundations"],
  blur: ["tokens", "surfaces"],
  depth: ["tokens", "surfaces"],
  text: ["tokens", "foundations"],
  motion: ["motion"],
  behavior: ["behaviors"],
};

// ===========================================
// COMPONENT CAPABILITY DECLARATIONS
// ===========================================

/**
 * Which surfaces a component supports.
 * Components declare their capabilities, VPB shows only valid options.
 */
export interface ComponentCapabilities {
  supportedSurfaces?: readonly string[];
  supportedTones?: readonly string[];
  supportedGlows?: readonly string[];
}
