/**
 * @file HoverCard Primitive Context
 * @description Svelte context for compound hover-card coordination.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:hover-card");

/** HoverCard context shape */
export type HoverCardContext = {
	readonly open: boolean;
};

/** Set hover-card context — called by HoverCard root */
export function setHoverCardContext(ctx: HoverCardContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get hover-card context — called by hover-card sub-components */
export function getHoverCardContext(): HoverCardContext {
	return getContext<HoverCardContext>(CTX_KEY);
}
