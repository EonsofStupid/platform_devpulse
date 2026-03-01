/**
 * @file Panel Recipe — Glass Void (Gold Standard)
 * @id panel.glass.void
 * @kind panel
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (panel, panel-*) handle layout/positioning
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 *
 * Output example:
 *   root: "panel v-void s-glass e-2 sz-md rounded-lg"
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
	id: "panel.glass.void",
	kind: "panel",
	label: "Glass Void Panel",
	defaults: {
		s: 1,
		z: 0,
		d: 2,
		b: 0,
		g: 0,
		f: 0,
		m: 0,
		t: 0,
		radius: "lg",
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
