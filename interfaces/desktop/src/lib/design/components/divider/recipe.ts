/**
 * @file Divider Recipe
 * @kind visual
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural classes: divider-horizontal, divider-vertical
 */

import { cn } from "$lib/design/utils/cn.js";

type DividerRecipeProps = { orientation?: string; variant?: string };

export function dividerRecipe(props: DividerRecipeProps = {}): string {
	const isVertical = props.orientation === "vertical";
	return cn(
		isVertical ? "divider-vertical" : "divider-horizontal",
	);
}
