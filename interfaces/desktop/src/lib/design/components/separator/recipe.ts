/**
 * @file Separator Recipe
 * @kind separator
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

type SeparatorRecipeProps = { orientation?: string; variant?: string };

export function separatorRecipe(props: SeparatorRecipeProps = {}): string {
	const isVertical = props.orientation === "vertical";
	return cn(
		"shrink-0 bg-[oklch(1_0_0/0.06)]",
		isVertical ? "h-full w-px" : "h-px w-full",
	);
}
