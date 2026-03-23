/**
 * @file Textarea Composition — Structural Classes Only
 * @kind textarea
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

type TextareaRecipeProps = { size?: string };

export function textareaComposition(props: TextareaRecipeProps = {}): string {
	const sizeClass = `textarea-${props.size ?? "md"}`;
	return cn("textarea-root", sizeClass, "rounded-md");
}
