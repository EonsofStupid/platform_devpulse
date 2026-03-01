/**
 * @file Tags Input Recipe — Glass Void
 * @id tags-input.glass.void
 * @kind tags-input
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight tags-input compound component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --tags-input-bg             → var(--surface-primary)
 *       --tags-input-border         → var(--border-subtle)
 *       --tags-input-border-focus   → var(--border-focus)
 *       --tags-input-tag-bg         → var(--surface-elevated)
 *       --tags-input-tag-border     → var(--border-soft)
 *       --tags-input-remove-hover   → var(--surface-muted)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Encoding emitters:
 *       emitSegments(), radiusClass()
 *
 * Size variants (sm/md/lg) drive per-slot dimensions.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: {
		root: "min-h-8 px-2 py-1 gap-1",
		input: "text-sm px-1",
		tag: "h-5 px-1.5 text-xs gap-1",
		tagRemove: "h-3.5 w-3.5",
	},
	md: {
		root: "min-h-10 px-3 py-1.5 gap-1.5",
		input: "text-sm px-1",
		tag: "h-6 px-2 text-xs gap-1.5",
		tagRemove: "h-4 w-4",
	},
	lg: {
		root: "min-h-12 px-4 py-2 gap-2",
		input: "text-base px-1",
		tag: "h-7 px-2.5 text-sm gap-2",
		tagRemove: "h-4.5 w-4.5",
	},
} as const;

registerRecipe({
	id: "tags-input.glass.void",
	kind: "tags-input",
	label: "Glass Void Tags Input",
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
				"flex flex-wrap items-center",
				s.root,
				r,
				emitSegments(toPreset(props)),
				"border border-[var(--tags-input-border)]",
				"bg-[var(--tags-input-bg)]",
				"focus-within:ring-2 focus-within:ring-[var(--tags-input-border-focus)]",
				"transition-[border-color,box-shadow] duration-fast",
			),
			input: cn(
				"flex-1 min-w-16 bg-transparent",
				s.input,
				"text-text-primary",
				"placeholder:text-text-muted",
				"caret-[var(--tags-input-border-focus)]",
				"outline-none",
			),
			tag: cn(
				"inline-flex items-center",
				s.tag,
				radiusClass(props.radius === "lg" ? "md" : props.radius),
				"bg-[var(--tags-input-tag-bg)]",
				"border border-[var(--tags-input-tag-border)]",
				"text-text-secondary",
				"font-medium",
			),
			tagRemove: cn(
				"inline-flex items-center justify-center shrink-0 cursor-pointer",
				s.tagRemove,
				"rounded-sm",
				"text-text-muted hover:text-text-primary",
				"hover:bg-[var(--tags-input-remove-hover)]",
				"transition-colors duration-fast",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tags-input-border-focus)]",
			),
		};
	},
});
