/**
 * @file Tabs Recipe — Glass Void
 * @id tabs.glass.void
 * @kind tabs
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Gold standard recipe for the ColdLight tabs compound component.
 * Fully prop-driven via DsSurfaceProps — size, radius, depth, glow, bevel
 * all flow through from the recipe registry.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --tabs-bg             → var(--surface-primary)
 *       --tabs-border         → var(--border-subtle)
 *       --tabs-border-focus   → var(--border-focus)
 *       --tabs-tab-hover      → var(--surface-elevated)
 *       --tabs-tab-active     → var(--surface-overlay)
 *       --tabs-indicator      → var(--color-teal-400)
 *   - Semantic text tokens (from @theme in tailwind.css):
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Molecule utilities (from recipes/utils.ts):
 *       surfaceClass(), radiusClass(), bevelClass()
 *
 * Size variants (sm/md/lg) drive per-slot padding and font-size.
 * All OKLCH — zero hardcoded white/ or black/ opacity values.
 *
 * Theming: Tokens resolve via CSS custom properties.
 *   Default (dark): values set on :root in tokens.css.
 *   Light/custom:   override --tabs-* or semantic tokens via
 *                   [data-theme="light"] selector in CSS layer.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import {
	radiusClass,
	surfaceClass,
	bevelClass,
} from "../../utils.js";

/**
 * Per-slot size dimensions: padding, font-size.
 * Keyed by SizeToken ("sm" | "md" | "lg").
 */
const SIZE_SCALE = {
	sm: {
		trigger: "px-2 py-1 text-xs",
		content: "p-3 text-sm",
	},
	md: {
		trigger: "px-3 py-1.5 text-sm",
		content: "p-4 text-sm",
	},
	lg: {
		trigger: "px-4 py-2 text-base",
		content: "p-6 text-base",
	},
} as const;

registerRecipe({
	id: "tabs.glass.void",
	kind: "tabs",
	label: "Glass Void Tabs",
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
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn("flex flex-col"),
			list: cn(
				surfaceClass(props.surface, props.variant ?? "void"),
				"flex flex-row items-center",
				"gap-1 p-1",
				"border-b border-[var(--tabs-border)]",
				radiusClass(props.radius),
				bevelClass(props.bevel),
			),
			trigger: cn(
				"inline-flex items-center justify-center",
				s.trigger,
				"text-text-muted",
				radiusClass(props.radius === "lg" ? "md" : props.radius),
				"transition-colors duration-fast",
				"hover:text-text-secondary hover:bg-[var(--tabs-tab-hover)]",
				"data-[state=active]:text-text-primary data-[state=active]:bg-[var(--tabs-tab-active)]",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--tabs-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
			content: cn(
				s.content,
				"text-text-secondary",
				"data-[state=visible]:animate-in data-[state=visible]:fade-in-0",
				"focus-visible:outline-none",
			),
		};
	},
});
