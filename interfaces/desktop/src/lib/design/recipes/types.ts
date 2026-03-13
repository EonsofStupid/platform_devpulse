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
	// Size & Radius — recipe-level props (SSOT)
	SizeTokens,
	type SizeToken,
	SizeSchema,
	RadiusTokens,
	type RadiusToken,
	RadiusSchema,
	// Zod schemas
	DsSurfacePropsSchema,
	SlotVisualModeSchema,
	SlotDefinitionSchema,
	RecipeDefinitionSchema,
	// Functions
	toPreset,
	// Types
	type DsSurfaceProps,
	type SlotVisualMode,
	type SlotDefinition,
	type RecipeDefinition,
	type RecipeLegend,
} from "./_base/schema.js";
