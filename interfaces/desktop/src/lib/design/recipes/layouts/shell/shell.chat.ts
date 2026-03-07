/**
 * @file Chat Shell Recipe
 * @id shell.chat.default
 * @kind shell
 * @layer recipes
 *
 * Cyberpunk HUD chat shell — deep gradient background, glowing teal borders,
 * visible glass depth on panels. Matches CHAT-REFERENCE-01/02.
 *
 * All color references use token TW utilities or var() refs to component tokens.
 * Zero hardcoded oklch values.
 */

import { cn } from "$lib/design/utils/cn.js";
import { registerRecipe } from "../../index.js";
import type { DsSurfaceProps } from "../../types.js";
import { radiusClass } from "../../utils.js";

registerRecipe({
	id: "shell.chat.default",
	kind: "shell",
	label: "Chat Shell",
	defaults: {
		surface: "glass-deep",
		material: "none",
		depth: "z2",
		bevel: "subtle",
		glow: "teal",
		frame: "glow",
		motion: "none",
		transition: "fast",
		size: "md",
		radius: "lg",
	},
	classes: (props: DsSurfaceProps): Record<string, string> => ({
		frame: cn(
			"flex flex-col h-screen w-full overflow-hidden",
			"bg-[linear-gradient(180deg,var(--chat-frame-bg-start),var(--chat-frame-bg-end))]",
			radiusClass(props.radius),
		),
		topbar: cn(
			"flex items-center justify-between",
			"h-10 px-4",
			"v-s2 v-b1",
			"border-b border-border-soft",
		),
		modeSelector: cn(
			"flex items-center gap-1 px-3 py-1",
			"border-b border-border-subtle",
		),
		dashboard: cn(
			"flex-1 overflow-y-auto scrollbar-thin",
			"p-4",
		),
		footer: cn(
			"flex items-center gap-2",
			"px-4 py-3",
			"v-s2 v-f4",
			"border-t border-border-soft",
		),
	}),
});
