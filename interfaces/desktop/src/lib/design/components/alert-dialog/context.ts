/**
 * @file AlertDialog Context — Svelte context for compound component communication
 * @kind alert-dialog
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 * Root sets context; sub-components consume it.
 */

import { getContext, setContext } from "svelte";

export interface AlertDialogContext {
	/** Whether the alert dialog is open */
	readonly open: boolean;
	/** Set the open state */
	setOpen(value: boolean): void;
	/** Generated ID for the title element */
	readonly titleId: string;
	/** Generated ID for the description element */
	readonly descriptionId: string;
	/** Generated ID for the content element */
	readonly contentId: string;
	/** Register trigger element for focus restore */
	registerTrigger(el: HTMLElement): void;
	/** Register cancel element for initial focus */
	registerCancel(el: HTMLElement): void;
	/** Register content element for focus trap */
	registerContent(el: HTMLDialogElement): void;
}

const ALERT_DIALOG_CTX = Symbol("coldlight-alert-dialog");

export function setAlertDialogContext(ctx: AlertDialogContext): void {
	setContext(ALERT_DIALOG_CTX, ctx);
}

export function getAlertDialogContext(): AlertDialogContext {
	return getContext<AlertDialogContext>(ALERT_DIALOG_CTX);
}
