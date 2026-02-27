/**
 * @file Effect System Types
 * @layer effects
 * @package @devpulse/coldlight
 *
 * Type definitions for the ColdLight Node-Based Compositor effect system.
 * Effects are composable visual building blocks — each is a typed data object
 * declaring what CSS it produces, what triggers it supports, and what
 * conflict groups it belongs to.
 *
 * Effects are the "molecules" in atomic design:
 *   Atoms (tokens) → Molecules (effects) → Organisms (primitives) → Templates (blocks)
 *
 * The effect registry is authored in TypeScript, compiled to JSON for VPB
 * inspection, and generates CSS utilities + TypeScript types.
 */

// =============================================================================
// EFFECT CATEGORIES — vocabulary of effect types
// =============================================================================

/** Categories of visual effects. Each maps to a molecule CSS file. */
export const EFFECT_CATEGORIES = [
	"glass",
	"glow",
	"depth",
	"bevel",
	"motion",
] as const;

export type EffectCategory = (typeof EFFECT_CATEGORIES)[number];

// =============================================================================
// EFFECT TRIGGERS — when an effect activates
// =============================================================================

/** Triggers determine when a composed effect applies its classes. */
export const EFFECT_TRIGGERS = [
	"always",        // Applied statically (no condition)
	"hover",         // Applied on :hover
	"focus",         // Applied on :focus-visible
	"active",        // Applied on :active / data-state="active"
	"intersection",  // Applied when element enters viewport (IntersectionObserver)
	"media",         // Applied when media query matches
	"state",         // Applied when data-state attribute matches
] as const;

export type EffectTrigger = (typeof EFFECT_TRIGGERS)[number];

// =============================================================================
// SHADOW LAYER — which CSS custom property an effect targets
// =============================================================================

/**
 * Shadow stack layers. ColdLight uses a 4-layer box-shadow composition:
 *   box-shadow: var(--_shadow-glass), var(--_shadow-bevel),
 *               var(--_shadow-glow), var(--_shadow-depth);
 *
 * Each effect sets ONE of these layers. The browser composites them.
 */
export const SHADOW_LAYERS = [
	"glass",
	"bevel",
	"glow",
	"depth",
] as const;

export type ShadowLayer = (typeof SHADOW_LAYERS)[number];

// =============================================================================
// EFFECT DEFINITION — the core data object
// =============================================================================

/**
 * A composable visual effect definition.
 *
 * This is a DATA OBJECT, not a function. It declares what CSS it produces.
 * The compiler reads these declarations to produce output.
 *
 * Examples:
 *   { id: "glass.void", category: "glass", classes: ["glass-void"], ... }
 *   { id: "glow.teal", category: "glow", classes: ["glow-teal"], ... }
 *   { id: "motion.hover-lift", category: "motion", classes: ["-translate-y-1", "shadow-xl"], ... }
 */
export interface EffectDefinition {
	/** Unique effect ID in category.name format: "glass.void", "glow.teal" */
	readonly id: string;

	/** Which category this effect belongs to */
	readonly category: EffectCategory;

	/** Human-readable display name */
	readonly label: string;

	/** What this effect does (for VPB tooltips, documentation) */
	readonly description: string;

	/** Which triggers this effect supports */
	readonly supportedTriggers: readonly EffectTrigger[];

	/** TW4 utility classes this effect applies */
	readonly classes: readonly string[];

	/**
	 * CSS custom properties this effect sets.
	 * Used for shadow stack composition: --_shadow-glass, --_shadow-glow, etc.
	 * Key = CSS property name, Value = CSS value.
	 */
	readonly cssProperties?: Readonly<Record<string, string>>;

	/** Which shadow stack layer this effect targets (if any) */
	readonly shadowLayer?: ShadowLayer;

	/** Transition classes applied when effect is conditionally triggered */
	readonly transition?: string;

	/**
	 * If this effect requires JavaScript behavior (IntersectionObserver, etc).
	 * The compiler's Logic Pass wires these modules to the rendered nodes.
	 */
	readonly customJS?: {
		readonly module: string;
		readonly defaultParams: Readonly<Record<string, unknown>>;
	};

	/**
	 * Conflict group name. Effects in the same conflict group cannot coexist
	 * on the same compositor node. Prevents e.g. glass-void + glass-deep.
	 */
	readonly conflictGroup?: string;
}

