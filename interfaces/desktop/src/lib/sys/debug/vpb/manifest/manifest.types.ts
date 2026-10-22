/**
 * @file Manifest entry types — what the VPB reads from a scanned manifest
 * @layer vpb
 * @package @devpulse/sys
 *
 * The entries ColdLight's contract scanner wrote into
 * `coldlight.manifest.json`: primitives (ARIA, slots), components (focus,
 * keyboard, interactions), recipes, effects and SVG filters. Taken from
 * `$lib/design/scanner.types.ts` (deleted in 31dfab89) with the primitive
 * schema types it imported (`primitives/_schema/types.ts`, deleted in
 * c7a10cad) inlined, since neither the scanner nor the primitives are
 * restored yet. The manifest generated today has none of these sections,
 * so the VPB's A11y, SEO and Contract tabs say so until the scanner returns.
 */

/** ARIA requirements for a slot */
export interface AriaRequirements {
	readonly role?: string;
	readonly required: readonly string[];
	readonly optional: readonly string[];
}

/** Slot specification in a primitive contract */
export interface SlotSpec {
	readonly element: string;
	readonly aria: AriaRequirements;
	readonly actions?: readonly string[];
}

/** Primitive entry in the manifest. */
export interface ManifestPrimitive {
	readonly kind: string;
	readonly status: "complete" | "contract-only" | "no-contract";
	readonly ariaStateProvider: "coldlight" | "meltui";
	readonly slots: {
		readonly required: readonly string[];
		readonly optional: readonly string[];
		readonly forbidden: readonly string[];
	};
	readonly slotSpec: Record<string, SlotSpec>;
	readonly states: {
		readonly shared: readonly string[];
		readonly specific: readonly string[];
	};
	readonly slotStates: Record<string, readonly string[]>;
	readonly slotActions: Record<string, readonly string[]>;
	readonly aria: AriaRequirements;
	readonly keyboard: readonly string[];
	readonly focusStrategy: string;
	readonly compound: boolean;
	readonly orientation?: "horizontal" | "vertical";
	readonly dismissBehavior?: "close" | "none" | "blur" | "escape";
}

/** Recipe entry in the manifest. */
export interface ManifestRecipe {
	readonly id: string;
	readonly kind: string;
	readonly label: string;
	readonly slots: readonly string[];
	readonly defaults: Record<string, unknown>;
}

/** Component entry in the manifest. */
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

/** Effect entry in the manifest. */
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

/** SVG filter entry in the manifest. */
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
