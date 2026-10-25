/**
 * @file Code Recipe — Glass Void
 * @id code.glass.void
 * @kind code
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Token-backed recipe for InlineCode and CodeBlock components.
 *
 * All spacing uses SD5 token scale (N = pixel value):
 *   px-8 = 8px, py-4 = 4px, px-16 = 16px, py-12 = 12px, gap-8 = 8px
 *
 * Typography uses --font-mono from theme/typography.css.
 *
 * Slot keys: inline, root, header, content, copyButton, lineNumbers
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

registerRecipe({
	id: "code.glass.void",
	kind: "code",
	label: "Glass Void Code",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z1",
		bevel: "subtle",
		glow: "none",
		frame: "soft",
		motion: "none",
		transition: "none",
		radius: "md",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		inline: cn(
			"code-inline",
			"font-mono text-sm",
			"px-6 py-2",
			"bg-[var(--color-void-900)] text-[var(--color-teal-300)]",
			radiusClass("sm"),
		),
		root: cn(
			"code-block",
			emitSegments(toPreset(props)),
			radiusClass(props.radius),
			"overflow-hidden",
		),
		header: cn(
			"code-header",
			"flex items-center justify-between",
			"px-16 py-8",
			"border-b border-[var(--border-subtle)]",
			"text-xs font-mono text-text-secondary",
		),
		content: cn(
			"code-content",
			"overflow-x-auto",
			"px-16 py-12",
			"font-mono text-sm leading-relaxed",
		),
		copyButton: cn(
			"code-copy",
			"shrink-0 cursor-pointer",
			"p-4",
			"text-text-muted hover:text-text-primary",
			"transition-colors",
			radiusClass("sm"),
		),
		lineNumbers: cn(
			"code-line-numbers",
			"select-none",
			"pe-12 text-end",
			"text-text-muted",
		),
	}),
});
