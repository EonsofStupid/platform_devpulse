/**
 * @file Compositor Barrel
 * @layer compositor
 * @package @devpulse/coldlight
 *
 * The compositor is the bridge between VPB block schemas and rendered output.
 * It validates compositor nodes against the manifest and compiles them
 * into CSS classes + Svelte actions.
 */

// Schemas
export {
	CompiledActionSchema,
	CompilerOutputSchema,
	ComposedEffectSchema,
	CompositorNodeSchema,
	NodeValidationResultSchema,
	RenderingTierSchema,
	TieredComposedEffectSchema,
} from "./_schema/schema.js";

// Types
export type {
	CompiledAction,
	CompilerOutput,
	ComposedEffect,
	CompositorNode,
	CompositorNodeType,
	NodeValidationError,
	NodeValidationErrorCode,
	NodeValidationResult,
	RenderingTier,
	TieredComposedEffect,
} from "./_schema/types.js";

export { COMPOSITOR_NODE_TYPES, NODE_VALIDATION_ERROR_CODES } from "./_schema/types.js";
// Validation
export { validateNode, validateTree } from "./_schema/validate.js";
