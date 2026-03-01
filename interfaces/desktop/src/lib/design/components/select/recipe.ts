/**
 * @file Select Recipe — Shortcode Composition
 * @kind select
 * @layer components
 *
 * GOLD STANDARD — structural classes + shortcode composition only.
 * NO raw Tailwind utilities in recipe output.
 *
 * Structural classes (select-*) handle layout/positioning.
 * Trigger and content receive v-* s-* e-* for glass surface treatment.
 */

import { cn } from "$lib/design/utils/cn.js";

export function selectRecipe() {
	return {
		trigger: cn(
			"select-trigger",
			"v-s1",
			"rounded-md",
		),
		content: cn(
			"select-content",
			"v-s1 v-d3",
			"rounded-md",
		),
		item: "select-item",
		group: "select-group",
		label: "select-label",
	};
}
