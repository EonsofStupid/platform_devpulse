/**
 * @file Slider Primitive Context
 * @description Svelte context for compound slider coordination.
 * Reactive via getter when set from Svelte component with $state.
 */

import { getContext, setContext } from "svelte";

const CTX_KEY = Symbol("coldlight:slider");

/** Slider context shape */
export type SliderContext = {
	readonly value: number[];
};

/** Set slider context — called by Slider root */
export function setSliderContext(ctx: SliderContext): void {
	setContext(CTX_KEY, ctx);
}

/** Get slider context — called by slider sub-components */
export function getSliderContext(): SliderContext {
	return getContext<SliderContext>(CTX_KEY);
}
