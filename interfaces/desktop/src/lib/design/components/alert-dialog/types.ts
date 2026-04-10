/**
 * @file AlertDialog Component Types
 * @kind alert-dialog
 * @layer components
 *
 * Confirmation/destructive action dialog. role="alertdialog".
 * Focus trapped. Cancel + action buttons.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { AlertDialogPrimitiveProps } from "$lib/design/behaviors/overlays/alert-dialog/index.js";

export type AlertDialogVariant =
	| "confirmation"
	| "information"
	| "destructive"
	| "error"
	| "warning";
export type AlertDialogSize = "sm" | "md" | "lg";
export type AlertDialogPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface AlertDialogOpenChangeDetails {
	open: boolean;
}

export interface AlertDialogIds {
	trigger?: string;
	overlay?: string;
	content?: string;
	title?: string;
	description?: string;
	cancel?: string;
	action?: string;
}

export interface AlertDialogRootProps extends Omit<AlertDialogPrimitiveProps, "onOpenChange"> {
	ids?: Partial<AlertDialogIds>;
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: AlertDialogPreset;
	/** Semantic variant. Default: "confirmation" */
	variant?: AlertDialogVariant;
	/** Dialog size. Default: "md" */
	size?: AlertDialogSize;
	/** Default open state (uncontrolled). */
	defaultOpen?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (details: AlertDialogOpenChangeDetails) => void;
	/** Text direction. Default: "ltr" */
	dir?: "ltr" | "rtl";
	/** Callback when cancel button is pressed */
	onCancel?: () => void;
	/** Callback when action button is pressed */
	onAction?: () => void;
}

interface AlertDialogSlotProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface AlertDialogTriggerProps extends AlertDialogSlotProps {}
export interface AlertDialogOverlayProps extends AlertDialogSlotProps {}
export interface AlertDialogContentProps extends AlertDialogSlotProps {}
export interface AlertDialogTitleProps extends AlertDialogSlotProps {}
export interface AlertDialogDescriptionProps extends AlertDialogSlotProps {}
export interface AlertDialogCancelProps extends AlertDialogSlotProps {}
export interface AlertDialogActionProps extends AlertDialogSlotProps {}
