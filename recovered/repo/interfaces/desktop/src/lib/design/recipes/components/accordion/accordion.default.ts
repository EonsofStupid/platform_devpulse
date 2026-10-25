/**
 * @file Accordion Recipe — Glass Void
 * @id accordion.glass.void
 * @kind accordion
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Token-backed recipe for the Accordion compound component.
 * All spacing uses SD5 token scale (N = pixel value).
 *
 * Slot keys: root, item, trigger, content, indicator
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
	id: "accordion.glass.void",
	kind: "accordion",
	label: "Glass Void Accordion",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z1",
		bevel: "subtle",
		glow: "none",
		frame: "soft",
		motion: "none",
		transition: "none",
		radius: "md",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn("accordion", emitSegments(toPreset(props)), radiusClass(props.radius)),
		item: cn("accordion-item", "border-b border-[var(--border-subtle)]"),
		trigger: cn(
			"accordion-trigger",
			"flex w-full items-center justify-between",
			"px-16 py-12",
			"text-sm font-medium text-text-primary",
			"hover:bg-[var(--surface-hover)]",
			"transition-colors",
		),
		content: cn(
			"accordion-content",
			"px-16 pb-16",
			"text-sm text-text-secondary",
		),
		indicator: cn(
			"accordion-indicator",
			"shrink-0",
			"text-text-muted",
			"transition-transform duration-200",
		),
	}),
});
