/**
 * @file SkipLink Recipe — Shortcode Composition
 * @kind skip-link
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural class (skip-link-root) handles sr-only + focus reveal.
 * On focus, receives v-* s-* e-* for glass surface treatment.
 */

import { cn } from "$lib/design/utils/cn.js";

export function skipLinkRecipe(): string {
	return cn(
		"skip-link-root",
		"v-s1 v-d2 v-g6",
	);
}
