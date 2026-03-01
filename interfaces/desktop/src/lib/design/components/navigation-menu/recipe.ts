/**
 * @file NavigationMenu Recipe
 * @kind navigation-menu
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by navmenu-* @utility classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type NavigationMenuRecipeProps = { size?: string };

export function navigationMenuRecipe(props: NavigationMenuRecipeProps = {}) {
	return {
		root: cn("navmenu-root"),
		list: cn("navmenu-list"),
		item: cn("navmenu-item"),
		trigger: cn("navmenu-trigger"),
		content: cn("navmenu-content", "v-s1 v-d3", "rounded-md"),
		link: cn("navmenu-link"),
	};
}
