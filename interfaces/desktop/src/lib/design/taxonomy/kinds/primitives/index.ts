/**
 * @file Primitive Taxonomy Barrel
 * @package @devpulse/coldlight
 *
 * Master contract definitions that ALL primitives must adhere to.
 * Zod schemas are the canonical source — types.ts provides generic interfaces.
 * Per-kind contracts live in their own directories.
 */

// Zod enum schemas (atomic)
export * from "./schema.js";

// Composite schemas + PrimitiveContractSchema + validation
export * from "./contract.js";

// ============================================
// PER-KIND CONTRACTS
// ============================================

export * from "../component/button/index.js";
