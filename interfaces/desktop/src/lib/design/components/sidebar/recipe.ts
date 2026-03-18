/**
 * @file Sidebar Recipe — Structural Classes Only
 * @kind sidebar
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type SidebarRecipeProps = { size?: string; expanded?: boolean };

export function sidebarRecipe(props: SidebarRecipeProps = {}): string {
	return cn("sidebar-root", props.expanded === false ? "sidebar-collapsed" : "sidebar-expanded");
}
