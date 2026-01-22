/**
 * @file coldlight.config.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Design System Configuration
 *
 * This is the root configuration file that defines how ColdLight operates.
 * Similar to shadcn's components.json but more sophisticated - this is TypeScript
 * with full type safety, validation, and runtime configuration.
 *
 * @author Jesse "Hades" Hall <jessay@angryvibers.com>
 * @license MIT
 * @since 1.0.0
 */

import type { Snippet } from "svelte";

// ============================================
// VERSION & IDENTITY
// ============================================

/**
 * ColdLight version. Follows semver.
 * Breaking changes only in major versions.
 */
export const VERSION = "0.1.0" as const;

/**
 * Package identity
 */
export const PACKAGE = {
  name: "@devpulse/coldlight",
  version: VERSION,
  description: "Liquid surface design system - particle effects, metal, glass, molten aesthetics",
  author: "Jesse \"Hades\" Hall <jessay@angryvibers.com>",
} as const;

// ============================================
// PATH CONFIGURATION
// ============================================

/**
 * Relative paths from the design system root.
 * Used by build tools, generators, and imports.
 */
export const PATHS = {
  /** Token definitions (SSOT) */
  tokens: "./tokens/tokens.ts",
  /** Generated CSS variables */
  tokensCss: "./tokens/tokens.css",
  /** Generated TypeScript types */
  tokensTypes: "./tokens/types.ts",
  /** Tailwind preset */
  tailwindPreset: "./tokens/tailwind.preset.ts",
  /** Zod validation schemas */
  schema: "./tokens/schema.ts",

  /** Taxonomy definitions */
  taxonomy: "./taxonomy",
  /** Block kind definitions */
  kinds: "./taxonomy/kinds.ts",
  /** Property contracts */
  contracts: "./taxonomy/contracts.ts",
  /** Primitive registry */
  primitiveRegistry: "./taxonomy/primitiveRegistry.ts",

  /** Recipe definitions */
  recipes: "./recipes",
  /** Recipe registry */
  recipeIndex: "./recipes/index.ts",
  /** Surface capabilities */
  surfaceRegistry: "./recipes/surface.registry.ts",
  /** Generated recipe CSS */
  recipesCss: "./recipes/css/surfaces.gen.css",
  /** Keyframe animations (only manually written CSS) */
  keyframes: "./recipes/css/keyframes.css",
  /** Svelte actions */
  actions: "./recipes/actions/index.ts",

  /** Primitive components */
  primitives: "./primitives",
  /** Primitive barrel export */
  primitivesIndex: "./primitives/index.ts",

  /** CSS entry point */
  css: "./index.css",
  /** Master export */
  index: "./index.ts",
} as const;

// ============================================
// FEATURE FLAGS
// ============================================

/**
 * Feature flags for ColdLight capabilities.
 * Enable/disable features at the system level.
 */
export const FEATURES = {
  /** OKLCH color space (always on - core feature) */
  oklch: true,

  /** Glass/transparency effects */
  glass: true,

  /** Particle/glow effects */
  particles: true,

  /** Motion/animation system */
  motion: true,

  /** Respect prefers-reduced-motion */
  reducedMotion: true,

  /** Dark mode (primary theme) */
  darkMode: true,

  /** Light mode (planned) */
  lightMode: false,

  /** High contrast mode (planned) */
  highContrast: false,

  /** RTL support (planned) */
  rtl: false,

  /** Strict validation mode */
  strictValidation: true,

  /** Development warnings */
  devWarnings: true,
} as const;

export type FeatureFlag = keyof typeof FEATURES;

// ============================================
// LAYER ARCHITECTURE
// ============================================

/**
 * ColdLight's layered architecture.
 * Each layer has specific responsibilities and dependencies.
 */
export const LAYERS = {
  tokens: {
    order: 1,
    name: "Tokens",
    description: "Design tokens - SSOT values (colors, spacing, typography)",
    dependencies: [],
    exports: ["tokens", "types", "schema"],
  },
  taxonomy: {
    order: 2,
    name: "Taxonomy",
    description: "Block definitions - kinds, contracts, constraints",
    dependencies: ["tokens"],
    exports: ["kinds", "contracts", "primitiveRegistry"],
  },
  recipes: {
    order: 3,
    name: "Recipes",
    description: "Style composition - surface recipes, actions",
    dependencies: ["tokens", "taxonomy"],
    exports: ["recipes", "surfaceRegistry", "actions"],
  },
  primitives: {
    order: 4,
    name: "Primitives",
    description: "Unstyled accessible components - Bits UI wrappers",
    dependencies: ["tokens"],
    exports: ["primitives"],
  },
  components: {
    order: 5,
    name: "Components",
    description: "Styled components - primitives + recipes",
    dependencies: ["primitives", "recipes"],
    exports: ["components"],
  },
  blocks: {
    order: 6,
    name: "Blocks",
    description: "Page-level compositions - VPB blocks",
    dependencies: ["components", "taxonomy"],
    exports: ["blocks"],
  },
} as const;

