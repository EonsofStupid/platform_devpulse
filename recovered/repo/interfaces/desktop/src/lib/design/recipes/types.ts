/**
 * @file Recipe Types — Re-export facade for _base/schema.ts
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * ALL recipe types now live in _base/schema.ts (the SSOT).
 * This file re-exports everything for backward compatibility.
 * New code should import from "./_base/schema.js" directly.
 */

export {
	// Types
	type DsSurfaceProps,
	// Zod schemas
	DsSurfacePropsSchema,
	RadiusSchema,
	type RadiusToken,
	RadiusTokens,
	type RecipeDefinition,
	RecipeDefinitionSchema,
	type RecipeLegend,
	SizeSchema,
	type SizeToken,
	// Size & Radius — recipe-level props (SSOT)
	SizeTokens,
	type SlotDefinition,
	SlotDefinitionSchema,
	type SlotVisualMode,
	SlotVisualModeSchema,
	// Functions
	toPreset,
} from "./_base/schema.js";
