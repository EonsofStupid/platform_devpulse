/**
 * @file Button Recipe — Structural Classes Only
 * @kind button
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual() in the ui/ layer.
 * Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

export type ButtonSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<ButtonSize, string> = {
	sm: "h-8 px-3 text-sm gap-1.5",
	md: "h-10 px-4 text-sm gap-2",
	lg: "h-12 px-6 text-base gap-2.5",
};

/**
 * Button structural recipe — layout + sizing + focus.
 * Visual appearance is handled by useColdLight() in ui/ layer.
 */
export function buttonRecipe(size: ButtonSize = "md"): string {
	return cn(
		"btn",
		"inline-flex items-center justify-center font-medium",
		"focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current",
		"disabled:pointer-events-none disabled:opacity-50",
		"cursor-pointer select-none",
		SIZE_CLASSES[size] ?? SIZE_CLASSES.md,
	);
}
