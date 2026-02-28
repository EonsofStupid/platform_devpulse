/**
 * @file LoadingOverlay Recipe
 * @kind loading-overlay
 * @layer components
 *
 * Shortcode composition — structural class only.
 * All layout handled by loading-overlay-root @utility.
 */

import { cn } from "$lib/design/utils/cn.js";

export function loadingOverlayRecipe(): string {
	return cn("loading-overlay-root");
}
