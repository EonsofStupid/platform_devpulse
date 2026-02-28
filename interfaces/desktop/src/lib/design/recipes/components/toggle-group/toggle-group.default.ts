/**
 * @file Toggle Group Recipe — Glass Void
 * @id toggle-group.glass.void
 * @kind toggle-group
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight toggle-group compound component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --toggle-group-bg             → var(--surface-muted)
 *       --toggle-group-border         → var(--border-subtle)
 *       --toggle-group-border-focus   → var(--border-focus)
 *       --toggle-group-item-pressed   → var(--surface-elevated)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary
 *   - Molecule utilities (from recipes/utils.ts):
 *       radiusClass(), depthClass(), glowClass(), bevelClass()
 *
 * Supports horizontal/vertical orientation.
 * Size variants (sm/md/lg) drive item height, padding, and font-size.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import {
	radiusClass,
	depthClass,
	glowClass,
	bevelClass,
} from "../../utils.js";

const SIZE_SCALE = {
	sm: { item: "h-8 px-2 text-sm" },
	md: { item: "h-9 px-3 text-sm" },
	lg: { item: "h-10 px-4 text-base" },
} as const;

registerRecipe({
	id: "toggle-group.glass.void",
	kind: "toggle-group",
	label: "Glass Void Toggle Group",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "md",
		depth: 1,
		glow: "off",
		bevel: "subtle",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];
		const r = radiusClass(props.radius);

		return {
			root: cn(
				"inline-flex",
				r,
				depthClass(props.depth),
				glowClass(props.glow),
				bevelClass(props.bevel),
				"border border-[var(--toggle-group-border)]",
				"bg-[var(--toggle-group-bg)]",
				"overflow-hidden",
				"data-[orientation=vertical]:flex-col",
			),
			item: cn(
				"inline-flex items-center justify-center",
				s.item,
				"text-text-secondary",
				"transition-colors duration-fast",
				"hover:text-text-primary hover:bg-[var(--toggle-group-item-pressed)]",
				"data-[state=on]:bg-[var(--toggle-group-item-pressed)] data-[state=on]:text-text-primary",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[var(--toggle-group-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
				"border-r border-[var(--toggle-group-border)] last:border-r-0",
				"data-[orientation=vertical]:border-r-0 data-[orientation=vertical]:border-b data-[orientation=vertical]:last:border-b-0",
			),
		};
	},
});
