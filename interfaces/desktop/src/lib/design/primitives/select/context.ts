/**
 * @file Select Primitive Context
 * @description Svelte context for select compound primitive.
 * Symbol-keyed, get/set pattern, reactive via getter.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:select");

/** Select context shape */
export type SelectContext = {
	readonly open: boolean;
};

/** Set select context (called by Select root) */
export function setSelectContext(ctx: SelectContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get select context (called by select sub-components) */
export function getSelectContext(): SelectContext {
	return getContext<SelectContext>(CTX_KEY);
}
