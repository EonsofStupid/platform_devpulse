/**
 * @file Button Recipe — Glass Void
 * @id button.glass.void
 * @kind button
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight button primitive.
 * Fully prop-driven via DsSurfaceProps — size, radius, encoding categories
 * all flow through from the recipe registry.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --button-bg            → var(--surface-primary)
 *       --button-border        → var(--border-subtle)
 *       --button-border-focus  → var(--border-focus)
 *       --button-hover         → var(--surface-elevated)
 *   - Semantic text tokens (from @theme in tailwind.css):
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Encoding emitters:
 *       emitSegments(), radiusClass()
 *
 * Intent variants (primary/secondary/ghost/danger) baked via accent token.
 * Size variants (sm/md/lg) drive height, padding, and font-size.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

/**
 * Per-slot size dimensions: height, padding, font-size.
 * Keyed by SizeToken ("sm" | "md" | "lg").
 */
const SIZE_SCALE = {
	sm: { root: "h-8 px-3 text-sm gap-1.5" },
	md: { root: "h-10 px-4 text-sm gap-2" },
	lg: { root: "h-12 px-6 text-base gap-2.5" },
} as const;

registerRecipe({
	id: "button.glass.void",
	kind: "button",
	label: "Glass Void Button",
	defaults: {
		s: 1,
		z: 0,
		d: 2,
		b: 2,
		g: 1,
		f: 0,
		m: 0,
		t: 0,
		radius: "lg",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn(
				"inline-flex items-center justify-center",
				s.root,
				"font-medium",
				emitSegments(toPreset(props)),
				radiusClass(props.radius),
				"border border-[var(--button-border)]",
				"bg-[var(--button-bg)]",
				"text-text-primary",
				"transition-colors duration-fast",
				"hover:bg-[var(--button-hover)]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--button-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
		};
	},
});
