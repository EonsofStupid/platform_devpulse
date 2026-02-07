import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { radiusClass, surfaceClass } from "../../utils.js";

registerRecipe({
	id: "dialog.glass.void",
	kind: "dialog",
	label: "Glass Void Dialog",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "lg",
		depth: 3,
		glow: "teal",
		bevel: "soft",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		overlay: cn(
			"fixed inset-0 z-40",
			"bg-black/60 backdrop-blur-md",
			"data-[state=open]:animate-in data-[state=open]:fade-in-0",
			"data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
		),
		content: cn(
			"fixed left-1/2 top-1/2 z-50",
			"-translate-x-1/2 -translate-y-1/2",
			"w-full max-w-lg",
			surfaceClass("glass", "void"),
			radiusClass(props.radius),
			"border border-white/8",
			"data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
			"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
		),
		header: cn("flex flex-col gap-2 p-6 pb-4"),
		footer: cn("flex justify-end gap-3 p-6 pt-4"),
		title: cn("text-lg font-semibold tracking-tight text-white"),
		description: cn("text-sm leading-relaxed text-white/70"),
		close: cn(
			"absolute right-4 top-4 rounded-md p-1.5",
			"text-white/50 hover:text-white",
			"transition-colors",
			"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
		),
		trigger: "",
		portal: "",
	}),
});
