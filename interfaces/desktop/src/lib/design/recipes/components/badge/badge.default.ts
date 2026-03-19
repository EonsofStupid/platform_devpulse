/**
 * @file Badge Recipe — Glass Void
 * @id badge.glass.void
 * @kind badge
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight badge primitive.
 * Fully prop-driven via DsSurfaceProps.
 *
 * Token strategy:
 *   - Component tokens (from tokens.css, semantic → OKLCH):
 *       --badge-bg       → var(--surface-elevated)
 *       --badge-border   → var(--border-subtle)
 *       --badge-text     → var(--text-primary)
 *   - Encoding emitters:
 *       emitSegments()
 *
 * Intent via accent token. Size variants (sm/md/lg) drive height, padding, font-size.
 * All OKLCH — zero hardcoded colors.
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments } from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "h-5 px-1.5 text-xs" },
	md: { root: "h-6 px-2.5 text-xs" },
	lg: { root: "h-7 px-3 text-sm" },
} as const;

registerRecipe({
	id: "badge.glass.void",
	kind: "badge",
	label: "Glass Void Badge",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z1",
		bevel: "subtle",
		glow: "none",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "full",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn(
				"inline-flex items-center justify-center",
				s.root,
				"rounded-full",
				"font-medium",
				emitSegments(toPreset(props)),
				"border border-[var(--badge-border)]",
				"bg-[var(--badge-bg)]",
				"text-[var(--badge-text)]",
			),
		};
	},
});
