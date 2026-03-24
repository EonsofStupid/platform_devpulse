/**
 * @file ColorSwatchPicker Context
 * @kind color-swatch-picker
 * @layer components
 */

import { getContext, setContext } from "svelte";
import type { ColorValue } from "$lib/design/components/color-area/types.js";
import type { ColorSwatchRounding, ColorSwatchSize } from "$lib/design/components/color-swatch/types.js";

export interface ColorSwatchPickerContext {
	readonly selectedValue: ColorValue | undefined;
	readonly size: ColorSwatchSize;
	readonly rounding: ColorSwatchRounding;
	readonly isDisabled: boolean;
	select(color: ColorValue): void;
	isSelected(color: ColorValue): boolean;
}

const COLOR_SWATCH_PICKER_CTX = Symbol("coldlight-color-swatch-picker");

export function setColorSwatchPickerContext(ctx: ColorSwatchPickerContext): void {
	setContext(COLOR_SWATCH_PICKER_CTX, ctx);
}

export function getColorSwatchPickerContext(): ColorSwatchPickerContext {
	return getContext<ColorSwatchPickerContext>(COLOR_SWATCH_PICKER_CTX);
}
