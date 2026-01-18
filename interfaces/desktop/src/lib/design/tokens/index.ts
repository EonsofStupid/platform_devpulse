/**
 * @fileoverview Tokens Barrel Export (SSOT)
 * @file src/lib/design/tokens/index.ts
 * @module @devpulse/design/tokens
 * @layer tokens
 *
 * @description
 * TIER 2: Token system - THIS IS THE SSOT.
 * types.ts contains the const arrays + union types.
 * schema.ts contains Zod validators for boundaries.
 * tokens.css contains CSS variable definitions.
 *
 * @consumers
 * - All components
 * - VPB block validation
 *
 * @since 1.0.0
 */

// TypeScript types (const arrays + union types) - SSOT
export * from "./types";

// Zod schemas (runtime validation at boundaries)
export * from "./schema";
