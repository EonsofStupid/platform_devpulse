/**
 * @file Compositor Barrel
 * @layer compositor
 * @package @devpulse/coldlight
 *
 * The compositor is the bridge between VPB block schemas and rendered output.
 * It validates compositor nodes against the manifest and compiles them
 * into CSS classes + Svelte actions.
 */

// Validation
export { validateNode, validateTree } from "./_schema/validate.js";

// Types
export type {
	CompositorNode,
	CompositorNodeType,
	ComposedEffect,
	CompiledAction,
	CompilerOutput,
	RenderingTier,
	TieredComposedEffect,
	NodeValidationResult,
	NodeValidationError,
	NodeValidationErrorCode,
} from "./_schema/types.js";

export { COMPOSITOR_NODE_TYPES, NODE_VALIDATION_ERROR_CODES } from "./_schema/types.js";

// Schemas
export {
	ComposedEffectSchema,
	CompositorNodeSchema,
	CompiledActionSchema,
	CompilerOutputSchema,
	RenderingTierSchema,
	TieredComposedEffectSchema,
	NodeValidationResultSchema,
} from "./_schema/schema.js";
