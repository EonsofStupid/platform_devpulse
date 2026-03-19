/**
 * @file AlertDialog Component Types
 * @kind alert-dialog
 * @layer components
 *
 * Prop types for all AlertDialog sub-components.
 * ColdLight-owned ARIA — extends dialog pattern with role="alertdialog".
 * Cancel button receives initial focus (safety pattern per APG).
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes, HTMLButtonAttributes, HTMLDialogAttributes } from "svelte/elements";
import type { ColdLightProps } from "$lib/design/components/_base/types.js";

/** AlertDialog root props — manages open state and provides context */
export interface AlertDialogProps extends ColdLightProps {
	/** Whether the alert dialog is open */
	open?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (value: boolean) => void;
	/** Content */
	children?: Snippet;
}

/** AlertDialogTrigger props — button that opens the alert dialog */
export interface AlertDialogTriggerProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	children?: Snippet;
}

/** AlertDialogOverlay props — backdrop overlay */
export interface AlertDialogOverlayProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children"> {}

/** AlertDialogContent props — main content area (native <dialog> element, role="alertdialog") */
export interface AlertDialogContentProps extends Omit<HTMLDialogAttributes, "style" | "children"> {
	children?: Snippet;
}

/** AlertDialogTitle props — title with aria linking */
export interface AlertDialogTitleProps
	extends Omit<HTMLAttributes<HTMLHeadingElement>, "style" | "children"> {
	children?: Snippet;
}

/** AlertDialogDescription props — description with aria linking */
export interface AlertDialogDescriptionProps
	extends Omit<HTMLAttributes<HTMLParagraphElement>, "style" | "children"> {
	children?: Snippet;
}

/** AlertDialogAction props — destructive/confirm action button */
export interface AlertDialogActionProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	children?: Snippet;
}

/** AlertDialogCancel props — cancel button (receives initial focus per APG safety pattern) */
export interface AlertDialogCancelProps extends Omit<HTMLButtonAttributes, "style" | "children"> {
	children?: Snippet;
}
