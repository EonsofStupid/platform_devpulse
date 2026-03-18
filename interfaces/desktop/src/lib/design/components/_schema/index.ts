/**
 * @file Component Schema Barrel
 * @package @devpulse/coldlight
 *
 * Type infrastructure for ALL components.
 * Zod schemas are the canonical source.
 */

// ComponentContractSchema + validation
export * from "./contract.js";
// ARIA value schemas + slot schemas
export * from "./schema.js";

// TypeScript types (convenience re-exports)
export * from "./types.js";
