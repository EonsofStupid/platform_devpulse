/**
 * @file Stat Recipe
 * @kind stat
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by stat-root @utility. Size via sz-* shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type StatRecipeProps = { size?: string };

export function statRecipe(props: StatRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn(
		"stat-root",
		sizeMap[props.size ?? "md"] ?? "sz-md",
	);
}
