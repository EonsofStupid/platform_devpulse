/**
 * @file Form Field Recipe — Glass Void
 * @id form-field.glass.void
 * @kind form-field
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight form-field compound component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Error token:
 *       text-ember (mapped from --color-ember-*)
 *
 * Size variants (sm/md/lg) drive gap, label size, and description size.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";

const SIZE_SCALE = {
	sm: { root: "gap-1", label: "text-xs", description: "text-xs", error: "text-xs" },
	md: { root: "gap-1.5", label: "text-sm", description: "text-xs", error: "text-xs" },
	lg: { root: "gap-2", label: "text-base", description: "text-sm", error: "text-sm" },
} as const;

registerRecipe({
	id: "form-field.glass.void",
	kind: "form-field",
	label: "Glass Void Form Field",
	defaults: {
		s: 1,
		z: 0,
		d: 0,
		b: 0,
		g: 0,
		f: 0,
		m: 0,
		t: 0,
		radius: "none",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn(
				"flex flex-col",
				s.root,
			),
			label: cn(
				"font-medium text-text-secondary",
				s.label,
			),
			input: cn(
				"w-full",
			),
			description: cn(
				"text-text-muted",
				s.description,
			),
			error: cn(
				"text-ember font-medium",
				s.error,
			),
		};
	},
});
