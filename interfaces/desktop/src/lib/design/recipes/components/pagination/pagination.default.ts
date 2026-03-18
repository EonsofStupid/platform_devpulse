/**
 * @file Pagination Recipe — Glass Void
 * @id pagination.glass.void
 * @kind pagination
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight pagination compound component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --pagination-bg             → var(--surface-primary)
 *       --pagination-border         → var(--border-subtle)
 *       --pagination-border-focus   → var(--border-focus)
 *       --pagination-active-bg      → var(--color-teal-900)
 *       --pagination-active-text    → var(--color-teal-300)
 *       --pagination-hover          → var(--surface-elevated)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Encoding emitters:
 *       emitSegments(), radiusClass()
 *
 * Size variants (sm/md/lg) drive item dimensions.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: { item: "h-7 w-7 text-xs", nav: "h-7 w-7 text-xs", ellipsis: "h-7 w-7 text-xs" },
	md: { item: "h-9 w-9 text-sm", nav: "h-9 px-3 text-sm", ellipsis: "h-9 w-9 text-sm" },
	lg: { item: "h-11 w-11 text-base", nav: "h-11 px-4 text-base", ellipsis: "h-11 w-11 text-base" },
} as const;

registerRecipe({
	id: "pagination.glass.void",
	kind: "pagination",
	label: "Glass Void Pagination",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z1",
		bevel: "subtle",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "md",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];
		const r = radiusClass(props.radius);

		return {
			root: cn("flex items-center gap-1"),
			item: cn(
				"inline-flex items-center justify-center",
				s.item,
				r,
				emitSegments(toPreset(props)),
				"text-text-secondary",
				"transition-colors duration-fast",
				"hover:bg-[var(--pagination-hover)] hover:text-text-primary",
				"data-[active=true]:bg-[var(--pagination-active-bg)] data-[active=true]:text-[var(--pagination-active-text)]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pagination-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
			prev: cn(
				"inline-flex items-center justify-center",
				s.nav,
				r,
				"text-text-secondary",
				"transition-colors duration-fast",
				"hover:bg-[var(--pagination-hover)] hover:text-text-primary",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pagination-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
			next: cn(
				"inline-flex items-center justify-center",
				s.nav,
				r,
				"text-text-secondary",
				"transition-colors duration-fast",
				"hover:bg-[var(--pagination-hover)] hover:text-text-primary",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pagination-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
			ellipsis: cn(
				"inline-flex items-center justify-center",
				s.ellipsis,
				"text-text-muted",
				"cursor-default",
			),
		};
	},
});
