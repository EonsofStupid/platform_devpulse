/**
 * @file Grid Recipe
 * @kind grid
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by grid-root @utility + grid-cols-* / grid-rows-* / grid-gap-* classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type GridRecipeProps = { columns?: number | string; gap?: string; rows?: number | string };

export function gridRecipe(props: GridRecipeProps = {}): string {
	const cols = props.columns ? `grid-cols-${props.columns}` : "";
	const rows = props.rows ? `grid-rows-${props.rows}` : "";
	const gap = `grid-gap-${props.gap ?? "4"}`;
	return cn("grid-root", cols, rows, gap);
}
