/**
 * @file ContextMenu Recipe
 * @kind compound
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural classes: context-menu-content, context-menu-item,
 *   context-menu-separator, context-menu-label
 */

import { cn } from "$lib/design/utils/cn.js";

type ContextMenuRecipeProps = { size?: string };

export function contextMenuRecipe(props: ContextMenuRecipeProps = {}) {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return {
		trigger: "",
		content: cn(
			"context-menu-content",
			"v-void s-glass e-3",
			sizeMap[props.size ?? "md"] ?? sizeMap.md,
			"rounded-md",
		),
		item: cn("context-menu-item"),
		separator: cn("context-menu-separator"),
		label: cn("context-menu-label"),
	};
}
