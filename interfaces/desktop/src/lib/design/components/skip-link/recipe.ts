/**
 * @file SkipLink Recipe
 * @kind skip-link
 * @layer components
 */

import { cn } from "$lib/design/utils/cn.js";

export function skipLinkRecipe(): string {
	return cn(
		"sr-only focus:not-sr-only",
		"focus:fixed focus:left-4 focus:top-4 focus:z-[9999]",
		"focus:rounded-md focus:px-4 focus:py-2",
		"focus:v-cyber focus:s-glass focus:e-2",
		"focus:text-[var(--text-primary)]",
	);
}
