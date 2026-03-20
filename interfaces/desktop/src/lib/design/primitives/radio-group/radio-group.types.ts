import type { ColdLightDataAttrs } from "../../_internal/types/common.js";
import type { Orientation } from "../../_internal/utils/kbd.js";

export interface UseRadioGroupProps {
	/** Currently selected radio value. */
	value?: string;
	/** Callback when selected value changes. */
	onValueChange?: (value: string) => void;
	/** Orientation of the radio group. Default: "vertical". */
	orientation?: Orientation;
	/** Loop navigation from last to first. Default: true. */
	loop?: boolean;
	/** Whether the entire group is disabled. */
	disabled?: boolean;
	/** Whether a selection is required. */
	required?: boolean;
	/** Accessible label for the group. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
}

export interface RadioGroupRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "radiogroup";
	"aria-orientation": Orientation;
	"aria-label": string | undefined;
	"aria-labelledby": string | undefined;
	"aria-required": boolean | undefined;
	"aria-disabled": string | undefined;
	"data-orientation": Orientation;
	"data-disabled": "" | undefined;
}

export interface RadioGroupRadioAttrs extends ColdLightDataAttrs {
	"data-slot": "radio";
	role: "radio";
	id: string;
	tabindex: 0 | -1;
	"aria-checked": boolean;
	"aria-disabled": string | undefined;
	"aria-labelledby": string;
	"aria-describedby": string;
	"data-state": "checked" | "unchecked";
	"data-value": string;
	"data-disabled": "" | undefined;
	onclick: (e: MouseEvent) => void;
	onkeydown: (e: KeyboardEvent) => void;
}

export interface RadioGroupLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
	id: string;
	onclick: (e: MouseEvent) => void;
}

export interface RadioGroupDescriptionAttrs extends ColdLightDataAttrs {
	"data-slot": "description";
	id: string;
}

export interface UseRadioGroupReturn {
	/** Currently selected value. */
	readonly value: string;
	/** Spread onto the root container. */
	readonly root: RadioGroupRootAttrs;
	/** Get attrs for an individual radio item. */
	getRadio(radioValue: string, disabled?: boolean): RadioGroupRadioAttrs;
	/** Get label attrs for an individual radio item. */
	getLabel(radioValue: string): RadioGroupLabelAttrs;
	/** Get description attrs for an individual radio item. */
	getDescription(radioValue: string): RadioGroupDescriptionAttrs;
	/** Select a value programmatically. */
	setValue(value: string): void;
}
