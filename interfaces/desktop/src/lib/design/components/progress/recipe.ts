/**
 * @file Progress Recipe — Shortcode Composition
 * @kind progress
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural classes (progress-*) handle layout/sizing.
 * Size is controlled by sz-* shortcode classes which set --recipe-min-h
 * consumed by progress-track for height.
 */

import { cn } from "$lib/design/utils/cn.js";

type ProgressRecipeProps = { size?: string };

export function progressTrackRecipe(props: ProgressRecipeProps = {}): string {
	const size = props.size ?? "md";
	return cn(
		"progress-track",
		`sz-${size}`,
		"rounded-full",
	);
}

export function progressIndicatorRecipe(): string {
	return "progress-indicator";
}
