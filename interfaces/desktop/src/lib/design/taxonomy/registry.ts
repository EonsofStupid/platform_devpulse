/**
 * @file ColdLight Runtime Registry
 * @package @devpulse/coldlight
 *
 * Runtime registry that reads ONLY from the generated manifest.
 * NO filesystem scanning. NO taxonomy imports. NO adapter declarations.
 *
 * Build step writes: taxonomy/.generated/coldlight.manifest.json
 * This file reads it at runtime.
 */

import type { ColdLightManifest, ManifestPrimitive } from "./types";

// Import the generated manifest (committed to git)
import manifestJson from "./.generated/coldlight.manifest.json";

// =============================================================================
// MANIFEST
// =============================================================================

const manifest = manifestJson as ColdLightManifest;

// =============================================================================
// INDEXES (built once at import time)
// =============================================================================

const primitiveIndex = new Map<string, ManifestPrimitive>(
  manifest.categories.primitives.kinds.map((k) => [k.kind, k] as const)
);

// =============================================================================
// ACTIVE ADAPTER STATE
// =============================================================================

let activeAdapterId: string = manifest.adapters.defaultActive;

// =============================================================================
// REGISTRY API
// =============================================================================

/**
 * Get the full manifest.
 */
export function getManifest(): ColdLightManifest {
  return manifest;
}

/**
 * Get enabled adapter IDs.
 */
export function getAdapterIds(): readonly string[] {
  return manifest.adapters.enabled;
}

/**
 * Get the currently active adapter ID.
 */
export function getActiveAdapterId(): string {
  return activeAdapterId;
}

/**
 * Set the active adapter ID.
 * Throws if adapter is not enabled.
 */
export function setActiveAdapterId(next: string): void {
  if (!manifest.adapters.enabled.includes(next)) {
    throw new Error(`[ColdLight] Adapter not enabled: ${next}`);
  }
  activeAdapterId = next;
}

/**
 * Get all primitive kinds.
 */
export function getPrimitiveKinds(): readonly string[] {
  return manifest.categories.primitives.kinds.map((k) => k.kind);
}

/**
 * Check if a kind is a registered primitive.
 */
export function hasPrimitiveKind(kind: string): boolean {
  return primitiveIndex.has(kind);
}

/**
 * Get primitive manifest entry by kind.
 * Throws if kind is not found.
 */
export function getPrimitive(kind: string): ManifestPrimitive {
  const hit = primitiveIndex.get(kind);
  if (!hit) {
    throw new Error(`[ColdLight] Unknown primitive kind: ${kind}`);
  }
  return hit;
}

/**
 * Get primitive manifest entry by kind, or undefined if not found.
 */
export function getPrimitiveOrUndefined(kind: string): ManifestPrimitive | undefined {
  return primitiveIndex.get(kind);
}
