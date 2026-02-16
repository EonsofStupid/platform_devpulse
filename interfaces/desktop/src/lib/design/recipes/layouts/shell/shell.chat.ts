import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { bevelClass, depthClass, glowClass, radiusClass, surfaceClass } from "../../utils.js";

registerRecipe({
	id: "shell.chat.default",
	kind: "shell",
	label: "Chat Shell",
	defaults: {
		accent: "teal",
		surface: "glass",
		variant: "deep",
		size: "md",
		radius: "lg",
		depth: 2,
		glow: "off",
		bevel: "subtle",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		frame: cn(
			"frame-bevel",
			radiusClass(props.radius),
			depthClass(props.depth),
			"bg-[var(--color-void-950)]",
		),
		topbar: cn(surfaceClass(props.surface, props.variant ?? "deep"), bevelClass(props.bevel)),
		modeSelector: cn(surfaceClass(props.surface, props.variant ?? "deep"), bevelClass(props.bevel)),
		dashboard: cn("bg-[var(--surface-primary)]"),
		footer: cn(surfaceClass(props.surface, props.variant ?? "deep"), glowClass(props.glow)),
	}),
});
