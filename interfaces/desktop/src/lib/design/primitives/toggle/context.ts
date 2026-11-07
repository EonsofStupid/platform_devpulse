/**
 * @file Toggle Primitive Context
 * @description Svelte context for toggle pressed state coordination.
 * Root sets context, parent compounds (ToggleGroup) read it.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:toggle");

/** Toggle context shape */
export type ToggleContext = {
	readonly pressed: boolean;
};

/** Set toggle context (called by Toggle root) */
export function setToggleContext(ctx: ToggleContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get toggle context (called by toggle sub-components) */
export function getToggleContext(): ToggleContext {
	return getContext<ToggleContext>(CTX_KEY);
}
