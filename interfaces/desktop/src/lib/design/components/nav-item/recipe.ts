/**
 * @file NavItem Recipe — Structural Classes Only
 * @kind nav-item
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type NavItemRecipeProps = { size?: string };

export function navItemRecipe(props: NavItemRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "h-8 px-3 text-sm",
		md: "h-10 px-4 text-sm",
		lg: "h-12 px-6 text-base",
	};
	return cn("nav-item-root", sizeMap[props.size ?? "md"] ?? "h-10 px-4 text-sm", "rounded-md");
}
