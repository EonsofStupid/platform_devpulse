/**
 * @file Telemetry State Rune
 * @module @devpulse/domains/infra/telemetry/data-access/telemetry
 *
 * Reactive state for the telemetry devtool. Covers the full OTel pipeline:
 * lane tracing config, pipeline info (exporter / storage / session id),
 * rotating session files, DuckDB row counts, span traces, baselines.
 *
 * All data loaded via IPC on demand — nothing mocked.
 */

import { logError, logInfo } from "#lib/sys/logger.js";
import type {
	LaneBaselineRow,
	LanePreset,
	LaneTraceConfig,
	SpanTraceRow,
	TelemetryPipelineInfo,
	TelemetryRowCounts,
	TelemetrySessionFile,
} from "../util/telemetry.types.js";
import { groupLanes } from "../util/telemetry.types.js";
import {
	getLaneConfig,
	getTelemetryInfo,
	getTelemetryRowCounts,
	listTelemetrySessions,
	openTelemetryFolder,
	queryLaneBaselines,
	querySpanTraces,
	setLaneConfig,
} from "./telemetry.svc.js";

// ── Lane preset definitions ────────────────────────────────

const STANDARD_LANES = new Set([
	"BrainInference",
	"HelperInference",
	"EscalationInference",
	"Embedding",
	"Reranking",
	"VectorRetrieval",
	"PromptAssembly",
	"ThinkingPipeline",
]);

// ── State class ─────────────────────────────────────────────

class TelemetryState {
	// ── Pipeline info (OTel service identity, exporter, storage) ──
	pipeline = $state<TelemetryPipelineInfo | null>(null);
	pipelineLoading = $state(false);
	pipelineError = $state<string | null>(null);

	// ── Lane config ─────────────────────────────────────────
	laneConfig = $state<LaneTraceConfig | null>(null);
	laneLoading = $state(false);
	laneError = $state<string | null>(null);

	// ── Session files (rotating JSONL) ──────────────────────
	sessions = $state<TelemetrySessionFile[]>([]);
	sessionsLoading = $state(false);
	sessionsError = $state<string | null>(null);

	// ── Row counts (DuckDB) ─────────────────────────────────
	rowCounts = $state<TelemetryRowCounts | null>(null);
	rowCountsLoading = $state(false);

	// ── Span traces ─────────────────────────────────────────
	spans = $state<SpanTraceRow[]>([]);
	spansLoading = $state(false);
	spansError = $state<string | null>(null);
	selectedTraceId = $state<string | null>(null);

	// ── Baselines ───────────────────────────────────────────
	baselines = $state<LaneBaselineRow[]>([]);
	baselinesLoading = $state(false);
	baselinesError = $state<string | null>(null);

	// ── Derived ─────────────────────────────────────────────

	get laneGroups() {
		return this.laneConfig ? groupLanes(this.laneConfig.lanes) : [];
	}

	get enabledLaneCount(): number {
		return this.laneConfig?.lanes.filter((l) => l.enabled).length ?? 0;
	}

	get totalLaneCount(): number {
		return this.laneConfig?.lanes.length ?? 0;
	}

	get totalSessionBytes(): number {
		return this.sessions.reduce((sum, s) => sum + Number(s.size_bytes), 0);
	}

	get currentSession(): TelemetrySessionFile | null {
		return this.sessions.find((s) => s.is_current) ?? null;
	}

	// ── Pipeline info ───────────────────────────────────────

	async loadPipeline(): Promise<void> {
		if (this.pipelineLoading) return;
		this.pipelineLoading = true;
		this.pipelineError = null;
		try {
			this.pipeline = await getTelemetryInfo();
		} catch (e) {
			this.pipelineError = e instanceof Error ? e.message : String(e);
			logError("telemetry", `loadPipeline() FAILED: ${this.pipelineError}`);
		} finally {
			this.pipelineLoading = false;
		}
	}

	// ── Lane config actions ─────────────────────────────────

	async loadLaneConfig(): Promise<void> {
		if (this.laneLoading) return;
		this.laneLoading = true;
		this.laneError = null;
		try {
			this.laneConfig = await getLaneConfig();
		} catch (e) {
			this.laneError = e instanceof Error ? e.message : String(e);
			logError("telemetry", `loadLaneConfig() FAILED: ${this.laneError}`);
		} finally {
			this.laneLoading = false;
		}
	}

