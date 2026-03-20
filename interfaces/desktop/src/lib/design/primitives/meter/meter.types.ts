import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

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

export interface MeterRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "meter";
	"aria-valuenow": number;
	"aria-valuemin": number;
	"aria-valuemax": number;
	"aria-valuetext": string | undefined;
	"aria-label": string | undefined;
	"aria-labelledby": string | undefined;
	"data-state": MeterStatus;
	"data-value": number;
	"data-max": number;
}

export interface MeterTrackAttrs extends ColdLightDataAttrs {
	"data-slot": "track";
	id: string;
	"data-state": MeterStatus;
}

export interface MeterFillAttrs extends ColdLightDataAttrs {
	"data-slot": "fill";
	id: string;
	"data-state": MeterStatus;
	style: string;
}

export interface MeterLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
	id: string;
}

export interface UseMeterReturn {
	/** Current value. */
	readonly value: number;
	/** Percentage of value within [min, max]. */
	readonly percent: number;
	/** Computed status based on low/high/optimum thresholds. */
	readonly status: MeterStatus;
	/** Spread onto the root element. */
	readonly root: MeterRootAttrs;
	/** Spread onto the track element. */
	readonly track: MeterTrackAttrs;
	/** Spread onto the fill element. */
	readonly fill: MeterFillAttrs;
	/** Spread onto the label element. */
	readonly label: MeterLabelAttrs;
	/** Set value programmatically. */
	setValue(value: number): void;
}
