/**
 * @file Compositor Zod Schemas
 * @layer compositor
 * @package @devpulse/coldlight
 *
 * Re-exports base schemas from effects/_schema/ and adds
 * compositor-specific schemas (tiered effects, validation).
 */

import { z } from "zod";
import { NODE_VALIDATION_ERROR_CODES } from "./types.js";

// Re-export base schemas
export {
	ComposedEffectSchema,
	CompositorNodeSchema,
	CompiledActionSchema,
	CompilerOutputSchema,
} from "../../effects/_schema/schema.js";

// =============================================================================
// COMPOSITOR-SPECIFIC SCHEMAS
// =============================================================================

export const RenderingTierSchema = z.enum(["css", "svg", "auto"]);

export const TieredComposedEffectSchema = z.object({
	id: z.string().min(1),
	effectId: z.string().min(1),
	trigger: z.string().min(1),
	tier: RenderingTierSchema,
	tailwindClasses: z.array(z.string()).readonly().optional(),
	transition: z.string().optional(),
});

export const NodeValidationErrorCodeSchema = z.enum(NODE_VALIDATION_ERROR_CODES);

export const NodeValidationErrorSchema = z.object({
	nodeId: z.string(),
	code: NodeValidationErrorCodeSchema,
	message: z.string(),
});

export const NodeValidationResultSchema = z.object({
	valid: z.boolean(),
	errors: z.array(NodeValidationErrorSchema).readonly(),
	warnings: z.array(z.string()).readonly(),
});
