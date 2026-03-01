/**
 * @file Label Recipe — Glass Void
 * @id label.glass.void
 * @kind label
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight label primitive.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Semantic text tokens:
 *       text-text-secondary
 *
 * Size variants (sm/md/lg) drive font-size.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";

const SIZE_SCALE = {
	sm: { root: "text-xs" },
	md: { root: "text-sm" },
	lg: { root: "text-base" },
} as const;

registerRecipe({
	id: "label.glass.void",
	kind: "label",
	label: "Glass Void Label",
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
				"font-medium text-text-secondary",
				s.root,
				"peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
			),
		};
	},
});
