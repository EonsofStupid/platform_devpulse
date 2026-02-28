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
import {
	variantShortcode,
	surfaceShortcode,
	elevationShortcode,
	sizeShortcode,
	radiusClass,
} from "../../utils.js";

registerRecipe({
	id: "panel.glass.tint",
	kind: "panel",
	label: "Glass Tint Panel",
	defaults: {
		surface: "glass",
		variant: "deep",
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
			variantShortcode(props.variant ?? "deep"),
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
