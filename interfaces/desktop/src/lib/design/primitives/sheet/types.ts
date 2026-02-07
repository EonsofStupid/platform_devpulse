/**
 * @file Sheet Primitive Types
 * @description Structural type declarations for the sheet primitive.
 * Aligned to taxonomy contract: kind="sheet"
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA + state.
 */

import type { Snippet } from "svelte";
import type { BaseProps, OmitStyle } from "../types.js";

/** Sheet root — context provider, no DOM */
export interface SheetProps extends BaseProps {
	/** Controlled open state */
	open?: boolean;
	/** Content */
	children?: Snippet;
}

/** Sheet trigger — button that opens the sheet */
export interface SheetTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** Sheet portal — teleport container */
export interface SheetPortalProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Sheet overlay — backdrop behind sheet */
export interface SheetOverlayProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Sheet content — the side panel */
export interface SheetContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Sheet header — layout container within content */
export interface SheetHeaderProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Sheet footer — layout container within content */
export interface SheetFooterProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** Sheet title — heading */
export interface SheetTitleProps extends OmitStyle<HTMLHeadingElement>, BaseProps {
	children?: Snippet;
}

/** Sheet description — supporting text */
export interface SheetDescriptionProps extends OmitStyle<HTMLParagraphElement>, BaseProps {
	children?: Snippet;
}

/** Sheet close — dismiss button */
export interface SheetCloseProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}
