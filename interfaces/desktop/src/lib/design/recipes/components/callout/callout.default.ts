/**
 * @file Callout Recipe — Glass Void
 * @id callout.glass.void
 * @kind callout
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight callout component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens:
 *       --callout-bg        → var(--surface-overlay)
 *       --callout-border    → var(--border-subtle)
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
		root: "gap-2 p-3 text-sm",
		icon: "h-4 w-4",
	},
	md: {
		root: "gap-3 p-4 text-sm",
		icon: "h-5 w-5",
	},
	lg: {
		root: "gap-4 p-5 text-base",
		icon: "h-6 w-6",
	},
} as const;

registerRecipe({
	id: "callout.glass.void",
	kind: "callout",
	label: "Glass Void Callout",
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
				"flex",
				s.root,
				emitSegments(toPreset(props)),
				radiusClass(props.radius),
				"border-l-4 border-[var(--callout-border)]",
				"bg-[var(--callout-bg)]",
			),
			icon: cn(
				"shrink-0",
				s.icon,
				"text-[var(--callout-border)]",
			),
			content: cn(
				"flex-1 text-text-secondary",
			),
		};
	},
});
