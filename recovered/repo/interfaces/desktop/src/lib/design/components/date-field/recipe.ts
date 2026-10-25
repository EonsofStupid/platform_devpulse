/**
 * @file DateField Recipe — Structural Classes Only
 * @kind compound
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type DateFieldRecipeProps = { size?: string };

export function dateFieldRecipe(props: DateFieldRecipeProps = {}) {
	const sizeMap: Record<string, string> = {
		sm: "h-8 px-3 text-sm",
		md: "h-10 px-4 text-sm",
		lg: "h-12 px-6 text-base",
	};
	return {
		root: cn("date-field-root", sizeMap[props.size ?? "md"] ?? sizeMap.md, "rounded-md"),
		segment: cn("date-field-segment"),
		literal: cn("date-field-literal"),
	};
}
