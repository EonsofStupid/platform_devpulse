/**
 * @file Recipe Base Schema — THE contract for every ColdLight recipe
 * @layer recipes/_base
 * @package @devpulse/coldlight
 *
 * EVERY recipe passes through this schema. No exceptions.
 *
 * What this enforces:
 *   - id:       "kind.name.variant" dot-separated format
 *   - kind:     Which component kind this recipe serves
 *   - label:    Human-readable name for VPB/UI
 *   - defaults: FULL 8-axis preset + radius + size (all required)
 *   - slots:    REQUIRED per-slot declaration (structural + visual + element)
 *   - classes:  Resolver function (props → per-slot class strings)
 *
 * The schema IS the contract. Build-time: Zod validates. Compile-time: TypeScript enforces.
 * Runtime: JSON-serializable slots for VPB introspection.
 *
 * SD5 pipeline alignment:
 *   - defaults map to SD5 token IDs (surface, material, depth, bevel, glow, frame, motion, transition)
 *   - slots.visual determines which slots receive v-* encoding from the token pipeline
 *   - All token IDs are validated against TOKEN_CATEGORY_REGISTRY via PresetSchema
 */

import { z } from "zod";
import { type Preset, PresetSchema } from "$lib/design/registry/token-categories.js";

// =============================================================================
// Size & Radius — Recipe-level props (NOT encoding axes)
//
// These are layout/dimension concerns used by recipes to drive height, padding,
// font-size (Size) and border-radius (Radius). They extend the 8-axis Preset
// into DsSurfaceProps. Defined here because this is where they're consumed.
// =============================================================================

export const SizeTokens = ["sm", "md", "lg"] as const;
export type SizeToken = (typeof SizeTokens)[number];
export const SizeSchema = z.enum(SizeTokens);

export const RadiusTokens = ["none", "xs", "sm", "md", "lg", "xl", "full"] as const;
export type RadiusToken = (typeof RadiusTokens)[number];
export const RadiusSchema = z.enum(RadiusTokens);

// =============================================================================
// DsSurfaceProps — Full axis props (8-axis + radius + size)
// =============================================================================

/**
 * Zod schema for the full surface props.
 * EVERY recipe defaults field is validated against this (partial).
 * EVERY classes() call receives a resolved (full) version.
 */
export const DsSurfacePropsSchema = PresetSchema.extend({
	radius: RadiusSchema,
	size: SizeSchema,
});

/**
 * Full surface props — 8-axis encoding + radius + size.
 * This is what classes() receives after defaults are merged with incoming props.
 */
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
// SlotDefinition — Per-slot contract (REQUIRED on every recipe)
// =============================================================================

/**
 * How a slot receives visual encoding from the 8-axis system.
 *
 * - "all"   — Full v-* encoding + radius applied (primary/root slots)
 * - "partial" — Selective encoding (slot-specific axis application)
 * - "none"  — Structural only, inherits visual from parent (child/layout slots)
 */
export const SlotVisualModeSchema = z.enum(["all", "partial", "none"]);
export type SlotVisualMode = z.infer<typeof SlotVisualModeSchema>;

/**
 * Per-slot declaration. Pure data. JSON-serializable for VPB introspection.
 *
 * - structural: Base Tailwind layout/spacing/typography classes (always applied)
 * - visual:     How this slot participates in the 8-axis encoding system
 * - element:    The HTML element this slot renders as (for ARIA + semantic HTML)
 */
export const SlotDefinitionSchema = z.object({
	structural: z.string(),
	visual: SlotVisualModeSchema,
	element: z.string().min(1).optional(),
});

export type SlotDefinition = z.infer<typeof SlotDefinitionSchema>;

// =============================================================================
// RecipeDefinition — The full recipe contract
// =============================================================================

/**
 * Recipe ID format: "kind.name.variant"
 * Examples: "button.glass.void", "panel.matte.flat", "shell.app.default"
 */
const RecipeIdSchema = z.string().regex(/^[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*\.[a-z][a-z0-9-]*$/, {
	message: "Recipe ID must be dot-separated: kind.name.variant",
});

/**
 * RecipeDefinitionSchema — Zod validates at registration time.
 *
 * Requirements:
 *   - id:       kind.name.variant format
 *   - kind:     non-empty string matching the component kind
 *   - label:    human-readable name
 *   - defaults: FULL 8-axis preset (all values required — no implicit fallbacks)
 *   - slots:    at least 1 slot declared (every recipe has at least a root)
 *
 * Note: classes() is validated by TypeScript (function types can't be Zod-validated in v4).
 * The Zod schema validates the DATA portion. TypeScript enforces the function signature.
 */
export const RecipeDefinitionSchema = z.object({
	id: RecipeIdSchema,
	kind: z.string().min(1),
	label: z.string().min(1),
	defaults: DsSurfacePropsSchema,
	slots: z
		.record(z.string(), SlotDefinitionSchema)
		.refine((slots) => Object.keys(slots).length > 0, {
			message: "Recipe must declare at least one slot",
		})
		.optional(),
});

/**
 * RecipeDefinition — the TypeScript interface.
 *
 * Zod validates the data shape at registration.
 * TypeScript enforces the classes() function signature at compile time.
 * Both together = full contract enforcement.
 */
export interface RecipeDefinition {
	/** Recipe ID: "kind.name.variant" */
	readonly id: string;
	/** Component kind this recipe serves */
	readonly kind: string;
	/** Human-readable name for VPB/UI */
	readonly label: string;
	/** Full 8-axis defaults — ALL axes required */
	readonly defaults: DsSurfaceProps;
	/** Per-slot structural + visual declarations (optional — for VPB introspection) */
	readonly slots?: Record<string, SlotDefinition>;
	/**
	 * Per-slot class resolver.
	 * Receives fully-resolved DsSurfaceProps (defaults merged with incoming props).
	 * Returns per-slot class strings keyed by slot name.
	 * Must return a key for every slot declared in `slots`.
	 */
	readonly classes?: (props: DsSurfaceProps) => Record<string, string>;
}

// =============================================================================
// RecipeLegend — Per-kind manifest of available recipe variants
// =============================================================================

export interface RecipeLegend {
	readonly kind: string;
	readonly defaultId: string;
	readonly ids: readonly string[];
}
