/**
 * @file Tooltip Primitive Context
 * @description Svelte context for tooltip compound primitive.
 * Symbol-keyed, get/set pattern, reactive via getter.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:tooltip");

/** Tooltip context shape */
export type TooltipContext = {
	readonly open: boolean;
};

/** Set tooltip context (called by Tooltip root) */
export function setTooltipContext(ctx: TooltipContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get tooltip context (called by tooltip sub-components) */
export function getTooltipContext(): TooltipContext {
	return getContext<TooltipContext>(CTX_KEY);
}
