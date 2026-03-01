/**
 * @file Toggle Recipe — Glass Void
 * @id toggle.glass.void
 * @kind toggle
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight toggle primitive.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --toggle-bg             → var(--surface-primary)
 *       --toggle-border         → var(--border-subtle)
 *       --toggle-border-focus   → var(--border-focus)
 *       --toggle-pressed-bg     → var(--surface-elevated)
 *   - Semantic text tokens:
 *       text-text-primary, text-text-secondary
 *   - Encoding emitters:
 *       emitSegments(), radiusClass()
 *
 * Size variants (sm/md/lg) drive height and padding.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/primitives/types.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "h-8 px-2 text-sm" },
	md: { root: "h-9 px-3 text-sm" },
	lg: { root: "h-10 px-4 text-base" },
} as const;

registerRecipe({
	id: "toggle.glass.void",
	kind: "toggle",
	label: "Glass Void Toggle",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z1",
		bevel: "subtle",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "md",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn(
				"inline-flex items-center justify-center",
				s.root,
				radiusClass(props.radius),
				emitSegments(toPreset(props)),
				"border border-[var(--toggle-border)]",
				"bg-[var(--toggle-bg)]",
				"text-text-secondary",
				"transition-colors duration-fast",
				"hover:bg-[var(--toggle-pressed-bg)] hover:text-text-primary",
				"data-[state=on]:bg-[var(--toggle-pressed-bg)] data-[state=on]:text-text-primary",
				"focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--toggle-border-focus)]",
				"disabled:pointer-events-none disabled:opacity-50",
			),
		};
	},
});
