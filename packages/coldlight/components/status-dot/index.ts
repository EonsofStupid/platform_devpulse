/**
 * @file StatusDot — public API
 * @kind status-dot
 */

export { default as StatusDot } from "./StatusDot.svelte";
export { CATEGORY, StatusDotSchema, type StatusDotSchemaProps } from "./schema.js";
export type { StatusDotProps, StatusDotSize, StatusDotStatus } from "./status-dot.types.js";
export { statusDotSizeTokens, statusDotTokens } from "./tokens.js";
