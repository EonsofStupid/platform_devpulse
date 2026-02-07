import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { radiusClass, surfaceClass } from "../../utils.js";

registerRecipe({
	id: "panel.glass.void",
	kind: "panel",
	label: "Glass Void Panel",
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
			surfaceClass("glass", "void"),
			radiusClass(props.radius),
			"border border-white/8",
			"overflow-hidden",
			"flex flex-col",
		),
		header: cn("px-4 py-3", "border-b border-white/6", "text-sm font-medium text-white/90"),
		body: cn("px-4 py-3", "flex-1", "overflow-auto", "text-white/80"),
		footer: cn("px-4 py-3", "border-t border-white/6"),
	}),
});
