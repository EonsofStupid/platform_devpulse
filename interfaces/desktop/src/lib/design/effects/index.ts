/**
 * @file Effects — Barrel Export
 * @layer effects
 * @package @devpulse/coldlight
 *
 * Public API for the ColdLight effect system.
 *
 * Import categories to register effects (side-effect):
 *   import "$lib/design/effects/categories/glass/index.js";
 *
 * Query the registry:
 *   import { getEffect, getEffectsForCategory } from "$lib/design/effects";
 */

// Schema types (for consumers)
export type {
	EffectCategory,
	EffectDefinition,
	EffectTrigger,
	ShadowLayer,
	ComposedEffect,
	CompositorNode,
	CompositorNodeType,
	CompilerOutput,
	CompiledAction,
	ManifestEffect,
	ManifestEffectCategory,
} from "./_schema/types.js";

export {
	EFFECT_CATEGORIES,
	EFFECT_TRIGGERS,
	SHADOW_LAYERS,
	COMPOSITOR_NODE_TYPES,
} from "./_schema/types.js";

// Registry API
export {
	registerEffect,
	getEffect,
	getEffectsForCategory,
	getConflictGroup,
	effectsConflict,
	getEffectCount,
	getAllEffectsForManifest,
	getCategoryManifests,
} from "./registry.js";

// Schemas (for boundary validation)
export {
	EffectDefinitionSchema,
	EffectCategorySchema,
	EffectTriggerSchema,
	ShadowLayerSchema,
	ComposedEffectSchema,
	CompositorNodeSchema,
	CompositorNodeTypeSchema,
	CompilerOutputSchema,
	CompiledActionSchema,
} from "./_schema/schema.js";
