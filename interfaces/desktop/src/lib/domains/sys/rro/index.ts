/**
 * @module @devpulse/domains/sys/rro
 *
 * Public API for the RRO devtool domain. Routes and other domains MUST
 * import from this file only — never reach into `util/`, `data-access/`,
 * `feature/`, or `ui/` directly.
 *
 * Layout (Nx library-types per docs/platform/Desktop.md §1.1.1):
 *   util/         — pure types, formatters, constants, narrations, capabilities
 *   data-access/  — rune state + Tauri IPC services + tracer
 *   feature/      — smart orchestrating components (RroDevtool + panels)
 *   ui/           — dumb presentational components (StatusRow, MetricCard…)
 *
 * Dependency direction (enforced by the Nx rules in Desktop.md):
 *
 *       feature ──► ui
 *          │         │
 *          ▼         ▼
 *     data-access ──► util
 *          │          ▲
 *          └──────────┘
 */

// ── State + services (for other domains + tests) ───────────
export { rroState } from "./data-access/rro.state.svelte.js";
export { isRroDebug, setRroDebug, shouldTrace, trace } from "./data-access/rro.trace.js";
// ── Top-level feature (this is what routes mount) ──────────
export { default as RroDevtool } from "./feature/RroDevtool.svelte";

// ── Capability manifest (for sidebar / command-palette integrations) ──
export {
	type Capability,
	type CapabilityBackend,
	getCapability,
	RRO_CAPABILITIES,
} from "./util/rro.capabilities.js";

// ── Formatters ──────────────────────────────────────────────
export {
	bucketBgClass,
	describeError,
	formatBytes,
	formatField,
	formatLatencyUs,
	formatMs,
	formatScore,
	scoreBucket,
	scoreBuckets,
	scoreVariant,
} from "./util/rro.format.js";
// ── Narrations (for cross-domain surfaces like the dashboard or chat) ──
export {
	BRAIN_NARRATION,
	KNOWLEDGE_TABLES,
	type Narration,
	pickLayman,
	RRO_DEPTH_NARRATIONS,
	RRO_STATE_NARRATIONS,
} from "./util/rro.narrations.js";
// ── Presets (for wizard / first-run flows that want to pre-seed config) ──
export { getPreset, type PresetDefinition, RRO_PRESETS } from "./util/rro.presets.js";
// ── Types (re-exports keep the specta bindings behind our own barrel) ──
export type {
	BackendState,
	CollectionInfo,
	GraphHealthAll,
	GraphNamespace,
	GraphNamespaceStats,
	GraphPingResult,
	GraphTableInfo,
	PresetName,
	RetrievalConfig,
	RetrievalParamMeta,
	RroDepth,
	RroState,
	RroStateSnapshot,
	RroStateTransition,
	RroTabId,
	ScoreBucket,
	SlotInfo,
	VectorHealthReport,
	VectorSearchResult,
} from "./util/rro.types.js";
