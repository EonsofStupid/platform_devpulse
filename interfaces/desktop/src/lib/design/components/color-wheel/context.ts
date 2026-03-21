/**
 * @file ColorWheel Context
 * @kind color-wheel
 * @layer components
 */

import { getContext, setContext } from "svelte";

export interface ColorWheelContext {
	readonly hue: number;
	readonly isDisabled: boolean;
	readonly isDragging: boolean;
	readonly size: number;
	readonly dir: "ltr" | "rtl";
	readonly classes: Record<string, string>;
	readonly ids: { root: string; track: string; thumb: string };
	readonly trackAction: (node: HTMLElement) => { destroy: () => void };
	readonly thumbAction: (node: HTMLElement) => { destroy: () => void };
}

const COLOR_WHEEL_CTX = Symbol("coldlight-color-wheel");

export function setColorWheelContext(ctx: ColorWheelContext): void {
	setContext(COLOR_WHEEL_CTX, ctx);
}

export function getColorWheelContext(): ColorWheelContext {
	return getContext<ColorWheelContext>(COLOR_WHEEL_CTX);
}
