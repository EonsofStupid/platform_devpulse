/**
 * @file Calendar Recipe — Glass Void
 * @id calendar.glass.void
 * @kind calendar
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Token-backed recipe. All spacing uses SD5 token scale.
 * Slot keys: root, header, heading, grid, headCell, cell, navButton
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
	id: "calendar.glass.void",
	kind: "calendar",
	label: "Glass Void Calendar",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "soft",
		glow: "none",
		frame: "soft",
		motion: "none",
		transition: "none",
		radius: "lg",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn("calendar", "p-16", emitSegments(toPreset(props)), radiusClass(props.radius)),
		header: cn("calendar-header", "flex items-center justify-between mb-12"),
		heading: cn("calendar-heading", "text-sm font-semibold text-text-primary"),
		grid: cn("calendar-grid", "w-full border-collapse"),
		headCell: cn("calendar-headcell", "text-xs font-medium text-text-muted p-8 text-center"),
		cell: cn(
			"calendar-cell",
			"size-[var(--size-sm)] text-sm",
			"inline-flex items-center justify-center",
			radiusClass("md"),
			"hover:bg-[var(--surface-hover)]",
			"transition-colors",
			"text-text-primary",
		),
		navButton: cn(
			"calendar-navbtn",
			"size-[var(--size-sm)]",
			"inline-flex items-center justify-center",
			radiusClass("md"),
			"hover:bg-[var(--surface-hover)]",
			"text-text-secondary",
			"transition-colors",
		),
	}),
});
