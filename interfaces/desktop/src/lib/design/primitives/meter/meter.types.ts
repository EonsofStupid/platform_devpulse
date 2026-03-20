export type MeterStatus = "safe" | "caution" | "danger";

export interface UseMeterProps {
	/** Current value. Default: 0. */
	value?: number;
	/** Minimum value. Default: 0. */
	min?: number;
	/** Maximum value. Default: 100. */
	max?: number;
	/** Low threshold — values below this are "danger". */
	low?: number;
	/** High threshold — values above this are "danger". */
	high?: number;
	/** Optimum value — which end of the range is "safe". */
	optimum?: number;
	/** Accessible label. */
	"aria-label"?: string;
	/** ID of the labelling element. */
	"aria-labelledby"?: string;
	/** Format value for aria-valuetext. */
	getValueText?: (value: number, percent: number) => string;
}

export interface UseMeterReturn {
	/** Current value. */
	readonly value: number;
	/** Percentage of value within [min, max]. */
	readonly percent: number;
	/** Computed status based on low/high/optimum thresholds. */
	readonly status: MeterStatus;
	/** Spread onto the root element. */
	readonly root: Record<string, unknown>;
	/** Spread onto the track element. */
	readonly track: Record<string, unknown>;
	/** Spread onto the fill element. */
	readonly fill: Record<string, unknown>;
	/** Spread onto the label element. */
	readonly label: Record<string, unknown>;
	/** Set value programmatically. */
	setValue(value: number): void;
}
