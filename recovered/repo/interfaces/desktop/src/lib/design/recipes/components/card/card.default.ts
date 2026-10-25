/**
 * @file Card Recipe — Glass Void
 * @id card.glass.void
 * @kind card
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Token-backed recipe for the Card compound component.
 *
 * All spacing uses SD5 token scale (N = pixel value):
 *   px-16 = 16px = 1rem, py-12 = 12px = 0.75rem, gap-8 = 8px = 0.5rem
 *
 * Slot keys match card contract:
 *   root, cover, header, title, description, action, content, footer
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
		cover: "card-cover",
		header: cn("card-header", "flex flex-col gap-6 px-24 pt-24"),
		title: cn("card-title", "text-lg font-semibold leading-none tracking-tight text-text-primary"),
		description: cn("card-description", "text-sm text-text-secondary"),
		action: cn("card-action", "ms-auto shrink-0"),
		content: cn("card-content", "px-24 py-16"),
		footer: cn("card-footer", "flex items-center px-24 pb-24"),
	}),
});
