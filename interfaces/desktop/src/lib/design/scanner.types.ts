/**
 * @file ColdLight Scanner & Manifest Types
 * @package @devpulse/coldlight
 *
 * Types for manifest output, scanner results, and registry.
 * The scanner walks primitives/, validates contracts, and produces the manifest.
 * The manifest IS the taxonomy — generated, not hand-maintained.
 */

export type { AriaStateProvider, DsAdapterId, SlotAction, StateToken } from "./primitives/_schema/types.js";

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
} from "./primitives/_schema/types.js";

// =============================================================================
// MANIFEST TYPES — Generated output
// =============================================================================

/**
 * Primitive entry in the generated manifest.
 * Flattened from PrimitiveContract for JSON serialization.
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
 * Recipe entry in the generated manifest.
 * Serialized from the runtime recipe registry for build-time discovery.
 */
export interface ManifestRecipe {
	readonly id: string;
	readonly kind: string;
	readonly label: string;
	readonly slots: readonly string[];
	readonly defaults: Record<string, unknown>;
}

/**
 * The generated ColdLight manifest.
 * Written by scanner, read by registry.
 * THIS IS THE TAXONOMY — auto-generated from colocated contracts.
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
		readonly recipes: {
			readonly entries: readonly ManifestRecipe[];
		};
	};
}

// =============================================================================
// SCANNER TYPES
// =============================================================================

export interface ScanError {
	readonly code: ScanErrorCode;
	readonly kind: string;
	readonly detail: string;
}

export interface PrimitiveScanResult {
	readonly kind: string;
	readonly ariaStateProvider: AriaStateProvider;
	readonly hasContract: boolean;
	readonly hasSvelteComponent: boolean;
	/** ColdLight builder exists at builders/{kind}/ (informational) */
	readonly hasBuilder: boolean;
	readonly missingAdapters: readonly DsAdapterId[];
	readonly hasParity: boolean;
}

export interface ScanResult {
	readonly valid: boolean;
	readonly primitives: readonly PrimitiveScanResult[];
	readonly errors: readonly ScanError[];
	readonly manifest: ColdLightManifest | null;
}
