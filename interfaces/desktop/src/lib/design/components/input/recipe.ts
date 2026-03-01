/**
 * @file Input Recipe
 * @kind input
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by input-root @utility. Size via sz-* shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type InputRecipeProps = { size?: string };

export function inputRecipe(props: InputRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn(
		"input-root",
		"v-s1",
		sizeMap[props.size ?? "md"] ?? "sz-md",
		"rounded-md",
	);
}
