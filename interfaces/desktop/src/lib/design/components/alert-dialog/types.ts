/**
 * @file AlertDialog Component Types
 * @kind alert-dialog
 * @layer components
 *
 * Confirmation/destructive action dialog. role="alertdialog".
 * Focus trapped. Cancel + action buttons.
 * Compound: Root, Trigger, Overlay, Content, Title, Description, Cancel, Action.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/alertdialog/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { PreparedComponentProps } from "$lib/design/components/_base/types.js";

export type AlertDialogVariant = "confirmation" | "information" | "destructive" | "error" | "warning";
export type AlertDialogSize = "sm" | "md" | "lg";

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

export interface AlertDialogRootProps extends PreparedComponentProps {
	ids?: Partial<AlertDialogIds>;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (details: AlertDialogOpenChangeDetails) => void;
	variant?: AlertDialogVariant;
	size?: AlertDialogSize;
	dir?: "ltr" | "rtl";
	onCancel?: () => void;
	onAction?: () => void;
	children?: Snippet;
}

interface AlertDialogSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
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
