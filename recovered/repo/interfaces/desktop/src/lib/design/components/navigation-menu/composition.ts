/**
 * @file NavigationMenu Composition — Structural Classes Only
 * @kind navigation-menu
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type NavigationMenuRecipeProps = { size?: string };

export function navigationMenuComposition(_props: NavigationMenuRecipeProps = {}) {
	return {
		root: cn("navmenu-root"),
		list: cn("navmenu-list"),
		item: cn("navmenu-item"),
		trigger: cn("navmenu-trigger"),
		content: cn("navmenu-content", "rounded-md"),
		link: cn("navmenu-link"),
	};
}
