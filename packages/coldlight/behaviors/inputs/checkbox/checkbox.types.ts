import type { HTMLAttributes, HTMLButtonAttributes } from "svelte/elements";

export type CheckboxState = "checked" | "unchecked" | "indeterminate";

export interface UseCheckboxProps {
	/** Controlled value; `undefined` leaves the state to the checkbox. */
	checked?: boolean;
	/** Starting value when uncontrolled. */
	defaultChecked?: boolean;
	onCheckedChange?: (checked: boolean) => void;
	/** Controlled indeterminate state; `undefined` leaves it to the checkbox. */
	indeterminate?: boolean;
	/** Starting indeterminate state when uncontrolled. */
	defaultIndeterminate?: boolean;
	onIndeterminateChange?: (indeterminate: boolean) => void;
	disabled?: boolean;
	required?: boolean;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	"aria-describedby"?: string;
}

export type CheckboxRootAttrs = HTMLButtonAttributes & {
	"data-kind": "checkbox";
	"data-slot": "root";
	"data-state": CheckboxState;
	"data-disabled"?: "";
};

export type CheckboxIndicatorAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "checkbox";
	"data-slot": "indicator";
	"data-state": CheckboxState;
};

export type CheckboxLabelAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "checkbox";
	"data-slot": "label";
	"data-disabled"?: "";
};

export interface UseCheckboxReturn {
	readonly checked: boolean;
	readonly indeterminate: boolean;
	readonly root: CheckboxRootAttrs;
	readonly indicator: CheckboxIndicatorAttrs;
	readonly label: CheckboxLabelAttrs;
	toggle(): void;
	check(): void;
	uncheck(): void;
}
