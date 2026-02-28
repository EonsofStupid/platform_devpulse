/**
 * @file Collapsible Recipe
 * @kind compound
 * @layer components
 *
 * Shortcode class composition — ZERO raw Tailwind.
 * Structural classes: collapsible-trigger, collapsible-content
 */

import { cn } from "$lib/design/utils/cn.js";

export function collapsibleRecipe() {
	return {
		root: "",
		trigger: cn("collapsible-trigger"),
		content: cn("collapsible-content"),
	};
}
