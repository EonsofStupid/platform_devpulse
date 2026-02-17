/**
 * @file Component Taxonomy Barrel
 * @package @devpulse/coldlight
 *
 * Master contract definitions that ALL components must adhere to.
 * Import/export only — zero logic.
 */

// ARIA value schemas + slot schemas
export * from "./schema.js";

// ComponentContractSchema + validation
export * from "./contract.js";

// TypeScript types (convenience re-exports)
export * from "./types.js";
