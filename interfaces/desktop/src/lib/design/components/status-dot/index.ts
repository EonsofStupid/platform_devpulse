/**
 * @file StatusDot — public API
 * @kind status-dot
 */

export { default as StatusDot } from "./StatusDot.svelte";
export { StatusDotSchema, CATEGORY, type StatusDotSchemaProps } from "./schema.js";
export { statusDotTokens, statusDotSizeTokens } from "./tokens.js";
export { statusDotRecipes } from "./recipe.js";
export type { StatusDotProps, StatusDotStatus, StatusDotSize } from "./status-dot.types.js";
