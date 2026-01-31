/**
 * @file AlertDialog Primitive Types
 * @description Structural type declarations for the alert-dialog primitive.
 * Aligned to taxonomy contract: kind="alert-dialog"
 * ariaStateProvider: "meltui" — dsAdapter provides ARIA via component layer.
 */

import type { Snippet } from "svelte";
import type { OmitStyle, BaseProps } from "../types.js";

/** AlertDialog root — context provider, no DOM */
export interface AlertDialogProps extends BaseProps {
	/** Controlled open state */
	open?: boolean;
	/** Content */
	children?: Snippet;
}

/** AlertDialogTrigger — button that opens the alert dialog */
export interface AlertDialogTriggerProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** AlertDialogPortal — teleport container */
export interface AlertDialogPortalProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** AlertDialogOverlay — backdrop */
export interface AlertDialogOverlayProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** AlertDialogContent — dialog panel */
export interface AlertDialogContentProps extends OmitStyle<HTMLDivElement>, BaseProps {
	children?: Snippet;
}

/** AlertDialogTitle — heading */
export interface AlertDialogTitleProps extends OmitStyle<HTMLHeadingElement>, BaseProps {
	children?: Snippet;
}

/** AlertDialogDescription — descriptive text */
export interface AlertDialogDescriptionProps extends OmitStyle<HTMLParagraphElement>, BaseProps {
	children?: Snippet;
}

/** AlertDialogAction — confirm action button */
export interface AlertDialogActionProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}

/** AlertDialogCancel — cancel/dismiss button */
export interface AlertDialogCancelProps extends OmitStyle<HTMLButtonElement>, BaseProps {
	children?: Snippet;
}
