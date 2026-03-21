/**
 * @file Badge Recipe — Glass Void
 * @id badge.glass.void
 * @kind badge
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Token-backed recipe. All spacing uses SD5 token scale (N = pixel value).
 * h-[var(--size-2xs)] = 20px, px-6 = 6px, px-10 = 10px, etc.
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments } from "../../utils.js";

const SIZE_SCALE = {
	sm: { root: "h-[var(--size-2xs)] px-6 text-xs" },
	md: { root: "h-[var(--size-xs)] px-10 text-xs" },
	lg: { root: "h-[var(--size-sm)] px-12 text-sm" },
	xl: { root: "h-[var(--size-md)] px-14 text-sm" },
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
				"rounded-full font-medium",
				emitSegments(toPreset(props)),
				"border border-[var(--badge-border)]",
				"bg-[var(--badge-bg)]",
				"text-[var(--badge-text)]",
			),
		};
	},
});
