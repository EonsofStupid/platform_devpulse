import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { radiusClass, surfaceClass } from "../../utils.js";

registerRecipe({
	id: "tabs.glass.void",
	kind: "tabs",
	label: "Glass Void Tabs",
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
		root: cn("flex flex-col"),
		list: cn(
			surfaceClass("glass", "void"),
			"flex flex-row items-center",
			"gap-1 p-1",
			"border-b border-white/8",
			radiusClass(props.radius),
		),
		trigger: cn(
			"inline-flex items-center justify-center",
			"px-3 py-1.5",
			"text-sm text-white/50",
			radiusClass(props.radius === "lg" ? "md" : props.radius),
			"transition-colors",
			"hover:text-white/70",
			"data-[state=active]:text-white data-[state=active]:bg-white/10",
			"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
			"disabled:pointer-events-none disabled:opacity-50",
		),
		content: cn(
			"p-4",
			"text-white/80",
			"data-[state=visible]:animate-in data-[state=visible]:fade-in-0",
			"focus-visible:outline-none",
		),
	}),
});
