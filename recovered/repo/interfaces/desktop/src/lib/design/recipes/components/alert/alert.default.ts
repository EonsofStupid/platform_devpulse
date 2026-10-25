/**
 * @file Alert Recipe — Glass Void
 * @id alert.glass.void
 * @kind alert
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Token-backed recipe for the Alert compound component.
 * All spacing uses SD5 token scale (N = pixel value).
 *
 * Slot keys: root, icon, title, description, action, dismiss
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

const SIZE_SCALE = {
	sm: {
		root: "gap-8 p-12 text-sm",
		icon: "size-3xs",
		title: "text-sm",
		description: "text-xs",
	},
	md: {
		root: "gap-12 p-16 text-sm",
		icon: "size-2xs",
		title: "text-sm",
		description: "text-sm",
	},
	lg: {
		root: "gap-16 p-20 text-base",
		icon: "size-xs",
		title: "text-base",
		description: "text-sm",
	},
} as const;

registerRecipe({
	id: "alert.glass.void",
	kind: "alert",
	label: "Glass Void Alert",
	defaults: {
		surface: "glass-void",
		material: "none",
		depth: "z2",
		bevel: "soft",
		glow: "teal",
		frame: "none",
		motion: "none",
		transition: "none",
		radius: "lg",
		size: "md",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => {
		const s = SIZE_SCALE[props.size];

		return {
			root: cn(
				"flex",
				s.root,
				emitSegments(toPreset(props)),
				radiusClass(props.radius),
				"border border-[var(--alert-border)]",
				"bg-[var(--alert-bg)]",
			),
			icon: cn("shrink-0", s.icon, "text-[var(--alert-border)]"),
			title: cn("font-semibold text-text-primary", s.title),
			description: cn("text-text-secondary", s.description),
			action: cn("shrink-0"),
			dismiss: cn(
				"shrink-0 cursor-pointer p-4",
				"text-text-muted hover:text-text-primary",
				"transition-colors",
			),
		};
	},
});
