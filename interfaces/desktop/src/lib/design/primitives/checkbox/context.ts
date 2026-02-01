/**
 * @file Checkbox Primitive Context
 * @description Svelte context for compound checkbox coordination.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:checkbox");

/** Checkbox context shape */
export type CheckboxContext = {
	readonly checked: boolean;
	readonly indeterminate: boolean;
};

/** Set checkbox context — called by Checkbox root */
export function setCheckboxContext(ctx: CheckboxContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get checkbox context — called by CheckboxIndicator */
export function getCheckboxContext(): CheckboxContext {
	return getContext<CheckboxContext>(CTX_KEY);
}
