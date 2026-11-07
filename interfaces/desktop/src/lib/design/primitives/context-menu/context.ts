/**
 * @file ContextMenu Primitive Context
 * @description Svelte context for context-menu compound primitive.
 * Symbol-keyed, get/set pattern, reactive via getter.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:context-menu");

/** ContextMenu context shape */
export type ContextMenuContext = {
	readonly open: boolean;
};

/** Set context-menu context (called by ContextMenu root) */
export function setContextMenuContext(ctx: ContextMenuContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get context-menu context (called by context-menu sub-components) */
export function getContextMenuContext(): ContextMenuContext {
	return getContext<ContextMenuContext>(CTX_KEY);
}
