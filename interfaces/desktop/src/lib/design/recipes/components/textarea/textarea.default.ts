/**
 * @file Textarea Recipe — Glass Void
 * @id textarea.glass.void
 * @kind textarea
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight textarea primitive.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --textarea-bg            → var(--surface-primary)
 *       --textarea-border        → var(--border-subtle)
 *       --textarea-border-focus  → var(--border-focus)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-muted
 *   - Encoding emitters:
 *       emitSegments(), radiusClass()
 *
 * Size variants (sm/md/lg) drive padding, font-size, and min-height.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "p-2 text-sm min-h-16" },
	md: { root: "p-3 text-sm min-h-24" },
	lg: { root: "p-4 text-base min-h-32" },
} as const;

registerRecipe({
	id: "textarea.glass.void",
	kind: "textarea",
	label: "Glass Void Textarea",
	defaults: {
		s: 1,
		z: 0,
		d: 2,
		b: 2,
		g: 1,
		f: 0,
		m: 0,
		t: 0,
		radius: "lg",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn(
				"w-full bg-transparent",
				s.root,
				radiusClass(props.radius),
				emitSegments(toPreset(props)),
				"border border-[var(--textarea-border)]",
				"bg-[var(--textarea-bg)]",
				"text-text-primary",
				"placeholder:text-text-muted",
				"caret-[var(--textarea-border-focus)]",
				"transition-colors duration-fast",
				"resize-y",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--textarea-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
		};
	},
});
