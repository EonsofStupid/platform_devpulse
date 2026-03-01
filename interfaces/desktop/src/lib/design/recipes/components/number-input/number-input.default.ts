/**
 * @file Number Input Recipe — Glass Void
 * @id number-input.glass.void
 * @kind number-input
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight number-input compound component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --number-input-bg             → var(--surface-primary)
 *       --number-input-border         → var(--border-subtle)
 *       --number-input-border-focus   → var(--border-focus)
 *       --number-input-btn-hover      → var(--surface-elevated)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Encoding emitters:
 *       emitSegments(), radiusClass()
 *
 * Size variants (sm/md/lg) drive per-slot height, padding, and font-size.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "h-8", input: "px-2 text-sm", button: "h-8 w-6 text-xs" },
	md: { root: "h-10", input: "px-3 text-sm", button: "h-10 w-8 text-sm" },
	lg: { root: "h-12", input: "px-4 text-base", button: "h-12 w-10 text-base" },
} as const;

registerRecipe({
	id: "number-input.glass.void",
	kind: "number-input",
	label: "Glass Void Number Input",
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
			root: cn(
				"inline-flex items-center",
				s.root,
				r,
				emitSegments(toPreset(props)),
				"border border-[var(--number-input-border)]",
				"bg-[var(--number-input-bg)]",
				"focus-within:ring-2 focus-within:ring-[var(--number-input-border-focus)]",
				"transition-[border-color,box-shadow] duration-fast",
			),
			input: cn(
				"flex-1 w-full bg-transparent text-center",
				s.input,
				"text-text-primary",
				"placeholder:text-text-muted",
				"outline-none",
				"[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none",
			),
			increment: cn(
				"inline-flex items-center justify-center shrink-0",
				s.button,
				"text-text-secondary hover:text-text-primary",
				"hover:bg-[var(--number-input-btn-hover)]",
				"border-l border-[var(--number-input-border)]",
				"transition-colors duration-fast",
				"disabled:pointer-events-none disabled:opacity-50",
			),
			decrement: cn(
				"inline-flex items-center justify-center shrink-0",
				s.button,
				"text-text-secondary hover:text-text-primary",
				"hover:bg-[var(--number-input-btn-hover)]",
				"border-r border-[var(--number-input-border)]",
				"transition-colors duration-fast",
				"disabled:pointer-events-none disabled:opacity-50",
			),
		};
	},
});
