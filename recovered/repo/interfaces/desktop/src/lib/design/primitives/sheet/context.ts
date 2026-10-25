/**
 * @file Sheet Primitive Context
 * @description Svelte context for sheet compound primitive.
 * Symbol-keyed, get/set pattern, reactive via getter.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:sheet");

/** Sheet context shape */
export type SheetContext = {
	readonly open: boolean;
};

/** Set sheet context (called by Sheet root) */
export function setSheetContext(ctx: SheetContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get sheet context (called by sheet sub-components) */
export function getSheetContext(): SheetContext {
	return getContext<SheetContext>(CTX_KEY);
}
