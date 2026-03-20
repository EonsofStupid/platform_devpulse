import type { ColdLightDataAttrs } from "../../_internal/types/common.js";
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

export interface ColorSliderRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	"data-channel": ColorChannel;
	"data-orientation": Orientation;
	"data-disabled": "" | undefined;
}

export interface ColorSliderTrackAttrs extends ColdLightDataAttrs {
	"data-slot": "track";
	id: string;
	"data-channel": ColorChannel;
	"data-orientation": Orientation;
	"data-disabled": "" | undefined;
}

export interface ColorSliderThumbAttrs extends ColdLightDataAttrs {
	"data-slot": "thumb";
	id: string;
	role: "slider";
	tabindex: 0 | -1;
	"aria-valuenow": number;
	"aria-valuemin": number;
	"aria-valuemax": number;
	"aria-orientation": Orientation;
	"aria-label": string;
	"aria-disabled": string | undefined;
	"data-channel": ColorChannel;
	"data-disabled": "" | undefined;
	style: string;
	onkeydown: (e: KeyboardEvent) => void;
	onpointerdown: (e: PointerEvent) => void;
}

export interface ColorSliderLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
	id: string;
	"data-disabled": "" | undefined;
}

export interface UseColorSliderReturn {
	/** Current channel value. */
	readonly value: number;
	/** Percentage of value within [min, max]. */
	readonly percent: number;
	/** Spread onto the root container. */
	readonly root: ColorSliderRootAttrs;
	/** Spread onto the track element. */
	readonly track: ColorSliderTrackAttrs;
	/** Spread onto the thumb element. */
	readonly thumb: ColorSliderThumbAttrs;
	/** Spread onto the label element. */
	readonly label: ColorSliderLabelAttrs;
	/** Set value programmatically. */
	setValue(value: number): void;
}
