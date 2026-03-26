import type { HTMLAttributes, HTMLInputAttributes, HTMLLabelAttributes } from "svelte/elements";

export interface UseColorFieldProps {
	value?: string;
	onValueChange?: (value: string) => void;
	disabled?: boolean;
	readOnly?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	placeholder?: string;
}

export type ColorFieldRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "color-field";
	"data-slot": "root";
	"data-disabled"?: "";
	"data-invalid"?: "";
};

export type ColorFieldInputAttrs = HTMLInputAttributes & {
	"data-kind": "color-field";
	"data-slot": "input";
	"data-disabled"?: "";
};

export type ColorFieldLabelAttrs = HTMLLabelAttributes & {
	"data-kind": "color-field";
	"data-slot": "label";
	"data-disabled"?: "";
};

export type ColorFieldSwatchAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "color-field";
	"data-slot": "swatch";
	"data-valid"?: "";
};

export interface UseColorFieldReturn {
	readonly value: string;
	readonly isValid: boolean;
	readonly root: ColorFieldRootAttrs;
	readonly input: ColorFieldInputAttrs;
	readonly label: ColorFieldLabelAttrs;
	readonly swatch: ColorFieldSwatchAttrs;
	setValue(value: string): void;
}