	async toggleLane(laneName: string): Promise<void> {
		if (!this.laneConfig) return;
		const updated: LaneTraceConfig = {
			...this.laneConfig,
			lanes: this.laneConfig.lanes.map((l) =>
				l.lane === laneName ? { ...l, enabled: !l.enabled } : l,
			),
		};
		try {
			await setLaneConfig(updated);
			this.laneConfig = updated;
		} catch (e) {
			logError("telemetry", `toggleLane(${laneName}) FAILED: ${e}`);
		}
	}

	async applyPreset(preset: LanePreset): Promise<void> {
		if (!this.laneConfig) return;
		const updated: LaneTraceConfig = {
			...this.laneConfig,
			verbose: preset === "debug",
			lanes: this.laneConfig.lanes.map((l) => ({
				...l,
				enabled: preset === "debug" ? true : preset === "off" ? false : STANDARD_LANES.has(l.lane),
			})),
		};
		try {
			await setLaneConfig(updated);
			this.laneConfig = updated;
			logInfo("telemetry", `applyPreset(${preset}) ok`);
		} catch (e) {
			logError("telemetry", `applyPreset(${preset}) FAILED: ${e}`);
		}
	}

	async setVerbose(verbose: boolean): Promise<void> {
		if (!this.laneConfig) return;
		const updated = { ...this.laneConfig, verbose };
		try {
			await setLaneConfig(updated);
			this.laneConfig = updated;
		} catch (e) {
			logError("telemetry", `setVerbose(${verbose}) FAILED: ${e}`);
		}
	}

	async setPersist(persist: boolean): Promise<void> {
		if (!this.laneConfig) return;
		const updated = { ...this.laneConfig, persist_to_duckdb: persist };
		try {
			await setLaneConfig(updated);
			this.laneConfig = updated;
		} catch (e) {
			logError("telemetry", `setPersist(${persist}) FAILED: ${e}`);
		}
	}

	// ── Session file actions ────────────────────────────────

	async loadSessions(): Promise<void> {
		if (this.sessionsLoading) return;
		this.sessionsLoading = true;
		this.sessionsError = null;
		try {
			this.sessions = await listTelemetrySessions();
		} catch (e) {
			this.sessionsError = e instanceof Error ? e.message : String(e);
			logError("telemetry", `loadSessions() FAILED: ${this.sessionsError}`);
		} finally {
			this.sessionsLoading = false;
		}
	}

	async revealFolder(): Promise<void> {
		try {
			await openTelemetryFolder();
		} catch (e) {
			logError("telemetry", `revealFolder() FAILED: ${e}`);
		}
	}

	// ── Row counts ──────────────────────────────────────────

	async loadRowCounts(): Promise<void> {
		if (this.rowCountsLoading) return;
		this.rowCountsLoading = true;
		try {
			this.rowCounts = await getTelemetryRowCounts();
		} catch (e) {
			logError("telemetry", `loadRowCounts() FAILED: ${e}`);
		} finally {
			this.rowCountsLoading = false;
		}
	}

	// ── Span trace actions ──────────────────────────────────

	async loadSpans(traceId?: string, limit?: number): Promise<void> {
		if (this.spansLoading) return;
		this.spansLoading = true;
		this.spansError = null;
		try {
			this.spans = await querySpanTraces(traceId, limit);
			if (traceId) this.selectedTraceId = traceId;
		} catch (e) {
			this.spansError = e instanceof Error ? e.message : String(e);
			logError("telemetry", `loadSpans() FAILED: ${this.spansError}`);
		} finally {
			this.spansLoading = false;
		}
	}

	clearSpans(): void {
		this.spans = [];
		this.selectedTraceId = null;
		this.spansError = null;
	}

	// ── Baseline actions ────────────────────────────────────

	async loadBaselines(): Promise<void> {
		if (this.baselinesLoading) return;
		this.baselinesLoading = true;
		this.baselinesError = null;
		try {
			this.baselines = await queryLaneBaselines();
		} catch (e) {
			this.baselinesError = e instanceof Error ? e.message : String(e);
			logError("telemetry", `loadBaselines() FAILED: ${this.baselinesError}`);
		} finally {
			this.baselinesLoading = false;
		}
	}

	// ── Full refresh (status panel) ─────────────────────────

	async refreshStatus(): Promise<void> {
		await Promise.all([this.loadPipeline(), this.loadRowCounts(), this.loadSessions()]);
	}
}

export const telemetryState = new TelemetryState();
