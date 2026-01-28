/**
 * @file Taxonomy Barrel Export
 * @package @devpulse/coldlight
 *
 * Taxonomy is the SSOT for:
 * - Core types (StateToken, PrimitiveContract, etc.)
 * - Primitive contracts (slots, states, ARIA, keyboard)
 * - Scanner (build-time parity checking)
 * - Registry (runtime manifest access)
 */

// Core types
export * from "./types";

// Primitive contracts
export * from "./kinds";

// Build-time scanner
export { scanColdLight, scanPrimitiveKinds, scanPrimitive } from "./scanner";
export type { FsLike, ImportLike } from "./scanner";

// Runtime registry
export {
  getManifest,
  getAdapterIds,
  getActiveAdapterId,
  setActiveAdapterId,
  getPrimitiveKinds,
  hasPrimitiveKind,
  getPrimitive,
  getPrimitiveOrUndefined,
} from "./registry";
