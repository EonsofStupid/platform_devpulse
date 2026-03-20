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

export interface UseCheckboxReturn {
	/** Current checked state. */
	readonly checked: boolean;
	/** Current indeterminate state. */
	readonly indeterminate: boolean;
	/** Spread onto the root button element. */
	readonly root: Record<string, unknown>;
	/** Spread onto the indicator (icon container). */
	readonly indicator: Record<string, unknown>;
	/** Spread onto the label text element. */
	readonly label: Record<string, unknown>;
	/** Toggle checked state programmatically. */
	toggle(): void;
	/** Set to checked. */
	check(): void;
	/** Set to unchecked. */
	uncheck(): void;
}
