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
 * Component entry in the generated manifest.
 * Flattened from ComponentContract for JSON serialization.
 * Each component references a primitive kind (cross-validated by scanner).
 */
export interface ManifestComponent {
	readonly kind: string;
	readonly description: string;
	readonly primitiveKind: string;
	readonly apgPattern?: string;
	readonly slots: {
		readonly required: readonly string[];
		readonly optional: readonly string[];
	};
	readonly accessibleName: {
		readonly required: boolean;
		readonly sources: readonly string[];
	};
	readonly focus: {
		readonly strategy: string;
		readonly initialFocus?: string;
		readonly returnFocus?: string;
	};
	readonly keyboard: readonly {
		readonly key: string;
		readonly action: string;
		readonly description: string;
	}[];
	readonly states: readonly string[];
	readonly interactions: {
		readonly modal: boolean;
		readonly selectable: boolean;
		readonly editable: boolean;
		readonly expandable: boolean;
	};
	readonly waiAdapt?: {
		readonly action?: string;
		readonly purpose?: string;
		readonly simplification: string;
	};
}

/**
 * Effect entry in the generated manifest.
 * Composable visual building block — data object, not function.
 */
export interface ManifestEffect {
	readonly id: string;
	readonly category: string;
	readonly label: string;
	readonly description: string;
	readonly supportedTriggers: readonly string[];
	readonly classes: readonly string[];
	readonly shadowLayer?: string;
	readonly conflictGroup?: string;
	readonly hasCustomJS: boolean;
}

/**
 * SVG filter entry in the generated manifest.
 * Premium tier neumorphic effects — feSpecularLighting, feTurbulence chains.
 */
export interface ManifestSvgFilter {
	readonly id: string;
	readonly category: string;
	readonly label: string;
	readonly description: string;
	readonly cssClass: string;
	readonly params: readonly {
		readonly cssProperty: string;
		readonly defaultValue: string | number;
	}[];
	readonly effectId?: string;
}

/**
 * SVG blank shape entry in the generated manifest.
 */
export interface ManifestSvgBlank {
	readonly shape: string;
	readonly availableFilters: readonly string[];
}

/**
 * Token layer metadata in the manifest.
 * Reports what token tiers exist and what files were generated.
 */
export interface ManifestTokenMetadata {
	readonly tiers: readonly string[];
	readonly generatedFiles: readonly string[];
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
		readonly tokens: ManifestTokenMetadata;
		readonly effects: {
			readonly definitions: readonly ManifestEffect[];
			readonly categories: readonly string[];
			readonly conflictGroups: Readonly<Record<string, readonly string[]>>;
		};
		readonly svg: {
			readonly filters: readonly ManifestSvgFilter[];
			readonly blanks: readonly ManifestSvgBlank[];
		};
		readonly primitives: {
			readonly kinds: readonly ManifestPrimitive[];
		};
		readonly components: {
			readonly kinds: readonly ManifestComponent[];
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

export interface ComponentScanResult {
	readonly kind: string;
	readonly hasContract: boolean;
	readonly hasSvelteComponent: boolean;
	readonly primitiveKind: string | null;
	readonly primitiveExists: boolean;
}

export interface ScanResult {
	readonly valid: boolean;
	readonly primitives: readonly PrimitiveScanResult[];
	readonly components: readonly ComponentScanResult[];
	readonly errors: readonly ScanError[];
	readonly manifest: ColdLightManifest | null;
}
