/**
 * @file Switch Primitive Context
 * @description Svelte context for compound switch coordination.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:switch");

/** Switch context shape */
export type SwitchContext = {
	readonly checked: boolean;
};

/** Set switch context — called by Switch root */
export function setSwitchContext(ctx: SwitchContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get switch context — called by SwitchThumb */
export function getSwitchContext(): SwitchContext {
	return getContext<SwitchContext>(CTX_KEY);
}
