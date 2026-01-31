/**
 * @file Popover Primitive Context
 * @description Svelte context for popover compound primitive.
 * Symbol-keyed, get/set pattern, reactive via getter.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:popover");

/** Popover context shape */
export type PopoverContext = {
	readonly open: boolean;
};

/** Set popover context (called by Popover root) */
export function setPopoverContext(ctx: PopoverContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get popover context (called by popover sub-components) */
export function getPopoverContext(): PopoverContext {
	return getContext<PopoverContext>(CTX_KEY);
}
