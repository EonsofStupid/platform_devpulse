/**
 * @file Menubar Composition — Structural Classes Only
 * @kind menubar
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type MenubarRecipeProps = { size?: string };

export function menubarComposition(_props: MenubarRecipeProps = {}) {
	return {
		root: cn("menubar-root", "rounded-md"),
		trigger: cn("menubar-trigger"),
		content: cn("menubar-content", "rounded-md"),
		item: cn("menubar-item"),
		separator: cn("menubar-separator"),
	};
}
