/**
 * @fileoverview Token Schema Validators
 * @file src/lib/design/tokens/schema.ts
 * @module @devpulse/design/tokens/schema
 * @layer tokens
 *
 * @description
 * Zod schemas for runtime validation of token inputs.
 * Use at BOUNDARIES (VPB load, API payloads, saved layouts).
 * Do NOT use in hot paths (every render, every hover).
 *
 * @since 1.0.0
 */
