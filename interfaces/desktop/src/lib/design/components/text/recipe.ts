/**
 * @file Text Recipe
 * @kind text
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Visual styling handled by text-root @utility + text-size-*, text-weight-*, text-color-* intent classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type TextRecipeProps = { size?: string; weight?: string; color?: string };

export function textRecipe(props: TextRecipeProps = {}): string {
	const sizeClass = `text-size-${props.size ?? "md"}`;
	const weightClass = `text-weight-${props.weight ?? "normal"}`;
	const colorClass = `text-color-${props.color ?? "primary"}`;
	return cn("text-root", sizeClass, weightClass, colorClass);
}
