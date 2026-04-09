import type { HTMLAttributes } from "svelte/elements";
import type { Orientation } from "../_internal/utils/kbd.js";

export interface UseRadioGroupProps {
	value?: string;
	onValueChange?: (value: string) => void;
	orientation?: Orientation;
	loop?: boolean;
	disabled?: boolean;
	required?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
}

export type RadioGroupRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "radio-group";
	"data-slot": "root";
	"data-orientation": Orientation;
	"data-disabled"?: "";
};

export type RadioGroupRadioAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "radio-group";
	"data-slot": "radio";
	"data-state": "checked" | "unchecked";
	"data-value": string;
	"data-disabled"?: "";
};

export type RadioGroupLabelAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "radio-group";
	"data-slot": "label";
};

export type RadioGroupDescriptionAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "radio-group";
	"data-slot": "description";
};

export interface UseRadioGroupReturn {
	readonly value: string;
	readonly root: RadioGroupRootAttrs;
	getRadio(radioValue: string, disabled?: boolean): RadioGroupRadioAttrs;
	getLabel(radioValue: string): RadioGroupLabelAttrs;
	getDescription(radioValue: string): RadioGroupDescriptionAttrs;
	setValue(value: string): void;
}
