/**
 * @file Panel Recipe — Metal Chrome
 * @id panel.metal.chrome
 * @kind panel
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Metal chrome panel variant. Uses a metallic surface effect with
 * heavy depth shadows and optional bevel for a premium feel.
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
	id: "panel.metal.chrome",
	kind: "panel",
	label: "Metal Chrome Panel",
	defaults: {
		surface: "glass",
		accent: "teal",
		radius: "xl",
		depth: 3,
		glow: "off",
		bevel: "subtle",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			"metal-chrome",
			radiusClass(props.radius),
			depthClass(props.depth),
			glowClass(props.glow),
			bevelClass(props.bevel),
			"overflow-hidden",
			"flex flex-col",
		),
		header: cn(
			"px-5 py-4",
			"border-b border-[var(--panel-header-border)]",
			"text-text-primary font-semibold",
		),
		body: cn(
			"px-5 py-4",
			"flex-1",
			"overflow-auto",
			"text-text-secondary",
		),
		footer: cn(
			"px-5 py-4",
			"border-t border-[var(--panel-header-border)]",
		),
	}),
});
