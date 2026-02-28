/**
 * @file DropdownMenu Recipe
 * @kind compound
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural classes: dropdown-menu-content, dropdown-menu-item,
 *   dropdown-menu-separator, dropdown-menu-label
 */

import { cn } from "$lib/design/utils/cn.js";

type DropdownMenuRecipeProps = { size?: string };

export function dropdownMenuRecipe(props: DropdownMenuRecipeProps = {}) {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return {
		trigger: "",
		content: cn(
			"dropdown-menu-content",
			"v-void s-glass e-3",
			sizeMap[props.size ?? "md"] ?? sizeMap.md,
			"rounded-md",
		),
		item: cn("dropdown-menu-item"),
		separator: cn("dropdown-menu-separator"),
		label: cn("dropdown-menu-label"),
		group: "",
	};
}
