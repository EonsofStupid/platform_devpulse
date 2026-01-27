/**
 * @file Taxonomy Adapters Barrel
 * @description Exports scanner, registry, and foundational types.
 */

// =============================================================================
// TYPES
// =============================================================================

export type {
  StateCategory,
  StateToken,
  BehaviorProvider,
  PrimitiveContract,
  AdapterId,
  AdapterDeclaration,
  PrimitiveScanResult,
  RegistryScanResult,
} from "./types";

// =============================================================================
// SCANNER
// =============================================================================

export {
  scanPrimitiveKinds,
  scanPrimitive,
  scanRegistry,
} from "./scanner";

// =============================================================================
// REGISTRY
// =============================================================================

export {
  coldlightDeclaration,
  meltuiDeclaration,
  adapterDeclarations,
  initRegistry,
  isInitialized,
  getPrimitiveKinds,
  getAdapterIds,
  isPrimitiveKind,
  getPrimitive,
  getAdapterDeclaration,
  validateRegistry,
  getRegistryState,
} from "./registry";
