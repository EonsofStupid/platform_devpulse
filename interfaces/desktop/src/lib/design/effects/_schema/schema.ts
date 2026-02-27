/**
 * @file Effect Schema Validators
 * @layer effects
 * @package @devpulse/coldlight
 *
 * Zod schemas for runtime validation of effect definitions,
 * composed effects, and compositor nodes.
 *
 * Use at BOUNDARIES: VPB block load, API payloads, saved layouts.
 * Do NOT use in hot paths (every render, every hover).
 */

import { z } from "zod";
import {
	EFFECT_CATEGORIES,
	EFFECT_TRIGGERS,
	SHADOW_LAYERS,
	COMPOSITOR_NODE_TYPES,
} from "./types.js";

// =============================================================================
// VOCABULARY SCHEMAS
// =============================================================================

export const EffectCategorySchema = z.enum(EFFECT_CATEGORIES);
export const EffectTriggerSchema = z.enum(EFFECT_TRIGGERS);
export const ShadowLayerSchema = z.enum(SHADOW_LAYERS);
export const CompositorNodeTypeSchema = z.enum(COMPOSITOR_NODE_TYPES);

// =============================================================================
// EFFECT DEFINITION SCHEMA
// =============================================================================

/**
 * Validates EffectDefinition objects at registration time.
 * Enforces:
 * - ID format: category.name (dot-separated, lowercase)
 * - Category must be from vocabulary
 * - At least one supported trigger
 * - At least one CSS class
 */
export const EffectDefinitionSchema = z.object({
	id: z.string().regex(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/, {
		message: "Effect ID must be dot-separated: category.name (e.g., 'glass.void')",
	}),
	category: EffectCategorySchema,
	label: z.string().min(1),
	description: z.string().min(1),
	supportedTriggers: z.array(EffectTriggerSchema).min(1).readonly(),
	classes: z.array(z.string()).min(1).readonly(),
	cssProperties: z.record(z.string(), z.string()).optional(),
	shadowLayer: ShadowLayerSchema.optional(),
	transition: z.string().optional(),
	customJS: z.object({
		module: z.string().min(1),
		defaultParams: z.record(z.string(), z.unknown()),
	}).optional(),
	conflictGroup: z.string().optional(),
});

// =============================================================================
// COMPOSED EFFECT SCHEMA
// =============================================================================

/**
 * Validates ComposedEffect instances on compositor nodes.
 * Each composed effect references an EffectDefinition by ID.
 */
export const ComposedEffectSchema = z.object({
	id: z.string().min(1),
	effectId: z.string().regex(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/, {
		message: "effectId must reference a valid effect: category.name",
	}),
	trigger: EffectTriggerSchema,
	tailwindClasses: z.array(z.string()).readonly().optional(),
	transition: z.string().optional(),
	customJS: z.object({
		module: z.string().min(1),
		params: z.record(z.string(), z.unknown()),
	}).optional(),
});

// =============================================================================
// COMPOSITOR NODE SCHEMA
// =============================================================================

/**
 * Validates CompositorNode structures from VPB block schemas.
 * Uses lazy() for recursive slot children.
 */
export const CompositorNodeSchema: z.ZodType = z.lazy(() =>
	z.object({
		nodeId: z.string().min(1),
		type: CompositorNodeTypeSchema,
		primitive: z.string().min(1),
		baseStyles: z.array(z.string()).readonly(),
		composedEffects: z.array(ComposedEffectSchema).readonly(),
		slots: z.record(z.string(), z.array(CompositorNodeSchema).readonly()).optional(),
	}),
);

// =============================================================================
// COMPILER OUTPUT SCHEMA
// =============================================================================

export const CompiledActionSchema = z.object({
	action: z.string().min(1),
	module: z.string().min(1),
	params: z.record(z.string(), z.unknown()),
});

export const CompilerOutputSchema = z.object({
	staticClasses: z.string(),
	conditionalClasses: z.record(EffectTriggerSchema, z.string()),
	actions: z.array(CompiledActionSchema).readonly(),
	warnings: z.array(z.string()).readonly(),
});
