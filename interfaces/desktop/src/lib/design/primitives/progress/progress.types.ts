import type { ColdLightDataAttrs } from "../../_internal/types/common.js";

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

export interface ProgressRootAttrs extends ColdLightDataAttrs {
	"data-slot": "root";
	id: string;
	role: "progressbar";
	"aria-valuenow": number | undefined;
	"aria-valuemin": number;
	"aria-valuemax": number;
	"aria-valuetext": string | undefined;
	"aria-label": string | undefined;
	"aria-labelledby": string | undefined;
	"data-state": "indeterminate" | "loading" | "complete";
	"data-value": number | undefined;
	"data-max": number;
}

export interface ProgressTrackAttrs extends ColdLightDataAttrs {
	"data-slot": "track";
	id: string;
	"data-state": "indeterminate" | "loading" | "complete";
}

export interface ProgressFillAttrs extends ColdLightDataAttrs {
	"data-slot": "fill";
	id: string;
	"data-state": "indeterminate" | "loading" | "complete";
	style: string | undefined;
}

export interface ProgressLabelAttrs extends ColdLightDataAttrs {
	"data-slot": "label";
	id: string;
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
	readonly root: ProgressRootAttrs;
	/** Spread onto the track element. */
	readonly track: ProgressTrackAttrs;
	/** Spread onto the fill element. */
	readonly fill: ProgressFillAttrs;
	/** Spread onto the label element. */
	readonly label: ProgressLabelAttrs;
	/** Set value programmatically. Pass null for indeterminate. */
	setValue(value: number | null): void;
}
