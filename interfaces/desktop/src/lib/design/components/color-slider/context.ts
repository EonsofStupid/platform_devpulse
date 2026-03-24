/**
 * @file ColorSlider Context
 * @kind color-slider
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { ColorChannel, ColorSpace, ColorValue } from "$lib/design/components/color-area/types.js";
import type { SliderOrientation } from "./types.js";

export interface ColorSliderContext {
	readonly value: ColorValue;
	readonly channel: ColorChannel;
	readonly colorSpace: ColorSpace;
	readonly orientation: SliderOrientation;
	readonly isDisabled: boolean;
	readonly isDragging: boolean;
	readonly percent: number;
	readonly channelValue: number;
	readonly channelMin: number;
	readonly channelMax: number;
	readonly dir: "ltr" | "rtl";
	readonly ids: {
		readonly root: string;
		readonly track: string;
		readonly thumb: string;
		readonly label: string;
		readonly input: string;
	};
	readonly trackAction: (node: HTMLElement) => { destroy: () => void };
	readonly thumbAction: (node: HTMLElement) => { destroy: () => void };
}

const COLOR_SLIDER_CTX = Symbol("coldlight-color-slider");

export function setColorSliderContext(ctx: ColorSliderContext): void {
	setContext(COLOR_SLIDER_CTX, ctx);
}

export function getColorSliderContext(): ColorSliderContext {
	return getContext<ColorSliderContext>(COLOR_SLIDER_CTX);
}
