import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { radiusClass, surfaceClass } from "../../utils.js";

registerRecipe({
	id: "panel.matte.flat",
	kind: "panel",
	label: "Matte Flat Panel",
	defaults: {
		surface: "matte",
		accent: "teal",
		radius: "md",
		depth: 1,
		glow: "off",
		bevel: "off",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			surfaceClass("matte", "dark"),
			radiusClass(props.radius),
			"border border-white/5",
			"overflow-hidden",
			"flex flex-col",
		),
		header: cn("px-4 py-3", "border-b border-white/5", "text-sm text-white/70"),
		body: cn("px-4 py-3", "flex-1", "overflow-auto"),
		footer: cn("px-4 py-3", "border-t border-white/5"),
	}),
});
