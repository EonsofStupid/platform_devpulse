/**
 * @file Slider Recipe — Glass Void
 * @id slider.glass.void
 * @kind slider
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight slider primitive.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --slider-track-bg      → var(--surface-muted)
 *       --slider-range-bg      → var(--color-teal-500)
 *       --slider-thumb-bg      → var(--color-void-50)
 *       --slider-thumb-border  → var(--color-teal-500)
 *       --slider-border-focus  → var(--border-focus)
 *   - Encoding emitters:
 *       emitSegments()
 *
 * Size variants (sm/md/lg) drive track height and thumb dimensions.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments } from "../../utils.js";

const SIZE_SCALE = {
	sm: { track: "h-1", thumb: "h-3.5 w-3.5" },
	md: { track: "h-2", thumb: "h-4.5 w-4.5" },
	lg: { track: "h-3", thumb: "h-5.5 w-5.5" },
} as const;

registerRecipe({
	id: "slider.glass.void",
	kind: "slider",
	label: "Glass Void Slider",
	defaults: {
		s: 1,
		z: 0,
		d: 1,
		b: 1,
		g: 0,
		f: 0,
		m: 0,
		t: 0,
		radius: "full",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn(
				"relative flex w-full touch-none select-none items-center",
			),
			track: cn(
				"relative w-full rounded-full",
				s.track,
				"bg-[var(--slider-track-bg)]",
				"overflow-hidden",
			),
			range: cn(
				"absolute h-full rounded-full",
				"bg-[var(--slider-range-bg)]",
			),
			thumb: cn(
				"block rounded-full",
				s.thumb,
				emitSegments(toPreset(props)),
				"border-2 border-[var(--slider-thumb-border)]",
				"bg-[var(--slider-thumb-bg)]",
				"shadow-sm",
				"transition-colors duration-fast",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--slider-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
		};
	},
});
