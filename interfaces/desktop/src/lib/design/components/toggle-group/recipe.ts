/**
 * @file ToggleGroup Recipe — Structural Classes Only
 * @kind toggle-group
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type ToggleGroupRecipeProps = { size?: string; orientation?: string };
type ToggleGroupItemRecipeProps = { size?: string };

export function toggleGroupRecipe(props: ToggleGroupRecipeProps = {}): string {
	const orientationClass = props.orientation === "vertical"
		? "toggle-group-vertical"
		: "toggle-group-horizontal";
	return cn(
		"toggle-group-root",
		orientationClass,
		"rounded-md",
	);
}

export function toggleGroupItemRecipe(props: ToggleGroupItemRecipeProps = {}): string {
	const sizeClass = `toggle-group-item-${props.size ?? "md"}`;
	return cn("toggle-group-item", sizeClass, "rounded-sm");
}
