/**
 * @file Panel Recipe — Glass Tint
 * @id panel.glass.tint
 * @kind panel
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Accent-tinted glass panel variant. Uses the accent color to create
 * a tinted glass surface with matching border colors.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --panel-border         → var(--border-soft)
 *       --panel-header-border  → var(--border-subtle)
 *   - Semantic text tokens (from @theme in tailwind.css):
 *       text-text-primary, text-text-secondary
 *   - Molecule utilities (from recipes/utils.ts):
 *       radiusClass(), depthClass(), glowClass(), bevelClass()
 *
 * Note: The glass-tint surface utility is generated per accent color
 * as `glass-tint-{accent}` in molecules/glass.css.
 *
 * All OKLCH — zero hardcoded white/ or black/ opacity values.
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

registerRecipe({
	id: "panel.glass.tint",
	kind: "panel",
	label: "Glass Tint Panel",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "lg",
		depth: 2,
		glow: "off",
		bevel: "off",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			`glass-tint-${props.accent}`,
			radiusClass(props.radius),
			depthClass(props.depth),
			glowClass(props.glow),
			bevelClass(props.bevel),
			"border border-[var(--panel-border)]",
			"overflow-hidden",
			"flex flex-col",
		),
		header: cn(
			"px-4 py-3",
			"border-b border-[var(--panel-header-border)]",
			"text-text-primary",
		),
		body: cn(
			"px-4 py-3",
			"flex-1",
			"overflow-auto",
			"text-text-secondary",
		),
		footer: cn(
			"px-4 py-3",
			"border-t border-[var(--panel-header-border)]",
		),
	}),
});
