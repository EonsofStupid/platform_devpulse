/**
 * @file App Shell Recipe — Glass Void (Gold Standard)
 * @id shell.app.default
 * @kind shell
 * @layer recipes
 * @package @devpulse/coldlight
 *
 * GOLD STANDARD recipe — shortcode class composition system.
 *
 * Class strategy:
 *   - Structural classes (shell-*) handle layout/positioning
 *   - Shortcode classes (v-*, s-*, e-*, sz-*) handle visual appearance
 *   - NO raw Tailwind utilities in recipe output
 *
 * Output example:
 *   frame: "shell-frame rounded-lg"
 *   topbar: "shell-topbar v-void s-glass e-2"
 *
 * Slot keys match 6-zone app shell layout:
 *   frame, topbar, sidebar, sidebarExpanded, content,
 *   context, contextExpanded, statusbar, overlay
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
	id: "shell.app.default",
	kind: "shell",
	label: "App Shell",
	defaults: {
		accent: "teal",
		surface: "glass",
		variant: "void",
		size: "md",
		radius: "lg",
		depth: 2,
		glow: "off",
		bevel: "subtle",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		frame: cn(
			"shell-frame",
			radiusClass(props.radius),
		),
		topbar: cn(
			"shell-topbar",
			variantShortcode(props.variant ?? "void"),
			surfaceShortcode(props.surface),
			elevationShortcode(props.depth),
		),
		sidebar: cn(
			"shell-sidebar shell-sidebar-collapsed",
			variantShortcode("deep"),
			surfaceShortcode(props.surface),
		),
		sidebarExpanded: cn(
			"shell-sidebar shell-sidebar-expanded",
			variantShortcode("smoke"),
			surfaceShortcode(props.surface),
		),
		content: "shell-content",
		context: cn(
			"shell-context shell-context-collapsed",
			variantShortcode("deep"),
			surfaceShortcode(props.surface),
		),
		contextExpanded: cn(
			"shell-context shell-context-expanded",
			variantShortcode("smoke"),
			surfaceShortcode(props.surface),
			elevationShortcode(props.depth),
		),
		statusbar: cn(
			"shell-statusbar",
			variantShortcode(props.variant ?? "void"),
			surfaceShortcode(props.surface),
		),
		overlay: "shell-overlay",
		overlayActive: "shell-overlay shell-overlay-active",
	}),
});
