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
		s: 5,
		z: 0,
		d: 1,
		b: 0,
		g: 0,
		f: 0,
		m: 0,
		t: 0,
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
