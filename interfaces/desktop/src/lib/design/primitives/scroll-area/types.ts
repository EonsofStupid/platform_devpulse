/**
 * @file ScrollArea Primitive Types
 * @description Structural type declarations for the scroll-area primitive.
 * Aligned to taxonomy contract: kind="scroll-area"
 * Slots: root, viewport, scrollbar, thumb, corner
 * ariaStateProvider: "coldlight" — native HTML handles semantics.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** ScrollArea root — scroll container wrapper */
export interface ScrollAreaProps
	extends OmitStyle<HTMLDivElement>,
		BaseProps {
	children?: Snippet;
}

/** ScrollArea viewport — scrollable content area */
export interface ScrollAreaViewportProps
	extends OmitStyle<HTMLDivElement>,
		BaseProps {
	children?: Snippet;
}

/** ScrollArea scrollbar — track for the scroll thumb */
export interface ScrollAreaScrollbarProps
	extends OmitStyle<HTMLDivElement>,
		BaseProps {
	orientation?: "horizontal" | "vertical";
	children?: Snippet;
}

/** ScrollArea thumb — draggable scroll indicator */
export interface ScrollAreaThumbProps
	extends OmitStyle<HTMLDivElement>,
		BaseProps {
	children?: Snippet;
}

/** ScrollArea corner — intersection of horizontal and vertical scrollbars */
export interface ScrollAreaCornerProps
	extends OmitStyle<HTMLDivElement>,
		BaseProps {
	children?: Snippet;
}
