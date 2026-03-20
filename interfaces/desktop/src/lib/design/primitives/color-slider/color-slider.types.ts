import type { Orientation } from "../../_internal/utils/kbd.js";

export type ColorChannel = "hue" | "saturation" | "lightness" | "alpha" | "red" | "green" | "blue";

export interface UseColorSliderProps {
	/** Which color channel this slider controls. Default: "hue". */
	channel?: ColorChannel;
	/** Current channel value. Default: 0. */
	value?: number;
	/** Callback when value changes. */
	onValueChange?: (value: number) => void;
	/** Minimum value. Default: 0. */
	min?: number;
	/** Maximum value. Default: channel-dependent (360 for hue, 100 for saturation/lightness, 255 for rgb, 1 for alpha). */
	max?: number;
	/** Step increment. Default: 1. */
	step?: number;
	/** Orientation. Default: "horizontal". */
	orientation?: Orientation;
	/** Whether the slider is disabled. */
	disabled?: boolean;
	/** Accessible label. Defaults to channel name. */
	"aria-label"?: string;
}

export interface UseColorSliderReturn {
	/** Current channel value. */
	readonly value: number;
	/** Percentage of value within [min, max]. */
	readonly percent: number;
	/** Spread onto the root container. */
	readonly root: Record<string, unknown>;
	/** Spread onto the track element. */
	readonly track: Record<string, unknown>;
	/** Spread onto the thumb element. */
	readonly thumb: Record<string, unknown>;
	/** Spread onto the label element. */
	readonly label: Record<string, unknown>;
	/** Set value programmatically. */
	setValue(value: number): void;
}
