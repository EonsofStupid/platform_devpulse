/**
 * @file Tooltip Composition — Structural Classes Only
 * @kind tooltip
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

export function tooltipComposition() {
	return {
		trigger: "",
		content: cn("tooltip-content", "rounded-md"),
		arrow: "tooltip-arrow",
	};
}
