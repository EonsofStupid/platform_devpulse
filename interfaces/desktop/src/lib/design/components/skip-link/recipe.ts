/**
 * @file SkipLink Recipe — Structural Classes Only
 * @kind skip-link
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Recipe provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

export function skipLinkRecipe(): string {
	return cn("skip-link-root");
}
