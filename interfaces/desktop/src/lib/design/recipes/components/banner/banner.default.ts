/**
 * @file Banner Recipe — Glass Void
 * @id banner.glass.void
 * @kind banner
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight banner component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens:
 *       --banner-bg        → var(--surface-overlay)
 *       --banner-border    → var(--border-subtle)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Encoding emitters:
 *       emitSegments(), radiusClass()
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: {
		root: "px-3 py-2 gap-2 text-sm",
		icon: "h-4 w-4",
		dismiss: "p-0.5",
	},
	md: {
		root: "px-4 py-3 gap-3 text-sm",
		icon: "h-5 w-5",
		dismiss: "p-1",
	},
	lg: {
		root: "px-5 py-4 gap-4 text-base",
		icon: "h-6 w-6",
		dismiss: "p-1.5",
	},
} as const;

registerRecipe({
	id: "banner.glass.void",
	kind: "banner",
	label: "Glass Void Banner",
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
				"flex items-center",
				s.root,
				emitSegments(toPreset(props)),
				"border-b border-[var(--banner-border)]",
				"bg-[var(--banner-bg)]",
			),
			icon: cn(
				"shrink-0",
				s.icon,
				"text-text-secondary",
			),
			content: cn(
				"flex-1 text-text-primary",
			),
			action: cn(
				"shrink-0",
			),
			dismiss: cn(
				s.dismiss,
				radiusClass(props.radius === "lg" ? "md" : props.radius),
				"text-text-muted hover:text-text-primary",
				"transition-colors duration-fast",
			),
		};
	},
});
