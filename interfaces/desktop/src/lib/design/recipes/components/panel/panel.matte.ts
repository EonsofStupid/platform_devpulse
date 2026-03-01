/**
 * @file Panel Recipe — Matte Flat (Gold Standard)
 * @id panel.matte.flat
 * @kind panel
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD recipe — opaque matte panel for dense content layouts.
 * Uses solid surface (matte maps to s-solid).
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
	id: "panel.matte.flat",
	kind: "panel",
	label: "Matte Flat Panel",
	defaults: {
		surface: "matte-dark",
		material: "none",
		depth: "z1",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "md",
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
