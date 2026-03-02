/**
 * @file useColdLight() — Svelte 5 Rune for ColdLight Prop Resolution
 * @module @devpulse/coldlight/components/_base/use-coldlight
 * @layer components
 *
 * Reactive wrapper around resolveVisual(). Components call this once
 * in their <script> block. Returns a $derived ResolvedVisual that
 * auto-recalculates when any ColdLight prop changes.
 *
 * Usage:
 * ```svelte
 * <script lang="ts">
 *   const visual = useColdLight(
 *     () => ({ preset, surface, depth, glow }),
 *     { surface: "glass-void", depth: "z1" }
 *   );
 *   const classes = $derived(cn(visual.segments, visual.radius, className));
 * </script>
 * ```
 */

import {
	resolveVisual,
	type ColdLightProps,
	type ResolvedVisual,
} from "$lib/design/registry/resolve-visual.js";
import type { Preset } from "$lib/design/registry/token-categories.js";

/**
 * Reactive ColdLight prop resolution.
 *
 * @param getProps - Getter function returning current ColdLight props (reactive via $derived)
 * @param kindDefaults - Static per-kind default preset values (e.g., Button → surface: "glass-void")
 * @returns ResolvedVisual — segments, encoding, radius, cssProperties, etc.
 */
export function useColdLight(
	getProps: () => ColdLightProps,
	kindDefaults?: Partial<Preset>,
): ResolvedVisual {
	const resolved = $derived(resolveVisual(getProps(), kindDefaults));
	return resolved;
}
