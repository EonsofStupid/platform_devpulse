/**
 * @file Stat Recipe — Structural Classes Only
 * @kind stat
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type StatRecipeProps = { size?: string };

export function statRecipe(props: StatRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "p-3 text-sm",
		md: "p-4 text-sm",
		lg: "p-6 text-base",
	};
	return cn(
		"stat-root",
		sizeMap[props.size ?? "md"] ?? "p-4 text-sm",
	);
}
