/**
 * @file Taxonomy Barrel Export
 * @package @devpulse/coldlight
 *
 * Taxonomy is the SSOT for:
 * - Primitive contracts (taxonomy/primitive/)
 * - Component contracts (taxonomy/component/)
 * - Scanner (build-time parity checking)
 * - Registry (runtime manifest access)
 */

// Primitive master contract (schema, contract, types)
export * from "./primitive/index.js";

// Component master contract (schema, contract, types)
export * from "./component/index.js";

// Manifest + scanner types
export type {
	ColdLightManifest,
	ManifestPrimitive,
	PrimitiveScanResult,
	ScanError,
	ScanResult,
} from "./types.js";

// Primitive contracts (per-kind instances)
export * from "./kinds/index.js";

// Runtime registry
export {
	getDsAdapter,
	getManifest,
	getPrimitive,
	getPrimitiveKinds,
	getPrimitiveOrUndefined,
	hasPrimitiveKind,
} from "./registry.js";

export type { FsLike, ImportLike } from "./scanner.js";
// Build-time scanner
export { scanColdLight, scanPrimitive, scanPrimitiveKinds } from "./scanner.js";
