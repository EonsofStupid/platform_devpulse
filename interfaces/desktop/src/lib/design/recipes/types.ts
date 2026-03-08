/**
 * @file Recipe Types — Schema-Driven Foundation
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * EVERY recipe is DATA, not a function.
 * EVERY recipe is Zod-validated at registration.
 * EVERY slot declares its structural classes AND whether it receives visual encoding.
 * The engine (engine.ts) resolves data + props → final per-slot class strings.
 *
 * DsSurfaceProps = Preset (8 semantic category IDs) + radius + size.
 * Preset derives from TOKEN_CATEGORY_REGISTRY — add a category there, it appears here.
 */

import { z } from "zod";
import { RadiusSchema, SizeSchema } from "$lib/design/tokens/schema.js";
import type { RadiusToken, SizeToken } from "$lib/design/tokens/types.js";
import {
	PresetSchema,
	type Preset,
} from "$lib/design/registry/token-categories.js";

// =============================================================================
// DsSurfaceProps — Registry-Driven (Preset + structural)
// =============================================================================

export const DsSurfacePropsSchema = PresetSchema.extend({
	radius: RadiusSchema,
	size: SizeSchema,
});

export interface DsSurfaceProps extends Preset {
	radius: RadiusToken;
	size: SizeToken;
}

/** Extract just the Preset portion (encoding categories only). */
export function toPreset(props: DsSurfaceProps): Preset {
	return {
		surface: props.surface,
		material: props.material,
		depth: props.depth,
		bevel: props.bevel,
		glow: props.glow,
		frame: props.frame,
		motion: props.motion,
		transition: props.transition,
	};
}

// =============================================================================
// SlotDefinition — Per-slot contract
// =============================================================================

/**
 * How a slot receives visual encoding from the 8-axis system.
 *
 * - "all"   — Full v-* encoding + radius applied (root slots)
 * - "none"  — Structural only, inherits visual from parent (child slots)
 */
const SlotVisualMode = z.enum(["all", "none"]);
export type SlotVisualMode = z.infer<typeof SlotVisualMode>;

/**
 * Per-slot declaration. Pure data.
 * structural = Tailwind layout/spacing/typography classes.
 * visual     = Whether this slot receives v-* encoding from the engine.
 */
export const SlotDefinitionSchema = z.object({
	structural: z.string(),
	visual: SlotVisualMode,
});

export type SlotDefinition = z.infer<typeof SlotDefinitionSchema>;

// =============================================================================
// RecipeDefinition — Data-driven, Zod-validated
// =============================================================================

/**
 * A recipe is DATA. Not a function.
 *
 * - id:       "kind.name.variant" (dot-separated, validated)
 * - kind:     Which component kind this recipe serves
 * - label:    Human-readable name
 * - defaults: Default axis values (partial DsSurfaceProps)
 * - slots:    Per-slot structural + visual declarations
 *
 * The engine (resolveRecipe) combines slot declarations + resolved props
 * to produce final per-slot class strings. No hand-authored classes() function.
 */
export const RecipeDefinitionSchema = z.object({
	id: z.string().regex(/^[a-z][\w-]*\.[a-z][\w-]*\.[a-z][\w-]*$/, {
		message: "Recipe ID must be dot-separated: kind.name.variant",
	}),
	kind: z.string().min(1),
	label: z.string().min(1),
	defaults: DsSurfacePropsSchema.partial(),
	slots: z.record(z.string(), SlotDefinitionSchema),
});

export type RecipeDefinition = z.infer<typeof RecipeDefinitionSchema>;

// =============================================================================
// RecipeLegend — Per-kind manifest of available recipe variants
// =============================================================================

export interface RecipeLegend {
	readonly kind: string;
	readonly defaultId: string;
	readonly ids: readonly string[];
}
