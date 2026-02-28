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
import {
	variantShortcode,
	surfaceShortcode,
	elevationShortcode,
	sizeShortcode,
	radiusClass,
} from "../../utils.js";

registerRecipe({
	id: "panel.glass.void",
	kind: "panel",
	label: "Glass Void Panel",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "lg",
		depth: 2,
		glow: "off",
		bevel: "off",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			"panel",
			variantShortcode(props.variant ?? "void"),
			surfaceShortcode(props.surface),
			elevationShortcode(props.depth),
			sizeShortcode(props.size),
			radiusClass(props.radius),
		),
		header: "panel-header",
		body: "panel-body",
		footer: "panel-footer",
	}),
});
