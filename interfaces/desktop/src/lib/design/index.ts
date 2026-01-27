/**
 * @file index.ts
 * @package @devpulse/coldlight
 *
 * ColdLight Design System - Master Export
 *
 * Liquid surface design system. Particle effects, metal, glass, molten aesthetics.
 * Named for Tesla's cold light gas tubes (1870s).
 *
 * @author Jesse "Hades" Hall <jessay@angryvibers.com>
 * @license MIT
 */

// ===========================================
// CORE CONFIGURATION
// ===========================================
export * from "./coldlight.config";
export { default as config } from "./coldlight.config";

// ===========================================
// COMPONENT MANIFEST
// ===========================================
export * from "./manifest";
export { default as MANIFEST } from "./manifest";

// ===========================================
// CONSTRAINT SYSTEM
// ===========================================
export * from "./constraints";
export { default as constraints } from "./constraints";

// ===========================================
// TOKENS (SSOT values)
// ===========================================
export * from "./tokens/tokens";
export * from "./tokens/types";
export * from "./tokens/schema";

// ===========================================
// TAXONOMY (block definitions)
// ===========================================
export * from "./taxonomy/kind/kinds";

// ===========================================
// RECIPES (style composition)
// ===========================================
export * from "./recipes";
export * from "./recipes/actions";

// ===========================================
// VITE PLUGIN
// ===========================================
export { coldlight } from "./vite-plugin";
