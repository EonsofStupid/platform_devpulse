/**
 * @fileoverview Tokens Barrel Export
 * @file src/lib/design/tokens/index.ts
 * @module @devpulse/design/tokens
 * @layer tokens
 *
 * @description
 * TIER 2: Token system barrel export.
 *
 * Files:
 * - tokens.ts: SSOT - canonical token definitions (DO NOT EDIT OTHERS)
 * - tokens.css: GENERATED - CSS custom properties
 * - types.ts: GENERATED - TypeScript types + runtime arrays
 * - tailwind.preset.ts: GENERATED - Tailwind theme mapping
 * - schema.ts: Zod validators for runtime validation
 *
 * Run `pnpm ds:tokens:build` to regenerate from tokens.ts.
 *
 * @consumers
 * - All components
 * - VPB block validation
 *
 * @since 1.0.0
 */

// SSOT token definitions (source of truth)


// TypeScript types (GENERATED - const arrays + union types)


// Zod schemas (runtime validation at boundaries)


// Tailwind preset
export { dpPreset } from "./tailwind.preset";
