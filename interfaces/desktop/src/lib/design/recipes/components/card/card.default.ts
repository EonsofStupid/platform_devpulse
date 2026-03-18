/**
 * @file Card Recipe — Glass Void (Gold Standard)
 * @id card.glass.void
 * @kind card
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (card, card-*) handle layout/positioning
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 *
 * Output example:
 *   root: "card v-void s-glass e-2 sz-md rounded-lg"
 *
 * Slot keys match card contract:
 *   root, header, content, footer
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
	id: "card.glass.void",
	kind: "card",
	label: "Glass Void Card",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "soft",
		glow: "teal",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "lg",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn("card", emitSegments(toPreset(props)), radiusClass(props.radius)),
		header: "card-header",
		content: "card-content",
		footer: "card-footer",
	}),
});
