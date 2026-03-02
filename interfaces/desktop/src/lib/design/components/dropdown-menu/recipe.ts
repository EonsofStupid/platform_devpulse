/**
 * @file DropdownMenu Recipe — Structural Classes Only
 * @kind compound
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type DropdownMenuRecipeProps = { size?: string };

export function dropdownMenuRecipe(props: DropdownMenuRecipeProps = {}) {
	const sizeMap: Record<string, string> = {
		sm: "p-3 text-sm",
		md: "p-4 text-sm",
		lg: "p-6 text-base",
	};
	return {
		trigger: "",
		content: cn(
			"dropdown-menu-content",
			sizeMap[props.size ?? "md"] ?? sizeMap.md,
			"rounded-md",
		),
		item: cn("dropdown-menu-item"),
		separator: cn("dropdown-menu-separator"),
		label: cn("dropdown-menu-label"),
		group: "",
	};
}
