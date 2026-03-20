import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseCheckboxProps {
	/** Whether the checkbox is checked. Default: false. */
	checked?: boolean;
	/** Callback when checked state changes. */
	onCheckedChange?: (checked: boolean) => void;
	/** Whether the checkbox is in indeterminate (mixed) state. Default: false. */
	indeterminate?: boolean;
	/** Callback when indeterminate state changes. */
	onIndeterminateChange?: (indeterminate: boolean) => void;
	/** Whether the checkbox is disabled. */
	disabled?: boolean;
	/** Whether the checkbox is required. */
	required?: boolean;
	/** Accessible label (when no visible label element). */
	"aria-label"?: string;
	/** ID of the element that labels this checkbox. */
	"aria-labelledby"?: string;
	/** ID of the element that describes this checkbox. */
	"aria-describedby"?: string;
}

export type CheckboxState = "checked" | "unchecked" | "indeterminate";

export interface CheckboxRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "checkbox";
	type: "button";
	tabindex: 0;
	"aria-checked": "true" | "false" | "mixed";
	"aria-disabled": boolean | undefined;
	"aria-required": boolean | undefined;
	"aria-label": string | undefined;
	"aria-labelledby": string | undefined;
	"aria-describedby": string | undefined;
	"data-state": CheckboxState;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface CheckboxIndicatorAttrs extends ColdLightDataAttrs {
	"data-slot": "indicator";
	id: string;
	"aria-hidden": "true";
	"data-state": CheckboxState;
}

export interface CheckboxLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
	id: string;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
}

export interface UseCheckboxReturn {
	/** Current checked state. */
	readonly checked: boolean;
	/** Current indeterminate state. */
	readonly indeterminate: boolean;
	/** Spread onto the root button element. */
	readonly root: CheckboxRootAttrs;
	/** Spread onto the indicator (icon container). */
	readonly indicator: CheckboxIndicatorAttrs;
	/** Spread onto the label text element. */
	readonly label: CheckboxLabelAttrs;
	/** Toggle checked state programmatically. */
	toggle(): void;
	/** Set to checked. */
	check(): void;
	/** Set to unchecked. */
	uncheck(): void;
}
