/**
 * @file Radio Group Recipe — Glass Void
 * @id radio-group.glass.void
 * @kind radio-group
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight radio-group compound component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --radio-group-bg             → var(--surface-primary)
 *       --radio-group-border         → var(--border-subtle)
 *       --radio-group-border-focus   → var(--border-focus)
 *       --radio-group-checked-bg     → var(--color-teal-600)
 *       --radio-group-checked-border → var(--color-teal-500)
 *       --radio-group-dot            → var(--color-teal-50)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary
 *   - Encoding emitters:
 *       emitSegments()
 *
 * Size variants (sm/md/lg) drive radio and label dimensions.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments } from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "gap-2", item: "gap-2", indicator: "h-4 w-4", dot: "h-1.5 w-1.5", label: "text-sm" },
	md: { root: "gap-3", item: "gap-2.5", indicator: "h-5 w-5", dot: "h-2 w-2", label: "text-sm" },
	lg: {
		root: "gap-4",
		item: "gap-3",
		indicator: "h-6 w-6",
		dot: "h-2.5 w-2.5",
		label: "text-base",
	},
} as const;

registerRecipe({
	id: "radio-group.glass.void",
	kind: "radio-group",
	label: "Glass Void Radio Group",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z1",
		bevel: "subtle",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "full",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn("flex flex-col", s.root),
			item: cn("flex items-center", s.item),
			indicator: cn(
				"shrink-0 rounded-full",
				s.indicator,
				emitSegments(toPreset(props)),
				"border border-[var(--radio-group-border)]",
				"bg-[var(--radio-group-bg)]",
				"transition-colors duration-fast",
				"data-[state=checked]:bg-[var(--radio-group-checked-bg)]",
				"data-[state=checked]:border-[var(--radio-group-checked-border)]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--radio-group-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
				"flex items-center justify-center",
			),
			label: cn(
				"font-medium text-text-secondary",
				s.label,
				"cursor-pointer",
				"peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
			),
		};
	},
});
