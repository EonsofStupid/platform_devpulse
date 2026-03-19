/**
 * @file Card Types
 * @kind card
 * @layer components
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";
import type { BaseProps } from "$lib/design/utils/cn.js";

export type CardVariant = "default" | "outlined" | "elevated" | "ghost" | "glow";
export type CardSize = "sm" | "md" | "lg";

export const CARD_VARIANT_PRESETS: Record<CardVariant, string> = {
	default: "card-default",
	outlined: "card-default",
	ghost: "card-default",
	elevated: "card-elevated",
	glow: "card-glow",
};

export interface CardProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children">,
		BaseProps,
		ColdLightProps {
	children?: Snippet;
	label?: string;
	labelledBy?: string;
	variant?: CardVariant;
	size?: CardSize;
}
