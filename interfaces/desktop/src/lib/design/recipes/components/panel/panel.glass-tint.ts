/**
 * @file Panel Recipe — Glass Tint (Gold Standard)
 * @id panel.glass.tint
 * @kind panel
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD recipe — accent-tinted glass panel variant.
 * Uses deep variant for a tinted glass surface.
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
	id: "panel.glass.tint",
	kind: "panel",
	label: "Glass Tint Panel",
	defaults: {
		surface: "glass-deep",
		material: "none",
		depth: "z2",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "lg",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn("panel", emitSegments(toPreset(props)), radiusClass(props.radius)),
		header: "panel-header",
		body: "panel-body",
		footer: "panel-footer",
	}),
});
