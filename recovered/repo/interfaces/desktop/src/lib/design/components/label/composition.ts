/**
 * @file Label Composition — Structural Classes Only
 * @kind label
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type LabelRecipeProps = { size?: string };

export function labelComposition(props: LabelRecipeProps = {}): string {
	const sizeMap: Record<string, string> = {
		sm: "text-xs",
		md: "text-sm",
		lg: "text-base",
	};
	return cn("label-root", sizeMap[props.size ?? "md"] ?? "text-sm");
}
