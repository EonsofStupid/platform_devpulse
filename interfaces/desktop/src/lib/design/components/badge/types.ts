/**
 * @file Badge Types
 * @kind badge
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type BadgeIntent = "default" | "info" | "success" | "warning" | "error";
export type BadgeSize = "sm" | "md" | "lg";

export const BADGE_INTENT_PRESETS: Record<BadgeIntent, string> = {
	default: "badge-ghost",
	info: "badge-signal",
	success: "badge-accent",
	warning: "badge-signal",
	error: "badge-signal",
};

export interface BadgeProps
	extends Omit<HTMLAttributes<HTMLSpanElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	decorative?: boolean;
	intent?: BadgeIntent;
	size?: BadgeSize;
}
