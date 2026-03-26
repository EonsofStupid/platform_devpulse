/**
 * @file AlertDialog Context
 * @kind alert-dialog
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { UseAlertDialogReturn } from "$lib/design/behaviors/alert-dialog/alert-dialog.types.js";
import type { AlertDialogIds, AlertDialogVariant } from "./types.js";

export interface AlertDialogContext {
	readonly hook: UseAlertDialogReturn;
	readonly ids: Partial<AlertDialogIds>;
	readonly dir: "ltr" | "rtl";
	readonly variant: AlertDialogVariant;
}

const ALERT_DIALOG_CTX = Symbol("coldlight-alert-dialog");

export function setAlertDialogContext(ctx: AlertDialogContext): void {
	setContext(ALERT_DIALOG_CTX, ctx);
}

export function getAlertDialogContext(): AlertDialogContext {
	return getContext<AlertDialogContext>(ALERT_DIALOG_CTX);
}
