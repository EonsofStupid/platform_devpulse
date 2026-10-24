/**
 * @file Card Types
 * @kind card
 */

import type { HTMLAnchorAttributes, HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "#coldlight/components/_base/types.js";
import type { SurfaceFamily } from "#coldlight/renderforge/generated/surfaces.js";
import type { CardVariant } from "./card.generated.js";

export type { CardVariant } from "./card.generated.js";
export type CardOrientation = "vertical" | "horizontal";
export type CardAs = "div" | "a" | "button";

export interface CardProps
	extends UIBaseProps,
		Omit<HTMLAttributes<HTMLElement>, "children" | "class"> {
	/** Render as div (default), anchor, or button. */
	as?: CardAs;
	/** Layout direction. Default: "vertical". */
	orientation?: CardOrientation;
	/** Surface role, from card.tokens.json; the family in scope supplies it. Default: "elevated" */
	variant?: CardVariant;
	/** Family for this card and what it contains; unset, it takes the family in scope. */
	surface?: SurfaceFamily;
	/** Optional accessible label. */
	label?: string;
	/** ID of element that labels this card. */
	labelledBy?: string;
	/** When as="a" — the link href. */
	href?: string;
	/** When as="a" — link target. */
	target?: HTMLAnchorAttributes["target"];
	/** Disabled state: dims the card and stops pointer events. */
	disabled?: boolean;
}
