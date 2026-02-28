/**
 * @file Table Recipe
 * @kind table
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by table-root @utility. Size via sz-* shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type TableRecipeProps = { size?: string; variant?: string };

export function tableRecipe(props: TableRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn(
		"table-root",
		sizeMap[props.size ?? "md"] ?? "sz-md",
	);
}
