/**
 * @file Switch Recipe — Glass Void
 * @id switch.glass.void
 * @kind switch
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight switch primitive.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --switch-bg             → var(--surface-muted)
 *       --switch-border         → var(--border-subtle)
 *       --switch-border-focus   → var(--border-focus)
 *       --switch-checked-bg     → var(--color-teal-600)
 *       --switch-thumb          → var(--color-void-50)
 *   - Molecule utilities (from recipes/utils.ts):
 *       depthClass(), glowClass(), bevelClass()
 *
 * Size variants (sm/md/lg) drive track and thumb dimensions.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import {
	depthClass,
	glowClass,
	bevelClass,
} from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "h-4 w-7", thumb: "h-3 w-3 data-[state=checked]:translate-x-3" },
	md: { root: "h-5 w-9", thumb: "h-4 w-4 data-[state=checked]:translate-x-4" },
	lg: { root: "h-6 w-11", thumb: "h-5 w-5 data-[state=checked]:translate-x-5" },
} as const;

registerRecipe({
	id: "switch.glass.void",
	kind: "switch",
	label: "Glass Void Switch",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "full",
		depth: 1,
		glow: "off",
		bevel: "subtle",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn(
				"inline-flex shrink-0 cursor-pointer items-center",
				s.root,
				"rounded-full",
				depthClass(props.depth),
				glowClass(props.glow),
				bevelClass(props.bevel),
				"border border-[var(--switch-border)]",
				"bg-[var(--switch-bg)]",
				"transition-colors duration-fast",
				"data-[state=checked]:bg-[var(--switch-checked-bg)]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--switch-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
			thumb: cn(
				"pointer-events-none block rounded-full",
				s.thumb,
				"bg-[var(--switch-thumb)]",
				"shadow-sm",
				"transition-transform duration-fast",
				"translate-x-0.5",
			),
		};
	},
});
