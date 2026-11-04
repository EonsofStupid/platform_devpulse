/**
 * @file Telemetry Service — Tauri IPC wrappers.
 * @module @devpulse/domains/infra/telemetry/data-access/telemetry
 *
 * Thin wrappers over specta-generated `commands.*` calls.
 * Each function throws on error — callers decide how to handle.
 */

import { commands } from "#lib/sys/generated/bindings.js";
import { logError, logInfo } from "#lib/sys/logger.js";
import type {
	LaneBaselineRow,
	LaneTraceConfig,
	SpanTraceRow,
	TelemetryPipelineInfo,
	TelemetryRowCounts,
	TelemetrySessionFile,
} from "../util/telemetry.types.js";

// ── Lane configuration ─────────────────────────────────────

/** Fetch the current lane tracing configuration. */
export async function getLaneConfig(): Promise<LaneTraceConfig> {
	logInfo("telemetry.svc", "getLaneConfig()");
	const result = await commands.getLaneConfig();
	if (result.status === "error") {
		logError("telemetry.svc", `getLaneConfig() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

/** Update the lane tracing configuration. Takes effect immediately. */
export async function setLaneConfig(config: LaneTraceConfig): Promise<void> {
	logInfo("telemetry.svc", "setLaneConfig()");
	const result = await commands.setLaneConfig(config);
	if (result.status === "error") {
		logError("telemetry.svc", `setLaneConfig() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
}

// ── Span traces ─────────────────────────────────────────────

/** Query span traces from DuckDB. */
export async function querySpanTraces(traceId?: string, limit?: number): Promise<SpanTraceRow[]> {
	logInfo("telemetry.svc", `querySpanTraces(traceId=${traceId ?? "recent"}, limit=${limit ?? 50})`);
	const result = await commands.querySpanTraces(traceId ?? null, limit ?? null);
	if (result.status === "error") {
		logError("telemetry.svc", `querySpanTraces() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	logInfo("telemetry.svc", `querySpanTraces() ok — ${result.data.length} spans`);
	return result.data;
}

// ── Lane baselines ──────────────────────────────────────────

/** Query lane trace baselines (percentile stats per lane). */
export async function queryLaneBaselines(): Promise<LaneBaselineRow[]> {
	logInfo("telemetry.svc", "queryLaneBaselines()");
	const result = await commands.queryLaneBaselines();
	if (result.status === "error") {
		logError("telemetry.svc", `queryLaneBaselines() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	logInfo("telemetry.svc", `queryLaneBaselines() ok — ${result.data.length} lanes`);
	return result.data;
}

// ── Pipeline info + management ──────────────────────────────

/** Read the live telemetry pipeline snapshot (identity, exporter state, paths). */
export async function getTelemetryInfo(): Promise<TelemetryPipelineInfo> {
	logInfo("telemetry.svc", "getTelemetryInfo()");
	const result = await commands.getTelemetryInfo();
	if (result.status === "error") {
		logError("telemetry.svc", `getTelemetryInfo() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

/** List all rotating session JSONL files on disk. Empty list before exporter installs. */
export async function listTelemetrySessions(): Promise<TelemetrySessionFile[]> {
	logInfo("telemetry.svc", "listTelemetrySessions()");
	const result = await commands.listTelemetrySessions();
	if (result.status === "error") {
		logError("telemetry.svc", `listTelemetrySessions() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}

/** Open the telemetry directory in the OS file manager. */
export async function openTelemetryFolder(): Promise<void> {
	logInfo("telemetry.svc", "openTelemetryFolder()");
	const result = await commands.openTelemetryFolder();
	if (result.status === "error") {
		logError("telemetry.svc", `openTelemetryFolder() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
}

/** Row counts for each DuckDB telemetry table. Drives the overview health panel. */
export async function getTelemetryRowCounts(): Promise<TelemetryRowCounts> {
	logInfo("telemetry.svc", "getTelemetryRowCounts()");
	const result = await commands.getTelemetryRowCounts();
	if (result.status === "error") {
		logError("telemetry.svc", `getTelemetryRowCounts() FAILED: ${result.error}`);
		throw new Error(result.error);
	}
	return result.data;
}
