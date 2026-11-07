/**
 * @file Form Recipe — Glass Void
 * @id form.glass.void
 * @kind form
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight form container component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Structural layout only — no component tokens needed.
 *
 * Size variants (sm/md/lg) drive gap between form fields.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";

const SIZE_SCALE = {
	sm: { root: "gap-3" },
	md: { root: "gap-4" },
	lg: { root: "gap-6" },
} as const;

registerRecipe({
	id: "form.glass.void",
	kind: "form",
	label: "Glass Void Form",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "none",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn("flex flex-col", s.root),
		};
	},
});
