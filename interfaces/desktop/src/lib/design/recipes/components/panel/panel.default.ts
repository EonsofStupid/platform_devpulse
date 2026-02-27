/**
 * @file Panel Recipe — Glass Void
 * @id panel.glass.void
 * @kind panel
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Gold standard recipe for the ColdLight panel container component.
 * Fully prop-driven via DsSurfaceProps — size, radius, depth, glow, bevel
 * all flow through from the recipe registry.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --panel-bg             → var(--surface-primary)
 *       --panel-border         → var(--border-soft)
 *       --panel-header-border  → var(--border-subtle)
 *       --panel-depth          → var(--depth-panel)
 *   - Semantic text tokens (from @theme in tailwind.css):
 *       text-text-primary, text-text-secondary
 *   - Molecule utilities (from recipes/utils.ts):
 *       surfaceClass(), radiusClass(), depthClass(), glowClass(), bevelClass()
 *
 * All OKLCH — zero hardcoded white/ or black/ opacity values.
 *
 * Theming: Tokens resolve via CSS custom properties.
 *   Default (dark): values set on :root in tokens.css.
 *   Light/custom:   override --panel-* or semantic tokens via
 *                   [data-theme="light"] selector in CSS layer.
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

registerRecipe({
	id: "panel.glass.void",
	kind: "panel",
	label: "Glass Void Panel",
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
			surfaceClass(props.surface, props.variant ?? "void"),
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
			"text-sm font-medium text-text-primary",
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
