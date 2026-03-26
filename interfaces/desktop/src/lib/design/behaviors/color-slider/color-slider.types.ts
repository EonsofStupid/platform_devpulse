import type { HTMLAttributes, HTMLLabelAttributes } from "svelte/elements";
import type { Orientation } from "../_internal/utils/kbd.js";

export type ColorChannel = "hue" | "saturation" | "lightness" | "alpha" | "red" | "green" | "blue";

export interface UseColorSliderProps {
	channel?: ColorChannel;
	value?: number;
	onValueChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	orientation?: Orientation;
	disabled?: boolean;
	"aria-label"?: string;
}

export type ColorSliderRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "color-slider";
	"data-slot": "root";
	"data-channel": ColorChannel;
	"data-orientation": Orientation;
	"data-disabled"?: "";
};

export type ColorSliderTrackAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "color-slider";
	"data-slot": "track";
	"data-channel": ColorChannel;
	"data-orientation": Orientation;
	"data-disabled"?: "";
};

export type ColorSliderThumbAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "color-slider";
	"data-slot": "thumb";
	"data-channel": ColorChannel;
	"data-disabled"?: "";
};

export type ColorSliderLabelAttrs = HTMLLabelAttributes & {
	"data-kind": "color-slider";
	"data-slot": "label";
	"data-disabled"?: "";
};

export interface UseColorSliderReturn {
	readonly value: number;
	readonly percent: number;
	readonly root: ColorSliderRootAttrs;
	readonly track: ColorSliderTrackAttrs;
	readonly thumb: ColorSliderThumbAttrs;
	readonly label: ColorSliderLabelAttrs;
	setValue(value: number): void;
}
