/**
 * @file ToggleGroup Primitive Context
 * @description Svelte context for compound toggle-group coordination.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:toggle-group");

/** ToggleGroup context shape */
export type ToggleGroupContext = {
	readonly value: string[];
};

/** Set toggle-group context — called by ToggleGroup root */
export function setToggleGroupContext(ctx: ToggleGroupContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get toggle-group context — called by ToggleGroupItem */
export function getToggleGroupContext(): ToggleGroupContext {
	return getContext<ToggleGroupContext>(CTX_KEY);
}
