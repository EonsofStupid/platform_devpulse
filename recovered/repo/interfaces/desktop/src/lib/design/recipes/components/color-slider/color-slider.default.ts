import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
	id: "color-slider.glass.void",
	kind: "color-slider",
	label: "Glass Void Color Slider",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z1",
		bevel: "subtle",
		glow: "none",
		frame: "soft",
		motion: "none",
		transition: "none",
		radius: "full",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			"color-slider",
			"relative flex items-center gap-12",
			emitSegments(toPreset(props)),
		),
		label: cn(
			"color-slider-label",
			"text-sm font-medium text-text-primary flex items-center justify-between",
		),
		valueDisplay: cn("text-text-secondary font-mono text-xs"),
		track: cn(
			"color-slider-track",
			"relative flex-1",
			"h-[var(--size-2xs)]",
			radiusClass(props.radius),
			"overflow-hidden cursor-pointer",
		),
		thumb: cn(
			"color-slider-thumb",
			"absolute top-1/2 -translate-y-1/2",
			"size-[var(--size-2xs)]",
			"rounded-full",
			"border-2 border-white",
			"shadow-[var(--shadow-z2)]",
			"-translate-x-1/2",
			"pointer-events-none",
		),
	}),
});
