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
import {
	variantShortcode,
	surfaceShortcode,
	elevationShortcode,
	sizeShortcode,
	radiusClass,
} from "../../utils.js";

registerRecipe({
	id: "panel.metal.chrome",
	kind: "panel",
	label: "Metal Chrome Panel",
	defaults: {
		surface: "glass",
		accent: "teal",
		radius: "xl",
		depth: 3,
		glow: "off",
		bevel: "subtle",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			"panel",
			variantShortcode(props.variant ?? "frost"),
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
