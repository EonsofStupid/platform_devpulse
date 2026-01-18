/**
 * @fileoverview COLD LIGHT Design System - Master Export
 * @file src/lib/design/index.ts
 * @module @devpulse/design
 * @layer design
 *
 * @description
 * Master barrel export for the 8-tier design system.
 * 
 * TIER HIERARCHY:
 * 1. Taxonomy   - Category definitions (what exists)
 * 2. Tokens     - Values + ramps + runtime types
 * 3. Foundations - Typography, density, spacing, z-index
 * 4. Surfaces   - Material recipes (glass/solid/matte/slime)
 * 5. Motion     - Keyframes + presets + budgets
 * 6. Behaviors  - Interaction modules + constraints
 * 7. Components - Primitives + semantics + variants
 * 8. Blocks     - VPB compositions + inspector controls
 *
 * @since 1.0.0
 */

// ===========================================
// TIER 1: TAXONOMY
// ===========================================
export * from "./taxonomy";

// ===========================================
// TIER 2: TOKENS
// ===========================================
export * from "./tokens/types";
export * from "./tokens/schema";

// ===========================================
// TIER 3: FOUNDATIONS
// ===========================================
export * from "./foundations";

// ===========================================
// TIER 4: SURFACES
// ===========================================
export * from "./surfaces";

// ===========================================
// TIER 5: MOTION
// ===========================================
export * from "./motion";

// ===========================================
// TIER 6: BEHAVIORS
// ===========================================
export * from "./behaviors";

// ===========================================
// TIER 7: COMPONENTS
// ===========================================
// Components are imported individually from ./components/
// Not re-exported here to allow tree-shaking

// ===========================================
// TIER 8: BLOCKS (VPB)
// ===========================================
export * from "./blocks";
