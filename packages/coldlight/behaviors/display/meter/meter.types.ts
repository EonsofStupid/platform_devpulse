import type { HTMLAttributes } from "svelte/elements";

export type MeterStatus = "safe" | "caution" | "danger";

export interface UseMeterProps {
	value?: number;
	min?: number;
	max?: number;
	low?: number;
	high?: number;
	optimum?: number;
	"aria-label"?: string;
	"aria-labelledby"?: string;
	getValueText?: (value: number, percent: number) => string;
}

export type MeterRootAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "meter";
	"data-slot": "root";
	"data-state": MeterStatus;
	"data-value": number;
	"data-max": number;
};

export type MeterTrackAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "meter";
	"data-slot": "track";
	"data-state": MeterStatus;
};

export type MeterFillAttrs = HTMLAttributes<HTMLDivElement> & {
	"data-kind": "meter";
	"data-slot": "fill";
	"data-state": MeterStatus;
};

export type MeterLabelAttrs = HTMLAttributes<HTMLSpanElement> & {
	"data-kind": "meter";
	"data-slot": "label";
};

export interface UseMeterReturn {
	readonly value: number;
	readonly percent: number;
	readonly status: MeterStatus;
	readonly root: MeterRootAttrs;
	readonly track: MeterTrackAttrs;
	readonly fill: MeterFillAttrs;
	readonly label: MeterLabelAttrs;
	setValue(value: number): void;
}
