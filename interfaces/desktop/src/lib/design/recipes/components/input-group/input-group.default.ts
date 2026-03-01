/**
 * @file Input Group Recipe — Glass Void
 * @id input-group.glass.void
 * @kind input-group
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight input-group compound component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --input-group-border       → var(--border-subtle)
 *       --input-group-addon-bg     → var(--surface-muted)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary
 *   - Encoding emitters:
 *       emitSegments(), radiusClass()
 *
 * Size variants (sm/md/lg) drive addon and element dimensions.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "h-8", addon: "px-2 text-sm", element: "text-sm" },
	md: { root: "h-10", addon: "px-3 text-sm", element: "text-sm" },
	lg: { root: "h-12", addon: "px-4 text-base", element: "text-base" },
} as const;

registerRecipe({
	id: "input-group.glass.void",
	kind: "input-group",
	label: "Glass Void Input Group",
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
				"flex items-stretch",
				s.root,
				r,
				emitSegments(toPreset(props)),
				"border border-[var(--input-group-border)]",
				"overflow-hidden",
			),
			addon: cn(
				"inline-flex items-center shrink-0",
				s.addon,
				"bg-[var(--input-group-addon-bg)]",
				"text-text-secondary",
				"border-[var(--input-group-border)]",
				"first:border-r last:border-l",
			),
			element: cn(
				"flex-1 min-w-0",
				s.element,
				"text-text-primary",
				"[&>input]:w-full [&>input]:h-full [&>input]:bg-transparent [&>input]:outline-none [&>input]:px-3",
			),
		};
	},
});
