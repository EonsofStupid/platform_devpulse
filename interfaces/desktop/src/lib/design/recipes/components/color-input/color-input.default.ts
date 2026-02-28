/**
 * @file Color Input Recipe — Glass Void
 * @id color-input.glass.void
 * @kind color-input
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight color-input compound component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --color-input-bg             → var(--surface-primary)
 *       --color-input-border         → var(--border-subtle)
 *       --color-input-border-focus   → var(--border-focus)
 *       --color-input-swatch-border  → var(--border-soft)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-muted
 *   - Molecule utilities (from recipes/utils.ts):
 *       radiusClass(), depthClass(), glowClass(), bevelClass()
 *
 * Size variants (sm/md/lg) drive per-slot height, padding, and font-size.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import {
	radiusClass,
	depthClass,
	glowClass,
	bevelClass,
} from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "h-8", input: "px-2 text-sm", swatch: "h-4 w-4 ml-2" },
	md: { root: "h-10", input: "px-3 text-sm", swatch: "h-5 w-5 ml-3" },
	lg: { root: "h-12", input: "px-4 text-base", swatch: "h-6 w-6 ml-4" },
} as const;

registerRecipe({
	id: "color-input.glass.void",
	kind: "color-input",
	label: "Glass Void Color Input",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "lg",
		depth: 2,
		glow: "teal",
		bevel: "soft",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];
		const r = radiusClass(props.radius);

		return {
			root: cn(
				"inline-flex w-full items-center",
				s.root,
				r,
				depthClass(props.depth),
				glowClass(props.glow),
				bevelClass(props.bevel),
				"border border-[var(--color-input-border)]",
				"bg-[var(--color-input-bg)]",
				"focus-within:ring-2 focus-within:ring-[var(--color-input-border-focus)]",
				"transition-[border-color,box-shadow] duration-fast",
			),
			input: cn(
				"flex-1 w-full bg-transparent",
				s.input,
				"text-text-primary",
				"placeholder:text-text-muted",
				"caret-[var(--color-input-border-focus)]",
				"outline-none",
				"font-mono",
			),
			swatch: cn(
				"shrink-0 rounded-md",
				s.swatch,
				"border border-[var(--color-input-swatch-border)]",
				"mr-2",
			),
		};
	},
});
