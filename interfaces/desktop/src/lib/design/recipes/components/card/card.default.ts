/**
 * @file Card Recipe — Glass Void
 * @id card.glass.void
 * @kind card
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight card component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens:
 *       --card-bg        → var(--surface-overlay)
 *       --card-border    → var(--border-subtle)
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
		header: "p-4 pb-3",
		content: "p-4",
		footer: "p-4 pt-3",
		gap: "gap-2",
		footerGap: "gap-2",
	},
	md: {
		header: "p-6 pb-4",
		content: "p-6",
		footer: "p-6 pt-4",
		gap: "gap-2",
		footerGap: "gap-3",
	},
	lg: {
		header: "p-8 pb-5",
		content: "p-8",
		footer: "p-8 pt-5",
		gap: "gap-3",
		footerGap: "gap-4",
	},
} as const;

registerRecipe({
	id: "card.glass.void",
	kind: "card",
	label: "Glass Void Card",
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
				surfaceClass(props.surface, props.variant ?? "void"),
				radiusClass(props.radius),
				depthClass(props.depth),
				glowClass(props.glow),
				bevelClass(props.bevel),
				"border border-[var(--card-border)]",
				"bg-[var(--card-bg)]",
				"overflow-hidden",
			),
			header: cn(
				"flex flex-col",
				s.gap,
				s.header,
			),
			content: cn(
				s.content,
				"text-text-secondary",
			),
			footer: cn(
				"flex justify-end",
				s.footerGap,
				s.footer,
			),
		};
	},
});
