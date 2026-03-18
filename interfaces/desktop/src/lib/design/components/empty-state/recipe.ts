/**
 * @file EmptyState Recipe
 * @kind empty-state
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural class: empty-state-root
 * Size intent classes: empty-state-{size}
 */

import { cn } from "$lib/design/utils/cn.js";

type EmptyStateRecipeProps = { size?: string };

export function emptyStateRecipe(props: EmptyStateRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "empty-state-sm",
		md: "empty-state-md",
		lg: "empty-state-lg",
	};
	return cn("empty-state-root", sizeMap[props.size ?? "md"] ?? sizeMap.md);
}
