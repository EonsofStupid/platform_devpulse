/**
 * @file DataTable Recipe
 * @kind visual
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural class: data-table-root
 * Size controlled by sz-* shortcode classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type DataTableRecipeProps = { size?: string; variant?: string };

export function dataTableRecipe(props: DataTableRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn(
		"data-table-root",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
