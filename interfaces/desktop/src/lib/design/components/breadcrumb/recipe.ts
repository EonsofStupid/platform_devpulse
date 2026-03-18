/**
 * @file Breadcrumb Recipe — Structural Classes Only
 * @kind navigation
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type BreadcrumbRecipeProps = { size?: string };

export function breadcrumbRecipe(props: BreadcrumbRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "text-xs",
		md: "text-xs",
		lg: "text-sm",
	};
	return cn("breadcrumb", sizeMap[props.size ?? "md"] ?? sizeMap.md);
}
