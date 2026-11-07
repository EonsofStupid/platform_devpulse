/**
 * @file Select Composition — Structural Classes Only
 * @kind select
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

export function selectComposition() {
	return {
		trigger: cn("select-trigger", "rounded-md"),
		content: cn("select-content", "rounded-md"),
		item: "select-item",
		group: "select-group",
		label: "select-label",
	};
}
