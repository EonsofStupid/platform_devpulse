/**
 * @file Toolbar Composition — Structural Classes Only
 * @kind toolbar
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type ToolbarRecipeProps = { size?: string; orientation?: string };

export function toolbarComposition(props: ToolbarRecipeProps = {}): string {
	const orientationClass =
		props.orientation === "vertical" ? "toolbar-vertical" : "toolbar-horizontal";
	return cn("toolbar-root", orientationClass, "rounded-md");
}
