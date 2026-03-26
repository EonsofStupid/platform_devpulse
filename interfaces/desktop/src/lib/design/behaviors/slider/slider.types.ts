import type { HTMLAttributes, HTMLLabelAttributes, HTMLOutputAttributes } from "svelte/elements";
import type { Orientation } from "../_internal/utils/kbd.js";

export interface UseSliderProps {
	value?: number;
	onValueChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	orientation?: Orientation;
	disabled?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	getValueText?: (value: number) => string;
}

export type SliderRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "slider";
	"data-slot": "root";
	"data-orientation": Orientation;
	"data-disabled"?: "";
};

export type SliderTrackAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "slider";
	"data-slot": "track";
	"data-orientation": Orientation;
	"data-disabled"?: "";
};

export type SliderThumbAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "slider";
	"data-slot": "thumb";
	"data-disabled"?: "";
};

export type SliderLabelAttrs = HTMLLabelAttributes & {
	"data-kind": "slider";
	"data-slot": "label";
	"data-disabled"?: "";
};

export type SliderOutputAttrs = HTMLOutputAttributes & {
	"data-kind": "slider";
	"data-slot": "output";
};

export interface UseSliderReturn {
	readonly value: number;
	readonly percent: number;
	readonly root: SliderRootAttrs;
	readonly track: SliderTrackAttrs;
	readonly thumb: SliderThumbAttrs;
	readonly label: SliderLabelAttrs;
	readonly output: SliderOutputAttrs;
	setValue(value: number): void;
}
