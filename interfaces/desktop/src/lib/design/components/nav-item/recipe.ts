/**
 * @file NavItem Recipe
 * @kind nav-item
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by nav-item-root @utility. Size via sz-* shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type NavItemRecipeProps = { size?: string };

export function navItemRecipe(props: NavItemRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "sz-sm",
		md: "sz-md",
		lg: "sz-lg",
	};
	return cn("nav-item-root", sizeMap[props.size ?? "md"] ?? "sz-md", "rounded-md");
}
