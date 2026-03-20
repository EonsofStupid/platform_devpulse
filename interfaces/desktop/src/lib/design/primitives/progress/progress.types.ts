import type { HTMLAttributes } from "svelte/elements";

export interface UseProgressProps {
	value?: number | null;
	min?: number;
	max?: number;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	getValueText?: (value: number, percent: number) => string;
	announceChanges?: boolean;
}

export type ProgressRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "progress";
	"data-slot": "root";
	"data-state": "indeterminate" | "loading" | "complete";
	"data-value"?: number;
	"data-max": number;
};

export type ProgressTrackAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "progress";
	"data-slot": "track";
	"data-state": "indeterminate" | "loading" | "complete";
};

export type ProgressFillAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "progress";
	"data-slot": "fill";
	"data-state": "indeterminate" | "loading" | "complete";
};

export type ProgressLabelAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "progress";
	"data-slot": "label";
};

export interface UseProgressReturn {
	readonly value: number | null;
	readonly percent: number | null;
	readonly isIndeterminate: boolean;
	readonly isComplete: boolean;
	readonly root: ProgressRootAttrs;
	readonly track: ProgressTrackAttrs;
	readonly fill: ProgressFillAttrs;
	readonly label: ProgressLabelAttrs;
	setValue(value: number | null): void;
}
