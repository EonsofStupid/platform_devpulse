/**
 * @file DateField Recipe
 * @kind compound
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural classes: date-field-root, date-field-segment, date-field-literal
 */

import { cn } from "$lib/design/utils/cn.js";

type DateFieldRecipeProps = { size?: string };

export function dateFieldRecipe(props: DateFieldRecipeProps = {}) {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return {
		root: cn(
			"date-field-root",
			"v-s1",
			sizeMap[props.size ?? "md"] ?? sizeMap.md,
			"rounded-md",
		),
		segment: cn("date-field-segment"),
		literal: cn("date-field-literal"),
	};
}
