/**
 * @file Menubar Recipe
 * @kind menubar
 * @layer components
 *
 * Shortcode composition — structural + shortcode classes only.
 * Layout handled by menubar-* @utility classes.
 */

import { cn } from "$lib/design/utils/cn.js";

type MenubarRecipeProps = { size?: string };

export function menubarRecipe(props: MenubarRecipeProps = {}) {
	return {
		root: cn("menubar-root", "v-void s-glass e-1", "rounded-md"),
		trigger: cn("menubar-trigger"),
		content: cn("menubar-content", "v-void s-glass e-3", "rounded-md"),
		item: cn("menubar-item"),
		separator: cn("menubar-separator"),
	};
}
