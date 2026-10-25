import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { radiusClass } from "../../utils.js";

const SIZE_MAP: Record<string, string> = {
	xs: "size-3xs",
	sm: "size-2xs",
	md: "size-xs",
	lg: "size-sm",
};

registerRecipe({
	id: "color-swatch.glass.void",
	kind: "color-swatch",
	label: "Glass Void Color Swatch",
	defaults: {
		surface: "transparent",
		material: "none",
		depth: "flat",
		bevel: "flat",
		glow: "none",
		frame: "soft",
		motion: "none",
		transition: "none",
		radius: "md",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			"color-swatch",
			SIZE_MAP[props.size] ?? SIZE_MAP.md,
			radiusClass(props.radius),
			"border border-[var(--border-subtle)]",
		),
	}),
});
