/**
 * @file Spinner Recipe
 * @kind spinner
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

type SpinnerRecipeProps = { size?: string };

export function spinnerRecipe(props: SpinnerRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "h-4 w-4",
		md: "h-6 w-6",
		lg: "h-8 w-8",
	};
	return cn(
		"animate-spin",
		"text-[var(--recipe-accent,var(--color-teal-500))]",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
