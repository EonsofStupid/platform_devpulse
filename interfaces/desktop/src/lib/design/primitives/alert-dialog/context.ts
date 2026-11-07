/**
 * @file AlertDialog Primitive Context
 * @description Svelte context for alert-dialog compound primitive.
 * Symbol-keyed, get/set pattern, reactive via getter.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:alert-dialog");

/** AlertDialog context shape */
export type AlertDialogContext = {
	readonly open: boolean;
};

/** Set alert-dialog context (called by AlertDialog root) */
export function setAlertDialogContext(ctx: AlertDialogContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get alert-dialog context (called by alert-dialog sub-components) */
export function getAlertDialogContext(): AlertDialogContext {
	return getContext<AlertDialogContext>(CTX_KEY);
}
