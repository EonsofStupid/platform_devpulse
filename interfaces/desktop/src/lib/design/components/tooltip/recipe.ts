/**
 * @file Tooltip Recipe — Structural Classes Only
 * @kind tooltip
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

export function tooltipRecipe() {
	return {
		trigger: "",
		content: cn(
			"tooltip-content",
			"rounded-md",
		),
		arrow: "tooltip-arrow",
	};
}