// =============================================================================
// MANIFEST EFFECT — serialized for JSON manifest
// =============================================================================

/**
 * Effect entry in the generated manifest.
 * Flattened from EffectDefinition for JSON serialization.
 */
export interface ManifestEffect {
	readonly id: string;
	readonly category: EffectCategory;
	readonly label: string;
	readonly description: string;
	readonly supportedTriggers: readonly EffectTrigger[];
	readonly classes: readonly string[];
	readonly shadowLayer?: ShadowLayer;
	readonly conflictGroup?: string;
	readonly hasCustomJS: boolean;
}

// =============================================================================
// EFFECT CATEGORY MANIFEST — per-category metadata
// =============================================================================

/**
 * Per-category manifest entry.
 * Lists all effects in the category and their conflict groups.
 */
export interface ManifestEffectCategory {
	readonly category: EffectCategory;
	readonly effectIds: readonly string[];
	readonly conflictGroups: Readonly<Record<string, readonly string[]>>;
}

// =============================================================================
// COMPOSED EFFECT — instance of an effect on a compositor node
// =============================================================================

/**
 * An instance of an effect composed onto a compositor node.
 * This is what the VPB stores in the block schema — a reference
 * to an effect definition plus per-instance configuration.
 */
export interface ComposedEffect {
	/** Unique instance ID: "fx_hover_lift_1" */
	readonly id: string;

	/** References an EffectDefinition.id: "glass.void", "motion.hover-lift" */
	readonly effectId: string;

	/** When this effect activates */
	readonly trigger: EffectTrigger;

	/**
	 * Override classes for this instance (if different from definition).
	 * If omitted, uses the definition's classes.
	 */
	readonly tailwindClasses?: readonly string[];

	/** Override transition for this instance */
	readonly transition?: string;

	/** Override customJS params for this instance */
	readonly customJS?: {
		readonly module: string;
		readonly params: Readonly<Record<string, unknown>>;
	};
}

// =============================================================================
// COMPOSITOR NODE — the VPB block schema element
// =============================================================================

/** Node types in the compositor tree */
export const COMPOSITOR_NODE_TYPES = [
	"Element",   // A rendered DOM element backed by a primitive
	"Slot",      // A slot container within a compound primitive
	"Fragment",  // A grouping node (no DOM output, just logical structure)
] as const;

export type CompositorNodeType = (typeof COMPOSITOR_NODE_TYPES)[number];

/**
 * A node in the compositor tree.
 * This is what the VPB stores — a pure data structure describing
 * a rendered element with its visual effects.
 *
 * The compiler reads this and produces: static classes, conditional
 * class groups (keyed by trigger), and Svelte actions for JS behaviors.
 */
export interface CompositorNode {
	/** Unique node ID: "blk_8f72a9" */
	readonly nodeId: string;

	/** What type of compositor node */
	readonly type: CompositorNodeType;

	/** References a primitive kind from the manifest: "button", "box", "card" */
	readonly primitive: string;

	/** Static TW4 classes (always applied, no trigger needed) */
	readonly baseStyles: readonly string[];

	/** Composed effects stacked on this node */
	readonly composedEffects: readonly ComposedEffect[];

	/** Child nodes organized by slot name */
	readonly slots?: Readonly<Record<string, readonly CompositorNode[]>>;
}

// =============================================================================
// COMPILER OUTPUT — what the compiler produces from a compositor node
// =============================================================================

/**
 * A compiled Svelte action to wire onto the rendered element.
 */
export interface CompiledAction {
	/** Svelte action name: "useIntersectionReveal", "useMediaClasses" */
	readonly action: string;

	/** Import path for the action module */
	readonly module: string;

	/** Parameters to pass to the action */
	readonly params: Readonly<Record<string, unknown>>;
}

/**
 * Output of the compositor compiler for a single node.
 * The renderer uses this to apply classes and wire behaviors.
 */
export interface CompilerOutput {
	/** Static classes (trigger: "always") — applied directly to class attr */
	readonly staticClasses: string;

	/** Conditional class groups keyed by trigger type */
	readonly conditionalClasses: Readonly<Partial<Record<EffectTrigger, string>>>;

	/** Svelte actions to wire onto the element */
	readonly actions: readonly CompiledAction[];

	/** Any compiler warnings (non-fatal) */
	readonly warnings: readonly string[];
}
