import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
	id: "collapsible.glass.void",
	kind: "collapsible",
	label: "Glass Void Collapsible",
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
		root: cn("collapsible", emitSegments(toPreset(props)), radiusClass(props.radius)),
		trigger: cn(
			"collapsible-trigger",
			"flex w-full items-center justify-between",
			"px-16 py-12",
			"text-sm font-medium text-text-primary",
			"hover:bg-[var(--surface-hover)]",
			"transition-colors",
		),
		content: cn(
			"collapsible-content",
			"px-16 pb-16",
			"text-sm text-text-secondary",
		),
		indicator: cn(
			"collapsible-indicator",
			"shrink-0 text-text-muted",
			"transition-transform duration-200",
		),
	}),
});
