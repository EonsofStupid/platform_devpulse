import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";

registerRecipe({
	id: "color-wheel.glass.void",
	kind: "color-wheel",
	label: "Glass Void Color Wheel",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "full",
		size: "md",
	},
	classes: (_props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			"color-wheel",
			"relative rounded-full",
		),
		track: cn(
			"color-wheel-track",
			"absolute inset-0 rounded-full",
			"bg-[conic-gradient(from_0deg,hsl(0,100%,50%),hsl(60,100%,50%),hsl(120,100%,50%),hsl(180,100%,50%),hsl(240,100%,50%),hsl(300,100%,50%),hsl(360,100%,50%))]",
		),
		thumb: cn(
			"color-wheel-thumb",
			"absolute",
			"size-[var(--size-2xs)]",
			"rounded-full",
			"border-2 border-white",
			"shadow-[var(--shadow-z2)]",
			"-translate-x-1/2 -translate-y-1/2",
			"pointer-events-none",
		),
	}),
});
