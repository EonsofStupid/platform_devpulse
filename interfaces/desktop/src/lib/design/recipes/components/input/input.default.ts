/**
 * @file Input Recipe — Glass Void
 * @id input.glass.void
 * @kind input
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight input primitive.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --input-bg             → var(--surface-primary)
 *       --input-border         → var(--border-subtle)
 *       --input-border-focus   → var(--border-focus)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-muted
 *   - Encoding emitters:
 *       emitSegments(), radiusClass()
 *
 * Size variants (sm/md/lg) drive height, padding, and font-size.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "h-8 px-3 text-sm" },
	md: { root: "h-10 px-4 text-sm" },
	lg: { root: "h-12 px-5 text-base" },
} as const;

registerRecipe({
	id: "input.glass.void",
	kind: "input",
	label: "Glass Void Input",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "soft",
		glow: "teal",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "lg",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn(
				"w-full bg-transparent",
				s.root,
				radiusClass(props.radius),
				emitSegments(toPreset(props)),
				"border border-[var(--input-border)]",
				"bg-[var(--input-bg)]",
				"text-text-primary",
				"placeholder:text-text-muted",
				"caret-[var(--input-border-focus)]",
				"transition-colors duration-fast",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--input-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
		};
	},
});
