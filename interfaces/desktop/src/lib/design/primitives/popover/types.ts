/**
 * @file Popover Primitive Types
 * @description Structural type declarations for the popover primitive.
 * Aligned to taxonomy contract: kind="popover"
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA via component layer.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Popover root — context provider, no DOM */
export interface PopoverProps extends BaseProps {
	/** Controlled open state */
	open?: boolean;
	/** Content */
	children?: Snippet;
}

/** PopoverTrigger — button that opens the popover */
export interface PopoverTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** PopoverContent — floating panel */
export interface PopoverContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** PopoverArrow — visual arrow pointing to trigger */
export interface PopoverArrowProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** PopoverClose — dismiss button */
export interface PopoverCloseProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}
