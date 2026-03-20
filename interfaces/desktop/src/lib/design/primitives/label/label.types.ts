export interface UseLabelProps {
	/** The ID of the form control this label is associated with. */
	htmlFor?: string;
	/** Whether the associated control is disabled. */
	disabled?: boolean;
}

export interface UseLabelReturn {
	readonly root: Record<string, unknown>;
}
