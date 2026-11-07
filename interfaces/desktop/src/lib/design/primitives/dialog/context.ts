/**
 * @file Dialog Primitive Context
 * @description Svelte context for compound dialog coordination.
 * Root sets context, sub-components read it.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:dialog");

/** Dialog context shape */
export type DialogContext = {
	readonly open: boolean;
};

/** Set dialog context (called by Dialog root) */
export function setDialogContext(ctx: DialogContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get dialog context (called by sub-components) */
export function getDialogContext(): DialogContext {
	return getContext<DialogContext>(CTX_KEY);
}
