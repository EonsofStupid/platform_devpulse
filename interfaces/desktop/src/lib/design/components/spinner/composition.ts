/**
 * @file Spinner Composition — Structural Classes Only
 * @kind spinner
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual() in the ui/ layer.
 * Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

export type SpinnerSize = "sm" | "md" | "lg";

const SIZE_CLASSES: Record<SpinnerSize, string> = {
	sm: "size-4",
	md: "size-6",
	lg: "size-8",
};

/**
 * Spinner structural composition — layout + sizing.
 * Visual appearance is handled by useColdLight() in ui/ layer.
 */
export function spinnerComposition(props: { size?: SpinnerSize } = {}): string {
	const size = props.size ?? "md";
	return cn("spinner-root", SIZE_CLASSES[size] ?? SIZE_CLASSES.md);
}
