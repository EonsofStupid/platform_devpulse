/**
 * @file Callout Recipe — Structural Classes Only
 * @kind visual
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type CalloutRecipeProps = { variant?: string };

export function calloutRecipe(props: CalloutRecipeProps = {}): string {
	const variantMap: Record<string, string> = {
		default: "callout-default",
		info: "callout-info",
		warning: "callout-warning",
		error: "callout-error",
	};
	return cn("callout", "p-4 text-sm", variantMap[props.variant ?? "default"] ?? variantMap.default);
}
