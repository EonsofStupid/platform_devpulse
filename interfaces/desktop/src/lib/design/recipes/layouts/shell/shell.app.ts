import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { bevelClass, depthClass, glowClass, radiusClass, surfaceClass } from "../../utils.js";

registerRecipe({
	id: "shell.app.default",
	kind: "shell",
	label: "App Shell",
	defaults: {
		accent: "teal",
		surface: "glass",
		variant: "void",
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
		topbar: cn(surfaceClass(props.surface, props.variant ?? "void"), bevelClass(props.bevel)),
		sidebar: cn(surfaceClass(props.surface, "deep"), bevelClass(props.bevel)),
		sidebarExpanded: cn(surfaceClass(props.surface, "smoke"), bevelClass(props.bevel)),
		content: cn("bg-[var(--surface-primary)]"),
		statusbar: cn(surfaceClass(props.surface, props.variant ?? "void"), glowClass(props.glow)),
	}),
});
