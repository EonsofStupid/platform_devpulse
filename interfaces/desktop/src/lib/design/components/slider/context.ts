/**
 * @file Slider Context
 * @kind slider
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { UseSliderReturn } from "$lib/design/primitives/slider/slider.types.js";

export interface SliderContext {
	readonly hook: UseSliderReturn;
}

const SLIDER_CTX = Symbol("coldlight-slider");

export function setSliderContext(ctx: SliderContext): void {
	setContext(SLIDER_CTX, ctx);
}

export function getSliderContext(): SliderContext {
	return getContext<SliderContext>(SLIDER_CTX);
}
