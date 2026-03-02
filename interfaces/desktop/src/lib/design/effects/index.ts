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

// ─── Category registrations (side-effect imports) ────────────────────────────
// Each import registers its effects into the global registry.
import "./categories/glass/index.js";
import "./categories/glow/index.js";
import "./categories/depth/index.js";
import "./categories/bevel/index.js";
import "./categories/frame/index.js";
import "./categories/motion/index.js";
import "./categories/transition/index.js";

// ─── Bridge — encoding ↔ effects recommendation ─────────────────────────────
export type { InteractivePreset } from "./bridge.js";
export { recommendEffects, presetToComposedEffects } from "./bridge.js";

// ─── Actions — JS-driven visual effects (Svelte 5 actions) ──────────────────
export { intersectionReveal, type IntersectionRevealParams } from "./actions/intersection-reveal.js";
export { glowTrack, type GlowTrackParams } from "./actions/glow-track.js";
