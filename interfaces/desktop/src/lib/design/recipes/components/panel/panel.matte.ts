/**
 * @file Panel Recipe — Matte Flat
 * @id panel.matte.flat
 * @kind panel
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Matte flat panel variant. Uses the matte surface utility for an
 * opaque, non-transparent panel suitable for dense content layouts.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --panel-border         → var(--border-soft)
 *       --panel-header-border  → var(--border-subtle)
 *   - Semantic text tokens (from @theme in tailwind.css):
 *       text-text-secondary
 *   - Molecule utilities (from recipes/utils.ts):
 *       surfaceClass(), radiusClass(), depthClass(), bevelClass()
 *
 * All OKLCH — zero hardcoded white/ or black/ opacity values.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import {
	radiusClass,
	surfaceClass,
	depthClass,
	bevelClass,
} from "../../utils.js";

registerRecipe({
	id: "panel.matte.flat",
	kind: "panel",
	label: "Matte Flat Panel",
	defaults: {
		surface: "matte",
		accent: "teal",
		radius: "md",
		depth: 1,
		glow: "off",
		bevel: "off",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		root: cn(
			surfaceClass(props.surface, "dark"),
			radiusClass(props.radius),
			depthClass(props.depth),
			bevelClass(props.bevel),
			"border border-[var(--panel-border)]",
			"overflow-hidden",
			"flex flex-col",
		),
		header: cn(
			"px-4 py-3",
			"border-b border-[var(--panel-header-border)]",
			"text-sm text-text-secondary",
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
