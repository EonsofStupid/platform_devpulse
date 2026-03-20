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

export interface UseColorFieldReturn {
	/** Current color value. */
	readonly value: string;
	/** Whether the current value is a valid hex color. */
	readonly isValid: boolean;
	/** Spread onto the root container. */
	readonly root: Record<string, unknown>;
	/** Spread onto the text input element. */
	readonly input: Record<string, unknown>;
	/** Spread onto the label element. */
	readonly label: Record<string, unknown>;
	/** Spread onto the color swatch preview element. */
	readonly swatch: Record<string, unknown>;
	/** Set value programmatically. */
	setValue(value: string): void;
}
