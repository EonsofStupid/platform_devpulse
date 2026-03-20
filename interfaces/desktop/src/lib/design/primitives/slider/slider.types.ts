import type { Orientation } from "../../_internal/utils/kbd.js";

export interface UseSliderProps {
	/** Current value. Default: 0. */
	value?: number;
	/** Callback when value changes. */
	onValueChange?: (value: number) => void;
	/** Minimum value. Default: 0. */
	min?: number;
	/** Maximum value. Default: 100. */
	max?: number;
	/** Step increment. Default: 1. */
	step?: number;
	/** Orientation. Default: "horizontal". */
	orientation?: Orientation;
	/** Whether the slider is disabled. */
	disabled?: boolean;
	/** Accessible label text. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
	/** Format the value for aria-valuetext. */
	getValueText?: (value: number) => string;
}

export interface UseSliderReturn {
	/** Current value. */
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
	/** Spread onto the output element. */
	readonly output: Record<string, unknown>;
	/** Set value programmatically. */
	setValue(value: number): void;
}
