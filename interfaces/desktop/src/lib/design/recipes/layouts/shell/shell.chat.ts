/**
 * @file Chat Shell Recipe — Glass Deep (Gold Standard)
 * @id shell.chat.default
 * @kind shell
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (shell-chat-*) handle layout/positioning
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 *
 * Output example:
 *   frame: "shell-chat-frame rounded-lg"
 *   topbar: "shell-chat-topbar v-deep s-glass e-2"
 *
 * Slot keys match chat shell layout:
 *   frame, topbar, modeSelector, dashboard, footer
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import {
	variantShortcode,
	surfaceShortcode,
	elevationShortcode,
	sizeShortcode,
	radiusClass,
} from "../../utils.js";

registerRecipe({
	id: "shell.chat.default",
	kind: "shell",
	label: "Chat Shell",
	defaults: {
		accent: "teal",
		surface: "glass",
		variant: "deep",
		size: "md",
		radius: "lg",
		depth: 2,
		glow: "off",
		bevel: "subtle",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		frame: cn(
			"shell-chat-frame",
			radiusClass(props.radius),
		),
		topbar: cn(
			"shell-chat-topbar",
			variantShortcode(props.variant ?? "deep"),
			surfaceShortcode(props.surface),
			elevationShortcode(props.depth),
		),
		modeSelector: cn(
			"shell-chat-mode",
			variantShortcode(props.variant ?? "deep"),
			surfaceShortcode(props.surface),
		),
		dashboard: "shell-chat-dashboard",
		footer: cn(
			"shell-chat-footer",
			variantShortcode(props.variant ?? "deep"),
			surfaceShortcode(props.surface),
		),
	}),
});
