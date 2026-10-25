/**
 * @file Prose Composition — Structural Classes Only
 * @kind prose
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type ProseRecipeProps = { size?: string };

export function proseComposition(props: ProseRecipeProps = {}): string {
	const size = props.size === "sm" ? "text-sm" : props.size === "lg" ? "text-base" : "text-sm";
	return cn("prose-root", size);
}
