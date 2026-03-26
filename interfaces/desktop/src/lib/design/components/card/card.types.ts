/**
 * @file Card Types
 * @kind card
 */

import type { HTMLAttributes, HTMLAnchorAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";

export type CardVariant = "default" | "outlined" | "elevated" | "ghost" | "glow";
export type CardIntent = "default" | "stark" | "glass" | "flat" | "matte" | "primary" | "secondary" | "ghost" | "danger";
export type CardOrientation = "vertical" | "horizontal";
export type CardAs = "div" | "a" | "button";

export interface CardProps
	extends ComponentProps,
		Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	/** Render as div (default), anchor, or button. */
	as?: CardAs;
	/** Layout direction. Default: "vertical". */
	orientation?: CardOrientation;
	/** Visual variant — maps to styleId. Default: "default". */
	variant?: CardVariant;
	/** Visual intent — maps to style preset. Default: "default". */
	intent?: CardIntent;
	/** Optional accessible label. */
	label?: string;
	/** ID of element that labels this card. */
	labelledBy?: string;
	/** When as="a" — the link href. */
	href?: string;
	/** When as="a" — link target. */
	target?: HTMLAnchorAttributes["target"];
	/** When as="a" or as="button" — disabled state. */
	disabled?: boolean;
}
