/**
 * @file Slider Recipe
 * @kind slider
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

export function sliderRecipe() {
	return {
		root: "relative flex w-full touch-none select-none items-center",
		track: cn(
			"relative h-2 w-full grow overflow-hidden rounded-full",
			"bg-[oklch(1_0_0/0.06)]",
		),
		range: cn(
			"absolute h-full rounded-full",
			"bg-[var(--recipe-accent,var(--color-teal-500))]",
		),
		thumb: cn(
			"block h-5 w-5 rounded-full",
			"bg-[var(--text-primary)]",
			"border-2 border-[var(--recipe-accent,var(--color-teal-500))]",
			"focus-visible:outline-none focus-visible:ring-2",
			"transition-colors",
		),
	};
}
