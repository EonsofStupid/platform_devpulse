/**
 * @file Search Input Recipe — Glass Void
 * @id search-input.glass.void
 * @kind search-input
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight search-input compound component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --search-input-bg             → var(--surface-primary)
 *       --search-input-border         → var(--border-subtle)
 *       --search-input-border-focus   → var(--border-focus)
 *       --search-input-icon           → var(--text-muted)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-muted
 *   - Encoding emitters:
 *       emitSegments(), radiusClass()
 *
 * Size variants (sm/md/lg) drive per-slot height, padding, and font-size.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "h-8", input: "px-2 text-sm", icon: "h-3.5 w-3.5 ml-2", clear: "h-3.5 w-3.5 mr-2" },
	md: { root: "h-10", input: "px-3 text-sm", icon: "h-4 w-4 ml-3", clear: "h-4 w-4 mr-3" },
	lg: { root: "h-12", input: "px-4 text-base", icon: "h-5 w-5 ml-4", clear: "h-5 w-5 mr-4" },
} as const;

registerRecipe({
	id: "search-input.glass.void",
	kind: "search-input",
	label: "Glass Void Search Input",
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
		const r = radiusClass(props.radius);

		return {
			root: cn(
				"inline-flex w-full items-center",
				s.root,
				r,
				emitSegments(toPreset(props)),
				"border border-[var(--search-input-border)]",
				"bg-[var(--search-input-bg)]",
				"focus-within:ring-2 focus-within:ring-[var(--search-input-border-focus)]",
				"transition-[border-color,box-shadow] duration-fast",
			),
			input: cn(
				"flex-1 w-full bg-transparent",
				s.input,
				"text-text-primary",
				"placeholder:text-text-muted",
				"caret-[var(--search-input-border-focus)]",
				"outline-none",
			),
			icon: cn("shrink-0", s.icon, "text-[var(--search-input-icon)]", "pointer-events-none"),
			clear: cn(
				"shrink-0 cursor-pointer",
				s.clear,
				"text-text-muted hover:text-text-primary",
				"transition-colors duration-fast",
				"rounded-md",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--search-input-border-focus)]",
			),
		};
	},
});
