/**
 * @file Label Recipe
 * @kind label
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by label-root @utility. Size via sz-* shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type LabelRecipeProps = { size?: string };

export function labelRecipe(props: LabelRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn("label-root", sizeMap[props.size ?? "md"] ?? "sz-md");
}
