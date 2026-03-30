/**
 * @file Alert Component Types
 * @kind alert
 * @layer components
 *
 * Alert is inline contextual feedback — role="alert", lives in document flow.
 * NOT a dialog. NOT modal. For confirmations, use AlertDialog.
 *
 * Compound: Root, Icon, Title, Description, Action (dismiss area).
 * Controlled/uncontrolled open state. Dismissible.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { UIBaseProps } from "$lib/design/components/_base/types.js";

// =============================================================================
// SHARED
// =============================================================================

export type AlertVariant = "info" | "success" | "warning" | "error";

export const ALERT_VARIANT_PRESETS: Record<AlertVariant, string> = {
	info: "alert-info",
	success: "alert-success",
	warning: "alert-warning",
	error: "alert-error",
};

export interface AlertOpenChangeDetails {
	open: boolean;
}

export interface AlertIds {
	root?: string;
	icon?: string;
	title?: string;
	description?: string;
	action?: string;
}

// =============================================================================
// ROOT
// =============================================================================

export interface AlertRootProps
	extends UIBaseProps,
		Omit<HTMLAttributes<HTMLDivElement>, "children" | "class" | "dir"> {
	ids?: Partial<AlertIds>;
	variant?: AlertVariant;
	open?: boolean;
	defaultOpen?: boolean;
	onOpenChange?: (details: AlertOpenChangeDetails) => void;
	dismissible?: boolean;
	dir?: "ltr" | "rtl";
}

// =============================================================================
// SUB-COMPONENTS
// =============================================================================

interface AlertSlotProps extends Omit<HTMLAttributes<HTMLElement>, "children"> {
	children?: Snippet;
	class?: string;
}

export interface AlertIconProps extends AlertSlotProps {}
export interface AlertTitleProps extends AlertSlotProps {}
export interface AlertDescriptionProps extends AlertSlotProps {}
export interface AlertActionProps extends AlertSlotProps {}
