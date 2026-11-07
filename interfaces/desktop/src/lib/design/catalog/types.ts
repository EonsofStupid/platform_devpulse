/**
 * @file ColdLight Taxonomy Types — Manifest & Scanner
 * @package @devpulse/coldlight
 *
 * Taxonomy-wide types for manifest output and scanner results.
 * Primitive-specific types are in ./primitive/types.ts.
 * Component-specific types are in ./component/types.ts.
 */

// Re-export ALL primitive types for backward compatibility
export * from "./kinds/primitives/types.js";

import type {
	AriaRequirements,
	AriaStateProvider,
	DismissBehavior,
	DsAdapterId,
	FocusStrategy,
	KeyboardKey,
	Orientation,
	ScanErrorCode,
	SlotAction,
	SlotSpec,
	StateToken,
} from "./kinds/primitives/types.js";

// =============================================================================
// MANIFEST TYPES
// =============================================================================

/**
 * Primitive entry in the generated manifest.
 * Flattened from PrimitiveContract for JSON serialization.
 * Uses the same typed vocabularies as the source contract.
 */
export interface ManifestPrimitive {
	readonly kind: string;
	readonly ariaStateProvider: AriaStateProvider;
	readonly slots: {
		readonly required: readonly string[];
		readonly optional: readonly string[];
		readonly forbidden: readonly string[];
	};
	readonly slotSpec: Record<string, SlotSpec>;
	readonly states: {
		readonly shared: readonly StateToken[];
		readonly specific: readonly StateToken[];
	};
	readonly slotStates: Record<string, readonly StateToken[]>;
	readonly slotActions: Record<string, readonly SlotAction[]>;
	readonly aria: AriaRequirements;
	readonly keyboard: readonly KeyboardKey[];
	readonly focusStrategy: FocusStrategy;
	readonly compound: boolean;
	readonly orientation?: Orientation;
	readonly dismissBehavior?: DismissBehavior;
}

/**
 * The generated ColdLight manifest.
 * Written by scanner, read by registry.
 */
export interface ColdLightManifest {
	readonly version: string;
	readonly generatedAt: string;
	readonly adapters: {
		readonly dsAdapter: string;
	};
	readonly categories: {
		readonly primitives: {
			readonly kinds: readonly ManifestPrimitive[];
		};
	};
}

// =============================================================================
// SCANNER TYPES
// =============================================================================

/**
 * Error from scanner.
 */
export interface ScanError {
	readonly code: ScanErrorCode;
	readonly kind: string;
	readonly detail: string;
}

/**
 * Result of scanning a single primitive for parity.
 */
export interface PrimitiveScanResult {
	readonly kind: string;
	readonly ariaStateProvider: AriaStateProvider;
	readonly hasContract: boolean;
	readonly hasSvelteComponent: boolean;
	readonly missingAdapters: readonly DsAdapterId[];
	readonly hasParity: boolean;
}

/**
 * Full scanner result.
 */
export interface ScanResult {
	readonly valid: boolean;
	readonly primitives: readonly PrimitiveScanResult[];
	readonly errors: readonly ScanError[];
	readonly manifest: ColdLightManifest | null;
}
