/**
 * @file Dialog Component Types
 * @kind dialog
 * @layer components
 *
 * Prop types for all Dialog sub-components.
 * Root provides adapter via context; sub-components spread slot attrs.
 */

import type { Snippet } from "svelte";
import type {
	HTMLAttributes,
	HTMLButtonAttributes,
	HTMLDialogAttributes,
} from "svelte/elements";

/** Dialog root props — creates adapter and provides context */
export interface DialogProps {
	/** Whether the dialog is open */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (value: boolean) => void;
	/** Close on Escape key (default: true) */
	closeOnEscape?: boolean;
	/** Close on outside click (default: true) */
	closeOnOutsideClick?: boolean;
	/** Prevent scroll when open (default: true) */
	preventScroll?: boolean;
	/** Content */
	children?: Snippet;
}

/** DialogTrigger props — button that opens the dialog */
export interface DialogTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	children?: Snippet;
}

/** DialogContent props — main content area (native <dialog> element) */
export interface DialogContentProps extends Omit<HTMLDialogAttributes, "style" | "children"> {
	children?: Snippet;
}

/** DialogOverlay props — backdrop overlay */
export interface DialogOverlayProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {}

/** DialogHeader props — header section wrapper */
export interface DialogHeaderProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
}

/** DialogFooter props — footer section wrapper */
export interface DialogFooterProps extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {
	children?: Snippet;
}

/** DialogTitle props — title with aria linking */
export interface DialogTitleProps extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children"> {
	children?: Snippet;
}

/** DialogDescription props — description with aria linking */
export interface DialogDescriptionProps extends Omit<HTMLAttributes<HTMLParagraphElement>, "style" | "children"> {
	children?: Snippet;
}

/** DialogClose props — close button */
export interface DialogCloseProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	children?: Snippet;
}
