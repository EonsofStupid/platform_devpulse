/**
 * @file Sidebar Recipe — Shortcode Composition
 * @kind sidebar
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural classes (sidebar-*) handle layout/positioning.
 * Root receives v-* s-* e-* for glass surface treatment.
 * Expanded/collapsed state via sidebar-expanded / sidebar-collapsed.
 */

import { cn } from "$lib/design/utils/cn.js";

type SidebarRecipeProps = { size?: string; expanded?: boolean };

export function sidebarRecipe(props: SidebarRecipeProps = {}): string {
	return cn(
		"sidebar-root",
		"v-void s-glass e-1",
		props.expanded === false ? "sidebar-collapsed" : "sidebar-expanded",
	);
}
