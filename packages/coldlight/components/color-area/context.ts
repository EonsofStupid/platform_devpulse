/**
 * @file ColorArea Context
 * @kind color-area
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { ColorAreaIds, ColorChannel, ColorSpace, ColorValue } from "./types.js";

export interface ColorAreaContext {
	readonly value: ColorValue;
	readonly colorSpace: ColorSpace;
	readonly xChannel: ColorChannel;
	readonly yChannel: ColorChannel;
	readonly isDisabled: boolean;
	readonly isDragging: boolean;
	readonly ids: Partial<ColorAreaIds>;
	readonly dir: "ltr" | "rtl";
	readonly xPercent: number;
	readonly yPercent: number;
	/** Svelte action for keyboard on thumb. */
	readonly thumbAction: (node: HTMLElement) => { destroy: () => void };
}

const COLOR_AREA_CTX = Symbol("coldlight-color-area");

export function setColorAreaContext(ctx: ColorAreaContext): void {
	setContext(COLOR_AREA_CTX, ctx);
}

export function getColorAreaContext(): ColorAreaContext {
	return getContext<ColorAreaContext>(COLOR_AREA_CTX);
}
