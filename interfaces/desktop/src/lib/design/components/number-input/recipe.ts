/**
 * @file NumberInput Recipe
 * @kind number-input
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by number-input-* @utility classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type NumberInputRecipeProps = { size?: string };

export function numberInputRecipe(props: NumberInputRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "number-input-sm",
		md: "number-input-md",
		lg: "number-input-lg",
	};
	return cn(
		"number-input-root",
		"v-void s-glass e-0",
		sizeMap[props.size ?? "md"] ?? "number-input-md",
		"rounded-md",
	);
}

export function numberInputInputRecipe(props: NumberInputRecipeProps = {}): string {
	return cn("number-input-field");
}

export function numberInputButtonRecipe(props: NumberInputRecipeProps = {}): string {
	return cn("number-input-button");
}
