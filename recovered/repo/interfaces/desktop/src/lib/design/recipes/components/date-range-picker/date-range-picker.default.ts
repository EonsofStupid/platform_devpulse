import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
	id: "date-range-picker.glass.void",
	kind: "date-range-picker",
	label: "Glass Void DateRangePicker",
	defaults: {
		surface: "glass-void", material: "none", depth: "z1", bevel: "subtle",
		glow: "none", frame: "soft", motion: "none", transition: "none",
		radius: "md", size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn("date-range-picker", "flex flex-col gap-6"),
		label: cn("date-range-picker-label", "text-sm font-medium text-text-secondary"),
		field: cn(
			"date-range-picker-field",
			"inline-flex items-center",
			"h-[var(--size-md)] px-12",
			radiusClass(props.radius),
			"border border-[var(--border-subtle)]",
			"bg-transparent",
			"focus-within:ring-2 focus-within:ring-[var(--color-accent-teal-main)]",
		),
		trigger: cn(
			"date-range-picker-trigger",
			"inline-flex items-center justify-center",
			"size-[var(--size-md)]",
			radiusClass(props.radius),
			"text-text-secondary hover:text-text-primary",
			"hover:bg-[var(--surface-hover)]",
			"transition-colors",
		),
		content: cn(
			"date-range-picker-content",
			"absolute z-popover mt-4",
			"p-16",
			emitSegments(toPreset(props)),
			radiusClass(props.radius),
			"border border-[var(--border-subtle)]",
			"shadow-[var(--shadow-z2)]",
		),
		calendar: cn("date-range-picker-calendar"),
		description: cn("date-range-picker-description", "text-xs text-text-secondary"),
		errorMessage: cn("date-range-picker-error", "text-xs text-[var(--color-red-400)]"),
		presetTrigger: cn(
			"date-range-picker-preset",
			"px-12 py-6 text-sm",
			radiusClass("md"),
			"text-text-secondary hover:text-text-primary",
			"hover:bg-[var(--surface-hover)]",
			"transition-colors",
		),
	}),
});
