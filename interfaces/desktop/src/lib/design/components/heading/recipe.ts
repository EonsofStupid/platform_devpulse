/**
 * @file Heading Recipe
 * @kind heading
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Visual sizing handled by heading-root @utility + heading-{size} intent classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type HeadingRecipeProps = { size?: string };

export function headingRecipe(props: HeadingRecipeProps = {}): string {
	const sizeClass = `heading-${props.size ?? "md"}`;
	return cn("heading-root", sizeClass);
}
