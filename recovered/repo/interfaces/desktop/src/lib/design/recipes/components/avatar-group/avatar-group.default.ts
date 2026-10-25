import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";

registerRecipe({
	id: "avatar-group.glass.void",
	kind: "avatar-group",
	label: "Glass Void Avatar Group",
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
		root: cn("avatar-group", "flex items-center [&>*:first-child]:ms-0"),
		overflow: cn(
			"avatar-group-overflow",
			"inline-flex items-center justify-center",
			"rounded-full",
			"bg-[var(--color-neutral-800)]",
			"border-2 border-[var(--color-void-base)]",
			"text-xs font-medium text-text-secondary",
			"select-none",
		),
	}),
});
