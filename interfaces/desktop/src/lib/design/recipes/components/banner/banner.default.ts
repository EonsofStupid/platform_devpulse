/**
 * @file Banner Recipe — Glass Void
 * @id banner.glass.void
 * @kind banner
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * Recipe for the ColdLight banner component.
 * Fully prop-driven via DsSurfaceProps.
 *
 * ALL spacing, sizing, and typography values reference the SD5 token scale.
 * The --spacing-N naming is literal: N = pixel value at base font size.
 *   px-12 = --spacing-12 = 0.75rem = 12px
 *   py-8  = --spacing-8  = 0.5rem  = 8px
 *   gap-8 = --spacing-8  = 0.5rem  = 8px
 *
 * Token strategy:
 *   - Spacing:   --spacing-* (SD5 primitives, px→rem transformed)
 *   - Sizing:    --size-* (icon/component sizes)
 *   - Typography: --text-* (font sizes via @theme)
 *   - Component:  --banner-bg, --banner-border (semantic)
 *   - Text:       text-text-primary, text-text-secondary, text-text-muted
 *   - Encoding:   emitSegments(), radiusClass()
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { toPreset } from "../../types.js";
import { emitSegments, radiusClass } from "../../utils.js";

/**
 * Token-backed size scale.
 *
 * Spacing utilities map to --spacing-N where N = pixel value:
 *   px-12 = 12px = 0.75rem, py-8 = 8px = 0.5rem, etc.
 *
 * Icon sizes use --size-* tokens:
 *   size-3xs = 1rem (16px), size-2xs = 1.25rem (20px), size-xs = 1.5rem (24px)
 */
const SIZE_SCALE = {
	sm: {
		root: "px-12 py-8 gap-8 text-sm",
		icon: "size-3xs",
		dismiss: "p-2",
	},
	md: {
		root: "px-16 py-12 gap-12 text-sm",
		icon: "size-2xs",
		dismiss: "p-4",
	},
	lg: {
		root: "px-20 py-16 gap-16 text-base",
		icon: "size-xs",
		dismiss: "p-6",
	},
} as const;

registerRecipe({
	id: "banner.glass.void",
	kind: "banner",
	label: "Glass Void Banner",
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
				"flex items-center",
				s.root,
				emitSegments(toPreset(props)),
				"border-b border-[var(--banner-border)]",
				"bg-[var(--banner-bg)]",
			),
			icon: cn("shrink-0", s.icon, "text-text-secondary"),
			content: cn("flex-1 text-text-primary"),
			action: cn("shrink-0"),
			dismiss: cn(
				s.dismiss,
				radiusClass(props.radius === "lg" ? "md" : props.radius),
				"text-text-muted hover:text-text-primary",
				"transition-colors duration-fast",
			),
		};
	},
});
