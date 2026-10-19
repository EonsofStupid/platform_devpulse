/**
 * @file Card Types
 * @kind card
 */

import type { HTMLAnchorAttributes, HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";
import type { PresetId, SemanticIntent } from "#coldlight/visual/preset-id.js";

export type CardVariant = "default" | "outlined" | "elevated" | "ghost" | "glow";
export type CardPreset = SemanticIntent | PresetId | (string & {});
export type CardOrientation = "vertical" | "horizontal";
export type CardAs = "div" | "a" | "button";

export interface CardProps
	extends UIBaseProps,
		Omit<HTMLAttributes<HTMLElement>, "children" | "class"> {
	/** Render as div (default), anchor, or button. */
	as?: CardAs;
	/** Layout direction. Default: "vertical". */
	orientation?: CardOrientation;
	/** Visual variant — maps to styleId. Default: "default". */
	variant?: CardVariant;
	/** Visual preset — maps to style preset. Default: "default". */
	preset?: CardPreset;
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
