/**
 * @file Textarea Recipe
 * @kind textarea
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by textarea-root @utility + textarea-{size} intent classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type TextareaRecipeProps = { size?: string };

export function textareaRecipe(props: TextareaRecipeProps = {}): string {
	const sizeClass = `textarea-${props.size ?? "md"}`;
	return cn(
		"textarea-root",
		"v-s1",
		sizeClass,
		"rounded-md",
	);
}
