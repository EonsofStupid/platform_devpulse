/**
 * @file Toolbar Recipe
 * @kind toolbar
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by toolbar-root @utility + toolbar-horizontal / toolbar-vertical intent classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type ToolbarRecipeProps = { size?: string; orientation?: string };

export function toolbarRecipe(props: ToolbarRecipeProps = {}): string {
	const orientationClass = props.orientation === "vertical"
		? "toolbar-vertical"
		: "toolbar-horizontal";
	return cn(
		"toolbar-root",
		"v-s1 v-d1",
		orientationClass,
		"rounded-md",
	);
}
