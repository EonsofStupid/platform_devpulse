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

export interface UseRadioGroupReturn {
	/** Currently selected value. */
	readonly value: string;
	/** Spread onto the root container. */
	readonly root: Record<string, unknown>;
	/** Get attrs for an individual radio item. */
	getRadio(radioValue: string, disabled?: boolean): Record<string, unknown>;
	/** Get label attrs for an individual radio item. */
	getLabel(radioValue: string): Record<string, unknown>;
	/** Get description attrs for an individual radio item. */
	getDescription(radioValue: string): Record<string, unknown>;
	/** Select a value programmatically. */
	setValue(value: string): void;
}
