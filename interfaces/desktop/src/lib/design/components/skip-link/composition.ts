/**
 * @file SkipLink Composition — Structural Classes Only
 * @kind skip-link
 * @layer components
 *
 * Visual appearance (surface, depth, glow, etc.) flows through
 * useColdLight() → resolveVisual(). Composition provides ONLY structural layout.
 *
 * NO hardcoded v-encoding classes. NO legacy shortcodes.
 */

import { cn } from "$lib/design/utils/cn.js";

export function skipLinkComposition(): string {
	return cn("skip-link-root");
}
