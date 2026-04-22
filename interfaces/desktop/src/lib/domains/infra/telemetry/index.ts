/**
 * @module @devpulse/domains/infra/telemetry
 *
 * Public API for the telemetry domain. Routes and other domains MUST import
 * from this file. Never reach into `data-access/`, `feature/`, `ui/`, or
 * `util/` directly from outside this domain.
 *
 * Layout (Nx library-types, LOCKED 2026-04-14 — see docs/platform/Desktop.md 1.1.1):
 *   util/         — pure types, formatters, helpers
 *   data-access/  — rune state + Tauri IPC services
 *   feature/      — smart/orchestrating Svelte components (added when needed)
 *   ui/           — dumb/presentational Svelte components (added when needed)
 *
 * This is the FIRST infra domain. All future `systems/infra/*` crates get a
 * matching domain here following the same Nx library-type template.
 */

// ── State ───────────────────────────────────────────────────
export { telemetryState } from "./data-access/telemetry.state.svelte.js";

// ── Services ────────────────────────────────────────────────
export {
	getLaneConfig,
	queryLaneBaselines,
	querySpanTraces,
	setLaneConfig,
} from "./data-access/telemetry.svc.js";

// ── Types ───────────────────────────────────────────────────
export type {
	ExecutionLane,
	LaneBaselineRow,
	LaneGroup,
	LanePreset,
	LaneToggle,
	LaneTraceConfig,
	SpanFilter,
	SpanTraceRow,
	SpanTreeNode,
	TelemetryTab,
} from "./util/telemetry.types.js";

// ── Formatters + helpers ────────────────────────────────────
export {
	buildSpanTree,
	formatDurationUs,
	formatRate,
	groupLanes,
	laneBlurb,
	laneCategory,
	laneLabel,
} from "./util/telemetry.types.js";
