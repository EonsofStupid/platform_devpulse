/**
 * @file Tooltip Primitive Types
 * @description Structural type declarations for the tooltip primitive.
 * Aligned to taxonomy contract: kind="tooltip"
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA via component layer.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Tooltip root — context provider, no DOM */
export interface TooltipProps extends BaseProps {
	/** Controlled open state */
	open?: boolean;
	/** Content */
	children?: Snippet;
}

/** TooltipTrigger — element that activates the tooltip */
export interface TooltipTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** TooltipContent — floating tooltip panel */
export interface TooltipContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** TooltipArrow — visual arrow pointing to trigger */
export interface TooltipArrowProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}
