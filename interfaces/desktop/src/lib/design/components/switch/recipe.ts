/**
 * @file Switch Recipe
 * @kind switch
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by switch-root / switch-thumb @utility + switch-{size} intent classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type SwitchRecipeProps = { size?: string };
type SwitchThumbRecipeProps = { size?: string; checked?: boolean };

export function switchRecipe(props: SwitchRecipeProps = {}): string {
	const sizeClass = `switch-${props.size ?? "md"}`;
	return cn("switch-root", sizeClass, "rounded-full");
}

export function switchThumbRecipe(props: SwitchThumbRecipeProps = {}): string {
	const sizeClass = `switch-${props.size ?? "md"}`;
	return cn("switch-thumb", sizeClass);
}
