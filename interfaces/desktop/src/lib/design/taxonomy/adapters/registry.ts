/**
 * @file Adapter Registry
 * @description Runtime registry populated by the scanner.
 *
 * The registry provides runtime access to:
 *   - Adapter declarations (coldlight, meltui)
 *   - Primitive scan results
 *   - Parity validation
 *
 * Initialized at dev server start by calling initRegistry() with scan results.
 */

import type {
  AdapterId,
  AdapterDeclaration,
  PrimitiveScanResult,
  RegistryScanResult,
} from "./types";

// =============================================================================
// ADAPTER DECLARATIONS
// =============================================================================

/**
 * ColdLight adapter - the public API surface.
 * Consumers import from ColdLight, never directly from MeltUI.
 */
export const coldlightDeclaration: AdapterDeclaration = {
  id: "coldlight",
  name: "ColdLight",
  description: "Public API surface - what component consumers import from",
  isPublicApi: true,
  internalPath: "api/adapters/coldlight/_internal",
};

/**
 * MeltUI adapter - the ARIA/behavior provider.
 * Internal implementation detail, never exposed to consumers.
 */
export const meltuiDeclaration: AdapterDeclaration = {
  id: "meltui",
  name: "MeltUI",
  description: "ARIA and behavior provider - internal implementation",
  isPublicApi: false,
  internalPath: "api/adapters/meltui/_internal",
};

/**
 * All adapter declarations indexed by ID.
 */
export const adapterDeclarations: Record<AdapterId, AdapterDeclaration> = {
  coldlight: coldlightDeclaration,
  meltui: meltuiDeclaration,
};

// =============================================================================
// REGISTRY STATE
// =============================================================================

/**
 * Registry state - populated by scanner at dev server start.
 */
let state: RegistryScanResult | null = null;

/**
 * Initialize the registry with scan results.
 * Called once at dev server start.
 */
export function initRegistry(scanResult: RegistryScanResult): void {
  state = scanResult;
}

/**
 * Check if registry has been initialized.
 */
export function isInitialized(): boolean {
  return state !== null;
}

// =============================================================================
// REGISTRY API
// =============================================================================

/**
 * Get all discovered primitive kinds.
 */
export function getPrimitiveKinds(): string[] {
  if (!state) return [];
  return state.primitives.map((p) => p.kind);
}

/**
 * Get all adapter IDs.
 */
export function getAdapterIds(): AdapterId[] {
  return ["coldlight", "meltui"];
}

/**
 * Check if a kind is a registered primitive.
 */
export function isPrimitiveKind(kind: string): boolean {
  if (!state) return false;
  return state.primitives.some((p) => p.kind === kind);
}

/**
 * Get scan result for a specific primitive.
 */
export function getPrimitive(kind: string): PrimitiveScanResult | undefined {
  if (!state) return undefined;
  return state.primitives.find((p) => p.kind === kind);
}

/**
 * Get adapter declaration by ID.
 */
export function getAdapterDeclaration(id: AdapterId): AdapterDeclaration {
  return adapterDeclarations[id];
}

/**
 * Validate that all primitives have 4-folder parity.
 */
export function validateRegistry(): { valid: boolean; errors: string[] } {
  if (!state) {
    return { valid: false, errors: ["Registry not initialized"] };
  }
  return {
    valid: state.valid,
    errors: state.errors,
  };
}

/**
 * Get the full registry state.
 */
export function getRegistryState(): RegistryScanResult | null {
  return state;
}
