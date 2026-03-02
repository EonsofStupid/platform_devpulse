/**
 * @file Kbd Recipe — Structural Classes Only
 * @kind kbd
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type KbdRecipeProps = { size?: string };

export function kbdRecipe(props: KbdRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};
	return cn("kbd-root", sizeMap[props.size ?? "md"] ?? "text-sm");
}
