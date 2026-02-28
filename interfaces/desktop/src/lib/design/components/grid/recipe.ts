/**
 * @file Grid Recipe
 * @kind grid
 * @layer components
 *
 * Props → standard Tailwind v4 utility classes.
 * All classes resolve via @theme token mappings.
 */

import { cn } from "$lib/design/utils/cn.js";

type GridRecipeProps = { columns?: number | string; gap?: string; rows?: number | string };

export function gridRecipe(props: GridRecipeProps = {}): string {
	const cols = props.columns ? `grid-cols-${props.columns}` : "";
	const rows = props.rows ? `grid-rows-${props.rows}` : "";
	const gap = props.gap ? `gap-${props.gap}` : "gap-4";
	return cn("grid", cols, rows, gap);
}
