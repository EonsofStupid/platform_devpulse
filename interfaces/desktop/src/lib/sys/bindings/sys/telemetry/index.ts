/**
 * @file sys/bindings/sys/telemetry/index.ts
 * @description Tracing-lane config, span queries, baselines, session files.
 */

import { commands } from "$lib/sys/generated/bindings.js";

export const getLaneConfig = commands.getLaneConfig;
export const setLaneConfig = commands.setLaneConfig;
export const querySpanTraces = commands.querySpanTraces;
export const queryLaneBaselines = commands.queryLaneBaselines;
export const getTelemetryInfo = commands.getTelemetryInfo;
export const listTelemetrySessions = commands.listTelemetrySessions;
export const openTelemetryFolder = commands.openTelemetryFolder;
export const getTelemetryRowCounts = commands.getTelemetryRowCounts;

export type {
	DataScope,
	ExecutionLane,
	LaneBaselineRow,
	LaneToggle,
	LaneTraceConfig,
	SpanTraceRow,
	TelemetryPipelineInfo,
	TelemetryRowCounts,
	TelemetrySessionFile,
} from "$lib/sys/generated/bindings.js";
