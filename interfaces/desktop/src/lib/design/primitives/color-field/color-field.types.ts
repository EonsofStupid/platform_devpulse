import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

export interface UseColorFieldProps {
	/** Current color value (hex string). Default: "#000000". */
	value?: string;
	/** Callback when color value changes. */
	onValueChange?: (value: string) => void;
	/** Whether the field is disabled. */
	disabled?: boolean;
	/** Whether the field is read-only. */
	readOnly?: boolean;
	/** Accessible label. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
	/** Placeholder text. Default: "#000000". */
	placeholder?: string;
}

export interface ColorFieldRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	"data-disabled": "" | undefined;
	"data-invalid": "" | undefined;
}

export interface ColorFieldInputAttrs extends ColdLightDataAttrs {
	"data-slot": "input";
	id: string;
	type: "text";
	value: string;
	placeholder: string;
	disabled: boolean | undefined;
	readonly: boolean | undefined;
	"aria-label": string | undefined;
	"aria-labelledby": string | undefined;
	"aria-invalid": boolean | undefined;
	"aria-disabled": boolean | undefined;
	"data-disabled": "" | undefined;
	oninput: (e: Event) => void;
}

export interface ColorFieldLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
	id: string;
	for: string;
	"data-disabled": "" | undefined;
}

export interface ColorFieldSwatchAttrs extends ColdLightDataAttrs {
	"data-slot": "swatch";
	id: string;
	"aria-hidden": "true";
	"data-valid": "" | undefined;
	style: string | undefined;
}

export interface UseColorFieldReturn {
	/** Current color value. */
	readonly value: string;
	/** Whether the current value is a valid hex color. */
	readonly isValid: boolean;
	/** Spread onto the root container. */
	readonly root: ColorFieldRootAttrs;
	/** Spread onto the text input element. */
	readonly input: ColorFieldInputAttrs;
	/** Spread onto the label element. */
	readonly label: ColorFieldLabelAttrs;
	/** Spread onto the color swatch preview element. */
	readonly swatch: ColorFieldSwatchAttrs;
	/** Set value programmatically. */
	setValue(value: string): void;
}
