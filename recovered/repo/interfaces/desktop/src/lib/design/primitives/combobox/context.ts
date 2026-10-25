/**
 * @file Combobox Primitive Context
 * @description Svelte context for compound combobox coordination.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:combobox");

/** Combobox context shape */
export type ComboboxContext = {
	readonly open: boolean;
	readonly value: string;
};

/** Set combobox context — called by Combobox root */
export function setComboboxContext(ctx: ComboboxContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get combobox context — called by Combobox sub-components */
export function getComboboxContext(): ComboboxContext {
	return getContext<ComboboxContext>(CTX_KEY);
}
