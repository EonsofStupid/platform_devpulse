/**
 * @file Alert Recipe — Glass Void
 * @id alert.glass.void
 * @kind alert
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight alert component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens:
 *       --alert-bg        → var(--surface-overlay)
 *       --alert-border    → var(--border-subtle)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Molecule utilities:
 *       surfaceClass(), radiusClass(), depthClass(), glowClass(), bevelClass()
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import {
	radiusClass,
	surfaceClass,
	depthClass,
	glowClass,
	bevelClass,
} from "../../utils.js";

const SIZE_SCALE = {
	sm: {
		root: "gap-2 p-3 text-sm",
		icon: "h-4 w-4",
		title: "text-sm",
		description: "text-xs",
	},
	md: {
		root: "gap-3 p-4 text-sm",
		icon: "h-5 w-5",
		title: "text-sm",
		description: "text-sm",
	},
	lg: {
		root: "gap-4 p-5 text-base",
		icon: "h-6 w-6",
		title: "text-base",
		description: "text-sm",
	},
} as const;

registerRecipe({
	id: "alert.glass.void",
	kind: "alert",
	label: "Glass Void Alert",
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

		return {
			root: cn(
				"flex",
				s.root,
				surfaceClass(props.surface, props.variant ?? "void"),
				radiusClass(props.radius),
				depthClass(props.depth),
				glowClass(props.glow),
				bevelClass(props.bevel),
				"border border-[var(--alert-border)]",
				"bg-[var(--alert-bg)]",
			),
			icon: cn(
				"shrink-0",
				s.icon,
				"text-[var(--alert-border)]",
			),
			title: cn(
				"font-semibold text-text-primary",
				s.title,
			),
			description: cn(
				"text-text-secondary",
				s.description,
			),
		};
	},
});
