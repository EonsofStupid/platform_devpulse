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

// Schemas (for boundary validation)
export {
	CompiledActionSchema,
	CompilerOutputSchema,
	ComposedEffectSchema,
	CompositorNodeSchema,
	CompositorNodeTypeSchema,
	EffectCategorySchema,
	EffectDefinitionSchema,
	EffectTriggerSchema,
	ShadowLayerSchema,
} from "./_schema/schema.js";
// Schema types (for consumers)
export type {
	CompiledAction,
	CompilerOutput,
	ComposedEffect,
	CompositorNode,
	CompositorNodeType,
	EffectCategory,
	EffectDefinition,
	EffectTrigger,
	ManifestEffect,
	ManifestEffectCategory,
	ShadowLayer,
} from "./_schema/types.js";
export {
	COMPOSITOR_NODE_TYPES,
	EFFECT_CATEGORIES,
	EFFECT_TRIGGERS,
	SHADOW_LAYERS,
} from "./_schema/types.js";
// Registry API
export {
	effectsConflict,
	getAllEffectsForManifest,
	getCategoryManifests,
	getConflictGroup,
	getEffect,
	getEffectCount,
	getEffectsForCategory,
	registerEffect,
} from "./registry.js";

// ─── Category registrations (side-effect imports) ────────────────────────────
// Each import registers its effects into the global registry.
import "./categories/glass/index.js";
import "./categories/glow/index.js";
import "./categories/depth/index.js";
import "./categories/bevel/index.js";
import "./categories/frame/index.js";
import "./categories/motion/index.js";
import "./categories/transition/index.js";

export { type GlowTrackParams, glowTrack } from "./actions/glow-track.js";
// ─── Actions — JS-driven visual effects (Svelte 5 actions) ──────────────────
export {
	type IntersectionRevealParams,
	intersectionReveal,
} from "./actions/intersection-reveal.js";
// ─── Bridge — encoding ↔ effects recommendation ─────────────────────────────
export type { InteractivePreset } from "./bridge.js";
export { presetToComposedEffects, recommendEffects } from "./bridge.js";
