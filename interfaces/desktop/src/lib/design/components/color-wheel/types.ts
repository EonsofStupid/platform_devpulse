/**
 * @file ColorWheel Component Types
 * @kind color-wheel
 * @layer components
 *
 * Circular hue picker. User drags a thumb around a ring to select hue 0-360.
 * Compound: Root, Track (the ring), Thumb.
 */

import type { Snippet } from "svelte";
import type { HTMLAttributes } from "svelte/elements";
import type { ComponentProps } from "$lib/design/components/_base/types.js";
import type { ColorValue } from "$lib/design/components/color-area/types.js";

export type ColorWheelPreset = "default" | "stark" | "glass" | "flat" | "matte";

export interface ColorWheelChangeDetails {
	value: ColorValue;
	hue: number;
}

export interface ColorWheelIds {
	root?: string;
	track?: string;
	thumb?: string;
}

export interface ColorWheelRootProps
	extends Omit<HTMLAttributes<HTMLDivElement>, "style" | "children" | "class" | "dir">,
		ComponentProps {
	ids?: Partial<ColorWheelIds>;
	/** Controlled color value. */
	value?: ColorValue;
	/** Initial value when uncontrolled. Default: "hsl(0, 100%, 50%)". */
	defaultValue?: ColorValue;
	/** Callback as the user drags. */
	onChange?: (details: ColorWheelChangeDetails) => void;
	/** Callback when the user stops dragging. */
	onChangeEnd?: (details: ColorWheelChangeDetails) => void;
	/** Whether the wheel is disabled. */
	isDisabled?: boolean;
	/** Diameter in pixels. Default: 192. */
	size?: number;
	/** Input name for form submission. */
	name?: string;
	/** Form element ID. */
	form?: string;
	/** Text/writing direction. */
	dir?: "ltr" | "rtl";
	/** Style preset. Default: "default". */
	preset?: ColorWheelPreset;
	children?: Snippet;
}

interface ColorWheelSlotProps
	extends Omit<HTMLAttributes<HTMLElement>, "style" | "children" | "class"> {
	children?: Snippet;
	class?: string;
}

export interface ColorWheelTrackProps extends ColorWheelSlotProps {}
export interface ColorWheelThumbProps extends ColorWheelSlotProps {}
