/**
 * @file Dialog Primitive Types
 * @description Structural type declarations for the dialog primitive.
 * Aligned to taxonomy contract: kind="dialog"
 * Slots: root, trigger, portal, overlay, content, title, description, close
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA via component layer.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** Dialog root — context provider, no DOM element */
export interface DialogProps extends BaseProps {
	/** Whether the dialog is open (bindable) */
	open?: boolean;
	/** Content */
	children?: Snippet;
}

/** DialogTrigger — button that opens dialog */
export interface DialogTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** DialogPortal — teleport container */
export interface DialogPortalProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DialogOverlay — backdrop behind dialog */
export interface DialogOverlayProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DialogContent — dialog panel */
export interface DialogContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** DialogTitle — heading */
export interface DialogTitleProps extends OmitStyle<HTMLHeadingElement>, BaseProps {
	children?: Snippet;
}

/** DialogDescription — descriptive text */
export interface DialogDescriptionProps extends OmitStyle<HTMLParagraphElement>, BaseProps {
	children?: Snippet;
}

/** DialogClose — close button */
export interface DialogCloseProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}
