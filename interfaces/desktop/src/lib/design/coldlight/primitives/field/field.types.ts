export interface UseFieldProps {
	/** Whether the field value is invalid. */
	invalid?: boolean;
	/** Whether the field is required. */
	required?: boolean;
	/** Whether the field is disabled. */
	disabled?: boolean;
	/** Error message text (used to determine if error slot should be linked). */
	error?: string;
}

export interface UseFieldReturn {
	readonly root: Record<string, unknown>;
	readonly label: Record<string, unknown>;
	readonly control: Record<string, unknown>;
	readonly description: Record<string, unknown>;
	readonly error: Record<string, unknown>;
	/** The generated control ID — use this for htmlFor on standalone labels. */
	readonly controlId: string;
}
