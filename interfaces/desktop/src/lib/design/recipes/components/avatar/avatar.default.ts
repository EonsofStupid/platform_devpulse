import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments } from "../../utils.js";

registerRecipe({
	id: "avatar.glass.void",
	kind: "avatar",
	label: "Glass Void Avatar",
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
			"avatar",
			"relative inline-flex items-center justify-center",
			"rounded-full overflow-hidden",
			emitSegments(toPreset(props)),
			"bg-[var(--color-neutral-800)]",
			"border border-[var(--border-subtle)]",
		),
		image: cn(
			"avatar-image",
			"absolute inset-0 w-full h-full object-cover",
		),
		fallback: cn(
			"avatar-fallback",
			"inline-flex items-center justify-center",
			"w-full h-full",
			"font-medium text-text-primary",
			"select-none",
		),
	}),
});
