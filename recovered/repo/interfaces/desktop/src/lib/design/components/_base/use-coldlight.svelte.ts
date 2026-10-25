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
	type ColdLightProps,
	type ResolvedVisual,
	resolveVisual,
} from "$lib/design/registry/resolve-visual.js";
import type { Preset } from "$lib/design/registry/token-categories.js";

/**
 * Reactive ColdLight prop resolution.
 *
 * Returns an object whose properties read from $derived via getters,
 * preserving Svelte 5 reactivity across component boundaries.
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

	return {
		get values() {
			return resolved.values;
		},
		get preset() {
			return resolved.preset;
		},
		get encoding() {
			return resolved.encoding;
		},
		get segments() {
			return resolved.segments;
		},
		get radius() {
			return resolved.radius;
		},
		get size() {
			return resolved.size;
		},
		get cssProperties() {
			return resolved.cssProperties;
		},
		get variant() {
			return resolved.variant;
		},
		get svgFilters() {
			return resolved.svgFilters;
		},
		get svgFilterClasses() {
			return resolved.svgFilterClasses;
		},
	};
}
