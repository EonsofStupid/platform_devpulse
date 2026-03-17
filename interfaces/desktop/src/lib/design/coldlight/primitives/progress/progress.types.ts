export interface UseProgressProps {
	/** Current value. Default: 0. `null` for indeterminate. */
	value?: number | null;
	/** Minimum value. Default: 0. */
	min?: number;
	/** Maximum value. Default: 100. */
	max?: number;
	/** Accessible label. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
	/** Format value for aria-valuetext. */
	getValueText?: (value: number, percent: number) => string;
	/** Announce value changes to screen readers. Default: false. */
	announceChanges?: boolean;
}

export interface UseProgressReturn {
	/** Current value (null = indeterminate). */
	readonly value: number | null;
	/** Percentage of value within [min, max]. null when indeterminate. */
	readonly percent: number | null;
	/** Whether the progress is indeterminate. */
	readonly isIndeterminate: boolean;
	/** Whether the progress is complete (value === max). */
	readonly isComplete: boolean;
	/** Spread onto the root element. */
	readonly root: Record<string, unknown>;
	/** Spread onto the track element. */
	readonly track: Record<string, unknown>;
	/** Spread onto the fill element. */
	readonly fill: Record<string, unknown>;
	/** Spread onto the label element. */
	readonly label: Record<string, unknown>;
	/** Set value programmatically. Pass null for indeterminate. */
	setValue(value: number | null): void;
}
