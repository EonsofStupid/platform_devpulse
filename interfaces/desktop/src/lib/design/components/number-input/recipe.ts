/**
 * @file NumberInput Recipe — Structural Classes Only
 * @kind number-input
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
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
