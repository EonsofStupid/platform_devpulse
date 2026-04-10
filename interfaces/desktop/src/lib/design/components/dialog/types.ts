/**
 * @file Dialog Component Types
 * @kind dialog
 * @layer components
 *
 * Modal overlay dialog. Focus trap, scroll lock, escape dismiss.
 * Compound: Root, Trigger, Overlay, Content, Header, Title, Description, Footer, Close.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { DialogPrimitiveProps } from "$lib/design/behaviors/overlays/dialog/index.js";

// =============================================================================
// SHARED
// =============================================================================

export type DialogSize = "sm" | "md" | "lg" | "xl" | "fullscreen";
export type DialogPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface DialogOpenChangeDetails {
	open: boolean;
}

export interface DialogIds {
	trigger?: string;
	overlay?: string;
	content?: string;
	title?: string;
	description?: string;
	close?: string;
}

// =============================================================================
// ROOT
// =============================================================================

export interface DialogRootProps extends Omit<DialogPrimitiveProps, "onOpenChange"> {
	ids?: Partial<DialogIds>;
	/** Visual preset — selects style configuration. Default: "default" */
	preset?: DialogPreset;
	/** Dialog content size. Default: "md" */
	size?: DialogSize;
	/** Whether clicking outside dismisses the dialog. Default: true */
	isDismissible?: boolean;
	/** Whether Escape key dismissal is disabled. Default: false */
	isKeyboardDismissDisabled?: boolean;
	/** Text direction for RTL support. Default: "ltr" */
	dir?: "ltr" | "rtl";
	/** Callback when exit animation completes */
	onExitComplete?: () => void;
	/** Default open state (uncontrolled). */
	defaultOpen?: boolean;
	/** Callback when open state changes */
	onOpenChange?: (details: DialogOpenChangeDetails) => void;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface DialogSlotProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface DialogTriggerProps extends DialogSlotProps {}
export interface DialogOverlayProps extends DialogSlotProps {}
export interface DialogContentProps extends DialogSlotProps {}
export interface DialogHeaderProps extends DialogSlotProps {}
export interface DialogTitleProps extends DialogSlotProps {}
export interface DialogDescriptionProps extends DialogSlotProps {}
export interface DialogFooterProps extends DialogSlotProps {}
export interface DialogCloseProps extends DialogSlotProps {}
