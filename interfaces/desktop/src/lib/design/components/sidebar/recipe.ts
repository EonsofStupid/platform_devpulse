/**
 * @file Sidebar Recipe
 * @kind sidebar
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

type SidebarRecipeProps = { size?: string; expanded?: boolean };

export function sidebarRecipe(props: SidebarRecipeProps = {}): string {
	return cn(
		"flex h-full flex-col",
		"v-void s-glass e-1",
		"border-r border-[oklch(1_0_0/0.06)]",
		"transition-[width] duration-200",
		props.expanded === false ? "w-16" : "w-64",
	);
}