export type Layer = keyof typeof LAYERS;

// ============================================
// DATA ATTRIBUTE CONTRACT
// ============================================

/**
 * Canonical data attributes used throughout ColdLight.
 * These are the ONLY data attributes primitives should emit.
 */
export const DATA_ATTRIBUTES = {
  /** Identifies the primitive type (button, dialog, sheet) */
  primitive: "data-kind",
  /** Identifies the slot within a primitive (root, trigger, content) */
  slot: "data-slot",
  /** Current state (open, closed, pressed, disabled) */
  state: "data-state",
  /** User-defined stable ID for testing/tooling */
  id: "data-id",

  /** Surface type (glass, matte, solid) */
  surface: "data-surface",
  /** Surface variant (void, deep, smoke, frost) */
  variant: "data-variant",
  /** Surface role (button, input, panel, scrim) */
  role: "data-role",
  /** Bevel modifier */
  bevel: "data-bevel",
  /** Glow modifier */
  glow: "data-glow",

  /** Sheet/drawer side (left, right, top, bottom) */
  side: "data-side",
  /** Orientation (horizontal, vertical) */
  orientation: "data-orientation",
} as const;

export type DataAttribute = keyof typeof DATA_ATTRIBUTES;

// ============================================
// SURFACE SYSTEM
// ============================================

/**
 * Available surface types.
 */
export const SURFACES = ["glass", "matte", "solid"] as const;
export type Surface = (typeof SURFACES)[number];

/**
 * Surface variants per type.
 */
export const SURFACE_VARIANTS = {
  glass: ["void", "deep", "smoke", "frost"] as const,
  matte: ["charcoal", "slate", "graphite"] as const,
  solid: ["primary", "secondary", "accent"] as const,
} as const;

export type GlassVariant = (typeof SURFACE_VARIANTS.glass)[number];
export type MatteVariant = (typeof SURFACE_VARIANTS.matte)[number];
export type SolidVariant = (typeof SURFACE_VARIANTS.solid)[number];

/**
 * Surface roles (semantic usage).
 */
export const SURFACE_ROLES = ["button", "input", "panel", "scrim", "card", "menu"] as const;
export type SurfaceRole = (typeof SURFACE_ROLES)[number];

// ============================================
// PRIMITIVE STATES
// ============================================

/**
 * All possible primitive states.
 * Used for data-state attribute.
 */
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

// ============================================
// PEER DEPENDENCIES
// ============================================

/**
 * Required peer dependencies with version constraints.
 */
export const PEER_DEPENDENCIES = {
  "bits-ui": "^2.0.0",
  svelte: "^5.0.0",
  tailwindcss: "^4.0.0",
  vite: "^5.0.0",
} as const;

// ============================================
// BUILD CONFIGURATION
// ============================================

/**
 * Build-time configuration for the Vite plugin.
 */
export const BUILD_CONFIG = {
  /** Enable token generation */
  generateTokens: true,

  /** Enable recipe CSS generation */
  generateRecipes: true,

  /** Enable type generation */
  generateTypes: true,

  /** Enable Tailwind preset generation */
  generateTailwind: true,

  /** Watch tokens.ts for changes */
  watchTokens: true,

  /** Validate components for violations */
  validateComponents: true,

  /** Violation patterns to check */
  violations: {
    /** Arbitrary Tailwind values [...] */
    arbitraryValues: true,
    /** CSS variable definitions */
    cssVariables: true,
    /** Inline style colors */
    inlineColors: true,
    /** Raw color values */
    rawColors: true,
  },
} as const;

// ============================================
// CONFIGURATION HELPER
// ============================================

/**
 * Full ColdLight configuration object.
 * This is what gets exported and used by the system.
 */
export const config = {
  version: VERSION,
  package: PACKAGE,
  paths: PATHS,
  features: FEATURES,
  layers: LAYERS,
  dataAttributes: DATA_ATTRIBUTES,
  surfaces: SURFACES,
  surfaceVariants: SURFACE_VARIANTS,
  surfaceRoles: SURFACE_ROLES,
  primitiveStates: PRIMITIVE_STATES,
  peerDependencies: PEER_DEPENDENCIES,
  build: BUILD_CONFIG,
} as const;

export type ColdLightConfig = typeof config;

/**
 * Get a feature flag value.
 */
export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return FEATURES[feature] ?? false;
}

/**
 * Get layer information.
 */
export function getLayer(layer: Layer) {
  return LAYERS[layer];
}

/**
 * Get all layers in order.
 */
export function getLayersInOrder() {
  return Object.entries(LAYERS)
    .sort(([, a], [, b]) => a.order - b.order)
    .map(([key, value]) => ({ key: key as Layer, ...value }));
}

export default config;
