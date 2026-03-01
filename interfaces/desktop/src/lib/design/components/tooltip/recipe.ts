/**
 * @file Tooltip Recipe
 * @kind tooltip
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by tooltip-content / tooltip-arrow @utility classes.
 */

import { cn } from "$lib/design/utils/cn.js";

export function tooltipRecipe() {
	return {
		trigger: "",
		content: cn(
			"tooltip-content",
			"v-s1 v-d2",
			"rounded-md",
		),
		arrow: "tooltip-arrow",
	};
}
