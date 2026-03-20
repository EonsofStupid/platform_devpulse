import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseNumberFieldProps {
	value?: number;
	onValueChange?: (value: number) => void;
	min?: number;
	max?: number;
	step?: number;
	disabled?: boolean;
	readonly?: boolean;
	required?: boolean;
	/** Human-readable value text (e.g., "$50.00" for aria-valuetext). */
	valueText?: string;
	"aria-label"?: string;
	"aria-describedby"?: string;
}

export interface NumberFieldRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "group";
	"aria-label": string | undefined;
	"data-disabled": "" | undefined;
}

export interface NumberFieldInputAttrs extends ColdLightDataAttrs {
	"data-slot": "input";
	id: string;
	role: "spinbutton";
	type: "text";
	inputmode: "numeric";
	value: number;
	"aria-valuenow": number;
	"aria-valuemin": number | undefined;
	"aria-valuemax": number | undefined;
	"aria-valuetext": string | undefined;
	"aria-disabled": string | undefined;
	"aria-readonly": boolean | undefined;
	"aria-required": boolean | undefined;
	"aria-describedby": string | undefined;
	disabled: boolean | undefined;
	readonly: boolean | undefined;
	"data-disabled": "" | undefined;
	oninput: (e: Event) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface NumberFieldIncrementAttrs extends ColdLightDataAttrs {
	"data-slot": "increment";
	id: string;
	type: "button";
	tabindex: -1;
	"aria-label": string;
	"aria-disabled": string | undefined;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
}

export interface NumberFieldDecrementAttrs extends ColdLightDataAttrs {
	"data-slot": "decrement";
	id: string;
	type: "button";
	tabindex: -1;
	"aria-label": string;
	"aria-disabled": string | undefined;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
}

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
