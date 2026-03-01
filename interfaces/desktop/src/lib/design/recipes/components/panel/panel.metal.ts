/**
 * @file Panel Recipe — Metal Chrome (Gold Standard)
 * @id panel.metal.chrome
 * @kind panel
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD recipe — metallic panel with premium feel.
 * Uses frost variant for the metallic surface effect.
 *
 * Slot keys match panel contract:
 *   root, header, body, footer
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
	id: "panel.metal.chrome",
	kind: "panel",
	label: "Metal Chrome Panel",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z3",
		bevel: "subtle",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "xl",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			"panel",
			emitSegments(toPreset(props)),
			radiusClass(props.radius),
		),
		header: "panel-header",
		body: "panel-body",
		footer: "panel-footer",
	}),
});
