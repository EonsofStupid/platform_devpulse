/**
 * @file Toggle Recipe
 * @kind toggle
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by toggle-root @utility + toggle-{size} intent classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type ToggleRecipeProps = { size?: string };

export function toggleRecipe(props: ToggleRecipeProps = {}): string {
	const sizeClass = `toggle-${props.size ?? "md"}`;
	return cn("toggle-root", sizeClass, "rounded-md");
}
