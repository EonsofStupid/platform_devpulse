/**
 * @file Widget Recipe — Glass Void (Gold Standard)
 * @id widget.glass.void
 * @kind widget
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (widget-*) handle layout/positioning
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 *
 * Output example:
 *   root: "widget-root v-void s-glass e-2 sz-md rounded-lg"
 *
 * CSS variable flow:
 *   v-void sets --recipe-blur, --recipe-saturation, --recipe-bg-alpha, etc.
 *   s-glass reads --recipe-* vars → applies backdrop-filter, background, border
 *   e-2 sets --_shadow-depth → s-glass composites into box-shadow
 *   sz-md sets --recipe-font-size, --recipe-padding-x/y, --recipe-gap
 *   widget-root/header/content/footer consume --recipe-* vars
 *
 * Slot keys:
 *   root, header, title, actions, tabs, tab, content, footer
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
	id: "widget.glass.void",
	kind: "widget",
	label: "Glass Void Widget",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "lg",
		depth: 2,
		glow: "off",
		bevel: "soft",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			"widget-root",
			variantShortcode(props.variant ?? "void"),
			surfaceShortcode(props.surface),
			elevationShortcode(props.depth),
			sizeShortcode(props.size),
			radiusClass(props.radius),
		),
		header: "widget-header",
		title: "widget-title",
		actions: "widget-actions",
		tabs: "widget-tabs",
		tab: "widget-tab",
		content: "widget-content",
		footer: "widget-footer",
	}),
});
