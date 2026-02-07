import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { radiusClass } from "../../utils.js";

registerRecipe({
	id: "panel.glass.tint",
	kind: "panel",
	label: "Glass Tint Panel",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "lg",
		depth: 2,
		glow: "off",
		bevel: "off",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			`glass-tint-${props.accent}`,
			radiusClass(props.radius),
			`border border-${props.accent}-500/15`,
			"overflow-hidden",
			"flex flex-col",
		),
		header: cn("px-4 py-3", `border-b border-${props.accent}-500/10`, `text-${props.accent}-300`),
		body: cn("px-4 py-3", "flex-1", "overflow-auto"),
		footer: cn("px-4 py-3", `border-t border-${props.accent}-500/10`),
	}),
});
