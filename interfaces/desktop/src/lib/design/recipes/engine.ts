/**
 * @file Recipe Engine — The Resolution Core
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * ONE function: resolveRecipe(recipe, props) → per-slot class strings.
 *
 * This is the ONLY path from recipe data + props → rendered classes.
 * No hand-authored classes() functions. No separate useColdLight merge.
 *
 * For each slot:
 *   - visual: "all"  → structural + v-* segments + radius
 *   - visual: "none" → structural only (inherits visual from parent)
 *
 * v-* segments come from emitSegments() which reads TOKEN_CATEGORY_REGISTRY.
 * Add a category to the registry → it flows through here automatically.
 */

import { cn } from "$lib/design/utils/cn.js";
import { emitSegments, radiusClass } from "./utils.js";
import type { RecipeDefinition, DsSurfaceProps } from "./types.js";

/**
 * Resolve a recipe definition + surface props into per-slot class strings.
 *
 * This is the single authority. Components call this, get back a Record
 * of slot name → final CSS class string. No merging, no separate visual pass.
 *
 * @param recipe  — The data-driven recipe definition (from registry)
 * @param props   — Resolved DsSurfaceProps (8 axes + radius + size)
 * @returns Record<string, string> — slot name → CSS class string
 */
export function resolveRecipe(
	recipe: RecipeDefinition,
	props: DsSurfaceProps,
): Record<string, string> {
	// Resolve visual encoding once — shared across all "all" slots
	const visual = emitSegments(props);
	const radius = radiusClass(props.radius);

	const result: Record<string, string> = {};

	for (const [slotName, slotDef] of Object.entries(recipe.slots ?? {})) {
		if (slotDef.visual === "all") {
			// Root-level slot: structural + visual encoding + radius
			result[slotName] = cn(slotDef.structural, visual, radius);
		} else {
			// Child slot: structural only, inherits visual from parent
			result[slotName] = slotDef.structural;
		}
	}

	return result;
}

/**
 * Merge recipe defaults with incoming props.
 * Recipe defaults fill any unset axis. Incoming props override.
 *
 * @param recipe  — Recipe with defaults
 * @param partial — Partial props from component consumer
 * @returns Full DsSurfaceProps with all axes resolved
 */
export function mergeDefaults(
	recipe: RecipeDefinition,
	partial: Partial<DsSurfaceProps>,
): DsSurfaceProps {
	return {
		surface: partial.surface ?? (recipe.defaults.surface as DsSurfaceProps["surface"]) ?? "transparent",
		material: partial.material ?? (recipe.defaults.material as DsSurfaceProps["material"]) ?? "none",
		depth: partial.depth ?? (recipe.defaults.depth as DsSurfaceProps["depth"]) ?? "flat",
		bevel: partial.bevel ?? (recipe.defaults.bevel as DsSurfaceProps["bevel"]) ?? "flat",
		glow: partial.glow ?? (recipe.defaults.glow as DsSurfaceProps["glow"]) ?? "none",
		frame: partial.frame ?? (recipe.defaults.frame as DsSurfaceProps["frame"]) ?? "none",
		motion: partial.motion ?? (recipe.defaults.motion as DsSurfaceProps["motion"]) ?? "none",
		transition: partial.transition ?? (recipe.defaults.transition as DsSurfaceProps["transition"]) ?? "none",
		radius: partial.radius ?? (recipe.defaults.radius as DsSurfaceProps["radius"]) ?? "md",
		size: partial.size ?? (recipe.defaults.size as DsSurfaceProps["size"]) ?? "md",
	};
}
