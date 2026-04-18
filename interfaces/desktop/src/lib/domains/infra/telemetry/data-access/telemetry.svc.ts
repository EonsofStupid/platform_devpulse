/**
 * @file Telemetry Service — Tauri IPC wrappers.
 * @module @devpulse/domains/infra/telemetry/data-access/telemetry
 *
 * Thin wrappers over specta-generated `commands.*` calls.
 * Each function throws on error — callers decide how to handle.
 */

import { commands } from "$lib/sys/generated/bindings.js";
import { logError, logInfo } from "$lib/sys/logger.js";
import type { LaneBaselineRow, LaneTraceConfig, SpanTraceRow } from "../util/telemetry.types.js";

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
