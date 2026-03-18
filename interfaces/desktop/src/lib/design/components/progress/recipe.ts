/**
 * @file Progress Recipe — Structural Classes Only
 * @kind progress
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type ProgressRecipeProps = { size?: string };

export function progressTrackRecipe(props: ProgressRecipeProps = {}): string {
	const size = props.size ?? "md";
	const heightMap: Record<string, string> = {
		sm: "h-1.5",
		md: "h-2",
		lg: "h-3",
	};
	return cn("progress-track", heightMap[size] ?? heightMap.md, "rounded-full");
}

export function progressIndicatorRecipe(): string {
	return "progress-indicator";
}
