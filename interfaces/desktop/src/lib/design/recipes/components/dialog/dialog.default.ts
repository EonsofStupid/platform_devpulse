/**
 * @file Dialog Recipe — Glass Void
 * @id dialog.glass.void
 * @kind dialog
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Gold standard recipe for the ColdLight dialog compound component.
 * Fully prop-driven via DsSurfaceProps — size, radius, depth, glow, bevel
 * all flow through from the recipe registry.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --dialog-bg            → var(--surface-overlay)
 *       --dialog-border        → var(--border-soft)
 *       --dialog-border-focus  → var(--border-focus)
 *       --dialog-depth         → var(--depth-modal)
 *       --dialog-overlay       → var(--color-void-950)
 *   - Semantic text tokens (from @theme in tailwind.css):
 *       text-text-primary, text-text-secondary, text-text-muted
 *   - Molecule utilities (from recipes/utils.ts):
 *       surfaceClass(), radiusClass(), depthClass(), glowClass(), bevelClass()
 *
 * Theming: Tokens resolve via CSS custom properties.
 *   Default (dark): values set on :root in tokens.css.
 *   Light/custom:   override --dialog-* or semantic tokens via
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
	id: "dialog.glass.void",
	kind: "dialog",
	label: "Glass Void Dialog",
	defaults: {
		surface: "glass",
		variant: "void",
		accent: "teal",
		radius: "lg",
		depth: 3,
		glow: "teal",
		bevel: "soft",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		overlay: cn(
			"fixed inset-0 z-40",
			"bg-[var(--dialog-overlay)]/60 backdrop-blur-md",
			"data-[state=open]:animate-in data-[state=open]:fade-in-0",
			"data-[state=closed]:animate-out data-[state=closed]:fade-out-0",
		),
		content: cn(
			"fixed left-1/2 top-1/2 z-50",
			"-translate-x-1/2 -translate-y-1/2",
			"w-full max-w-lg",
			surfaceClass(props.surface, props.variant ?? "void"),
			radiusClass(props.radius),
			depthClass(props.depth),
			glowClass(props.glow),
			bevelClass(props.bevel),
			"border border-[var(--dialog-border)]",
			"data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95",
			"data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
		),
		header: cn("flex flex-col gap-2 p-6 pb-4"),
		footer: cn("flex justify-end gap-3 p-6 pt-4"),
		title: cn("text-lg font-semibold tracking-tight text-text-primary"),
		description: cn("text-sm leading-relaxed text-text-secondary"),
		close: cn(
			"absolute right-4 top-4 rounded-md p-1.5",
			"text-text-muted hover:text-text-primary",
			"transition-colors duration-fast",
			"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--dialog-border-focus)]",
		),
		trigger: "",
		portal: "",
	}),
});
