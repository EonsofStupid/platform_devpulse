/**
 * @file Pagination Primitive Context
 * @description Svelte context for compound pagination coordination.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:pagination");

/** Pagination context shape */
export type PaginationContext = {
	readonly page: number;
};

/** Set pagination context — called by Pagination root */
export function setPaginationContext(ctx: PaginationContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get pagination context — called by Pagination sub-components */
export function getPaginationContext(): PaginationContext {
	return getContext<PaginationContext>(CTX_KEY);
}
