import type { SVGAttributes } from "svelte/elements";

export type ProgressCircleSize = "sm" | "md" | "lg" | "xl";
export type ProgressCircleState = "indeterminate" | "loading" | "complete";

export interface UseProgressCircleProps {
	/** Current value. null = indeterminate (spinner). Defaults to null. */
	value?: number | null;
	/** Minimum value. Defaults to 0. */
	min?: number;
	/** Maximum value. Defaults to 100. */
	max?: number;
	/** Visual size token. Defaults to "md". */
	size?: ProgressCircleSize;
	/** Accessible label for the progress indicator. */
	"aria-label"?: string;
	/** ID of an element that labels this indicator. */
	"aria-labelledby"?: string;
	/** Custom value text formatter. */
	getValueText?: (value: number, percent: number) => string;
}

/** SVG circle element attrs. */
export type ProgressCircleCircleAttrs = SVGAttributes<SVGCircleElement> & {
	"data-kind": "progress-circle";
	"data-slot": "track" | "fill";
};

export type ProgressCircleRootAttrs = SVGAttributes<SVGSVGElement> & {
	"data-kind": "progress-circle";
	"data-slot": "root";
	"data-size": ProgressCircleSize;
	"data-state": ProgressCircleState;
};

export interface UseProgressCircleReturn {
	readonly value: number | null;
	readonly percent: number | null;
	readonly isIndeterminate: boolean;
	readonly isComplete: boolean;
	/** Computed stroke-dashoffset for the fill arc. */
	readonly dashOffset: number;
	/** Total circumference of the fill circle. */
	readonly circumference: number;
	readonly root: ProgressCircleRootAttrs;
	readonly track: ProgressCircleCircleAttrs;
	readonly fill: ProgressCircleCircleAttrs;
	setValue(value: number | null): void;
}
