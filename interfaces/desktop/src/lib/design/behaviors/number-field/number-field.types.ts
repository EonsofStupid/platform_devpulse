import type { HTMLAttributes, HTMLButtonAttributes, HTMLInputAttributes } from "svelte/elements";

export interface UseNumberFieldProps {
	value?: number;
	onValueChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	valueText?: string;
	"aria-label"?: string;
	"aria-describedby"?: string;
}

export type NumberFieldRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "number-field";
	"data-slot": "root";
	"data-disabled"?: "";
};

export type NumberFieldInputAttrs = HTMLInputAttributes & {
	"data-kind": "number-field";
	"data-slot": "input";
	"data-disabled"?: "";
};

export type NumberFieldIncrementAttrs = HTMLButtonAttributes & {
	"data-kind": "number-field";
	"data-slot": "increment";
	"data-disabled"?: "";
};

export type NumberFieldDecrementAttrs = HTMLButtonAttributes & {
	"data-kind": "number-field";
	"data-slot": "decrement";
	"data-disabled"?: "";
};

export interface UseNumberFieldReturn {
	readonly value: number;
	readonly canIncrement: boolean;
	readonly canDecrement: boolean;
	readonly root: NumberFieldRootAttrs;
	readonly input: NumberFieldInputAttrs;
	readonly increment: NumberFieldIncrementAttrs;
	readonly decrement: NumberFieldDecrementAttrs;
	incrementValue(): void;
	decrementValue(): void;
}
