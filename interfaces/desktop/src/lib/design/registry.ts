/**
 * @file ColdLight Runtime Registry
 * @package @devpulse/coldlight
 *
 * Runtime registry that reads ONLY from the generated manifest.
 * NO filesystem scanning. NO taxonomy imports.
 *
 * Build step writes: .generated/coldlight.manifest.json
 * This file reads it at runtime.
 */

// Import the generated manifest (committed to git)
import manifestJson from "./.generated/coldlight.manifest.json";
import type { ColdLightManifest, ManifestPrimitive } from "./scanner.types.js";

// =============================================================================
// MANIFEST
// =============================================================================

const manifest = manifestJson as unknown as ColdLightManifest;

// =============================================================================
// INDEXES (built once at import time)
// =============================================================================

const primitiveIndex = new Map<string, ManifestPrimitive>(
	manifest.categories.primitives.kinds.map((k) => [k.kind, k] as const),
);

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
 * Get the dsAdapter declared in config (the behavior provider under ColdLight).
 */
export function getDsAdapter(): string {
	return manifest.adapters.dsAdapter;
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
