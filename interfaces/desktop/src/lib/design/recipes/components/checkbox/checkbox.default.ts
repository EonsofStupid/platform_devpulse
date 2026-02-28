/**
 * @file Checkbox Recipe — Glass Void
 * @id checkbox.glass.void
 * @kind checkbox
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight checkbox primitive.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --checkbox-bg              → var(--surface-primary)
 *       --checkbox-border          → var(--border-subtle)
 *       --checkbox-border-focus    → var(--border-focus)
 *       --checkbox-checked-bg      → var(--color-teal-600)
 *       --checkbox-checked-border  → var(--color-teal-500)
 *       --checkbox-indicator       → var(--color-teal-50)
 *   - Molecule utilities (from recipes/utils.ts):
 *       radiusClass(), depthClass(), glowClass(), bevelClass()
 *
 * Size variants (sm/md/lg) drive dimensions.
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
	sm: { root: "h-4 w-4", indicator: "h-3 w-3" },
	md: { root: "h-5 w-5", indicator: "h-3.5 w-3.5" },
	lg: { root: "h-6 w-6", indicator: "h-4 w-4" },
} as const;

registerRecipe({
	id: "checkbox.glass.void",
	kind: "checkbox",
	label: "Glass Void Checkbox",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "md",
		depth: 1,
		glow: "off",
		bevel: "subtle",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn(
				"shrink-0 peer",
				s.root,
				radiusClass(props.radius),
				depthClass(props.depth),
				glowClass(props.glow),
				bevelClass(props.bevel),
				"border border-[var(--checkbox-border)]",
				"bg-[var(--checkbox-bg)]",
				"transition-colors duration-fast",
				"data-[state=checked]:bg-[var(--checkbox-checked-bg)]",
				"data-[state=checked]:border-[var(--checkbox-checked-border)]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--checkbox-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
			indicator: cn(
				"flex items-center justify-center",
				s.indicator,
				"text-[var(--checkbox-indicator)]",
			),
		};
	},
});
