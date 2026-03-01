/**
 * @file Recipe Types — Registry-Driven
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * DsSurfaceProps = Preset (8 semantic category IDs) + radius + size.
 * Zod schemas validate at system boundaries (VPB, API, persistence).
 * TypeScript types inferred from schemas — single source of truth.
 */

import { z } from "zod";
import { RadiusSchema, SizeSchema } from "$lib/design/tokens/schema.js";
import {
	PresetSchema,
	type Preset,
} from "$lib/design/registry/token-categories.js";

// =============================================================================
// DsSurfaceProps — Registry-Driven (Preset + structural)
// =============================================================================

/**
 * Zod schema for surface props.
 * 8 semantic category IDs (surface, material, depth, bevel, glow, frame, motion, transition)
 * + structural props (radius, size).
 */
export const DsSurfacePropsSchema = PresetSchema.extend({
	radius: RadiusSchema,
	size: SizeSchema,
});

/** Surface props: 8 semantic categories + radius + size. */
export type DsSurfaceProps = z.infer<typeof DsSurfacePropsSchema>;

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
// RecipeDefinition — Zod schema + inferred type
// =============================================================================

/**
 * Zod schema for recipe registration.
 * Validates id format (kind.name.variant), kind, label,
 * defaults (partial DsSurfaceProps), and classes function.
 */
export const RecipeDefinitionSchema = z.object({
	id: z.string().regex(/^[a-z][\w-]*\.[a-z][\w-]*\.[a-z][\w-]*$/, {
		message: "Recipe ID must be dot-separated: kind.name.variant",
	}),
	kind: z.string().min(1),
	label: z.string().min(1),
	defaults: DsSurfacePropsSchema.partial(),
	classes: z.custom<(props: DsSurfaceProps) => Record<string, string>>(
		(val) => typeof val === "function",
		{ message: "classes must be a function (props) => Record<string, string>" },
	),
});

/** A recipe: props in, per-slot CSS class strings out. */
export type RecipeDefinition = z.infer<typeof RecipeDefinitionSchema>;

// =============================================================================
// RecipeLegend — Per-kind manifest of available recipe variants
// =============================================================================

/** Per-kind manifest of available recipe variants. */
export interface RecipeLegend {
	readonly kind: string;
	readonly defaultId: string;
	readonly ids: readonly string[];
}
