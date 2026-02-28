/**
 * @file DescriptionList Recipe
 * @kind visual
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural class: description-list-root
 * Size controlled by sz-* shortcode classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type DescriptionListRecipeProps = { size?: string; variant?: string };

export function descriptionListRecipe(props: DescriptionListRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn(
		"description-list-root",
		sizeMap[props.size ?? "md"] ?? sizeMap.md,
	);
}
