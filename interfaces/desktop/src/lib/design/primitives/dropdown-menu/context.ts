/**
 * @file DropdownMenu Primitive Context
 * @description Svelte context for compound dropdown-menu coordination.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:dropdown-menu");

/** DropdownMenu context shape */
export type DropdownMenuContext = {
	readonly open: boolean;
};

/** Set dropdown-menu context — called by DropdownMenu root */
export function setDropdownMenuContext(ctx: DropdownMenuContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get dropdown-menu context — called by dropdown-menu sub-components */
export function getDropdownMenuContext(): DropdownMenuContext {
	return getContext<DropdownMenuContext>(CTX_KEY);
}
