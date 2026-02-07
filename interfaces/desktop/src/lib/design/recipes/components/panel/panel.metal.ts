import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { radiusClass } from "../../utils.js";

registerRecipe({
	id: "panel.metal.chrome",
	kind: "panel",
	label: "Metal Chrome Panel",
	defaults: {
		surface: "glass",
		accent: "teal",
		radius: "xl",
		depth: 3,
		glow: "off",
		bevel: "subtle",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			"metal-chrome",
			radiusClass(props.radius),
			"overflow-hidden",
			"flex flex-col",
			"shadow-lg",
			props.bevel !== "off" ? `bevel-${props.bevel}` : "",
		),
		header: cn("px-5 py-4", "border-b border-white/10", "text-white font-semibold"),
		body: cn("px-5 py-4", "flex-1", "overflow-auto"),
		footer: cn("px-5 py-4", "border-t border-white/10"),
	}),
});
