/**
 * @file Collapsible Primitive Context
 * @description Svelte context for compound collapsible coordination.
 * Root sets context, sub-components read it.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:collapsible");

/** Collapsible context shape */
export type CollapsibleContext = {
	readonly open: boolean;
	readonly disabled: boolean;
};

/** Set collapsible context (called by Collapsible root) */
export function setCollapsibleContext(ctx: CollapsibleContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get collapsible context (called by sub-components) */
export function getCollapsibleContext(): CollapsibleContext {
	return getContext<CollapsibleContext>(CTX_KEY);
}
