import type { ColdLightDataAttrs } from "../../_internal/types/common.js";
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

export interface SliderRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	"data-orientation": Orientation;
	"data-disabled": "" | undefined;
}

export interface SliderTrackAttrs extends ColdLightDataAttrs {
	"data-slot": "track";
	id: string;
	"data-orientation": Orientation;
	"data-disabled": "" | undefined;
}

export interface SliderThumbAttrs extends ColdLightDataAttrs {
	"data-slot": "thumb";
	id: string;
	role: "slider";
	tabindex: 0 | -1;
	"aria-valuenow": number;
	"aria-valuemin": number;
	"aria-valuemax": number;
	"aria-valuetext": string | undefined;
	"aria-orientation": Orientation;
	"aria-disabled": string;
	"aria-label": string | undefined;
	"aria-labelledby": string | undefined;
	"data-disabled": "" | undefined;
	style: string;
	onkeydown: (e: KeyboardEvent) => void;
	onpointerdown: (e: PointerEvent) => void;
}

export interface SliderLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
	id: string;
	"data-disabled": "" | undefined;
}

export interface SliderOutputAttrs extends ColdLightDataAttrs {
	"data-slot": "output";
	id: string;
	for: string;
	"aria-live": "off";
}

export interface UseSliderReturn {
	/** Current value. */
	readonly value: number;
	/** Percentage of value within [min, max]. */
	readonly percent: number;
	/** Spread onto the root container. */
	readonly root: SliderRootAttrs;
	/** Spread onto the track element. */
	readonly track: SliderTrackAttrs;
	/** Spread onto the thumb element. */
	readonly thumb: SliderThumbAttrs;
	/** Spread onto the label element. */
	readonly label: SliderLabelAttrs;
	/** Spread onto the output element. */
	readonly output: SliderOutputAttrs;
	/** Set value programmatically. */
	setValue(value: number): void;
}
