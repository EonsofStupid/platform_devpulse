/**
 * @file Combobox Recipe — Glass Void
 * @id combobox.glass.void
 * @kind combobox
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Gold standard recipe for the ColdLight combobox compound component.
 * Fully prop-driven via DsSurfaceProps — size, radius, depth, glow, bevel
 * all flow through from the recipe registry.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --combobox-bg           → var(--surface-overlay)
 *       --combobox-border       → var(--border-subtle)
 *       --combobox-border-focus       → var(--border-focus)
 *       --combobox-option-hover       → var(--surface-elevated)
 *       --combobox-option-selected-bg   → var(--color-teal-900)
 *       --combobox-option-selected-text → var(--color-teal-300)
 *   - Semantic text tokens (from @theme in tailwind.css):
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Encoding emitters:
 *       emitSegments(), emitCategory(), radiusClass()
 *
 * Size variants (sm/md/lg) drive per-slot height, padding, and font-size.
 * All OKLCH — zero hardcoded white/ or black/ opacity values.
 *
 * Theming: Tokens resolve via CSS custom properties.
 *   Default (dark): values set on :root in tokens.css.
 *   Light/custom:   override --combobox-* or semantic tokens via
 *                   [data-theme="light"] selector in CSS layer.
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitCategory, emitSegments, radiusClass } from "../../utils.js";

/**
 * Per-slot size dimensions: height, padding, font-size.
 * Keyed by SizeToken ("sm" | "md" | "lg").
 */
const SIZE_SCALE = {
	sm: {
		wrapper: "min-h-8",
		input: "px-2 py-1 text-sm",
		trigger: "px-1.5 py-1",
		item: "px-2 py-1 text-sm",
		groupLabel: "px-2 py-1 text-xs",
		empty: "py-4 text-sm",
		label: "text-xs mb-1",
	},
	md: {
		wrapper: "min-h-10",
		input: "px-3 py-2 text-sm",
		trigger: "px-2 py-2",
		item: "px-2 py-1.5 text-sm",
		groupLabel: "px-2 py-1.5 text-xs",
		empty: "py-6 text-sm",
		label: "text-sm mb-1.5",
	},
	lg: {
		wrapper: "min-h-12",
		input: "px-4 py-3 text-base",
		trigger: "px-3 py-3",
		item: "px-3 py-2 text-base",
		groupLabel: "px-3 py-2 text-sm",
		empty: "py-8 text-base",
		label: "text-base mb-2",
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
				"transition-[border-color,box-shadow] duration-fast",
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
				"rounded-md",
				"text-text-secondary hover:text-text-primary",
				"transition-colors duration-fast",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--combobox-border-focus)]",
			),
			content: cn(
				emitSegments(toPreset(props)),
				r,
				"border border-[var(--combobox-border)]",
				"p-1 z-50 overflow-hidden",
				"data-[open]:animate-in data-[open]:fade-in-0 data-[open]:zoom-in-95",
			),
			item: cn(
				"relative flex w-full cursor-pointer select-none items-center",
				radiusClass(props.radius === "lg" ? "md" : props.radius),
				s.item,
				"text-text-secondary",
				"outline-none transition-colors duration-fast",
				"data-[highlighted]:bg-[var(--combobox-option-hover)] data-[highlighted]:text-text-primary",
				"aria-[selected=true]:bg-[var(--combobox-option-selected-bg)] aria-[selected=true]:text-[var(--combobox-option-selected-text)]",
			),
			empty: cn("text-center text-text-muted", s.empty),
			group: cn("py-1 overflow-hidden"),
			groupLabel: cn("font-semibold text-text-muted uppercase tracking-wider", s.groupLabel),
			label: cn("font-medium text-text-secondary", s.label),
		};
	},
});
