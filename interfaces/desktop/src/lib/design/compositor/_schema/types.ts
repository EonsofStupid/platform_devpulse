/**
 * @file Compositor Type Definitions
 * @layer compositor
 * @package @devpulse/coldlight
 *
 * Types for the compositor tree — the VPB block schema structure.
 * A compositor node describes a rendered element with its visual effects.
 * The compiler reads nodes and produces CSS classes + Svelte actions.
 *
 * Re-exports base types from effects/_schema/ and extends with
 * compositor-specific additions (tier hints, validation types).
 */

// Re-export base compositor types from effects (where they originate)
export type {
	CompiledAction,
	CompilerOutput,
	ComposedEffect,
	CompositorNode,
	CompositorNodeType,
	EffectTrigger,
} from "../../effects/_schema/types.js";
export { COMPOSITOR_NODE_TYPES } from "../../effects/_schema/types.js";

// =============================================================================
// COMPOSITOR-SPECIFIC EXTENSIONS
// =============================================================================

/**
 * Rendering tier for an effect on a compositor node.
 * "css"  = baseline (box-shadow molecules, universal, fast)
 * "svg"  = premium (SVG filter, neumorphic, max ~10 per viewport)
 * "auto" = compiler decides based on viewport budget
 */
export type RenderingTier = "css" | "svg" | "auto";

/**
 * Extended composed effect with tier hint.
 * The VPB stores this — includes a tier preference that the compiler uses
 * to choose between CSS and SVG implementations of the same effect.
 */
export interface TieredComposedEffect {
	/** Unique instance ID: "fx_hover_lift_1" */
	readonly id: string;
	/** References an EffectDefinition.id */
	readonly effectId: string;
	/** When this effect activates */
	readonly trigger: string;
	/** Rendering tier preference */
	readonly tier: RenderingTier;
	/** Override classes for this instance */
	readonly tailwindClasses?: readonly string[];
	/** Override transition for this instance */
	readonly transition?: string;
}

// =============================================================================
// VALIDATION RESULT TYPES
// =============================================================================

/**
 * Result of validating a compositor node against the manifest.
 */
export interface NodeValidationResult {
	readonly valid: boolean;
	readonly errors: readonly NodeValidationError[];
	readonly warnings: readonly string[];
}

/**
 * A single validation error on a compositor node.
 */
export interface NodeValidationError {
	readonly nodeId: string;
	readonly code: NodeValidationErrorCode;
	readonly message: string;
}

/** Validation error codes for compositor nodes. */
export const NODE_VALIDATION_ERROR_CODES = [
	"PRIMITIVE_NOT_FOUND",
	"EFFECT_NOT_FOUND",
	"CONFLICT_GROUP_VIOLATION",
	"INVALID_SLOT",
	"SVG_FILTER_NOT_FOUND",
	"TRIGGER_NOT_SUPPORTED",
] as const;

export type NodeValidationErrorCode = (typeof NODE_VALIDATION_ERROR_CODES)[number];
