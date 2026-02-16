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

// Runtime registry
export {
	getDsAdapter,
	getManifest,
	getPrimitive,
	getPrimitiveKinds,
	getPrimitiveOrUndefined,
	hasPrimitiveKind,
} from "./registry";
export type { FsLike, ImportLike } from "./scanner";
// Build-time scanner
export { scanColdLight, scanPrimitive, scanPrimitiveKinds } from "./scanner";
// Core types
export * from "./types";
