/**
 * @file Dialog Component Types
 * @kind dialog
 * @layer components
 *
 * Modal overlay dialog. Focus trap, scroll lock, escape dismiss.
 * Compound: Root, Trigger, Overlay, Content, Header, Title, Description, Footer, Close.
 * Behavioral — uses useDialog() primitive hook.
 *
 * WAI-ARIA APG: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { PreparedComponentProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// SHARED
// =============================================================================

export type DialogSize = "sm" | "md" | "lg" | "xl" | "fullscreen";

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

export interface DialogRootProps extends Omit<PreparedComponentProps, "size"> {
	ids?: Partial<DialogIds>;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (details: DialogOpenChangeDetails) => void;
	size?: DialogSize;
	isDismissible?: boolean;
	isKeyboardDismissDisabled?: boolean;
	preventScroll?: boolean;
	dir?: "ltr" | "rtl";
	onExitComplete?: () => void;
	children?: Snippet;
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface DialogSlotProps extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
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
