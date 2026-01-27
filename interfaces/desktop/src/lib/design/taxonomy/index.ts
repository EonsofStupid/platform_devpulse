/**
 * @file Taxonomy Barrel Export
 * @description The declarative foundation layer
 *
 * Taxonomy is the SSOT for:
 * - Adapter declarations (coldlight, meltui)
 * - Primitive contracts (slots, states, ARIA, keyboard)
 * - Registry that scans and enforces parity
 */

// Adapter system (scan-based)
export * from "./adapters";

// Primitive contracts
export * from "./primitives";

// Note: slots.ts has broken imports (kind/kinds doesn't exist)
// Re-enable when kind/ folder is created:
// export * from "./slots.js";
