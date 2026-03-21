import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
	id: "contextual-help.glass.void",
	kind: "contextual-help",
	label: "Glass Void Contextual Help",
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
		root: "contextual-help",
		trigger: cn(
			"contextual-help-trigger",
			"cursor-pointer",
			"hover:bg-[var(--surface-hover)]",
		),
		popover: cn(
			"contextual-help-popover",
			"absolute z-popover",
			"w-[var(--size-container-xs)]",
			"px-20 py-16",
			emitSegments(toPreset(props)),
			radiusClass(props.radius),
			"border border-[var(--border-subtle)]",
			"shadow-[var(--shadow-z2)]",
		),
		heading: cn(
			"contextual-help-heading",
			"text-sm font-semibold text-text-primary mb-8",
		),
		content: cn(
			"contextual-help-content",
			"text-sm text-text-secondary",
		),
		footer: cn(
			"contextual-help-footer",
			"mt-12 pt-12 border-t border-[var(--border-subtle)]",
			"text-sm",
		),
	}),
});
