import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
	id: "color-area.glass.void",
	kind: "color-area",
	label: "Glass Void Color Area",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "soft",
		glow: "none",
		frame: "soft",
		motion: "none",
		transition: "none",
		radius: "md",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			"color-area",
			"relative touch-none select-none",
			"size-[var(--size-5xl)]",
			emitSegments(toPreset(props)),
			radiusClass(props.radius),
			"overflow-hidden",
		),
		gradient: cn(
			"color-area-gradient",
			"absolute inset-0",
		),
		thumb: cn(
			"color-area-thumb",
			"absolute",
			"size-[var(--size-2xs)]",
			"rounded-full",
			"border-2 border-white",
			"shadow-[var(--shadow-z2)]",
			"-translate-x-1/2 translate-y-1/2",
			"pointer-events-none",
		),
	}),
});
