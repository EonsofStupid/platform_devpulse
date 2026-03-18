/**
 * @file Select Recipe — Glass Void
 * @id select.glass.void
 * @kind select
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight select compound component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --select-bg             → var(--surface-primary)
 *       --select-border         → var(--border-subtle)
 *       --select-border-focus   → var(--border-focus)
 *       --select-item-hover     → var(--surface-elevated)
 *       --select-item-selected  → var(--color-teal-900)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Encoding emitters:
 *       emitSegments(), emitCategory(), radiusClass()
 *
 * Size variants (sm/md/lg) drive per-slot height, padding, and font-size.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitCategory, emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: {
		trigger: "h-8 px-2 text-sm",
		item: "px-2 py-1 text-sm",
		label: "px-2 py-1 text-xs",
	},
	md: {
		trigger: "h-10 px-3 text-sm",
		item: "px-2 py-1.5 text-sm",
		label: "px-2 py-1.5 text-xs",
	},
	lg: {
		trigger: "h-12 px-4 text-base",
		item: "px-3 py-2 text-base",
		label: "px-3 py-2 text-sm",
	},
} as const;

registerRecipe({
	id: "select.glass.void",
	kind: "select",
	label: "Glass Void Select",
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
			trigger: cn(
				"inline-flex w-full items-center justify-between",
				s.trigger,
				r,
				emitCategory("b", props.bevel),
				"border border-[var(--select-border)]",
				"bg-[var(--select-bg)]",
				"text-text-primary",
				"transition-colors duration-fast",
				"hover:bg-[var(--select-item-hover)]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--select-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
			content: cn(
				emitSegments(toPreset(props)),
				r,
				"border border-[var(--select-border)]",
				"p-1 z-50 overflow-hidden",
				"data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95",
			),
			item: cn(
				"relative flex w-full cursor-pointer select-none items-center",
				radiusClass(props.radius === "lg" ? "md" : props.radius),
				s.item,
				"text-text-secondary",
				"outline-none transition-colors duration-fast",
				"data-[highlighted]:bg-[var(--select-item-hover)] data-[highlighted]:text-text-primary",
				"aria-[selected=true]:bg-[var(--select-item-selected)] aria-[selected=true]:text-text-primary",
			),
			label: cn("font-semibold text-text-muted uppercase tracking-wider", s.label),
			group: cn("py-1 overflow-hidden"),
			separator: cn("my-1 h-px", "bg-[var(--select-border)]"),
		};
	},
});
