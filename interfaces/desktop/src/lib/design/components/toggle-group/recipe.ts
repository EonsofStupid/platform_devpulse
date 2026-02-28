/**
 * @file ToggleGroup Recipe
 * @kind toggle-group
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by toggle-group-root / toggle-group-item @utility classes
 * + orientation and size intent classes.
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
		"v-void s-glass e-0",
		orientationClass,
		"rounded-md",
	);
}

export function toggleGroupItemRecipe(props: ToggleGroupItemRecipeProps = {}): string {
	const sizeClass = `toggle-group-item-${props.size ?? "md"}`;
	return cn("toggle-group-item", sizeClass, "rounded-sm");
}
