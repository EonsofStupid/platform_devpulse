/**
 * @file Slider Context — Svelte context for compound component communication
 * @kind slider
 * @layer components
 *
 * Symbol-keyed context + typed get/set helpers.
 */

import { getContext, setContext } from "svelte";
import type { SliderTransport } from "$lib/design/api/dsadapters/meltui/_internal/slider/index.js";

const SLIDER_CTX = Symbol("coldlight-slider");

export function setSliderContext(transport: SliderTransport): void {
	setContext(SLIDER_CTX, transport);
}

export function getSliderContext(): SliderTransport {
	return getContext<SliderTransport>(SLIDER_CTX);
}
