/**
 * @file Spinner Recipe — Structural Classes Only
 * @kind spinner
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type SpinnerRecipeProps = { size?: string };

export function spinnerRecipe(props: SpinnerRecipeProps = {}): string {
	const size = props.size ?? "md";
	const sizeMap: Record<string, string> = {
		sm: "size-4",
		md: "size-6",
		lg: "size-8",
	};
	return cn(
		"spinner-root",
		sizeMap[size] ?? sizeMap.md,
	);
}
