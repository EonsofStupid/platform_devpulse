/**
 * @file Dialog Recipe — Glass Void (Gold Standard)
 * @id dialog.glass.void
 * @kind dialog
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (dialog-*) handle layout/positioning
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 *
 * Output example:
 *   content: "dialog-content v-void s-glass e-3 sz-md"
 *
 * CSS variable flow:
 *   v-void sets --recipe-blur, --recipe-saturation, --recipe-bg-alpha, etc.
 *   s-glass reads --recipe-* vars → applies backdrop-filter, background, border
 *   e-3 sets --_shadow-depth → s-glass composites into box-shadow
 *   sz-md sets --recipe-font-size, --recipe-padding-x/y, --recipe-gap
 *   dialog-content consumes --recipe-font-size for font-size
 *   dialog-header/footer consume --recipe-padding-x, --recipe-gap
 *
 * Slot keys match dialog contract exactly:
 *   trigger, content, overlay, title, description, close, header, footer, portal
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
	id: "dialog.glass.void",
	kind: "dialog",
	label: "Glass Void Dialog",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "lg",
		depth: 3,
		glow: "teal",
		bevel: "soft",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		overlay: "dialog-overlay",
		content: cn(
			"dialog-content",
			variantShortcode(props.variant ?? "void"),
			surfaceShortcode(props.surface),
			elevationShortcode(props.depth),
			sizeShortcode(props.size),
			radiusClass(props.radius),
		),
		header: "dialog-header",
		footer: "dialog-footer",
		title: "dialog-title",
		description: "dialog-description",
		close: "dialog-close",
		trigger: "",
		portal: "",
	}),
});
