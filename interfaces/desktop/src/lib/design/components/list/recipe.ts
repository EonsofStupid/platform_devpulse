/**
 * @file List Recipe
 * @kind list
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by list-root @utility + list-spacing-* classes. Size via sz-*.
 */

import { cn } from "$lib/design/utils/cn.js";

type ListRecipeProps = { size?: string; variant?: string; spacing?: string };

export function listRecipe(props: ListRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	const spacingMap: Record<string, string> = {
		compact: "list-spacing-compact",
		default: "list-spacing-default",
		relaxed: "list-spacing-relaxed",
	};
	return cn(
		"list-root",
		sizeMap[props.size ?? "md"] ?? "sz-md",
		spacingMap[props.spacing ?? "default"] ?? "list-spacing-default",
	);
}
