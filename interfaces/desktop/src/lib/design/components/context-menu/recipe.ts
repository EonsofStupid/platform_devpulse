/**
 * @file ContextMenu Recipe — Structural Classes Only
 * @kind compound
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type ContextMenuRecipeProps = { size?: string };

export function contextMenuRecipe(props: ContextMenuRecipeProps = {}) {
	const sizeMap: Record<string, string> = {
		sm: "p-3 text-sm",
		md: "p-4 text-sm",
		lg: "p-6 text-base",
	};
	return {
		trigger: "",
		content: cn(
			"context-menu-content",
			sizeMap[props.size ?? "md"] ?? sizeMap.md,
			"rounded-md",
		),
		item: cn("context-menu-item"),
		separator: cn("context-menu-separator"),
		label: cn("context-menu-label"),
	};
}
