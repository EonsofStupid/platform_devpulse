/**
 * @file Color utilities for ColorArea
 * @kind color-area
 * @layer components
 *
 * Channel ranges per color space + value serialization.
 * oklch is the ColdLight default (matches SD5 pipeline output).
 */

import type { ColorChannel, ColorSpace } from "./types.js";

/** Min/max range for a channel. */
export interface ChannelRange {
	min: number;
	max: number;
	step: number;
}

/** Channel ranges per color space. */
const CHANNEL_RANGES: Record<ColorSpace, Partial<Record<ColorChannel, ChannelRange>>> = {
	oklch: {
		lightness: { min: 0, max: 1, step: 0.01 },
		chroma: { min: 0, max: 0.4, step: 0.005 },
		hue: { min: 0, max: 360, step: 1 },
		alpha: { min: 0, max: 1, step: 0.01 },
	},
	hsl: {
		hue: { min: 0, max: 360, step: 1 },
		saturation: { min: 0, max: 100, step: 1 },
		lightness: { min: 0, max: 100, step: 1 },
		alpha: { min: 0, max: 1, step: 0.01 },
	},
	hsb: {
		hue: { min: 0, max: 360, step: 1 },
		saturation: { min: 0, max: 100, step: 1 },
		brightness: { min: 0, max: 100, step: 1 },
		alpha: { min: 0, max: 1, step: 0.01 },
	},
	rgb: {
		red: { min: 0, max: 255, step: 1 },
		green: { min: 0, max: 255, step: 1 },
		blue: { min: 0, max: 255, step: 1 },
		alpha: { min: 0, max: 1, step: 0.01 },
	},
};

export function getChannelRange(space: ColorSpace, channel: ColorChannel): ChannelRange {
	return CHANNEL_RANGES[space]?.[channel] ?? { min: 0, max: 1, step: 0.01 };
}

/** Convert a 0-1 percent to the actual channel value. */
export function percentToValue(percent: number, range: ChannelRange): number {
	return range.min + percent * (range.max - range.min);
}

/** Convert an actual channel value to 0-1 percent. */
export function valueToPercent(value: number, range: ChannelRange): number {
	if (range.max === range.min) return 0;
	return (value - range.min) / (range.max - range.min);
}

/** Round a value to the channel's step precision. */
export function roundToStep(value: number, step: number): number {
	return Math.round(value / step) * step;
}

/** Build a valid color string from channel values. */
export function buildColorString(
	space: ColorSpace,
	xChannel: ColorChannel,
	xValue: number,
	yChannel: ColorChannel,
	yValue: number,
): string {
	const xRounded = roundToStep(xValue, getChannelRange(space, xChannel).step);
	const yRounded = roundToStep(yValue, getChannelRange(space, yChannel).step);

	// For a 2-channel picker, we output the two channels.
	// The third channel is not controlled by this area.
	switch (space) {
		case "oklch":
			return `oklch(${xChannel === "lightness" ? xRounded : yRounded} ${xChannel === "chroma" ? xRounded : yRounded} 0)`;
		case "hsl":
			return `hsl(0 ${xChannel === "saturation" ? xRounded : yRounded}% ${xChannel === "lightness" ? xRounded : yRounded}%)`;
		case "hsb":
			return `hsb(0 ${xChannel === "saturation" ? xRounded : yRounded}% ${xChannel === "brightness" ? xRounded : yRounded}%)`;
		case "rgb":
			return `rgb(${xRounded} ${yRounded} 0)`;
		default:
			return `${space}(${xRounded} ${yRounded})`;
	}
}
