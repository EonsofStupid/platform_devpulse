import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: { input: "h-[var(--size-sm)] px-8 text-sm" },
	md: { input: "h-[var(--size-md)] px-12 text-sm" },
	lg: { input: "h-[var(--size-lg)] px-16 text-base" },
	xl: { input: "h-[var(--size-xl)] px-16 text-base" },
} as const;

registerRecipe({
	id: "color-field.glass.void",
	kind: "color-field",
	label: "Glass Void Color Field",
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
			root: cn("color-field", "flex flex-col gap-6"),
			label: cn("color-field-label", "text-sm font-medium text-text-primary"),
			input: cn(
				"color-field-input",
				"w-full font-mono",
				s.input,
				emitSegments(toPreset(props)),
				radiusClass(props.radius),
				"border border-[var(--border-subtle)]",
				"bg-transparent text-text-primary",
				"placeholder:text-text-muted",
				"focus:outline-none focus:ring-2 focus:ring-[var(--color-accent-teal-main)]",
				"transition-colors",
			),
			description: cn("color-field-description", "text-xs text-text-secondary"),
			errorMessage: cn("color-field-error", "text-xs text-[var(--color-red-400)]"),
			necessityIndicator: cn("text-[var(--color-red-400)] ms-2"),
		};
	},
});
