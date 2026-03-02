/**
 * @file DescriptionList Recipe — Structural Classes Only
 * @kind visual
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type DescriptionListRecipeProps = { size?: string; variant?: string };

export function descriptionListRecipe(props: DescriptionListRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "p-3 text-sm",
		md: "p-4 text-sm",
		lg: "p-6 text-base",
	};
	return cn(
		"description-list-root",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
