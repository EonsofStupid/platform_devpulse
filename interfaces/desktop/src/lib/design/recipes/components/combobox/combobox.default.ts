/**
 * @file Combobox Recipe — Glass Void
 * @id combobox.glass.void
 * @kind combobox
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Token-backed recipe. All spacing uses SD5 token scale (N = pixel value).
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitCategory, emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: {
		wrapper: "min-h-[var(--size-sm)]",
		input: "px-8 py-4 text-sm",
		trigger: "px-6 py-4",
		item: "px-8 py-4 text-sm",
		groupLabel: "px-8 py-4 text-xs",
		empty: "py-16 text-sm",
		label: "text-xs mb-4",
	},
	md: {
		wrapper: "min-h-[var(--size-md)]",
		input: "px-12 py-8 text-sm",
		trigger: "px-8 py-8",
		item: "px-8 py-6 text-sm",
		groupLabel: "px-8 py-6 text-xs",
		empty: "py-24 text-sm",
		label: "text-sm mb-6",
	},
	lg: {
		wrapper: "min-h-[var(--size-lg)]",
		input: "px-16 py-12 text-base",
		trigger: "px-12 py-12",
		item: "px-12 py-8 text-base",
		groupLabel: "px-12 py-8 text-sm",
		empty: "py-32 text-base",
		label: "text-base mb-8",
	},
} as const;

registerRecipe({
	id: "combobox.glass.void",
	kind: "combobox",
	label: "Glass Void Combobox",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "soft",
		glow: "teal",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "lg",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];
		const r = radiusClass(props.radius);

		return {
			wrapper: cn(
				"inline-flex w-full items-center",
				s.wrapper,
				r,
				"bg-[var(--combobox-bg)]",
				"border border-[var(--combobox-border)]",
				emitCategory("b", props.bevel),
				"focus-within:ring-2 focus-within:ring-[var(--combobox-border-focus)]",
				"transition-[border-color,box-shadow]",
			),
			input: cn(
				"flex-1 w-full bg-transparent",
				s.input,
				"text-text-primary",
				"placeholder:text-text-muted",
				"caret-[var(--combobox-border-focus)]",
				"outline-none",
			),
			trigger: cn(
				"inline-flex items-center justify-center",
				s.trigger,
				radiusClass("md"),
				"text-text-secondary hover:text-text-primary",
				"transition-colors",
			),
			content: cn(
				emitSegments(toPreset(props)),
				r,
				"border border-[var(--combobox-border)]",
				"p-4 z-dropdown overflow-hidden",
			),
			item: cn(
				"relative flex w-full cursor-pointer select-none items-center",
				radiusClass(props.radius === "lg" ? "md" : props.radius),
				s.item,
				"text-text-secondary",
				"outline-none transition-colors",
				"data-[highlighted]:bg-[var(--combobox-option-hover)] data-[highlighted]:text-text-primary",
				"aria-[selected=true]:bg-[var(--combobox-option-selected-bg)] aria-[selected=true]:text-[var(--combobox-option-selected-text)]",
			),
			empty: cn("text-center text-text-muted", s.empty),
			group: cn("py-4 overflow-hidden"),
			groupLabel: cn("font-semibold text-text-muted uppercase tracking-wider", s.groupLabel),
			label: cn("font-medium text-text-secondary", s.label),
		};
	},
});
