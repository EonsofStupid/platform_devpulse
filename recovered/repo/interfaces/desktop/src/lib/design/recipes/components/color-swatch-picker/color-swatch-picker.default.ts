import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";

registerRecipe({
	id: "color-swatch-picker.glass.void",
	kind: "color-swatch-picker",
	label: "Glass Void Color Swatch Picker",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "none",
		size: "md",
	},
	classes: (_props: DsSurfaceProps): Record<string, string> => ({
		root: "color-swatch-picker",
		item: cn(
			"color-swatch-picker-item",
			"cursor-pointer outline-none",
			"ring-offset-2 ring-offset-[var(--color-void-base)]",
			"focus-visible:ring-2 focus-visible:ring-[var(--color-accent-teal-main)]",
			"rounded-sm",
		),
		itemSelected: cn(
			"ring-2 ring-[var(--color-accent-teal-main)]",
		),
	}),
});
