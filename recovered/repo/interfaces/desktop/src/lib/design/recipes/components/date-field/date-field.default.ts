import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "h-[var(--size-sm)] px-8 text-sm", label: "text-xs mb-4" },
	md: { root: "h-[var(--size-md)] px-12 text-sm", label: "text-sm mb-6" },
	lg: { root: "h-[var(--size-lg)] px-16 text-base", label: "text-base mb-8" },
	xl: { root: "h-[var(--size-xl)] px-16 text-base", label: "text-base mb-8" },
} as const;

registerRecipe({
	id: "date-field.glass.void",
	kind: "date-field",
	label: "Glass Void DateField",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z1",
		bevel: "subtle",
		glow: "none",
		frame: "soft",
		motion: "none",
		transition: "none",
		radius: "md",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];
		return {
			root: cn(
				"date-field",
				"inline-flex items-center",
				s.root,
				emitSegments(toPreset(props)),
				radiusClass(props.radius),
				"border border-[var(--border-subtle)]",
				"bg-transparent",
				"focus-within:ring-2 focus-within:ring-[var(--color-accent-teal-main)]",
			),
			segment: cn(
				"date-field-segment",
				"px-2 tabular-nums text-text-primary",
				"outline-none",
				"data-[placeholder]:text-text-muted",
				"focus:bg-[var(--color-accent-teal-main)] focus:text-[var(--color-void-base)]",
				radiusClass("sm"),
			),
			literal: cn("date-field-literal", "text-text-muted"),
			label: cn("date-field-label", "font-medium text-text-secondary", s.label),
			description: cn("date-field-description", "text-xs text-text-secondary mt-4"),
			errorMessage: cn("date-field-error", "text-xs text-[var(--color-red-400)] mt-4"),
		};
	},
});
