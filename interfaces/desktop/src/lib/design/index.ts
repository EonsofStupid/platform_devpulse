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
// TOKENS (SSOT values)
// ===========================================
export * from "./tokens/tokens";
export * from "./tokens/types";
export * from "./tokens/schema";

// ===========================================
// TAXONOMY (block definitions)
// ===========================================
export * from "./taxonomy/kinds";
export * from "./taxonomy/contracts";

// ===========================================
// RECIPES (style composition)
// ===========================================
export * from "./recipes";
export * from "./recipes/actions";

// ===========================================
// VITE PLUGIN
// ===========================================
export { coldlight } from "./vite-plugin";
