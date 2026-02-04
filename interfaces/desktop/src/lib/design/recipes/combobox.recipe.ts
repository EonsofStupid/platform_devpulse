/**
 * @file Combobox Recipe
 * @description Glass-void combobox styling. Neon cyberpunk glass morphism.
 */

import { registerRecipe } from "./index.js";
import type { DsSurfaceProps } from "./types.js";
import { radiusClass } from "./utils.js";
import { cn } from "$lib/design/primitives/types.js";

registerRecipe({
	id: "combobox.glass.void",
	kind: "combobox",
	label: "Glass Void Combobox",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "lg",
		depth: 2,
		glow: "teal",
		bevel: "soft",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		input: cn(
			"w-full bg-transparent px-3 py-2",
			"text-sm text-white placeholder:text-white/40",
			"border border-white/8",
			radiusClass(props.radius),
			"outline-none",
			"focus:ring-1 focus:ring-teal-400/40 focus:border-teal-400/30",
			"transition-colors",
		),
		trigger: cn(
			"inline-flex items-center justify-center",
			"px-2 py-2",
			"text-white/50 hover:text-white",
			"transition-colors",
			"focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white/30",
		),
		content: cn(
			"glass-void",
			radiusClass(props.radius),
			"border border-white/8",
			"p-1",
			"z-50 overflow-hidden",
			"data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95",
		),
		item: cn(
			"relative flex w-full cursor-pointer select-none items-center",
			radiusClass(props.radius === "lg" ? "md" : props.radius),
			"px-2 py-1.5 text-sm text-white/80",
			"outline-none transition-colors",
			"data-[highlighted]:bg-white/10 data-[highlighted]:text-white",
			"aria-[selected=true]:bg-teal-500/20 aria-[selected=true]:text-teal-300",
		),
		empty: cn(
			"py-6 text-center text-sm text-white/40",
		),
		group: cn(
			"overflow-hidden",
		),
		label: cn(
			"text-sm font-medium text-white/70",
			"mb-1.5",
		),
	}),
});
